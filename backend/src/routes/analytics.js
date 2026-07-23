const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/analyticsController');

// ── Dashboard overview — stat cards ──────────────────────────
router.get('/overview', requireAuth, c.overview);

// ── 30-day activity bar chart ────────────────────────────────
router.get('/activity', requireAuth, c.activity);

// ── Per-module record counts ─────────────────────────────────
router.get('/modules/usage', requireAuth, c.moduleUsage);

// ── Executive command center (full KPI + trends + AI + storage) ─
router.get('/executive', requireAuth, c.executive);

// ── Month-over-month growth rates ──────────────────────────
router.get('/growth', requireAuth, c.growth);

// ── Lead conversion analytics ──────────────────────────────
router.get('/leads/conversion', requireAuth, c.leadConversion);

// ── Task completion rates ──────────────────────────────────
router.get('/tasks/completion', requireAuth, c.taskCompletion);

// ── Revenue by hour (sparkline data for today) ─────────────
router.get('/revenue/sparkline', requireAuth, c.revenueSparkline);

// ── Event tracking ───────────────────────────────────────────
router.post('/track', requireAuth, c.track);

/**
 * GET /api/v1/analytics/marketplace/overview
 * Get marketplace overview statistics
 */
router.get('/marketplace/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { time_range = '30' } = req.query; // days: 7, 30, 90, or 'all'

    // Build date filter
    let dateFilter = '';
    if (time_range !== 'all') {
      dateFilter = `AND mp.created_at >= NOW() - INTERVAL '${parseInt(time_range)} days'`;
    }

    // Get overview stats
    const overviewQuery = `
      SELECT 
        COUNT(DISTINCT mp.id) as total_sales,
        COALESCE(SUM(mp.price_paid), 0) as total_revenue,
        COUNT(DISTINCT mp.buyer_id) as unique_customers,
        COALESCE(AVG(mp.price_paid), 0) as average_order_value,
        COUNT(DISTINCT mc.id) as total_components
      FROM marketplace_components mc
      LEFT JOIN marketplace_purchases mp ON mc.id = mp.component_id 
        AND mc.creator_id = $1 
        ${dateFilter}
      WHERE mc.creator_id = $1
    `;

    const overview = await pool.query(overviewQuery, [userId]);

    // Get downloads (free components)
    const downloadsQuery = `
      SELECT COUNT(*) as total_downloads
      FROM marketplace_downloads md
      JOIN marketplace_components mc ON md.component_id = mc.id
      WHERE mc.creator_id = $1
      ${dateFilter ? dateFilter.replace('mp.created_at', 'md.downloaded_at') : ''}
    `;

    const downloads = await pool.query(downloadsQuery, [userId]);

    // Get growth comparison (previous period)
    let previousPeriodFilter = '';
    if (time_range !== 'all') {
      const days = parseInt(time_range);
      previousPeriodFilter = `
        AND mp.created_at >= NOW() - INTERVAL '${days * 2} days'
        AND mp.created_at < NOW() - INTERVAL '${days} days'
      `;
    }

    const previousQuery = `
      SELECT 
        COUNT(DISTINCT mp.id) as previous_sales,
        COALESCE(SUM(mp.price_paid), 0) as previous_revenue
      FROM marketplace_purchases mp
      JOIN marketplace_components mc ON mp.component_id = mc.id
      WHERE mc.creator_id = $1
      ${previousPeriodFilter}
    `;

    const previous = time_range !== 'all' 
      ? await pool.query(previousQuery, [userId])
      : { rows: [{ previous_sales: 0, previous_revenue: 0 }] };

    // Calculate growth percentages
    const currentSales = parseInt(overview.rows[0].total_sales);
    const previousSales = parseInt(previous.rows[0].previous_sales);
    const salesGrowth = previousSales > 0 
      ? ((currentSales - previousSales) / previousSales * 100).toFixed(1)
      : currentSales > 0 ? 100 : 0;

    const currentRevenue = parseFloat(overview.rows[0].total_revenue);
    const previousRevenue = parseFloat(previous.rows[0].previous_revenue);
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : currentRevenue > 0 ? 100 : 0;

    res.json({
      overview: {
        ...overview.rows[0],
        total_downloads: parseInt(downloads.rows[0].total_downloads),
        sales_growth: parseFloat(salesGrowth),
        revenue_growth: parseFloat(revenueGrowth)
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

/**
 * GET /api/v1/analytics/marketplace/revenue-chart
 * Get revenue over time for charts
 */
router.get('/marketplace/revenue-chart', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { time_range = '30', interval = 'day' } = req.query;

    let dateFilter = '';
    let dateGrouping = '';
    
    if (time_range !== 'all') {
      dateFilter = `AND mp.created_at >= NOW() - INTERVAL '${parseInt(time_range)} days'`;
    }

    // Determine grouping based on interval
    switch (interval) {
      case 'hour':
        dateGrouping = "DATE_TRUNC('hour', mp.created_at)";
        break;
      case 'day':
        dateGrouping = "DATE_TRUNC('day', mp.created_at)";
        break;
      case 'week':
        dateGrouping = "DATE_TRUNC('week', mp.created_at)";
        break;
      case 'month':
        dateGrouping = "DATE_TRUNC('month', mp.created_at)";
        break;
      default:
        dateGrouping = "DATE_TRUNC('day', mp.created_at)";
    }

    const query = `
      SELECT 
        ${dateGrouping} as date,
        COUNT(*) as sales_count,
        COALESCE(SUM(mp.price_paid), 0) as revenue,
        COUNT(DISTINCT mp.buyer_id) as unique_customers
      FROM marketplace_purchases mp
      JOIN marketplace_components mc ON mp.component_id = mc.id
      WHERE mc.creator_id = $1
      ${dateFilter}
      GROUP BY ${dateGrouping}
      ORDER BY date ASC
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      chart_data: result.rows.map(row => ({
        date: row.date,
        sales: parseInt(row.sales_count),
        revenue: parseFloat(row.revenue),
        customers: parseInt(row.unique_customers)
      }))
    });
  } catch (error) {
    console.error('Error fetching revenue chart:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

/**
 * GET /api/v1/analytics/marketplace/top-components
 * Get top performing components
 */
router.get('/marketplace/top-components', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { time_range = '30', limit = 10, sort_by = 'revenue' } = req.query;

    let dateFilter = '';
    if (time_range !== 'all') {
      dateFilter = `AND mp.created_at >= NOW() - INTERVAL '${parseInt(time_range)} days'`;
    }

    let orderBy = 'total_revenue DESC';
    switch (sort_by) {
      case 'sales':
        orderBy = 'total_sales DESC';
        break;
      case 'downloads':
        orderBy = 'total_downloads DESC';
        break;
      case 'views':
        orderBy = 'mc.views DESC';
        break;
      case 'rating':
        orderBy = 'mc.rating_average DESC';
        break;
      default:
        orderBy = 'total_revenue DESC';
    }

    const query = `
      SELECT 
        mc.id,
        mc.name,
        mc.category,
        mc.thumbnail_url,
        mc.is_free,
        mc.price,
        mc.rating_average,
        mc.rating_count,
        mc.views,
        COUNT(DISTINCT mp.id) as total_sales,
        COALESCE(SUM(mp.price_paid), 0) as total_revenue,
        COUNT(DISTINCT md.id) as total_downloads
      FROM marketplace_components mc
      LEFT JOIN marketplace_purchases mp ON mc.id = mp.component_id ${dateFilter}
      LEFT JOIN marketplace_downloads md ON mc.id = md.component_id ${dateFilter ? dateFilter.replace('mp.created_at', 'md.downloaded_at') : ''}
      WHERE mc.creator_id = $1
      GROUP BY mc.id
      ORDER BY ${orderBy}
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, parseInt(limit)]);

    res.json({
      top_components: result.rows.map(row => ({
        ...row,
        total_sales: parseInt(row.total_sales),
        total_revenue: parseFloat(row.total_revenue),
        total_downloads: parseInt(row.total_downloads)
      }))
    });
  } catch (error) {
    console.error('Error fetching top components:', error);
    res.status(500).json({ error: 'Failed to fetch top components' });
  }
});

/**
 * GET /api/v1/analytics/marketplace/earnings
 * Get detailed earnings breakdown
 */
router.get('/marketplace/earnings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { time_range = '30' } = req.query;

    let dateFilter = '';
    if (time_range !== 'all') {
      dateFilter = `AND mp.created_at >= NOW() - INTERVAL '${parseInt(time_range)} days'`;
    }

    // Get earnings by component
    const earningsQuery = `
      SELECT 
        mc.id,
        mc.name,
        mc.price,
        COUNT(mp.id) as sales_count,
        COALESCE(SUM(mp.price_paid), 0) as gross_revenue,
        COALESCE(SUM(mp.price_paid * 0.85), 0) as net_revenue,
        COALESCE(SUM(mp.price_paid * 0.15), 0) as platform_fee
      FROM marketplace_components mc
      LEFT JOIN marketplace_purchases mp ON mc.id = mp.component_id ${dateFilter}
      WHERE mc.creator_id = $1 AND mc.is_free = false
      GROUP BY mc.id
      ORDER BY gross_revenue DESC
    `;

    const earnings = await pool.query(earningsQuery, [userId]);

    // Get payment method breakdown
    const paymentMethodQuery = `
      SELECT 
        mp.payment_method,
        COUNT(*) as transaction_count,
        COALESCE(SUM(mp.price_paid), 0) as total_amount
      FROM marketplace_purchases mp
      JOIN marketplace_components mc ON mp.component_id = mc.id
      WHERE mc.creator_id = $1
      ${dateFilter}
      GROUP BY mp.payment_method
      ORDER BY total_amount DESC
    `;

    const paymentMethods = await pool.query(paymentMethodQuery, [userId]);

    // Calculate totals
    const totals = earnings.rows.reduce((acc, row) => ({
      gross_revenue: acc.gross_revenue + parseFloat(row.gross_revenue),
      net_revenue: acc.net_revenue + parseFloat(row.net_revenue),
      platform_fee: acc.platform_fee + parseFloat(row.platform_fee),
      total_sales: acc.total_sales + parseInt(row.sales_count)
    }), { gross_revenue: 0, net_revenue: 0, platform_fee: 0, total_sales: 0 });

    res.json({
      earnings_by_component: earnings.rows.map(row => ({
        ...row,
        sales_count: parseInt(row.sales_count),
        gross_revenue: parseFloat(row.gross_revenue),
        net_revenue: parseFloat(row.net_revenue),
        platform_fee: parseFloat(row.platform_fee)
      })),
      payment_methods: paymentMethods.rows.map(row => ({
        ...row,
        transaction_count: parseInt(row.transaction_count),
        total_amount: parseFloat(row.total_amount)
      })),
      totals
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

/**
 * GET /api/v1/analytics/marketplace/customers
 * Get customer analytics
 */
router.get('/marketplace/customers', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { time_range = '30', limit = 10 } = req.query;

    let dateFilter = '';
    if (time_range !== 'all') {
      dateFilter = `AND mp.created_at >= NOW() - INTERVAL '${parseInt(time_range)} days'`;
    }

    // Get top customers
    const customersQuery = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.avatar_url,
        COUNT(mp.id) as purchase_count,
        COALESCE(SUM(mp.price_paid), 0) as total_spent,
        MAX(mp.created_at) as last_purchase_date,
        MIN(mp.created_at) as first_purchase_date
      FROM marketplace_purchases mp
      JOIN marketplace_components mc ON mp.component_id = mc.id
      JOIN users u ON mp.buyer_id = u.id
      WHERE mc.creator_id = $1
      ${dateFilter}
      GROUP BY u.id
      ORDER BY total_spent DESC
      LIMIT $2
    `;

    const customers = await pool.query(customersQuery, [userId, parseInt(limit)]);

    // Get customer acquisition over time
    const acquisitionQuery = `
      SELECT 
        DATE_TRUNC('day', first_purchase) as date,
        COUNT(*) as new_customers
      FROM (
        SELECT 
          mp.buyer_id,
          MIN(mp.created_at) as first_purchase
        FROM marketplace_purchases mp
        JOIN marketplace_components mc ON mp.component_id = mc.id
        WHERE mc.creator_id = $1
        ${dateFilter.replace('mp.created_at', 'MIN(mp.created_at)')}
        GROUP BY mp.buyer_id
      ) first_purchases
      GROUP BY DATE_TRUNC('day', first_purchase)
      ORDER BY date ASC
    `;

    const acquisition = await pool.query(acquisitionQuery, [userId]);

    res.json({
      top_customers: customers.rows.map(row => ({
        ...row,
        purchase_count: parseInt(row.purchase_count),
        total_spent: parseFloat(row.total_spent)
      })),
      customer_acquisition: acquisition.rows.map(row => ({
        date: row.date,
        new_customers: parseInt(row.new_customers)
      }))
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
});

/**
 * GET /api/v1/analytics/marketplace/categories
 * Get performance by category
 */
router.get('/marketplace/categories', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { time_range = '30' } = req.query;

    let dateFilter = '';
    if (time_range !== 'all') {
      dateFilter = `AND mp.created_at >= NOW() - INTERVAL '${parseInt(time_range)} days'`;
    }

    const query = `
      SELECT 
        mc.category,
        COUNT(DISTINCT mc.id) as component_count,
        COUNT(DISTINCT mp.id) as total_sales,
        COALESCE(SUM(mp.price_paid), 0) as total_revenue,
        COUNT(DISTINCT md.id) as total_downloads,
        COALESCE(AVG(mc.rating_average), 0) as avg_rating
      FROM marketplace_components mc
      LEFT JOIN marketplace_purchases mp ON mc.id = mp.component_id ${dateFilter}
      LEFT JOIN marketplace_downloads md ON mc.id = md.component_id ${dateFilter ? dateFilter.replace('mp.created_at', 'md.downloaded_at') : ''}
      WHERE mc.creator_id = $1
      GROUP BY mc.category
      ORDER BY total_revenue DESC
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      categories: result.rows.map(row => ({
        ...row,
        component_count: parseInt(row.component_count),
        total_sales: parseInt(row.total_sales),
        total_revenue: parseFloat(row.total_revenue),
        total_downloads: parseInt(row.total_downloads),
        avg_rating: parseFloat(row.avg_rating)
      }))
    });
  } catch (error) {
    console.error('Error fetching category analytics:', error);
    res.status(500).json({ error: 'Failed to fetch category analytics' });
  }
});

module.exports = router;