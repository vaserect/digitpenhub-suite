const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const bulkDeleteNotes = bulkDeleteHandler('notes');

async function listNotes(req, res) {
  const { search, tag } = req.query;
  const conditions=['org_id=$1']; const vals=[req.user.orgId]; let i=2;
  if (search) {conditions.push(`(title ILIKE $${i} OR content ILIKE $${i})`); vals.push(`%${search}%`); i++;}
  if (tag)    {conditions.push(`$${i}=ANY(tags)`); vals.push(tag); i++;}
  const { rows } = await db.query(
    `SELECT * FROM notes WHERE ${conditions.join(' AND ')} ORDER BY pinned DESC, updated_at DESC`,
    vals
  );
  res.json({ notes: rows });
}

async function createNote(req, res) {
  const { title, content, color, pinned, tags } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  const { rows } = await db.query(
    `INSERT INTO notes (org_id,title,content,color,pinned,tags) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.orgId, title.trim(), content||'', color||'#ffffff', !!pinned, tags||[]]
  );
  res.status(201).json({ note: rows[0] });
}

async function updateNote(req, res) {
  const { id } = req.params;
  const { title, content, color, pinned, tags } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (title   !==undefined){updates.push(`title=$${i++}`);   vals.push(title.trim());}
  if (content !==undefined){updates.push(`content=$${i++}`); vals.push(content||'');}
  if (color   !==undefined){updates.push(`color=$${i++}`);   vals.push(color||'#ffffff');}
  if (pinned  !==undefined){updates.push(`pinned=$${i++}`);  vals.push(!!pinned);}
  if (tags    !==undefined){updates.push(`tags=$${i++}`);    vals.push(tags||[]);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at=NOW()');
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE notes SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ note: rows[0] });
}

async function deleteNote(req, res) {
  await db.query(`DELETE FROM notes WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function exportNotes(req, res) {
  const { rows } = await db.query(`SELECT * FROM notes WHERE org_id=$1 ORDER BY pinned DESC, updated_at DESC`, [req.user.orgId]);
  sendCsv(res, 'notes.csv', rows, autoColumns(rows));
}

module.exports = { listNotes, exportNotes, createNote, updateNote, deleteNote, bulkDeleteNotes };
