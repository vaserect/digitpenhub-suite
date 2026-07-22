const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { requireAuth } = require('../middleware/auth');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// ============================================================================
// PUBLIC ROUTES - Browse marketplace
// ============================================================================

/**
 * GET /api/v1/marketplace/components
 * Browse marketplace components with advanced filters and search
 */
router.get('/components', async (req, res) => {
  try {
    const {
      category,
      categories, // Multiple categories support
      tags,
      is_free,
      min_price,
      max_price,
      min_rating,
      sort = 'popular', // popular, newest, rating, price_low, price_high, trending
      search,
      page = 1,
      limit = 24
    } = req.query;

    const offset = (page - 1) * limit;
    const hasSearch = search && search.trim();
    const searchTerm = hasSearch ? search.trim() : '';
    
    let query = `
      SELECT 
        mc.*,
        u.full_name as creator_name,
        u.avatar_url as creator_avatar,
        COUNT(DISTINCT mf.id) as favorite_count,
        ${hasSearch ? `ts_rank(
          to_tsvector('english', mc.name || ' ' || mc.description || ' ' || array_to_string(mc.tags, ' ')),
          plainto_tsquery('english', $1)
        )` : '0::float4'} as search_rank
      FROM marketplace_components mc
      LEFT JOIN users u ON mc.creator_id = u.id
      LEFT JOIN marketplace_favorites mf ON mc.id = mf.component_id
      WHERE mc.status = 'published'
    `;
    
    const params = hasSearch ? [searchTerm] : [];
    let paramCount = hasSearch ? 2 : 1;

    // Full-text search with ranking
    if (search && search.trim()) {
      query += ` AND (
        to_tsvector('english', mc.name || ' ' || mc.description || ' ' || array_to_string(mc.tags, ' '))
        @@ plainto_tsquery('english', $1)
        OR mc.name ILIKE $${paramCount}
        OR mc.description ILIKE $${paramCount}
        OR EXISTS (SELECT 1 FROM unnest(mc.tags) tag WHERE tag ILIKE $${paramCount})
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Category filter (single or multiple)
    if (categories) {
      const categoryArray = Array.isArray(categories) ? categories : categories.split(',');
      query += ` AND mc.category = ANY($${paramCount}::text[])`;
      params.push(categoryArray);
      paramCount++;
    } else if (category) {
      query += ` AND mc.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query += ` AND mc.tags && $${paramCount}::text[]`;
      params.push(tagArray);
      paramCount++;
    }

    // Free/Paid filter
    if (is_free !== undefined) {
      query += ` AND mc.is_free = $${paramCount}`;
      params.push(is_free === 'true');
      paramCount++;
    }

    // Price range filter
    if (min_price) {
      query += ` AND mc.price >= $${paramCount}`;
      params.push(parseFloat(min_price));
      paramCount++;
    }

    if (max_price) {
      query += ` AND mc.price <= $${paramCount}`;
      params.push(parseFloat(max_price));
      paramCount++;
    }

    // Rating filter
    if (min_rating) {
      query += ` AND mc.rating_average >= $${paramCount}`;
      params.push(parseFloat(min_rating));
      paramCount++;
    }

    // Group by for aggregates
    query += ` GROUP BY mc.id, u.full_name, u.avatar_url`;

    // Sorting
    switch (sort) {
      case 'newest':
        query += ` ORDER BY mc.created_at DESC`;
        break;
      case 'rating':
        query += ` ORDER BY mc.rating_average DESC NULLS LAST, mc.rating_count DESC`;
        break;
      case 'price_low':
        query += ` ORDER BY mc.price ASC`;
        break;
      case 'price_high':
        query += ` ORDER BY mc.price DESC`;
        break;
      case 'trending':
        // Trending: Recent downloads + purchases weighted by recency
        query += ` ORDER BY (mc.downloads + mc.purchases * 2) * (1.0 / (EXTRACT(EPOCH FROM (NOW() - mc.created_at)) / 86400 + 1)) DESC`;
        break;
      case 'relevance':
        if (search && search.trim()) {
          query += ` ORDER BY search_rank DESC, mc.downloads DESC`;
        } else {
          query += ` ORDER BY mc.downloads DESC, mc.purchases DESC`;
        }
        break;
      case 'popular':
      default:
        query += ` ORDER BY mc.downloads DESC, mc.purchases DESC`;
    }

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Get total count with same filters
    let countQuery = `
      SELECT COUNT(DISTINCT mc.id) as total
      FROM marketplace_components mc
      WHERE mc.status = 'published'
    `;
    const countParams = [];
    let countParamCount = 1;

    if (search && search.trim()) {
      countQuery += ` AND (
        to_tsvector('english', mc.name || ' ' || mc.description || ' ' || array_to_string(mc.tags, ' '))
        @@ plainto_tsquery('english', $1)
        OR mc.name ILIKE $${countParamCount + 1}
        OR mc.description ILIKE $${countParamCount + 1}
        OR EXISTS (SELECT 1 FROM unnest(mc.tags) tag WHERE tag ILIKE $${countParamCount + 1})
      )`;
      countParams.push(search.trim(), `%${search}%`);
      countParamCount += 2;
    }

    if (categories) {
      const categoryArray = Array.isArray(categories) ? categories : categories.split(',');
      countQuery += ` AND mc.category = ANY($${countParamCount}::text[])`;
      countParams.push(categoryArray);
      countParamCount++;
    } else if (category) {
      countQuery += ` AND mc.category = $${countParamCount}`;
      countParams.push(category);
      countParamCount++;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      countQuery += ` AND mc.tags && $${countParamCount}::text[]`;
      countParams.push(tagArray);
      countParamCount++;
    }

    if (is_free !== undefined) {
      countQuery += ` AND mc.is_free = $${countParamCount}`;
      countParams.push(is_free === 'true');
      countParamCount++;
    }

    if (min_price) {
      countQuery += ` AND mc.price >= $${countParamCount}`;
      countParams.push(parseFloat(min_price));
      countParamCount++;
    }

    if (max_price) {
      countQuery += ` AND mc.price <= $${countParamCount}`;
      countParams.push(parseFloat(max_price));
      countParamCount++;
    }

    if (min_rating) {
      countQuery += ` AND mc.rating_average >= $${countParamCount}`;
      countParams.push(parseFloat(min_rating));
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      components: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        category: category || categories,
        tags,
        is_free,
        min_price,
        max_price,
        min_rating,
        sort,
        search
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace components:', error);
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

/**
 * GET /api/v1/marketplace/components/:id
 * Get single component details
 */
router.get('/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await pool.query(`
      SELECT 
        mc.*,
        u.full_name as creator_name,
        u.avatar_url as creator_avatar,
        u.email as creator_email,
        COUNT(DISTINCT mf.id) as favorite_count,
        ${userId ? `EXISTS(SELECT 1 FROM marketplace_favorites WHERE component_id = mc.id AND user_id = $2) as is_favorited,` : ''}
        ${userId ? `EXISTS(SELECT 1 FROM marketplace_purchases WHERE component_id = mc.id AND buyer_id = $2) as is_purchased,` : ''}
        ${userId ? `EXISTS(SELECT 1 FROM marketplace_downloads WHERE component_id = mc.id AND user_id = $2) as is_downloaded` : ''}
      FROM marketplace_components mc
      LEFT JOIN users u ON mc.creator_id = u.id
      LEFT JOIN marketplace_favorites mf ON mc.id = mf.component_id
      WHERE mc.id = $1 AND mc.status = 'published'
      GROUP BY mc.id, u.full_name, u.avatar_url, u.email
    `, userId ? [id, userId] : [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Increment view count
    await pool.query(
      'UPDATE marketplace_components SET views = views + 1 WHERE id = $1',
      [id]
    );

    res.json({ component: result.rows[0] });
  } catch (error) {
    console.error('Error fetching component:', error);
    res.status(500).json({ error: 'Failed to fetch component' });
  }
});

/**
 * GET /api/v1/marketplace/components/:id/reviews
 * Get component reviews with filtering
 */
router.get('/components/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      rating, 
      verified_only = false,
      sort = 'recent' // recent, helpful, rating_high, rating_low
    } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['mr.component_id = $1', 'mr.status = $2'];
    let queryParams = [id, 'published'];
    let paramIndex = 3;

    if (rating) {
      whereConditions.push(`mr.rating = $${paramIndex}`);
      queryParams.push(parseInt(rating));
      paramIndex++;
    }

    if (verified_only === 'true') {
      whereConditions.push('mr.is_verified_purchase = true');
    }

    const whereClause = whereConditions.join(' AND ');

    // Build ORDER BY clause
    let orderBy = 'mr.created_at DESC';
    switch (sort) {
      case 'helpful':
        orderBy = 'mr.helpful_count DESC, mr.created_at DESC';
        break;
      case 'rating_high':
        orderBy = 'mr.rating DESC, mr.created_at DESC';
        break;
      case 'rating_low':
        orderBy = 'mr.rating ASC, mr.created_at DESC';
        break;
      default:
        orderBy = 'mr.created_at DESC';
    }

    const result = await pool.query(`
      SELECT 
        mr.*,
        u.full_name as user_name,
        u.avatar_url as user_avatar
      FROM marketplace_reviews mr
      LEFT JOIN users u ON mr.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset]);

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM marketplace_reviews mr WHERE ${whereClause}`,
      queryParams
    );

    // Get rating distribution
    const ratingDistribution = await pool.query(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM marketplace_reviews
      WHERE component_id = $1 AND status = 'published'
      GROUP BY rating
      ORDER BY rating DESC
    `, [id]);

    res.json({
      reviews: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total)
      },
      rating_distribution: ratingDistribution.rows
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * GET /api/v1/marketplace/featured
 * Get featured components
 */
router.get('/featured', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        mc.*,
        u.full_name as creator_name,
        u.avatar_url as creator_avatar
      FROM marketplace_components mc
      LEFT JOIN users u ON mc.creator_id = u.id
      WHERE mc.status = 'published' AND mc.is_featured = true
      ORDER BY mc.downloads DESC
      LIMIT 12
    `);

    res.json({ components: result.rows });
  } catch (error) {
    console.error('Error fetching featured components:', error);
    res.status(500).json({ error: 'Failed to fetch featured components' });
  }
});

/**
 * GET /api/v1/marketplace/search/suggestions
 * Get search suggestions/autocomplete
 */
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchTerm = q.trim();

    // Get component name suggestions
    const componentSuggestions = await pool.query(`
      SELECT DISTINCT name, category, thumbnail_url
      FROM marketplace_components
      WHERE status = 'published'
        AND name ILIKE $1
      ORDER BY downloads DESC
      LIMIT $2
    `, [`%${searchTerm}%`, Math.floor(limit / 2)]);

    // Get tag suggestions
    const tagSuggestions = await pool.query(`
      SELECT DISTINCT unnest(tags) as tag, COUNT(*) as count
      FROM marketplace_components
      WHERE status = 'published'
        AND EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE $1)
      GROUP BY tag
      ORDER BY count DESC
      LIMIT $2
    `, [`%${searchTerm}%`, Math.floor(limit / 2)]);

    // Get category suggestions
    const categorySuggestions = await pool.query(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM marketplace_components
      WHERE status = 'published'
        AND category ILIKE $1
      GROUP BY category
      ORDER BY count DESC
      LIMIT 3
    `, [`%${searchTerm}%`]);

    res.json({
      suggestions: {
        components: componentSuggestions.rows,
        tags: tagSuggestions.rows,
        categories: categorySuggestions.rows
      }
    });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

/**
 * GET /api/v1/marketplace/categories
 * Get all categories with counts
 */
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM marketplace_components
      WHERE status = 'published'
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ============================================================================
// AUTHENTICATED ROUTES - User actions
// ============================================================================

/**
 * POST /api/v1/marketplace/components
 * Create/upload a new component
 */
router.post('/components', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const orgId = req.user.org_id;
    const {
      name,
      description,
      category,
      tags,
      component_data,
      thumbnail_url,
      preview_images,
      demo_url,
      is_free,
      price,
      license
    } = req.body;

    // Validation
    if (!name || !category || !component_data) {
      return res.status(400).json({ 
        error: 'Name, category, and component_data are required' 
      });
    }

    const result = await pool.query(`
      INSERT INTO marketplace_components (
        creator_id, org_id, name, description, category, tags,
        component_data, thumbnail_url, preview_images, demo_url,
        is_free, price, license, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
      RETURNING *
    `, [
      userId, orgId, name, description, category, tags || [],
      component_data, thumbnail_url, preview_images || [], demo_url,
      is_free !== false, price || 0, license || 'MIT'
    ]);

    res.status(201).json({ 
      component: result.rows[0],
      message: 'Component submitted for review'
    });
  } catch (error) {
    console.error('Error creating component:', error);
    res.status(500).json({ error: 'Failed to create component' });
  }
});

/**
 * PUT /api/v1/marketplace/components/:id
 * Update own component
 */
router.put('/components/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Check ownership
    const checkResult = await pool.query(
      'SELECT creator_id FROM marketplace_components WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    if (checkResult.rows[0].creator_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Build update query
    const allowedFields = [
      'name', 'description', 'category', 'tags', 'component_data',
      'thumbnail_url', 'preview_images', 'demo_url', 'is_free', 'price', 'license'
    ];
    
    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const result = await pool.query(`
      UPDATE marketplace_components
      SET ${setClause.join(', ')}, status = 'pending'
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    res.json({ 
      component: result.rows[0],
      message: 'Component updated and submitted for review'
    });
  } catch (error) {
    console.error('Error updating component:', error);
    res.status(500).json({ error: 'Failed to update component' });
  }
});

/**
 * POST /api/v1/marketplace/components/:id/download
 * Download a free component
 */
router.post('/components/:id/download', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.org_id;

    // Check if component is free
    const componentResult = await pool.query(
      'SELECT is_free, component_data FROM marketplace_components WHERE id = $1 AND status = $2',
      [id, 'published']
    );

    if (componentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    if (!componentResult.rows[0].is_free) {
      return res.status(400).json({ error: 'Component is not free. Purchase required.' });
    }

    // Record download
    await pool.query(`
      INSERT INTO marketplace_downloads (component_id, user_id, org_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (component_id, user_id) DO NOTHING
    `, [id, userId, orgId]);

    // Increment download count
    await pool.query(
      'UPDATE marketplace_components SET downloads = downloads + 1 WHERE id = $1',
      [id]
    );

    res.json({ 
      component_data: componentResult.rows[0].component_data,
      message: 'Component downloaded successfully'
    });
  } catch (error) {
    console.error('Error downloading component:', error);
    res.status(500).json({ error: 'Failed to download component' });
  }
});

/**
 * POST /api/v1/marketplace/components/:id/purchase
 * Purchase a paid component
 */
router.post('/components/:id/purchase', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.org_id;
    const { payment_method, payment_id } = req.body;

    // Check if already purchased
    const existingPurchase = await pool.query(
      'SELECT id FROM marketplace_purchases WHERE component_id = $1 AND buyer_id = $2',
      [id, userId]
    );

    if (existingPurchase.rows.length > 0) {
      return res.status(400).json({ error: 'Component already purchased' });
    }

    // Get component details
    const componentResult = await pool.query(
      'SELECT price, currency, is_free, component_data FROM marketplace_components WHERE id = $1 AND status = $2',
      [id, 'published']
    );

    if (componentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const component = componentResult.rows[0];

    if (component.is_free) {
      return res.status(400).json({ error: 'Component is free. Use download endpoint.' });
    }

    // Generate license key
    const licenseKey = `MP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Record purchase
    const purchaseResult = await pool.query(`
      INSERT INTO marketplace_purchases (
        component_id, buyer_id, org_id, price_paid, currency,
        payment_method, payment_id, license_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [id, userId, orgId, component.price, component.currency, payment_method, payment_id, licenseKey]);

    // Increment purchase count
    await pool.query(
      'UPDATE marketplace_components SET purchases = purchases + 1 WHERE id = $1',
      [id]
    );

    res.json({ 
      purchase: purchaseResult.rows[0],
      component_data: component.component_data,
      message: 'Purchase successful'
    });
  } catch (error) {
    console.error('Error purchasing component:', error);
    res.status(500).json({ error: 'Failed to purchase component' });
  }
});

/**
 * POST /api/v1/marketplace/components/:id/favorite
 * Add component to favorites
 */
router.post('/components/:id/favorite', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(`
      INSERT INTO marketplace_favorites (component_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (component_id, user_id) DO NOTHING
    `, [id, userId]);

    res.json({ message: 'Added to favorites' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

/**
 * DELETE /api/v1/marketplace/components/:id/favorite
 * Remove component from favorites
 */
router.delete('/components/:id/favorite', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      'DELETE FROM marketplace_favorites WHERE component_id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

/**
 * POST /api/v1/marketplace/components/:id/reviews
 * Add a review
 */
router.post('/components/:id/reviews', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orgId = req.user.org_id;
    const { rating, title, review_text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user has purchased or downloaded
    const accessCheck = await pool.query(`
      SELECT 
        EXISTS(SELECT 1 FROM marketplace_purchases WHERE component_id = $1 AND buyer_id = $2) as purchased,
        EXISTS(SELECT 1 FROM marketplace_downloads WHERE component_id = $1 AND user_id = $2) as downloaded
    `, [id, userId]);

    const hasAccess = accessCheck.rows[0].purchased || accessCheck.rows[0].downloaded;
    const isVerifiedPurchase = accessCheck.rows[0].purchased;

    const result = await pool.query(`
      INSERT INTO marketplace_reviews (
        component_id, user_id, org_id, rating, title, review_text, is_verified_purchase
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (component_id, user_id) 
      DO UPDATE SET rating = $4, title = $5, review_text = $6, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [id, userId, orgId, rating, title, review_text, isVerifiedPurchase]);

    res.status(201).json({ review: result.rows[0] });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

/**
 * PUT /api/v1/marketplace/reviews/:reviewId
 * Update own review
 */
router.put('/reviews/:reviewId', requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, title, review_text } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await pool.query(`
      UPDATE marketplace_reviews
      SET 
        rating = COALESCE($1, rating),
        title = COALESCE($2, title),
        review_text = COALESCE($3, review_text),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `, [rating, title, review_text, reviewId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    res.json({ review: result.rows[0] });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

/**
 * DELETE /api/v1/marketplace/reviews/:reviewId
 * Delete own review
 */
router.delete('/reviews/:reviewId', requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM marketplace_reviews WHERE id = $1 AND user_id = $2 RETURNING id',
      [reviewId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

/**
 * POST /api/v1/marketplace/reviews/:reviewId/helpful
 * Mark review as helpful
 */
router.post('/reviews/:reviewId/helpful', requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    await pool.query(
      'UPDATE marketplace_reviews SET helpful_count = helpful_count + 1 WHERE id = $1',
      [reviewId]
    );

    res.json({ message: 'Marked as helpful' });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ error: 'Failed to mark as helpful' });
  }
});

/**
 * POST /api/v1/marketplace/reviews/:reviewId/report
 * Report a review
 */
router.post('/reviews/:reviewId/report', requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    // Get the component_id from the review
    const reviewResult = await pool.query(
      'SELECT component_id FROM marketplace_reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const componentId = reviewResult.rows[0].component_id;

    await pool.query(`
      INSERT INTO marketplace_reports (component_id, reporter_id, reason, description)
      VALUES ($1, $2, $3, $4)
    `, [componentId, userId, reason, description]);

    res.json({ message: 'Review reported successfully' });
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({ error: 'Failed to report review' });
  }
});

/**
 * GET /api/v1/marketplace/my-components
 * Get user's uploaded components
 */
router.get('/my-components', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        mc.*,
        COUNT(DISTINCT mp.id) as purchase_count,
        COUNT(DISTINCT md.id) as download_count,
        COALESCE(SUM(mp.price_paid), 0) as total_earnings
      FROM marketplace_components mc
      LEFT JOIN marketplace_purchases mp ON mc.id = mp.component_id
      LEFT JOIN marketplace_downloads md ON mc.id = md.component_id
      WHERE mc.creator_id = $1
      GROUP BY mc.id
      ORDER BY mc.created_at DESC
    `, [userId]);

    res.json({ components: result.rows });
  } catch (error) {
    console.error('Error fetching my components:', error);
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

/**
 * GET /api/v1/marketplace/my-purchases
 * Get user's purchased components
 */
router.get('/my-purchases', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        mp.*,
        mc.name,
        mc.description,
        mc.thumbnail_url,
        mc.component_data,
        u.full_name as creator_name
      FROM marketplace_purchases mp
      LEFT JOIN marketplace_components mc ON mp.component_id = mc.id
      LEFT JOIN users u ON mc.creator_id = u.id
      WHERE mp.buyer_id = $1
      ORDER BY mp.created_at DESC
    `, [userId]);

    res.json({ purchases: result.rows });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

/**
 * GET /api/v1/marketplace/my-favorites
 * Get user's favorite components
 */
router.get('/my-favorites', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        mc.*,
        u.full_name as creator_name,
        mf.created_at as favorited_at
      FROM marketplace_favorites mf
      LEFT JOIN marketplace_components mc ON mf.component_id = mc.id
      LEFT JOIN users u ON mc.creator_id = u.id
      WHERE mf.user_id = $1
      ORDER BY mf.created_at DESC
    `, [userId]);

    res.json({ favorites: result.rows });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

module.exports = router;