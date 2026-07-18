/**
 * Lightweight CSRF protection via Origin / Referer header validation.
 *
 * Since the Next.js frontend proxies all API calls same-origin through
 * next.config.js rewrites, the browser's same-origin policy already
 * prevents cross-origin reads.  This middleware closes the remaining
 * gap: it rejects state-changing requests (POST/PUT/PATCH/DELETE) whose
 * Origin or Referer header doesn't match the configured frontend origin.
 *
 * Requests that lack both headers (some privacy-focused browsers strip
 * Referer, and programmatic API clients may omit both) are allowed
 * through — this is defense-in-depth, not a hard gate.  The real CSRF
 * boundary remains the HttpOnly + SameSite cookie.
 */
function csrfProtection(req, res, next) {
  // Safe methods don't change state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  // Webhooks and health checks are not user-facing
  if (req.path.startsWith('/api/v1/billing/webhook')) return next();
  if (req.path === '/api/v1/health') return next();

  // Public form/lead/booking submissions come from third-party origins
  if (req.path.startsWith('/api/v1/leads/')) return next();
  if (req.path.startsWith('/api/v1/forms/')) return next();
  if (req.path.startsWith('/api/v1/pages/public')) return next();
  if (req.path.startsWith('/api/v1/landing-pages/public')) return next();
  if (req.path.startsWith('/api/v1/store-builder/public')) return next();
  if (req.path.startsWith('/api/v1/book/')) return next();

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const allowed = process.env.FRONTEND_ORIGIN || 'http://localhost:4000';

  // If we have an Origin, it must match.  If we don't have an Origin but
  // have a Referer, its origin must match.  If we have neither (e.g. a
  // curl script), pass through — SameSite=Lax on the cookie already
  // prevents naive CSRF from external forms.
  if (origin && !origin.startsWith(allowed)) {
    return res.status(403).json({ error: 'Cross-origin request rejected.' });
  }
  if (!origin && referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!refOrigin.startsWith(allowed)) {
        return res.status(403).json({ error: 'Cross-origin request rejected.' });
      }
    } catch { /* malformed referer — allow through */ }
  }

  next();
}

module.exports = { csrfProtection };
