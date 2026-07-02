const db = require('../db');

async function getSalesSummary(req, res) {
  const orgId = req.user.orgId;
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart      = new Date(now.getFullYear(), 0, 1).toISOString();

  const [invoiceStats, posStats, orderStats, quoteStats] = await Promise.all([
    db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status='paid' AND created_at >= $2 THEN total ELSE 0 END),0) AS this_month,
         COALESCE(SUM(CASE WHEN status='paid' AND created_at >= $3 AND created_at < $2 THEN total ELSE 0 END),0) AS last_month,
         COALESCE(SUM(CASE WHEN status='paid' AND created_at >= $4 THEN total ELSE 0 END),0) AS this_year,
         COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) AS all_time,
         COUNT(*) FILTER(WHERE status='paid') AS paid_count,
         COUNT(*) FILTER(WHERE status='overdue') AS overdue_count,
         COUNT(*) FILTER(WHERE status='draft' OR status='sent') AS pending_count
       FROM invoices WHERE org_id = $1`,
      [orgId, thisMonthStart, lastMonthStart, yearStart]
    ),
    db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN ps.started_at >= $2 THEN ps.total_amount ELSE 0 END),0) AS this_month,
         COALESCE(SUM(CASE WHEN ps.started_at >= $3 THEN ps.total_amount ELSE 0 END),0) AS this_year,
         COUNT(DISTINCT ps.id) FILTER(WHERE ps.started_at >= $2) AS sessions_this_month
       FROM pos_sessions ps WHERE ps.org_id = $1 AND ps.status = 'closed'`,
      [orgId, thisMonthStart, yearStart]
    ),
    db.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER(WHERE status='pending') AS pending,
         COUNT(*) FILTER(WHERE status='completed') AS completed,
         COALESCE(SUM(CASE WHEN status='completed' THEN total_amount ELSE 0 END),0) AS revenue
       FROM orders WHERE org_id = $1`,
      [orgId]
    ),
    db.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER(WHERE status='accepted') AS accepted,
              COUNT(*) FILTER(WHERE status='draft' OR status='sent') AS open
       FROM quotations WHERE org_id = $1`,
      [orgId]
    ),
  ]);

  res.json({
    invoices: invoiceStats.rows[0],
    pos: posStats.rows[0],
    orders: orderStats.rows[0],
    quotations: quoteStats.rows[0],
  });
}

async function getRevenueByMonth(req, res) {
  const orgId = req.user.orgId;
  const months = Number(req.query.months) || 12;
  const { rows } = await db.query(
    `SELECT
       to_char(date_trunc('month', created_at), 'Mon YYYY') AS month,
       date_trunc('month', created_at) AS month_date,
       COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) AS revenue,
       COUNT(*) FILTER(WHERE status='paid') AS invoices_paid
     FROM invoices
     WHERE org_id = $1 AND created_at >= NOW() - ($2 || ' months')::INTERVAL
     GROUP BY date_trunc('month', created_at)
     ORDER BY month_date ASC`,
    [orgId, months]
  );
  res.json({ months: rows });
}

async function getTopProducts(req, res) {
  const orgId = req.user.orgId;
  const { rows } = await db.query(
    `SELECT
       ii.description AS product,
       SUM(ii.quantity) AS qty_sold,
       SUM(ii.unit_price * ii.quantity) AS revenue
     FROM invoice_items ii
     JOIN invoices i ON i.id = ii.invoice_id AND i.org_id = $1 AND i.status = 'paid'
     GROUP BY ii.description
     ORDER BY revenue DESC
     LIMIT 10`,
    [orgId]
  );
  res.json({ products: rows });
}

async function getRecentSales(req, res) {
  const orgId = req.user.orgId;
  const { rows } = await db.query(
    `SELECT i.invoice_number, ic.name AS client, i.total, i.status, i.created_at
     FROM invoices i
     LEFT JOIN invoice_clients ic ON ic.id = i.client_id
     WHERE i.org_id = $1
     ORDER BY i.created_at DESC LIMIT 10`,
    [orgId]
  );
  res.json({ sales: rows });
}

module.exports = { getSalesSummary, getRevenueByMonth, getTopProducts, getRecentSales };
