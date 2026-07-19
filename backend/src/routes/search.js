/**
 * Search Routes
 * 
 * Defines all routes for global search functionality.
 * 
 * @module routes/search.routes
 */

const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { requireAuth } = require('../middleware/auth');

// All search routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/v1/search
 * @desc    Perform global search
 * @access  Private
 * @query   q - Search query (required)
 * @query   type - Entity type filter (optional, can be array)
 * @query   limit - Results per page (optional, default 20)
 * @query   offset - Pagination offset (optional, default 0)
 */
router.get('/', searchController.search);

/**
 * @route   GET /api/v1/search/suggestions
 * @desc    Get search suggestions for autocomplete
 * @access  Private
 * @query   q - Partial search query (required, min 2 chars)
 * @query   limit - Number of suggestions (optional, default 5)
 */
router.get('/suggestions', searchController.getSuggestions);

/**
 * @route   GET /api/v1/search/history
 * @desc    Get user's recent searches
 * @access  Private
 * @query   limit - Number of recent searches (optional, default 10)
 */
router.get('/history', searchController.getHistory);

/**
 * @route   POST /api/v1/search/index
 * @desc    Index a single entity (for use by other modules)
 * @access  Private
 * @body    entityType, entityId, title, content, metadata
 */
router.post('/index', searchController.indexEntity);

/**
 * @route   POST /api/v1/search/index/rebuild
 * @desc    Rebuild entire search index (admin only)
 * @access  Private (Admin)
 */
router.post('/index/rebuild', searchController.rebuildIndex);

/**
 * @route   GET /api/v1/search/saved
 * @desc    Get user's saved searches
 * @access  Private
 */
router.get('/saved', searchController.getSavedSearches);

/**
 * @route   POST /api/v1/search/saved
 * @desc    Save a search
 * @access  Private
 * @body    name, query, filters, isShared
 */
router.post('/saved', searchController.saveSearch);

/**
 * @route   DELETE /api/v1/search/saved/:id
 * @desc    Delete a saved search
 * @access  Private
 * @param   id - Saved search ID
 */
router.delete('/saved/:id', searchController.deleteSavedSearch);

module.exports = router;
