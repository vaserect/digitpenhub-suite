const WhatsAppConversationService = require('../services/whatsapp/WhatsAppConversationService');

/**
 * WhatsApp Conversations Controller
 * 
 * Handles two-way messaging and conversation management for WhatsApp Marketing.
 * Supports team inbox, message status tracking, and conversation lifecycle.
 */

/**
 * List conversations with filters
 */
async function listConversations(req, res) {
  try {
    const { status, assignedTo, hasUnread, limit, offset } = req.query;
    const conversations = await WhatsAppConversationService.listConversations(req.user.orgId, {
      status,
      assignedTo,
      hasUnread: hasUnread === 'true',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    res.json({ conversations });
  } catch (error) {
    console.error('Error listing WhatsApp conversations:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get conversation by ID with details
 */
async function getConversation(req, res) {
  try {
    const conversation = await WhatsAppConversationService.getConversation(
      req.user.orgId,
      req.params.id
    );
    res.json({ conversation });
  } catch (error) {
    console.error('Error getting WhatsApp conversation:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Get messages for conversation
 */
async function getConversationMessages(req, res) {
  try {
    const { limit, offset, beforeMessageId } = req.query;
    const messages = await WhatsAppConversationService.getConversationMessages(
      req.user.orgId,
      req.params.id,
      {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        beforeMessageId
      }
    );
    res.json({ messages });
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Send message in conversation
 */
async function sendMessage(req, res) {
  try {
    const message = await WhatsAppConversationService.sendMessage(
      req.user.orgId,
      req.params.id,
      req.body
    );
    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Process inbound message (webhook)
 */
async function processInboundMessage(req, res) {
  try {
    const result = await WhatsAppConversationService.processInboundMessage(
      req.user.orgId,
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Error processing inbound message:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Update message status
 */
async function updateMessageStatus(req, res) {
  try {
    const { externalId, status, errorCode, errorMessage } = req.body;

    if (!externalId || !status) {
      return res.status(400).json({ error: 'External ID and status are required' });
    }

    const message = await WhatsAppConversationService.updateMessageStatus(
      req.user.orgId,
      externalId,
      status,
      errorCode,
      errorMessage
    );

    res.json({ message });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Mark conversation as read
 */
async function markAsRead(req, res) {
  try {
    const conversation = await WhatsAppConversationService.markAsRead(
      req.user.orgId,
      req.params.id
    );
    res.json({ conversation });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Assign conversation to user
 */
async function assignConversation(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const conversation = await WhatsAppConversationService.assignConversation(
      req.user.orgId,
      req.params.id,
      userId
    );

    res.json({ conversation });
  } catch (error) {
    console.error('Error assigning conversation:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Update conversation status
 */
async function updateConversationStatus(req, res) {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const conversation = await WhatsAppConversationService.updateConversationStatus(
      req.user.orgId,
      req.params.id,
      status
    );

    res.json({ conversation });
  } catch (error) {
    console.error('Error updating conversation status:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Add tags to conversation
 */
async function addTags(req, res) {
  try {
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags array is required' });
    }

    const conversation = await WhatsAppConversationService.addConversationTags(
      req.user.orgId,
      req.params.id,
      tags
    );

    res.json({ conversation });
  } catch (error) {
    console.error('Error adding conversation tags:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Remove tags from conversation
 */
async function removeTags(req, res) {
  try {
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags array is required' });
    }

    const conversation = await WhatsAppConversationService.removeConversationTags(
      req.user.orgId,
      req.params.id,
      tags
    );

    res.json({ conversation });
  } catch (error) {
    console.error('Error removing conversation tags:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Add note to conversation
 */
async function addNote(req, res) {
  try {
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const noteRecord = await WhatsAppConversationService.addNote(
      req.user.orgId,
      req.params.id,
      note,
      req.user.id
    );

    res.status(201).json({ note: noteRecord });
  } catch (error) {
    console.error('Error adding conversation note:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Get notes for conversation
 */
async function getNotes(req, res) {
  try {
    const notes = await WhatsAppConversationService.getNotes(req.user.orgId, req.params.id);
    res.json({ notes });
  } catch (error) {
    console.error('Error getting conversation notes:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Get conversation statistics
 */
async function getConversationStats(req, res) {
  try {
    const stats = await WhatsAppConversationService.getConversationStats(req.user.orgId);
    res.json({ stats });
  } catch (error) {
    console.error('Error getting conversation stats:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listConversations,
  getConversation,
  getConversationMessages,
  sendMessage,
  processInboundMessage,
  updateMessageStatus,
  markAsRead,
  assignConversation,
  updateConversationStatus,
  addTags,
  removeTags,
  addNote,
  getNotes,
  getConversationStats
};
