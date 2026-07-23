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

  const contactsTotal = Number(contactsRow.rows[0].total);
  const contactsWon = Number(contactsRow.rows[0].won);
  const revenuePaid = Number(invoicesRow.rows[0].revenue_paid);
  const mtdInvoices = Number(invoicesRow.rows[0].this_month);
  const leadsThisWeek = Number(leadsRow.rows[0].this_week);
  const listCount = Number(emailRow.rows[0].lists);
  const campaignsSent = Number(emailRow.rows[0].campaigns_sent);
  const totalInvoices = Number(invoicesRow.rows[0].total);

  res.json({
    members: Number(membersRow.rows[0].count),
    contacts: {
      total: contactsTotal,
      won: contactsWon,
    },
    invoices: {
      total: totalInvoices,
      paidCount: Number(invoicesRow.rows[0].paid_count),
      revenuePaid,
      thisMonth: mtdInvoices,
    },
    leads: {
      total: Number(leadsRow.rows[0].total),
      thisWeek: leadsThisWeek,
      converted: Number(leadsRow.rows[0].converted),
      newCount: Number(leadsRow.rows[0].new_count),
    },
    email: {
      lists: listCount,
      subscribers: Number(emailRow.rows[0].subscribers),
      campaignsSent,
    },
    recentEvents: recentEventsRow.rows,

    // Flat fields expected by frontend stat-pill cards
    contactCount: contactsTotal,
    wonDeals: contactsWon,
    totalRevenue: revenuePaid,
    mtdInvoices,
    leadsThisWeek,
    listCount,
    campaignsSent,
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
    days: rows.map((r) => {
      const leads = Number(r.leads);
      const invoices = Number(r.invoices);
      const contacts = Number(r.contacts);
      const events = Number(r.events);
      return {
        date: r.day,
        leads,
        invoices,
        contacts,
        events,
        total: leads + invoices + contacts + events,
      };
    }),
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
    modules: [
      { module: 'CRM', count: Number(contacts.rows[0].count), record_count: Number(contacts.rows[0].count) },
      { module: 'Lead Gen', count: Number(leads.rows[0].count), record_count: Number(leads.rows[0].count) },
      { module: 'Invoices', count: Number(invoices.rows[0].count), record_count: Number(invoices.rows[0].count) },
      { module: 'Email', count: Number(emailSubs.rows[0].count), record_count: Number(emailSubs.rows[0].count) },
      { module: 'Campaigns', count: Number(emailCampaigns.rows[0].count), record_count: Number(emailCampaigns.rows[0].count) },
      { module: 'Projects', count: Number(projects.rows[0].count), record_count: Number(projects.rows[0].count) },
    ],
  });
}

// Helper — runs a query and returns a safe fallback row if the table doesn't exist
async function q(query, params, fallbackRow = {}) {
  try { return await db.query(query, params); }
  catch { return { rows: [fallbackRow] }; }
}

async function executive(req, res) {
  const orgId = req.user.orgId;

  const results = await Promise.allSettled([
    q(`SELECT COUNT(*)::int AS count FROM users WHERE org_id = $1`, [orgId], { count: 0 }),
    q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE stage = 'won')::int AS won FROM contacts WHERE org_id = $1`, [orgId], { total: 0, won: 0 }),
    q(`SELECT COUNT(*)::int AS total, COALESCE(SUM(total) FILTER (WHERE status = 'paid'),0)::numeric AS revenue_paid, COUNT(*) FILTER (WHERE created_at >= date_trunc('month',now()))::int AS this_month, COALESCE(SUM(total) FILTER (WHERE status = 'paid' AND created_at >= date_trunc('month',now())),0)::numeric AS revenue_mtd FROM invoices WHERE org_id = $1`, [orgId], { total: 0, revenue_paid: 0, this_month: 0, revenue_mtd: 0 }),
    q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE submitted_at >= now() - interval '7 days')::int AS this_week FROM lead_submissions WHERE org_id = $1`, [orgId], { total: 0, this_week: 0 }),
    q(`SELECT (SELECT COUNT(*) FROM email_subscribers WHERE org_id = $1 AND status = 'subscribed')::int AS subscribers, (SELECT COUNT(*) FROM email_campaigns WHERE org_id = $1 AND status = 'sent')::int AS campaigns_sent, (SELECT COUNT(*) FROM email_lists WHERE org_id = $1)::int AS lists`, [orgId], { subscribers: 0, campaigns_sent: 0, lists: 0 }),
    q(`SELECT e.name, e.properties, e.created_at, u.full_name AS user_name FROM org_events e LEFT JOIN users u ON u.id = e.user_id WHERE e.org_id = $1 ORDER BY e.created_at DESC LIMIT 8`, [orgId], {}),
    q(`SELECT COUNT(*)::int AS count FROM projects WHERE org_id = $1`, [orgId], { count: 0 }),
    q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'todo' OR status = 'in_progress')::int AS active FROM task_items WHERE org_id = $1`, [orgId], { total: 0, active: 0 }),
    q(`SELECT COUNT(*)::int AS files, COALESCE(SUM(size_bytes),0)::numeric AS total_bytes FROM uploaded_files WHERE org_id = $1`, [orgId], { files: 0, total_bytes: 0 }),
    q(`SELECT to_char(month, 'Mon YYYY') AS label, COALESCE(SUM(total),0)::numeric AS revenue FROM (SELECT date_trunc('month', created_at) AS month, total FROM invoices WHERE org_id = $1 AND status = 'paid' AND created_at >= now() - interval '5 months') sub GROUP BY month ORDER BY month ASC`, [orgId], { label: null, revenue: 0 }),
    q(`SELECT COUNT(*)::int AS total_requests, COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS this_week FROM ai_requests WHERE org_id = $1`, [orgId], { total_requests: 0, this_week: 0 }),
  ]);

  const r = (i) => results[i].status === 'fulfilled' ? results[i].value.rows[0] : {};

  const members = r(0);
  const contacts = r(1);
  const invoices = r(2);
  const leads = r(3);
  const email = r(4);
  const events = r(5);
  const projects = r(6);
  const tasks = r(7);
  const storage = r(8);
  const revenueTrend = r(9);
  const aiUsage = r(10);

  const totalRevenue = Number(invoices.revenue_paid||0);
  const revenueMTD = Number(invoices.revenue_mtd||0);
  const contactsTotal = Number(contacts.total||0);
  const contactsWon = Number(contacts.won||0);
  const leadsTotal = Number(leads.total||0);
  const leadsThisWeek = Number(leads.this_week||0);
  const totalProjects = Number(projects.count||0);
  const subscribers = Number(email.subscribers||0);
  const campaignsSent = Number(email.campaigns_sent||0);
  const totalInvoices = Number(invoices.total||0);
  const mtdInvoices = Number(invoices.this_month||0);
  const taskCount = Number(tasks.total||0);
  const activeTasks = Number(tasks.active||0);
  const storageFiles = Number(storage.files||0);
  const storageBytes = Number(storage.total_bytes||0);

  res.json({
    kpis: [
      { key: 'revenue', label: 'Revenue', value: totalRevenue, display: `₦${totalRevenue.toLocaleString()}`, trend: revenueMTD > 0 ? 1 : 0, sub: `${mtdInvoices} invoices MTD` },
      { key: 'contacts', label: 'Contacts', value: contactsTotal, display: contactsTotal.toLocaleString(), trend: contactsWon > 0 ? 1 : 0, sub: `${contactsWon} won deals` },
      { key: 'leads', label: 'Leads', value: leadsTotal, display: leadsTotal.toLocaleString(), trend: leadsThisWeek > 0 ? 1 : 0, sub: `${leadsThisWeek} this week` },
      { key: 'invoices', label: 'Invoices', value: totalInvoices, display: totalInvoices.toLocaleString(), trend: mtdInvoices > 0 ? 1 : 0, sub: `${mtdInvoices} this month` },
      { key: 'email', label: 'Subscribers', value: subscribers, display: subscribers.toLocaleString(), trend: campaignsSent > 0 ? 1 : 0, sub: `${campaignsSent} campaigns sent` },
      { key: 'projects', label: 'Projects', value: totalProjects, display: totalProjects.toLocaleString(), trend: 0, sub: `${activeTasks} active tasks` },
    ],
    revenueTrend: Array.isArray(revenueTrend) ? revenueTrend.map(r => ({ label: r.label, revenue: Number(r.revenue) })) : [],
    aiUsage: { total: Number(aiUsage.total_requests||0), thisWeek: Number(aiUsage.this_week||0) },
    tasks: { total: taskCount, active: activeTasks },
    storage: { files: storageFiles, totalBytes: storageBytes, display: storageBytes > 0 ? `${(storageBytes / 1048576).toFixed(1)} MB` : '—' },
    recentActivity: Array.isArray(events) ? events : [],
    modules: [
      { module: 'CRM', count: contactsTotal, record_count: contactsTotal },
      { module: 'Lead Gen', count: leadsTotal, record_count: leadsTotal },
      { module: 'Invoices', count: totalInvoices, record_count: totalInvoices },
      { module: 'Email', count: subscribers, record_count: subscribers },
      { module: 'Campaigns', count: campaignsSent, record_count: campaignsSent },
      { module: 'Projects', count: totalProjects, record_count: totalProjects },
    ],
  });
}

// ── Growth metrics — month-over-month growth rates ─────────
async function growth(req, res) {
  const orgId = req.user.orgId;
  const m = await Promise.allSettled([
    q(`SELECT COUNT(*)::int AS this_month FROM contacts WHERE org_id = $1 AND created_at >= date_trunc('month', now())`, [orgId], { this_month: 0 }),
    q(`SELECT COUNT(*)::int AS last_month FROM contacts WHERE org_id = $1 AND created_at >= date_trunc('month', now() - interval '1 month') AND created_at < date_trunc('month', now())`, [orgId], { last_month: 0 }),
    q(`SELECT COALESCE(SUM(total),0)::numeric AS this_month FROM invoices WHERE org_id = $1 AND status = 'paid' AND created_at >= date_trunc('month', now())`, [orgId], { this_month: 0 }),
    q(`SELECT COALESCE(SUM(total),0)::numeric AS last_month FROM invoices WHERE org_id = $1 AND status = 'paid' AND created_at >= date_trunc('month', now() - interval '1 month') AND created_at < date_trunc('month', now())`, [orgId], { last_month: 0 }),
  ]);
  const cr = (i) => m[i].status === 'fulfilled' ? m[i].value.rows[0] : {};
  const contactsThis = Number(cr(0).this_month||0);
  const contactsLast = Number(cr(1).last_month||0);
  const revenueThis = Number(cr(2).this_month||0);
  const revenueLast = Number(cr(3).last_month||0);
  res.json({
    contactsGrowth: contactsLast > 0 ? Math.round((contactsThis - contactsLast) / contactsLast * 100) : (contactsThis > 0 ? 100 : 0),
    revenueGrowth: revenueLast > 0 ? Math.round((revenueThis - revenueLast) / revenueLast * 100) : (revenueThis > 0 ? 100 : 0),
    contactsThis, contactsLast, revenueThis, revenueLast,
  });
}

// ── Lead conversion analytics ────────────────────────────────
async function leadConversion(req, res) {
  const orgId = req.user.orgId;
  const { rows } = await q(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'converted')::int AS converted,
       COUNT(*) FILTER (WHERE status = 'new')::int AS new_leads
     FROM lead_submissions WHERE org_id = $1`,
    [orgId], { total: 0, converted: 0, new_leads: 0 }
  );
  const r = rows[0];
  res.json({
    total: Number(r.total||0),
    converted: Number(r.converted||0),
    newLeads: Number(r.new_leads||0),
    rate: Number(r.total||0) > 0 ? Math.round(Number(r.converted||0) / Number(r.total||0) * 100) : 0,
  });
}

// ── Task completion rates ────────────────────────────────────
async function taskCompletion(req, res) {
  const orgId = req.user.orgId;
  const { rows } = await q(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'done')::int AS done,
       COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress
     FROM task_items WHERE org_id = $1`,
    [orgId], { total: 0, done: 0, in_progress: 0 }
  );
  const r = rows[0];
  res.json({
    total: Number(r.total||0),
    done: Number(r.done||0),
    inProgress: Number(r.in_progress||0),
    rate: Number(r.total||0) > 0 ? Math.round(Number(r.done||0) / Number(r.total||0) * 100) : 0,
  });
}

// ── Revenue sparkline (last 7 days by day) ──────────────────
async function revenueSparkline(req, res) {
  const orgId = req.user.orgId;
  const { rows } = await q(
    `SELECT created_at::date AS day, COALESCE(SUM(total),0)::numeric AS revenue
     FROM invoices WHERE org_id = $1 AND status = 'paid' AND created_at >= now() - interval '7 days'
     GROUP BY created_at::date ORDER BY day ASC`,
    [orgId], []
  );
  res.json({ sparkline: rows.map(r => ({ day: r.day, revenue: Number(r.revenue) })) });
}

module.exports = { track, overview, activity, moduleUsage, executive, growth, leadConversion, taskCompletion, revenueSparkline, recordEvent };
