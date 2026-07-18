const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { aiGenerationLimiter } = require('../middleware/rateLimiters');
const c = require('../controllers/chatbotBuilderController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

// ==================== FLOW MANAGEMENT ====================
router.get('/stats', requireAuth, c.getStats);
router.get('/', requireAuth, c.listFlows);
router.get('/:id', requireAuth, c.getFlow);
router.post('/', requireAuth, c.createFlow);
router.put('/:id', requireAuth, c.updateFlow);
router.delete('/:id', requireAuth, c.deleteFlow);
router.post('/:id/duplicate', requireAuth, c.duplicateFlow);
router.post('/:id/activate', requireAuth, c.activateFlow);
router.post('/:id/deactivate', requireAuth, c.deactivateFlow);
router.get('/:id/stats', requireAuth, c.getFlowStats);

// ==================== CONVERSATION MANAGEMENT ====================
router.post('/conversations', requireAuth, c.startConversation);
router.post('/conversations/:id/continue', requireAuth, c.continueConversation);
router.post('/conversations/:id/end', requireAuth, c.endConversation);
router.get('/conversations/:id', requireAuth, c.getConversation);
router.get('/conversations/:id/history', requireAuth, c.getConversationHistory);
router.get('/conversations', requireAuth, c.listConversations);
router.get('/conversations/search', requireAuth, c.searchConversations);

// ==================== MESSAGE HANDLING ====================
router.post('/messages', requireAuth, c.sendMessage);
router.post('/messages/process', requireAuth, c.processNode);

// ==================== VISITOR MANAGEMENT ====================
router.post('/visitors/identify', requireAuth, c.identifyVisitor);
router.get('/visitors/:id', requireAuth, c.getVisitorProfile);
router.post('/visitors/:id/attributes', requireAuth, c.setVisitorAttribute);
router.post('/visitors/:id/tags', requireAuth, c.addVisitorTag);
router.delete('/visitors/:id/tags', requireAuth, c.removeVisitorTag);

// ==================== TEMPLATE MANAGEMENT ====================
router.get('/templates', requireAuth, c.listTemplates);
router.get('/templates/:id', requireAuth, c.getTemplate);
router.post('/templates/:id/create', requireAuth, c.createFromTemplate);
router.post('/:id/save-template', requireAuth, c.saveAsTemplate);

// ==================== ANALYTICS ====================
router.get('/:id/analytics', requireAuth, c.getFlowAnalytics);
router.get('/:id/analytics/nodes', requireAuth, c.getNodeAnalytics);
router.get('/analytics/metrics', requireAuth, c.getConversationMetrics);

// ==================== BROADCASTS ====================
router.post('/broadcasts', requireAuth, c.createBroadcast);
router.post('/broadcasts/:id/send', requireAuth, c.sendBroadcast);

// ==================== AI GENERATION ====================
router.post('/generate', requireAuth, aiGenerationLimiter, c.generateReply);

// ==================== WIDGET SETTINGS ====================
router.get('/widget/settings', requireAuth, c.getWidgetSettings);
router.put('/widget/settings', requireAuth, c.updateWidgetSettings);

// ==================== HANDOFFS ====================
router.get('/handoffs', requireAuth, c.listHandoffs);
router.post('/handoffs/:id/accept', requireAuth, c.acceptHandoff);
router.post('/handoffs/:id/resolve', requireAuth, c.resolveHandoff);

// ==================== BULK OPERATIONS ====================
router.post('/bulk-delete', requireAuth, bulkDeleteHandler('chatbot_flows'));

// ==================== EXPORT ====================
router.get('/export', requireAuth, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, is_active, conversations, created_at FROM chatbot_flows WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'chatbot_flows.csv', rows, autoColumns(rows));
});

module.exports = router;
