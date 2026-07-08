const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { publicSubmitLimiter } = require('../middleware/rateLimiters');
const c = require('../controllers/quizBuilderController');

// ── Public routes — no auth. These power the live public quiz-taking page at
// frontend/app/quiz/[id]/page.jsx and must stay reachable by anonymous
// respondents. Mounted before the requireAuth gate below, mirroring the
// pattern in backend/src/routes/storeBuilder.js. ────────────────────────────
router.get('/public/:id', c.getPublicQuiz);
router.post('/:quizId/respond', publicSubmitLimiter, c.submitResponse);

// ── Protected routes ─────────────────────────────────────────────────────────
router.use(requireAuth);
router.use(requireModuleAccess('quiz-builder'));

router.get('/stats', c.getStats);
router.get('/', c.listQuizzes);
router.get('/:id', c.getQuiz);
router.post('/', c.createQuiz);
router.put('/:id', c.updateQuiz);
router.delete('/:id', c.deleteQuiz);
router.get('/:quizId/responses', c.listResponses);

module.exports = router;
