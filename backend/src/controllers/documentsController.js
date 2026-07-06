const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');

async function getStats(req, res) {
  const [docRes, folRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS c, COALESCE(SUM(file_size),0)::bigint AS total_size FROM documents WHERE org_id=$1`, [req.user.orgId]),
    db.query(`SELECT COUNT(*)::int AS c FROM document_folders WHERE org_id=$1`, [req.user.orgId]),
  ]);
  res.json({ totalDocuments: docRes.rows[0].c, totalSize: Number(docRes.rows[0].total_size), folders: folRes.rows[0].c });
}

async function listFolders(req, res) {
  const { rows } = await db.query(`SELECT * FROM document_folders WHERE org_id=$1 ORDER BY name`, [req.user.orgId]);
  res.json({ folders: rows });
}

async function createFolder(req, res) {
  const { name, parentId } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(
    `INSERT INTO document_folders (org_id,name,parent_id) VALUES ($1,$2,$3) RETURNING *`,
    [req.user.orgId, name.trim(), parentId||null]
  );
  res.status(201).json({ folder: rows[0] });
}

async function deleteFolder(req, res) {
  await db.query(`DELETE FROM document_folders WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function listDocuments(req, res) {
  const { folderId, search, tag } = req.query;
  const conditions=['org_id=$1']; const vals=[req.user.orgId]; let i=2;
  if (folderId==='root'){conditions.push('folder_id IS NULL');}
  else if (folderId)   {conditions.push(`folder_id=$${i++}`); vals.push(folderId);}
  if (search) {conditions.push(`(name ILIKE $${i} OR description ILIKE $${i})`); vals.push(`%${search}%`); i++;}
  if (tag)    {conditions.push(`$${i}=ANY(tags)`); vals.push(tag); i++;}
  const { rows } = await db.query(`SELECT * FROM documents WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC`, vals);
  res.json({ documents: rows });
}

async function createDocument(req, res) {
  const { name, folderId, fileType, fileSize, description, tags, url } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(
    `INSERT INTO documents (org_id,folder_id,name,file_type,file_size,description,tags,url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.orgId, folderId||null, name.trim(), fileType||null, fileSize||null, description||null, tags||[], url||null]
  );
  res.status(201).json({ document: rows[0] });
}

async function updateDocument(req, res) {
  const { id } = req.params;
  const { name, folderId, description, tags } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (name        !==undefined){updates.push(`name=$${i++}`);        vals.push(name.trim());}
  if (folderId    !==undefined){updates.push(`folder_id=$${i++}`);   vals.push(folderId||null);}
  if (description !==undefined){updates.push(`description=$${i++}`); vals.push(description||null);}
  if (tags        !==undefined){updates.push(`tags=$${i++}`);        vals.push(tags||[]);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at=NOW()');
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE documents SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ document: rows[0] });
}

async function deleteDocument(req, res) {
  await db.query(`DELETE FROM documents WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function exportDocuments(req, res) {
  const { rows } = await db.query(`SELECT * FROM documents WHERE org_id=$1 ORDER BY updated_at DESC`, [req.user.orgId]);
  sendCsv(res, 'documents.csv', rows, autoColumns(rows, ['org_id', 'file_data']));
}

module.exports = { getStats, listFolders, createFolder, deleteFolder, listDocuments, exportDocuments, createDocument, updateDocument, deleteDocument };
