const db = require('../../db');

/**
 * CMS Service - Manages dynamic content collections (Webflow CMS / Framer CMS equivalent)
 */
class CMSService {
  /**
   * List all collections for an organization
   */
  async listCollections(orgId, filters = {}) {
    const { siteId, q, limit = 50, offset = 0 } = filters;
    
    const conditions = ['org_id = $1'];
    const values = [orgId];
    let idx = 2;

    if (siteId) {
      conditions.push(`site_id = $${idx++}`);
      values.push(siteId);
    }

    if (q && q.trim()) {
      conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
      values.push(`%${q.trim()}%`);
      idx++;
    }

    const where = conditions.join(' AND ');
    values.push(parseInt(limit) || 50, parseInt(offset) || 0);

    const { rows } = await db.query(
      `SELECT c.*,
              (SELECT COUNT(*)::int FROM cms_items WHERE collection_id = c.id) as item_count
       FROM cms_collections c
       WHERE ${where}
       ORDER BY c.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM cms_collections WHERE ${where}`,
      values.slice(0, -2)
    );

    return {
      collections: rows,
      total: countResult.rows[0].total,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    };
  }

  /**
   * Get a single collection by ID
   */
  async getCollection(collectionId, orgId) {
    const { rows } = await db.query(
      `SELECT c.*,
              (SELECT COUNT(*)::int FROM cms_items WHERE collection_id = c.id) as item_count,
              (SELECT COUNT(*)::int FROM cms_items WHERE collection_id = c.id AND status = 'published') as published_count
       FROM cms_collections c
       WHERE c.id = $1 AND c.org_id = $2`,
      [collectionId, orgId]
    );

    if (!rows.length) {
      throw new Error('Collection not found');
    }

    return rows[0];
  }

  /**
   * Create a new collection
   */
  async createCollection(orgId, data) {
    const { name, slug, description, icon, fields, displayField, sortField, sortOrder, siteId, isPublic } = data;

    if (!name || !slug) {
      throw new Error('Name and slug are required');
    }

    if (!fields || !Array.isArray(fields)) {
      throw new Error('Fields must be an array');
    }

    // Check for duplicate slug
    const existing = await db.query(
      `SELECT id FROM cms_collections WHERE org_id = $1 AND slug = $2`,
      [orgId, slug]
    );

    if (existing.rows.length) {
      throw new Error('A collection with this slug already exists');
    }

    const { rows } = await db.query(
      `INSERT INTO cms_collections (
        org_id, site_id, name, slug, description, icon, fields,
        display_field, sort_field, sort_order, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        orgId,
        siteId || null,
        name,
        slug,
        description || null,
        icon || '📦',
        JSON.stringify(fields),
        displayField || null,
        sortField || null,
        sortOrder || 'desc',
        isPublic !== undefined ? isPublic : false
      ]
    );

    return rows[0];
  }

  /**
   * Update a collection
   */
  async updateCollection(collectionId, orgId, data) {
    const { name, slug, description, icon, fields, displayField, sortField, sortOrder, isPublic } = data;

    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (slug !== undefined) {
      // Check for duplicate slug
      const existing = await db.query(
        `SELECT id FROM cms_collections WHERE org_id = $1 AND slug = $2 AND id != $3`,
        [orgId, slug, collectionId]
      );
      if (existing.rows.length) {
        throw new Error('A collection with this slug already exists');
      }
      updates.push(`slug = $${idx++}`);
      values.push(slug);
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description || null);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${idx++}`);
      values.push(icon);
    }
    if (fields !== undefined) {
      if (!Array.isArray(fields)) {
        throw new Error('Fields must be an array');
      }
      updates.push(`fields = $${idx++}`);
      values.push(JSON.stringify(fields));
    }
    if (displayField !== undefined) {
      updates.push(`display_field = $${idx++}`);
      values.push(displayField || null);
    }
    if (sortField !== undefined) {
      updates.push(`sort_field = $${idx++}`);
      values.push(sortField || null);
    }
    if (sortOrder !== undefined) {
      updates.push(`sort_order = $${idx++}`);
      values.push(sortOrder);
    }
    if (isPublic !== undefined) {
      updates.push(`is_public = $${idx++}`);
      values.push(isPublic);
    }

    if (!updates.length) {
      throw new Error('Nothing to update');
    }

    updates.push(`updated_at = now()`);
    values.push(collectionId, orgId);

    const { rows } = await db.query(
      `UPDATE cms_collections SET ${updates.join(', ')}
       WHERE id = $${idx} AND org_id = $${idx + 1}
       RETURNING *`,
      values
    );

    if (!rows.length) {
      throw new Error('Collection not found');
    }

    return rows[0];
  }

  /**
   * Delete a collection and all its items
   */
  async deleteCollection(collectionId, orgId) {
    const { rowCount } = await db.query(
      `DELETE FROM cms_collections WHERE id = $1 AND org_id = $2`,
      [collectionId, orgId]
    );

    if (!rowCount) {
      throw new Error('Collection not found');
    }

    return { success: true };
  }

  /**
   * List items in a collection
   */
  async listItems(collectionId, orgId, filters = {}) {
    const { status, q, limit = 50, offset = 0 } = filters;

    // Verify collection exists and belongs to org
    await this.getCollection(collectionId, orgId);

    const conditions = ['collection_id = $1'];
    const values = [collectionId];
    let idx = 2;

    if (status) {
      conditions.push(`status = $${idx++}`);
      values.push(status);
    }

    if (q && q.trim()) {
      conditions.push(`data::text ILIKE $${idx}`);
      values.push(`%${q.trim()}%`);
      idx++;
    }

    const where = conditions.join(' AND ');
    values.push(parseInt(limit) || 50, parseInt(offset) || 0);

    const { rows } = await db.query(
      `SELECT i.*,
              u1.name as created_by_name,
              u2.name as updated_by_name
       FROM cms_items i
       LEFT JOIN users u1 ON i.created_by = u1.id
       LEFT JOIN users u2 ON i.updated_by = u2.id
       WHERE ${where}
       ORDER BY i.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM cms_items WHERE ${where}`,
      values.slice(0, -2)
    );

    return {
      items: rows,
      total: countResult.rows[0].total,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    };
  }

  /**
   * Get a single item
   */
  async getItem(itemId, collectionId, orgId) {
    // Verify collection exists and belongs to org
    await this.getCollection(collectionId, orgId);

    const { rows } = await db.query(
      `SELECT i.*,
              u1.name as created_by_name,
              u2.name as updated_by_name
       FROM cms_items i
       LEFT JOIN users u1 ON i.created_by = u1.id
       LEFT JOIN users u2 ON i.updated_by = u2.id
       WHERE i.id = $1 AND i.collection_id = $2`,
      [itemId, collectionId]
    );

    if (!rows.length) {
      throw new Error('Item not found');
    }

    return rows[0];
  }

  /**
   * Get item by slug (for public access)
   */
  async getItemBySlug(collectionSlug, itemSlug, orgId) {
    const { rows } = await db.query(
      `SELECT i.*
       FROM cms_items i
       JOIN cms_collections c ON i.collection_id = c.id
       WHERE c.slug = $1 AND i.slug = $2 AND c.org_id = $3 AND i.status = 'published'`,
      [collectionSlug, itemSlug, orgId]
    );

    if (!rows.length) {
      throw new Error('Item not found');
    }

    return rows[0];
  }

  /**
   * Create a new item
   */
  async createItem(collectionId, orgId, userId, data) {
    const { itemData, slug, status } = data;

    // Verify collection exists and belongs to org
    const collection = await this.getCollection(collectionId, orgId);

    if (!itemData || typeof itemData !== 'object') {
      throw new Error('Item data is required');
    }

    // Validate required fields
    const requiredFields = collection.fields.filter(f => f.required);
    for (const field of requiredFields) {
      if (!itemData[field.name]) {
        throw new Error(`Required field '${field.name}' is missing`);
      }
    }

    // Check for duplicate slug if provided
    if (slug) {
      const existing = await db.query(
        `SELECT id FROM cms_items WHERE collection_id = $1 AND slug = $2`,
        [collectionId, slug]
      );
      if (existing.rows.length) {
        throw new Error('An item with this slug already exists');
      }
    }

    const { rows } = await db.query(
      `INSERT INTO cms_items (
        collection_id, data, slug, status, created_by, updated_by,
        published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        collectionId,
        JSON.stringify(itemData),
        slug || null,
        status || 'draft',
        userId,
        userId,
        status === 'published' ? new Date() : null
      ]
    );

    return rows[0];
  }

  /**
   * Update an item
   */
  async updateItem(itemId, collectionId, orgId, userId, data) {
    const { itemData, slug, status } = data;

    // Verify collection exists and belongs to org
    const collection = await this.getCollection(collectionId, orgId);

    const updates = [];
    const values = [];
    let idx = 1;

    if (itemData !== undefined) {
      if (typeof itemData !== 'object') {
        throw new Error('Item data must be an object');
      }
      
      // Validate required fields
      const requiredFields = collection.fields.filter(f => f.required);
      for (const field of requiredFields) {
        if (!itemData[field.name]) {
          throw new Error(`Required field '${field.name}' is missing`);
        }
      }
      
      updates.push(`data = $${idx++}`);
      values.push(JSON.stringify(itemData));
    }

    if (slug !== undefined) {
      // Check for duplicate slug
      const existing = await db.query(
        `SELECT id FROM cms_items WHERE collection_id = $1 AND slug = $2 AND id != $3`,
        [collectionId, slug, itemId]
      );
      if (existing.rows.length) {
        throw new Error('An item with this slug already exists');
      }
      updates.push(`slug = $${idx++}`);
      values.push(slug || null);
    }

    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
      
      // Set published_at when publishing
      if (status === 'published') {
        updates.push(`published_at = COALESCE(published_at, now())`);
      }
    }

    if (!updates.length) {
      throw new Error('Nothing to update');
    }

    updates.push(`updated_by = $${idx++}`);
    values.push(userId);
    updates.push(`updated_at = now()`);
    values.push(itemId, collectionId);

    const { rows } = await db.query(
      `UPDATE cms_items SET ${updates.join(', ')}
       WHERE id = $${idx} AND collection_id = $${idx + 1}
       RETURNING *`,
      values
    );

    if (!rows.length) {
      throw new Error('Item not found');
    }

    return rows[0];
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId, collectionId, orgId) {
    // Verify collection exists and belongs to org
    await this.getCollection(collectionId, orgId);

    const { rowCount } = await db.query(
      `DELETE FROM cms_items WHERE id = $1 AND collection_id = $2`,
      [itemId, collectionId]
    );

    if (!rowCount) {
      throw new Error('Item not found');
    }

    return { success: true };
  }

  /**
   * Bulk publish items
   */
  async bulkPublishItems(itemIds, collectionId, orgId) {
    // Verify collection exists and belongs to org
    await this.getCollection(collectionId, orgId);

    const { rowCount } = await db.query(
      `UPDATE cms_items 
       SET status = 'published', 
           published_at = COALESCE(published_at, now()),
           updated_at = now()
       WHERE id = ANY($1) AND collection_id = $2`,
      [itemIds, collectionId]
    );

    return { updated: rowCount };
  }

  /**
   * Bulk unpublish items
   */
  async bulkUnpublishItems(itemIds, collectionId, orgId) {
    // Verify collection exists and belongs to org
    await this.getCollection(collectionId, orgId);

    const { rowCount } = await db.query(
      `UPDATE cms_items 
       SET status = 'draft', updated_at = now()
       WHERE id = ANY($1) AND collection_id = $2`,
      [itemIds, collectionId]
    );

    return { updated: rowCount };
  }

  /**
   * Bulk delete items
   */
  async bulkDeleteItems(itemIds, collectionId, orgId) {
    // Verify collection exists and belongs to org
    await this.getCollection(collectionId, orgId);

    const { rowCount } = await db.query(
      `DELETE FROM cms_items WHERE id = ANY($1) AND collection_id = $2`,
      [itemIds, collectionId]
    );

    return { deleted: rowCount };
  }
}

module.exports = new CMSService();
