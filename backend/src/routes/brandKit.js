const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/brandKitController');
const r = Router();
r.use(requireAuth);
r.get('/',  c.getKit);
r.post('/', c.saveKit);
r.put('/',  c.saveKit);
module.exports = r;
