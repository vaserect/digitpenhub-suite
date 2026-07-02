const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireUsageCapacity } = require('../utils/planAccess');
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
} = require('../controllers/invoicesController');

router.get('/public/:token', getPublicInvoice);
router.use(requireAuth);

router.get('/clients', listClients);
router.post('/clients', createClient);
router.patch('/clients/:id', updateClient);
router.delete('/clients/:id', deleteClient);
router.get('/', listInvoices);
router.post('/', requireUsageCapacity('invoices', `SELECT COUNT(*)::int AS count FROM invoices WHERE org_id = $1`), createInvoice);
router.post('/:id/share', shareInvoice);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.patch('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

module.exports = router;
