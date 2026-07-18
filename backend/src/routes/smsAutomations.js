const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/smsAutomationsController');

const r = Router();
r.use(requireAuth);

r.get('/', c.listAutomations);
r.get('/:id', c.getAutomation);
r.post('/', c.createAutomation);
r.put('/:id', c.updateAutomation);
r.delete('/:id', c.deleteAutomation);
r.post('/:id/activate', c.activateAutomation);
r.post('/:id/pause', c.pauseAutomation);
r.get('/:id/steps', c.getSteps);
r.post('/:id/steps', c.addStep);
r.put('/:id/steps/:stepId', c.updateStep);
r.delete('/:id/steps/:stepId', c.deleteStep);
r.post('/:id/enroll', c.enrollContact);
r.get('/:id/stats', c.getAutomationStats);

module.exports = r;
