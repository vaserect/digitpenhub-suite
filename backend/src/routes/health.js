const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { detailedHealth, simpleHealth, readinessCheck } = require('../controllers/healthController');

// Simple liveness check (no auth required)
router.get('/', simpleHealth);

// Readiness check for load balancers (no auth required)
router.get('/readiness', readinessCheck);

// Detailed health check with all subsystems (requires auth)
router.get('/detailed', requireAuth, detailedHealth);

// Sentry test endpoint — triggers a handled error to verify Sentry captures it
router.get('/sentry-debug', requireAuth, (req, res) => {
  const { Sentry, captureException } = require('../utils/sentry');
  try {
    // Intentionally throw to test error capture
    throw new Error('Sentry debug test — this is a test error');
  } catch (err) {
    err.context = 'sentry-debug-endpoint';
    err.userId = req.user?.id;
    captureException(err, { source: 'sentry-debug', requestedBy: req.user?.email });
    res.json({
      ok: true,
      message: 'Test error sent to Sentry. Check your Sentry dashboard.',
      sentryEnabled: !!process.env.SENTRY_DSN,
    });
  }
});

module.exports = router;
