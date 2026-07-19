const cmsService = require('../services/cms/CMSService');

/**
 * CMS Controller - Handles HTTP requests for CMS collections and items
 */

// ============================================================================
// COLLECTIONS
// ============================================================================

/**
 * List all collections
 * GET /api/v1/cms/collections
 */
async function listCollections(req, res) {
  try {
    const result = await cmsService.listCollections(req.user.orgId, req.query);
    res.json(result);
  } catch (err) {
    console.error('Error listing collections:', err);
    res.status(500).json({ error: err.message || 'Failed to list collections' });
  }
}

/**
 * Get a single collection
 * GET /api/v1/cms/collections/:id
 */
async function getCollection(req, res) {
  try {
    const collection = await cmsService.getCollection(req.params.id, req.user.orgId);
    res.json({ collection });
  } catch (err) {
    console.error('Error getting collection:', err);
    const status = err.message === 'Collection not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Failed to get collection' });
  }
}

/**
 * Create a new collection
 * POST /api/v1/cms/collections
 */
async function createCollection(req, res) {
  try {
    const collection = await cmsService.createCollection(req.user.orgId, req.body);
    res.status(201).json({ collection });
  } catch (err) {
    console.error('Error creating collection:', err);
    const status = err.message.includes('already exists') ? 409 : 400;
    res.status(status).json({ error: err.message || 'Failed to create collection' });
  }
}

/**
 * Update a collection
 * PUT /api/v1/cms/collections/:id
 */
async function updateCollection(req, res) {
  try {
    const collection = await cmsService.updateCollection(
      req.params.id,
      req.user.orgId,
      req.body
    );
    res.json({ collection });
  } catch (err) {
    console.error('Error updating collection:', err);
    const status = err.message === 'Collection not found' ? 404 : 
                   err.message.includes('already exists') ? 409 : 400;
    res.status(status).json({ error: err.message || 'Failed to update collection' });
  }
}

/**
 * Delete a collection
 * DELETE /api/v1/cms/collections/:id
 */
async function deleteCollection(req, res) {
  try {
    await cmsService.deleteCollection(req.params.id, req.user.orgId);
    res.json({ success: true, message: 'Collection deleted successfully' });
  } catch (err) {
    console.error('Error deleting collection:', err);
    const status = err.message === 'Collection not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Failed to delete collection' });
  }
}

// ============================================================================
// ITEMS
// ============================================================================

/**
 * List items in a collection
 * GET /api/v1/cms/collections/:collectionId/items
 */
async function listItems(req, res) {
  try {
    const result = await cmsService.listItems(
      req.params.collectionId,
      req.user.orgId,
      req.query
    );
    res.json(result);
  } catch (err) {
    console.error('Error listing items:', err);
    const status = err.message === 'Collection not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Failed to list items' });
  }
}

/**
 * Get a single item
 * GET /api/v1/cms/collections/:collectionId/items/:id
 */
async function getItem(req, res) {
  try {
    const item = await cmsService.getItem(
      req.params.id,
      req.params.collectionId,
      req.user.orgId
    );
    res.json({ item });
  } catch (err) {
    console.error('Error getting item:', err);
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: err.message || 'Failed to get item' });
  }
}

/**
 * Create a new item
 * POST /api/v1/cms/collections/:collectionId/items
 */
async function createItem(req, res) {
  try {
    const item = await cmsService.createItem(
      req.params.collectionId,
      req.user.orgId,
      req.user.id,
      req.body
    );
    res.status(201).json({ item });
  } catch (err) {
    console.error('Error creating item:', err);
    const status = err.message.includes('already exists') ? 409 : 400;
    res.status(status).json({ error: err.message || 'Failed to create item' });
  }
}

/**
 * Update an item
 * PUT /api/v1/cms/collections/:collectionId/items/:id
 */
async function updateItem(req, res) {
  try {
    const item = await cmsService.updateItem(
      req.params.id,
      req.params.collectionId,
      req.user.orgId,
      req.user.id,
      req.body
    );
    res.json({ item });
  } catch (err) {
    console.error('Error updating item:', err);
    const status = err.message.includes('not found') ? 404 : 
                   err.message.includes('already exists') ? 409 : 400;
    res.status(status).json({ error: err.message || 'Failed to update item' });
  }
}

/**
 * Delete an item
 * DELETE /api/v1/cms/collections/:collectionId/items/:id
 */
async function deleteItem(req, res) {
  try {
    await cmsService.deleteItem(
      req.params.id,
      req.params.collectionId,
      req.user.orgId
    );
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: err.message || 'Failed to delete item' });
  }
}

/**
 * Bulk publish items
 * POST /api/v1/cms/collections/:collectionId/items/bulk/publish
 */
async function bulkPublishItems(req, res) {
  try {
    const { itemIds } = req.body;
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds array is required' });
    }

    const result = await cmsService.bulkPublishItems(
      itemIds,
      req.params.collectionId,
      req.user.orgId
    );
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error bulk publishing items:', err);
    const status = err.message === 'Collection not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Failed to publish items' });
  }
}

/**
 * Bulk unpublish items
 * POST /api/v1/cms/collections/:collectionId/items/bulk/unpublish
 */
async function bulkUnpublishItems(req, res) {
  try {
    const { itemIds } = req.body;
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds array is required' });
    }

    const result = await cmsService.bulkUnpublishItems(
      itemIds,
      req.params.collectionId,
      req.user.orgId
    );
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error bulk unpublishing items:', err);
    const status = err.message === 'Collection not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Failed to unpublish items' });
  }
}

/**
 * Bulk delete items
 * POST /api/v1/cms/collections/:collectionId/items/bulk/delete
 */
async function bulkDeleteItems(req, res) {
  try {
    const { itemIds } = req.body;
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds array is required' });
    }

    const result = await cmsService.bulkDeleteItems(
      itemIds,
      req.params.collectionId,
      req.user.orgId
    );
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error bulk deleting items:', err);
    const status = err.message === 'Collection not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Failed to delete items' });
  }
}

// ============================================================================
// PUBLIC ENDPOINTS (for rendering CMS content on published pages)
// ============================================================================

/**
 * Get item by slug (public)
 * GET /api/v1/cms/public/:orgId/:collectionSlug/:itemSlug
 */
async function getPublicItem(req, res) {
  try {
    const { orgId, collectionSlug, itemSlug } = req.params;
    const item = await cmsService.getItemBySlug(collectionSlug, itemSlug, orgId);
    res.json({ item });
  } catch (err) {
    console.error('Error getting public item:', err);
    const status = err.message === 'Item not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Failed to get item' });
  }
}

/**
 * List published items (public)
 * GET /api/v1/cms/public/:orgId/:collectionSlug
 */
async function listPublicItems(req, res) {
  try {
    const { orgId, collectionSlug } = req.params;
    
    // Get collection by slug
    const { rows: collectionRows } = await require('../db').query(
      `SELECT id FROM cms_collections WHERE org_id = $1 AND slug = $2 AND is_public = true`,
      [orgId, collectionSlug]
    );

    if (!collectionRows.length) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const result = await cmsService.listItems(
      collectionRows[0].id,
      orgId,
      { ...req.query, status: 'published' }
    );
    res.json(result);
  } catch (err) {
    console.error('Error listing public items:', err);
    res.status(500).json({ error: err.message || 'Failed to list items' });
  }
}

module.exports = {
  // Collections
  listCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  
  // Items
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  
  // Bulk operations
  bulkPublishItems,
  bulkUnpublishItems,
  bulkDeleteItems,
  
  // Public endpoints
  getPublicItem,
  listPublicItems
};
