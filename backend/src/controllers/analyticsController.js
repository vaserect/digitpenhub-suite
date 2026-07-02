const db = require('../db');

// Fire-and-forget — never throws so callers don't need to await
async function recordEvent(orgId, userId, name, properties = {}) {
  try {
    await db.query(
      `INSERT INTO org_events (org_id, user_id, name, properties) VALUES ($1,$2,$3,$4)`,
      [orgId, userId || null, name, JSON.stringify(properties)]
    );
  } catch { /* intentionally silent */ }
}

async function track(req, res) {
  const { name, properties } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });
  await recordEvent(req.user.orgId, req.user.id, String(name).slice(0, 100), properties || {});
  res.json({ ok: true });
}

async function overview(req, res) {
  const orgId = req.user.orgId;

  const [
    membersRow,
    contactsRow,
    invoicesRow,
    leadsRow,
    emailRow,
    recentEventsRow,
  ] = await Promise.all([
    // Team members
    db.query(`SELECT COUNT(*) FROM users WHERE org_id = $1`, [orgId]),

    // CRM contacts
    db.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE stage = 'won') AS won
       FROM contacts WHERE org_id = $1`,
      [orgId]
    ),

    // Invoices — total count + revenue (paid) + this month's count
    db.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) AS revenue_paid,
              COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
              COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now())) AS this_month
       FROM invoices WHERE org_id = $1`,
      [orgId]
    ),

    // Leads — total + this week's new leads + converted
    db.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE submitted_at >= now() - interval '7 days') AS this_week,
              COUNT(*) FILTER (WHERE status = 'converted') AS converted,
              COUNT(*) FILTER (WHERE status = 'new') AS new_count
       FROM lead_submissions WHERE org_id = $1`,
      [orgId]
    ),

    // Email — subscribers + campaigns sent
    db.query(
      `SELECT
         (SELECT COUNT(*) FROM email_lists WHERE org_id = $1) AS lists,
         (SELECT COUNT(*) FROM email_subscribers WHERE org_id = $1 AND status = 'subscribed') AS subscribers,
         (SELECT COUNT(*) FROM email_campaigns WHERE org_id = $1 AND status = 'sent') AS campaigns_sent`,
      [orgId]
    ),

    // Last 10 events
    db.query(
      `SELECT e.name, e.properties, e.created_at, u.full_name AS user_name
       FROM org_events e
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.org_id = $1
       ORDER BY e.created_at DESC LIMIT 10`,
      [orgId]
    ),
  ]);

  res.json({
    members: Number(membersRow.rows[0].count),
    contacts: {
      total: Number(contactsRow.rows[0].total),
      won: Number(contactsRow.rows[0].won),
    },
    invoices: {
      total: Number(invoicesRow.rows[0].total),
      paidCount: Number(invoicesRow.rows[0].paid_count),
      revenuePaid: Number(invoicesRow.rows[0].revenue_paid),
      thisMonth: Number(invoicesRow.rows[0].this_month),
    },
    leads: {
      total: Number(leadsRow.rows[0].total),
      thisWeek: Number(leadsRow.rows[0].this_week),
      converted: Number(leadsRow.rows[0].converted),
      newCount: Number(leadsRow.rows[0].new_count),
    },
    email: {
      lists: Number(emailRow.rows[0].lists),
      subscribers: Number(emailRow.rows[0].subscribers),
      campaignsSent: Number(emailRow.rows[0].campaigns_sent),
    },
    recentEvents: recentEventsRow.rows,
  });
}

async function activity(req, res) {
  const orgId = req.user.orgId;

  // Generate last 30 days as a series and left-join counts from multiple tables
  const { rows } = await db.query(
    `WITH days AS (
       SELECT generate_series(
         (now() - interval '29 days')::date,
         now()::date,
         '1 day'::interval
       )::date AS day
     )
     SELECT
       d.day,
       COALESCE(leads.cnt, 0)    AS leads,
       COALESCE(invoices.cnt, 0) AS invoices,
       COALESCE(contacts.cnt, 0) AS contacts,
       COALESCE(events.cnt, 0)   AS events
     FROM days d
     LEFT JOIN (
       SELECT submitted_at::date AS day, COUNT(*) AS cnt
       FROM lead_submissions WHERE org_id = $1
       GROUP BY 1
     ) leads ON leads.day = d.day
     LEFT JOIN (
       SELECT created_at::date AS day, COUNT(*) AS cnt
       FROM invoices WHERE org_id = $1
       GROUP BY 1
     ) invoices ON invoices.day = d.day
     LEFT JOIN (
       SELECT created_at::date AS day, COUNT(*) AS cnt
       FROM contacts WHERE org_id = $1
       GROUP BY 1
     ) contacts ON contacts.day = d.day
     LEFT JOIN (
       SELECT created_at::date AS day, COUNT(*) AS cnt
       FROM org_events WHERE org_id = $1
       GROUP BY 1
     ) events ON events.day = d.day
     ORDER BY d.day`,
    [orgId]
  );

  res.json({
    days: rows.map((r) => ({
      date: r.day,
      leads: Number(r.leads),
      invoices: Number(r.invoices),
      contacts: Number(r.contacts),
      events: Number(r.events),
    })),
  });
}

async function moduleUsage(req, res) {
  const orgId = req.user.orgId;

  const [contacts, leads, invoices, emailCampaigns, emailSubs, projects] = await Promise.all([
    db.query(`SELECT COUNT(*) FROM contacts WHERE org_id = $1`, [orgId]),
    db.query(`SELECT COUNT(*) FROM lead_submissions WHERE org_id = $1`, [orgId]),
    db.query(`SELECT COUNT(*) FROM invoices WHERE org_id = $1`, [orgId]),
    db.query(`SELECT COUNT(*) FROM email_campaigns WHERE org_id = $1`, [orgId]),
    db.query(`SELECT COUNT(*) FROM email_subscribers WHERE org_id = $1`, [orgId]),
    db.query(`SELECT COUNT(*) FROM projects WHERE org_id = $1`, [orgId]),
  ]);

  res.json({
    usage: [
      { module: 'CRM', count: Number(contacts.rows[0].count) },
      { module: 'Lead Gen', count: Number(leads.rows[0].count) },
      { module: 'Invoices', count: Number(invoices.rows[0].count) },
      { module: 'Email', count: Number(emailSubs.rows[0].count) },
      { module: 'Campaigns', count: Number(emailCampaigns.rows[0].count) },
      { module: 'Projects', count: Number(projects.rows[0].count) },
    ],
  });
}

module.exports = { track, overview, activity, moduleUsage, recordEvent };
