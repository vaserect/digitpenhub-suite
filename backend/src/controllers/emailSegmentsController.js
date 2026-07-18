const SegmentationService = require('../services/email/SegmentationService');
const { validate } = require('../utils/validator');

const segmentationService = new SegmentationService();

/**
 * List all segments
 */
async function listSegments(req, res) {
  try {
    const { listId } = req.query;
    const segments = await segmentationService.listSegments(req.user.orgId, listId || null);
    res.json({ segments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get segment details
 */
async function getSegment(req, res) {
  try {
    const segment = await segmentationService.getSegment(req.params.id, req.user.orgId);
    res.json({ segment });
  } catch (err) {
    if (err.message === 'Segment not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}

/**
 * Create a new segment
 */
async function createSegment(req, res) {
  try {
    const { error } = validate(req.body, {
      name: { required: true, type: 'string', minLength: 1 },
      description: { type: 'string' },
      listId: { type: 'string' },
      conditions: { required: true, type: 'array', minLength: 1 },
      matchType: { type: 'string', enum: ['all', 'any'] }
    });

    if (error) {
      return res.status(400).json({ error });
    }

    const segment = await segmentationService.createSegment(req.user.orgId, req.body);
    res.status(201).json({ segment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Update segment
 */
async function updateSegment(req, res) {
  try {
    const segment = await segmentationService.updateSegment(
      req.params.id,
      req.user.orgId,
      req.body
    );
    res.json({ segment });
  } catch (err) {
    if (err.message === 'Segment not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
}

/**
 * Delete segment
 */
async function deleteSegment(req, res) {
  try {
    await segmentationService.deleteSegment(req.params.id, req.user.orgId);
    res.json({ ok: true });
  } catch (err) {
    if (err.message === 'Segment not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}

/**
 * Recalculate segment membership
 */
async function recalculateSegment(req, res) {
  try {
    const count = await segmentationService.recalculateSegment(req.params.id, req.user.orgId);
    res.json({ ok: true, subscriber_count: count });
  } catch (err) {
    if (err.message === 'Segment not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get segment members
 */
async function getSegmentMembers(req, res) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await segmentationService.getSegmentMembers(
      req.params.id,
      req.user.orgId,
      { limit: parseInt(limit, 10), offset: parseInt(offset, 10) }
    );
    res.json(result);
  } catch (err) {
    if (err.message === 'Segment not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listSegments,
  getSegment,
  createSegment,
  updateSegment,
  deleteSegment,
  recalculateSegment,
  getSegmentMembers
};
