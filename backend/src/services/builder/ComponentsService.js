const db = require('../../db');

class ComponentsService {
  /**
   * Get all components for organization
   */
  async getComponents(orgId, filters = {}) {
    const { category, isPublished, isSystem } = filters;
    
    let query = 'SELECT * FROM builder_components WHERE org_id = $1';
    const params = [orgId];
    let paramIndex = 2;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (isPublished !== undefined) {
      query += ` AND is_published = $${paramIndex}`;
      params.push(isPublished);
      paramIndex++;
    }

    if (isSystem !== undefined) {
      query += ` AND is_system = $${paramIndex}`;
      params.push(isSystem);
      paramIndex++;
    }

    query += ' ORDER BY category, name';

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get component by ID
   */
  async getComponentById(id, orgId) {
    const result = await db.query(
      'SELECT * FROM builder_components WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    return result.rows[0];
  }

  /**
   * Create component
   */
  async createComponent(orgId, userId, data) {
    const {
      name, description, category, baseStructure, baseStyles,
      hasVariants, variantProperties, thumbnailUrl, previewHtml
    } = data;

    const result = await db.query(
      `INSERT INTO builder_components (
        org_id, name, description, category, base_structure, base_styles,
        has_variants, variant_properties, thumbnail_url, preview_html,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        orgId, name, description, category,
        JSON.stringify(baseStructure), JSON.stringify(baseStyles || {}),
        hasVariants || false, JSON.stringify(variantProperties || []),
        thumbnailUrl, previewHtml, userId
      ]
    );

    return result.rows[0];
  }

  /**
   * Update component
   */
  async updateComponent(id, orgId, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'description', 'category', 'base_structure', 'base_styles',
      'has_variants', 'variant_properties', 'thumbnail_url', 'preview_html',
      'is_published'
    ];

    for (const field of allowedFields) {
      const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (data[camelField] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        
        if (['base_structure', 'base_styles', 'variant_properties'].includes(field)) {
          values.push(JSON.stringify(data[camelField]));
        } else {
          values.push(data[camelField]);
        }
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, orgId);

    const result = await db.query(
      `UPDATE builder_components 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete component
   */
  async deleteComponent(id, orgId) {
    // Check if it's a system component
    const component = await this.getComponentById(id, orgId);
    if (!component) {
      throw new Error('Component not found');
    }
    if (component.is_system) {
      throw new Error('Cannot delete system components');
    }

    const result = await db.query(
      'DELETE FROM builder_components WHERE id = $1 AND org_id = $2 RETURNING *',
      [id, orgId]
    );
    return result.rows[0];
  }

  /**
   * Increment component usage
   */
  async incrementUsage(id) {
    await db.query(
      'UPDATE builder_components SET usage_count = usage_count + 1 WHERE id = $1',
      [id]
    );
  }

  /**
   * Get component variants
   */
  async getVariants(componentId) {
    const result = await db.query(
      'SELECT * FROM builder_component_variants WHERE component_id = $1 ORDER BY sort_order, name',
      [componentId]
    );
    return result.rows;
  }

  /**
   * Create variant
   */
  async createVariant(componentId, data) {
    const { name, description, propertyValues, structureOverrides, styleOverrides, thumbnailUrl } = data;

    const result = await db.query(
      `INSERT INTO builder_component_variants (
        component_id, name, description, property_values,
        structure_overrides, style_overrides, thumbnail_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        componentId, name, description,
        JSON.stringify(propertyValues || {}),
        JSON.stringify(structureOverrides || {}),
        JSON.stringify(styleOverrides || {}),
        thumbnailUrl
      ]
    );

    return result.rows[0];
  }

  /**
   * Update variant
   */
  async updateVariant(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'description', 'property_values', 'structure_overrides',
      'style_overrides', 'thumbnail_url', 'is_default', 'sort_order'
    ];

    for (const field of allowedFields) {
      const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (data[camelField] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        
        if (['property_values', 'structure_overrides', 'style_overrides'].includes(field)) {
          values.push(JSON.stringify(data[camelField]));
        } else {
          values.push(data[camelField]);
        }
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(
      `UPDATE builder_component_variants 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete variant
   */
  async deleteVariant(id) {
    const result = await db.query(
      'DELETE FROM builder_component_variants WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Create component instance on page
   */
  async createInstance(pageId, elementId, componentId, variantId, overrides = {}) {
    const result = await db.query(
      `INSERT INTO builder_component_instances (
        page_id, element_id, component_id, variant_id, instance_overrides
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [pageId, elementId, componentId, variantId, JSON.stringify(overrides)]
    );

    // Increment usage count
    await this.incrementUsage(componentId);

    return result.rows[0];
  }

  /**
   * Get component instances for page
   */
  async getInstances(pageId) {
    const result = await db.query(
      `SELECT 
        ci.*,
        c.name as component_name,
        c.category as component_category,
        v.name as variant_name
       FROM builder_component_instances ci
       JOIN builder_components c ON ci.component_id = c.id
       LEFT JOIN builder_component_variants v ON ci.variant_id = v.id
       WHERE ci.page_id = $1`,
      [pageId]
    );
    return result.rows;
  }

  /**
   * Update instance
   */
  async updateInstance(id, data) {
    const { variantId, instanceOverrides, isDetached } = data;
    
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (variantId !== undefined) {
      fields.push(`variant_id = $${paramIndex}`);
      values.push(variantId);
      paramIndex++;
    }

    if (instanceOverrides !== undefined) {
      fields.push(`instance_overrides = $${paramIndex}`);
      values.push(JSON.stringify(instanceOverrides));
      paramIndex++;
    }

    if (isDetached !== undefined) {
      fields.push(`is_detached = $${paramIndex}`);
      values.push(isDetached);
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(
      `UPDATE builder_component_instances 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete instance
   */
  async deleteInstance(id) {
    const result = await db.query(
      'DELETE FROM builder_component_instances WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get component libraries
   */
  async getLibraries(orgId) {
    const result = await db.query(
      'SELECT * FROM builder_component_libraries WHERE org_id = $1 ORDER BY name',
      [orgId]
    );
    return result.rows;
  }

  /**
   * Create library
   */
  async createLibrary(orgId, userId, data) {
    const { name, description, isShared, isPublic, icon, color } = data;

    const result = await db.query(
      `INSERT INTO builder_component_libraries (
        org_id, name, description, is_shared, is_public, icon, color, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [orgId, name, description, isShared || false, isPublic || false, icon, color, userId]
    );

    return result.rows[0];
  }

  /**
   * Get library components
   */
  async getLibraryComponents(libraryId) {
    const result = await db.query(
      `SELECT 
        lc.*,
        c.name, c.description, c.category, c.thumbnail_url,
        c.has_variants, c.usage_count
       FROM builder_library_components lc
       JOIN builder_components c ON lc.component_id = c.id
       WHERE lc.library_id = $1
       ORDER BY lc.sort_order, c.name`,
      [libraryId]
    );
    return result.rows;
  }

  /**
   * Add component to library
   */
  async addToLibrary(libraryId, componentId) {
    const result = await db.query(
      `INSERT INTO builder_library_components (library_id, component_id)
       VALUES ($1, $2)
       ON CONFLICT (library_id, component_id) DO NOTHING
       RETURNING *`,
      [libraryId, componentId]
    );
    return result.rows[0];
  }

  /**
   * Remove component from library
   */
  async removeFromLibrary(libraryId, componentId) {
    const result = await db.query(
      'DELETE FROM builder_library_components WHERE library_id = $1 AND component_id = $2 RETURNING *',
      [libraryId, componentId]
    );
    return result.rows[0];
  }

  /**
   * Duplicate component
   */
  async duplicateComponent(id, orgId, userId, newName) {
    const original = await this.getComponentById(id, orgId);
    if (!original) {
      throw new Error('Component not found');
    }

    const duplicate = { ...original };
    delete duplicate.id;
    delete duplicate.created_at;
    delete duplicate.updated_at;
    duplicate.name = newName || `${original.name} (Copy)`;
    duplicate.is_system = false;
    duplicate.is_published = false;
    duplicate.usage_count = 0;

    return this.createComponent(orgId, userId, duplicate);
  }
}

module.exports = new ComponentsService();
