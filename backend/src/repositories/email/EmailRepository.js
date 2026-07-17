const BaseRepository = require('../base/BaseRepository');
const db = require('../../db');
const logger = require('../../utils/logger');

class EmailRepository extends BaseRepository {
  constructor() {
    super(db, 'email_lists', { logger, serviceName: 'EmailRepository' });
  }

  async listListsWithCounts(orgId) {
    const { rows } = await db.query(
      `SELECT l.id, l.name, l.description, l.created_at,
              COUNT(s.id) FILTER (WHERE s.status = 'subscribed') AS subscriber_count
       FROM email_lists l
       LEFT JOIN email_subscribers s ON s.list_id = l.id
       WHERE l.org_id = $1
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      [orgId]
    );
    return rows;
  }

  async listSubscribers(orgId, listId) {
    const { rows } = await db.query(
      `SELECT s.id, s.email, s.name, s.status, s.created_at
       FROM email_subscribers s
       JOIN email_lists l ON l.id = s.list_id
       WHERE l.org_id = $1 AND s.list_id = $2
       ORDER BY s.created_at DESC`,
      [orgId, listId]
    );
    return rows;
  }

  async addSubscriber(orgId, listId, email, name) {
    const { rows } = await db.query(
      `INSERT INTO email_subscribers (list_id, email, name, status)
       VALUES ($1,$2,$3,'subscribed')
       ON CONFLICT (list_id, email) DO UPDATE SET name = $3, status = 'subscribed'
       RETURNING *`,
      [listId, email, name || null]
    );
    return rows[0];
  }

  async importSubscribers(orgId, listId, subscribers) {
    const imported = [];
    for (const sub of subscribers) {
      if (!sub.email) continue;
      const result = await this.addSubscriber(orgId, listId, sub.email, sub.name);
      imported.push(result);
    }
    return imported;
  }

  async removeSubscriber(orgId, subscriberId) {
    await db.query(
      `DELETE FROM email_subscribers WHERE id = $1 AND list_id IN (SELECT id FROM email_lists WHERE org_id = $2)`,
      [subscriberId, orgId]
    );
  }

  async listCampaigns(orgId) {
    const { rows } = await db.query(
      `SELECT id, name, subject, status, scheduled_at, sent_at, created_at
       FROM email_campaigns WHERE org_id = $1 ORDER BY created_at DESC`,
      [orgId]
    );
    return rows;
  }

  async getCampaignStats(orgId, campaignId) {
    const { rows } = await db.query(
      `SELECT * FROM email_campaigns WHERE id = $1 AND org_id = $2`,
      [campaignId, orgId]
    );
    return rows[0] || null;
  }

  async updateCampaignStatus(campaignId, status) {
    await db.query(`UPDATE email_campaigns SET status = $1 WHERE id = $2`, [status, campaignId]);
  }
}

module.exports = EmailRepository;
