const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/automationController');
const r = Router();
r.use(requireAuth);
r.get('/stats', c.getStats);
r.get('/workflows', c.listWorkflows);
r.post('/workflows', c.createWorkflow);
r.put('/workflows/:id', c.updateWorkflow);
r.delete('/workflows/:id', c.deleteWorkflow);
r.get('/workflows/:workflowId/steps', c.listSteps);
r.post('/workflows/:workflowId/steps', c.createStep);
r.put('/steps/:id', c.updateStep);
r.delete('/steps/:id', c.deleteStep);
r.get('/enrollments', c.listEnrollments);
r.post('/enrollments', c.createEnrollment);
r.put('/enrollments/:id', c.updateEnrollment);
r.delete('/enrollments/:id', c.deleteEnrollment);
r.get('/enrollments/:enrollmentId/runs', c.listStepRuns);

// Templates
r.get('/templates', c.listTemplates);
r.get('/templates/:id', c.getTemplate);
r.post('/templates/create-from', c.createFromTemplate);

// Triggers
r.post('/triggers', c.createTrigger);
r.post('/triggers/process', c.processTriggers);

// Analytics (basic - detailed analytics in automationAnalytics.js)
r.get('/workflows/:workflowId/analytics', c.getWorkflowAnalytics);
r.get('/workflows/:workflowId/summary', c.getWorkflowSummary);

// Goals
r.post('/workflows/:workflowId/goals', c.createGoal);
r.get('/workflows/:workflowId/goals', c.listGoals);

// Split Tests
r.post('/steps/:stepId/split-test', c.createSplitTest);
r.get('/steps/:stepId/split-test', c.getSplitTestResults);

// Contact Tags
r.get('/contacts/:contactEmail/tags', c.getContactTags);
r.post('/contacts/:contactEmail/tags', c.addContactTag);
r.delete('/contacts/:contactEmail/tags/:tag', c.removeContactTag);

// Lead Scoring
r.get('/contacts/:contactEmail/lead-score', c.getLeadScoreHistory);
r.post('/contacts/:contactEmail/lead-score', c.updateLeadScore);

module.exports = r;
