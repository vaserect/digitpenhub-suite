const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/aiWorkflowController');

const router = Router();
router.use(requireAuth);

router.get('/templates', c.listTemplates);
router.post('/generate', c.generateFromTemplate);

module.exports = router;
