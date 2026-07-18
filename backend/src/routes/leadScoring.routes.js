// backend/src/routes/leadScoring.routes.js
// Module 25: Lead Scoring Routes
// Benchmark: MadKudu / HubSpot Lead Scoring

const express = require('express');
const router = express.Router();
const leadScoringController = require('../controllers/leadScoringController');
const { requireAuth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(requireAuth);

/**
 * Scoring Models Routes
 */

// GET /api/v1/lead-scoring/models - List all models
router.get('/models',
  checkPermission('lead_scoring', 'read'),
  leadScoringController.listModels
);

// GET /api/v1/lead-scoring/models/default - Get default model
router.get('/models/default',
  checkPermission('lead_scoring', 'read'),
  leadScoringController.getDefaultModel
);

// POST /api/v1/lead-scoring/models - Create model
router.post('/models',
  checkPermission('lead_scoring', 'create'),
  validate.body({
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    description: { type: 'string' },
    is_active: { type: 'boolean' },
    is_default: { type: 'boolean' }
  }),
  leadScoringController.createModel
);

// PUT /api/v1/lead-scoring/models/:id - Update model
router.put('/models/:id',
  checkPermission('lead_scoring', 'update'),
  validate.body({
    name: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string' },
    is_active: { type: 'boolean' },
    is_default: { type: 'boolean' }
  }),
  leadScoringController.updateModel
);

// DELETE /api/v1/lead-scoring/models/:id - Delete model
router.delete('/models/:id',
  checkPermission('lead_scoring', 'delete'),
  leadScoringController.deleteModel
);

/**
 * Scoring Rules Routes
 */

// GET /api/v1/lead-scoring/models/:id/rules - List rules for model
router.get('/models/:id/rules',
  checkPermission('lead_scoring', 'read'),
  leadScoringController.listRules
);

// POST /api/v1/lead-scoring/rules - Create rule
router.post('/rules',
  checkPermission('lead_scoring', 'create'),
  validate.body({
    model_id: { type: 'string', required: true, format: 'uuid' },
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    description: { type: 'string' },
    rule_type: { 
      type: 'string', 
      required: true, 
      enum: ['property', 'activity', 'demographic', 'behavioral', 'engagement'] 
    },
    conditions: { type: 'array', required: true },
    score_change: { type: 'number', required: true },
    is_active: { type: 'boolean' },
    priority: { type: 'number', min: 0 }
  }),
  leadScoringController.createRule
);

// PUT /api/v1/lead-scoring/rules/:id - Update rule
router.put('/rules/:id',
  checkPermission('lead_scoring', 'update'),
  validate.body({
    name: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string' },
    rule_type: { 
      type: 'string', 
      enum: ['property', 'activity', 'demographic', 'behavioral', 'engagement'] 
    },
    conditions: { type: 'array' },
    score_change: { type: 'number' },
    is_active: { type: 'boolean' },
    priority: { type: 'number', min: 0 }
  }),
  leadScoringController.updateRule
);

// DELETE /api/v1/lead-scoring/rules/:id - Delete rule
router.delete('/rules/:id',
  checkPermission('lead_scoring', 'delete'),
  leadScoringController.deleteRule
);

/**
 * Score Calculation Routes
 */

// POST /api/v1/lead-scoring/calculate/:contactId - Calculate score for contact
router.post('/calculate/:contactId',
  checkPermission('lead_scoring', 'update'),
  validate.body({
    model_id: { type: 'string', format: 'uuid' },
    reason: { type: 'string' }
  }),
  leadScoringController.calculateContactScore
);

// POST /api/v1/lead-scoring/bulk-calculate - Bulk calculate scores
router.post('/bulk-calculate',
  checkPermission('lead_scoring', 'update'),
  validate.body({
    model_id: { type: 'string', format: 'uuid' },
    contact_ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
    limit: { type: 'number', min: 1, max: 1000 }
  }),
  leadScoringController.bulkCalculateScores
);

/**
 * Contact Score Routes
 */

// GET /api/v1/lead-scoring/contacts/:contactId/score - Get contact score
router.get('/contacts/:contactId/score',
  checkPermission('lead_scoring', 'read'),
  leadScoringController.getContactScore
);

// GET /api/v1/lead-scoring/contacts/:contactId/history - Get score history
router.get('/contacts/:contactId/history',
  checkPermission('lead_scoring', 'read'),
  leadScoringController.getContactScoreHistory
);

/**
 * Threshold Routes
 */

// GET /api/v1/lead-scoring/models/:id/thresholds - List thresholds
router.get('/models/:id/thresholds',
  checkPermission('lead_scoring', 'read'),
  leadScoringController.listThresholds
);

// POST /api/v1/lead-scoring/thresholds - Create threshold
router.post('/thresholds',
  checkPermission('lead_scoring', 'create'),
  validate.body({
    model_id: { type: 'string', required: true, format: 'uuid' },
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    min_score: { type: 'number', required: true, min: 0 },
    max_score: { type: 'number', min: 0 },
    color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    notify_on_reach: { type: 'boolean' },
    notification_config: { type: 'object' }
  }),
  leadScoringController.createThreshold
);

// PUT /api/v1/lead-scoring/thresholds/:id - Update threshold
router.put('/thresholds/:id',
  checkPermission('lead_scoring', 'update'),
  validate.body({
    name: { type: 'string', minLength: 1, maxLength: 100 },
    min_score: { type: 'number', min: 0 },
    max_score: { type: 'number', min: 0 },
    color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    notify_on_reach: { type: 'boolean' },
    notification_config: { type: 'object' }
  }),
  leadScoringController.updateThreshold
);

// DELETE /api/v1/lead-scoring/thresholds/:id - Delete threshold
router.delete('/thresholds/:id',
  checkPermission('lead_scoring', 'delete'),
  leadScoringController.deleteThreshold
);

/**
 * Analytics Routes
 */

// GET /api/v1/lead-scoring/analytics - Get scoring analytics
router.get('/analytics',
  checkPermission('lead_scoring', 'read'),
  leadScoringController.getAnalytics
);

/**
 * Activity Recording Routes
 */

// POST /api/v1/lead-scoring/activities - Record activity
router.post('/activities',
  checkPermission('lead_scoring', 'create'),
  validate.body({
    contact_id: { type: 'string', required: true, format: 'uuid' },
    activity_type: { 
      type: 'string', 
      required: true,
      enum: [
        'email_open', 'email_click', 'page_view', 'form_submit',
        'download', 'webinar_attend', 'demo_request', 'trial_start',
        'product_usage', 'support_ticket', 'meeting_booked', 'call_completed'
      ]
    },
    activity_data: { type: 'object' }
  }),
  leadScoringController.recordActivity
);

module.exports = router;
