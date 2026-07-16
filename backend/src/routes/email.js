const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { bulkSendLimiter } = require('../middleware/rateLimiters');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const {
  listLists, createList, updateList, deleteList,
  listSubscribers, addSubscriber, importSubscribers, removeSubscriber, unsubscribe,
  listCampaigns, createCampaign, getCampaign, updateCampaign, deleteCampaign, sendCampaign,
  getStats,
  confirmSubscription,
} = require('../controllers/emailController');

const router = Router();

// Public — no auth
router.get('/unsubscribe/:id', unsubscribe);
router.get('/confirm/:token', confirmSubscription); // CRITICAL FIX: Double opt-in confirmation endpoint

// Protected
router.use(requireAuth);
router.use(requireModuleAccess('email-marketing'));

router.get('/stats', getStats);

router.get('/lists', listLists);
router.post('/lists', createList);
router.patch('/lists/:id', updateList);
router.delete('/lists/:id', deleteList);
router.post('/lists/bulk-delete', bulkDeleteHandler('email_lists'));
router.get('/lists/export', async (req, res) => { const { rows } = await db.query("SELECT * FROM email_lists WHERE org_id = $1", [req.user.orgId]); sendCsv(res, 'email_lists.csv', rows, autoColumns(rows)); });

router.get('/lists/:listId/subscribers', listSubscribers);
router.post('/lists/:listId/subscribers', addSubscriber);
router.post('/lists/:listId/subscribers/import', importSubscribers);
router.delete('/lists/:listId/subscribers/:id', removeSubscriber);
router.post('/lists/:listId/subscribers/bulk-delete', bulkDeleteHandler('email_subscribers'));
router.get('/lists/:listId/subscribers/export', async (req, res) => { const { rows } = await db.query("SELECT * FROM email_subscribers WHERE list_id = $1", [req.params.listId]); sendCsv(res, 'email_subscribers.csv', rows, autoColumns(rows)); });

router.get('/campaigns', listCampaigns);
router.post('/campaigns', createCampaign);
router.post('/campaigns/bulk-delete', bulkDeleteHandler('email_campaigns'));
router.get('/campaigns/export', async (req, res) => { const { rows } = await db.query("SELECT * FROM email_campaigns WHERE org_id = $1", [req.user.orgId]); sendCsv(res, 'email_campaigns.csv', rows, autoColumns(rows)); });
router.get('/campaigns/:id', getCampaign);
router.patch('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);
router.post('/campaigns/:id/send', bulkSendLimiter, sendCampaign);

module.exports = router;
