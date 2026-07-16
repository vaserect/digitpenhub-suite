const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { uploadLimiter } = require('../middleware/rateLimiters');
const {
  listComponents,
  getComponent,
  createComponent,
  updateComponent,
  deleteComponent,
  listComponentCategories
} = require('../controllers/builderComponentsController');

const router = Router();

// Protected routes
router.use(requireAuth);
router.use(requireModuleAccess('website-builder'));

// Component CRUD
router.get('/', listComponents);
router.get('/categories', listComponentCategories);
router.get('/:id', getComponent);
router.post('/', uploadLimiter, createComponent);
router.put('/:id', updateComponent);
router.delete('/:id', deleteComponent);

module.exports = router;
