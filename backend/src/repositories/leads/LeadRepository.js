const BaseRepository = require('../base/BaseRepository');
const db = require('../../db');

class LeadRepository extends BaseRepository {
  constructor() {
    super(db, 'lead_submissions');
  }

  async findByFormId(formId, filters = {}) {
    const { status, limit = 100, offset = 0 } = filters;
    let query = `
      SELECT s.*, f.name as form_name
      FROM ${this.tableName} s
      JOIN lead_forms f ON f.id = s.form_id
      WHERE s.form_id = $1
    `;
    const params = [formId];

    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }

    query += ` ORDER BY s.submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await this.db.query(query, params);
    return rows;
  }

  async updateScore(id, score) {
    const { rows } = await this.db.query(
      `UPDATE ${this.tableName} SET score = $1 WHERE id = $2 RETURNING *`,
      [score, id]
    );
    return rows[0];
  }

  async assignTo(id, userId) {
    const { rows } = await this.db.query(
      `UPDATE ${this.tableName} SET assigned_to = $1 WHERE id = $2 RETURNING *`,
      [userId, id]
    );
    return rows[0];
  }

  async setFollowUp(id, followUpAt) {
    const { rows } = await this.db.query(
      `UPDATE ${this.tableName} SET follow_up_at = $1 WHERE id = $2 RETURNING *`,
      [followUpAt, id]
    );
    return rows[0];
  }

  async getLeadsNeedingFollowUp(orgId) {
    const { rows } = await this.db.query(
      `SELECT s.*, f.name as form_name, u.full_name as assigned_to_name
       FROM ${this.tableName} s
       JOIN lead_forms f ON f.id = s.form_id
       LEFT JOIN users u ON u.id = s.assigned_to
       WHERE s.org_id = $1 AND s.follow_up_at <= NOW() AND s.status NOT IN ('converted', 'lost')
       ORDER BY s.follow_up_at ASC`,
      [orgId]
    );
    return rows;
  }
}

module.exports = LeadRepository;
