const { Router } = require('express');
const seoExpansionRouter = require('./seoExpansion');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const { runAudit } = require('../utils/seoAnalyzer');

const r = Router();
r.use(requireAuth);

// ── Rank Tracking ─────────────────────────────────────────────────────────────

r.get('/keywords', async (req, res) => {
  const { rows } = await db.query(
    `SELECT k.*,
       (SELECT json_agg(h ORDER BY h.checked_at DESC) FROM seo_rank_history h WHERE h.keyword_id = k.id LIMIT 10) AS history
     FROM seo_tracked_keywords k WHERE k.org_id = $1 ORDER BY k.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ keywords: rows });
});

r.post('/keywords', async (req, res) => {
  const { keyword, targetUrl } = req.body || {};
  if (!keyword?.trim()) return res.status(400).json({ error: 'keyword is required.' });
  const { rows } = await db.query(
    `INSERT INTO seo_tracked_keywords (org_id, keyword, target_url)
     VALUES ($1, $2, $3) RETURNING *`,
    [req.user.orgId, keyword.trim(), targetUrl || null]
  );
  res.status(201).json({ keyword: rows[0] });
});

r.put('/keywords/:id', async (req, res) => {
  const { rank } = req.body || {};
  const { rows } = await db.query(
    `SELECT id, current_rank, best_rank FROM seo_tracked_keywords WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  const kw = rows[0];
  const newBest = kw.best_rank === null || rank < kw.best_rank ? rank : kw.best_rank;
  const { rows: updated } = await db.query(
    `UPDATE seo_tracked_keywords
     SET prev_rank = current_rank, current_rank = $1, best_rank = $2, last_checked = NOW()
     WHERE id = $3 RETURNING *`,
    [rank, newBest, req.params.id]
  );
  await db.query(
    `INSERT INTO seo_rank_history (keyword_id, rank) VALUES ($1, $2)`,
    [req.params.id, rank]
  );
  res.json({ keyword: updated[0] });
});

r.delete('/keywords/:id', async (req, res) => {
  const { rowCount } = await db.query(
    `DELETE FROM seo_tracked_keywords WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
});

// ── SEO Audits ────────────────────────────────────────────────────────────────

r.get('/audits', async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, url, score, status, created_at FROM seo_audits WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.orgId]
  );
  res.json({ audits: rows });
});

r.get('/audits/:id', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM seo_audits WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ audit: rows[0] });
});

r.post('/audits', async (req, res) => {
  const { url } = req.body || {};
  if (!url?.trim()) return res.status(400).json({ error: 'url is required.' });

  // Real on-page audit — fetches the URL and inspects the actual HTML (see
  // utils/seoAnalyzer.js). No synthetic/random results.
  const results = await runAudit(url.trim());
  const status = results.fetchError ? 'failed' : 'complete';

  const { rows } = await db.query(
    `INSERT INTO seo_audits (org_id, url, score, results, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.orgId, url.trim(), results.score, JSON.stringify(results), status]
  );
  res.status(201).json({ audit: rows[0] });
});

r.delete('/audits/:id', async (req, res) => {
  await db.query(`DELETE FROM seo_audits WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

// ── Backlink Monitoring ───────────────────────────────────────────────────────

r.get('/backlinks/domains', async (req, res) => {
  const { rows } = await db.query(
    `SELECT d.*, COUNT(b.id) AS link_count
     FROM seo_backlink_domains d
     LEFT JOIN seo_backlinks b ON b.domain_id = d.id
     WHERE d.org_id = $1
     GROUP BY d.id ORDER BY d.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ domains: rows });
});

r.post('/backlinks/domains', async (req, res) => {
  const { domain } = req.body || {};
  if (!domain?.trim()) return res.status(400).json({ error: 'domain is required.' });
  const clean = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  try {
    // No real backlink data provider (Moz/Ahrefs/Majestic) is configured for
    // this deployment. Rather than fabricating backlinks for the user to act
    // on, the domain starts at 0 backlinks — real data only appears once a
    // provider is wired up in place of this comment.
    const { rows } = await db.query(
      `INSERT INTO seo_backlink_domains (org_id, domain, total_backlinks) VALUES ($1, $2, 0) RETURNING *`,
      [req.user.orgId, clean]
    );
    res.status(201).json({ domain: rows[0], providerConfigured: false });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Domain already monitored.' });
    throw err;
  }
});

r.get('/backlinks/:domainId', async (req, res) => {
  const { rows: d } = await db.query(
    `SELECT * FROM seo_backlink_domains WHERE id = $1 AND org_id = $2`,
    [req.params.domainId, req.user.orgId]
  );
  if (!d.length) return res.status(404).json({ error: 'Not found.' });
  const { rows: links } = await db.query(
    `SELECT * FROM seo_backlinks WHERE domain_id = $1 ORDER BY domain_authority DESC NULLS LAST, first_seen DESC`,
    [req.params.domainId]
  );
  res.json({ domain: d[0], links });
});

r.delete('/backlinks/domains/:id', async (req, res) => {
  await db.query(`DELETE FROM seo_backlink_domains WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

module.exports = r;
