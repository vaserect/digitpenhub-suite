const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const c = require('../controllers/formsController');
const r = Router();

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again later.' },
});

// Public — no auth (the visitor-facing fill/submit page)
r.get('/:id/public',            c.getPublicForm);
r.post('/:id/submit',           submitLimiter, c.submitPublicResponse);

r.use(requireAuth, requireModuleAccess('forms'));
r.get('/stats',                 c.getStats);
r.get('/',                      c.listForms);
r.post('/',                     c.createForm);
r.get('/:id',                   c.getForm);
r.put('/:id',                   c.updateForm);
r.delete('/:id',                c.deleteForm);
r.get('/:id/responses',         c.listResponses);
r.delete('/responses/:id',      c.deleteResponse);
module.exports = r;
