const express = require('express');
const router = express.Router();
const interactionsController = require('../controllers/interactionsController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Interaction CRUD
router.get('/', interactionsController.getInteractions);
router.get('/:id', interactionsController.getInteractionById);
router.post('/', interactionsController.createInteraction);
router.put('/:id', interactionsController.updateInteraction);
router.delete('/:id', interactionsController.deleteInteraction);

// Interaction operations
router.post('/:id/duplicate', interactionsController.duplicateInteraction);
router.get('/:id/stats', interactionsController.getInteractionStats);

// Apply interactions to elements
router.post('/apply', interactionsController.applyInteractionToElement);
router.get('/elements/:pageId', interactionsController.getElementInteractions);
router.delete('/elements/:id', interactionsController.removeInteractionFromElement);

// Animation presets
router.get('/presets', interactionsController.getAnimationPresets);
router.get('/presets/:id', interactionsController.getPresetById);

// Scroll animations
router.post('/scroll', interactionsController.createScrollAnimation);
router.get('/scroll/:pageId', interactionsController.getScrollAnimations);
router.put('/scroll/:id', interactionsController.updateScrollAnimation);
router.delete('/scroll/:id', interactionsController.deleteScrollAnimation);

module.exports = router;
