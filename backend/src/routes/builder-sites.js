const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { uploadLimiter } = require('../middleware/rateLimiters');
const {
  listSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
  publishSite,
  unpublishSite,
  duplicateSite,
  exportSite,
  getSitePages,
  getSiteAnalytics,
  updateSiteSettings,
  updateCustomDomain,
  verifyCustomDomain
} = require('../controllers/builderSitesController');

const router = Router();

// Protected routes
router.use(requireAuth);
router.use(requireModuleAccess('website-builder'));

// Site CRUD
router.get('/', listSites);
router.get('/:id', getSite);
router.post('/', uploadLimiter, createSite);
router.put('/:id', updateSite);
router.delete('/:id', deleteSite);

// Site operations
router.post('/:id/publish', uploadLimiter, publishSite);
router.post('/:id/unpublish', unpublishSite);
router.post('/:id/duplicate', uploadLimiter, duplicateSite);
router.get('/:id/export', exportSite);
router.get('/:id/pages', getSitePages);
router.get('/:id/analytics', getSiteAnalytics);

// Site settings
router.put('/:id/settings', updateSiteSettings);
router.put('/:id/custom-domain', uploadLimiter, updateCustomDomain);
router.post('/:id/verify-domain', uploadLimiter, verifyCustomDomain);

module.exports = router;
