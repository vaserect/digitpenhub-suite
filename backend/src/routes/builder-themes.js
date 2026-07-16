const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { uploadLimiter } = require('../middleware/rateLimiters');
const {
  listThemes,
  getTheme,
  createTheme,
  updateTheme,
  deleteTheme,
  applyThemeToPage,
  applyThemeToSite
} = require('../controllers/builderThemesController');

const router = Router();

// Protected routes
router.use(requireAuth);
router.use(requireModuleAccess('website-builder'));

// Theme CRUD
router.get('/', listThemes);
router.get('/:id', getTheme);
router.post('/', uploadLimiter, createTheme);
router.put('/:id', updateTheme);
router.delete('/:id', deleteTheme);

// Theme application
router.post('/:id/apply-to-page/:pageId', uploadLimiter, applyThemeToPage);
router.post('/:id/apply-to-site/:siteId', uploadLimiter, applyThemeToSite);

module.exports = router;
