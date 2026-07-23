const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/aiAssistantController');

const router = Router();
router.use(requireAuth);

router.post('/ask', c.askAssistant);

module.exports = router;
