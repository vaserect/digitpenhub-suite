const SMSSegmentationService = require('../services/sms/SMSSegmentationService');

async function listSegments(req, res) {
  try {
    const segments = await SMSSegmentationService.listSegments(req.user.orgId);
    res.json({ segments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getSegment(req, res) {
  try {
    const segment = await SMSSegmentationService.getSegment(req.params.id, req.user.orgId);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.json({ segment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createSegment(req, res) {
  try {
    const { name, description, conditions, is_dynamic } = req.body || {};
    
    if (!name?.trim()) {
      return res.status(400).json({ error: 'name required' });
    }
    
    if (!Array.isArray(conditions)) {
      return res.status(400).json({ error: 'conditions must be an array' });
    }
    
    const segment = await SMSSegmentationService.createSegment(req.user.orgId, {
      name: name.trim(),
      description,
      conditions,
      is_dynamic: is_dynamic !== false // Default to true
    });
    
    res.status(201).json({ segment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateSegment(req, res) {
  try {
    const { name, description, conditions, is_dynamic } = req.body || {};
    
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (conditions !== undefined) updates.conditions = conditions;
    if (is_dynamic !== undefined) updates.is_dynamic = is_dynamic;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    
    const segment = await SMSSegmentationService.updateSegment(
      req.params.id,
      req.user.orgId,
      updates
    );
    
    res.json({ segment });
  } catch (error) {
    if (error.message === 'Segment not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function deleteSegment(req, res) {
  try {
    await SMSSegmentationService.deleteSegment(req.params.id, req.user.orgId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function recalculateSegment(req, res) {
  try {
    const memberCount = await SMSSegmentationService.recalculateSegment(req.params.id);
    res.json({ ok: true, memberCount });
  } catch (error) {
    if (error.message === 'Segment not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function getSegmentMembers(req, res) {
  try {
    const members = await SMSSegmentationService.getSegmentMembers(
      req.params.id,
      req.user.orgId
    );
    res.json({ members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function addContactToSegment(req, res) {
  try {
    const { contactId } = req.body || {};
    
    if (!contactId) {
      return res.status(400).json({ error: 'contactId required' });
    }
    
    await SMSSegmentationService.addContactToSegment(
      req.params.id,
      contactId,
      req.user.orgId
    );
    
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'Segment not found' || error.message.includes('Cannot manually add')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function removeContactFromSegment(req, res) {
  try {
    const { contactId } = req.body || {};
    
    if (!contactId) {
      return res.status(400).json({ error: 'contactId required' });
    }
    
    await SMSSegmentationService.removeContactFromSegment(
      req.params.id,
      contactId,
      req.user.orgId
    );
    
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'Segment not found' || error.message.includes('Cannot manually remove')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listSegments,
  getSegment,
  createSegment,
  updateSegment,
  deleteSegment,
  recalculateSegment,
  getSegmentMembers,
  addContactToSegment,
  removeContactFromSegment
};
