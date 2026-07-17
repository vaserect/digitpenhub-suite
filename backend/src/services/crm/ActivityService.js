// backend/src/services/crm/ActivityService.js
// Basic Activity Service for CRM
// Date: 2026-07-16

const logger = require('../../utils/logger');

/**
 * Service for CRM Activities
 * Handles business logic for activity tracking
 */
class ActivityService {
  /**
   * Create a new activity
   * @param {string} orgId - Organization ID
   * @param {Object} activityData - Activity data
   * @param {string} userId - User creating the activity
   * @returns {Promise<Object>} Created activity
   */
  async create(orgId, activityData, userId) {
    logger.info('Activity created', { orgId, type: activityData.type, userId });
    return {
      id: 'activity-' + Date.now(),
      ...activityData,
      orgId,
      createdBy: userId,
      createdAt: new Date()
    };
  }

  /**
   * Log activity for an entity
   * @param {string} orgId - Organization ID
   * @param {string} entityType - Entity type (contact, company, deal)
   * @param {string} entityId - Entity ID
   * @param {string} activityType - Activity type
   * @param {Object} metadata - Activity metadata
   * @param {string} userId - User performing the activity
   */
  async logActivity(orgId, entityType, entityId, activityType, metadata, userId) {
    logger.info('Activity logged', { orgId, entityType, entityId, activityType, userId });
    return this.create(orgId, {
      type: activityType,
      entityType,
      entityId,
      metadata
    }, userId);
  }
}

module.exports = ActivityService;
