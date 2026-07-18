const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/contentCalendarController');

const router = Router();

router.use(requireAuth);

// Content Items
router.post('/content', controller.createContent);
router.get('/content', controller.getContent);
router.get('/content/:id', controller.getContentById);
router.put('/content/:id', controller.updateContent);
router.delete('/content/:id', controller.deleteContent);

// Campaigns
router.post('/campaigns', controller.createCampaign);
router.get('/campaigns', controller.getCampaigns);
router.put('/campaigns/:id', controller.updateCampaign);

// Templates
router.post('/templates', controller.createTemplate);
router.get('/templates', controller.getTemplates);

// Approvals
router.post('/approvals', controller.requestApproval);
router.put('/approvals/:id', controller.updateApproval);
router.get('/approvals/pending', controller.getPendingApprovals);

// Comments
router.post('/content/:contentId/comments', controller.addComment);
router.get('/content/:contentId/comments', controller.getComments);

// Publishing Connections
router.post('/connections', controller.saveConnection);
router.get('/connections', controller.getConnections);

// Calendar View
router.get('/calendar', controller.getCalendarData);

module.exports = router;
