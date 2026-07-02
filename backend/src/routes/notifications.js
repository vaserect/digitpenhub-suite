const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { list, unreadCount, markRead, markAllRead } = require('../controllers/notificationsController');

const router = Router();
router.use(requireAuth);

router.get('/', list);
router.get('/unread-count', unreadCount);
router.patch('/:id/read', markRead);
router.post('/mark-all-read', markAllRead);

module.exports = router;
