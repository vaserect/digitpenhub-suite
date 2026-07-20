const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/internalScriptsController');

const router = Router();
router.use(requireAuth);

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.getById);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
router.post('/:id/run', c.run);
router.get('/:id/executions', c.getExecutions);

module.exports = router;
