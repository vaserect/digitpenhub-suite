// backend/src/services/crm/ActivityService.js
// Fixed implementation — writes activities to the activity_timeline table
// instead of returning throwaway in-memory objects.

const db = require('../../db');
const logger = require('../../utils/logger');

class ActivityService {
  /**
   * Create a new activity and persist it to the database.
   * @param {string} orgId - Organization ID
   * @param {Object} activityData - { type, dealId?, subject?, metadata? }
   * @param {string} userId - User performing the action
   * @returns {Promise<Object>} Created activity row
   */
  async create(orgId, activityData, userId) {
    const { type, dealId, companyId, contactId, subject, metadata } = activityData;

    try {
      const { rows } = await db.query(
        `INSERT INTO activity_timeline
           (org_id, user_id, activity_type, entity_type, entity_id, subject, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          orgId,
          userId,
          type,
          activityData.entityType || (dealId ? 'deal' : companyId ? 'company' : contactId ? 'contact' : null) || 'crm',
          activityData.entityId || dealId || companyId || contactId,
          subject || type,
          metadata ? JSON.stringify(metadata) : null,
        ]
      );

      logger.info('Activity created', {
        orgId,
        activityId: rows[0]?.id,
        type,
        userId,
      });

      return rows[0] || null;
    } catch (error) {
      logger.error('ActivityService: Failed to persist activity', {
        orgId,
        type,
        userId,
        error: error.message,
      });
      // Fire-and-forget: don't throw — activity logging must never block the
      // primary operation (e.g. creating a deal should succeed even if the
      // activity row insert fails).
      return null;
    }
  }

  /**
   * Convenience wrapper around create() with entity context.
   */
  async logActivity(orgId, entityType, entityId, activityType, metadata, userId) {
    return this.create(orgId, {
      type: activityType,
      entityType,
      entityId,
      metadata,
    }, userId);
  }
}

module.exports = ActivityService;
