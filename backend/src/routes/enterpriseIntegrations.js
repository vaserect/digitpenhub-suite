const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/enterpriseIntegrationsController');

const router = Router();
router.use(requireAuth);

router.get('/', c.listIntegrations);
router.get('/directory', c.listDirectory);
router.post('/configure', c.configureIntegration);
router.post('/deactivate', c.deactivateIntegration);

module.exports = router;
