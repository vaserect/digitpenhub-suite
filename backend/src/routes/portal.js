const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { getPortalByToken, listPortalClients, generatePortalToken, revokePortalToken } = require('../controllers/portalController');

const router = Router();

// Public — must be before requireAuth
router.get('/view/:token', getPortalByToken);

router.use(requireAuth);
router.use(requireModuleAccess('client-portal'));

router.get('/clients', listPortalClients);
router.post('/clients/:id/token', generatePortalToken);
router.delete('/clients/:id/token', revokePortalToken);

module.exports = router;
