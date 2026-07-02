const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { getPlans, getSubscription, getPayments, initiate, verify, webhook } = require('../controllers/billingController');

const router = Router();

// Webhook must be raw body — register before json middleware override; it already has body from app-level middleware
router.post('/webhook', webhook); // Flutterwave calls this; verified by verif-hash header

// Public — the marketing pricing page reads real, live plan data without requiring a session.
router.get('/plans', getPlans);

router.use(requireAuth);
router.get('/subscription', getSubscription);
router.get('/payments', getPayments);
router.post('/initiate', initiate);
router.post('/verify', verify);

module.exports = router;
