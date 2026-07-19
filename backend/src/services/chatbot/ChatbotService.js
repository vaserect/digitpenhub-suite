const BaseService = require('../base/BaseService');
const db = require('../../db');
const { generateWithAI } = require('../../utils/aiGenerate');

class ChatbotService extends BaseService {
  constructor() {
    super('chatbot_flows');
  }

  // ==================== FLOW MANAGEMENT ====================

  async createFlow(orgId, data) {
    const { name, description, welcomeMessage, triggerKeywords, nodes, channel, language, timezone } = data;
    
    const { rows } = await db.query(
      `INSERT INTO chatbot_flows 
       (org_id, name, description, welcome_message, trigger_keywords, nodes, channel, language, timezone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        orgId,
        name,
        description || null,
        welcomeMessage || 'Hello! How can I help you today?',
        JSON.stringify(triggerKeywords || []),
        JSON.stringify(nodes || []),
        channel || 'web',
        language || 'en',
        timezone || 'UTC'
      ]
    );

    return rows[0];
  }

  async updateFlow(orgId, flowId, data) {
    const { name, description, welcomeMessage, triggerKeywords, nodes, isActive, channel, fallbackMessage, handoffEnabled, aiEnabled, language, timezone } = data;
    
    const { rows } = await db.query(
      `UPDATE chatbot_flows SET
         name = COALESCE($3, name),
         description = COALESCE($4, description),
         welcome_message = COALESCE($5, welcome_message),
         trigger_keywords = COALESCE($6, trigger_keywords),
         nodes = COALESCE($7, nodes),
         is_active = COALESCE($8, is_active),
         channel = COALESCE($9, channel),
         fallback_message = COALESCE($10, fallback_message),
         handoff_enabled = COALESCE($11, handoff_enabled),
         ai_enabled = COALESCE($12, ai_enabled),
         language = COALESCE($13, language),
         timezone = COALESCE($14, timezone),
         updated_at = NOW()
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [
        flowId, orgId, name, description,
        welcomeMessage,
        triggerKeywords ? JSON.stringify(triggerKeywords) : null,
        nodes ? JSON.stringify(nodes) : null,
        isActive,
        channel,
        fallbackMessage,
        handoffEnabled,
        aiEnabled,
        language,
        timezone
      ]
    );

    return rows[0];
  }

  async getFlow(orgId, flowId) {
    const { rows } = await db.query(
      `SELECT * FROM chatbot_flows WHERE id = $1 AND org_id = $2`,
      [flowId, orgId]
    );
    return rows[0];
  }

  async listFlows(orgId, filters = {}) {
    const { isActive, channel, search } = filters;
    let query = `SELECT 
      id, name, description, welcome_message, trigger_keywords, 
      is_active, conversations, channel, language, created_at, updated_at,
      jsonb_array_length(nodes) AS node_count
      FROM chatbot_flows WHERE org_id = $1`;
    const params = [orgId];
    let paramCount = 1;

    if (isActive !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(isActive);
    }

    if (channel) {
      paramCount++;
      query += ` AND channel = $${paramCount}`;
      params.push(channel);
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY updated_at DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  async deleteFlow(orgId, flowId) {
    await db.query(
      `DELETE FROM chatbot_flows WHERE id = $1 AND org_id = $2`,
      [flowId, orgId]
    );
    return { success: true };
  }

  async duplicateFlow(orgId, flowId) {
    const flow = await this.getFlow(orgId, flowId);
    if (!flow) throw new Error('Flow not found');

    const { rows } = await db.query(
      `INSERT INTO chatbot_flows 
       (org_id, name, description, welcome_message, trigger_keywords, nodes, channel, language, timezone, fallback_message, handoff_enabled, ai_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        orgId,
        `${flow.name} (Copy)`,
        flow.description,
        flow.welcome_message,
        flow.trigger_keywords,
        flow.nodes,
        flow.channel,
        flow.language,
        flow.timezone,
        flow.fallback_message,
        flow.handoff_enabled,
        flow.ai_enabled
      ]
    );

    return rows[0];
  }

  async activateFlow(orgId, flowId) {
    return this.updateFlow(orgId, flowId, { isActive: true });
  }

  async deactivateFlow(orgId, flowId) {
    return this.updateFlow(orgId, flowId, { isActive: false });
  }

  async getFlowStats(orgId, flowId) {
    const { rows } = await db.query(
      `SELECT 
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') as completed_conversations,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'abandoned') as abandoned_conversations,
        COUNT(DISTINCT c.visitor_id) as unique_visitors,
        AVG(EXTRACT(EPOCH FROM (c.ended_at - c.started_at))) FILTER (WHERE c.ended_at IS NOT NULL) as avg_duration_seconds,
        COUNT(m.id) as total_messages
       FROM chatbot_conversations c
       LEFT JOIN chatbot_messages m ON m.conversation_id = c.id
       WHERE c.org_id = $1 AND c.flow_id = $2`,
      [orgId, flowId]
    );

    return rows[0];
  }

  // ==================== CONVERSATION MANAGEMENT ====================

  async startConversation(orgId, flowId, visitorId, channel = 'web') {
    const { rows } = await db.query(
      `INSERT INTO chatbot_conversations 
       (org_id, flow_id, visitor_id, channel, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [orgId, flowId, visitorId, channel]
    );

    await db.query(
      `UPDATE chatbot_flows SET conversations = conversations + 1 WHERE id = $1`,
      [flowId]
    );

    await db.query(
      `UPDATE chatbot_visitors 
       SET last_seen = NOW(), conversations_count = conversations_count + 1
       WHERE id = $1`,
      [visitorId]
    );

    return rows[0];
  }

  async continueConversation(orgId, conversationId, nodeId, userMessage = null) {
    if (userMessage) {
      await this.saveMessage(conversationId, null, 'user', userMessage);
    }

    await db.query(
      `UPDATE chatbot_conversations 
       SET current_node_id = $1
       WHERE id = $2 AND org_id = $3`,
      [nodeId, conversationId, orgId]
    );

    return { success: true, nodeId };
  }

  async endConversation(orgId, conversationId, status = 'completed') {
    const { rows } = await db.query(
      `UPDATE chatbot_conversations 
       SET status = $3, ended_at = NOW(), resolved = true
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [conversationId, orgId, status]
    );

    return rows[0];
  }

  async getConversation(orgId, conversationId) {
    const { rows } = await db.query(
      `SELECT c.*, 
        v.name as visitor_name, v.email as visitor_email,
        f.name as flow_name
       FROM chatbot_conversations c
       LEFT JOIN chatbot_visitors v ON v.id = c.visitor_id
       LEFT JOIN chatbot_flows f ON f.id = c.flow_id
       WHERE c.id = $1 AND c.org_id = $2`,
      [conversationId, orgId]
    );

    return rows[0];
  }

  async getConversationHistory(orgId, conversationId) {
    const { rows } = await db.query(
      `SELECT * FROM chatbot_messages 
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    return rows;
  }

  async listConversations(orgId, filters = {}) {
    const { flowId, status, channel, search, limit = 50, offset = 0 } = filters;
    let query = `SELECT c.*, 
      v.name as visitor_name, v.email as visitor_email,
      f.name as flow_name
      FROM chatbot_conversations c
      LEFT JOIN chatbot_visitors v ON v.id = c.visitor_id
      LEFT JOIN chatbot_flows f ON f.id = c.flow_id
      WHERE c.org_id = $1`;
    const params = [orgId];
    let paramCount = 1;

    if (flowId) {
      paramCount++;
      query += ` AND c.flow_id = $${paramCount}`;
      params.push(flowId);
    }

    if (status) {
      paramCount++;
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
    }

    if (channel) {
      paramCount++;
      query += ` AND c.channel = $${paramCount}`;
      params.push(channel);
    }

    if (search) {
      paramCount++;
      query += ` AND (v.name ILIKE $${paramCount} OR v.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY c.started_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
  }

  async searchConversations(orgId, searchTerm) {
    const { rows } = await db.query(
      `SELECT DISTINCT c.*, 
        v.name as visitor_name, v.email as visitor_email,
        f.name as flow_name
       FROM chatbot_conversations c
       LEFT JOIN chatbot_visitors v ON v.id = c.visitor_id
       LEFT JOIN chatbot_flows f ON f.id = c.flow_id
       LEFT JOIN chatbot_messages m ON m.conversation_id = c.id
       WHERE c.org_id = $1 
       AND (v.name ILIKE $2 OR v.email ILIKE $2 OR m.content ILIKE $2)
       ORDER BY c.started_at DESC
       LIMIT 50`,
      [orgId, `%${searchTerm}%`]
    );

    return rows;
  }

  // ==================== MESSAGE HANDLING ====================

  async saveMessage(conversationId, nodeId, sender, content, options = {}) {
    const { mediaUrl, mediaType, buttons, metadata } = options;

    const { rows } = await db.query(
      `INSERT INTO chatbot_messages 
       (conversation_id, node_id, sender, content, media_url, media_type, buttons, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        conversationId,
        nodeId,
        sender,
        content,
        mediaUrl || null,
        mediaType || null,
        JSON.stringify(buttons || []),
        JSON.stringify(metadata || {})
      ]
    );

    await db.query(
      `UPDATE chatbot_conversations 
       SET messages_count = messages_count + 1
       WHERE id = $1`,
      [conversationId]
    );

    return rows[0];
  }

  async processNode(orgId, conversationId, node, userInput = null) {
    const conversation = await this.getConversation(orgId, conversationId);
    if (!conversation) throw new Error('Conversation not found');

    let response = null;

    switch (node.type) {
      case 'message':
        response = await this.saveMessage(conversationId, node.id, 'bot', node.content, {
          buttons: node.buttons,
          mediaUrl: node.mediaUrl,
          mediaType: node.mediaType
        });
        break;

      case 'question':
        response = await this.saveMessage(conversationId, node.id, 'bot', node.question, {
          metadata: { field: node.field, validation: node.validation }
        });
        break;

      case 'condition':
        const conditionMet = await this.evaluateCondition(conversation, node, userInput);
        response = { nextNode: conditionMet ? node.trueNode : node.falseNode };
        break;

      case 'action':
        response = await this.executeAction(orgId, conversation, node);
        break;

      case 'delay':
        response = { delay: node.delaySeconds, nextNode: node.nextNode };
        break;

      case 'ai':
        const aiResponse = await this.generateAIResponse(orgId, conversation, node, userInput);
        response = await this.saveMessage(conversationId, node.id, 'bot', aiResponse);
        break;

      case 'handoff':
        response = await this.requestHandoff(orgId, conversationId, node);
        break;

      case 'end':
        await this.endConversation(orgId, conversationId, 'completed');
        response = await this.saveMessage(conversationId, node.id, 'bot', node.message || 'Thank you!');
        break;

      default:
        response = { error: 'Unknown node type' };
    }

    return response;
  }

  async evaluateCondition(conversation, node, userInput) {
    const { field, operator, value } = node;
    const contextValue = conversation.context?.[field] || userInput;

    switch (operator) {
      case 'equals':
        return contextValue === value;
      case 'contains':
        return String(contextValue).includes(value);
      case 'greater_than':
        return Number(contextValue) > Number(value);
      case 'less_than':
        return Number(contextValue) < Number(value);
      case 'exists':
        return contextValue !== null && contextValue !== undefined;
      default:
        return false;
    }
  }

  async executeAction(orgId, conversation, node) {
    const { action, value, data } = node;

    switch (action) {
      case 'set_attribute':
        await this.setVisitorAttribute(conversation.visitor_id, data.key, data.value);
        break;

      case 'add_tag':
        await this.addVisitorTag(conversation.visitor_id, value);
        break;

      case 'remove_tag':
        await this.removeVisitorTag(conversation.visitor_id, value);
        break;

      case 'create_contact':
        await this.createCRMContact(orgId, conversation.visitor_id);
        break;

      default:
        break;
    }

    return { success: true };
  }

  async generateAIResponse(orgId, conversation, node, userInput) {
    const result = await generateWithAI({
      orgId,
      feature: 'chatbot-builder:ai-response',
      systemPrompt: node.systemPrompt || 'You are a helpful customer service chatbot. Provide concise, friendly responses.',
      userPrompt: userInput || node.prompt,
      fallback: node.fallbackMessage || 'I apologize, but I need a moment to process that. Can you rephrase your question?'
    });

    return result.text || result.fallback;
  }

  async requestHandoff(orgId, conversationId, node) {
    const { rows } = await db.query(
      `INSERT INTO chatbot_handoffs 
       (conversation_id, status)
       VALUES ($1, 'pending')
       RETURNING *`,
      [conversationId]
    );

    await db.query(
      `UPDATE chatbot_conversations 
       SET status = 'handed_off'
       WHERE id = $1`,
      [conversationId]
    );

    return rows[0];
  }

  // ==================== VISITOR MANAGEMENT ====================

  async identifyVisitor(orgId, externalId, data = {}) {
    const { name, email, phone, attributes } = data;

    const { rows: existing } = await db.query(
      `SELECT * FROM chatbot_visitors 
       WHERE org_id = $1 AND external_id = $2`,
      [orgId, externalId]
    );

    if (existing.length > 0) {
      const { rows } = await db.query(
        `UPDATE chatbot_visitors 
         SET name = COALESCE($3, name),
             email = COALESCE($4, email),
             phone = COALESCE($5, phone),
             attributes = COALESCE($6, attributes),
             last_seen = NOW()
         WHERE id = $1 AND org_id = $2
         RETURNING *`,
        [existing[0].id, orgId, name, email, phone, attributes ? JSON.stringify(attributes) : null]
      );
      return rows[0];
    }

    const { rows } = await db.query(
      `INSERT INTO chatbot_visitors 
       (org_id, external_id, name, email, phone, attributes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orgId, externalId, name, email, phone, JSON.stringify(attributes || {})]
    );

    return rows[0];
  }

  async setVisitorAttribute(visitorId, key, value, type = 'text') {
    await db.query(
      `INSERT INTO chatbot_user_attributes (visitor_id, key, value, type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (visitor_id, key) 
       DO UPDATE SET value = $3, type = $4, updated_at = NOW()`,
      [visitorId, key, value, type]
    );

    return { success: true };
  }

  async getVisitorProfile(orgId, visitorId) {
    const { rows: visitor } = await db.query(
      `SELECT * FROM chatbot_visitors WHERE id = $1 AND org_id = $2`,
      [visitorId, orgId]
    );

    if (!visitor.length) return null;

    const { rows: attributes } = await db.query(
      `SELECT key, value, type FROM chatbot_user_attributes WHERE visitor_id = $1`,
      [visitorId]
    );

    return {
      ...visitor[0],
      customAttributes: attributes
    };
  }

  async addVisitorTag(visitorId, tag) {
    await db.query(
      `UPDATE chatbot_visitors 
       SET tags = tags || $2::jsonb
       WHERE id = $1 AND NOT (tags @> $2::jsonb)`,
      [visitorId, JSON.stringify([tag])]
    );
  }

  async removeVisitorTag(visitorId, tag) {
    await db.query(
      `UPDATE chatbot_visitors 
       SET tags = tags - $2
       WHERE id = $1`,
      [visitorId, tag]
    );
  }

  // ==================== TEMPLATE MANAGEMENT ====================

  async listTemplates(orgId, category = null) {
    let query = `SELECT * FROM chatbot_templates 
                 WHERE (org_id = $1 OR is_system = true)`;
    const params = [orgId];

    if (category) {
      query += ` AND category = $2`;
      params.push(category);
    }

    query += ` ORDER BY is_system DESC, usage_count DESC, created_at DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  async getTemplate(templateId) {
    const { rows } = await db.query(
      `SELECT * FROM chatbot_templates WHERE id = $1`,
      [templateId]
    );
    return rows[0];
  }

  async createFromTemplate(orgId, templateId, name) {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const flow = await this.createFlow(orgId, {
      name: name || template.name,
      description: template.description,
      nodes: template.nodes
    });

    await db.query(
      `UPDATE chatbot_templates SET usage_count = usage_count + 1 WHERE id = $1`,
      [templateId]
    );

    return flow;
  }

  async saveAsTemplate(orgId, flowId, templateData) {
    const flow = await this.getFlow(orgId, flowId);
    if (!flow) throw new Error('Flow not found');

    const { name, description, category, thumbnailUrl } = templateData;

    const { rows } = await db.query(
      `INSERT INTO chatbot_templates 
       (org_id, name, description, category, thumbnail_url, nodes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orgId, name, description, category || 'general', thumbnailUrl, flow.nodes]
    );

    return rows[0];
  }

  // ==================== ANALYTICS ====================

  async getFlowAnalytics(orgId, flowId, dateRange = 30) {
    const { rows } = await db.query(
      `SELECT * FROM chatbot_analytics_daily 
       WHERE org_id = $1 AND flow_id = $2 
       AND date >= CURRENT_DATE - $3
       ORDER BY date DESC`,
      [orgId, flowId, dateRange]
    );

    return rows;
  }

  async getNodeAnalytics(orgId, flowId, dateRange = 30) {
    const { rows } = await db.query(
      `SELECT node_id, 
        SUM(views) as total_views,
        SUM(completions) as total_completions,
        SUM(drop_offs) as total_drop_offs,
        AVG(avg_time_spent_seconds) as avg_time_spent
       FROM chatbot_node_analytics 
       WHERE org_id = $1 AND flow_id = $2 
       AND date >= CURRENT_DATE - $3
       GROUP BY node_id
       ORDER BY total_views DESC`,
      [orgId, flowId, dateRange]
    );

    return rows;
  }

  async getConversationMetrics(orgId, flowId = null) {
    let query = `SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned,
      COUNT(*) FILTER (WHERE status = 'handed_off') as handed_off,
      AVG(messages_count) as avg_messages,
      AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) FILTER (WHERE ended_at IS NOT NULL) as avg_duration
      FROM chatbot_conversations 
      WHERE org_id = $1`;
    const params = [orgId];

    if (flowId) {
      query += ` AND flow_id = $2`;
      params.push(flowId);
    }

    const { rows } = await db.query(query, params);
    return rows[0];
  }

  // ==================== INTEGRATIONS ====================

  async createCRMContact(orgId, visitorId) {
    const visitor = await this.getVisitorProfile(orgId, visitorId);
    if (!visitor || !visitor.email) return null;

    const { rows } = await db.query(
      `INSERT INTO contacts (org_id, name, email, phone, source, tags)
       VALUES ($1, $2, $3, $4, 'chatbot', $5)
       ON CONFLICT (org_id, email) DO UPDATE 
       SET name = COALESCE(EXCLUDED.name, contacts.name),
           phone = COALESCE(EXCLUDED.phone, contacts.phone),
           tags = contacts.tags || EXCLUDED.tags
       RETURNING *`,
      [orgId, visitor.name, visitor.email, visitor.phone, visitor.tags]
    );

    return rows[0];
  }

  // ==================== BROADCASTS ====================

  async createBroadcast(orgId, data) {
    const { flowId, name, message, mediaUrl, targetSegment, scheduledAt } = data;

    const { rows } = await db.query(
      `INSERT INTO chatbot_broadcasts 
       (org_id, flow_id, name, message, media_url, target_segment, scheduled_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        orgId,
        flowId,
        name,
        message,
        mediaUrl || null,
        JSON.stringify(targetSegment || {}),
        scheduledAt || null,
        scheduledAt ? 'scheduled' : 'draft'
      ]
    );

    return rows[0];
  }

  async sendBroadcast(orgId, broadcastId) {
    const { rows: broadcast } = await db.query(
      `SELECT * FROM chatbot_broadcasts WHERE id = $1 AND org_id = $2`,
      [broadcastId, orgId]
    );

    if (!broadcast.length) throw new Error('Broadcast not found');

    const { rows: visitors } = await db.query(
      `SELECT * FROM chatbot_visitors WHERE org_id = $1`,
      [orgId]
    );

    const sentCount = visitors.length;

    await db.query(
      `UPDATE chatbot_broadcasts 
       SET status = 'sent', sent_at = NOW(), sent_count = $3
       WHERE id = $1 AND org_id = $2`,
      [broadcastId, orgId, sentCount]
    );

    return { success: true, sentCount };
  }
}

module.exports = new ChatbotService();
