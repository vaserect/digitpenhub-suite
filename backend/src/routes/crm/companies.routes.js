// backend/src/routes/crm/companies.js
// Phase 1 Implementation: Company Routes
// Date: 2026-07-16

const express = require('express');
const router = express.Router();
const CompanyController = require('../../controllers/crm/CompanyController');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { checkPermission } = require('../../middleware/rbac');

/**
 * Company Routes
 * All routes require authentication
 */

// Search companies by name
router.get('/search',
  auth,
  checkPermission('companies', 'read'),
  CompanyController.search.bind(CompanyController)
);

// List companies
router.get('/',
  auth,
  checkPermission('companies', 'read'),
  CompanyController.list.bind(CompanyController)
);

// Get company by ID
router.get('/:id',
  auth,
  checkPermission('companies', 'read'),
  CompanyController.getById.bind(CompanyController)
);

// Create company
router.post('/',
  auth,
  checkPermission('companies', 'create'),
  validate.body({
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    legalName: { type: 'string', maxLength: 255 },
    industry: { type: 'string', maxLength: 100 },
    companySize: { 
      type: 'string', 
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+']
    },
    annualRevenue: { type: 'number', min: 0 },
    website: { type: 'string', maxLength: 255 },
    phone: { type: 'string', maxLength: 50 },
    email: { type: 'string', maxLength: 255 },
    billingAddress: { type: 'object' },
    shippingAddress: { type: 'object' },
    taxId: { type: 'string', maxLength: 100 },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    customFields: { type: 'object' },
    ownerId: { type: 'string', format: 'uuid' },
    source: { type: 'string', maxLength: 100 }
  }),
  CompanyController.create.bind(CompanyController)
);

// Update company
router.put('/:id',
  auth,
  checkPermission('companies', 'update'),
  validate.body({
    name: { type: 'string', minLength: 1, maxLength: 255 },
    legalName: { type: 'string', maxLength: 255 },
    industry: { type: 'string', maxLength: 100 },
    companySize: { 
      type: 'string', 
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+']
    },
    annualRevenue: { type: 'number', min: 0 },
    website: { type: 'string', maxLength: 255 },
    phone: { type: 'string', maxLength: 50 },
    email: { type: 'string', maxLength: 255 },
    billingAddress: { type: 'object' },
    shippingAddress: { type: 'object' },
    taxId: { type: 'string', maxLength: 100 },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    customFields: { type: 'object' },
    ownerId: { type: 'string', format: 'uuid' },
    source: { type: 'string', maxLength: 100 }
  }),
  CompanyController.update.bind(CompanyController)
);

// Delete company
router.delete('/:id',
  auth,
  checkPermission('companies', 'delete'),
  CompanyController.delete.bind(CompanyController)
);

// Get company contacts
router.get('/:id/contacts',
  auth,
  checkPermission('companies', 'read'),
  CompanyController.getContacts.bind(CompanyController)
);

// Get company deals
router.get('/:id/deals',
  auth,
  checkPermission('companies', 'read'),
  CompanyController.getDeals.bind(CompanyController)
);

// Get company statistics
router.get('/:id/statistics',
  auth,
  checkPermission('companies', 'read'),
  CompanyController.getStatistics.bind(CompanyController)
);

// Get company health score
router.get('/:id/health-score',
  auth,
  checkPermission('companies', 'read'),
  CompanyController.getHealthScore.bind(CompanyController)
);

// Merge companies
router.post('/:id/merge',
  auth,
  checkPermission('companies', 'update'),
  validate.body({
    targetCompanyId: { type: 'string', required: true, format: 'uuid' }
  }),
  CompanyController.merge.bind(CompanyController)
);

module.exports = router;
