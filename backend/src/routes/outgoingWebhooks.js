const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/outgoingWebhooksController');

const router = Router();
router.use(requireAuth);

router.get('/',              c.list);
router.post('/',             c.create);
router.get('/:id',           c.getById);
router.put('/:id',           c.update);
router.patch('/:id',         c.update);
router.delete('/:id',        c.remove);
router.post('/:id/regenerate-secret', c.regenerateSecret);
router.get('/:id/deliveries',         c.listDeliveries);
router.post('/deliveries/:deliveryId/retry', c.retryDelivery);

module.exports = router;
