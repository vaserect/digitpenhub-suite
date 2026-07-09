const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
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

router.post("/bulk-delete", bulkDeleteHandler("quizzes"));
router.get("/export", async (req, res) => { const { rows } = await db.query("SELECT * FROM quizzes WHERE org_id = $1", [req.user.orgId]); sendCsv(res, "quizzes.csv", rows, autoColumns(rows)); });

module.exports = router;
