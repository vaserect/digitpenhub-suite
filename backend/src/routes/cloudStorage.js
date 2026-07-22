const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/cloudStorageController');

const router = Router();
router.use(requireAuth);

router.get('/', c.getAll);
router.get('/folders', c.folders);
router.post('/folders', c.createFolder);
router.get('/:id', c.getById);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
