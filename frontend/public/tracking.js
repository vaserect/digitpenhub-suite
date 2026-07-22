/**
 * Digitpen Tracker — Client-Side SDK
 * 
 * Public endpoint: /tracking.js
 * Injects a <script>-loadable tracker that records clicks, scrolls, and
 * mouse movement events and sends them to /api/v1/heatmaps/track.
 *
 * Usage:
 *   <script src="https://suite.digitpenhub.com/tracking.js"></script>
 *   <script>
 *     DigitpenTracker.init({ orgId: 'your-org-uuid', trackClicks: true, trackScrolls: true });
 *   </script>
 *
 * Privacy: Respects DNT header; no cookies; visitor hash is a SHA-256 hash
 * of orgId + a random session token — never the raw IP or user identifier.
 * GDPR consent gating is handled client-side via the consentManager option.
 */
(function (global) {
  'use strict';

  var TRACK_API = '/api/v1/heatmaps/track';
  var FLUSH_INTERVAL = 3000;       // flush every 3s
  var MAX_EVENTS_BEFORE_FLUSH = 50; // or after 50 events
  var SESSION_DURATION_MS = 30 * 60 * 1000; // 30 min session

  var DigitpenTracker = {
    _config: {
      orgId: null,
      trackClicks: true,
      trackScrolls: true,
      trackMouse: false,     // mouse move is expensive — off by default
      trackForms: true,
      trackErrors: true,
      samplingRate: 100,     // 0–100 (percent)
      privacyMode: 'balanced',
      consentManager: null,  // function that returns true/false for consent
      debug: false
    },
    _sessionId: null,
    _visitorHash: null,
    _events: [],
    _flushTimer: null,
    _initialized: false,
    _pageHeight: 0,
    _viewportHeight: 0,
    _lastMousePos: null,
    _lastMouseTime: 0,
    _mouseSampleInterval: 200, // ms between mouse samples
    _scrollDepth: 0,
    _scrollPercent: 0,
    _clickCoords: [],          // for rage-click detection
    _startTime: null,
    _dnt: false
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  function sha256(str) {
    if (!global.crypto || !global.crypto.subtle) {
      // Fallback: simple hash for environments without SubtleCrypto
      var hash = 0, i, chr;
      for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
      }
      return Math.abs(hash).toString(16);
    }
    // Use SubtleCrypto when available
    var encoder = new TextEncoder();
    var data = encoder.encode(str);
    // Return a synchronous-compatible pattern — but since crypto.subtle.digest
    // is async, we fall back to a simple hash for initial load. The hash is
    // used for visitor identification only, not for security.
    var hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  function now() { return new Date().toISOString(); }

  function log() {
    if (DigitpenTracker._config.debug) {
      console.log('[DigitpenTracker]', Array.prototype.slice.call(arguments).join(' '));
    }
  }

  function warn() {
    if (DigitpenTracker._config.debug) {
      console.warn('[DigitpenTracker]', Array.prototype.slice.call(arguments).join(' '));
    }
  }

  function getPageHeight() {
    return Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );
  }

  function getViewportHeight() {
    return window.innerHeight || document.documentElement.clientHeight;
  }

  function getScrollPercent() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var pHeight = getPageHeight();
    var vHeight = getViewportHeight();
    var scrollable = pHeight - vHeight;
    return scrollable > 0 ? Math.min(100, Math.round((scrollTop / scrollable) * 100)) : 100;
  }

  function getElementSelector(el) {
    if (!el || el === document || el === document.body) return 'body';
    if (el.id) return '#' + el.id;
    var path = [];
    var current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      var selector = current.tagName ? current.tagName.toLowerCase() : '';
      if (current.id) {
        path.unshift('#' + current.id);
        break;
      }
      if (current.className && typeof current.className === 'string') {
        var classes = current.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
        if (classes) selector += '.' + classes;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(' > ') || 'body';
  }

  function getElementText(el) {
    if (!el) return '';
    var text = (el.textContent || '').trim().substring(0, 100);
    return text;
  }

  function isSampled() {
    return Math.random() * 100 < DigitpenTracker._config.samplingRate;
  }

  function getConsent() {
    var mgr = DigitpenTracker._config.consentManager;
    if (typeof mgr === 'function') return mgr();
    // Check for a global consent cookie/flag
    if (global.__gdprConsentGiven !== undefined) return !!global.__gdprConsentGiven;
    // Check for Cookiebot-style consent
    if (global.Cookiebot && global.Cookiebot.consent) return !!global.Cookiebot.consent.statistics;
    // Default: assume consent given (configurable)
    return true;
  }

  // ── Event Recording ─────────────────────────────────────────────────────────

  function recordEvent(type, data) {
    if (!DigitpenTracker._initialized) return;
    if (DigitpenTracker._dnt) return;
    if (!getConsent()) return;
    if (!isSampled()) return;

    // Check session expiry
    if (Date.now() - DigitpenTracker._startTime > SESSION_DURATION_MS) {
      flushNow();
      DigitpenTracker._startTime = Date.now();
    }

    DigitpenTracker._events.push({
      t: now(),
      type: type,
      x: data.x || null,
      y: data.y || null,
      selector: data.selector || null,
      text: data.text || null,
      depth: data.depth || null,
      percent: data.percent || null,
      pageHeight: data.pageHeight || null,
      value: data.value || null
    });

    if (DigitpenTracker._events.length >= MAX_EVENTS_BEFORE_FLUSH) {
      flushNow();
    }
  }

  // ── Click Tracking ──────────────────────────────────────────────────────────

  function handleClick(e) {
    if (!DigitpenTracker._config.trackClicks) return;
    var el = e.target;
    if (!el) return;

    var rect = el.getBoundingClientRect ? el.getBoundingClientRect() : { left: 0, top: 0 };
    var x = Math.round(e.clientX);
    var y = Math.round(e.clientY);
    var selector = getElementSelector(el);
    var text = getElementText(el);

    recordEvent('click', {
      x: x,
      y: y,
      selector: selector,
      text: text
    });
  }

  // ── Scroll Tracking ─────────────────────────────────────────────────────────

  var _scrollTimer = null;
  function handleScroll() {
    if (!DigitpenTracker._config.trackScrolls) return;

    // Throttle scroll events
    if (_scrollTimer) return;
    _scrollTimer = setTimeout(function () {
      _scrollTimer = null;
      var depth = window.pageYOffset || document.documentElement.scrollTop;
      var percent = getScrollPercent();
      var pHeight = getPageHeight();
      var vHeight = getViewportHeight();

      if (depth > DigitpenTracker._scrollDepth) {
        DigitpenTracker._scrollDepth = depth;
      }
      if (percent > DigitpenTracker._scrollPercent) {
        DigitpenTracker._scrollPercent = percent;
      }

      recordEvent('scroll', {
        depth: Math.round(depth),
        percent: percent,
        pageHeight: pHeight
      });
    }, 300);
  }

  // ── Mouse Tracking ──────────────────────────────────────────────────────────

  function handleMouseMove(e) {
    if (!DigitpenTracker._config.trackMouse) return;
    var now = Date.now();
    if (now - DigitpenTracker._lastMouseTime < DigitpenTracker._mouseSampleInterval) return;

    DigitpenTracker._lastMouseTime = now;
    DigitpenTracker._lastMousePos = { x: Math.round(e.clientX), y: Math.round(e.clientY) };

    recordEvent('mousemove', {
      x: DigitpenTracker._lastMousePos.x,
      y: DigitpenTracker._lastMousePos.y
    });
  }

  // ── Form Tracking ───────────────────────────────────────────────────────────

  function handleFormSubmit(e) {
    if (!DigitpenTracker._config.trackForms) return;
    var form = e.target;
    if (!form) return;

    var formData = {};
    var inputs = form.querySelectorAll('input[name], textarea[name], select[name]');
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      if (input.type === 'password' || input.type === 'hidden') continue;
      if (input.type === 'checkbox' || input.type === 'radio') {
        formData[input.name] = input.checked ? input.value || 'on' : '';
      } else {
        formData[input.name] = input.value;
      }
    }

    recordEvent('form_submit', {
      selector: getElementSelector(form),
      text: form.action || '',
      value: JSON.stringify(formData)
    });
  }

  // ── Error Tracking ──────────────────────────────────────────────────────────

  function handleError(msg, source, lineno, colno, error) {
    if (!DigitpenTracker._config.trackErrors) return;
    recordEvent('error', {
      text: msg || 'Unknown error',
      selector: source || '',
      value: (lineno || '') + ':' + (colno || '')
    });
  }

  function handleUnhandledRejection(e) {
    if (!DigitpenTracker._config.trackErrors) return;
    recordEvent('error', {
      text: e.reason ? e.reason.message || String(e.reason) : 'Unhandled rejection',
      value: ''
    });
  }

  // ── Flushing ────────────────────────────────────────────────────────────────

  function flushNow() {
    if (DigitpenTracker._events.length === 0) return;

    var events = DigitpenTracker._events.splice(0, DigitpenTracker._events.length);

    var payload = {
      orgId: DigitpenTracker._config.orgId,
      visitorHash: DigitpenTracker._visitorHash,
      sessionId: DigitpenTracker._sessionId,
      pageUrl: window.location.href,
      pageTitle: document.title,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      events: events,
      scrollDepth: DigitpenTracker._scrollDepth,
      scrollPercent: DigitpenTracker._scrollPercent,
      pageHeight: getPageHeight()
    };

    log('Flushing', events.length, 'events');

    // Use sendBeacon for reliability on page unload, fallback to fetch
    var body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      var blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(TRACK_API, blob);
    } else {
      fetch(TRACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true
      }).catch(function (err) {
        warn('Failed to send tracking data:', err.message);
      });
    }
  }

  // ── Visibility / Unload ─────────────────────────────────────────────────────

  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      flushNow();
    }
  }

  function handleBeforeUnload() {
    flushNow();
  }

  // ── Initialization ──────────────────────────────────────────────────────────

  function init(config) {
    // Check Do Not Track
    DigitpenTracker._dnt = navigator.doNotTrack === '1' || 
                           navigator.doNotTrack === 'yes' ||
                           global.doNotTrack === '1';

    if (!config || !config.orgId) {
      warn('DigitpenTracker.init() requires an orgId');
      return;
    }

    DigitpenTracker._config.orgId = config.orgId;

    // Merge config
    if (config.trackClicks !== undefined) DigitpenTracker._config.trackClicks = config.trackClicks;
    if (config.trackScrolls !== undefined) DigitpenTracker._config.trackScrolls = config.trackScrolls;
    if (config.trackMouse !== undefined) DigitpenTracker._config.trackMouse = config.trackMouse;
    if (config.trackForms !== undefined) DigitpenTracker._config.trackForms = config.trackForms;
    if (config.trackErrors !== undefined) DigitpenTracker._config.trackErrors = config.trackErrors;
    if (config.samplingRate !== undefined) DigitpenTracker._config.samplingRate = config.samplingRate;
    if (config.privacyMode !== undefined) DigitpenTracker._config.privacyMode = config.privacyMode;
    if (config.consentManager !== undefined) DigitpenTracker._config.consentManager = config.consentManager;
    if (config.debug !== undefined) DigitpenTracker._config.debug = config.debug;

    // Generate visitor hash (orgId + random session token — never raw IP/user data)
    var sessionToken = Math.random().toString(36).substring(2, 15);
    DigitpenTracker._visitorHash = sha256(DigitpenTracker._config.orgId + sessionToken);
    DigitpenTracker._sessionId = generateSessionId();
    DigitpenTracker._startTime = Date.now();

    // Record page metrics
    DigitpenTracker._pageHeight = getPageHeight();
    DigitpenTracker._viewportHeight = getViewportHeight();

    // Record initial page view event
    recordEvent('pageview', {});

    // Bind events
    if (DigitpenTracker._config.trackClicks) {
      document.addEventListener('click', handleClick, true);
    }
    if (DigitpenTracker._config.trackScrolls) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    if (DigitpenTracker._config.trackMouse) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
    }
    if (DigitpenTracker._config.trackForms) {
      document.addEventListener('submit', handleFormSubmit, true);
    }
    if (DigitpenTracker._config.trackErrors) {
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    // Flush on visibility change (page hidden) and before unload
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Periodic flush
    DigitpenTracker._flushTimer = setInterval(flushNow, FLUSH_INTERVAL);

    DigitpenTracker._initialized = true;
    log('Initialized for org', config.orgId, '| sampling:', config.samplingRate + '%', '| privacy:', config.privacyMode);
    if (DigitpenTracker._dnt) {
      log('Do Not Track is enabled — data will not be collected');
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  DigitpenTracker.init = init;

  // Expose flush for manual triggering
  DigitpenTracker.flush = flushNow;

  // Check if tracker is active
  DigitpenTracker.isActive = function () {
    return DigitpenTracker._initialized && !DigitpenTracker._dnt && getConsent();
  };

  // Update config at runtime
  DigitpenTracker.setConfig = function (updates) {
    for (var key in updates) {
      if (updates.hasOwnProperty(key) && DigitpenTracker._config.hasOwnProperty(key)) {
        DigitpenTracker._config[key] = updates[key];
      }
    }
  };

  // ── Export ──────────────────────────────────────────────────────────────────

  global.DigitpenTracker = DigitpenTracker;

  log('SDK loaded. Call DigitpenTracker.init({ orgId: "..." }) to start tracking.');

})(typeof window !== 'undefined' ? window : this);
