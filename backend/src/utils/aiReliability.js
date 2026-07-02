const db = require('../db');

const DEFAULT_TIMEOUT_MS = 15000;

// Wraps a fetch() call with a hard timeout so an AI/third-party API that
// never responds can't hang a request indefinitely (continuous-improvement
// Step 1e — "never leave a request hanging").
function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
}

// Records every AI call attempt (success or failure) so failures are visible
// to a future pass or the user instead of a silent mystery. Fire-and-forget —
// logging must never be the reason a real request fails.
async function logAiCall({ orgId, feature, provider, success, usedFallback = false, errorMessage = null, durationMs = null }) {
  try {
    await db.query(
      `INSERT INTO ai_call_log (org_id, feature, provider, success, used_fallback, error_message, duration_ms)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [orgId || null, feature, provider, success, usedFallback, errorMessage, durationMs]
    );
  } catch { /* logging must never break the actual request */ }
}

module.exports = { fetchWithTimeout, logAiCall, DEFAULT_TIMEOUT_MS };
