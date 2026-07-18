const express = require('express');
const router = express.Router();
const pushNotificationController = require('../controllers/pushNotificationController');

// ==================== CAMPAIGNS ====================
router.post('/campaigns', pushNotificationController.createCampaign);
router.get('/campaigns', pushNotificationController.getCampaigns);
router.get('/campaigns/:id', pushNotificationController.getCampaign);
router.put('/campaigns/:id', pushNotificationController.updateCampaign);
router.delete('/campaigns/:id', pushNotificationController.deleteCampaign);
router.post('/campaigns/:id/send', pushNotificationController.sendCampaign);

// ==================== SUBSCRIBERS ====================
router.post('/subscribers', pushNotificationController.subscribe);
router.delete('/subscribers/:id', pushNotificationController.unsubscribe);
router.get('/subscribers', pushNotificationController.getSubscribers);
router.get('/subscribers/count', pushNotificationController.getSubscriberCount);

// ==================== ANALYTICS ====================
router.get('/campaigns/:id/analytics', pushNotificationController.getCampaignAnalytics);
router.get('/analytics/summary', pushNotificationController.getAnalyticsSummary);
router.post('/deliveries/:id/track', pushNotificationController.trackDeliveryEvent);

// ==================== SEGMENTS ====================
router.post('/segments', pushNotificationController.createSegment);
router.get('/segments', pushNotificationController.getSegments);
router.put('/segments/:id', pushNotificationController.updateSegment);
router.delete('/segments/:id', pushNotificationController.deleteSegment);

// ==================== TEMPLATES ====================
router.get('/templates', pushNotificationController.getTemplates);
router.post('/templates', pushNotificationController.createTemplate);

// ==================== AUTOMATION TRIGGERS ====================
router.post('/triggers', pushNotificationController.createTrigger);
router.get('/triggers', pushNotificationController.getTriggers);
router.put('/triggers/:id/toggle', pushNotificationController.toggleTrigger);

module.exports = router;
