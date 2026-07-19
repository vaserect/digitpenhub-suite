const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
} = require('../controllers/customFieldsController');

router.use(requireAuth);

router.get('/:recordType', listDefinitions);
router.post('/:recordType', createDefinition);
router.patch('/:recordType/:id', updateDefinition);
router.delete('/:recordType/:id', deleteDefinition);

router.get('/:recordType/values/:recordId', getRecordValues);
router.put('/:recordType/values/:recordId', setRecordValues);

router.get('/:recordType/records', getRecordsWithFields);
router.patch('/:recordType/bulk-values', bulkSetValues);
router.get('/:recordType/export', exportRecordsCsv);

module.exports = router;

// Template routes
router.get('/templates', controller.listTemplates);
router.post('/templates/:templateId/apply', controller.applyTemplate);
