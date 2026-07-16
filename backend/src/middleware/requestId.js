const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Request ID middleware
 * Adds a unique ID to every request for tracking and correlation
 */

function requestIdMiddleware(req, res, next) {
  // Generate unique request ID
  req.id = uuidv4();
  
  // Add request ID to response headers for client-side tracking
  res.setHeader('X-Request-ID', req.id);
  
  // Track request start time for duration calculation
  req.startTime = Date.now();
  
  // Create a child logger with request context
  req.logger = logger.withContext({
    requestId: req.id,
  });
  
  // Log the incoming request
  req.logger.http(`Incoming request: ${req.method} ${req.originalUrl}`);
  
  // Capture the original res.json to log response
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    // Calculate request duration
    const duration = Date.now() - req.startTime;
    
    // Log the request completion
    logger.logRequest(req, res, duration);
    
    // Call original json method
    return originalJson(body);
  };
  
  // Capture the original res.send to log response
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    // Calculate request duration
    const duration = Date.now() - req.startTime;
    
    // Log the request completion
    logger.logRequest(req, res, duration);
    
    // Call original send method
    return originalSend(body);
  };
  
  next();
}

/**
 * Add user context to logger when authentication is complete
 * This should be called after the requireAuth middleware
 */
function addUserContext(req, res, next) {
  if (req.user && req.logger) {
    // Update logger context with user information
    req.logger = logger.withContext({
      requestId: req.id,
      userId: req.user.id,
      orgId: req.user.orgId,
      userEmail: req.user.email,
    });
  }
  next();
}

module.exports = {
  requestIdMiddleware,
  addUserContext,
};
