const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { listFunnels, getFunnel, createFunnel, updateFunnel, deleteFunnel, addStep, removeStep, reorderSteps } = require('../controllers/funnelsController');

const router = Router();
router.use(requireAuth);

router.get('/', listFunnels);
router.get('/:id', getFunnel);
router.post('/', createFunnel);
router.put('/:id', updateFunnel);
router.delete('/:id', deleteFunnel);
router.post('/bulk-delete', bulkDeleteHandler('funnels'));

router.post('/:id/steps', addStep);
router.delete('/:id/steps/:stepId', removeStep);
router.put('/:id/steps/reorder', reorderSteps);

module.exports = router;
