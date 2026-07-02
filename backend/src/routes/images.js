const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/imagesController');
const r = Router();
r.use(requireAuth);
r.get('/search', c.search);
module.exports = r;
