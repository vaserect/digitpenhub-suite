const CircuitBreaker = require('opossum');
const logger = require('./logger');

/**
 * Circuit Breaker utility for external service calls
 * Prevents cascading failures by failing fast when a service is down
 */

// Default circuit breaker options
const defaultOptions = {
  timeout: 10000, // 10 seconds - if function takes longer, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
  resetTimeout: 30000, // After 30 seconds, try again (half-open state)
  rollingCountTimeout: 10000, // 10 second window for error percentage calculation
  rollingCountBuckets: 10, // Number of buckets in the rolling window
  name: 'default',
};

/**
 * Create a circuit breaker for a function
 * @param {Function} fn - The async function to wrap
 * @param {Object} options - Circuit breaker options
 * @returns {CircuitBreaker} Circuit breaker instance
 */
function createCircuitBreaker(fn, options = {}) {
  const opts = { ...defaultOptions, ...options };
  const breaker = new CircuitBreaker(fn, opts);
  
  // Event listeners for monitoring
  breaker.on('open', () => {
    logger.warn(`Circuit breaker opened for ${opts.name}`, {
      category: 'circuit_breaker',
      service: opts.name,
      state: 'open',
    });
  });
  
  breaker.on('halfOpen', () => {
    logger.info(`Circuit breaker half-open for ${opts.name}`, {
      category: 'circuit_breaker',
      service: opts.name,
      state: 'half_open',
    });
  });
  
  breaker.on('close', () => {
    logger.info(`Circuit breaker closed for ${opts.name}`, {
      category: 'circuit_breaker',
      service: opts.name,
      state: 'closed',
    });
  });
  
  breaker.on('success', (result) => {
    logger.debug(`Circuit breaker success for ${opts.name}`, {
      category: 'circuit_breaker',
      service: opts.name,
      event: 'success',
    });
  });
  
  breaker.on('failure', (error) => {
    logger.error(`Circuit breaker failure for ${opts.name}`, {
      category: 'circuit_breaker',
      service: opts.name,
      event: 'failure',
      error: error.message,
    });
  });
  
  breaker.on('timeout', () => {
    logger.warn(`Circuit breaker timeout for ${opts.name}`, {
      category: 'circuit_breaker',
      service: opts.name,
      event: 'timeout',
      timeout: opts.timeout,
    });
  });
  
  breaker.on('reject', () => {
    logger.warn(`Circuit breaker rejected request for ${opts.name}`, {
      category: 'circuit_breaker',
      service: opts.name,
      event: 'reject',
      message: 'Circuit is open, request rejected',
    });
  });
  
  return breaker;
}

/**
 * Get circuit breaker health status
 * @param {CircuitBreaker} breaker - Circuit breaker instance
 * @returns {Object} Health status
 */
function getCircuitBreakerHealth(breaker) {
  const stats = breaker.stats;
  const state = breaker.opened ? 'open' : breaker.halfOpen ? 'half_open' : 'closed';
  
  return {
    name: breaker.name,
    state,
    stats: {
      fires: stats.fires,
      successes: stats.successes,
      failures: stats.failures,
      rejects: stats.rejects,
      timeouts: stats.timeouts,
      fallbacks: stats.fallbacks,
      latencyMean: stats.latencyMean,
      percentiles: stats.percentiles,
    },
  };
}

/**
 * Create a fallback function for circuit breaker
 * @param {string} serviceName - Name of the service
 * @param {*} fallbackValue - Value to return on failure
 * @returns {Function} Fallback function
 */
function createFallback(serviceName, fallbackValue = null) {
  return (error) => {
    logger.warn(`Using fallback for ${serviceName}`, {
      category: 'circuit_breaker',
      service: serviceName,
      error: error.message,
    });
    return fallbackValue;
  };
}

module.exports = {
  createCircuitBreaker,
  getCircuitBreakerHealth,
  createFallback,
};
