const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { track, overview, activity, moduleUsage } = require('../controllers/analyticsController');

const router = Router();
router.use(requireAuth);

// Event tracking fires on every module open regardless of plan — must stay
// open to all tiers, unlike the dashboard views below which are the actual
// "business-dashboard" module (a paid feature per the pricing page).
router.post('/track', track);

const gate = requireModuleAccess('business-dashboard');
router.get('/overview', gate, overview);
router.get('/activity', gate, activity);
router.get('/modules/usage', gate, moduleUsage);

module.exports = router;
