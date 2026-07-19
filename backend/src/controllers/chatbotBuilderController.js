const ChatbotService = require('../services/chatbot/ChatbotService');
const { generateWithAI } = require('../utils/aiGenerate');

// ==================== FLOW MANAGEMENT ====================

async function getStats(req, res) {
  try {
    const { rows } = await req.db.query(
      `SELECT COUNT(*) AS total, COUNT(*) FILTER(WHERE is_active) AS active,
              COALESCE(SUM(conversations),0) AS total_conversations
       FROM chatbot_flows WHERE org_id=$1`, 
      [req.user.orgId]
    );
    res.json({ stats: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listFlows(req, res) {
  try {
    const { isActive, channel, search } = req.query;
    const flows = await ChatbotService.listFlows(req.user.orgId, {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      channel,
      search
    });
    res.json({ flows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getFlow(req, res) {
  try {
    const flow = await ChatbotService.getFlow(req.user.orgId, req.params.id);
    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    res.json({ flow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createFlow(req, res) {
  try {
    const { name, description, welcomeMessage, triggerKeywords, nodes, channel, language, timezone } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const flow = await ChatbotService.createFlow(req.user.orgId, {
      name: name.trim(),
      description,
      welcomeMessage,
      triggerKeywords,
      nodes,
      channel,
      language,
      timezone
    });

    res.status(201).json({ flow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateFlow(req, res) {
  try {
    const { name, description, welcomeMessage, triggerKeywords, nodes, isActive, channel, fallbackMessage, handoffEnabled, aiEnabled, language, timezone } = req.body;

    const flow = await ChatbotService.updateFlow(req.user.orgId, req.params.id, {
      name,
      description,
      welcomeMessage,
      triggerKeywords,
      nodes,
      isActive,
      channel,
      fallbackMessage,
      handoffEnabled,
      aiEnabled,
      language,
      timezone
    });

    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    res.json({ flow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteFlow(req, res) {
  try {
    await ChatbotService.deleteFlow(req.user.orgId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function duplicateFlow(req, res) {
  try {
    const flow = await ChatbotService.duplicateFlow(req.user.orgId, req.params.id);
    res.status(201).json({ flow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function activateFlow(req, res) {
  try {
    const flow = await ChatbotService.activateFlow(req.user.orgId, req.params.id);
    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    res.json({ flow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deactivateFlow(req, res) {
  try {
    const flow = await ChatbotService.deactivateFlow(req.user.orgId, req.params.id);
    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    res.json({ flow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getFlowStats(req, res) {
  try {
    const stats = await ChatbotService.getFlowStats(req.user.orgId, req.params.id);
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== CONVERSATION MANAGEMENT ====================

async function startConversation(req, res) {
  try {
    const { flowId, visitorId, channel } = req.body;
    if (!flowId || !visitorId) {
      return res.status(400).json({ error: 'flowId and visitorId are required' });
    }

    const conversation = await ChatbotService.startConversation(
      req.user.orgId,
      flowId,
      visitorId,
      channel
    );

    res.status(201).json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function continueConversation(req, res) {
  try {
    const { nodeId, userMessage } = req.body;
    if (!nodeId) {
      return res.status(400).json({ error: 'nodeId is required' });
    }

    const result = await ChatbotService.continueConversation(
      req.user.orgId,
      req.params.id,
      nodeId,
      userMessage
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function endConversation(req, res) {
  try {
    const { status } = req.body;
    const conversation = await ChatbotService.endConversation(
      req.user.orgId,
      req.params.id,
      status
    );

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getConversation(req, res) {
  try {
    const conversation = await ChatbotService.getConversation(req.user.orgId, req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getConversationHistory(req, res) {
  try {
    const messages = await ChatbotService.getConversationHistory(req.user.orgId, req.params.id);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listConversations(req, res) {
  try {
    const { flowId, status, channel, search, limit, offset } = req.query;
    const conversations = await ChatbotService.listConversations(req.user.orgId, {
      flowId,
      status,
      channel,
      search,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function searchConversations(req, res) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query (q) is required' });

    const conversations = await ChatbotService.searchConversations(req.user.orgId, q);
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== MESSAGE HANDLING ====================

async function sendMessage(req, res) {
  try {
    const { conversationId, nodeId, content, mediaUrl, mediaType, buttons, metadata } = req.body;
    if (!conversationId || !content) {
      return res.status(400).json({ error: 'conversationId and content are required' });
    }

    const message = await ChatbotService.saveMessage(
      conversationId,
      nodeId,
      'bot',
      content,
      { mediaUrl, mediaType, buttons, metadata }
    );

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function processNode(req, res) {
  try {
    const { conversationId, node, userInput } = req.body;
    if (!conversationId || !node) {
      return res.status(400).json({ error: 'conversationId and node are required' });
    }

    const response = await ChatbotService.processNode(
      req.user.orgId,
      conversationId,
      node,
      userInput
    );

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== VISITOR MANAGEMENT ====================

async function identifyVisitor(req, res) {
  try {
    const { externalId, name, email, phone, attributes } = req.body;
    if (!externalId) {
      return res.status(400).json({ error: 'externalId is required' });
    }

    const visitor = await ChatbotService.identifyVisitor(req.user.orgId, externalId, {
      name,
      email,
      phone,
      attributes
    });

    res.json({ visitor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getVisitorProfile(req, res) {
  try {
    const visitor = await ChatbotService.getVisitorProfile(req.user.orgId, req.params.id);
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    res.json({ visitor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function setVisitorAttribute(req, res) {
  try {
    const { key, value, type } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'key and value are required' });
    }

    await ChatbotService.setVisitorAttribute(req.params.id, key, value, type);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function addVisitorTag(req, res) {
  try {
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ error: 'tag is required' });

    await ChatbotService.addVisitorTag(req.params.id, tag);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function removeVisitorTag(req, res) {
  try {
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ error: 'tag is required' });

    await ChatbotService.removeVisitorTag(req.params.id, tag);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== TEMPLATE MANAGEMENT ====================

async function listTemplates(req, res) {
  try {
    const { category } = req.query;
    const templates = await ChatbotService.listTemplates(req.user.orgId, category);
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getTemplate(req, res) {
  try {
    const template = await ChatbotService.getTemplate(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createFromTemplate(req, res) {
  try {
    const { name } = req.body;
    const flow = await ChatbotService.createFromTemplate(req.user.orgId, req.params.id, name);
    res.status(201).json({ flow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function saveAsTemplate(req, res) {
  try {
    const { name, description, category, thumbnailUrl } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const template = await ChatbotService.saveAsTemplate(req.user.orgId, req.params.id, {
      name,
      description,
      category,
      thumbnailUrl
    });

    res.status(201).json({ template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== ANALYTICS ====================

async function getFlowAnalytics(req, res) {
  try {
    const { dateRange } = req.query;
    const analytics = await ChatbotService.getFlowAnalytics(
      req.user.orgId,
      req.params.id,
      dateRange ? parseInt(dateRange) : undefined
    );

    res.json({ analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getNodeAnalytics(req, res) {
  try {
    const { dateRange } = req.query;
    const analytics = await ChatbotService.getNodeAnalytics(
      req.user.orgId,
      req.params.id,
      dateRange ? parseInt(dateRange) : undefined
    );

    res.json({ analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getConversationMetrics(req, res) {
  try {
    const { flowId } = req.query;
    const metrics = await ChatbotService.getConversationMetrics(req.user.orgId, flowId);
    res.json({ metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== BROADCASTS ====================

async function createBroadcast(req, res) {
  try {
    const { flowId, name, message, mediaUrl, targetSegment, scheduledAt } = req.body;
    if (!name || !message) {
      return res.status(400).json({ error: 'name and message are required' });
    }

    const broadcast = await ChatbotService.createBroadcast(req.user.orgId, {
      flowId,
      name,
      message,
      mediaUrl,
      targetSegment,
      scheduledAt
    });

    res.status(201).json({ broadcast });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function sendBroadcast(req, res) {
  try {
    const result = await ChatbotService.sendBroadcast(req.user.orgId, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== AI GENERATION ====================

async function generateReply(req, res) {
  try {
    const { intent } = req.body;
    if (!intent?.trim()) return res.status(400).json({ error: 'intent required' });

    const result = await generateWithAI({
      orgId: req.user.orgId,
      feature: 'chatbot-builder:generate-reply',
      systemPrompt: 'You are a helpful customer-facing chatbot. Write a short, friendly reply (2-4 sentences, no markdown) matching the given user intent/trigger.',
      userPrompt: `User intent / trigger: ${intent.trim()}`,
      fallback: `Thanks for reaching out about "${intent.trim()}"! [Write a short reply here — ANTHROPIC_API_KEY isn't configured, so this is a plain placeholder rather than an AI draft.]`
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== WIDGET SETTINGS ====================

async function getWidgetSettings(req, res) {
  try {
    const { rows } = await req.db.query(
      `SELECT * FROM chatbot_widget_settings WHERE org_id = $1`,
      [req.user.orgId]
    );

    if (!rows.length) {
      // Create default settings
      const { rows: newSettings } = await req.db.query(
        `INSERT INTO chatbot_widget_settings (org_id) VALUES ($1) RETURNING *`,
        [req.user.orgId]
      );
      return res.json({ settings: newSettings[0] });
    }

    res.json({ settings: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateWidgetSettings(req, res) {
  try {
    const { position, color, greeting, avatarUrl, showBranding, offlineMessage, customCss } = req.body;

    const { rows } = await req.db.query(
      `UPDATE chatbot_widget_settings SET
         position = COALESCE($2, position),
         color = COALESCE($3, color),
         greeting = COALESCE($4, greeting),
         avatar_url = COALESCE($5, avatar_url),
         show_branding = COALESCE($6, show_branding),
         offline_message = COALESCE($7, offline_message),
         custom_css = COALESCE($8, custom_css),
         updated_at = NOW()
       WHERE org_id = $1
       RETURNING *`,
      [req.user.orgId, position, color, greeting, avatarUrl, showBranding, offlineMessage, customCss]
    );

    if (!rows.length) return res.status(404).json({ error: 'Settings not found' });
    res.json({ settings: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== HANDOFFS ====================

async function listHandoffs(req, res) {
  try {
    const { status } = req.query;
    let query = `SELECT h.*, c.flow_id, v.name as visitor_name, v.email as visitor_email
                 FROM chatbot_handoffs h
                 JOIN chatbot_conversations c ON c.id = h.conversation_id
                 JOIN chatbot_visitors v ON v.id = c.visitor_id
                 WHERE c.org_id = $1`;
    const params = [req.user.orgId];

    if (status) {
      query += ` AND h.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY h.requested_at DESC`;

    const { rows } = await req.db.query(query, params);
    res.json({ handoffs: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function acceptHandoff(req, res) {
  try {
    const { rows } = await req.db.query(
      `UPDATE chatbot_handoffs SET
         status = 'accepted',
         agent_id = $3,
         accepted_at = NOW()
       WHERE id = $1 AND conversation_id IN (
         SELECT id FROM chatbot_conversations WHERE org_id = $2
       )
       RETURNING *`,
      [req.params.id, req.user.orgId, req.user.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Handoff not found' });
    res.json({ handoff: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function resolveHandoff(req, res) {
  try {
    const { notes } = req.body;

    const { rows } = await req.db.query(
      `UPDATE chatbot_handoffs SET
         status = 'resolved',
         resolved_at = NOW(),
         notes = COALESCE($3, notes)
       WHERE id = $1 AND conversation_id IN (
         SELECT id FROM chatbot_conversations WHERE org_id = $2
       )
       RETURNING *`,
      [req.params.id, req.user.orgId, notes]
    );

    if (!rows.length) return res.status(404).json({ error: 'Handoff not found' });
    res.json({ handoff: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  // Flow Management
  getStats,
  listFlows,
  getFlow,
  createFlow,
  updateFlow,
  deleteFlow,
  duplicateFlow,
  activateFlow,
  deactivateFlow,
  getFlowStats,
  
  // Conversation Management
  startConversation,
  continueConversation,
  endConversation,
  getConversation,
  getConversationHistory,
  listConversations,
  searchConversations,
  
  // Message Handling
  sendMessage,
  processNode,
  
  // Visitor Management
  identifyVisitor,
  getVisitorProfile,
  setVisitorAttribute,
  addVisitorTag,
  removeVisitorTag,
  
  // Template Management
  listTemplates,
  getTemplate,
  createFromTemplate,
  saveAsTemplate,
  
  // Analytics
  getFlowAnalytics,
  getNodeAnalytics,
  getConversationMetrics,
  
  // Broadcasts
  createBroadcast,
  sendBroadcast,
  
  // AI Generation
  generateReply,
  
  // Widget Settings
  getWidgetSettings,
  updateWidgetSettings,
  
  // Handoffs
  listHandoffs,
  acceptHandoff,
  resolveHandoff
};
