const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

// ── Documents ─────────────────────────────────────────────────────────────────

async function listDocuments(req, res) {
  const { archived, page = 1, limit = 50 } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;

  if (archived === 'true') { conditions.push('is_archived = true'); }
  else if (archived === 'false') { conditions.push('is_archived = false'); }
  else { conditions.push('is_archived = false'); } // Default: not archived

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { rows } = await db.query(
    `SELECT sd.*,
            (SELECT count(*) FROM document_sessions WHERE document_id = sd.id AND is_active = true) AS active_sessions,
            (SELECT full_name FROM users WHERE id = sd.locked_by) AS locked_by_name
     FROM shared_documents sd
     WHERE ${conditions.join(' AND ')}
     ORDER BY sd.updated_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset]
  );
  const { rows: countResult } = await db.query(
    `SELECT count(*)::int AS cnt FROM shared_documents WHERE ${conditions.join(' AND ')}`,
    params
  );
  res.json({ documents: rows, total: countResult[0].cnt });
}

async function createDocument(req, res) {
  const { title, content } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows: docs } = await client.query(
      `INSERT INTO shared_documents (org_id, title, content, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.orgId, title.trim(), content || '', req.user.id]
    );
    const doc = docs[0];
    // Create version 1 snapshot
    await client.query(
      `INSERT INTO document_versions (document_id, version, content, saved_by)
       VALUES ($1, 1, $2, $3)`,
      [doc.id, content || '', req.user.id]
    );
    await client.query('COMMIT');
    res.status(201).json({ document: doc });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getDocument(req, res) {
  const { rows } = await db.query(
    `SELECT sd.*,
            (SELECT full_name FROM users WHERE id = sd.locked_by) AS locked_by_name,
            (SELECT count(*) FROM document_sessions WHERE document_id = sd.id AND is_active = true) AS active_sessions
     FROM shared_documents sd WHERE sd.id = $1 AND sd.org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Document not found.' });
  res.json({ document: rows[0] });
}

async function updateDocument(req, res) {
  const { title, content, changeSummary } = req.body || {};
  if (!title?.trim() && content === undefined) {
    return res.status(400).json({ error: 'title or content is required.' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Get current doc
    const { rows: docs } = await client.query(
      'SELECT * FROM shared_documents WHERE id = $1 AND org_id = $2 FOR UPDATE',
      [req.params.id, req.user.orgId]
    );
    if (!docs.length) return res.status(404).json({ error: 'Document not found.' });
    const doc = docs[0];

    const newVersion = doc.version + 1;
    const newTitle = title?.trim() || doc.title;
    const newContent = content !== undefined ? content : doc.content;

    // Update document
    await client.query(
      'UPDATE shared_documents SET title = $1, content = $2, version = $3, updated_at = now() WHERE id = $4',
      [newTitle, newContent, newVersion, req.params.id]
    );

    // Create version snapshot
    await client.query(
      `INSERT INTO document_versions (document_id, version, content, saved_by, change_summary)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, newVersion, newContent, req.user.id, changeSummary || null]
    );

    await client.query('COMMIT');
    const { rows: updated } = await client.query(
      'SELECT * FROM shared_documents WHERE id = $1', [req.params.id]
    );
    res.json({ document: updated[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteDocument(req, res) {
  // Soft-archive instead of hard delete
  const { rowCount } = await db.query(
    'UPDATE shared_documents SET is_archived = true, updated_at = now() WHERE id = $1 AND org_id = $2',
    [req.params.id, req.user.orgId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Document not found.' });
  res.json({ ok: true });
}

// ── Locking ───────────────────────────────────────────────────────────────────

async function lockDocument(req, res) {
  const { ttlSeconds = 300 } = req.body || {}; // Default 5-minute lock

  const { rows } = await db.query(
    'SELECT * FROM shared_documents WHERE id = $1 AND org_id = $2',
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Document not found.' });
  const doc = rows[0];

  // Check if lock is held by someone else
  if (doc.locked_by && doc.locked_by !== req.user.id && new Date(doc.lock_expires_at) > new Date()) {
    const { rows: locker } = await db.query('SELECT full_name FROM users WHERE id = $1', [doc.locked_by]);
    return res.status(423).json({
      error: 'Document is locked by another user.',
      lockedBy: locker[0]?.full_name || 'another user',
      lockedUntil: doc.lock_expires_at,
    });
  }

  // Acquire or refresh lock
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await db.query(
    'UPDATE shared_documents SET locked_by = $1, locked_at = now(), lock_expires_at = $2 WHERE id = $3',
    [req.user.id, expiresAt, req.params.id]
  );

  res.json({ ok: true, lockedUntil: expiresAt });
}

async function unlockDocument(req, res) {
  const { rows } = await db.query(
    'UPDATE shared_documents SET locked_by = NULL, locked_at = NULL, lock_expires_at = NULL WHERE id = $1 AND org_id = $2 RETURNING id',
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Document not found.' });
  res.json({ ok: true });
}

// ── Version history ───────────────────────────────────────────────────────────

async function getVersions(req, res) {
  const { rows } = await db.query(
    `SELECT dv.id, dv.version, dv.change_summary, dv.created_at, u.full_name AS saved_by_name
     FROM document_versions dv
     JOIN users u ON u.id = dv.saved_by
     WHERE dv.document_id = $1
       AND EXISTS (SELECT 1 FROM shared_documents WHERE id = dv.document_id AND org_id = $2)
     ORDER BY dv.version DESC`,
    [req.params.id, req.user.orgId]
  );
  res.json({ versions: rows });
}

async function getVersion(req, res) {
  const { rows } = await db.query(
    `SELECT dv.*, u.full_name AS saved_by_name
     FROM document_versions dv
     JOIN users u ON u.id = dv.saved_by
     WHERE dv.document_id = $1 AND dv.version = $2::int
       AND EXISTS (SELECT 1 FROM shared_documents WHERE id = dv.document_id AND org_id = $3)`,
    [req.params.id, req.params.version, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Version not found.' });
  res.json({ version: rows[0] });
}

// ── Presence / sessions ───────────────────────────────────────────────────────

async function heartbeat(req, res) {
  await db.query(
    `INSERT INTO document_sessions (document_id, user_id, last_heartbeat, is_active)
     VALUES ($1, $2, now(), true)
     ON CONFLICT (document_id, user_id) DO UPDATE SET last_heartbeat = now(), is_active = true`,
    [req.params.id, req.user.id]
  );
  // Clean up stale sessions (>2 min without heartbeat)
  await db.query(
    "UPDATE document_sessions SET is_active = false WHERE document_id = $1 AND last_heartbeat < now() - interval '2 minutes' AND is_active = true",
    [req.params.id]
  );
  res.json({ ok: true });
}

async function getActiveSessions(req, res) {
  const { rows } = await db.query(
    `SELECT ds.id, ds.user_id, ds.joined_at, ds.last_heartbeat, u.full_name, u.avatar_url
     FROM document_sessions ds
     JOIN users u ON u.id = ds.user_id
     WHERE ds.document_id = $1 AND ds.is_active = true
     ORDER BY ds.last_heartbeat DESC`,
    [req.params.id]
  );
  res.json({ sessions: rows });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

async function getStats(req, res) {
  const { rows: docCount } = await db.query(
    "SELECT count(*)::int AS total FROM shared_documents WHERE org_id = $1 AND is_archived = false",
    [req.user.orgId]
  );
  const { rows: sessionCount } = await db.query(
    `SELECT count(*)::int AS total FROM document_sessions ds
     JOIN shared_documents sd ON sd.id = ds.document_id
     WHERE sd.org_id = $1 AND ds.is_active = true`,
    [req.user.orgId]
  );
  const { rows: lockedCount } = await db.query(
    `SELECT count(*)::int AS total FROM shared_documents WHERE org_id = $1 AND locked_by IS NOT NULL AND is_archived = false`,
    [req.user.orgId]
  );
  res.json({ stats: { documents: docCount[0].total, activeEditors: sessionCount[0].total, locked: lockedCount[0].total } });
}

module.exports = {
  listDocuments, createDocument, getDocument, updateDocument, deleteDocument,
  lockDocument, unlockDocument,
  getVersions, getVersion,
  heartbeat, getActiveSessions,
  getStats,
};
