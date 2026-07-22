const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/gamificationController');

const router = Router();
router.use(requireAuth);

router.get('/points',            c.getPoints);
router.get('/badges',            c.getBadges);
router.get('/streaks',           c.getStreaks);
router.post('/streaks/activity', c.recordActivity);
router.get('/leaderboards',          c.getLeaderboards);
router.get('/leaderboards/:id',      c.getLeaderboard);
router.get('/checklists',            c.getChecklists);
router.post('/checklists/complete',  c.completeChecklistItem);

module.exports = router;
