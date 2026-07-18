const segmentationService = require('../services/segmentationService');

/**
 * Customer Segmentation Engine Controller
 * Handles HTTP requests for segment management, calculation, and analytics
 */

// ==================== SEGMENTS ====================

async function createSegment(req, res) {
  try {
    const segment = await segmentationService.createSegment(
      req.user.orgId,
      req.user.id,
      req.body
    );
    res.status(201).json({ segment });
  } catch (error) {
    console.error('Error creating segment:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getSegments(req, res) {
  try {
    const { is_active, limit, offset } = req.query;
    const segments = await segmentationService.getSegments(req.user.orgId, {
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    res.json({ segments });
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getSegment(req, res) {
  try {
    const segment = await segmentationService.getSegment(
      req.user.orgId,
      req.params.id
    );
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.json({ segment });
  } catch (error) {
    console.error('Error fetching segment:', error);
    res.status(500).json({ error: error.message });
  }
}

async function updateSegment(req, res) {
  try {
    const segment = await segmentationService.updateSegment(
      req.user.orgId,
      req.params.id,
      req.body
    );
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.json({ segment });
  } catch (error) {
    console.error('Error updating segment:', error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteSegment(req, res) {
  try {
    await segmentationService.deleteSegment(req.user.orgId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({ error: error.message });
  }
}

// ==================== SEGMENT CALCULATION ====================

async function calculateSegment(req, res) {
  try {
    const result = await segmentationService.calculateSegmentMembers(
      req.user.orgId,
      req.params.id
    );
    res.json(result);
  } catch (error) {
    console.error('Error calculating segment:', error);
    res.status(500).json({ error: error.message });
  }
}

async function previewSegment(req, res) {
  try {
    const { criteria, limit } = req.body;
    const contacts = await segmentationService.previewSegment(
      req.user.orgId,
      criteria,
      limit ? parseInt(limit) : 100
    );
    res.json({ contacts, count: contacts.length });
  } catch (error) {
    console.error('Error previewing segment:', error);
    res.status(500).json({ error: error.message });
  }
}

// ==================== SEGMENT MEMBERS ====================

async function getSegmentMembers(req, res) {
  try {
    const { limit, offset } = req.query;
    const members = await segmentationService.getSegmentMembers(
      req.user.orgId,
      req.params.id,
      {
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0
      }
    );
    res.json({ members });
  } catch (error) {
    console.error('Error fetching segment members:', error);
    res.status(500).json({ error: error.message });
  }
}

// ==================== ANALYTICS ====================

async function getSegmentAnalytics(req, res) {
  try {
    const { start_date, end_date } = req.query;
    const analytics = await segmentationService.getSegmentAnalytics(
      req.user.orgId,
      req.params.id,
      { start_date, end_date }
    );
    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching segment analytics:', error);
    res.status(500).json({ error: error.message });
  }
}

// ==================== TEMPLATES ====================

async function getTemplates(req, res) {
  try {
    const { include_system } = req.query;
    const templates = await segmentationService.getTemplates(
      include_system !== 'false'
    );
    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
  }
}

async function createFromTemplate(req, res) {
  try {
    const { template_id, name } = req.body;
    const segment = await segmentationService.createFromTemplate(
      req.user.orgId,
      req.user.id,
      template_id,
      name
    );
    res.status(201).json({ segment });
  } catch (error) {
    console.error('Error creating segment from template:', error);
    res.status(500).json({ error: error.message });
  }
}

// ==================== BULK OPERATIONS ====================

async function bulkDelete(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    for (const id of ids) {
      await segmentationService.deleteSegment(req.user.orgId, id);
    }

    res.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('Error bulk deleting segments:', error);
    res.status(500).json({ error: error.message });
  }
}

async function exportSegment(req, res) {
  try {
    const members = await segmentationService.getSegmentMembers(
      req.user.orgId,
      req.params.id,
      { limit: 10000, offset: 0 }
    );

    // Convert to CSV
    const csv = [
      ['Name', 'Email', 'Status', 'Created At'].join(','),
      ...members.map(m => [
        m.name || '',
        m.email || '',
        m.status || '',
        m.created_at || ''
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=segment-${req.params.id}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting segment:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  // Segments
  createSegment,
  getSegments,
  getSegment,
  updateSegment,
  deleteSegment,
  
  // Calculation
  calculateSegment,
  previewSegment,
  
  // Members
  getSegmentMembers,
  
  // Analytics
  getSegmentAnalytics,
  
  // Templates
  getTemplates,
  createFromTemplate,
  
  // Bulk operations
  bulkDelete,
  exportSegment
};
