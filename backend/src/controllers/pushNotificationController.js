const pushNotificationService = require('../services/pushNotificationService');

/**
 * Push Notification Marketing Controller
 * Handles HTTP requests for push notification campaigns, subscribers, and analytics
 */

// ==================== CAMPAIGNS ====================

async function createCampaign(req, res) {
  try {
    const campaign = await pushNotificationService.createCampaign(
      req.user.orgId,
      req.user.id,
      req.body
    );
    res.status(201).json({ campaign });
  } catch (error) {
    console.error('Error creating push campaign:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getCampaigns(req, res) {
  try {
    const { status, type, limit, offset } = req.query;
    const campaigns = await pushNotificationService.getCampaigns(req.user.orgId, {
      status,
      type,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    res.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getCampaign(req, res) {
  try {
    const campaign = await pushNotificationService.getCampaign(
      req.user.orgId,
      req.params.id
    );
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ campaign });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: error.message });
  }
}

async function updateCampaign(req, res) {
  try {
    const campaign = await pushNotificationService.updateCampaign(
      req.user.orgId,
      req.params.id,
      req.body
    );
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteCampaign(req, res) {
  try {
    await pushNotificationService.deleteCampaign(req.user.orgId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: error.message });
  }
}

async function sendCampaign(req, res) {
  try {
    const result = await pushNotificationService.sendCampaign(
      req.user.orgId,
      req.params.id
    );
    res.json(result);
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ error: error.message });
  }
}

// ==================== SUBSCRIBERS ====================

async function subscribe(req, res) {
  try {
    const subscriber = await pushNotificationService.subscribe(
      req.user.orgId,
      req.body
    );
    res.status(201).json({ subscriber });
  } catch (error) {
    console.error('Error subscribing device:', error);
    res.status(500).json({ error: error.message });
  }
}

async function unsubscribe(req, res) {
  try {
    await pushNotificationService.unsubscribe(req.user.orgId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing device:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getSubscribers(req, res) {
  try {
    const { platform, is_active, limit, offset } = req.query;
    const subscribers = await pushNotificationService.getSubscribers(req.user.orgId, {
      platform,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    res.json({ subscribers });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getSubscriberCount(req, res) {
  try {
    const { platform, is_active } = req.query;
    const count = await pushNotificationService.getSubscriberCount(req.user.orgId, {
      platform,
      is_active: is_active !== undefined ? is_active === 'true' : undefined
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching subscriber count:', error);
    res.status(500).json({ error: error.message });
  }
}

// ==================== ANALYTICS ====================

async function getCampaignAnalytics(req, res) {
  try {
    const { start_date, end_date } = req.query;
    const analytics = await pushNotificationService.getCampaignAnalytics(
      req.user.orgId,
      req.params.id,
      { start_date, end_date }
    );
    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getAnalyticsSummary(req, res) {
  try {
    const { start_date, end_date } = req.query;
    const summary = await pushNotificationService.getAnalyticsSummary(
      req.user.orgId,
      { start_date, end_date }
    );
    res.json({ summary });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: error.message });
  }
}

async function trackDeliveryEvent(req, res) {
  try {
    const { event_type } = req.body;
    await pushNotificationService.trackDeliveryEvent(req.params.id, event_type);
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking delivery event:', error);
    res.status(500).json({ error: error.message });
  }
}

// ==================== SEGMENTS ====================

async function createSegment(req, res) {
  try {
    const segment = await pushNotificationService.createSegment(
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
    const segments = await pushNotificationService.getSegments(req.user.orgId);
    res.json({ segments });
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ error: error.message });
  }
}

async function updateSegment(req, res) {
  try {
    const segment = await pushNotificationService.updateSegment(
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
    await pushNotificationService.deleteSegment(req.user.orgId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({ error: error.message });
  }
}

// ==================== TEMPLATES ====================

async function getTemplates(req, res) {
  try {
    const { include_system } = req.query;
    const templates = await pushNotificationService.getTemplates(
      req.user.orgId,
      include_system !== 'false'
    );
    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
  }
}

async function createTemplate(req, res) {
  try {
    const template = await pushNotificationService.createTemplate(
      req.user.orgId,
      req.user.id,
      req.body
    );
    res.status(201).json({ template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error.message });
  }
}

// ==================== AUTOMATION TRIGGERS ====================

async function createTrigger(req, res) {
  try {
    const trigger = await pushNotificationService.createTrigger(
      req.user.orgId,
      req.user.id,
      req.body
    );
    res.status(201).json({ trigger });
  } catch (error) {
    console.error('Error creating trigger:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getTriggers(req, res) {
  try {
    const triggers = await pushNotificationService.getTriggers(req.user.orgId);
    res.json({ triggers });
  } catch (error) {
    console.error('Error fetching triggers:', error);
    res.status(500).json({ error: error.message });
  }
}

async function toggleTrigger(req, res) {
  try {
    const { is_active } = req.body;
    const trigger = await pushNotificationService.toggleTrigger(
      req.user.orgId,
      req.params.id,
      is_active
    );
    if (!trigger) {
      return res.status(404).json({ error: 'Trigger not found' });
    }
    res.json({ trigger });
  } catch (error) {
    console.error('Error toggling trigger:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  // Campaigns
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  
  // Subscribers
  subscribe,
  unsubscribe,
  getSubscribers,
  getSubscriberCount,
  
  // Analytics
  getCampaignAnalytics,
  getAnalyticsSummary,
  trackDeliveryEvent,
  
  // Segments
  createSegment,
  getSegments,
  updateSegment,
  deleteSegment,
  
  // Templates
  getTemplates,
  createTemplate,
  
  // Automation
  createTrigger,
  getTriggers,
  toggleTrigger
};
