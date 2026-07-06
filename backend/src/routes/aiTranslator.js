const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { aiGenerationLimiter } = require('../middleware/rateLimiters');
const c = require('../controllers/aiTranslatorController');
router.get('/stats', requireAuth, c.getStats);
router.get('/history', requireAuth, c.listHistory);
router.post('/translate', requireAuth, aiGenerationLimiter, c.translate);
router.delete('/history/:id', requireAuth, c.deleteHistory);
module.exports = router;
