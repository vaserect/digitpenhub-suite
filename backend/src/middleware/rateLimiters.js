const rateLimit = require('express-rate-limit');

// Scoped per-org (falls back to IP for unauthenticated requests) so one
// tenant hitting a limit doesn't block every other org sharing the server.
const keyByOrg = (req) => (req.user && req.user.orgId) ? `org:${req.user.orgId}` : req.ip;

// AI generation hits the Anthropic key directly — cap it well below anything
// a real user needs so a runaway loop or shared-key abuse can't exhaust it.
const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByOrg,
  message: { error: 'Too many AI requests. Please wait a moment and try again.' },
});

// Bulk email/SMS/WhatsApp sends fan out to a mail relay or SMS provider —
// limit how often a campaign/broadcast can be fired to avoid burning through
// provider quota or looking like spam abuse.
const bulkSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByOrg,
  message: { error: 'Too many send requests this hour. Please try again later.' },
});

// File uploads consume disk/storage — cap request rate independent of multer's
// per-file size limit.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByOrg,
  message: { error: 'Too many uploads. Please wait a few minutes and try again.' },
});

// Anonymous public-facing endpoints (storefront checkout/cart, appointment
// booking, etc.) accept unauthenticated input — keyed by IP since there's no
// org session yet, guarding against scripted checkout/booking spam and stock-
// zeroing abuse.
const publicSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

module.exports = { aiGenerationLimiter, bulkSendLimiter, uploadLimiter, publicSubmitLimiter };
