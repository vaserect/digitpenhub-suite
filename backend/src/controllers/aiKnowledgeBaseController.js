const db = require('../db');
const { generateWithAI } = require('../utils/aiGenerate');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total,
            COUNT(DISTINCT category) AS categories,
            COALESCE(SUM(helpful_count),0) AS total_helpful
     FROM ai_knowledge_articles WHERE org_id=$1`, [req.user.orgId]);
  res.json({ stats: rows[0] });
}

async function listArticles(req, res) {
  const { category, search } = req.query;
  let q = `SELECT id,category,title,tags,helpful_count,status,created_at,LEFT(content,150) AS excerpt
           FROM ai_knowledge_articles WHERE org_id=$1`;
  const params = [req.user.orgId];
  if (category) { params.push(category); q += ` AND category=$${params.length}`; }
  if (search) { params.push(search); q += ` AND (title ILIKE '%'||$${params.length}||'%' OR content ILIKE '%'||$${params.length}||'%')`; }
  q += ' ORDER BY category, created_at DESC';
  const { rows } = await db.query(q, params);
  res.json({ articles: rows });
}

async function getCategories(req, res) {
  const { rows } = await db.query(
    `SELECT category, COUNT(*) AS count FROM ai_knowledge_articles WHERE org_id=$1 GROUP BY category ORDER BY count DESC`,
    [req.user.orgId]);
  res.json({ categories: rows });
}

async function getArticle(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM ai_knowledge_articles WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ article: rows[0] });
}

async function createArticle(req, res) {
  const { category, title, content, tags } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title required.' });
  const { rows } = await db.query(
    `INSERT INTO ai_knowledge_articles (org_id,category,title,content,tags)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, category||'General', title.trim(), content||'', JSON.stringify(tags||[])]
  );
  res.status(201).json({ article: rows[0] });
}

async function updateArticle(req, res) {
  const { id } = req.params;
  const { category, title, content, tags, status } = req.body || {};
  const { rows } = await db.query(
    `UPDATE ai_knowledge_articles SET
       category=COALESCE($3,category), title=COALESCE($4,title),
       content=COALESCE($5,content), tags=COALESCE($6,tags),
       status=COALESCE($7,status), updated_at=NOW()
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId, category||null, title||null, content??null,
     tags ? JSON.stringify(tags) : null, status||null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ article: rows[0] });
}

async function deleteArticle(req, res) {
  await db.query(`DELETE FROM ai_knowledge_articles WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function markHelpful(req, res) {
  await db.query(`UPDATE ai_knowledge_articles SET helpful_count=helpful_count+1 WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function generateArticle(req, res) {
  const { topic, category } = req.body || {};
  if (!topic?.trim()) return res.status(400).json({ error: 'topic required.' });
  const result = await generateWithAI({
    orgId: req.user.orgId,
    feature: 'ai-kb:generate-article',
    systemPrompt: 'You write clear, well-structured knowledge base help articles. Reply with the article body only (plain text with simple paragraph breaks, no markdown headers).',
    userPrompt: `Write a knowledge base article${category ? ` in the "${category}" category` : ''} about: ${topic.trim()}`,
    fallback: `[ANTHROPIC_API_KEY isn't configured, so no AI draft is available.]\n\n${topic.trim()}\n\n[Write the article content here.]`,
  });
  res.json(result);
}

module.exports = { getStats, listArticles, getCategories, getArticle, createArticle, updateArticle, deleteArticle, markHelpful, generateArticle };
