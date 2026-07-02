const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');

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

  // Simulate an audit with realistic generated results
  const score = Math.floor(Math.random() * 30) + 55; // 55–84
  const results = generateAuditResults(url.trim(), score);

  const { rows } = await db.query(
    `INSERT INTO seo_audits (org_id, url, score, results, status)
     VALUES ($1, $2, $3, $4, 'complete') RETURNING *`,
    [req.user.orgId, url.trim(), score, JSON.stringify(results)]
  );
  res.status(201).json({ audit: rows[0] });
});

r.delete('/audits/:id', async (req, res) => {
  await db.query(`DELETE FROM seo_audits WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

function generateAuditResults(url, score) {
  const good = score >= 75;
  return {
    meta: {
      titlePresent: true, titleLength: good ? 58 : 72,
      descriptionPresent: good, descriptionLength: good ? 148 : 0,
      canonicalPresent: good, robotsMeta: 'index, follow',
    },
    headings: { h1Count: 1, h2Count: good ? 4 : 0, h3Count: good ? 6 : 0 },
    images: { total: good ? 8 : 12, missingAlt: good ? 1 : 5, oversized: good ? 0 : 3 },
    links: { internal: good ? 12 : 4, external: good ? 5 : 1, broken: good ? 0 : 2 },
    performance: {
      lcp: good ? '2.1s' : '4.8s', fid: good ? '45ms' : '220ms', cls: good ? '0.04' : '0.28',
      pageSize: good ? '1.2 MB' : '4.8 MB', requests: good ? 28 : 67,
    },
    technical: {
      ssl: true, mobile: good, structured_data: good,
      sitemapFound: good, robotsTxtFound: true, h1Unique: true,
    },
    issues: generateIssues(score),
  };
}

function generateIssues(score) {
  const all = [
    { severity: 'critical', title: 'Missing meta description', detail: 'Add a compelling meta description (120–160 chars) to improve click-through rate.' },
    { severity: 'critical', title: 'Broken internal links detected', detail: '2 internal links return 404. Fix or redirect them.' },
    { severity: 'warning', title: 'Images missing alt text', detail: '5 images have no alt attribute. Add descriptive alt text for accessibility and SEO.' },
    { severity: 'warning', title: 'Page load speed is slow', detail: 'LCP of 4.8s exceeds the 2.5s threshold. Optimise images and defer non-critical JS.' },
    { severity: 'warning', title: 'No structured data found', detail: 'Add JSON-LD schema markup to improve rich snippet eligibility.' },
    { severity: 'warning', title: 'H2/H3 headings missing', detail: 'Content lacks secondary headings. Structure your content with H2/H3 for better scannability.' },
    { severity: 'info', title: 'Sitemap not found', detail: 'Submit a sitemap.xml to help search engines discover all your pages.' },
    { severity: 'info', title: 'External links open in same tab', detail: 'Consider adding rel="noopener noreferrer" and target="_blank" on outbound links.' },
  ];
  const count = score >= 75 ? 2 : score >= 65 ? 4 : 6;
  return all.slice(0, count);
}

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
    const { rows } = await db.query(
      `INSERT INTO seo_backlink_domains (org_id, domain) VALUES ($1, $2) RETURNING *`,
      [req.user.orgId, clean]
    );
    // Seed with realistic mock backlinks
    const mockLinks = generateMockBacklinks(rows[0].id, clean);
    for (const lnk of mockLinks) {
      await db.query(
        `INSERT INTO seo_backlinks (domain_id, source_url, anchor_text, link_type, domain_authority, status)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [lnk.domain_id, lnk.source_url, lnk.anchor_text, lnk.link_type, lnk.domain_authority, lnk.status]
      );
    }
    await db.query(
      `UPDATE seo_backlink_domains SET total_backlinks = $1, last_checked = NOW() WHERE id = $2`,
      [mockLinks.length, rows[0].id]
    );
    res.status(201).json({ domain: rows[0] });
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

function generateMockBacklinks(domainId, domain) {
  const sources = [
    { src: 'techcrunch.com', da: 92 }, { src: 'medium.com', da: 88 },
    { src: 'reddit.com/r/business', da: 91 }, { src: 'dev.to', da: 78 },
    { src: 'producthunt.com', da: 82 }, { src: 'hackernoon.com', da: 75 },
    { src: 'forbes.com', da: 95 }, { src: 'entrepreneur.com', da: 87 },
    { src: 'indiehackers.com', da: 72 }, { src: 'linkedin.com', da: 98 },
    { src: 'twitter.com', da: 94 }, { src: 'quora.com', da: 86 },
    { src: 'g2.com/reviews', da: 79 }, { src: 'capterra.com', da: 81 },
    { src: 'saashub.com', da: 65 },
  ];
  const anchors = [`Visit ${domain}`, 'Click here', domain, 'Learn more', 'Official website', 'Source', 'Read more', 'Check it out'];
  const count = Math.floor(Math.random() * 8) + 5;
  return sources.slice(0, count).map((s) => ({
    domain_id: domainId,
    source_url: `https://${s.src}/posts/${Math.random().toString(36).slice(2, 8)}`,
    anchor_text: anchors[Math.floor(Math.random() * anchors.length)],
    link_type: Math.random() > 0.3 ? 'dofollow' : 'nofollow',
    domain_authority: s.da,
    status: Math.random() > 0.1 ? 'active' : 'lost',
  }));
}

module.exports = r;
