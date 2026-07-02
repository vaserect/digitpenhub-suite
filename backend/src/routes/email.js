const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const {
  listLists, createList, updateList, deleteList,
  listSubscribers, addSubscriber, importSubscribers, removeSubscriber, unsubscribe,
  listCampaigns, createCampaign, getCampaign, updateCampaign, deleteCampaign, sendCampaign,
  getStats,
} = require('../controllers/emailController');

const router = Router();

// Public — no auth
router.get('/unsubscribe/:id', unsubscribe);

// Protected
router.use(requireAuth);
router.use(requireModuleAccess('email-marketing'));

router.get('/stats', getStats);

router.get('/lists', listLists);
router.post('/lists', createList);
router.patch('/lists/:id', updateList);
router.delete('/lists/:id', deleteList);

router.get('/lists/:listId/subscribers', listSubscribers);
router.post('/lists/:listId/subscribers', addSubscriber);
router.post('/lists/:listId/subscribers/import', importSubscribers);
router.delete('/lists/:listId/subscribers/:id', removeSubscriber);

router.get('/campaigns', listCampaigns);
router.post('/campaigns', createCampaign);
router.get('/campaigns/:id', getCampaign);
router.patch('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);
router.post('/campaigns/:id/send', sendCampaign);

module.exports = router;
