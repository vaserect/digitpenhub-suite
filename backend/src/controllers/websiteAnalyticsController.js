const db = require('../db');

async function getOverview(req, res) {
  try {
    const orgId = req.user.orgId;
    const { rows } = await db.query(
      `SELECT
         COUNT(*) AS total_events,
         COUNT(*) FILTER(WHERE created_at >= NOW() - INTERVAL '24 hours') AS today,
         COUNT(*) FILTER(WHERE created_at >= NOW() - INTERVAL '7 days') AS this_week,
         COUNT(*) FILTER(WHERE created_at >= NOW() - INTERVAL '30 days') AS this_month,
         COUNT(DISTINCT user_id) AS unique_users,
         COUNT(DISTINCT user_id) FILTER(WHERE created_at >= NOW() - INTERVAL '24 hours') AS active_today
       FROM org_events WHERE org_id = $1`,
      [orgId]
    );
    res.json({ overview: rows[0] });
  } catch (err) {
    console.error('[websiteAnalyticsController.getOverview] Error:', err);
    res.status(500).json({ error: 'Failed to get analytics overview.' });
  }
}

async function getTopModules(req, res) {
  try {
    const orgId = req.user.orgId;
    const { rows } = await db.query(
      `SELECT
         properties->>'slug' AS slug,
         COUNT(*) AS opens,
         COUNT(DISTINCT user_id) AS unique_users,
         MAX(created_at) AS last_opened
       FROM org_events
       WHERE org_id = $1 AND name = 'module.open' AND properties->>'slug' IS NOT NULL
       GROUP BY properties->>'slug'
       ORDER BY opens DESC LIMIT 10`,
      [orgId]
    );
    res.json({ modules: rows });
  } catch (err) {
    console.error('[websiteAnalyticsController.getTopModules] Error:', err);
    res.status(500).json({ error: 'Failed to get top modules.' });
  }
}

async function getDailyActivity(req, res) {
  try {
    const orgId = req.user.orgId;
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const { rows } = await db.query(
      `SELECT
         date_trunc('day', created_at)::date AS day,
         COUNT(*) AS events,
         COUNT(DISTINCT user_id) AS users
       FROM org_events
       WHERE org_id = $1 AND created_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY day ORDER BY day ASC`,
      [orgId, days]
    );
    res.json({ days: rows });
  } catch (err) {
    console.error('[websiteAnalyticsController.getDailyActivity] Error:', err);
    res.status(500).json({ error: 'Failed to get daily activity.' });
  }
}

async function getRecentActivity(req, res) {
  try {
    const orgId = req.user.orgId;
    const { rows } = await db.query(
      `SELECT oe.name, oe.properties, oe.created_at, u.full_name AS user_name
       FROM org_events oe
       LEFT JOIN users u ON u.id = oe.user_id
       WHERE oe.org_id = $1
       ORDER BY oe.created_at DESC LIMIT 20`,
      [orgId]
    );
    res.json({ events: rows });
  } catch (err) {
    console.error('[websiteAnalyticsController.getRecentActivity] Error:', err);
    res.status(500).json({ error: 'Failed to get recent activity.' });
  }
}

// ---- Website-specific analytics (additions for actual page view tracking) ----

// Record a page view
async function recordPageView(req, res) {
  try {
    const { pageId, visitorHash, sessionId, referrer, userAgent } = req.body;
    const orgId = req.user.orgId;

    if (!pageId || !visitorHash) {
      return res.status(400).json({ error: 'pageId and visitorHash are required.' });
    }

    await db.query(
      `INSERT INTO page_views (org_id, page_id, visitor_hash, session_id, referrer, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orgId, pageId, visitorHash, sessionId || null, referrer || null, userAgent || null]
    );

    // Update page view count
    await db.query(
      `UPDATE pages SET view_count = view_count + 1 WHERE id = $1`,
      [pageId]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[websiteAnalyticsController.recordPageView] Error:', err);
    res.status(500).json({ error: 'Failed to record page view.' });
  }
}

// Get page-level analytics for a specific page
async function getPageAnalytics(req, res) {
  try {
    const { pageId } = req.params;
    const orgId = req.user.orgId;
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);

    const { rows } = await db.query(
      `SELECT
         COUNT(*)::int AS total_views,
         COUNT(DISTINCT visitor_hash)::int AS unique_visitors,
         COUNT(DISTINCT session_id)::int AS unique_sessions,
         MIN(created_at) AS first_view,
         MAX(created_at) AS last_view
       FROM page_views
       WHERE page_id = $1 AND org_id = $2 AND created_at >= NOW() - ($3 || ' days')::INTERVAL`,
      [pageId, orgId, days]
    );

    // Daily breakdown
    const dailyResult = await db.query(
      `SELECT
         date_trunc('day', created_at)::date AS day,
         COUNT(*)::int AS views,
         COUNT(DISTINCT visitor_hash)::int AS visitors
       FROM page_views
       WHERE page_id = $1 AND org_id = $2 AND created_at >= NOW() - ($3 || ' days')::INTERVAL
       GROUP BY day ORDER BY day ASC`,
      [pageId, orgId, days]
    );

    res.json({
      analytics: rows[0],
      daily: dailyResult.rows
    });
  } catch (err) {
    console.error('[websiteAnalyticsController.getPageAnalytics] Error:', err);
    res.status(500).json({ error: 'Failed to get page analytics.' });
  }
}

module.exports = {
  getOverview,
  getTopModules,
  getDailyActivity,
  getRecentActivity,
  recordPageView,
  getPageAnalytics
};
