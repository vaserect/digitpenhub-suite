// ──────────────────────────────────────────────────────────
// Sentry instrumentation — must be required BEFORE any other
// import (including express) so the v10+ SDK can patch
// modules at import time via OpenTelemetry.
//
// Reference: https://skills.sentry.dev/instrument/references/sdks/node/error-monitoring.md
// ──────────────────────────────────────────────────────────
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

const dsn = process.env.SENTRY_DSN;
let sentryEnabled = false;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'production',
    release: `digitpenhub-suite-api@${process.env.npm_package_version || '0.1.0'}`,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    dataCollection: {
      userInfo: false,
      httpBodies: [],
    },
    integrations: [
      Sentry.httpIntegration({ tracing: true }),
      nodeProfilingIntegration(),
    ],
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.cookie;
        delete event.request.headers.authorization;
      }
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
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'NetworkError',
      'Network request failed',
    ],
  });

  sentryEnabled = true;
  console.log('✅ Sentry error tracking initialized');
}

module.exports = { Sentry, sentryEnabled };
