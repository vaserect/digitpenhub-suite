const express = require('express');
const router = express.Router();
const emailAutomationsController = require('../controllers/emailAutomationsController');

// List all automations
router.get('/', emailAutomationsController.listAutomations);

// Get automation details
router.get('/:id', emailAutomationsController.getAutomation);

// Create new automation
router.post('/', emailAutomationsController.createAutomation);

// Update automation
router.patch('/:id', emailAutomationsController.updateAutomation);

// Delete automation
router.delete('/:id', emailAutomationsController.deleteAutomation);

// Automation steps management
router.post('/:id/steps', emailAutomationsController.addStep);
router.patch('/:id/steps/:stepId', emailAutomationsController.updateStep);
router.delete('/:id/steps/:stepId', emailAutomationsController.deleteStep);
router.post('/:id/steps/reorder', emailAutomationsController.reorderSteps);

// Automation control
router.post('/:id/activate', emailAutomationsController.activateAutomation);
router.post('/:id/pause', emailAutomationsController.pauseAutomation);

// Enrollment
router.post('/:id/enroll', emailAutomationsController.enrollSubscriber);

// Analytics
router.get('/:id/analytics', emailAutomationsController.getAnalytics);

module.exports = router;
