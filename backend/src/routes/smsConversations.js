const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/smsConversationsController');

const r = Router();
r.use(requireAuth);

r.get('/', c.listConversations);
r.get('/stats', c.getConversationStats);
r.get('/search', c.searchMessages);
r.get('/:id', c.getConversation);
r.get('/:id/messages', c.getMessages);
r.post('/:id/messages', c.sendMessage);
r.put('/:id/status', c.updateConversationStatus);
r.post('/inbound', c.processInbound);
r.post('/webhooks/delivered', c.markDelivered);
r.post('/webhooks/failed', c.markFailed);

module.exports = r;
