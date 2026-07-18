const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/smsKeywordsController');

const r = Router();
r.use(requireAuth);

r.get('/', c.listKeywords);
r.get('/stats', c.getKeywordStats);
r.get('/:id', c.getKeyword);
r.post('/', c.createKeyword);
r.put('/:id', c.updateKeyword);
r.delete('/:id', c.deleteKeyword);

module.exports = r;
