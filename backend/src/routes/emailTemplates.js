const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/emailTemplatesController');
const r = Router();
r.use(requireAuth);
r.get('/categories', c.listCategories);
r.get('/', c.listTemplates);
r.get('/:id', c.getTemplate);
module.exports = r;
