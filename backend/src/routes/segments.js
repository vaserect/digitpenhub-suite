const express = require('express');
const router = express.Router();
const segmentationController = require('../controllers/segmentationController');

// ==================== SEGMENTS ====================
router.post('/', segmentationController.createSegment);
router.get('/', segmentationController.getSegments);
router.get('/:id', segmentationController.getSegment);
router.put('/:id', segmentationController.updateSegment);
router.delete('/:id', segmentationController.deleteSegment);

// ==================== CALCULATION ====================
router.post('/:id/calculate', segmentationController.calculateSegment);
router.post('/preview', segmentationController.previewSegment);

// ==================== MEMBERS ====================
router.get('/:id/members', segmentationController.getSegmentMembers);

// ==================== ANALYTICS ====================
router.get('/:id/analytics', segmentationController.getSegmentAnalytics);

// ==================== TEMPLATES ====================
router.get('/templates/list', segmentationController.getTemplates);
router.post('/templates/create-from', segmentationController.createFromTemplate);

// ==================== BULK OPERATIONS ====================
router.post('/bulk-delete', segmentationController.bulkDelete);
router.get('/:id/export', segmentationController.exportSegment);

module.exports = router;
