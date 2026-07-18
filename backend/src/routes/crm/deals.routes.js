// backend/src/routes/crm/deals.js
// Phase 1 Implementation: Deal Routes
// Date: 2026-07-16

const express = require('express');
const router = express.Router();
const DealController = require('../../controllers/crm/DealController');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { checkPermission } = require('../../middleware/rbac');

/**
 * Deal Routes
 * All routes require authentication
 */

// List deals
router.get('/',
  auth,
  checkPermission('deals', 'read'),
  DealController.list.bind(DealController)
);

// Get pipeline metrics
router.get('/metrics/pipeline',
  auth,
  checkPermission('deals', 'read'),
  DealController.getPipelineMetrics.bind(DealController)
);

// Get forecast
router.get('/forecast',
  auth,
  checkPermission('deals', 'read'),
  DealController.getForecast.bind(DealController)
);

// Get deal by ID
router.get('/:id',
  auth,
  checkPermission('deals', 'read'),
  DealController.getById.bind(DealController)
);

// Create deal
router.post('/',
  auth,
  checkPermission('deals', 'create'),
  validate.body({
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    pipelineId: { type: 'string', required: true, format: 'uuid' },
    stageId: { type: 'string', required: true, format: 'uuid' },
    contactId: { type: 'string', format: 'uuid' },
    companyId: { type: 'string', format: 'uuid' },
    amount: { type: 'number', min: 0 },
    currency: { type: 'string', maxLength: 3 },
    expectedCloseDate: { type: 'string', format: 'date' },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    customFields: { type: 'object' },
    ownerId: { type: 'string', format: 'uuid' },
    source: { type: 'string', maxLength: 100 }
  }),
  DealController.create.bind(DealController)
);

// Update deal
router.put('/:id',
  auth,
  checkPermission('deals', 'update'),
  validate.body({
    name: { type: 'string', minLength: 1, maxLength: 255 },
    contactId: { type: 'string', format: 'uuid' },
    companyId: { type: 'string', format: 'uuid' },
    stageId: { type: 'string', format: 'uuid' },
    amount: { type: 'number', min: 0 },
    currency: { type: 'string', maxLength: 3 },
    expectedCloseDate: { type: 'string', format: 'date' },
    actualCloseDate: { type: 'string', format: 'date' },
    status: { type: 'string', enum: ['open', 'won', 'lost', 'abandoned'] },
    lostReason: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    customFields: { type: 'object' },
    ownerId: { type: 'string', format: 'uuid' },
    source: { type: 'string', maxLength: 100 }
  }),
  DealController.update.bind(DealController)
);

// Update deal stage
router.put('/:id/stage',
  auth,
  checkPermission('deals', 'update'),
  validate.body({
    stageId: { type: 'string', required: true, format: 'uuid' }
  }),
  DealController.updateStage.bind(DealController)
);

// Delete deal
router.delete('/:id',
  auth,
  checkPermission('deals', 'delete'),
  DealController.delete.bind(DealController)
);

// Get deal products
router.get('/:id/products',
  auth,
  checkPermission('deals', 'read'),
  DealController.getProducts.bind(DealController)
);

// Add product to deal
router.post('/:id/products',
  auth,
  checkPermission('deals', 'update'),
  validate.body({
    productId: { type: 'string', format: 'uuid' },
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    description: { type: 'string' },
    quantity: { type: 'number', required: true, min: 1 },
    unitPrice: { type: 'number', required: true, min: 0 },
    discountPercent: { type: 'number', min: 0, max: 100 },
    discountAmount: { type: 'number', min: 0 },
    taxPercent: { type: 'number', min: 0, max: 100 },
    taxAmount: { type: 'number', min: 0 },
    totalPrice: { type: 'number', min: 0 },
    displayOrder: { type: 'number', min: 0 },
    customFields: { type: 'object' }
  }),
  DealController.addProduct.bind(DealController)
);

// Remove product from deal
router.delete('/:id/products/:productId',
  auth,
  checkPermission('deals', 'update'),
  DealController.removeProduct.bind(DealController)
);

module.exports = router;
