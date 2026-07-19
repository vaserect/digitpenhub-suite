const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');

// ============================================================================
// COLLECTIONS
// ============================================================================

// List all collections
router.get('/collections', cmsController.listCollections);

// Get a single collection
router.get('/collections/:id', cmsController.getCollection);

// Create a new collection
router.post('/collections', cmsController.createCollection);

// Update a collection
router.put('/collections/:id', cmsController.updateCollection);

// Delete a collection
router.delete('/collections/:id', cmsController.deleteCollection);

// ============================================================================
// ITEMS
// ============================================================================

// List items in a collection
router.get('/collections/:collectionId/items', cmsController.listItems);

// Get a single item
router.get('/collections/:collectionId/items/:id', cmsController.getItem);

// Create a new item
router.post('/collections/:collectionId/items', cmsController.createItem);

// Update an item
router.put('/collections/:collectionId/items/:id', cmsController.updateItem);

// Delete an item
router.delete('/collections/:collectionId/items/:id', cmsController.deleteItem);

// ============================================================================
// BULK OPERATIONS
// ============================================================================

// Bulk publish items
router.post('/collections/:collectionId/items/bulk/publish', cmsController.bulkPublishItems);

// Bulk unpublish items
router.post('/collections/:collectionId/items/bulk/unpublish', cmsController.bulkUnpublishItems);

// Bulk delete items
router.post('/collections/:collectionId/items/bulk/delete', cmsController.bulkDeleteItems);

// ============================================================================
// PUBLIC ENDPOINTS (no auth required)
// ============================================================================

// Get item by slug (public)
router.get('/public/:orgId/:collectionSlug/:itemSlug', cmsController.getPublicItem);

// List published items (public)
router.get('/public/:orgId/:collectionSlug', cmsController.listPublicItems);

module.exports = router;
