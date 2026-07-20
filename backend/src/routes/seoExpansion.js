const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Page Speed Monitor ────────────────────────────────────────────────────────
router.get('/speed', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM seo_page_speed_results WHERE org_id = $1 ORDER BY checked_at DESC LIMIT 50`,
    [req.user.orgId]
  );
  res.json({ results: rows });
}));

router.post('/speed', asyncHandler(async (req, res) => {
  const { pageUrl, lcp, inp, cls, score, suggestions } = req.body || {};
  if (!pageUrl) return res.status(400).json({ error: 'pageUrl is required.' });
  const { rows } = await db.query(
    `INSERT INTO seo_page_speed_results (org_id, page_url, lcp, inp, cls, score, suggestions)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.orgId, pageUrl, lcp || null, inp || null, cls || null, score || null, JSON.stringify(suggestions || [])]
  );
  res.status(201).json({ result: rows[0] });
}));

// ── Google Search Console / Bing Integration ──────────────────────────────────
router.get('/search-console', asyncHandler(async (req, res) => {
  const { provider } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (provider) { conditions.push(`provider = $${idx++}`); params.push(provider); }
  const { rows } = await db.query(`SELECT * FROM seo_search_console WHERE ${conditions.join(' AND ')}`, params);
  res.json({ connections: rows });
}));

router.post('/search-console', asyncHandler(async (req, res) => {
  const { provider, propertyUrl } = req.body || {};
  if (!provider || !propertyUrl) return res.status(400).json({ error: 'provider and propertyUrl are required.' });
  const { rows } = await db.query(
    `INSERT INTO seo_search_console (org_id, provider, property_url) VALUES ($1, $2, $3)
     ON CONFLICT (org_id, provider) DO UPDATE SET property_url = $3, is_connected = false RETURNING *`,
    [req.user.orgId, provider, propertyUrl]
  );
  res.json({ connection: rows[0] });
}));

router.patch('/search-console', asyncHandler(async (req, res) => {
  const { provider, accessToken, refreshToken, propertyUrl } = req.body || {};
  const { rows } = await db.query(
    `UPDATE seo_search_console SET access_token = $1, refresh_token = $2, property_url = COALESCE($3, property_url),
     is_connected = true, token_expires_at = now() + interval '3600 seconds'
     WHERE org_id = $4 AND provider = $5 RETURNING *`,
    [accessToken, refreshToken, propertyUrl, req.user.orgId, provider]
  );
  res.json({ connection: rows[0] });
}));

// ── Search Queries (synced from GSC/Bing) ─────────────────────────────────────
router.get('/queries', asyncHandler(async (req, res) => {
  const { provider, from, to } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (provider) { conditions.push(`provider = $${idx++}`); params.push(provider); }
  if (from) { conditions.push(`recorded_at >= $${idx++}`); params.push(from); }
  if (to) { conditions.push(`recorded_at <= $${idx++}`); params.push(to); }
  const { rows } = await db.query(
    `SELECT * FROM seo_search_queries WHERE ${conditions.join(' AND ')} ORDER BY impressions DESC LIMIT 100`,
    params
  );
  res.json({ queries: rows });
}));

router.post('/queries', asyncHandler(async (req, res) => {
  const { provider, query, impressions, clicks, ctr, avgPosition } = req.body || {};
  if (!query || !provider) return res.status(400).json({ error: 'query and provider are required.' });
  await db.query(
    `INSERT INTO seo_search_queries (org_id, provider, query, impressions, clicks, ctr, avg_position)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT DO NOTHING`,
    [req.user.orgId, provider, query, impressions || 0, clicks || 0, ctr || 0, avgPosition || null]
  );
  res.status(201).json({ ok: true });
}));

// ── Auto-Indexing Pipeline ────────────────────────────────────────────────────
router.post('/index/request', asyncHandler(async (req, res) => {
  const { pageId, action } = req.body || {};
  if (!pageId || !action) return res.status(400).json({ error: 'pageId and action are required.' });
  const { rows } = await db.query(
    `INSERT INTO seo_auto_indexing_log (org_id, page_id, action) VALUES ($1, $2, $3) RETURNING *`,
    [req.user.orgId, pageId, action]
  );
  // Update page last_indexed_at
  await db.query('UPDATE pages SET last_indexed_at = now() WHERE id = $1', [pageId]);
  res.status(201).json({ log: rows[0] });
}));

router.get('/index/log', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM seo_auto_indexing_log WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.orgId]
  );
  res.json({ logs: rows });
}));

// ── Local SEO / Google Business Profile ───────────────────────────────────────
router.get('/local', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM seo_local_listings WHERE org_id = $1 ORDER BY business_name', [req.user.orgId]);
  res.json({ listings: rows });
}));

router.post('/local', asyncHandler(async (req, res) => {
  const { businessName, address, phone, websiteUrl, categories } = req.body || {};
  if (!businessName) return res.status(400).json({ error: 'businessName is required.' });
  const { rows } = await db.query(
    `INSERT INTO seo_local_listings (org_id, business_name, address, phone, website_url, categories)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.user.orgId, businessName, address || null, phone || null, websiteUrl || null, categories || []]
  );
  res.status(201).json({ listing: rows[0] });
}));

// ── AI SEO Content Optimizer ──────────────────────────────────────────────────
router.post('/content-score', asyncHandler(async (req, res) => {
  const { contentId, contentType, contentText, targetKeyword } = req.body || {};
  if (!contentId || !contentType || !contentText) return res.status(400).json({ error: 'contentId, contentType, and contentText are required.' });

  // Simple readability scoring (Flesch-Kincaid approximation)
  const words = contentText.split(/\s+/).filter(Boolean).length;
  const sentences = contentText.split(/[.!?]+/).filter(Boolean).length || 1;
  const syllables = contentText.replace(/[aeiouy]{1,2}/gi, 'a').match(/[aeiouy]/gi)?.length || words;
  const readability = Math.max(0, Math.min(100, 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)));

  // Keyword density check
  const keywordLower = (targetKeyword || '').toLowerCase();
  const textLower = contentText.toLowerCase();
  const keywordCount = keywordLower ? (textLower.match(new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length : 0;
  const density = words > 0 ? (keywordCount / words * 100) : 0;

  // Generate suggestions
  const suggestions = [];
  if (readability < 60) suggestions.push('Consider simplifying your sentences for better readability (target: 60+).');
  if (density < 0.5 && keywordLower) suggestions.push(`Keyword "${targetKeyword}" appears only ${keywordCount} time(s) (${density.toFixed(1)}% density). Aim for 0.5-2.5%.`);
  if (density > 2.5 && keywordLower) suggestions.push(`Keyword "${targetKeyword}" density is ${density.toFixed(1)}% — consider reducing to avoid over-optimization.`);
  if (words < 300) suggestions.push('Aim for at least 300 words for better search ranking potential.');
  if (sentences < 3) suggestions.push('Add more sections/paragraphs to improve content structure.');

  const { rows } = await db.query(
    `INSERT INTO seo_content_scores (org_id, content_id, content_type, content_text, target_keyword, readability_score, seo_score, suggestions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [req.user.orgId, contentId, contentType, contentText, targetKeyword || null,
     readability.toFixed(2), Math.min(100, Math.round((readability + (keywordLower ? Math.min(density * 20, 30) : 30)) / 2)),
     JSON.stringify(suggestions)]
  );
  res.json({ score: rows[0] });
}));

router.get('/content-scores', asyncHandler(async (req, res) => {
  const { contentId } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (contentId) { conditions.push(`content_id = $${idx++}`); params.push(contentId); }
  const { rows } = await db.query(
    `SELECT * FROM seo_content_scores WHERE ${conditions.join(' AND ')} ORDER BY scored_at DESC LIMIT 20`,
    params
  );
  res.json({ scores: rows });
}));

module.exports = router;


// ── Schema Generator ─────────────────────────────────────────────────────────
router.get('/schema', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM seo_schemas WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.orgId]);
  res.json({ items: rows });
}));
router.post('/schema', asyncHandler(async (req, res) => {
  const { rows } = await db.query('INSERT INTO seo_schemas (org_id, data) VALUES ($1, $2) RETURNING *', [req.user.orgId, JSON.stringify(req.body || {})]);
  res.status(201).json({ item: rows[0] });
}));
router.delete('/schema/:id', asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM seo_schemas WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
}));

// ── Sitemap Generator ────────────────────────────────────────────────────────
router.get('/sitemap', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM seo_sitemaps WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.orgId]);
  res.json({ items: rows });
}));
router.post('/sitemap', asyncHandler(async (req, res) => {
  const { rows } = await db.query('INSERT INTO seo_sitemaps (org_id, data) VALUES ($1, $2) RETURNING *', [req.user.orgId, JSON.stringify(req.body || {})]);
  res.status(201).json({ item: rows[0] });
}));

// ── Meta Generator ───────────────────────────────────────────────────────────
router.get('/meta', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM seo_meta_tags WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.orgId]);
  res.json({ items: rows });
}));
router.post('/meta', asyncHandler(async (req, res) => {
  const { rows } = await db.query('INSERT INTO seo_meta_tags (org_id, data) VALUES ($1, $2) RETURNING *', [req.user.orgId, JSON.stringify(req.body || {})]);
  res.status(201).json({ item: rows[0] });
}));

// ── Robots Generator ─────────────────────────────────────────────────────────
router.get('/robots', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM seo_robots WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.orgId]);
  res.json({ items: rows });
}));
router.post('/robots', asyncHandler(async (req, res) => {
  const { rows } = await db.query('INSERT INTO seo_robots (org_id, data) VALUES ($1, $2) RETURNING *', [req.user.orgId, JSON.stringify(req.body || {})]);
  res.status(201).json({ item: rows[0] });
}));

// ── Rank Tracking ────────────────────────────────────────────────────────────
router.get('/rank-tracking', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM seo_rank_tracking WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.orgId]);
  res.json({ items: rows });
}));
router.post('/rank-tracking', asyncHandler(async (req, res) => {
  const { rows } = await db.query('INSERT INTO seo_rank_tracking (org_id, data) VALUES ($1, $2) RETURNING *', [req.user.orgId, JSON.stringify(req.body || {})]);
  res.status(201).json({ item: rows[0] });
}));

// ── SEM / Ad Campaign ROAS Tracker ───────────────────────────────────────────
router.get('/sem-tracker', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM seo_sem_tracker WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.orgId]);
  res.json({ items: rows });
}));
router.post('/sem-tracker', asyncHandler(async (req, res) => {
  const { rows } = await db.query('INSERT INTO seo_sem_tracker (org_id, data) VALUES ($1, $2) RETURNING *', [req.user.orgId, JSON.stringify(req.body || {})]);
  res.status(201).json({ item: rows[0] });
}));

// ── Accessibility (WCAG) Audit Tool ──────────────────────────────────────────
router.get('/accessibility', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM seo_accessibility WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.orgId]);
  res.json({ items: rows });
}));
router.post('/accessibility', asyncHandler(async (req, res) => {
  const { rows } = await db.query('INSERT INTO seo_accessibility (org_id, data) VALUES ($1, $2) RETURNING *', [req.user.orgId, JSON.stringify(req.body || {})]);
  res.status(201).json({ item: rows[0] });
}));

// ── Voice Search / Voice Commerce Optimization ───────────────────────────────
router.get('/voice-search', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM seo_voice_search WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.orgId]);
  res.json({ items: rows });
}));
router.post('/voice-search', asyncHandler(async (req, res) => {
  const { rows } = await db.query('INSERT INTO seo_voice_search (org_id, data) VALUES ($1, $2) RETURNING *', [req.user.orgId, JSON.stringify(req.body || {})]);
  res.status(201).json({ item: rows[0] });
}));
