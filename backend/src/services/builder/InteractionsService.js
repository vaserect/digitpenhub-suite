const db = require('../../config/database');

class InteractionsService {
  /**
   * Get all interactions for an organization
   */
  async getInteractions(orgId, filters = {}) {
    const { triggerType, isPreset } = filters;
    
    let query = 'SELECT * FROM builder_interactions WHERE org_id = $1';
    const params = [orgId];
    let paramIndex = 2;

    if (triggerType) {
      query += ` AND trigger_type = $${paramIndex}`;
      params.push(triggerType);
      paramIndex++;
    }

    if (isPreset !== undefined) {
      query += ` AND is_preset = $${paramIndex}`;
      params.push(isPreset);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get interaction by ID
   */
  async getInteractionById(id, orgId) {
    const result = await db.query(
      'SELECT * FROM builder_interactions WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    return result.rows[0];
  }

  /**
   * Create new interaction
   */
  async createInteraction(orgId, data) {
    const {
      name,
      description,
      triggerType,
      triggerSelector,
      triggerOptions,
      animationType,
      animationProperties,
      animationDuration,
      animationEasing,
      animationDelay,
      animationIterations,
      animationDirection,
      affectChildren,
      staggerDelay,
      preserve3d
    } = data;

    const result = await db.query(
      `INSERT INTO builder_interactions (
        org_id, name, description, trigger_type, trigger_selector, trigger_options,
        animation_type, animation_properties, animation_duration, animation_easing,
        animation_delay, animation_iterations, animation_direction,
        affect_children, stagger_delay, preserve_3d
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        orgId, name, description, triggerType, triggerSelector, 
        JSON.stringify(triggerOptions || {}),
        animationType, JSON.stringify(animationProperties),
        animationDuration || 300, animationEasing || 'ease',
        animationDelay || 0, animationIterations || 1, animationDirection || 'normal',
        affectChildren || false, staggerDelay || 0, preserve3d || false
      ]
    );

    return result.rows[0];
  }

  /**
   * Update interaction
   */
  async updateInteraction(id, orgId, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'description', 'trigger_type', 'trigger_selector', 'trigger_options',
      'animation_type', 'animation_properties', 'animation_duration', 'animation_easing',
      'animation_delay', 'animation_iterations', 'animation_direction',
      'affect_children', 'stagger_delay', 'preserve_3d'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbField} = $${paramIndex}`);
        
        // Handle JSON fields
        if (['trigger_options', 'animation_properties'].includes(dbField)) {
          values.push(JSON.stringify(data[field]));
        } else {
          values.push(data[field]);
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
      `UPDATE builder_interactions 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete interaction
   */
  async deleteInteraction(id, orgId) {
    const result = await db.query(
      'DELETE FROM builder_interactions WHERE id = $1 AND org_id = $2 RETURNING *',
      [id, orgId]
    );
    return result.rows[0];
  }

  /**
   * Apply interaction to element
   */
  async applyInteractionToElement(pageId, elementId, interactionId, options = {}) {
    const {
      overrideDuration,
      overrideDelay,
      overrideEasing,
      overrideProperties,
      conditions,
      executionOrder
    } = options;

    const result = await db.query(
      `INSERT INTO builder_element_interactions (
        page_id, element_id, interaction_id,
        override_duration, override_delay, override_easing, override_properties,
        conditions, execution_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        pageId, elementId, interactionId,
        overrideDuration, overrideDelay, overrideEasing,
        overrideProperties ? JSON.stringify(overrideProperties) : null,
        conditions ? JSON.stringify(conditions) : '[]',
        executionOrder || 0
      ]
    );

    return result.rows[0];
  }

  /**
   * Get element interactions
   */
  async getElementInteractions(pageId, elementId = null) {
    let query = `
      SELECT ei.*, i.name, i.trigger_type, i.animation_type
      FROM builder_element_interactions ei
      JOIN builder_interactions i ON ei.interaction_id = i.id
      WHERE ei.page_id = $1
    `;
    const params = [pageId];

    if (elementId) {
      query += ' AND ei.element_id = $2';
      params.push(elementId);
    }

    query += ' ORDER BY ei.execution_order ASC';

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Remove interaction from element
   */
  async removeInteractionFromElement(id) {
    const result = await db.query(
      'DELETE FROM builder_element_interactions WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get animation presets
   */
  async getAnimationPresets(filters = {}) {
    const { category, isPremium } = filters;
    
    let query = 'SELECT * FROM builder_animation_presets WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (isPremium !== undefined) {
      query += ` AND is_premium = $${paramIndex}`;
      params.push(isPremium);
      paramIndex++;
    }

    query += ' ORDER BY popularity_score DESC, name ASC';

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get preset by ID
   */
  async getPresetById(id) {
    const result = await db.query(
      'SELECT * FROM builder_animation_presets WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Increment preset popularity
   */
  async incrementPresetPopularity(id) {
    await db.query(
      'UPDATE builder_animation_presets SET popularity_score = popularity_score + 1 WHERE id = $1',
      [id]
    );
  }

  /**
   * Create scroll animation
   */
  async createScrollAnimation(pageId, elementId, config) {
    const {
      triggerStart,
      triggerEnd,
      scrub,
      pin,
      timeline,
      markers,
      anticipatePin
    } = config;

    const result = await db.query(
      `INSERT INTO builder_scroll_animations (
        page_id, element_id, trigger_start, trigger_end,
        scrub, pin, timeline, markers, anticipate_pin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        pageId, elementId,
        triggerStart || 'top bottom',
        triggerEnd || 'bottom top',
        scrub || false,
        pin || false,
        JSON.stringify(timeline || []),
        markers || false,
        anticipatePin || false
      ]
    );

    return result.rows[0];
  }

  /**
   * Get scroll animations for page
   */
  async getScrollAnimations(pageId, elementId = null) {
    let query = 'SELECT * FROM builder_scroll_animations WHERE page_id = $1';
    const params = [pageId];

    if (elementId) {
      query += ' AND element_id = $2';
      params.push(elementId);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Update scroll animation
   */
  async updateScrollAnimation(id, config) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'trigger_start', 'trigger_end', 'scrub', 'pin', 
      'timeline', 'markers', 'anticipate_pin'
    ];

    for (const field of allowedFields) {
      if (config[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        
        if (field === 'timeline') {
          values.push(JSON.stringify(config[field]));
        } else {
          values.push(config[field]);
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
      `UPDATE builder_scroll_animations 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete scroll animation
   */
  async deleteScrollAnimation(id) {
    const result = await db.query(
      'DELETE FROM builder_scroll_animations WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Duplicate interaction
   */
  async duplicateInteraction(id, orgId, newName) {
    const original = await this.getInteractionById(id, orgId);
    if (!original) {
      throw new Error('Interaction not found');
    }

    const duplicate = { ...original };
    delete duplicate.id;
    delete duplicate.created_at;
    delete duplicate.updated_at;
    duplicate.name = newName || `${original.name} (Copy)`;
    duplicate.is_preset = false;

    return this.createInteraction(orgId, duplicate);
  }

  /**
   * Get interaction usage stats
   */
  async getInteractionStats(interactionId) {
    const result = await db.query(
      `SELECT 
        COUNT(DISTINCT page_id) as pages_count,
        COUNT(*) as elements_count
       FROM builder_element_interactions
       WHERE interaction_id = $1`,
      [interactionId]
    );

    return result.rows[0];
  }
}

module.exports = new InteractionsService();
