const BaseRepository = require('./base/BaseRepository');
const db = require('../db');

/**
 * Repository for contact data access
 * Extends BaseRepository with contact-specific operations
 */
class ContactRepository extends BaseRepository {
  constructor() {
    super(db, 'contacts', {
      primaryKey: 'id',
      timestamps: true,
    });
  }

  /**
   * Search contacts by name, email, or phone
   * @param {number} orgId - Organization ID
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Matching contacts
   */
  async search(orgId, query, filters = {}) {
    try {
      const whereClauses = ['org_id = $1'];
      const params = [orgId];
      let paramIndex = 2;

      // Add search query
      if (query) {
        whereClauses.push(`(
          full_name ILIKE $${paramIndex} OR
          email ILIKE $${paramIndex} OR
          phone ILIKE $${paramIndex} OR
          company ILIKE $${paramIndex}
        )`);
        params.push(`%${query}%`);
        paramIndex++;
      }

      // Add stage filter
      if (filters.stage) {
        whereClauses.push(`stage = $${paramIndex}`);
        params.push(filters.stage);
        paramIndex++;
      }

      // Add tags filter
      if (filters.tags && filters.tags.length > 0) {
        whereClauses.push(`tags && $${paramIndex}`);
        params.push(filters.tags);
        paramIndex++;
      }

      const whereClause = whereClauses.join(' AND ');

      const { rows } = await this.db.query(
        `SELECT * FROM ${this.tableName}
         WHERE ${whereClause}
         ORDER BY last_touch_at DESC NULLS LAST, created_at DESC
         LIMIT 100`,
        params
      );

      return rows;
    } catch (error) {
      this.logger.error('ContactRepository: Error searching contacts', {
        orgId,
        query,
        filters,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get contacts by stage
   * @param {number} orgId - Organization ID
   * @param {string} stage - Contact stage
   * @returns {Promise<Array>} Contacts in stage
   */
  async findByStage(orgId, stage) {
    try {
      const { rows } = await this.db.query(
        `SELECT * FROM ${this.tableName}
         WHERE org_id = $1 AND stage = $2
         ORDER BY last_touch_at DESC NULLS LAST, created_at DESC`,
        [orgId, stage]
      );
      return rows;
    } catch (error) {
      this.logger.error('ContactRepository: Error finding by stage', {
        orgId,
        stage,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get contact statistics by stage
   * @param {number} orgId - Organization ID
   * @returns {Promise<Object>} Statistics object
   */
  async getStatsByStage(orgId) {
    try {
      const { rows } = await this.db.query(
        `SELECT 
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE stage='new')::int AS new,
           COUNT(*) FILTER (WHERE stage='contacted')::int AS contacted,
           COUNT(*) FILTER (WHERE stage='proposal_sent')::int AS proposal_sent,
           COUNT(*) FILTER (WHERE stage='won')::int AS won,
           COUNT(*) FILTER (WHERE stage='lost')::int AS lost,
           COALESCE(SUM(value_ngn), 0)::numeric AS total_value
         FROM ${this.tableName}
         WHERE org_id = $1`,
        [orgId]
      );
      return rows[0];
    } catch (error) {
      this.logger.error('ContactRepository: Error getting stats', {
        orgId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update contact's last touch timestamp
   * @param {number} id - Contact ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<boolean>} Success status
   */
  async updateLastTouch(id, orgId) {
    try {
      const { rowCount } = await this.db.query(
        `UPDATE ${this.tableName}
         SET last_touch_at = NOW()
         WHERE id = $1 AND org_id = $2`,
        [id, orgId]
      );
      return rowCount > 0;
    } catch (error) {
      this.logger.error('ContactRepository: Error updating last touch', {
        id,
        orgId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get contacts with recent activity
   * @param {number} orgId - Organization ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array>} Contacts with recent activity
   */
  async findWithRecentActivity(orgId, days = 30) {
    try {
      const { rows } = await this.db.query(
        `SELECT * FROM ${this.tableName}
         WHERE org_id = $1 
           AND last_touch_at > NOW() - INTERVAL '${days} days'
         ORDER BY last_touch_at DESC`,
        [orgId]
      );
      return rows;
    } catch (error) {
      this.logger.error('ContactRepository: Error finding recent activity', {
        orgId,
        days,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get contacts without recent activity
   * @param {number} orgId - Organization ID
   * @param {number} days - Number of days threshold
   * @returns {Promise<Array>} Stale contacts
   */
  async findStale(orgId, days = 30) {
    try {
      const { rows } = await this.db.query(
        `SELECT * FROM ${this.tableName}
         WHERE org_id = $1
           AND (last_touch_at IS NULL OR last_touch_at < NOW() - $2::interval)
           AND stage NOT IN ('won', 'lost')
         ORDER BY created_at DESC`,
        [orgId, `${days} days`]
      );
      return rows;
    } catch (error) {
      this.logger.error('ContactRepository: Error finding stale contacts', {
        orgId,
        days,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Add note to contact
   * @param {number} contactId - Contact ID
   * @param {Object} noteData - Note data
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Created note
   */
  async addNote(contactId, noteData, userId) {
    try {
      const { rows } = await this.db.query(
        `INSERT INTO contact_notes (contact_id, content, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [contactId, noteData.content, userId]
      );

      // Update last touch
      await this.updateLastTouch(contactId, noteData.orgId);

      return rows[0];
    } catch (error) {
      this.logger.error('ContactRepository: Error adding note', {
        contactId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get notes for contact
   * @param {number} contactId - Contact ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<Array>} Contact notes
   */
  async getNotes(contactId, orgId) {
    try {
      const { rows } = await this.db.query(
        `SELECT cn.*, u.full_name AS created_by_name
         FROM contact_notes cn
         JOIN contacts c ON c.id = cn.contact_id
         LEFT JOIN users u ON u.id = cn.created_by
         WHERE cn.contact_id = $1 AND c.org_id = $2
         ORDER BY cn.created_at DESC`,
        [contactId, orgId]
      );
      return rows;
    } catch (error) {
      this.logger.error('ContactRepository: Error getting notes', {
        contactId,
        orgId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete note
   * @param {number} noteId - Note ID
   * @param {number} contactId - Contact ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteNote(noteId, contactId, orgId) {
    try {
      const { rowCount } = await this.db.query(
        `DELETE FROM contact_notes
         WHERE id = $1 
           AND contact_id = $2
           AND contact_id IN (SELECT id FROM contacts WHERE org_id = $3)`,
        [noteId, contactId, orgId]
      );
      return rowCount > 0;
    } catch (error) {
      this.logger.error('ContactRepository: Error deleting note', {
        noteId,
        contactId,
        orgId,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = ContactRepository;
