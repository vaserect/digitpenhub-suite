const retry = require('async-retry');
const logger = require('./logger');

/**
 * Retry utility for external service calls
 * Implements exponential backoff for transient failures
 */

// Default retry options
const defaultOptions = {
  retries: 3, // Maximum number of retries
  factor: 2, // Exponential backoff factor
  minTimeout: 1000, // Minimum timeout between retries (1 second)
  maxTimeout: 10000, // Maximum timeout between retries (10 seconds)
  randomize: true, // Randomize timeout to prevent thundering herd
  onRetry: (error, attempt) => {
    logger.warn('Retrying operation', {
      category: 'retry',
      attempt,
      error: error.message,
    });
  },
};

/**
 * Retry an async operation with exponential backoff
 * @param {Function} fn - The async function to retry
 * @param {Object} options - Retry options
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise} Result of the operation
 */
async function retryOperation(fn, options = {}, operationName = 'operation') {
  const opts = { ...defaultOptions, ...options };
  
  // Override onRetry to include operation name
  const originalOnRetry = opts.onRetry;
  opts.onRetry = (error, attempt) => {
    logger.warn(`Retrying ${operationName}`, {
      category: 'retry',
      operation: operationName,
      attempt,
      maxRetries: opts.retries,
      error: error.message,
    });
    if (originalOnRetry) {
      originalOnRetry(error, attempt);
    }
  };
  
  try {
    const result = await retry(fn, opts);
    logger.debug(`${operationName} succeeded`, {
      category: 'retry',
      operation: operationName,
    });
    return result;
  } catch (error) {
    logger.error(`${operationName} failed after ${opts.retries} retries`, {
      category: 'retry',
      operation: operationName,
      retries: opts.retries,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Retry an email send operation
 * @param {Function} fn - The async function to send email
 * @returns {Promise} Result of the operation
 */
async function retryEmailSend(fn) {
  return retryOperation(
    fn,
    {
      retries: 3,
      minTimeout: 2000,
      maxTimeout: 10000,
    },
    'email_send'
  );
}

/**
 * Retry a payment verification operation
 * @param {Function} fn - The async function to verify payment
 * @returns {Promise} Result of the operation
 */
async function retryPaymentVerification(fn) {
  return retryOperation(
    fn,
    {
      retries: 5, // More retries for payment verification
      minTimeout: 1000,
      maxTimeout: 5000,
    },
    'payment_verification'
  );
}

/**
 * Retry an API call to external service
 * @param {Function} fn - The async function to call API
 * @param {string} serviceName - Name of the external service
 * @returns {Promise} Result of the operation
 */
async function retryApiCall(fn, serviceName = 'external_api') {
  return retryOperation(
    fn,
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 8000,
    },
    `${serviceName}_api_call`
  );
}

/**
 * Retry a database operation (for transient connection issues)
 * @param {Function} fn - The async function to execute
 * @returns {Promise} Result of the operation
 */
async function retryDatabaseOperation(fn) {
  return retryOperation(
    fn,
    {
      retries: 2, // Fewer retries for database
      minTimeout: 500,
      maxTimeout: 2000,
    },
    'database_operation'
  );
}

/**
 * Check if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is retryable
 */
function isRetryableError(error) {
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // HTTP status codes that are retryable
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  if (error.response && retryableStatusCodes.includes(error.response.status)) {
    return true;
  }
  
  // Database connection errors
  if (error.code === 'ECONNRESET' || error.message?.includes('connection')) {
    return true;
  }
  
  return false;
}

/**
 * Retry with custom condition
 * @param {Function} fn - The async function to retry
 * @param {Function} shouldRetry - Function that returns true if should retry
 * @param {Object} options - Retry options
 * @param {string} operationName - Name of the operation
 * @returns {Promise} Result of the operation
 */
async function retryWithCondition(fn, shouldRetry, options = {}, operationName = 'operation') {
  const opts = {
    ...defaultOptions,
    ...options,
    onRetry: (error, attempt) => {
      if (!shouldRetry(error)) {
        throw error; // Don't retry if condition not met
      }
      logger.warn(`Retrying ${operationName} (condition met)`, {
        category: 'retry',
        operation: operationName,
        attempt,
        error: error.message,
      });
    },
  };
  
  return retryOperation(fn, opts, operationName);
}

module.exports = {
  retryOperation,
  retryEmailSend,
  retryPaymentVerification,
  retryApiCall,
  retryDatabaseOperation,
  isRetryableError,
  retryWithCondition,
};
