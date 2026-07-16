import express from 'express';
import pool from '../db.mjs';

const router = express.Router();

// GET /api/sections - List all sections with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, tags, search, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM page_sections WHERE is_active = true';
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
    
    query += ' ORDER BY usage_count DESC, created_at DESC';
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM page_sections WHERE is_active = true';
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
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sections' });
  }
});

// GET /api/sections/categories - Get all categories with counts
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM page_sections
      WHERE is_active = true
      GROUP BY category
      ORDER BY category
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// GET /api/sections/:id - Get specific section
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM page_sections WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching section:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch section' });
  }
});

// POST /api/sections/:id/use - Increment usage counter
router.post('/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE page_sections SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1 RETURNING usage_count',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }
    
    res.json({
      success: true,
      data: { usage_count: result.rows[0].usage_count }
    });
  } catch (error) {
    console.error('Error updating usage count:', error);
    res.status(500).json({ success: false, error: 'Failed to update usage count' });
  }
});

// GET /api/sections/popular - Get most popular sections
router.get('/popular/list', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await pool.query(
      'SELECT * FROM page_sections WHERE is_active = true ORDER BY usage_count DESC LIMIT $1',
      [parseInt(limit)]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching popular sections:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch popular sections' });
  }
});

export default router;
