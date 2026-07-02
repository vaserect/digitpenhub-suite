const db = require('../db');

async function getKpiSnapshot(req, res) {
  const orgId = req.user.orgId;

  const [revenue, crm, hr, helpdesk, tasks, activity] = await Promise.all([
    db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status='paid' AND created_at >= date_trunc('month', NOW()) THEN total ELSE 0 END),0) AS revenue_mtd,
         COALESCE(SUM(CASE WHEN status='paid' AND created_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
                                               AND created_at < date_trunc('month', NOW()) THEN total ELSE 0 END),0) AS revenue_prev_month,
         COUNT(*) FILTER(WHERE status='paid') AS paid_invoices,
         COUNT(*) FILTER(WHERE status='overdue') AS overdue_invoices
       FROM invoices WHERE org_id=$1`, [orgId]),
    db.query(
      `SELECT COUNT(*) AS total_contacts,
              COUNT(*) FILTER(WHERE stage='won') AS won_deals
       FROM contacts WHERE org_id=$1`, [orgId]),
    db.query(
      `SELECT COUNT(*) AS total_employees,
              COUNT(*) FILTER(WHERE status='active') AS active_employees
       FROM employees WHERE org_id=$1`, [orgId]),
    db.query(
      `SELECT COUNT(*) AS total_tickets,
              COUNT(*) FILTER(WHERE status='open') AS open_tickets,
              COUNT(*) FILTER(WHERE status='resolved' AND updated_at >= date_trunc('month', NOW())) AS resolved_mtd
       FROM helpdesk_tickets WHERE org_id=$1`, [orgId]),
    db.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER(WHERE status='done') AS done,
              COUNT(*) FILTER(WHERE status='in_progress') AS in_progress,
              COUNT(*) FILTER(WHERE due_date < NOW() AND status != 'done') AS overdue
       FROM task_items WHERE org_id=$1`, [orgId]),
    db.query(
      `SELECT COUNT(*) AS total_events,
              COUNT(DISTINCT user_id) AS active_users
       FROM org_events WHERE org_id=$1 AND created_at >= NOW() - INTERVAL '7 days'`, [orgId]),
  ]);

  res.json({
    revenue: revenue.rows[0],
    crm: crm.rows[0],
    hr: hr.rows[0],
    helpdesk: helpdesk.rows[0],
    tasks: tasks.rows[0],
    activity: activity.rows[0],
  });
}

async function getTeamPerformance(req, res) {
  const orgId = req.user.orgId;
  const { rows } = await db.query(
    `SELECT u.full_name, u.email, u.role,
            COUNT(oe.id) AS actions_30d,
            MAX(oe.created_at) AS last_active
     FROM users u
     LEFT JOIN org_events oe ON oe.user_id = u.id AND oe.created_at >= NOW() - INTERVAL '30 days'
     WHERE u.org_id = $1
     GROUP BY u.id ORDER BY actions_30d DESC`,
    [orgId]
  );
  res.json({ team: rows });
}

async function getModuleAdoption(req, res) {
  const orgId = req.user.orgId;
  const { rows } = await db.query(
    `SELECT m.name, m.slug, m.status,
            COUNT(oe.id) AS opens_30d,
            COUNT(DISTINCT oe.user_id) AS unique_users_30d
     FROM modules m
     LEFT JOIN org_events oe ON oe.org_id = $1 AND oe.name = 'module.open'
          AND oe.properties->>'slug' = m.slug AND oe.created_at >= NOW() - INTERVAL '30 days'
     WHERE m.status = 'active'
     GROUP BY m.id ORDER BY opens_30d DESC`,
    [orgId]
  );
  res.json({ adoption: rows });
}

module.exports = { getKpiSnapshot, getTeamPerformance, getModuleAdoption };
