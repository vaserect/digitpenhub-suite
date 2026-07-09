const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Track article views ───────────────────────────────────────────────────────
router.post('/articles/:id/view', asyncHandler(async (req, res) => {
  const { rows: articles } = await db.query(
    `SELECT id, org_id FROM kb_articles WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!articles.length) return res.status(404).json({ error: 'Article not found.' });
  await db.query(
    `UPDATE kb_articles SET view_count = view_count + 1, last_viewed_at = now() WHERE id = $1`,
    [req.params.id]
  );
  await db.query(
    `INSERT INTO kb_article_views (article_id, org_id) VALUES ($1, $2)`,
    [req.params.id, req.user.orgId]
  );
  res.json({ ok: true });
}));

// ── Mark helpful/unhelpful ────────────────────────────────────────────────────
router.post('/articles/:id/helpful', asyncHandler(async (req, res) => {
  const { helpful } = req.body || {};
  if (helpful) {
    await db.query(`UPDATE kb_articles SET helpful_count = helpful_count + 1 WHERE id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]);
  } else {
    await db.query(`UPDATE kb_articles SET unhelpful_count = unhelpful_count + 1 WHERE id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]);
  }
  res.json({ ok: true });
}));

// ── Version history ───────────────────────────────────────────────────────────
router.get('/articles/:id/versions', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT v.*, u.full_name AS created_by_name
     FROM kb_article_versions v LEFT JOIN users u ON u.id = v.created_by
     WHERE v.article_id = $1 AND v.org_id = $2
     ORDER BY v.version DESC LIMIT 20`,
    [req.params.id, req.user.orgId]
  );
  res.json({ versions: rows });
}));

router.post('/articles/:id/versions', asyncHandler(async (req, res) => {
  const { rows: articles } = await db.query(
    `SELECT id, title, content FROM kb_articles WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!articles.length) return res.status(404).json({ error: 'Article not found.' });
  const a = articles[0];
  const { rows: lastVer } = await db.query(
    `SELECT COALESCE(max(version), 0) + 1 AS next_ver FROM kb_article_versions WHERE article_id = $1`,
    [req.params.id]
  );
  await db.query(
    `INSERT INTO kb_article_versions (article_id, org_id, title, content, version, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.params.id, req.user.orgId, a.title, a.content, lastVer[0].next_ver, req.user.id]
  );
  res.status(201).json({ version: lastVer[0].next_ver });
}));

// ── Article analytics ─────────────────────────────────────────────────────────
router.get('/analytics', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT
       count(*) AS total_articles,
       sum(view_count) AS total_views,
       sum(helpful_count) AS total_helpful,
       sum(unhelpful_count) AS total_unhelpful,
       count(*) FILTER (WHERE status = 'published') AS published
     FROM kb_articles WHERE org_id = $1`,
    [req.user.orgId]
  );
  const { rows: topViews } = await db.query(
    `SELECT id, title, view_count FROM kb_articles
     WHERE org_id = $1 ORDER BY view_count DESC LIMIT 5`,
    [req.user.orgId]
  );
  res.json({ analytics: rows[0], topViewed: topViews });
}));

module.exports = router;
