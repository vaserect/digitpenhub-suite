// ──────────────────────────────────────────────────────────
// Sentry Server-Side Configuration (Next.js server)
// Loaded by @sentry/nextjs on server render requests.
// ──────────────────────────────────────────────────────────
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
if (!dsn) {
  console.warn('⚠️  SENTRY_DSN not set — server-side error tracking disabled.');
}

Sentry.init({
  dsn,
  environment: process.env.NODE_ENV || 'development',

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Integrations
  integrations: [
    Sentry.httpIntegration({ tracing: true }),
  ],

  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'NetworkError',
    'Network request failed',
  ],

  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
    }
    return event;
  },
});
