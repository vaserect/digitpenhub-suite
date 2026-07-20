const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/studentPortalController');
const r = Router();
r.use(requireAuth);
r.get('/', c.list);
r.post('/', c.create);
module.exports = r;
