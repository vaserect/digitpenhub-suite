const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { uploadLimiter } = require('../middleware/rateLimiters');
const {
  listTemplates,
  getTemplate,
  getTemplatePages,
  useTemplate,
  listCategories,
  listIndustries,
  getFeaturedTemplates,
  getPopularTemplates,
  rateTemplate
} = require('../controllers/builderTemplatesController');

const router = Router();

// Public routes (for browsing templates)
router.get('/', listTemplates);
router.get('/categories', listCategories);
router.get('/industries', listIndustries);
router.get('/featured', getFeaturedTemplates);
router.get('/popular', getPopularTemplates);
router.get('/:id', getTemplate);
router.get('/:id/pages', getTemplatePages);

// Protected routes
router.use(requireAuth);
router.use(requireModuleAccess('website-builder'));

// Use template (create site from template)
router.post('/:id/use', uploadLimiter, useTemplate);

// Rate template
router.post('/:id/rate', uploadLimiter, rateTemplate);

module.exports = router;
