const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { requireAuth } = require('../middleware/auth');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Check if user has admin role
    const result = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

// Apply authentication and admin check to all routes
router.use(requireAuth);
router.use(requireAdmin);

// ============================================================================
// COMPONENT MODERATION
// ============================================================================

/**
 * GET /api/v1/marketplace/admin/components/pending
 * Get all components pending review
 */
router.get('/components/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT 
        mc.*,
        u.full_name as creator_name,
        u.email as creator_email,
        u.avatar_url as creator_avatar,
        o.name as org_name
      FROM marketplace_components mc
      LEFT JOIN users u ON mc.creator_id = u.id
      LEFT JOIN organizations o ON mc.org_id = o.id
      WHERE mc.status = 'pending'
      ORDER BY mc.created_at ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM marketplace_components WHERE status = $1',
      ['pending']
    );

    res.json({
      components: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Error fetching pending components:', error);
    res.status(500).json({ error: 'Failed to fetch pending components' });
  }
});

/**
 * GET /api/v1/marketplace/admin/components
 * Get all components with filters
 */
router.get('/components', async (req, res) => {
  try {
    const { 
      status, 
      creator_id, 
      category,
      search,
      page = 1, 
      limit = 20 
    } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        mc.*,
        u.full_name as creator_name,
        u.email as creator_email,
        u.avatar_url as creator_avatar,
        o.name as org_name
      FROM marketplace_components mc
      LEFT JOIN users u ON mc.creator_id = u.id
      LEFT JOIN organizations o ON mc.org_id = o.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND mc.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (creator_id) {
      query += ` AND mc.creator_id = $${paramCount}`;
      params.push(parseInt(creator_id));
      paramCount++;
    }

    if (category) {
      query += ` AND mc.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (search) {
      query += ` AND (mc.name ILIKE $${paramCount} OR mc.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY mc.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM marketplace_components WHERE 1=1';
    const countParams = params.slice(0, -2);
    
    if (status) countQuery += ' AND status = $1';
    if (creator_id) countQuery += ` AND creator_id = $${countParams.length}`;
    if (category) countQuery += ` AND category = $${countParams.length}`;
    if (search) countQuery += ` AND (name ILIKE $${countParams.length} OR description ILIKE $${countParams.length})`;

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      components: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

/**
 * POST /api/v1/marketplace/admin/components/:id/approve
 * Approve a component
 */
router.post('/components/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_featured = false } = req.body;

    const result = await pool.query(`
      UPDATE marketplace_components
      SET 
        status = 'published',
        is_featured = $2,
        published_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, is_featured]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // TODO: Send notification to creator
    
    res.json({ 
      component: result.rows[0],
      message: 'Component approved and published'
    });
  } catch (error) {
    console.error('Error approving component:', error);
    res.status(500).json({ error: 'Failed to approve component' });
  }
});

/**
 * POST /api/v1/marketplace/admin/components/:id/reject
 * Reject a component
 */
router.post('/components/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(`
      UPDATE marketplace_components
      SET status = 'rejected'
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // TODO: Send notification to creator with rejection reason
    
    res.json({ 
      component: result.rows[0],
      message: 'Component rejected'
    });
  } catch (error) {
    console.error('Error rejecting component:', error);
    res.status(500).json({ error: 'Failed to reject component' });
  }
});

/**
 * POST /api/v1/marketplace/admin/components/:id/unpublish
 * Unpublish a component
 */
router.post('/components/:id/unpublish', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(`
      UPDATE marketplace_components
      SET status = 'unpublished'
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // TODO: Send notification to creator
    
    res.json({ 
      component: result.rows[0],
      message: 'Component unpublished'
    });
  } catch (error) {
    console.error('Error unpublishing component:', error);
    res.status(500).json({ error: 'Failed to unpublish component' });
  }
});

/**
 * POST /api/v1/marketplace/admin/components/:id/feature
 * Toggle featured status
 */
router.post('/components/:id/feature', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;

    const result = await pool.query(`
      UPDATE marketplace_components
      SET is_featured = $2
      WHERE id = $1
      RETURNING *
    `, [id, is_featured]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.json({ 
      component: result.rows[0],
      message: is_featured ? 'Component featured' : 'Component unfeatured'
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

/**
 * DELETE /api/v1/marketplace/admin/components/:id
 * Delete a component
 */
router.delete('/components/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM marketplace_components WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
});

// ============================================================================
// REVIEW MODERATION
// ============================================================================

/**
 * GET /api/v1/marketplace/admin/reviews
 * Get all reviews with filters
 */
router.get('/reviews', async (req, res) => {
  try {
    const { 
      status, 
      component_id,
      min_rating,
      max_rating,
      page = 1, 
      limit = 20 
    } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        mr.*,
        u.full_name as user_name,
        u.email as user_email,
        mc.name as component_name
      FROM marketplace_reviews mr
      LEFT JOIN users u ON mr.user_id = u.id
      LEFT JOIN marketplace_components mc ON mr.component_id = mc.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND mr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (component_id) {
      query += ` AND mr.component_id = $${paramCount}`;
      params.push(parseInt(component_id));
      paramCount++;
    }

    if (min_rating) {
      query += ` AND mr.rating >= $${paramCount}`;
      params.push(parseInt(min_rating));
      paramCount++;
    }

    if (max_rating) {
      query += ` AND mr.rating <= $${paramCount}`;
      params.push(parseInt(max_rating));
      paramCount++;
    }

    query += ` ORDER BY mr.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    const countParams = params.slice(0, -2);
    let countQuery = 'SELECT COUNT(*) as total FROM marketplace_reviews WHERE 1=1';
    if (status) countQuery += ' AND status = $1';
    if (component_id) countQuery += ` AND component_id = $${countParams.length}`;
    if (min_rating) countQuery += ` AND rating >= $${countParams.length}`;
    if (max_rating) countQuery += ` AND rating <= $${countParams.length}`;

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      reviews: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * POST /api/v1/marketplace/admin/reviews/:id/hide
 * Hide a review
 */
router.post('/reviews/:id/hide', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE marketplace_reviews
      SET status = 'hidden'
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ 
      review: result.rows[0],
      message: 'Review hidden'
    });
  } catch (error) {
    console.error('Error hiding review:', error);
    res.status(500).json({ error: 'Failed to hide review' });
  }
});

/**
 * POST /api/v1/marketplace/admin/reviews/:id/publish
 * Publish a hidden review
 */
router.post('/reviews/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE marketplace_reviews
      SET status = 'published'
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ 
      review: result.rows[0],
      message: 'Review published'
    });
  } catch (error) {
    console.error('Error publishing review:', error);
    res.status(500).json({ error: 'Failed to publish review' });
  }
});

/**
 * DELETE /api/v1/marketplace/admin/reviews/:id
 * Delete a review
 */
router.delete('/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM marketplace_reviews WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ============================================================================
// REPORTS MANAGEMENT
// ============================================================================

/**
 * GET /api/v1/marketplace/admin/reports
 * Get all reports
 */
router.get('/reports', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT 
        mr.*,
        u.full_name as reporter_name,
        u.email as reporter_email,
        mc.name as component_name,
        mc.creator_id,
        creator.name as creator_name
      FROM marketplace_reports mr
      LEFT JOIN users u ON mr.reporter_id = u.id
      LEFT JOIN marketplace_components mc ON mr.component_id = mc.id
      LEFT JOIN users creator ON mc.creator_id = creator.id
      WHERE mr.status = $1
      ORDER BY mr.created_at DESC
      LIMIT $2 OFFSET $3
    `, [status, limit, offset]);

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM marketplace_reports WHERE status = $1',
      [status]
    );

    res.json({
      reports: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * POST /api/v1/marketplace/admin/reports/:id/resolve
 * Resolve a report
 */
router.post('/reports/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { action } = req.body; // 'unpublish', 'delete', 'dismiss'

    // Update report status
    const result = await pool.query(`
      UPDATE marketplace_reports
      SET 
        status = 'resolved',
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = $2
      WHERE id = $1
      RETURNING *
    `, [id, adminId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];

    // Take action on the component
    if (action === 'unpublish') {
      await pool.query(
        'UPDATE marketplace_components SET status = $1 WHERE id = $2',
        ['unpublished', report.component_id]
      );
    } else if (action === 'delete') {
      await pool.query(
        'DELETE FROM marketplace_components WHERE id = $1',
        [report.component_id]
      );
    }

    res.json({ 
      report: result.rows[0],
      message: `Report resolved with action: ${action}`
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

/**
 * POST /api/v1/marketplace/admin/reports/:id/dismiss
 * Dismiss a report
 */
router.post('/reports/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const result = await pool.query(`
      UPDATE marketplace_reports
      SET 
        status = 'dismissed',
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = $2
      WHERE id = $1
      RETURNING *
    `, [id, adminId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ 
      report: result.rows[0],
      message: 'Report dismissed'
    });
  } catch (error) {
    console.error('Error dismissing report:', error);
    res.status(500).json({ error: 'Failed to dismiss report' });
  }
});

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * GET /api/v1/marketplace/admin/stats
 * Get marketplace statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM marketplace_components WHERE status = 'pending') as pending_components,
        (SELECT COUNT(*) FROM marketplace_components WHERE status = 'published') as published_components,
        (SELECT COUNT(*) FROM marketplace_components WHERE status = 'rejected') as rejected_components,
        (SELECT COUNT(*) FROM marketplace_reports WHERE status = 'pending') as pending_reports,
        (SELECT COUNT(*) FROM marketplace_reviews WHERE status = 'flagged') as flagged_reviews,
        (SELECT COUNT(*) FROM marketplace_purchases) as total_purchases,
        (SELECT COUNT(*) FROM marketplace_downloads) as total_downloads,
        (SELECT COALESCE(SUM(price_paid), 0) FROM marketplace_purchases) as total_revenue,
        (SELECT COUNT(DISTINCT creator_id) FROM marketplace_components) as total_creators
    `);

    // Get top creators
    const topCreators = await pool.query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        COUNT(DISTINCT mc.id) as component_count,
        COALESCE(SUM(mp.price_paid), 0) as total_earnings,
        COUNT(DISTINCT mp.id) as purchase_count,
        COUNT(DISTINCT md.id) as download_count
      FROM users u
      LEFT JOIN marketplace_components mc ON u.id = mc.creator_id
      LEFT JOIN marketplace_purchases mp ON mc.id = mp.component_id
      LEFT JOIN marketplace_downloads md ON mc.id = md.component_id
      WHERE mc.status = 'published'
      GROUP BY u.id, u.full_name, u.email
      ORDER BY total_earnings DESC, component_count DESC
      LIMIT 10
    `);

    // Get recent activity
    const recentActivity = await pool.query(`
      SELECT 
        'component' as type,
        mc.id,
        mc.name,
        mc.status,
        mc.created_at as timestamp,
        u.full_name as user_name
      FROM marketplace_components mc
      LEFT JOIN users u ON mc.creator_id = u.id
      ORDER BY mc.created_at DESC
      LIMIT 10
    `);

    res.json({
      stats: stats.rows[0],
      topCreators: topCreators.rows,
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/v1/marketplace/admin/revenue
 * Get revenue analytics
 */
router.get('/revenue', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
    if (period === '7d') dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
    if (period === '90d') dateFilter = "created_at >= CURRENT_DATE - INTERVAL '90 days'";
    if (period === '1y') dateFilter = "created_at >= CURRENT_DATE - INTERVAL '1 year'";

    const revenue = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as purchase_count,
        SUM(price_paid) as revenue
      FROM marketplace_purchases
      WHERE ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    const topComponents = await pool.query(`
      SELECT 
        mc.id,
        mc.name,
        COUNT(mp.id) as purchase_count,
        SUM(mp.price_paid) as revenue
      FROM marketplace_components mc
      LEFT JOIN marketplace_purchases mp ON mc.id = mp.component_id
      WHERE mp.${dateFilter}
      GROUP BY mc.id, mc.name
      ORDER BY revenue DESC
      LIMIT 10
    `);

    res.json({
      dailyRevenue: revenue.rows,
      topComponents: topComponents.rows
    });
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

module.exports = router;
