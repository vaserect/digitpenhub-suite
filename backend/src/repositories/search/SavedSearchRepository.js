/**
 * SavedSearchRepository - Phase 7: Saved searches management
 */

const db = require('../../db');

class SavedSearchRepository {
  /**
   * Save a search query
   */
  async saveSearch({ orgId, userId, name, query, filters, entityTypes }) {
    try {
      const sql = `
        INSERT INTO saved_searches (
          org_id, user_id, name, query, filters, entity_types
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const result = await db.query(sql, [
        orgId, userId, name, query, 
        JSON.stringify(filters || {}),
        entityTypes || []
      ]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to save search: ${error.message}`);
    }
  }

  /**
   * Get saved searches for a user
   */
  async getUserSavedSearches(userId, orgId) {
    try {
      const sql = `
        SELECT * FROM saved_searches
        WHERE user_id = $1 AND org_id = $2
        ORDER BY last_used_at DESC NULLS LAST, created_at DESC
      `;
      const result = await db.query(sql, [userId, orgId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get saved searches: ${error.message}`);
    }
  }

  /**
   * Update saved search usage
   */
  async updateUsage(searchId, userId) {
    try {
      const sql = `
        UPDATE saved_searches
        SET use_count = use_count + 1,
            last_used_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
      `;
      await db.query(sql, [searchId, userId]);
    } catch (error) {
      console.error('Failed to update search usage:', error);
    }
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(searchId, userId, orgId) {
    try {
      const sql = `
        DELETE FROM saved_searches
        WHERE id = $1 AND user_id = $2 AND org_id = $3
      `;
      const result = await db.query(sql, [searchId, userId, orgId]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete saved search: ${error.message}`);
    }
  }
}

module.exports = SavedSearchRepository;
