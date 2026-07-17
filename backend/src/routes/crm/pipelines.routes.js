// backend/src/routes/crm/pipelines.js
// Phase 1 Implementation: Pipeline Routes
// Date: 2026-07-16

const express = require('express');
const router = express.Router();
const PipelineController = require('../../controllers/crm/PipelineController');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { checkPermission } = require('../../middleware/rbac');

/**
 * Pipeline Routes
 * All routes require authentication
 */

// Get default pipeline
router.get('/default',
  auth,
  checkPermission('pipelines', 'read'),
  PipelineController.getDefault.bind(PipelineController)
);

// List pipelines
router.get('/',
  auth,
  checkPermission('pipelines', 'read'),
  PipelineController.list.bind(PipelineController)
);

// Get pipeline by ID
router.get('/:id',
  auth,
  checkPermission('pipelines', 'read'),
  PipelineController.getById.bind(PipelineController)
);

// Create pipeline
router.post('/',
  auth,
  checkPermission('pipelines', 'create'),
  validate.body({
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    description: { type: 'string' },
    isDefault: { type: 'boolean' },
    displayOrder: { type: 'number', min: 0 },
    stages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
          description: { type: 'string' },
          probability: { type: 'number', min: 0, max: 100 },
          displayOrder: { type: 'number', min: 0 },
          color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          isClosedWon: { type: 'boolean' },
          isClosedLost: { type: 'boolean' }
        }
      }
    }
  }),
  PipelineController.create.bind(PipelineController)
);

// Update pipeline
router.put('/:id',
  auth,
  checkPermission('pipelines', 'update'),
  validate.body({
    name: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string' },
    isDefault: { type: 'boolean' },
    displayOrder: { type: 'number', min: 0 }
  }),
  PipelineController.update.bind(PipelineController)
);

// Set pipeline as default
router.put('/:id/set-default',
  auth,
  checkPermission('pipelines', 'update'),
  PipelineController.setDefault.bind(PipelineController)
);

// Delete pipeline
router.delete('/:id',
  auth,
  checkPermission('pipelines', 'delete'),
  PipelineController.delete.bind(PipelineController)
);

// List stages for pipeline
router.get('/:id/stages',
  auth,
  checkPermission('pipelines', 'read'),
  PipelineController.listStages.bind(PipelineController)
);

// Create stage
router.post('/:id/stages',
  auth,
  checkPermission('pipelines', 'create'),
  validate.body({
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    description: { type: 'string' },
    probability: { type: 'number', min: 0, max: 100 },
    displayOrder: { type: 'number', min: 0 },
    color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    isClosedWon: { type: 'boolean' },
    isClosedLost: { type: 'boolean' }
  }),
  PipelineController.createStage.bind(PipelineController)
);

/**
 * Stage Routes
 */

// Get stage by ID
router.get('/stages/:id',
  auth,
  checkPermission('pipelines', 'read'),
  PipelineController.getStage.bind(PipelineController)
);

// Update stage
router.put('/stages/:id',
  auth,
  checkPermission('pipelines', 'update'),
  validate.body({
    name: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string' },
    probability: { type: 'number', min: 0, max: 100 },
    displayOrder: { type: 'number', min: 0 },
    color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    isClosedWon: { type: 'boolean' },
    isClosedLost: { type: 'boolean' }
  }),
  PipelineController.updateStage.bind(PipelineController)
);

// Delete stage
router.delete('/stages/:id',
  auth,
  checkPermission('pipelines', 'delete'),
  PipelineController.deleteStage.bind(PipelineController)
);

module.exports = router;
