const db = require('../db');

async function list(req, res) {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const { rows } = await db.query(
    `SELECT id, type, title, body, link, is_read, created_at
     FROM notifications
     WHERE org_id = $1 AND (user_id = $2 OR user_id IS NULL)
     ORDER BY created_at DESC LIMIT $3`,
    [req.user.orgId, req.user.id, limit]
  );
  res.json({ notifications: rows });
}

async function unreadCount(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*) FROM notifications
     WHERE org_id = $1 AND (user_id = $2 OR user_id IS NULL) AND is_read = false`,
    [req.user.orgId, req.user.id]
  );
  res.json({ count: Number(rows[0].count) });
}

async function markRead(req, res) {
  await db.query(
    `UPDATE notifications SET is_read = true
     WHERE id = $1 AND org_id = $2 AND (user_id = $3 OR user_id IS NULL)`,
    [req.params.id, req.user.orgId, req.user.id]
  );
  res.json({ ok: true });
}

async function markAllRead(req, res) {
  await db.query(
    `UPDATE notifications SET is_read = true
     WHERE org_id = $1 AND (user_id = $2 OR user_id IS NULL) AND is_read = false`,
    [req.user.orgId, req.user.id]
  );
  res.json({ ok: true });
}

module.exports = { list, unreadCount, markRead, markAllRead };
