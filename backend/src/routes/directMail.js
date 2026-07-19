const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const directMailController = require('../controllers/directMailController');

const router = express.Router();
const checkAccess = [requireAuth, requireModuleAccess('direct-mail-automation')];

// Templates
router.get('/templates', checkAccess, directMailController.listTemplates);
router.get('/templates/:id', checkAccess, directMailController.getTemplate);
router.post('/templates', checkAccess, directMailController.createTemplate);
router.put('/templates/:id', checkAccess, directMailController.updateTemplate);
router.delete('/templates/:id', checkAccess, directMailController.deleteTemplate);

// Campaigns
router.get('/campaigns', checkAccess, directMailController.listCampaigns);
router.get('/campaigns/:id', checkAccess, directMailController.getCampaign);
router.post('/campaigns', checkAccess, directMailController.createCampaign);
router.put('/campaigns/:id', checkAccess, directMailController.updateCampaign);
router.delete('/campaigns/:id', checkAccess, directMailController.deleteCampaign);

// Sends
router.get('/sends', checkAccess, directMailController.listSends);
router.get('/sends/:id', checkAccess, directMailController.getSend);
router.post('/send', checkAccess, directMailController.sendMail);
router.put('/sends/:id/simulate', checkAccess, directMailController.simulateTransit);

// Analytics
router.get('/analytics', checkAccess, directMailController.getAnalytics);

module.exports = router;
