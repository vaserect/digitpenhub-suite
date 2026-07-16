const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Centralized publishing registry ───────────────────────────────────────────
// Returns every published asset across all modules for the current org.
// The frontend uses this to render the "Published" dashboard and the embed
// code picker. Each entry includes a `publishMeta` object with the data
// the embed/iframe generator needs.
async function listPublished(req, res) {
  const [pages, funnels, forms, leads, stores, quizzes] = await Promise.all([
    db.query(
      `SELECT id, 'page' AS asset_type, slug, title AS name, updated_at
       FROM pages WHERE org_id = $1 AND status = 'published'
       ORDER BY updated_at DESC`,
      [req.user.orgId]
    ),
    db.query(
      `SELECT id, 'funnel' AS asset_type, id::text AS slug, name, updated_at
       FROM funnels WHERE org_id = $1 AND status = 'published'
       ORDER BY updated_at DESC`,
      [req.user.orgId]
    ),
    db.query(
      `SELECT id::text AS id, 'form' AS asset_type, id::text AS slug, name, created_at AS updated_at
       FROM forms WHERE org_id = $1
       ORDER BY created_at DESC`,
      [req.user.orgId]
    ),
    db.query(
      `SELECT id, 'lead_form' AS asset_type, id::text AS slug, name, updated_at
       FROM lead_forms WHERE org_id = $1
       ORDER BY updated_at DESC`,
      [req.user.orgId]
    ),
    db.query(
      `SELECT id, 'store' AS asset_type, 'store' AS slug, store_name AS name, updated_at
       FROM store_settings WHERE org_id = $1 AND is_published = true
       ORDER BY updated_at DESC`,
      [req.user.orgId]
    ),
    db.query(
      `SELECT id, 'quiz' AS asset_type, id::text AS slug, title AS name, updated_at
       FROM quizzes WHERE org_id = $1 AND published = true
       ORDER BY updated_at DESC`,
      [req.user.orgId]
    ),
  ]);

  const all = [
    ...pages.rows,
    ...funnels.rows,
    ...forms.rows,
    ...leads.rows,
    ...stores.rows,
    ...quizzes.rows,
  ];

  res.json({ assets: all });
}

// ── Embed code generator ─────────────────────────────────────────────────────
// Generates standardized embed snippets (iframe + JavaScript) for any published
// asset type. This keeps embed formatting centralized instead of duplicated
// across LeadGeneration, Forms, QuizBuilder, etc.
const EMBED_PATHS = {
  page:      (id, slug) => `/p/${slug}`,
  funnel:    (id, slug) => `/p/${slug}`,
  form:      (id)       => `/forms/${id}`,
  lead_form: (id)       => `/leads/${id}`,
  store:     (orgId)    => `/store/${orgId}`,
  quiz:      (id)       => `/quiz/${id}`,
};

async function generateEmbed(req, res) {
  const { assetType, assetId, slug } = req.body || {};
  if (!assetType || (!assetId && !slug)) {
    return res.status(400).json({ error: 'assetType and assetId (or slug) are required.' });
  }

  const pathBuilder = EMBED_PATHS[assetType];
  if (!pathBuilder) return res.status(400).json({ error: `Unknown asset type: ${assetType}.` });

  const publicPath = pathBuilder(assetId, slug);
  const publicUrl = `${process.env.FRONTEND_ORIGIN || 'https://suite.digitpenhub.com'}${publicPath}`;

  const iframeSnippet = `<iframe src="${publicUrl}" width="100%" height="650" style="border:0;border-radius:8px;" title="${assetType}" loading="lazy"></iframe>`;

  // JavaScript embed — injects the iframe via JS so the host page's
  // Content-Security-Policy doesn't need to allow inline frames explicitly.
  const jsSnippet = `<script>
(function() {
  var url = ${JSON.stringify(publicUrl)};
  var iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.width = '100%';
  iframe.height = '650';
  iframe.style.border = '0';
  iframe.style.borderRadius = '8px';
  iframe.loading = 'lazy';
  var target = document.currentScript.parentNode;
  target.insertBefore(iframe, document.currentScript);
})();
</script>`;

  res.json({
    publicUrl,
    iframe: iframeSnippet,
    javascript: jsSnippet,
  });
}

router.get('/published', asyncHandler(listPublished));
router.post('/embed', asyncHandler(generateEmbed));

module.exports = router;
