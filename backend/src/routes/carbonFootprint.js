const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/carbonFootprintController');
const router = Router();
router.use(requireAuth);
router.get('/', c.list);
router.post('/', c.create);
module.exports = router;
