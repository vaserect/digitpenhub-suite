const BaseRepository = require('../base/BaseRepository');
const db = require('../../db');
const logger = require('../../utils/logger');

class HelpdeskRepository extends BaseRepository {
  constructor() {
    super(db, 'helpdesk_tickets', { logger, serviceName: 'HelpdeskRepository' });
  }

  async getStats(orgId) {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS total,
         COUNT(*) FILTER(WHERE status='open')::int AS open,
         COUNT(*) FILTER(WHERE status='pending')::int AS pending,
         COUNT(*) FILTER(WHERE status='resolved')::int AS resolved
       FROM helpdesk_tickets WHERE org_id=$1`,
      [orgId]
    );
    return rows[0];
  }

  async getTicketWithReplies(id, orgId) {
    const [ticketRes, repliesRes] = await Promise.all([
      db.query(`SELECT * FROM helpdesk_tickets WHERE id=$1 AND org_id=$2`, [id, orgId]),
      db.query(`SELECT * FROM helpdesk_replies WHERE ticket_id=$1 AND org_id=$2 ORDER BY created_at`, [id, orgId]),
    ]);
    return { ticket: ticketRes.rows[0] || null, replies: repliesRes.rows };
  }

  async generateTicketNumber() {
    const { rows } = await db.query(`SELECT nextval('ticket_number_seq') AS n`);
    return `TKT-${String(rows[0].n).padStart(5, '0')}`;
  }

  async addReply(ticketId, orgId, data) {
    const { rows } = await db.query(
      `INSERT INTO helpdesk_replies (org_id,ticket_id,author,body,is_internal) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [orgId, ticketId, data.author || 'Support', data.body.trim(), !!data.isInternal]
    );
    await db.query(`UPDATE helpdesk_tickets SET updated_at=NOW() WHERE id=$1 AND org_id=$2`, [ticketId, orgId]);
    return rows[0];
  }

  async checkTicketExists(id, orgId) {
    const { rows } = await db.query(`SELECT id FROM helpdesk_tickets WHERE id=$1 AND org_id=$2`, [id, orgId]);
    return rows.length > 0;
  }

  async findAllByOrg(orgId, filters = {}) {
    const conditions = ['org_id=$1'];
    const vals = [orgId];
    let i = 2;
    if (filters.status) { conditions.push(`status=$${i++}`); vals.push(filters.status); }
    if (filters.priority) { conditions.push(`priority=$${i++}`); vals.push(filters.priority); }
    const { rows } = await db.query(
      `SELECT * FROM helpdesk_tickets WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      vals
    );
    return rows;
  }

  async exportAll(orgId) {
    const { rows } = await db.query(
      `SELECT * FROM helpdesk_tickets WHERE org_id=$1 ORDER BY created_at DESC`,
      [orgId]
    );
    return rows;
  }
}

module.exports = HelpdeskRepository;
