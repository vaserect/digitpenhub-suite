const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { unreadOnly, source, assignedTo, page = 1, limit = 50 } = req.query;
  const conditions = ['org_id = $1', 'user_id = $2'];
  const params = [req.user.orgId, req.user.id];
  let idx = 3;

  if (unreadOnly === 'true') { conditions.push(`is_read = false`); }
  if (source) { conditions.push(`source = $${idx++}`); params.push(source); }
  if (assignedTo) { conditions.push(`assigned_to = $${idx++}`); params.push(assignedTo); }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { rows } = await db.query(
    `SELECT * FROM inbox_messages WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset]
  );
  const { rows: countResult } = await db.query(
    `SELECT count(*) AS cnt FROM inbox_messages WHERE ${conditions.join(' AND ')}`,
    params
  );
  const { rows: unreadResult } = await db.query(
    `SELECT count(*) AS cnt FROM inbox_messages WHERE org_id = $1 AND user_id = $2 AND is_read = false`,
    [req.user.orgId, req.user.id]
  );

  res.json({
    messages: rows,
    total: parseInt(countResult[0].cnt),
    unreadCount: parseInt(unreadResult[0].cnt),
    page: parseInt(page),
  });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  await db.query(
    `UPDATE inbox_messages SET is_read = true WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
}));

// ── Assign message to team member ├É─┬───────────────────────────────────────────
router.patch('/:id/assign', asyncHandler(async (req, res) => {
  const { userId } = req.body || {};
  await db.query(
    `UPDATE inbox_messages SET assigned_to = $1 WHERE id = $2 AND org_id = $3`,
    [userId || null, req.params.id, req.user.orgId]
  );
  res.json({ ok: true });
}));

// ── Internal notes ├É─┬──────────────────────────────────────────────────────────
router.get('/:id/notes', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT n.*, u.full_name FROM inbox_internal_notes n
     JOIN users u ON u.id = n.author_id
     WHERE n.message_id = $1 ORDER BY n.created_at ASC`,
    [req.params.id]
  );
  res.json({ notes: rows });
}));

router.post('/:id/notes', asyncHandler(async (req, res) => {
  const { body } = req.body || {};
  if (!body?.trim()) return res.status(400).json({ error: 'Note body is required.' });
  const { rows } = await db.query(
    `INSERT INTO inbox_internal_notes (message_id, author_id, body) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.id, req.user.id, body.trim()]
  );
  res.status(201).json({ note: rows[0] });
}));

// ── Notification preferences ├É─┬───────────────────────────────────────────────
router.get('/preferences', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM notification_preferences WHERE user_id = $1`,
    [req.user.id]
  );
  res.json({ preferences: rows[0] || { notify_email: true, notify_inapp: true, digest_freq: 'realtime' } });
}));

router.put('/preferences', asyncHandler(async (req, res) => {
  const { notifyEmail, notifyInapp, digestFreq } = req.body || {};
  const { rows } = await db.query(
    `INSERT INTO notification_preferences (user_id, notify_email, notify_inapp, digest_freq)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET
       notify_email = COALESCE($2, notification_preferences.notify_email),
       notify_inapp = COALESCE($3, notification_preferences.notify_inapp),
       digest_freq = COALESCE($4, notification_preferences.digest_freq)
     RETURNING *`,
    [req.user.id, notifyEmail !== false, notifyInapp !== false, digestFreq || 'realtime']
  );
  res.json({ preferences: rows[0] });
}));

router.post('/mark-all-read', asyncHandler(async (req, res) => {
  await db.query(
    `UPDATE inbox_messages SET is_read = true WHERE org_id = $1 AND user_id = $2 AND is_read = false`,
    [req.user.orgId, req.user.id]
  );
  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await db.query(
    `DELETE FROM inbox_messages WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
}));

// ── Push an inbox message (used by other modules) ────────────────────────────
// Exported so controllers can call this directly instead of going through HTTP.
async function pushInboxMessage(orgId, userId, source, title, body, link, priority) {
  if (!orgId || !userId || !source || !title) return;
  try {
    const db = require('../db');
    await db.query(
      `INSERT INTO inbox_messages (org_id, user_id, source, title, body, link, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orgId, userId, source, title, body || null, link || null, priority || 'normal']
    );
  } catch { /* silent */ }
}

router.post("/bulk-delete", bulkDeleteHandler("inbox_messages"));
router.get("/export", async (req, res) => { const { rows } = await db.query("SELECT * FROM inbox_messages WHERE org_id = $1", [req.user.orgId]); sendCsv(res, "inbox_messages.csv", rows, autoColumns(rows)); });
router.get("/stats", async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total FROM inbox_messages WHERE org_id = $1", [req.user.orgId]); res.json({ stats: rows[0] }); });

module.exports = { router, pushInboxMessage };
