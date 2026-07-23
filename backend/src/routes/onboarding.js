const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/onboardingController');

const router = Router();
router.use(requireAuth);

router.get('/tours/:moduleSlug', c.getTourForModule);
router.post('/tours/:id/complete', c.completeTour);
router.post('/tours/:id/dismiss', c.dismissTour);

module.exports = router;
