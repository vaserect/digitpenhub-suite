const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { list, unreadCount, markRead, markAllRead } = require('../controllers/notificationsController');

const router = Router();
router.use(requireAuth);

router.get('/', list);
router.get('/unread-count', unreadCount);
router.patch('/:id/read', markRead);
router.post('/mark-all-read', markAllRead);

router.post("/bulk-delete", bulkDeleteHandler("notifications"));
router.get("/export", async (req, res) => { const { rows } = await db.query("SELECT * FROM notifications WHERE org_id = $1", [req.user.orgId]); sendCsv(res, "notifications.csv", rows, autoColumns(rows)); });
router.get("/stats", async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total FROM notifications WHERE org_id = module.exports =", [req.user.orgId]); res.json({ stats: rows[0] }); });

module.exports = router;
