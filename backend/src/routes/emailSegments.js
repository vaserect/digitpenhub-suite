const express = require('express');
const router = express.Router();
const emailSegmentsController = require('../controllers/emailSegmentsController');

// List all segments
router.get('/', emailSegmentsController.listSegments);

// Get segment details
router.get('/:id', emailSegmentsController.getSegment);

// Create new segment
router.post('/', emailSegmentsController.createSegment);

// Update segment
router.patch('/:id', emailSegmentsController.updateSegment);

// Delete segment
router.delete('/:id', emailSegmentsController.deleteSegment);

// Recalculate segment membership
router.post('/:id/recalculate', emailSegmentsController.recalculateSegment);

// Get segment members
router.get('/:id/members', emailSegmentsController.getSegmentMembers);

module.exports = router;
