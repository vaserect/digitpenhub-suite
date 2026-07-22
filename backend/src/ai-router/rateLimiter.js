// ai-router/rateLimiter.js
// In-memory sliding-window rate limiter per provider+model.
// Safe for single-process deployments. If the app moves to PM2 cluster mode,
// replace with Redis-backed counter implementing the same 3 methods.

class RateLimiter {
  constructor() {
    this.windows = new Map();
  }

  _key(provider, model) {
    return `${provider}:${model}`;
  }

  _getWindow(key) {
    let w = this.windows.get(key);
    if (!w) {
      w = { minute: [], day: [] };
      this.windows.set(key, w);
    }
    return w;
  }

  canProceed(provider, model, limits) {
    if (!limits) return true;
    const w = this._getWindow(this._key(provider, model));
    const now = Date.now();
    w.minute = w.minute.filter(t => now - t < 60_000);
    w.day = w.day.filter(t => now - t < 86_400_000);
    if (limits.rpm && w.minute.length >= limits.rpm) return false;
    if (limits.rpd && w.day.length >= limits.rpd) return false;
    return true;
  }

  record(provider, model) {
    const w = this._getWindow(this._key(provider, model));
    const now = Date.now();
    w.minute.push(now);
    w.day.push(now);
  }

  status(provider, model, limits) {
    const w = this._getWindow(this._key(provider, model));
    return {
      minuteUsed: w.minute.length,
      minuteLimit: limits?.rpm ?? null,
      dayUsed: w.day.length,
      dayLimit: limits?.rpd ?? null,
    };
  }
}

module.exports = new RateLimiter();
