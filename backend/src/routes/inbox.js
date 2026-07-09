const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { unreadOnly, source, page = 1, limit = 50 } = req.query;
  const conditions = ['org_id = $1', 'user_id = $2'];
  const params = [req.user.orgId, req.user.id];
  let idx = 3;

  if (unreadOnly === 'true') { conditions.push(`is_read = false`); }
  if (source) { conditions.push(`source = $${idx++}`); params.push(source); }

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

module.exports = { router, pushInboxMessage };
