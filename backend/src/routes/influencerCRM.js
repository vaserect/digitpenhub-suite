// backend/src/routes/influencerCRM.js
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/influencerCRMController');

const router = Router();

router.use(requireAuth);

// Influencers CRUD
router.post('/influencers', controller.createInfluencer);
router.get('/influencers', controller.getInfluencers);
router.put('/influencers/:id', controller.updateInfluencer);
router.post('/influencers/:id/social-accounts', controller.addSocialAccount);
router.get('/influencers/:id/social-accounts', controller.getSocialAccounts);

// Campaigns
router.post('/campaigns', controller.createCampaign);
router.get('/campaigns', controller.getCampaigns);
router.post('/campaigns/:id/assign', controller.assignInfluencer);
router.get('/campaigns/:id/influencers', controller.getCampaignInfluencers);

// Content
router.post('/content', controller.addContent);
router.get('/content', controller.getContent);

// Payments
router.post('/payments', controller.addPayment);
router.get('/payments', controller.getPayments);
router.put('/payments/:id/status', controller.updatePaymentStatus);

module.exports = router;
