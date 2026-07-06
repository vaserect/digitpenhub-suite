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
router.get('/:id/analytics', getPageAnalytics);
router.get('/:id', getPage);
router.post('/', createPage);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);

module.exports = router;
