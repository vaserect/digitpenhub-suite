const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/leadScoringController');

const r = Router();

r.use(requireAuth);

// Models
r.get('/models', c.listModels.bind(c));
r.get('/models/default', c.getDefaultModel.bind(c));
r.post('/models', c.createModel.bind(c));
r.put('/models/:id', c.updateModel.bind(c));
r.delete('/models/:id', c.deleteModel.bind(c));

// Rules
r.get('/models/:id/rules', c.listRules.bind(c));
r.post('/rules', c.createRule.bind(c));
r.put('/rules/:id', c.updateRule.bind(c));
r.delete('/rules/:id', c.deleteRule.bind(c));

// Thresholds
r.get('/models/:id/thresholds', c.listThresholds.bind(c));
r.post('/thresholds', c.createThreshold.bind(c));
r.put('/thresholds/:id', c.updateThreshold.bind(c));
r.delete('/thresholds/:id', c.deleteThreshold.bind(c));

// Scoring Calculation & Action
r.post('/calculate/:contactId', c.calculateContactScore.bind(c));
r.post('/bulk-calculate', c.bulkCalculateScores.bind(c));
r.get('/contacts/:contactId/score', c.getContactScore.bind(c));
r.get('/contacts/:contactId/history', c.getContactScoreHistory.bind(c));

// Analytics & Activities
r.get('/analytics', c.getAnalytics.bind(c));
r.post('/activities', c.recordActivity.bind(c));

module.exports = r;
