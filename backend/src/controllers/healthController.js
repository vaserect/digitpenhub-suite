const db = require('../db');
const fs = require('fs');
const os = require('os');
const { getCircuitBreakerHealth } = require('../utils/circuitBreaker');

/**
 * Comprehensive health check controller
 * Checks database connectivity, disk space, memory, and external service availability
 */

// Import circuit breakers for health monitoring
let emailCircuitBreaker, flutterwaveCircuitBreaker, pexelsCircuitBreaker;
try {
  ({ emailCircuitBreaker } = require('../utils/mailer'));
} catch (err) {
  // Circuit breaker not available yet
}
try {
  const billingController = require('./billingController');
  flutterwaveCircuitBreaker = billingController.flutterwaveCircuitBreaker;
} catch (err) {
  // Circuit breaker not available yet
}
try {
  const pexels = require('../utils/pexels');
  pexelsCircuitBreaker = pexels.pexelsCircuitBreaker;
} catch (err) {
  // Circuit breaker not available yet
}

async function checkDatabase() {
  try {
    const start = Date.now();
    await db.query('SELECT 1');
    const duration = Date.now() - start;
    return {
      status: 'healthy',
      responseTime: duration,
      message: 'Database connection successful',
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message,
      message: 'Database connection failed',
    };
  }
}

async function checkDiskSpace() {
  try {
    const stats = fs.statfsSync('/');
    const totalSpace = stats.blocks * stats.bsize;
    const freeSpace = stats.bfree * stats.bsize;
    const usedSpace = totalSpace - freeSpace;
    const usedPercent = (usedSpace / totalSpace) * 100;

    return {
      status: usedPercent > 90 ? 'warning' : 'healthy',
      totalGB: (totalSpace / (1024 ** 3)).toFixed(2),
      freeGB: (freeSpace / (1024 ** 3)).toFixed(2),
      usedPercent: usedPercent.toFixed(2),
      message: usedPercent > 90 ? 'Disk space running low' : 'Disk space sufficient',
    };
  } catch (err) {
    return {
      status: 'unknown',
      error: err.message,
      message: 'Unable to check disk space',
    };
  }
}

function checkMemory() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const usedPercent = (usedMem / totalMem) * 100;

  return {
    status: usedPercent > 90 ? 'warning' : 'healthy',
    totalGB: (totalMem / (1024 ** 3)).toFixed(2),
    freeGB: (freeMem / (1024 ** 3)).toFixed(2),
    usedPercent: usedPercent.toFixed(2),
    message: usedPercent > 90 ? 'Memory usage high' : 'Memory usage normal',
  };
}

function checkUptime() {
  const uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  return {
    status: 'healthy',
    uptimeSeconds: Math.floor(uptimeSeconds),
    uptime: `${days}d ${hours}h ${minutes}m`,
    message: 'Application running',
  };
}

async function checkEmailService() {
  try {
    // Check if sendmail is available
    const { execSync } = require('child_process');
    execSync('which sendmail', { stdio: 'ignore' });
    return {
      status: 'healthy',
      message: 'Email service (sendmail) available',
    };
  } catch (err) {
    return {
      status: 'warning',
      message: 'Email service (sendmail) not found',
    };
  }
}

async function checkFlutterwaveConfig() {
  const hasPublicKey = !!process.env.FLUTTERWAVE_PUBLIC_KEY;
  const hasSecretKey = !!process.env.FLUTTERWAVE_SECRET_KEY;
  const hasWebhookHash = !!process.env.FLUTTERWAVE_WEBHOOK_HASH;

  if (hasPublicKey && hasSecretKey && hasWebhookHash) {
    return {
      status: 'healthy',
      message: 'Flutterwave payment gateway configured',
    };
  }

  return {
    status: 'warning',
    message: 'Flutterwave payment gateway not fully configured',
    details: {
      publicKey: hasPublicKey,
      secretKey: hasSecretKey,
      webhookHash: hasWebhookHash,
    },
  };
}

/**
 * GET /api/v1/health/detailed
 * Comprehensive health check with all subsystems
 * Requires authentication
 */
async function detailedHealth(req, res) {
  const checks = await Promise.all([
    checkDatabase(),
    checkDiskSpace(),
    checkEmailService(),
    checkFlutterwaveConfig(),
  ]);

  const [database, disk, email, payment] = checks;
  const memory = checkMemory();
  const uptime = checkUptime();

  // Get circuit breaker health
  const circuitBreakers = {};
  if (emailCircuitBreaker) {
    circuitBreakers.email = getCircuitBreakerHealth(emailCircuitBreaker);
  }
  if (flutterwaveCircuitBreaker) {
    circuitBreakers.flutterwave = getCircuitBreakerHealth(flutterwaveCircuitBreaker);
  }
  if (pexelsCircuitBreaker) {
    circuitBreakers.pexels = getCircuitBreakerHealth(pexelsCircuitBreaker);
  }

  const allHealthy = [database, disk, memory, email, payment].every(
    (check) => check.status === 'healthy'
  );

  const hasWarnings = [database, disk, memory, email, payment].some(
    (check) => check.status === 'warning'
  );

  // Check if any circuit breakers are open (unhealthy)
  const hasOpenCircuits = Object.values(circuitBreakers).some(
    (cb) => cb.state === 'open'
  );

  const overallStatus = allHealthy && !hasOpenCircuits ? 'healthy' : hasWarnings || hasOpenCircuits ? 'degraded' : 'unhealthy';

  res.status(overallStatus === 'unhealthy' ? 503 : 200).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks: {
      database,
      disk,
      memory,
      uptime,
      email,
      payment,
    },
    circuitBreakers: Object.keys(circuitBreakers).length > 0 ? circuitBreakers : undefined,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  });
}

/**
 * GET /api/v1/health
 * Simple liveness check (no auth required)
 */
async function simpleHealth(req, res) {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
}

/**
 * GET /api/v1/health/readiness
 * Readiness check for load balancers
 */
async function readinessCheck(req, res) {
  try {
    // Check database
    await db.query('SELECT 1');

    // Check critical environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'FRONTEND_ORIGIN',
    ];

    const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

    if (missingVars.length > 0) {
      return res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: `Missing environment variables: ${missingVars.join(', ')}`,
      });
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: err.message,
    });
  }
}

module.exports = {
  detailedHealth,
  simpleHealth,
  readinessCheck,
};
