// Must be required before express so it can patch Router.prototype — this
// forwards any rejected promise from an async route handler to the error
// middleware instead of it becoming an unhandled rejection. Nearly all ~90
// route files here use bare `async (req, res) => {}` handlers with no
// try/catch, so without this a single bad request (bad input, DB constraint,
// null deref) hangs that request forever instead of returning an error.
require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { Sentry, sentryEnabled } = require('./instrument');
const { setSentryUser } = require('./utils/sentry');
const { requestIdMiddleware, addUserContext } = require('./middleware/requestId');
const { csrfProtection } = require('./middleware/csrf');
const { apiLimiter } = require("./middleware/rateLimiters");
const { loadRoutes } = require('./routes/loader/routeLoader');

const app = express();

app.set('trust proxy', 1); // we sit behind OpenLiteSpeed

// Request ID tracking - must be early to track all requests
app.use(requestIdMiddleware);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4000', credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '200kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CSRF protection for state-changing requests
app.use('/api', csrfProtection);

// Add user context to logger after authentication (applied to all /api routes)
app.use('/api', addUserContext);

// Global rate limiting baseline (100 req/min/org)
app.use("/api", apiLimiter);

// ─── Dynamic route loading from routes.config.js ─────────────────────────────
// Routes are auto-discovered and registered with correct middleware per the
// ROUTES_CONFIG array. The loader handles module-level require(), extracts
// special exports (superAdmin routers, inbox.router), and applies the
// domain-grouped middleware chain (requireAuth / requireModuleAccess).
loadRoutes(app);

// 404 handler
app.use((req, res) => {
  if (req.logger) {
    req.logger.warn('Route not found', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
  }
  res.status(404).json({ error: 'Not found.' });
});

// Sentry error handler - must be before other error handlers
if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app, {
    shouldHandleError(error) {
      return error.status >= 500 || !error.status;
    },
  });
}

// Centralised error handler — never leak stack traces to the client in production.
app.use((err, req, res, next) => {
  if (sentryEnabled && req.user) setSentryUser(req.user);
  const errorContext = {
    message: err.message, stack: err.stack, requestId: req.id,
    userId: req.user?.id, orgId: req.user?.orgId,
    method: req.method, url: req.originalUrl, ip: req.ip,
    userAgent: req.get('user-agent'),
  };
  if (req.logger) req.logger.error('Unhandled error', errorContext);
  else logger.error('Unhandled error (no request context)', errorContext);
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

module.exports = app;
