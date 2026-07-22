const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/aiContentRepurposingController');
const router = Router();
router.use(requireAuth);
router.get('/', c.list);
router.post('/', c.create);
router.post('/generate', c.generate);
module.exports = router;
