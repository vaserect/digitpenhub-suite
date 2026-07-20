const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/disputeResolutionController');
const router = Router();
router.use(requireAuth);
router.get('/', c.list);
router.post('/', c.create);
router.delete('/:id', c.remove);
module.exports = router;
