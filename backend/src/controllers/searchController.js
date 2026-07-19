/**
 * Search Controller
 * 
 * Handles HTTP requests for global search functionality.
 * Follows the established controller pattern.
 * 
 * @module controllers/searchController
 */

const SearchService = require('../services/search/SearchService');
const logger = require('../utils/logger');

const searchService = new SearchService();

/**
 * @route GET /api/v1/search
 * @desc Perform global search across all entities
 * @access Private
 */
exports.search = async (req, res) => {
  try {
    const { q: query, type, limit, offset, ...filters } = req.query;
    const { orgId, userId } = req.user;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const entityTypes = type ? (Array.isArray(type) ? type : [type]) : null;

    const results = await searchService.search({
      query,
      entityTypes,
      orgId,
      userId,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
      filters
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Search request failed', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      query: req.query.q
    });
    
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
};

/**
 * @route GET /api/v1/search/suggestions
 * @desc Get search suggestions for autocomplete
 * @access Private
 */
exports.getSuggestions = async (req, res) => {
  try {
    const { q: query, limit } = req.query;
    const { orgId } = req.user;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = await searchService.getSuggestions({
      query,
      orgId,
      limit: parseInt(limit) || 5
    });

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    logger.error('Get suggestions failed', {
      error: error.message,
      userId: req.user?.userId
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message
    });
  }
};

/**
 * @route GET /api/v1/search/history
 * @desc Get user's recent searches
 * @access Private
 */
exports.getHistory = async (req, res) => {
  try {
    const { limit } = req.query;
    const { userId, orgId } = req.user;

    const history = await searchService.getRecentSearches(
      userId,
      orgId,
      parseInt(limit) || 10
    );

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Get search history failed', {
      error: error.message,
      userId: req.user?.userId
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get search history',
      error: error.message
    });
  }
};

/**
 * @route POST /api/v1/search/index
 * @desc Index a single entity (called by other modules)
 * @access Private
 */
exports.indexEntity = async (req, res) => {
  try {
    const { entityType, entityId, title, content, metadata } = req.body;
    const { orgId, userId } = req.user;

    if (!entityType || !entityId || !title) {
      return res.status(400).json({
        success: false,
        message: 'entityType, entityId, and title are required'
      });
    }

    const result = await searchService.indexEntity({
      entityType,
      entityId,
      title,
      content,
      metadata,
      orgId,
      createdBy: userId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Index entity failed', {
      error: error.message,
      userId: req.user?.userId,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to index entity',
      error: error.message
    });
  }
};

/**
 * @route POST /api/v1/search/index/rebuild
 * @desc Rebuild search index for organization (admin only)
 * @access Private (Admin)
 */
exports.rebuildIndex = async (req, res) => {
  try {
    const { orgId } = req.user;

    // TODO: Add admin permission check
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Admin access required'
    //   });
    // }

    const result = await searchService.rebuildIndex(orgId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Rebuild index failed', {
      error: error.message,
      userId: req.user?.userId
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to rebuild index',
      error: error.message
    });
  }
};

/**
 * @route GET /api/v1/search/saved
 * @desc Get user's saved searches
 * @access Private
 */
exports.getSavedSearches = async (req, res) => {
  try {
    const { userId, orgId } = req.user;

    const savedSearches = await searchService.getSavedSearches(userId, orgId);

    res.json({
      success: true,
      data: savedSearches
    });
  } catch (error) {
    logger.error('Get saved searches failed', {
      error: error.message,
      userId: req.user?.userId
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get saved searches',
      error: error.message
    });
  }
};

/**
 * @route POST /api/v1/search/saved
 * @desc Save a search
 * @access Private
 */
exports.saveSearch = async (req, res) => {
  try {
    const { name, query, filters, isShared } = req.body;
    const { userId, orgId } = req.user;

    if (!name || !query) {
      return res.status(400).json({
        success: false,
        message: 'name and query are required'
      });
    }

    const result = await searchService.saveSearch({
      userId,
      orgId,
      name,
      query,
      filters,
      isShared: isShared || false
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Save search failed', {
      error: error.message,
      userId: req.user?.userId
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to save search',
      error: error.message
    });
  }
};

/**
 * @route DELETE /api/v1/search/saved/:id
 * @desc Delete a saved search
 * @access Private
 */
exports.deleteSavedSearch = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, orgId } = req.user;

    const success = await searchService.deleteSavedSearch(
      parseInt(id),
      userId,
      orgId
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Saved search not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Saved search deleted'
    });
  } catch (error) {
    logger.error('Delete saved search failed', {
      error: error.message,
      userId: req.user?.userId,
      searchId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete saved search',
      error: error.message
    });
  }
};
