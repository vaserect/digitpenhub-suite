// ──────────────────────────────────────────────────────────
// Sentry Client-Side Configuration (browser)
// Loaded by @sentry/nextjs at build time.
// ──────────────────────────────────────────────────────────
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (!dsn) {
  console.warn('⚠️  NEXT_PUBLIC_SENTRY_DSN not set — client-side error tracking disabled.');
}

Sentry.init({
  dsn,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // 10% of transactions in production, 100% in dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay — capture all sessions with errors, 10% of all sessions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'NetworkError',
    'Network request failed',
  ],

  beforeSend(event) {
    if (event.request?.url) {
      event.request.url = event.request.url.replace(
        /\/api\/v1\/auth\//,
        '/api/v1/auth/**'
      );
    }
    return event;
  },
});
