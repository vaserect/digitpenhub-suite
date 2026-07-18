const db = require('../../db');
const { sendSms } = require('../../utils/messagingProviders');

/**
 * SMSConversationService
 * 
 * Two-way SMS conversation management service.
 * Handles inbound messages, keyword auto-responses, conversation threading,
 * and message history.
 * 
 * Features:
 * - Conversation threading by phone number
 * - Inbound message processing
 * - Keyword auto-response system
 * - Message history and search
 * - Conversation status management (open/closed/archived)
 * - Opt-in/opt-out keyword handling
 */
class SMSConversationService {
  /**
   * Process inbound SMS message
   * Called by webhook from SMS provider
   */
  async processInboundMessage(orgId, { from, to, body, media_urls = [], provider_id }) {
    // Find or create conversation
    const conversation = await this.findOrCreateConversation(orgId, from);

    // Create message record
    const message = await this.createMessage({
      conversation_id: conversation.id,
      org_id: orgId,
      contact_id: conversation.contact_id,
      direction: 'inbound',
      message_body: body,
      media_urls,
      status: 'received',
      provider_id
    });

    // Update conversation last message time
    await db.query(
      `UPDATE sms_conversations SET last_message_at = NOW() WHERE id = $1`,
      [conversation.id]
    );

    // Update contact stats
    if (conversation.contact_id) {
      await db.query(
        `UPDATE sms_contacts
         SET total_messages_received = total_messages_received + 1,
             last_message_at = NOW()
         WHERE id = $1`,
        [conversation.contact_id]
      );
    }

    // Check for keyword matches and auto-respond
    await this.processKeywords(orgId, conversation, body);

    return { conversation, message };
  }

  /**
   * Find or create conversation for a phone number
   */
  async findOrCreateConversation(orgId, phoneNumber) {
    // Try to find existing conversation
    let { rows } = await db.query(
      `SELECT * FROM sms_conversations
       WHERE org_id = $1 AND phone_number = $2 AND status != 'archived'
       ORDER BY last_message_at DESC
       LIMIT 1`,
      [orgId, phoneNumber]
    );

    if (rows.length > 0) {
      return rows[0];
    }

    // Find contact by phone number
    const { rows: contacts } = await db.query(
      `SELECT id FROM sms_contacts WHERE org_id = $1 AND phone = $2 LIMIT 1`,
      [orgId, phoneNumber]
    );

    const contactId = contacts.length > 0 ? contacts[0].id : null;

    // Create new conversation
    const { rows: newConv } = await db.query(
      `INSERT INTO sms_conversations (org_id, contact_id, phone_number, status)
       VALUES ($1, $2, $3, 'open')
       RETURNING *`,
      [orgId, contactId, phoneNumber]
    );

    return newConv[0];
  }

  /**
   * Create message record
   */
  async createMessage(data) {
    const {
      conversation_id,
      org_id,
      contact_id,
      direction,
      message_body,
      media_urls = [],
      status = 'pending',
      provider_id = null,
      error_message = null
    } = data;

    const { rows } = await db.query(
      `INSERT INTO sms_messages
       (conversation_id, org_id, contact_id, direction, message_body, media_urls, status, provider_id, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [conversation_id, org_id, contact_id, direction, message_body, media_urls, status, provider_id, error_message]
    );

    return rows[0];
  }

  /**
   * Send outbound message
   */
  async sendMessage(orgId, conversationId, { message_body, media_urls = [] }) {
    // Get conversation
    const { rows: conversations } = await db.query(
      `SELECT * FROM sms_conversations WHERE id = $1 AND org_id = $2`,
      [conversationId, orgId]
    );

    if (conversations.length === 0) {
      throw new Error('Conversation not found');
    }

    const conversation = conversations[0];

    // Create message record
    const message = await this.createMessage({
      conversation_id: conversationId,
      org_id: orgId,
      contact_id: conversation.contact_id,
      direction: 'outbound',
      message_body,
      media_urls,
      status: 'pending'
    });

    // Send via SMS provider
    try {
      const result = await sendSms({
        to: conversation.phone_number,
        message: message_body
      });

      if (result.ok) {
        // Update message status
        await db.query(
          `UPDATE sms_messages
           SET status = 'sent', provider_id = $1, sent_at = NOW()
           WHERE id = $2`,
          [result.messageId, message.id]
        );

        // Update conversation
        await db.query(
          `UPDATE sms_conversations SET last_message_at = NOW() WHERE id = $1`,
          [conversationId]
        );

        // Update contact stats
        if (conversation.contact_id) {
          await db.query(
            `UPDATE sms_contacts
             SET total_messages_sent = total_messages_sent + 1,
                 last_message_at = NOW()
             WHERE id = $1`,
            [conversation.contact_id]
          );
        }

        return { ...message, status: 'sent', provider_id: result.messageId };
      } else {
        // Update message with error
        await db.query(
          `UPDATE sms_messages
           SET status = 'failed', error_message = $1
           WHERE id = $2`,
          [result.error, message.id]
        );

        throw new Error(result.error);
      }
    } catch (error) {
      // Update message with error
      await db.query(
        `UPDATE sms_messages
         SET status = 'failed', error_message = $1
         WHERE id = $2`,
        [error.message, message.id]
      );

      throw error;
    }
  }

  /**
   * Process keywords and auto-respond
   */
  async processKeywords(orgId, conversation, messageBody) {
    const normalizedBody = messageBody.trim().toUpperCase();

    // Get all active keywords for org
    const { rows: keywords } = await db.query(
      `SELECT * FROM sms_keywords
       WHERE org_id = $1 AND is_active = true
       ORDER BY match_type DESC`, // Exact matches first
      [orgId]
    );

    for (const keyword of keywords) {
      const normalizedKeyword = keyword.keyword.toUpperCase();
      let matched = false;

      switch (keyword.match_type) {
        case 'exact':
          matched = normalizedBody === normalizedKeyword;
          break;
        case 'starts_with':
          matched = normalizedBody.startsWith(normalizedKeyword);
          break;
        case 'contains':
          matched = normalizedBody.includes(normalizedKeyword);
          break;
      }

      if (matched) {
        // Increment usage count
        await db.query(
          `UPDATE sms_keywords SET usage_count = usage_count + 1 WHERE id = $1`,
          [keyword.id]
        );

        // Execute action
        await this.executeKeywordAction(orgId, conversation, keyword);

        // Only process first matching keyword
        break;
      }
    }
  }

  /**
   * Execute keyword action
   */
  async executeKeywordAction(orgId, conversation, keyword) {
    const { action_type, response, action_config } = keyword;

    // Always send response if provided
    if (response && response.trim()) {
      await this.sendMessage(orgId, conversation.id, {
        message_body: response
      });
    }

    // Execute additional actions
    switch (action_type) {
      case 'opt_in':
        if (conversation.contact_id) {
          await this.optInContact(conversation.contact_id, 'keyword');
        }
        break;

      case 'opt_out':
        if (conversation.contact_id) {
          await this.optOutContact(conversation.contact_id, 'keyword');
        }
        break;

      case 'add_tag':
        if (conversation.contact_id && action_config.tag) {
          await db.query(
            `UPDATE sms_contacts
             SET tags = array_append(tags, $1)
             WHERE id = $2 AND NOT ($1 = ANY(tags))`,
            [action_config.tag, conversation.contact_id]
          );
        }
        break;

      case 'trigger_automation':
        if (conversation.contact_id && action_config.automation_id) {
          // TODO: Integrate with SMSAutomationService
          console.log(`Triggering automation ${action_config.automation_id} for contact ${conversation.contact_id}`);
        }
        break;
    }
  }

  /**
   * Opt in contact
   */
  async optInContact(contactId, method = 'keyword') {
    await db.query(
      `UPDATE sms_contacts
       SET status = 'active',
           opt_in_method = $1,
           opt_in_date = NOW()
       WHERE id = $2`,
      [method, contactId]
    );

    // Log opt-in
    const { rows: contacts } = await db.query(
      `SELECT org_id FROM sms_contacts WHERE id = $1`,
      [contactId]
    );

    if (contacts.length > 0) {
      await db.query(
        `INSERT INTO sms_opt_in_log (org_id, contact_id, action, method)
         VALUES ($1, $2, 'opt_in', $3)`,
        [contacts[0].org_id, contactId, method]
      );
    }
  }

  /**
   * Opt out contact
   */
  async optOutContact(contactId, method = 'keyword', reason = null) {
    await db.query(
      `UPDATE sms_contacts
       SET status = 'unsubscribed',
           unsubscribed_at = NOW(),
           unsubscribe_reason = $1
       WHERE id = $2`,
      [reason, contactId]
    );

    // Log opt-out
    const { rows: contacts } = await db.query(
      `SELECT org_id FROM sms_contacts WHERE id = $1`,
      [contactId]
    );

    if (contacts.length > 0) {
      await db.query(
        `INSERT INTO sms_opt_in_log (org_id, contact_id, action, method)
         VALUES ($1, $2, 'opt_out', $3)`,
        [contacts[0].org_id, contactId, method]
      );
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId, orgId) {
    const { rows } = await db.query(
      `SELECT c.*, sc.name as contact_name, sc.email as contact_email
       FROM sms_conversations c
       LEFT JOIN sms_contacts sc ON c.contact_id = sc.id
       WHERE c.id = $1 AND c.org_id = $2`,
      [conversationId, orgId]
    );
    return rows[0] || null;
  }

  /**
   * List conversations
   */
  async listConversations(orgId, filters = {}) {
    let query = `
      SELECT c.*, sc.name as contact_name, sc.email as contact_email,
             (SELECT COUNT(*) FROM sms_messages WHERE conversation_id = c.id) as message_count
      FROM sms_conversations c
      LEFT JOIN sms_contacts sc ON c.contact_id = sc.id
      WHERE c.org_id = $1
    `;
    const values = [orgId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND c.status = $${paramIndex++}`;
      values.push(filters.status);
    }

    if (filters.search) {
      query += ` AND (c.phone_number ILIKE $${paramIndex} OR sc.name ILIKE $${paramIndex})`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY c.last_message_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      values.push(filters.limit);
    }

    const { rows } = await db.query(query, values);
    return rows;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId, orgId, { limit = 50, offset = 0 } = {}) {
    const { rows } = await db.query(
      `SELECT m.*, sc.name as contact_name
       FROM sms_messages m
       LEFT JOIN sms_contacts sc ON m.contact_id = sc.id
       WHERE m.conversation_id = $1 AND m.org_id = $2
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [conversationId, orgId, limit, offset]
    );
    return rows.reverse(); // Return in chronological order
  }

  /**
   * Update conversation status
   */
  async updateConversationStatus(conversationId, orgId, status) {
    const { rows } = await db.query(
      `UPDATE sms_conversations
       SET status = $1
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
   * Search messages
   */
  async searchMessages(orgId, { query, conversation_id, date_from, date_to, limit = 50 }) {
    let sql = `
      SELECT m.*, c.phone_number, sc.name as contact_name
      FROM sms_messages m
      INNER JOIN sms_conversations c ON m.conversation_id = c.id
      LEFT JOIN sms_contacts sc ON m.contact_id = sc.id
      WHERE m.org_id = $1
    `;
    const values = [orgId];
    let paramIndex = 2;

    if (query) {
      sql += ` AND m.message_body ILIKE $${paramIndex++}`;
      values.push(`%${query}%`);
    }

    if (conversation_id) {
      sql += ` AND m.conversation_id = $${paramIndex++}`;
      values.push(conversation_id);
    }

    if (date_from) {
      sql += ` AND m.created_at >= $${paramIndex++}`;
      values.push(date_from);
    }

    if (date_to) {
      sql += ` AND m.created_at <= $${paramIndex++}`;
      values.push(date_to);
    }

    sql += ` ORDER BY m.created_at DESC LIMIT $${paramIndex}`;
    values.push(limit);

    const { rows } = await db.query(sql, values);
    return rows;
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(orgId) {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'open') as open_count,
         COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
         COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
         COUNT(*) as total_count
       FROM sms_conversations
       WHERE org_id = $1`,
      [orgId]
    );

    const { rows: messageStats } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE direction = 'inbound') as inbound_count,
         COUNT(*) FILTER (WHERE direction = 'outbound') as outbound_count,
         COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h_count
       FROM sms_messages
       WHERE org_id = $1`,
      [orgId]
    );

    return {
      conversations: {
        open: parseInt(rows[0].open_count) || 0,
        closed: parseInt(rows[0].closed_count) || 0,
        archived: parseInt(rows[0].archived_count) || 0,
        total: parseInt(rows[0].total_count) || 0
      },
      messages: {
        inbound: parseInt(messageStats[0].inbound_count) || 0,
        outbound: parseInt(messageStats[0].outbound_count) || 0,
        last_24h: parseInt(messageStats[0].last_24h_count) || 0
      }
    };
  }

  /**
   * Mark message as delivered (webhook callback)
   */
  async markDelivered(providerId, orgId) {
    await db.query(
      `UPDATE sms_messages
       SET status = 'delivered', delivered_at = NOW()
       WHERE provider_id = $1 AND org_id = $2 AND status = 'sent'`,
      [providerId, orgId]
    );
  }

  /**
   * Mark message as failed (webhook callback)
   */
  async markFailed(providerId, orgId, errorMessage) {
    await db.query(
      `UPDATE sms_messages
       SET status = 'failed', error_message = $1
       WHERE provider_id = $2 AND org_id = $3`,
      [errorMessage, providerId, orgId]
    );
  }
}

module.exports = new SMSConversationService();
