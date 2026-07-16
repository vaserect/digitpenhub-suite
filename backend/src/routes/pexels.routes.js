/**
 * Pexels API Routes
 * Endpoints for stock photo search and browsing
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const pexelsService = require('../services/pexels.service');

/**
 * @route   GET /api/v1/pexels/status
 * @desc    Check if Pexels API is configured
 * @access  Public
 */
router.get('/status', (req, res) => {
  try {
    const configured = pexelsService.isConfigured();
    res.json({
      success: true,
      configured,
      message: configured 
        ? 'Pexels API is configured and ready' 
        : 'Pexels API key not configured'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/v1/pexels/search
 * @desc    Search for photos
 * @access  Private
 * @query   query (required) - Search term
 * @query   page - Page number (default: 1)
 * @query   perPage - Results per page (default: 20, max: 80)
 * @query   orientation - Photo orientation (landscape, portrait, square)
 * @query   size - Minimum size (large, medium, small)
 * @query   color - Desired color
 */
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { query, page, perPage, orientation, size, color } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const result = await pexelsService.searchPhotos(query, {
      page: parseInt(page) || 1,
      perPage: parseInt(perPage) || 20,
      orientation,
      size,
      color
    });

    res.json(result);
  } catch (error) {
    console.error('Pexels search error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/v1/pexels/curated
 * @desc    Get curated photos (editor's picks)
 * @access  Private
 * @query   page - Page number (default: 1)
 * @query   perPage - Results per page (default: 20)
 */
router.get('/curated', requireAuth, async (req, res) => {
  try {
    const { page, perPage } = req.query;

    const result = await pexelsService.getCuratedPhotos(
      parseInt(page) || 1,
      parseInt(perPage) || 20
    );

    res.json(result);
  } catch (error) {
    console.error('Pexels curated error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/v1/pexels/popular
 * @desc    Get popular photos
 * @access  Private
 * @query   page - Page number (default: 1)
 * @query   perPage - Results per page (default: 20)
 */
router.get('/popular', requireAuth, async (req, res) => {
  try {
    const { page, perPage } = req.query;

    const result = await pexelsService.getPopularPhotos(
      parseInt(page) || 1,
      parseInt(perPage) || 20
    );

    res.json(result);
  } catch (error) {
    console.error('Pexels popular error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/v1/pexels/categories
 * @desc    Get predefined photo categories
 * @access  Private
 */
router.get('/categories', requireAuth, (req, res) => {
  try {
    const categories = pexelsService.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Pexels categories error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/v1/pexels/category/:category
 * @desc    Get photos by category
 * @access  Private
 * @param   category - Category name
 * @query   page - Page number (default: 1)
 * @query   perPage - Results per page (default: 20)
 */
router.get('/category/:category', requireAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const { page, perPage } = req.query;

    const result = await pexelsService.getPhotosByCategory(
      category,
      parseInt(page) || 1,
      parseInt(perPage) || 20
    );

    res.json(result);
  } catch (error) {
    console.error('Pexels category error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/v1/pexels/photo/:id
 * @desc    Get a specific photo by ID
 * @access  Private
 * @param   id - Photo ID
 */
router.get('/photo/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid photo ID is required'
      });
    }

    const result = await pexelsService.getPhoto(parseInt(id));
    res.json(result);
  } catch (error) {
    console.error('Pexels get photo error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/v1/pexels/collections
 * @desc    Get featured collections
 * @access  Private
 * @query   page - Page number (default: 1)
 * @query   perPage - Results per page (default: 20)
 */
router.get('/collections', requireAuth, async (req, res) => {
  try {
    const { page, perPage } = req.query;

    const result = await pexelsService.getCollections(
      parseInt(page) || 1,
      parseInt(perPage) || 20
    );

    res.json(result);
  } catch (error) {
    console.error('Pexels collections error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/v1/pexels/stats
 * @desc    Get Pexels API usage statistics
 * @access  Private (Admin only)
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const stats = await pexelsService.getUsageStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Pexels stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
