const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getStats,
  listAccounts, createAccount, updateAccount, deleteAccount,
  listEntries, getEntry, createEntry, deleteEntry,
  getPL, getBalanceSheet,
} = require('../controllers/accountingController');

const router = Router();
router.use(requireAuth);

router.get('/stats', getStats);

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
