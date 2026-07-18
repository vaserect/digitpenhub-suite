const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/whatsappAutomationsController');

const r = Router();
r.use(requireAuth);

// Automation CRUD
r.get('/', c.listAutomations);
r.post('/', c.createAutomation);
r.get('/:id', c.getAutomation);
r.put('/:id', c.updateAutomation);
r.delete('/:id', c.deleteAutomation);

// Automation operations
r.post('/:id/trigger', c.triggerAutomation);
r.get('/:id/executions', c.getExecutionHistory);
r.post('/executions/:executionId/cancel', c.cancelExecution);
r.get('/:id/stats', c.getAutomationStats);

module.exports = r;
