const db = require('../../db');

/**
 * Service for CRM Activities
 * Writes to the activity_timeline table which has columns:
 * id, org_id, contact_id, user_id, activity_type, description, metadata, created_at
 */
class ActivityService {
  /**
   * Create a new activity and persist it to the database.
   * @param {Object} activityData - { type, description, contactId, metadata? }
   * @param {string} userId - User performing the action
   * @param {string} orgId - Organisation context
   * @returns {Promise<Object>} Created activity row
   */
  async createActivity(activityData, userId, orgId) {
    const { type, description, contactId, metadata } = activityData;

    try {
      const { rows } = await db.query(
        `INSERT INTO activity_timeline
           (org_id, user_id, activity_type, description, contact_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          orgId,
          userId,
          type || 'note',
          description || type || 'Activity recorded',
          contactId || null,
          metadata ? JSON.stringify(metadata) : '{}',
        ]
      );

      return rows[0] || null;
    } catch (error) {
      console.error('ActivityService: Failed to persist activity', {
        orgId, type, userId, error: error.message,
      });
      return null;
    }
  }

  /**
   * Get activities for a contact
   */
  async getByContact(contactId, orgId) {
    const { rows } = await db.query(
      `SELECT a.*, u.full_name as user_name
       FROM activity_timeline a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.contact_id = $1 AND a.org_id = $2
       ORDER BY a.created_at DESC`,
      [contactId, orgId]
    );
    return rows;
  }

  /**
   * Get recent activities for an org
   */
  async getRecent(orgId, limit = 20) {
    const { rows } = await db.query(
      `SELECT a.*, u.full_name as user_name
       FROM activity_timeline a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.org_id = $1
       ORDER BY a.created_at DESC LIMIT $2`,
      [orgId, limit]
    );
    return rows;
  }
}

module.exports = new ActivityService();
