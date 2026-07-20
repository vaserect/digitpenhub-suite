const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/developerPortalController');
const router = Router();
router.use(requireAuth);
router.get('/', c.list);
router.post('/', c.create);
module.exports = router;
