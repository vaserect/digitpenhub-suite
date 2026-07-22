const express = require('express');
const invoiceUpgradeRouter = require('./invoiceUpgrades');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireUsageCapacity } = require('../utils/planAccess');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  listInvoices,
  createInvoice,
  getInvoice,
  getPublicInvoice,
  shareInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicePdf,
  sendInvoiceEmail,
} = require('../controllers/invoicesController');

router.get('/public/:token', getPublicInvoice);
router.use(requireAuth);

router.get('/clients', listClients);
router.post('/clients', createClient);
router.patch('/clients/:id', updateClient);
router.delete('/clients/:id', deleteClient);
router.post('/clients/bulk-delete', requireAuth, bulkDeleteHandler('invoice_clients'));
router.get('/clients/export', requireAuth, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM invoice_clients WHERE org_id = $1 ORDER BY name', [req.user.orgId]);
  sendCsv(res, 'clients.csv', rows, autoColumns(rows));
});

router.get('/', listInvoices);
router.post('/', requireUsageCapacity('invoices', `SELECT COUNT(*)::int AS count FROM invoices WHERE org_id = $1`), createInvoice);
router.get('/export', requireAuth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT i.id, i.invoice_number, i.status, i.issue_date, i.due_date, i.subtotal, i.tax_rate, i.total, i.notes,
            ic.name AS client_name, ic.company AS client_company
     FROM invoices i LEFT JOIN invoice_clients ic ON ic.id = i.client_id
     WHERE i.org_id = $1 ORDER BY i.issue_date DESC`,
    [req.user.orgId]
  );
  sendCsv(res, 'invoices.csv', rows, autoColumns(rows));
});
router.get('/stats', requireAuth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE status='draft')::int AS draft,
            count(*) FILTER (WHERE status='sent')::int AS sent,
            count(*) FILTER (WHERE status='paid')::int AS paid,
            COALESCE(sum(total) FILTER (WHERE status='paid'),0)::numeric AS paid_total,
            COALESCE(sum(total),0)::numeric AS total_value
     FROM invoices WHERE org_id = $1`,
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});
router.post('/bulk-delete', requireAuth, bulkDeleteHandler('invoices'));
router.post('/:id/share', shareInvoice);
router.get('/:id/pdf', getInvoicePdf);
router.post('/:id/send', sendInvoiceEmail);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.patch('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

router.use(invoiceUpgradeRouter);

module.exports = router;
