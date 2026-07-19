const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/customFieldsController');
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
} = controller;

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

// Analytics routes
router.get('/analytics/overall', controller.getOverallStats);
router.get('/analytics/:recordType', controller.getFieldAnalytics);

// Validation rule routes
router.get('/validation-templates', controller.listValidationTemplates);
router.post('/:fieldId/validation-rules', controller.addValidationRule);
router.delete('/:fieldId/validation-rules/:ruleId', controller.removeValidationRule);

module.exports = router;

// Import/Export routes
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const importExportController = require('../controllers/customFieldsImportExport');

router.get('/export', importExportController.exportFields);
router.post('/import', upload.single('file'), importExportController.importFields);

module.exports = router;

// Usage Analytics routes
const usageTracker = require('../utils/fieldUsageTracker');

router.get('/usage/stats/:recordType', async (req, res) => {
  try {
    const { recordType } = req.params;
    const { days = 30 } = req.query;
    const stats = await usageTracker.getFieldUsageStats(req.user.orgId, recordType, parseInt(days));
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/usage/summary', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const summary = await usageTracker.getUsageSummary(req.user.orgId, parseInt(days));
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/usage/unused/:recordType', async (req, res) => {
  try {
    const { recordType } = req.params;
    const { days = 30 } = req.query;
    const unused = await usageTracker.getUnusedFields(req.user.orgId, recordType, parseInt(days));
    res.json({ unused });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/usage/trend/:recordType/:fieldKey', async (req, res) => {
  try {
    const { recordType, fieldKey } = req.params;
    const { days = 30 } = req.query;
    const trend = await usageTracker.getFieldUsageTrend(req.user.orgId, recordType, fieldKey, parseInt(days));
    res.json({ trend });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
