const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER(WHERE status='active') AS active,
            COALESCE(SUM(impressions),0) AS total_impressions,
            COALESCE(SUM(conversions),0) AS total_conversions
     FROM popups WHERE org_id=$1`, [req.user.orgId]);
  res.json({ stats: rows[0] });
}

async function listPopups(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM popups WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  res.json({ popups: rows });
}

async function createPopup(req, res) {
  const { name, trigger_type, trigger_delay, trigger_scroll, headline, body_text, cta_text, cta_url,
          image_url, bg_color, text_color, accent_color, position, size } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required.' });
  const { rows } = await db.query(
    `INSERT INTO popups (org_id,name,trigger_type,trigger_delay,trigger_scroll,headline,body_text,
       cta_text,cta_url,image_url,bg_color,text_color,accent_color,position,size)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [req.user.orgId, name.trim(), trigger_type||'delay', trigger_delay??5, trigger_scroll??50,
     headline||null, body_text||null, cta_text||null, cta_url||null, image_url||null,
     bg_color||'#ffffff', text_color||'#000000', accent_color||'#2563eb',
     position||'center', size||'medium']
  );
  res.status(201).json({ popup: rows[0] });
}

async function updatePopup(req, res) {
  const { id } = req.params;
  const f = req.body || {};
  const { rows } = await db.query(
    `UPDATE popups SET
       name=COALESCE($3,name), trigger_type=COALESCE($4,trigger_type),
       trigger_delay=COALESCE($5,trigger_delay), trigger_scroll=COALESCE($6,trigger_scroll),
       headline=$7, body_text=$8, cta_text=$9, cta_url=$10, image_url=$11,
       bg_color=COALESCE($12,bg_color), text_color=COALESCE($13,text_color),
       accent_color=COALESCE($14,accent_color), position=COALESCE($15,position),
       size=COALESCE($16,size), status=COALESCE($17,status), updated_at=NOW()
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId,
     f.name||null, f.trigger_type||null, f.trigger_delay??null, f.trigger_scroll??null,
     f.headline??null, f.body_text??null, f.cta_text??null, f.cta_url??null, f.image_url??null,
     f.bg_color||null, f.text_color||null, f.accent_color||null, f.position||null,
     f.size||null, f.status||null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ popup: rows[0] });
}

async function deletePopup(req, res) {
  await db.query(`DELETE FROM popups WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// ── Public — no auth (embed script + tracking pixels called from third-party
// sites). These power the embed snippet copied from the Popup Builder UI, so
// they must stay reachable by anonymous visitors, not just the org's own
// dashboard. Mirrors formsController's getPublicForm / storeBuilder's public
// routes. Tracking increments intentionally have no org_id check — same
// acceptable risk profile as other public pageview counters in this app. ────

async function getPublicPopup(req, res) {
  const { rows } = await db.query(
    `SELECT id, trigger_type, trigger_delay, trigger_scroll, headline, body_text, cta_text, cta_url,
            image_url, bg_color, text_color, accent_color, position, size
     FROM popups WHERE id=$1 AND status='active'`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Popup not found or inactive.' });
  res.json({ popup: rows[0] });
}

async function trackImpression(req, res) {
  await db.query(`UPDATE popups SET impressions=impressions+1 WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
}

async function trackConversion(req, res) {
  await db.query(`UPDATE popups SET conversions=conversions+1 WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
}

// Serves the actual embed <script> payload as JavaScript (not JSON) so a
// third-party site can drop in a single <script src="…/embed/:id.js"> tag
// with no framework dependency. Vanilla DOM APIs only — this runs on other
// people's pages. Config is fetched at runtime (not inlined here) so editing
// a popup in the dashboard takes effect immediately without recopying code.
function getEmbedScript(req, res) {
  const { id } = req.params;
  const apiBase = `${req.protocol}://${req.get('host')}/api/v1/popup-builder`;
  const safeId = String(id).replace(/[^a-zA-Z0-9-]/g, '');

  const js = `
(function () {
  var POPUP_ID = ${JSON.stringify(safeId)};
  var API_BASE = ${JSON.stringify(apiBase)};
  var STORAGE_KEY = 'dph_popup_shown_' + POPUP_ID;

  function trackImpression() {
    fetch(API_BASE + '/' + POPUP_ID + '/impression', { method: 'POST' }).catch(function () {});
  }
  function trackConversion() {
    fetch(API_BASE + '/' + POPUP_ID + '/conversion', { method: 'POST' }).catch(function () {});
  }

  function renderPopup(cfg) {
    if (document.getElementById('dph-popup-' + POPUP_ID)) return;

    var overlay = document.createElement('div');
    overlay.id = 'dph-popup-' + POPUP_ID;
    overlay.setAttribute('style', [
      'position:fixed', 'inset:0', 'z-index:2147483000',
      'background:rgba(0,0,0,0.5)',
      'display:flex',
      'align-items:' + (cfg.position === 'bottom' ? 'flex-end' : cfg.position === 'top' ? 'flex-start' : 'center'),
      'justify-content:' + (cfg.position === 'bottom-right' ? 'flex-end' : cfg.position === 'bottom-left' ? 'flex-start' : 'center'),
      'padding:16px'
    ].join(';'));

    var maxWidth = cfg.size === 'large' ? 600 : cfg.size === 'small' ? 300 : 420;
    var box = document.createElement('div');
    box.setAttribute('style', [
      'background:' + (cfg.bg_color || '#ffffff'),
      'color:' + (cfg.text_color || '#111111'),
      'border-radius:12px', 'padding:2rem',
      'max-width:' + maxWidth + 'px', 'width:100%',
      'position:relative', 'box-shadow:0 20px 60px rgba(0,0,0,0.3)',
      'font-family:system-ui,-apple-system,sans-serif'
    ].join(';'));

    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&#10005;';
    closeBtn.setAttribute('style', [
      'position:absolute', 'top:12px', 'right:12px', 'background:none',
      'border:none', 'font-size:1.2rem', 'cursor:pointer', 'color:' + (cfg.text_color || '#111111')
    ].join(';'));
    closeBtn.onclick = function () { overlay.remove(); };
    box.appendChild(closeBtn);

    if (cfg.image_url) {
      var img = document.createElement('img');
      img.src = cfg.image_url;
      img.setAttribute('style', 'width:100%;border-radius:8px;margin-bottom:1rem;display:block;');
      box.appendChild(img);
    }
    if (cfg.headline) {
      var h = document.createElement('h3');
      h.textContent = cfg.headline;
      h.setAttribute('style', 'margin:0 0 0.5rem;font-size:1.25rem;');
      box.appendChild(h);
    }
    if (cfg.body_text) {
      var p = document.createElement('p');
      p.textContent = cfg.body_text;
      p.setAttribute('style', 'margin:0 0 1rem;opacity:0.85;');
      box.appendChild(p);
    }
    if (cfg.cta_text) {
      var cta = document.createElement('button');
      cta.textContent = cfg.cta_text;
      cta.setAttribute('style', [
        'background:' + (cfg.accent_color || '#2563eb'), 'color:#fff', 'border:none',
        'border-radius:8px', 'padding:0.6rem 1.5rem', 'font-weight:700',
        'cursor:pointer', 'font-size:0.9rem'
      ].join(';'));
      cta.onclick = function () {
        trackConversion();
        if (cfg.cta_url) window.open(cfg.cta_url, '_blank', 'noopener');
        overlay.remove();
      };
      box.appendChild(cta);
    }

    overlay.appendChild(box);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    trackImpression();
  }

  function showOnce(cfg) {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    sessionStorage.setItem(STORAGE_KEY, '1');
    renderPopup(cfg);
  }

  function arm(cfg) {
    var trigger = cfg.trigger_type || 'delay';
    if (trigger === 'immediate') {
      showOnce(cfg);
    } else if (trigger === 'delay') {
      setTimeout(function () { showOnce(cfg); }, (Number(cfg.trigger_delay) || 5) * 1000);
    } else if (trigger === 'scroll') {
      var threshold = Number(cfg.trigger_scroll) || 50;
      var onScroll = function () {
        var doc = document.documentElement;
        var scrolled = (doc.scrollTop + window.innerHeight) / doc.scrollHeight * 100;
        if (scrolled >= threshold) {
          window.removeEventListener('scroll', onScroll);
          showOnce(cfg);
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    } else if (trigger === 'exit_intent') {
      var onExit = function (e) {
        if (e.clientY <= 0) {
          document.removeEventListener('mouseleave', onExit);
          showOnce(cfg);
        }
      };
      document.addEventListener('mouseleave', onExit);
    }
  }

  function init() {
    fetch(API_BASE + '/' + POPUP_ID + '/public')
      .then(function (r) { if (!r.ok) throw new Error('not_found'); return r.json(); })
      .then(function (data) { if (data && data.popup) arm(data.popup); })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(js);
}

module.exports = {
  getStats, listPopups, createPopup, updatePopup, deletePopup,
  getPublicPopup, trackImpression, trackConversion, getEmbedScript,
};
