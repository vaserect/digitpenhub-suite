const SMSConversationService = require('../services/sms/SMSConversationService');

async function listConversations(req, res) {
  try {
    const { status, search, limit } = req.query;
    const conversations = await SMSConversationService.listConversations(req.user.orgId, {
      status,
      search,
      limit: limit ? parseInt(limit) : undefined
    });
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getConversation(req, res) {
  try {
    const conversation = await SMSConversationService.getConversation(req.params.id, req.user.orgId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getMessages(req, res) {
  try {
    const { limit, offset } = req.query;
    const messages = await SMSConversationService.getMessages(
      req.params.id,
      req.user.orgId,
      {
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      }
    );
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function sendMessage(req, res) {
  try {
    const { message_body, media_urls } = req.body || {};
    
    if (!message_body?.trim()) {
      return res.status(400).json({ error: 'message_body required' });
    }
    
    const message = await SMSConversationService.sendMessage(
      req.user.orgId,
      req.params.id,
      {
        message_body: message_body.trim(),
        media_urls: media_urls || []
      }
    );
    
    res.status(201).json({ message });
  } catch (error) {
    if (error.message === 'Conversation not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function updateConversationStatus(req, res) {
  try {
    const { status } = req.body || {};
    
    if (!status) {
      return res.status(400).json({ error: 'status required' });
    }
    
    const conversation = await SMSConversationService.updateConversationStatus(
      req.params.id,
      req.user.orgId,
      status
    );
    
    res.json({ conversation });
  } catch (error) {
    if (error.message === 'Conversation not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function searchMessages(req, res) {
  try {
    const { query, conversation_id, date_from, date_to, limit } = req.query;
    
    const messages = await SMSConversationService.searchMessages(req.user.orgId, {
      query,
      conversation_id,
      date_from,
      date_to,
      limit: limit ? parseInt(limit) : 50
    });
    
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getConversationStats(req, res) {
  try {
    const stats = await SMSConversationService.getConversationStats(req.user.orgId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function processInbound(req, res) {
  try {
    const { from, to, body, media_urls, provider_id } = req.body || {};
    
    if (!from || !body) {
      return res.status(400).json({ error: 'from and body required' });
    }
    
    const result = await SMSConversationService.processInboundMessage(req.user.orgId, {
      from,
      to,
      body,
      media_urls: media_urls || [],
      provider_id
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function markDelivered(req, res) {
  try {
    const { provider_id } = req.body || {};
    
    if (!provider_id) {
      return res.status(400).json({ error: 'provider_id required' });
    }
    
    await SMSConversationService.markDelivered(provider_id, req.user.orgId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function markFailed(req, res) {
  try {
    const { provider_id, error_message } = req.body || {};
    
    if (!provider_id) {
      return res.status(400).json({ error: 'provider_id required' });
    }
    
    await SMSConversationService.markFailed(provider_id, req.user.orgId, error_message);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listConversations,
  getConversation,
  getMessages,
  sendMessage,
  updateConversationStatus,
  searchMessages,
  getConversationStats,
  processInbound,
  markDelivered,
  markFailed
};
