const db = require('../../db');
const BaseService = require('../base/BaseService');

/**
 * WhatsAppConversationService
 * 
 * Two-way messaging and conversation management for WhatsApp Marketing.
 * 
 * Features:
 * - Conversation lifecycle management (open, closed, archived)
 * - Inbound message processing
 * - Keyword detection and auto-response
 * - Team assignment and collaboration
 * - Conversation notes and tags
 * - Unread message tracking
 * - Message status updates (delivered, read, failed)
 * 
 * Benchmark: WhatsApp Business API best practices
 */
class WhatsAppConversationService extends BaseService {
  constructor() {
    super('whatsapp_conversations');
  }

  /**
   * Get or create conversation for contact
   */
  async getOrCreateConversation(orgId, contactId) {
    // Try to get existing conversation
    const { rows: existingRows } = await db.query(
      `SELECT * FROM whatsapp_conversations 
       WHERE org_id = $1 AND contact_id = $2`,
      [orgId, contactId]
    );

    if (existingRows.length > 0) {
      return existingRows[0];
    }

    // Create new conversation
    const { rows: newRows } = await db.query(
      `INSERT INTO whatsapp_conversations (org_id, contact_id, status)
       VALUES ($1, $2, 'open')
       RETURNING *`,
      [orgId, contactId]
    );

    return newRows[0];
  }

  /**
   * List conversations with filters
   */
  async listConversations(orgId, filters = {}) {
    const { status, assignedTo, hasUnread, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT c.*, 
             ct.name as contact_name,
             ct.phone as contact_phone,
             ct.profile_pic_url as contact_profile_pic,
             u.name as assigned_to_name
      FROM whatsapp_conversations c
      JOIN whatsapp_contacts ct ON ct.id = c.contact_id
      LEFT JOIN users u ON u.id = c.assigned_to
      WHERE c.org_id = $1
    `;
    const params = [orgId];
    let paramIndex = 2;

    if (status) {
      query += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }

    if (assignedTo) {
      query += ` AND c.assigned_to = $${paramIndex++}`;
      params.push(assignedTo);
    }

    if (hasUnread) {
      query += ` AND c.unread_count > 0`;
    }

    query += ` ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Get conversation by ID with details
   */
  async getConversation(orgId, conversationId) {
    const { rows } = await db.query(
      `SELECT c.*, 
              ct.name as contact_name,
              ct.phone as contact_phone,
              ct.email as contact_email,
              ct.tags as contact_tags,
              ct.profile_pic_url as contact_profile_pic,
              ct.business_name as contact_business_name,
              u.name as assigned_to_name
       FROM whatsapp_conversations c
       JOIN whatsapp_contacts ct ON ct.id = c.contact_id
       LEFT JOIN users u ON u.id = c.assigned_to
       WHERE c.id = $1 AND c.org_id = $2`,
      [conversationId, orgId]
    );

    if (rows.length === 0) {
      throw new Error('Conversation not found');
    }

    return rows[0];
  }

  /**
   * Get messages for conversation
   */
  async getConversationMessages(orgId, conversationId, options = {}) {
    const { limit = 50, offset = 0, beforeMessageId } = options;

    let query = `
      SELECT m.*,
             t.name as template_name
      FROM whatsapp_messages m
      LEFT JOIN whatsapp_templates t ON t.id = m.template_id
      WHERE m.org_id = $1 AND m.conversation_id = $2
    `;
    const params = [orgId, conversationId];
    let paramIndex = 3;

    if (beforeMessageId) {
      query += ` AND m.created_at < (SELECT created_at FROM whatsapp_messages WHERE id = $${paramIndex++})`;
      params.push(beforeMessageId);
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return rows.reverse(); // Return in chronological order
  }

  /**
   * Send message in conversation
   */
  async sendMessage(orgId, conversationId, data) {
    const {
      content,
      messageType = 'text',
      mediaUrl,
      mediaType,
      templateId,
      templateParams,
      interactiveType,
      interactiveData
    } = data;

    // Validate conversation exists
    const conversation = await this.getConversation(orgId, conversationId);

    // Create message record
    const { rows } = await db.query(
      `INSERT INTO whatsapp_messages 
       (org_id, conversation_id, contact_id, direction, message_type, content, 
        media_url, media_type, template_id, template_params, 
        interactive_type, interactive_data, status)
       VALUES ($1, $2, $3, 'outbound', $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
       RETURNING *`,
      [
        orgId,
        conversationId,
        conversation.contact_id,
        messageType,
        content || null,
        mediaUrl || null,
        mediaType || null,
        templateId || null,
        templateParams ? JSON.stringify(templateParams) : null,
        interactiveType || null,
        interactiveData ? JSON.stringify(interactiveData) : null
      ]
    );

    const message = rows[0];

    // Update conversation
    await this._updateConversationLastMessage(conversationId, content || 'Media message', message.created_at);

    // In production, this would send via WhatsApp API
    console.log(`Would send WhatsApp message to conversation ${conversationId}`);

    return message;
  }

  /**
   * Process inbound message (webhook handler)
   */
  async processInboundMessage(orgId, data) {
    const {
      phone,
      content,
      messageType = 'text',
      mediaUrl,
      mediaType,
      externalId,
      timestamp
    } = data;

    if (!phone) {
      throw new Error('Phone number is required');
    }

    // Get or create contact
    const contact = await this._getOrCreateContact(orgId, phone);

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(orgId, contact.id);

    // Create message record
    const { rows } = await db.query(
      `INSERT INTO whatsapp_messages 
       (org_id, conversation_id, contact_id, direction, message_type, content, 
        media_url, media_type, external_id, status, sent_at)
       VALUES ($1, $2, $3, 'inbound', $4, $5, $6, $7, $8, 'delivered', $9)
       RETURNING *`,
      [
        orgId,
        conversation.id,
        contact.id,
        messageType,
        content || null,
        mediaUrl || null,
        mediaType || null,
        externalId || null,
        timestamp || new Date()
      ]
    );

    const message = rows[0];

    // Update conversation
    await this._updateConversationLastMessage(
      conversation.id,
      content || 'Media message',
      message.created_at
    );

    // Increment unread count
    await db.query(
      `UPDATE whatsapp_conversations 
       SET unread_count = unread_count + 1
       WHERE id = $1`,
      [conversation.id]
    );

    // Update contact last message timestamp
    await db.query(
      `UPDATE whatsapp_contacts 
       SET last_message_at = $1, message_count = message_count + 1
       WHERE id = $2`,
      [message.created_at, contact.id]
    );

    // Check for keyword matches
    if (messageType === 'text' && content) {
      await this._processKeywords(orgId, contact, content, conversation.id);
    }

    // Trigger automations
    await this._triggerAutomations(orgId, contact.id, 'message_received', {
      message_content: content,
      message_type: messageType
    });

    return { message, conversation, contact };
  }

  /**
   * Update message status (delivered, read, failed)
   */
  async updateMessageStatus(orgId, externalId, status, errorCode = null, errorMessage = null) {
    const validStatuses = ['sent', 'delivered', 'read', 'failed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const updates = [`status = $1`];
    const params = [status];
    let paramIndex = 2;

    // Set timestamp based on status
    if (status === 'sent') {
      updates.push(`sent_at = NOW()`);
    } else if (status === 'delivered') {
      updates.push(`delivered_at = NOW()`);
    } else if (status === 'read') {
      updates.push(`read_at = NOW()`);
    } else if (status === 'failed') {
      updates.push(`failed_at = NOW()`);
      if (errorCode) {
        updates.push(`error_code = $${paramIndex++}`);
        params.push(errorCode);
      }
      if (errorMessage) {
        updates.push(`error_message = $${paramIndex++}`);
        params.push(errorMessage);
      }
    }

    params.push(externalId, orgId);

    const { rows } = await db.query(
      `UPDATE whatsapp_messages 
       SET ${updates.join(', ')}
       WHERE external_id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      params
    );

    if (rows.length === 0) {
      throw new Error('Message not found');
    }

    // Update broadcast stats if message is part of broadcast
    if (rows[0].broadcast_id) {
      await this._updateBroadcastStats(rows[0].broadcast_id, status);
    }

    return rows[0];
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(orgId, conversationId) {
    const { rows } = await db.query(
      `UPDATE whatsapp_conversations 
       SET unread_count = 0, updated_at = NOW()
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [conversationId, orgId]
    );

    if (rows.length === 0) {
      throw new Error('Conversation not found');
    }

    return rows[0];
  }

  /**
   * Assign conversation to user
   */
  async assignConversation(orgId, conversationId, userId) {
    const { rows } = await db.query(
      `UPDATE whatsapp_conversations 
       SET assigned_to = $1, updated_at = NOW()
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [userId, conversationId, orgId]
    );

    if (rows.length === 0) {
      throw new Error('Conversation not found');
    }

    return rows[0];
  }

  /**
   * Update conversation status
   */
  async updateConversationStatus(orgId, conversationId, status) {
    const validStatuses = ['open', 'closed', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const { rows } = await db.query(
      `UPDATE whatsapp_conversations 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [status, conversationId, orgId]
    );

    if (rows.length === 0) {
      throw new Error('Conversation not found');
    }

    return rows[0];
  }

  /**
   * Add tags to conversation
   */
  async addConversationTags(orgId, conversationId, tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error('Tags must be a non-empty array');
    }

    const { rows } = await db.query(
      `UPDATE whatsapp_conversations 
       SET tags = array(SELECT DISTINCT unnest(tags || $1::text[])),
           updated_at = NOW()
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [tags, conversationId, orgId]
    );

    if (rows.length === 0) {
      throw new Error('Conversation not found');
    }

    return rows[0];
  }

  /**
   * Remove tags from conversation
   */
  async removeConversationTags(orgId, conversationId, tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error('Tags must be a non-empty array');
    }

    const { rows } = await db.query(
      `UPDATE whatsapp_conversations 
       SET tags = array(SELECT unnest(tags) EXCEPT SELECT unnest($1::text[])),
           updated_at = NOW()
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [tags, conversationId, orgId]
    );

    if (rows.length === 0) {
      throw new Error('Conversation not found');
    }

    return rows[0];
  }

  /**
   * Add note to conversation
   */
  async addNote(orgId, conversationId, note, userId) {
    if (!note?.trim()) {
      throw new Error('Note content is required');
    }

    // Verify conversation exists
    await this.getConversation(orgId, conversationId);

    const { rows } = await db.query(
      `INSERT INTO whatsapp_contact_notes (org_id, contact_id, note, created_by)
       SELECT $1, contact_id, $2, $3
       FROM whatsapp_conversations
       WHERE id = $4 AND org_id = $1
       RETURNING *`,
      [orgId, note.trim(), userId, conversationId]
    );

    return rows[0];
  }

  /**
   * Get notes for conversation
   */
  async getNotes(orgId, conversationId) {
    const { rows } = await db.query(
      `SELECT n.*, u.name as created_by_name
       FROM whatsapp_contact_notes n
       LEFT JOIN users u ON u.id = n.created_by
       WHERE n.org_id = $1 
         AND n.contact_id = (SELECT contact_id FROM whatsapp_conversations WHERE id = $2)
       ORDER BY n.created_at DESC`,
      [orgId, conversationId]
    );

    return rows;
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(orgId) {
    const { rows } = await db.query(
      `SELECT 
         COUNT(*)::int as total,
         COUNT(*) FILTER (WHERE status = 'open')::int as open,
         COUNT(*) FILTER (WHERE status = 'closed')::int as closed,
         COUNT(*) FILTER (WHERE unread_count > 0)::int as unread,
         COUNT(*) FILTER (WHERE assigned_to IS NOT NULL)::int as assigned
       FROM whatsapp_conversations
       WHERE org_id = $1`,
      [orgId]
    );

    return rows[0];
  }

  /**
   * Update conversation last message
   * @private
   */
  async _updateConversationLastMessage(conversationId, preview, timestamp) {
    await db.query(
      `UPDATE whatsapp_conversations 
       SET last_message_at = $1,
           last_message_preview = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [timestamp, preview?.substring(0, 100), conversationId]
    );
  }

  /**
   * Get or create contact by phone
   * @private
   */
  async _getOrCreateContact(orgId, phone) {
    // Try to find existing contact
    const { rows: existingRows } = await db.query(
      `SELECT * FROM whatsapp_contacts WHERE org_id = $1 AND phone = $2`,
      [orgId, phone]
    );

    if (existingRows.length > 0) {
      return existingRows[0];
    }

    // Create new contact
    const { rows: newRows } = await db.query(
      `INSERT INTO whatsapp_contacts (org_id, name, phone, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING *`,
      [orgId, phone, phone] // Use phone as name initially
    );

    return newRows[0];
  }

  /**
   * Process keywords for auto-response
   * @private
   */
  async _processKeywords(orgId, contact, messageContent, conversationId) {
    // Get active keywords
    const { rows: keywords } = await db.query(
      `SELECT * FROM whatsapp_keywords 
       WHERE org_id = $1 AND status = 'active'
       ORDER BY keyword`,
      [orgId]
    );

    const content = messageContent.toLowerCase().trim();

    for (const keyword of keywords) {
      const keywordLower = keyword.keyword.toLowerCase();
      let matched = false;

      switch (keyword.match_type) {
        case 'exact':
          matched = content === keywordLower;
          break;
        case 'contains':
          matched = content.includes(keywordLower);
          break;
        case 'starts_with':
          matched = content.startsWith(keywordLower);
          break;
      }

      if (matched) {
        await this._executeKeywordAction(orgId, keyword, contact, conversationId);

        // Update keyword trigger count
        await db.query(
          `UPDATE whatsapp_keywords 
           SET trigger_count = trigger_count + 1, last_triggered_at = NOW()
           WHERE id = $1`,
          [keyword.id]
        );

        // Only process first matching keyword
        break;
      }
    }
  }

  /**
   * Execute keyword action
   * @private
   */
  async _executeKeywordAction(orgId, keyword, contact, conversationId) {
    const { action_type, action_config } = keyword;

    switch (action_type) {
      case 'send_message':
        if (action_config.message) {
          await this.sendMessage(orgId, conversationId, {
            content: action_config.message,
            messageType: 'text'
          });
        }
        break;

      case 'send_template':
        if (action_config.template_id) {
          await this.sendMessage(orgId, conversationId, {
            messageType: 'template',
            templateId: action_config.template_id,
            templateParams: action_config.params || {}
          });
        }
        break;

      case 'add_tag':
        if (action_config.tag) {
          await db.query(
            `UPDATE whatsapp_contacts 
             SET tags = array_append(tags, $1)
             WHERE id = $2 AND NOT ($1 = ANY(tags))`,
            [action_config.tag, contact.id]
          );
        }
        break;

      case 'trigger_automation':
        if (action_config.automation_id) {
          await this._triggerAutomations(orgId, contact.id, 'keyword_received', {
            keyword: keyword.keyword,
            automation_id: action_config.automation_id
          });
        }
        break;

      case 'assign_conversation':
        if (action_config.user_id) {
          await this.assignConversation(orgId, conversationId, action_config.user_id);
        }
        break;
    }
  }

  /**
   * Trigger automations
   * @private
   */
  async _triggerAutomations(orgId, contactId, triggerType, triggerData = {}) {
    // Get active automations for trigger type
    const { rows: automations } = await db.query(
      `SELECT * FROM whatsapp_automations 
       WHERE org_id = $1 AND trigger_type = $2 AND status = 'active'`,
      [orgId, triggerType]
    );

    // Import automation service (avoid circular dependency)
    const WhatsAppAutomationService = require('./WhatsAppAutomationService');

    for (const automation of automations) {
      try {
        await WhatsAppAutomationService.triggerAutomation(
          orgId,
          automation.id,
          contactId,
          triggerData
        );
      } catch (error) {
        console.error(`Failed to trigger automation ${automation.id}:`, error);
      }
    }
  }

  /**
   * Update broadcast statistics
   * @private
   */
  async _updateBroadcastStats(broadcastId, status) {
    const field = status === 'delivered' ? 'delivered_count' :
                  status === 'read' ? 'read_count' :
                  status === 'failed' ? 'failed_count' : null;

    if (field) {
      await db.query(
        `UPDATE whatsapp_broadcasts 
         SET ${field} = ${field} + 1
         WHERE id = $1`,
        [broadcastId]
      );
    }
  }
}

module.exports = new WhatsAppConversationService();
