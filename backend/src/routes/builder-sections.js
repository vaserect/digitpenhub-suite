const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { uploadLimiter } = require('../middleware/rateLimiters');
const {
  listSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  useSectionInPage
} = require('../controllers/builderSectionsController');

const router = Router();

// Protected routes
router.use(requireAuth);
router.use(requireModuleAccess('website-builder'));

// Section CRUD
router.get('/', listSections);
router.get('/:id', getSection);
router.post('/', uploadLimiter, createSection);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

// Use section in page
router.post('/:id/use', uploadLimiter, useSectionInPage);

module.exports = router;
