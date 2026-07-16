const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { getPlans, getSubscription, getPayments, initiate, verify, webhook, cancelSubscription } = require('../controllers/billingController');

const router = Router();

// CRITICAL FIX: Rate limiting for billing endpoints to prevent abuse
const billingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: 'Too many billing requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook must be raw body — register before json middleware override; it already has body from app-level middleware
router.post('/webhook', webhook); // Flutterwave calls this; verified by verif-hash header

// Public — the marketing pricing page reads real, live plan data without requiring a session.
router.get('/plans', getPlans);

router.use(requireAuth);
router.get('/subscription', getSubscription);
router.get('/payments', getPayments);
router.post('/initiate', billingLimiter, initiate); // CRITICAL FIX: Rate limit payment initiation
router.post('/verify', billingLimiter, verify); // CRITICAL FIX: Rate limit payment verification
router.post('/cancel', cancelSubscription);

module.exports = router;
