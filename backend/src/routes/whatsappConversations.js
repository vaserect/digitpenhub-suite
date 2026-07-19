const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/whatsappConversationsController');

const r = Router();
r.use(requireAuth);

// Conversation management
r.get('/', c.listConversations);
r.get('/stats', c.getConversationStats);
r.get('/:id', c.getConversation);
r.get('/:id/messages', c.getConversationMessages);
r.post('/:id/messages', c.sendMessage);
r.post('/:id/read', c.markAsRead);
r.post('/:id/assign', c.assignConversation);
r.put('/:id/status', c.updateConversationStatus);

// Conversation tags
r.post('/:id/tags', c.addTags);
r.delete('/:id/tags', c.removeTags);

// Conversation notes
r.get('/:id/notes', c.getNotes);
r.post('/:id/notes', c.addNote);

// Webhooks
r.post('/webhook/inbound', c.processInboundMessage);
r.post('/webhook/status', c.updateMessageStatus);

module.exports = r;
