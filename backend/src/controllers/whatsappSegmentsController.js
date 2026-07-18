const WhatsAppSegmentationService = require('../services/whatsapp/WhatsAppSegmentationService');

/**
 * WhatsApp Segments Controller
 * 
 * Handles dynamic contact segmentation for WhatsApp Marketing.
 * Supports complex filtering with multiple condition types.
 */

/**
 * Create a new segment
 */
async function createSegment(req, res) {
  try {
    const segment = await WhatsAppSegmentationService.createSegment(req.user.orgId, req.body);
    res.status(201).json({ segment });
  } catch (error) {
    console.error('Error creating WhatsApp segment:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * List all segments
 */
async function listSegments(req, res) {
  try {
    const segments = await WhatsAppSegmentationService.listSegments(req.user.orgId);
    res.json({ segments });
  } catch (error) {
    console.error('Error listing WhatsApp segments:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get segment by ID
 */
async function getSegment(req, res) {
  try {
    const segment = await WhatsAppSegmentationService.getSegment(req.user.orgId, req.params.id);
    res.json({ segment });
  } catch (error) {
    console.error('Error getting WhatsApp segment:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Update segment
 */
async function updateSegment(req, res) {
  try {
    const segment = await WhatsAppSegmentationService.updateSegment(
      req.user.orgId,
      req.params.id,
      req.body
    );
    res.json({ segment });
  } catch (error) {
    console.error('Error updating WhatsApp segment:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Delete segment
 */
async function deleteSegment(req, res) {
  try {
    await WhatsAppSegmentationService.deleteSegment(req.user.orgId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting WhatsApp segment:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Get contacts matching segment
 */
async function getSegmentContacts(req, res) {
  try {
    const { limit, offset } = req.query;
    const contacts = await WhatsAppSegmentationService.getSegmentContacts(
      req.user.orgId,
      req.params.id,
      {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      }
    );
    res.json({ contacts });
  } catch (error) {
    console.error('Error getting segment contacts:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Recalculate segment contact count
 */
async function recalculateSegment(req, res) {
  try {
    const count = await WhatsAppSegmentationService.recalculateSegment(
      req.user.orgId,
      req.params.id
    );
    res.json({ count });
  } catch (error) {
    console.error('Error recalculating segment:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Recalculate all segments
 */
async function recalculateAllSegments(req, res) {
  try {
    const result = await WhatsAppSegmentationService.recalculateAllSegments(req.user.orgId);
    res.json(result);
  } catch (error) {
    console.error('Error recalculating all segments:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createSegment,
  listSegments,
  getSegment,
  updateSegment,
  deleteSegment,
  getSegmentContacts,
  recalculateSegment,
  recalculateAllSegments
};
