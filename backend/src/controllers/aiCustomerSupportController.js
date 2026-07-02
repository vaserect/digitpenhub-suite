const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total, COUNT(DISTINCT category) AS categories,
            COALESCE(SUM(helpful_count),0) AS total_helpful
     FROM support_faqs WHERE org_id=$1`, [req.user.orgId]);
  res.json({ stats: rows[0] });
}

async function listFaqs(req, res) {
  const { category } = req.query;
  const { rows } = await db.query(
    `SELECT * FROM support_faqs WHERE org_id=$1 ${category ? 'AND category=$2' : ''} ORDER BY category, sort_order, created_at`,
    category ? [req.user.orgId, category] : [req.user.orgId]
  );
  res.json({ faqs: rows });
}

async function getCategories(req, res) {
  const { rows } = await db.query(
    `SELECT category, COUNT(*) AS count FROM support_faqs WHERE org_id=$1 GROUP BY category ORDER BY count DESC`,
    [req.user.orgId]);
  res.json({ categories: rows });
}

async function createFaq(req, res) {
  const { category, question, answer, tags, sort_order } = req.body || {};
  if (!question?.trim()) return res.status(400).json({ error: 'question required.' });
  const { rows } = await db.query(
    `INSERT INTO support_faqs (org_id,category,question,answer,tags,sort_order)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.orgId, category||'General', question.trim(), answer||null,
     JSON.stringify(tags||[]), sort_order||0]
  );
  res.status(201).json({ faq: rows[0] });
}

async function updateFaq(req, res) {
  const { id } = req.params;
  const { category, question, answer, tags, sort_order } = req.body || {};
  const { rows } = await db.query(
    `UPDATE support_faqs SET
       category=COALESCE($3,category), question=COALESCE($4,question),
       answer=$5, tags=COALESCE($6,tags), sort_order=COALESCE($7,sort_order)
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId, category||null, question||null, answer??null,
     tags ? JSON.stringify(tags) : null, sort_order??null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ faq: rows[0] });
}

async function deleteFaq(req, res) {
  await db.query(`DELETE FROM support_faqs WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function markHelpful(req, res) {
  await db.query(`UPDATE support_faqs SET helpful_count=helpful_count+1 WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
}

module.exports = { getStats, listFaqs, getCategories, createFaq, updateFaq, deleteFaq, markHelpful };
