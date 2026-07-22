const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const c = require('../controllers/imagesController');

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests.' },
});

const r = Router();

// Public (rate-limited) — marketing pages fetch hero/feature images
r.get('/public/search', publicLimiter, c.publicSearch);
// Authenticated — workspace pages fetch template/block images
r.get('/search', requireAuth, c.search);

module.exports = r;
module.exports = r;
