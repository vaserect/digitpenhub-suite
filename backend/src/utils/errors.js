// backend/src/utils/errors.js
// Custom error classes with standardized error codes for API responses.
// Every error includes a `code` string that frontend code can check reliably
// (instead of parsing `error` message text), plus a human-readable `message`.

/**
 * Base error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize to a JSON-safe object for API responses.
   */
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(process.env.NODE_ENV !== 'production' ? { stack: this.stack } : {}),
    };
  }
}

/**
 * Validation error (400)
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', fields = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.fields = fields;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ...(this.fields ? { fields: this.fields } : {}),
    };
  }
}

/**
 * Not found error (404)
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized error (401)
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error (403)
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * Conflict error (409)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error (429)
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * Upgrade required error (402) — not enough plan capacity
 */
class UpgradeRequiredError extends AppError {
  constructor(message = 'Upgrade required', moduleSlug = null) {
    super(message, 402, 'UPGRADE_REQUIRED');
    this.name = 'UpgradeRequiredError';
    this.moduleSlug = moduleSlug;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      upgradeRequired: true,
      moduleSlug: this.moduleSlug,
    };
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  UpgradeRequiredError,
};
