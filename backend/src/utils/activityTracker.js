/**
 * Activity Tracker — Unified activity logging for CRM and beyond.
 * Every significant action across the platform creates an activity record
 * that shows up in the contact's timeline, the global activity feed,
 * and powers analytics/reporting.
 *
 * Usage:
 *   const { trackActivity } = require('./utils/activityTracker');
 *   await trackActivity(req.user.orgId, req.user.id, 'contact.created', {
 *     contactId: contact.id,
 *     description: `Created contact ${contact.full_name}`,
 *     metadata: { fullName: contact.full_name, source: 'manual' },
 *   });
 */

const db = require('../db');

/**
 * Log an activity event to the timeline.
 * @param {string} orgId - Organization ID
 * @param {string} userId - User ID (optional, can be null for system events)
 * @param {string} activityType - One of the activity_type enum values
 * @param {Object} options - { contactId, description, metadata }
 */
async function trackActivity(orgId, userId, activityType, options = {}) {
  const { contactId, description, metadata } = options;
  
  try {
    await db.query(
      `INSERT INTO activity_timeline (org_id, contact_id, user_id, activity_type, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orgId, contactId || null, userId || null, activityType, description || activityType, JSON.stringify(metadata || {})]
    );
  } catch (err) {
    // Don't throw — activity logging is fire-and-forget; a failure to log
    // an activity should never break the primary operation.
    console.error('Activity tracker error:', err.message);
  }
}

/**
 * Get timeline for a specific contact.
 * @param {string} contactId - Contact ID
 * @param {string} orgId - Organization ID
 * @param {Object} options - { limit, offset, types[] }
 * @returns {Array} Timeline entries
 */
async function getTimelineForContact(contactId, orgId, options = {}) {
  const { limit = 50, offset = 0, types = [] } = options;
  
  let query = 'SELECT * FROM activity_timeline WHERE contact_id = $1 AND org_id = $2';
  const params = [contactId, orgId];
  
  if (types.length > 0) {
    query += ` AND activity_type IN (${types.map((_, i) => `$${params.length + 1 + i}`).join(',')})`;
    params.push(...types);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ' + limit + ' OFFSET ' + offset;
  
  const { rows } = await db.query(query, params);
  return rows;
}

/**
 * Get global activity feed for an organization.
 * @param {string} orgId - Organization ID
 * @param {Object} options - { limit, offset, types[], contactId }
 * @returns {Array} Activity entries
 */
async function getGlobalTimeline(orgId, options = {}) {
  const { limit = 50, offset = 0, types = [], contactId } = options;
  
  let query = 'SELECT * FROM activity_timeline WHERE org_id = $1';
  const params = [orgId];
  
  if (contactId) {
    query += ' AND contact_id = $2';
    params.push(contactId);
  }
  
  if (types.length > 0) {
    const idx = params.length + 1;
    query += ` AND activity_type IN (${types.map((_, i) => `$${idx + i}`).join(',')})`;
    params.push(...types);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ' + limit + ' OFFSET ' + offset;
  
  const { rows } = await db.query(query, params);
  return rows;
}

module.exports = { trackActivity, getTimelineForContact, getGlobalTimeline };
