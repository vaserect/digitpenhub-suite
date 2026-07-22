// backend/src/services/GamificationEngine.js
// Listens to EventBus events and auto-awards points + checks badge criteria.
// Wired into server.js during app startup.

const eventBus = require('../utils/eventBus');
const db = require('../db');
const logger = require('../utils/logger');

const POINTS_MAP = {
  'deal.won': 100,
  'deal.created': 10,
  'contact.created': 5,
  'task.completed': 10,
  'invoice.sent': 25,
  'invoice.paid': 50,
  'pipeline.created': 20,
  'community.created': 30,
  'team.invited': 15,
};

class GamificationEngine {
  constructor() {
    this._initialized = false;
  }

  initialize() {
    if (this._initialized) return;
    this._initialized = true;

    const events = Object.keys(POINTS_MAP);
    for (const eventName of events) {
      eventBus.on(eventName, (data) => {
        this._handleEvent(eventName, data).catch((err) => {
          logger.error('GamificationEngine: error handling event', { event: eventName, error: err.message });
        });
      });
    }

    // Also listen to deal.won for badge checking
    eventBus.on('deal.won', (data) => {
      this._checkBadgeCriteria(data.orgId, data.userId, 'deal.won').catch(() => {});
    });

    eventBus.on('contact.created', (data) => {
      this._checkBadgeCriteria(data.orgId, data.userId, 'contact.created').catch(() => {});
    });

    logger.info('GamificationEngine initialized', { subscribedEvents: events.length });
  }

  async _handleEvent(eventType, data) {
    const points = POINTS_MAP[eventType];
    if (!points || !data?.orgId || !data?.userId) return;

    try {
      await db.query(
        `INSERT INTO gamification_points (org_id, user_id, points, source, source_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [data.orgId, data.userId, points, eventType, data?.deal?.id || null, JSON.stringify({ event: eventType })]
      );
      logger.debug('GamificationEngine: points awarded', { orgId: data.orgId, userId: data.userId, eventType, points });
    } catch (err) {
      logger.error('GamificationEngine: failed to award points', { eventType, error: err.message });
    }
  }

  async _checkBadgeCriteria(orgId, userId, action) {
    try {
      // Find badges whose criteria_type is 'count' or 'milestone' matching this action
      const { rows: badges } = await db.query(
        `SELECT * FROM gamification_badge_definitions
         WHERE org_id = $1 AND is_active = true AND criteria_config->>'action' = $2`,
        [orgId, action]
      );

      for (const badge of badges) {
        // Check if already earned
        const { rows: existing } = await db.query(
          `SELECT id FROM gamification_user_badges WHERE user_id = $1 AND badge_id = $2`,
          [userId, badge.id]
        );
        if (existing.length) continue;

        if (badge.criteria_type === 'milestone') {
          // Milestone badges are earned on first occurrence — award immediately
          await db.query(
            `INSERT INTO gamification_user_badges (org_id, user_id, badge_id, context)
             VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, badge_id) DO NOTHING`,
            [orgId, userId, badge.id, JSON.stringify({ action, earnedVia: action })]
          );
          logger.info('GamificationEngine: badge awarded', { userId, badge: badge.slug });

        } else if (badge.criteria_type === 'count') {
          const threshold = badge.criteria_config?.threshold || 1;
          // Count total points entries with this source for this user
          const { rows: countResult } = await db.query(
            `SELECT COUNT(*)::int AS cnt FROM gamification_points
             WHERE org_id = $1 AND user_id = $2 AND source = $3`,
            [orgId, userId, action]
          );
          if (countResult[0].cnt >= threshold) {
            await db.query(
              `INSERT INTO gamification_user_badges (org_id, user_id, badge_id, context)
               VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, badge_id) DO NOTHING`,
              [orgId, userId, badge.id, JSON.stringify({ count: countResult[0].cnt, threshold })]
            );
            logger.info('GamificationEngine: badge awarded', { userId, badge: badge.slug });
          }
        }
      }
    } catch (err) {
      logger.error('GamificationEngine: badge check failed', { action, error: err.message });
    }
  }
}

module.exports = new GamificationEngine();
