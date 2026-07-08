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
} = require('../controllers/customFieldsController');

router.use(requireAuth);

router.get('/:recordType', listDefinitions);
router.post('/:recordType', createDefinition);
router.patch('/:recordType/:id', updateDefinition);
router.delete('/:recordType/:id', deleteDefinition);

router.get('/:recordType/values/:recordId', getRecordValues);
router.put('/:recordType/values/:recordId', setRecordValues);

module.exports = router;
