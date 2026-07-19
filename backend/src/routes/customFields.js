const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  listDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  getRecordValues,
  setRecordValues,
  getRecordsWithFields,
  bulkSetValues,
  exportRecordsCsv,
  listTemplates,
  applyTemplate,
  getAnalytics,
} = require('../controllers/customFieldsController');

router.use(requireAuth);

// Static paths MUST be registered before /:recordType param routes.
router.get('/templates', listTemplates);
router.post('/templates/:templateId/apply', applyTemplate);
router.get('/analytics/summary', getAnalytics);

// Definition CRUD
router.get('/:recordType', listDefinitions);
router.post('/:recordType', createDefinition);
router.patch('/:recordType/:id', updateDefinition);
router.put('/:recordType/:id', updateDefinition); // alias for clients using PUT
router.delete('/:recordType/:id', deleteDefinition);

// Values
router.get('/:recordType/values/:recordId', getRecordValues);
router.put('/:recordType/values/:recordId', setRecordValues);

// Bulk / export / records
router.get('/:recordType/records', getRecordsWithFields);
router.patch('/:recordType/bulk-values', bulkSetValues);
router.get('/:recordType/export', exportRecordsCsv);

module.exports = router;

// Analytics routes
router.get('/analytics/overall', controller.getOverallStats);
router.get('/analytics/:recordType', controller.getFieldAnalytics);

// Validation rule routes
router.get('/validation-templates', controller.listValidationTemplates);
router.post('/:fieldId/validation-rules', controller.addValidationRule);
router.delete('/:fieldId/validation-rules/:ruleId', controller.removeValidationRule);
