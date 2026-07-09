const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const {
  getStats,
  listAccounts, createAccount, updateAccount, deleteAccount,
  listEntries, getEntry, createEntry, deleteEntry,
  getPL, getBalanceSheet,
} = require('../controllers/accountingController');

const router = Router();
router.use(requireAuth);

router.get('/stats', getStats);
router.get('/export', async (req, res) => {
  const { rows } = await db.query('SELECT id, name, type, code, balance, created_at FROM accounts WHERE org_id = $1', [req.user.orgId]);
  sendCsv(res, 'accounts.csv', rows, autoColumns(rows));
});
router.post('/bulk-delete', bulkDeleteHandler('accounts'));

router.get('/accounts', listAccounts);
router.post('/accounts', createAccount);
router.put('/accounts/:id', updateAccount);
router.delete('/accounts/:id', deleteAccount);

router.get('/entries', listEntries);
router.get('/entries/:id', getEntry);
router.post('/entries', createEntry);
router.delete('/entries/:id', deleteEntry);

router.get('/reports/pl', getPL);
router.get('/reports/balance-sheet', getBalanceSheet);

module.exports = router;
