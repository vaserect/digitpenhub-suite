const express = require('express');
const router = express.Router();
const automationAnalyticsController = require('../controllers/automationAnalyticsController');

/**
 * Automation Analytics Routes
 * Comprehensive analytics and reporting for marketing automation
 */

// Workflow-specific analytics
router.get('/workflows/:workflowId', automationAnalyticsController.getWorkflowAnalytics);
router.get('/workflows/:workflowId/summary', automationAnalyticsController.getWorkflowSummary);
router.get('/workflows/:workflowId/goals', automationAnalyticsController.getGoalAnalytics);
router.get('/workflows/:workflowId/split-tests', automationAnalyticsController.getSplitTestAnalytics);
router.get('/workflows/:workflowId/export', automationAnalyticsController.exportAnalytics);

// Organization-wide analytics
router.get('/org', automationAnalyticsController.getOrgAnalytics);
router.get('/compare', automationAnalyticsController.compareWorkflows);

// Contact-specific analytics
router.get('/contacts/:contactEmail/journey', automationAnalyticsController.getContactJourney);

// Lead scoring analytics
router.get('/lead-scoring', automationAnalyticsController.getLeadScoringAnalytics);

module.exports = router;
