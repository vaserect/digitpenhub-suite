const winston = require('winston');
const path = require('path');

/**
 * Structured logging utility with Winston
 * Provides consistent logging across the application with request ID tracking
 */

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Custom format for console output (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, requestId, userId, orgId, module, action, ...meta } = info;
    
    let log = `${timestamp} [${level}]`;
    
    if (requestId) log += ` [${requestId}]`;
    if (userId) log += ` [user:${userId}]`;
    if (orgId) log += ` [org:${orgId}]`;
    if (module) log += ` [${module}]`;
    if (action) log += ` [${action}]`;
    
    log += `: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// JSON format for file output (production)
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
  })
);

// File transports (production only)
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || path.join(__dirname, '../../logs');
  
  // Combined log (all levels)
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: jsonFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
  
  // Error log (errors only)
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

/**
 * Create a child logger with context
 * @param {Object} context - Context to add to all logs (requestId, userId, orgId, etc.)
 * @returns {Object} Child logger with context
 */
logger.withContext = (context) => {
  return logger.child(context);
};

/**
 * Log HTTP request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
logger.logRequest = (req, res, duration) => {
  const { method, originalUrl, ip } = req;
  const { statusCode } = res;
  
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';
  
  logger.log({
    level,
    message: `${method} ${originalUrl}`,
    requestId: req.id,
    userId: req.user?.id,
    orgId: req.user?.orgId,
    method,
    url: originalUrl,
    statusCode,
    duration,
    ip,
    userAgent: req.get('user-agent'),
  });
};

/**
 * Log security event
 * @param {string} event - Event type (login_success, login_failed, etc.)
 * @param {Object} details - Event details
 */
logger.logSecurity = (event, details) => {
  logger.info({
    message: `Security event: ${event}`,
    event,
    category: 'security',
    ...details,
  });
};

/**
 * Log audit event
 * @param {string} action - Action performed
 * @param {Object} details - Action details
 */
logger.logAudit = (action, details) => {
  logger.info({
    message: `Audit: ${action}`,
    action,
    category: 'audit',
    ...details,
  });
};

/**
 * Log external service call
 * @param {string} service - Service name (email, payment, etc.)
 * @param {string} operation - Operation performed
 * @param {Object} details - Operation details
 */
logger.logExternalService = (service, operation, details) => {
  logger.info({
    message: `External service: ${service}.${operation}`,
    service,
    operation,
    category: 'external',
    ...details,
  });
};

/**
 * Log database query (for slow query tracking)
 * @param {string} query - SQL query
 * @param {number} duration - Query duration in ms
 * @param {Object} context - Additional context
 */
logger.logQuery = (query, duration, context = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  
  logger.log({
    level,
    message: `Database query: ${duration}ms`,
    category: 'database',
    query: query.substring(0, 200), // Truncate long queries
    duration,
    ...context,
  });
};

/**
 * Log performance metric
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {Object} context - Additional context
 */
logger.logMetric = (metric, value, context = {}) => {
  logger.info({
    message: `Metric: ${metric} = ${value}`,
    category: 'metric',
    metric,
    value,
    ...context,
  });
};

module.exports = logger;
