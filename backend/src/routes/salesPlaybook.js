const express = require('express');
const router = express.Router();
const salesPlaybookController = require('../controllers/salesPlaybookController');
const { requireAuth } = require('../middleware/auth');

// ==================== PLAYBOOKS ====================

// Get all playbooks
router.get('/playbooks', requireAuth, salesPlaybookController.getPlaybooks);

// Get playbook by ID
router.get('/playbooks/:id', requireAuth, salesPlaybookController.getPlaybookById);

// Create playbook
router.post('/playbooks', requireAuth, salesPlaybookController.createPlaybook);

// Update playbook
router.put('/playbooks/:id', requireAuth, salesPlaybookController.updatePlaybook);

// Delete playbook
router.delete('/playbooks/:id', requireAuth, salesPlaybookController.deletePlaybook);

// Publish playbook
router.post('/playbooks/:id/publish', requireAuth, salesPlaybookController.publishPlaybook);

// ==================== BATTLECARDS ====================

// Get all battlecards
router.get('/battlecards', requireAuth, salesPlaybookController.getBattlecards);

// Get battlecard by ID
router.get('/battlecards/:id', requireAuth, salesPlaybookController.getBattlecardById);

// Get battlecards by competitor
router.get('/battlecards/competitor/:name', requireAuth, salesPlaybookController.getBattlecardsByCompetitor);

// Create battlecard
router.post('/battlecards', requireAuth, salesPlaybookController.createBattlecard);

// Update battlecard
router.put('/battlecards/:id', requireAuth, salesPlaybookController.updateBattlecard);

// Delete battlecard
router.delete('/battlecards/:id', requireAuth, salesPlaybookController.deleteBattlecard);

// ==================== CONTENT INTERACTION ====================

// Track view
router.post('/content/:type/:id/view', requireAuth, salesPlaybookController.trackView);

// Rate content
router.post('/content/:type/:id/rate', requireAuth, salesPlaybookController.rateContent);

// Toggle favorite
router.post('/content/:type/:id/favorite', requireAuth, salesPlaybookController.toggleFavorite);

// Get favorites
router.get('/favorites', requireAuth, salesPlaybookController.getFavorites);

// ==================== SEARCH & STATISTICS ====================

// Search content
router.get('/search', requireAuth, salesPlaybookController.searchContent);

// Get statistics
router.get('/statistics', requireAuth, salesPlaybookController.getStatistics);

module.exports = router;
