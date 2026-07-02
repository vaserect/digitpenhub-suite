const db = require('../db');

async function getOverview(req, res) {
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
}

async function getTopModules(req, res) {
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
}

async function getDailyActivity(req, res) {
  const orgId = req.user.orgId;
  const days = Number(req.query.days) || 30;
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
}

async function getRecentActivity(req, res) {
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
}

module.exports = { getOverview, getTopModules, getDailyActivity, getRecentActivity };
