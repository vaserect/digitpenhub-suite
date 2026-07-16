const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only initializes if SENTRY_DSN is configured
 */
function initSentry(app) {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.log('⚠️  SENTRY_DSN not configured. Error tracking disabled.');
    return false;
  }
  
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production (0.1 = 10% of transactions)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Set profilesSampleRate to 1.0 to profile 100% of sampled transactions.
    // We recommend adjusting this value in production
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Integrations
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Enable profiling
      nodeProfilingIntegration(),
    ],
    
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.cookie;
        delete event.request.headers.authorization;
      }
      
      // Remove sensitive query parameters
      if (event.request?.query_string) {
        const sensitiveParams = ['password', 'token', 'secret', 'api_key'];
        sensitiveParams.forEach(param => {
          if (event.request.query_string.includes(param)) {
            event.request.query_string = event.request.query_string.replace(
              new RegExp(`${param}=[^&]*`, 'gi'),
              `${param}=[REDACTED]`
            );
          }
        });
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      // Browser errors that shouldn't reach the backend
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Network errors
      'NetworkError',
      'Network request failed',
      // Common user errors
      'Invalid credentials',
      'Unauthorized',
    ],
  });
  
  console.log('✅ Sentry error tracking initialized');
  return true;
}

/**
 * Add user context to Sentry
 * @param {Object} user - User object with id, email, orgId
 */
function setSentryUser(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    orgId: user.orgId,
  });
}

/**
 * Add custom context to Sentry
 * @param {string} key - Context key
 * @param {Object} data - Context data
 */
function setSentryContext(key, data) {
  Sentry.setContext(key, data);
}

/**
 * Capture an exception manually
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 */
function captureException(error, context = {}) {
  Sentry.captureException(error, {
    contexts: context,
  });
}

/**
 * Capture a message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (fatal, error, warning, info, debug)
 * @param {Object} context - Additional context
 */
function captureMessage(message, level = 'info', context = {}) {
  Sentry.captureMessage(message, {
    level,
    contexts: context,
  });
}

/**
 * Create a transaction for performance monitoring
 * @param {string} name - Transaction name
 * @param {string} op - Operation type (http.server, db.query, etc.)
 * @returns {Object} Transaction object
 */
function startTransaction(name, op = 'http.server') {
  return Sentry.startTransaction({
    name,
    op,
  });
}

module.exports = {
  Sentry,
  initSentry,
  setSentryUser,
  setSentryContext,
  captureException,
  captureMessage,
  startTransaction,
};
