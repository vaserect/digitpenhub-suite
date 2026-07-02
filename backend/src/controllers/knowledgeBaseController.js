const db = require('../db');

async function getStats(req, res) {
  const [artRes, catRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE status='published')::int AS published FROM kb_articles WHERE org_id=$1`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c FROM kb_categories WHERE org_id=$1`, [req.user.orgId]),
  ]);
  res.json({ totalArticles: artRes.rows[0].total, published: artRes.rows[0].published, categories: catRes.rows[0].c });
}

async function listCategories(req, res) {
  const { rows } = await db.query(
    `SELECT c.*, COUNT(a.id)::int AS article_count FROM kb_categories c
     LEFT JOIN kb_articles a ON a.category_id=c.id
     WHERE c.org_id=$1 GROUP BY c.id ORDER BY c.name`,
    [req.user.orgId]
  );
  res.json({ categories: rows });
}

async function createCategory(req, res) {
  const { name, icon } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(
    `INSERT INTO kb_categories (org_id,name,icon) VALUES ($1,$2,$3) RETURNING *`,
    [req.user.orgId, name.trim(), icon||'📄']
  );
  res.status(201).json({ category: rows[0] });
}

async function deleteCategory(req, res) {
  await db.query(`DELETE FROM kb_categories WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function listArticles(req, res) {
  const { categoryId, status, search } = req.query;
  const conditions=['a.org_id=$1']; const vals=[req.user.orgId]; let i=2;
  if (categoryId) {conditions.push(`a.category_id=$${i++}`); vals.push(categoryId);}
  if (status)     {conditions.push(`a.status=$${i++}`);       vals.push(status);}
  if (search)     {conditions.push(`(a.title ILIKE $${i} OR a.content ILIKE $${i})`); vals.push(`%${search}%`); i++;}
  const { rows } = await db.query(
    `SELECT a.*, c.name AS category_name FROM kb_articles a
     LEFT JOIN kb_categories c ON c.id=a.category_id
     WHERE ${conditions.join(' AND ')} ORDER BY a.updated_at DESC`,
    vals
  );
  res.json({ articles: rows });
}

async function getArticle(req, res) {
  const { rows } = await db.query(`SELECT * FROM kb_articles WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  await db.query(`UPDATE kb_articles SET views=views+1 WHERE id=$1`, [req.params.id]);
  res.json({ article: rows[0] });
}

async function createArticle(req, res) {
  const { title, content, categoryId, status } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  const { rows } = await db.query(
    `INSERT INTO kb_articles (org_id,category_id,title,content,status) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, categoryId||null, title.trim(), content||'', status||'published']
  );
  res.status(201).json({ article: rows[0] });
}

async function updateArticle(req, res) {
  const { id } = req.params;
  const { title, content, categoryId, status } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (title      !==undefined){updates.push(`title=$${i++}`);       vals.push(title.trim());}
  if (content    !==undefined){updates.push(`content=$${i++}`);     vals.push(content||'');}
  if (categoryId !==undefined){updates.push(`category_id=$${i++}`); vals.push(categoryId||null);}
  if (status     !==undefined){updates.push(`status=$${i++}`);      vals.push(status);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at=NOW()');
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE kb_articles SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ article: rows[0] });
}

async function deleteArticle(req, res) {
  await db.query(`DELETE FROM kb_articles WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { getStats, listCategories, createCategory, deleteCategory, listArticles, getArticle, createArticle, updateArticle, deleteArticle };
