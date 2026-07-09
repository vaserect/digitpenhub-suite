const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { listPages, getPage, createPage, updatePage, deletePage, getPublicPage, listPublicSitemap, previewPage, getPageAnalytics } = require('../controllers/pagesController');

const router = Router();

// Public routes — no auth. Already-published sites stay visible to visitors
// forever regardless of the owning org's current plan; only the builder
// itself (below) is gated.
router.get('/public-sitemap', listPublicSitemap);
router.get('/public/:slug', getPublicPage);

// Protected routes
router.use(requireAuth);
router.use(requireModuleAccess('website-builder'));
router.get('/preview/:id', previewPage);
router.get('/', listPages);
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
router.post('/bulk-delete', bulkDeleteHandler('pages'));
router.get('/export', async (req, res) => { const { rows } = await db.query('SELECT id, title, slug, status, created_at FROM pages WHERE org_id = $1 ORDER BY created_at DESC', [req.user.orgId]); sendCsv(res, 'pages.csv', rows, autoColumns(rows)); });
router.get('/stats', async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total, count(*) FILTER (WHERE status='live')::int AS live, count(*) FILTER (WHERE status='draft')::int AS draft FROM pages WHERE org_id = $1", [req.user.orgId]); res.json({ stats: rows[0] }); });
router.get('/:id/analytics', getPageAnalytics);
router.get('/:id', getPage);
router.post('/', createPage);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);

module.exports = router;
