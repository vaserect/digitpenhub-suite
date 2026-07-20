const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/dataMigrationController');

const router = Router();
router.use(requireAuth);

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.getById);
router.put('/:id', c.update);
router.post('/:id/run', c.run);
router.delete('/:id', c.delete);
router.get('/:id/records', c.getRecords);

module.exports = router;
