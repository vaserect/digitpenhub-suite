const express = require('express');
const router = express.Router();
const componentsController = require('../controllers/componentsController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Component CRUD
router.get('/', componentsController.getComponents);
router.get('/:id', componentsController.getComponentById);
router.post('/', componentsController.createComponent);
router.put('/:id', componentsController.updateComponent);
router.delete('/:id', componentsController.deleteComponent);
router.post('/:id/duplicate', componentsController.duplicateComponent);

// Variants
router.get('/:id/variants', componentsController.getVariants);
router.post('/:id/variants', componentsController.createVariant);
router.put('/variants/:id', componentsController.updateVariant);
router.delete('/variants/:id', componentsController.deleteVariant);

// Instances
router.post('/instances', componentsController.createInstance);
router.get('/instances/:pageId', componentsController.getInstances);
router.put('/instances/:id', componentsController.updateInstance);
router.delete('/instances/:id', componentsController.deleteInstance);

// Libraries
router.get('/libraries', componentsController.getLibraries);
router.post('/libraries', componentsController.createLibrary);
router.get('/libraries/:id/components', componentsController.getLibraryComponents);
router.post('/libraries/:id/components', componentsController.addToLibrary);
router.delete('/libraries/:id/components/:componentId', componentsController.removeFromLibrary);

module.exports = router;
