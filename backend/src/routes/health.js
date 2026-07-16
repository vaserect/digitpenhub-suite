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

module.exports = router;
