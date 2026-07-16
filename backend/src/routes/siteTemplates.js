const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/site-templates - List all templates with optional filtering
router.get('/', async (req, res) => {
  const { category, tags, search, premium, limit = 20, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM site_templates WHERE is_active = true';
  const params = [];
  let paramCount = 0;
  
  if (category) {
    paramCount++;
    query += ` AND category = $${paramCount}`;
    params.push(category);
  }
  
  if (tags) {
    paramCount++;
    const tagArray = tags.split(',');
    query += ` AND tags && $${paramCount}`;
    params.push(tagArray);
  }
  
  if (search) {
    paramCount++;
    query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }
  
  if (premium !== undefined) {
    paramCount++;
    query += ` AND is_premium = $${paramCount}`;
    params.push(premium === 'true');
  }
  
  query += ' ORDER BY rating DESC, usage_count DESC, created_at DESC';
  
  paramCount++;
  query += ` LIMIT $${paramCount}`;
  params.push(parseInt(limit));
  
  paramCount++;
  query += ` OFFSET $${paramCount}`;
  params.push(parseInt(offset));
  
  const result = await pool.query(query, params);
  
  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM site_templates WHERE is_active = true';
  const countParams = [];
  let countParamCount = 0;
  
  if (category) {
    countParamCount++;
    countQuery += ` AND category = $${countParamCount}`;
    countParams.push(category);
  }
  
  if (tags) {
    countParamCount++;
    const tagArray = tags.split(',');
    countQuery += ` AND tags && $${countParamCount}`;
    countParams.push(tagArray);
  }
  
  if (search) {
    countParamCount++;
    countQuery += ` AND (name ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`;
    countParams.push(`%${search}%`);
  }
  
  if (premium !== undefined) {
    countParamCount++;
    countQuery += ` AND is_premium = $${countParamCount}`;
    countParams.push(premium === 'true');
  }
  
  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + result.rows.length < total
    }
  });
});

// GET /api/site-templates/categories - Get all categories with counts
router.get('/categories', async (req, res) => {
  const result = await pool.query(`
    SELECT category, COUNT(*) as count
    FROM site_templates
    WHERE is_active = true
    GROUP BY category
    ORDER BY category
  `);
  
  res.json({
    success: true,
    data: result.rows
  });
});

// GET /api/site-templates/free - Get all free templates
router.get('/free', async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  
  const result = await pool.query(
    'SELECT * FROM site_templates WHERE is_active = true AND is_premium = false ORDER BY rating DESC, usage_count DESC LIMIT $1 OFFSET $2',
    [parseInt(limit), parseInt(offset)]
  );
  
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM site_templates WHERE is_active = true AND is_premium = false'
  );
  const total = parseInt(countResult.rows[0].count);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + result.rows.length < total
    }
  });
});

// GET /api/site-templates/premium - Get all premium templates
router.get('/premium', async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  
  const result = await pool.query(
    'SELECT * FROM site_templates WHERE is_active = true AND is_premium = true ORDER BY rating DESC, usage_count DESC LIMIT $1 OFFSET $2',
    [parseInt(limit), parseInt(offset)]
  );
  
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM site_templates WHERE is_active = true AND is_premium = true'
  );
  const total = parseInt(countResult.rows[0].count);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + result.rows.length < total
    }
  });
});

// GET /api/site-templates/popular - Get most popular templates
router.get('/popular', async (req, res) => {
  const { limit = 10 } = req.query;
  
  const result = await pool.query(
    'SELECT * FROM site_templates WHERE is_active = true ORDER BY usage_count DESC, rating DESC LIMIT $1',
    [parseInt(limit)]
  );
  
  res.json({
    success: true,
    data: result.rows
  });
});

// GET /api/site-templates/top-rated - Get top rated templates
router.get('/top-rated', async (req, res) => {
  const { limit = 10 } = req.query;
  
  const result = await pool.query(
    'SELECT * FROM site_templates WHERE is_active = true ORDER BY rating DESC, usage_count DESC LIMIT $1',
    [parseInt(limit)]
  );
  
  res.json({
    success: true,
    data: result.rows
  });
});

// GET /api/site-templates/:id - Get specific template
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(
    'SELECT * FROM site_templates WHERE id = $1 AND is_active = true',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }
  
  res.json({
    success: true,
    data: result.rows[0]
  });
});

// POST /api/site-templates/:id/use - Increment usage counter
router.post('/:id/use', async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(
    'UPDATE site_templates SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1 RETURNING usage_count',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }
  
  res.json({
    success: true,
    data: { usage_count: result.rows[0].usage_count }
  });
});

// POST /api/site-templates/:id/rate - Rate a template
router.post('/:id/rate', async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  
  if (!rating || rating < 0 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Rating must be between 0 and 5' });
  }
  
  // For now, just update the rating directly
  // In production, you'd want to store individual ratings and calculate average
  const result = await pool.query(
    'UPDATE site_templates SET rating = $1, updated_at = NOW() WHERE id = $2 RETURNING rating',
    [rating, id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }
  
  res.json({
    success: true,
    data: { rating: result.rows[0].rating }
  });
});

module.exports = router;