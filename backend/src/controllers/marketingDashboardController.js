const db = require('../db');

async function getMarketingSummary(req, res) {
  const orgId = req.user.orgId;
  const [emailStats, smsStats, waStats, leadStats] = await Promise.all([
    db.query(
      `SELECT
         COUNT(DISTINCT es.id) AS subscribers,
         COUNT(DISTINCT el.id) AS lists,
         COUNT(DISTINCT ec.id) AS campaigns,
         COUNT(DISTINCT ec.id) FILTER(WHERE ec.status='sent') AS campaigns_sent,
         COALESCE(AVG(ec.open_rate), 0) AS avg_open_rate
       FROM email_subscribers es
       LEFT JOIN email_lists el ON el.org_id = es.org_id
       LEFT JOIN email_campaigns ec ON ec.org_id = es.org_id
       WHERE es.org_id = $1`,
      [orgId]
    ),
    db.query(
      `SELECT
         COUNT(DISTINCT sc.id) AS campaigns,
         COUNT(DISTINCT sc.id) FILTER(WHERE sc.status='sent') AS sent,
         COALESCE(SUM(sc.sent_count),0) AS total_messages,
         COUNT(DISTINCT sct.id) AS contacts
       FROM sms_campaigns sc
       LEFT JOIN sms_contacts sct ON sct.org_id = sc.org_id
       WHERE sc.org_id = $1`,
      [orgId]
    ),
    db.query(
      `SELECT
         COUNT(DISTINCT wc.id) AS contacts,
         COUNT(DISTINCT wc.id) FILTER(WHERE wc.status='active') AS active_contacts,
         COUNT(DISTINCT wb.id) AS broadcasts_sent
       FROM whatsapp_contacts wc
       LEFT JOIN whatsapp_broadcasts wb ON wb.org_id = wc.org_id
       WHERE wc.org_id = $1`,
      [orgId]
    ),
    db.query(
      `SELECT
         COUNT(DISTINCT ls.id) AS total_leads,
         COUNT(DISTINCT ls.id) FILTER(WHERE ls.created_at >= NOW() - INTERVAL '7 days') AS this_week,
         COUNT(DISTINCT ls.id) FILTER(WHERE ls.created_at >= NOW() - INTERVAL '30 days') AS this_month,
         COUNT(DISTINCT lf.id) AS active_forms
       FROM lead_submissions ls
       LEFT JOIN lead_forms lf ON lf.org_id = ls.form_id
       WHERE ls.form_id IN (SELECT id FROM lead_forms WHERE org_id = $1)`,
      [orgId]
    ),
  ]);

  res.json({
    email: emailStats.rows[0],
    sms: smsStats.rows[0],
    whatsapp: waStats.rows[0],
    leads: leadStats.rows[0],
  });
}

async function getLeadsByDay(req, res) {
  const orgId = req.user.orgId;
  const { rows } = await db.query(
    `SELECT
       date_trunc('day', ls.created_at)::date AS day,
       COUNT(*) AS leads
     FROM lead_submissions ls
     WHERE ls.form_id IN (SELECT id FROM lead_forms WHERE org_id = $1)
       AND ls.created_at >= NOW() - INTERVAL '30 days'
     GROUP BY day ORDER BY day ASC`,
    [orgId]
  );
  res.json({ days: rows });
}

async function getTopCampaigns(req, res) {
  const orgId = req.user.orgId;
  const { rows } = await db.query(
    `SELECT name, subject, status, open_rate, click_rate, created_at
     FROM email_campaigns WHERE org_id = $1
     ORDER BY open_rate DESC NULLS LAST LIMIT 5`,
    [orgId]
  );
  res.json({ campaigns: rows });
}

module.exports = { getMarketingSummary, getLeadsByDay, getTopCampaigns };
