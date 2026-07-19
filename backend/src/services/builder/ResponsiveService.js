const db = require('../../db');

class ResponsiveService {
  /**
   * Get all breakpoints for organization
   */
  async getBreakpoints(orgId) {
    const result = await db.query(
      'SELECT * FROM builder_breakpoints WHERE org_id = $1 ORDER BY sort_order ASC',
      [orgId]
    );
    return result.rows;
  }

  /**
   * Get breakpoint by ID
   */
  async getBreakpointById(id, orgId) {
    const result = await db.query(
      'SELECT * FROM builder_breakpoints WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    return result.rows[0];
  }

  /**
   * Create custom breakpoint
   */
  async createBreakpoint(orgId, data) {
    const { name, label, minWidth, maxWidth, baseFontSize, icon } = data;

    // Generate media query
    let mediaQuery = '@media ';
    if (minWidth && maxWidth) {
      mediaQuery += `(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`;
    } else if (minWidth) {
      mediaQuery += `(min-width: ${minWidth}px)`;
    } else if (maxWidth) {
      mediaQuery += `(max-width: ${maxWidth}px)`;
    } else {
      mediaQuery = 'all';
    }

    // Get next sort order
    const sortResult = await db.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM builder_breakpoints WHERE org_id = $1',
      [orgId]
    );
    const sortOrder = sortResult.rows[0].next_order;

    const result = await db.query(
      `INSERT INTO builder_breakpoints (
        org_id, name, label, min_width, max_width, base_font_size,
        media_query, icon, sort_order, is_system
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
      RETURNING *`,
      [orgId, name, label, minWidth, maxWidth, baseFontSize || 16, mediaQuery, icon, sortOrder]
    );

    return result.rows[0];
  }

  /**
   * Update breakpoint
   */
  async updateBreakpoint(id, orgId, data) {
    // Check if it's a system breakpoint
    const existing = await this.getBreakpointById(id, orgId);
    if (!existing) {
      throw new Error('Breakpoint not found');
    }
    if (existing.is_system) {
      throw new Error('Cannot modify system breakpoints');
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['label', 'min_width', 'max_width', 'base_font_size', 'icon', 'sort_order'];

    for (const field of allowedFields) {
      const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (data[camelField] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(data[camelField]);
        paramIndex++;
      }
    }

    // Regenerate media query if width changed
    if (data.minWidth !== undefined || data.maxWidth !== undefined) {
      const minWidth = data.minWidth !== undefined ? data.minWidth : existing.min_width;
      const maxWidth = data.maxWidth !== undefined ? data.maxWidth : existing.max_width;

      let mediaQuery = '@media ';
      if (minWidth && maxWidth) {
        mediaQuery += `(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`;
      } else if (minWidth) {
        mediaQuery += `(min-width: ${minWidth}px)`;
      } else if (maxWidth) {
        mediaQuery += `(max-width: ${maxWidth}px)`;
      } else {
        mediaQuery = 'all';
      }

      fields.push(`media_query = $${paramIndex}`);
      values.push(mediaQuery);
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, orgId);

    const result = await db.query(
      `UPDATE builder_breakpoints 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete custom breakpoint
   */
  async deleteBreakpoint(id, orgId) {
    // Check if it's a system breakpoint
    const existing = await this.getBreakpointById(id, orgId);
    if (!existing) {
      throw new Error('Breakpoint not found');
    }
    if (existing.is_system) {
      throw new Error('Cannot delete system breakpoints');
    }

    const result = await db.query(
      'DELETE FROM builder_breakpoints WHERE id = $1 AND org_id = $2 RETURNING *',
      [id, orgId]
    );
    return result.rows[0];
  }

  /**
   * Set default breakpoint
   */
  async setDefaultBreakpoint(id, orgId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Unset all defaults
      await client.query(
        'UPDATE builder_breakpoints SET is_default = false WHERE org_id = $1',
        [orgId]
      );

      // Set new default
      const result = await client.query(
        'UPDATE builder_breakpoints SET is_default = true WHERE id = $1 AND org_id = $2 RETURNING *',
        [id, orgId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get element styles for breakpoint
   */
  async getElementStyles(pageId, elementId, breakpointId = null) {
    let query = `
      SELECT es.*, b.name as breakpoint_name, b.label as breakpoint_label
      FROM builder_element_styles es
      JOIN builder_breakpoints b ON es.breakpoint_id = b.id
      WHERE es.page_id = $1 AND es.element_id = $2
    `;
    const params = [pageId, elementId];

    if (breakpointId) {
      query += ' AND es.breakpoint_id = $3';
      params.push(breakpointId);
    }

    query += ' ORDER BY b.sort_order ASC';

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Save element styles for breakpoint
   */
  async saveElementStyles(pageId, elementId, breakpointId, styles) {
    const result = await db.query(
      `INSERT INTO builder_element_styles (
        page_id, element_id, breakpoint_id, styles,
        is_hidden, display_mode, position_type,
        flex_direction, flex_wrap, justify_content, align_items,
        grid_template_columns, grid_template_rows, gap,
        margin_top, margin_right, margin_bottom, margin_left,
        padding_top, padding_right, padding_bottom, padding_left,
        font_size, line_height, letter_spacing,
        width, height, min_width, max_width, min_height, max_height
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
      ON CONFLICT (page_id, element_id, breakpoint_id) 
      DO UPDATE SET
        styles = EXCLUDED.styles,
        is_hidden = EXCLUDED.is_hidden,
        display_mode = EXCLUDED.display_mode,
        position_type = EXCLUDED.position_type,
        flex_direction = EXCLUDED.flex_direction,
        flex_wrap = EXCLUDED.flex_wrap,
        justify_content = EXCLUDED.justify_content,
        align_items = EXCLUDED.align_items,
        grid_template_columns = EXCLUDED.grid_template_columns,
        grid_template_rows = EXCLUDED.grid_template_rows,
        gap = EXCLUDED.gap,
        margin_top = EXCLUDED.margin_top,
        margin_right = EXCLUDED.margin_right,
        margin_bottom = EXCLUDED.margin_bottom,
        margin_left = EXCLUDED.margin_left,
        padding_top = EXCLUDED.padding_top,
        padding_right = EXCLUDED.padding_right,
        padding_bottom = EXCLUDED.padding_bottom,
        padding_left = EXCLUDED.padding_left,
        font_size = EXCLUDED.font_size,
        line_height = EXCLUDED.line_height,
        letter_spacing = EXCLUDED.letter_spacing,
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        min_width = EXCLUDED.min_width,
        max_width = EXCLUDED.max_width,
        min_height = EXCLUDED.min_height,
        max_height = EXCLUDED.max_height,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        pageId, elementId, breakpointId, JSON.stringify(styles.styles || {}),
        styles.isHidden || false,
        styles.displayMode, styles.positionType,
        styles.flexDirection, styles.flexWrap, styles.justifyContent, styles.alignItems,
        styles.gridTemplateColumns, styles.gridTemplateRows, styles.gap,
        styles.marginTop, styles.marginRight, styles.marginBottom, styles.marginLeft,
        styles.paddingTop, styles.paddingRight, styles.paddingBottom, styles.paddingLeft,
        styles.fontSize, styles.lineHeight, styles.letterSpacing,
        styles.width, styles.height, styles.minWidth, styles.maxWidth, styles.minHeight, styles.maxHeight
      ]
    );

    return result.rows[0];
  }

  /**
   * Delete element styles for breakpoint
   */
  async deleteElementStyles(pageId, elementId, breakpointId) {
    const result = await db.query(
      'DELETE FROM builder_element_styles WHERE page_id = $1 AND element_id = $2 AND breakpoint_id = $3 RETURNING *',
      [pageId, elementId, breakpointId]
    );
    return result.rows[0];
  }

  /**
   * Get breakpoint inheritance chain
   */
  async getInheritanceChain(breakpointId) {
    const result = await db.query(
      `WITH RECURSIVE inheritance_chain AS (
        SELECT 
          b.id, b.name, b.label, b.sort_order,
          0 as depth
        FROM builder_breakpoints b
        WHERE b.id = $1
        
        UNION ALL
        
        SELECT 
          b.id, b.name, b.label, b.sort_order,
          ic.depth + 1
        FROM builder_breakpoints b
        JOIN builder_breakpoint_inheritance bi ON b.id = bi.parent_breakpoint_id
        JOIN inheritance_chain ic ON bi.child_breakpoint_id = ic.id
      )
      SELECT * FROM inheritance_chain ORDER BY depth ASC`,
      [breakpointId]
    );

    return result.rows;
  }

  /**
   * Get computed styles for element (with inheritance)
   */
  async getComputedStyles(pageId, elementId, breakpointId) {
    // Get inheritance chain
    const chain = await this.getInheritanceChain(breakpointId);
    
    // Get styles for all breakpoints in chain
    const breakpointIds = chain.map(b => b.id);
    const result = await db.query(
      `SELECT * FROM builder_element_styles 
       WHERE page_id = $1 AND element_id = $2 AND breakpoint_id = ANY($3)
       ORDER BY breakpoint_id DESC`,
      [pageId, elementId, breakpointIds]
    );

    // Merge styles from parent to child (inheritance)
    let computedStyles = {};
    for (let i = result.rows.length - 1; i >= 0; i--) {
      const style = result.rows[i];
      computedStyles = { ...computedStyles, ...style.styles };
    }

    return computedStyles;
  }

  /**
   * Save responsive image
   */
  async saveResponsiveImage(pageId, elementId, breakpointId, imageData) {
    const { imageUrl, altText, loading, width, height, format, quality } = imageData;

    const result = await db.query(
      `INSERT INTO builder_responsive_images (
        page_id, element_id, breakpoint_id, image_url, alt_text,
        loading, width, height, format, quality
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (page_id, element_id, breakpoint_id)
      DO UPDATE SET
        image_url = EXCLUDED.image_url,
        alt_text = EXCLUDED.alt_text,
        loading = EXCLUDED.loading,
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        format = EXCLUDED.format,
        quality = EXCLUDED.quality
      RETURNING *`,
      [pageId, elementId, breakpointId, imageUrl, altText, loading || 'lazy', width, height, format, quality || 80]
    );

    return result.rows[0];
  }

  /**
   * Get responsive images for element
   */
  async getResponsiveImages(pageId, elementId) {
    const result = await db.query(
      `SELECT ri.*, b.name as breakpoint_name, b.label as breakpoint_label
       FROM builder_responsive_images ri
       JOIN builder_breakpoints b ON ri.breakpoint_id = b.id
       WHERE ri.page_id = $1 AND ri.element_id = $2
       ORDER BY b.sort_order ASC`,
      [pageId, elementId]
    );

    return result.rows;
  }

  /**
   * Reorder breakpoints
   */
  async reorderBreakpoints(orgId, breakpointIds) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < breakpointIds.length; i++) {
        await client.query(
          'UPDATE builder_breakpoints SET sort_order = $1 WHERE id = $2 AND org_id = $3',
          [i, breakpointIds[i], orgId]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new ResponsiveService();
