const BaseService = require('../base/BaseService');
const LeadRepository = require('../../repositories/leads/LeadRepository');
const db = require('../../db');
const { notify } = require('../../utils/notify');
const { trackActivity } = require('../../utils/activityTracker');

class LeadService extends BaseService {
  constructor() {
    super(new LeadRepository());
  }

  async calculateLeadScore(submissionId, orgId) {
    // Get submission data
    const submission = await this.repository.findById(submissionId);
    if (!submission) throw new Error('Submission not found');

    // Get active scoring rules
    const { rows: rules } = await db.query(
      `SELECT * FROM lead_scoring_rules WHERE org_id = $1 AND is_active = true ORDER BY id`,
      [orgId]
    );

    let totalScore = 0;
    const data = submission.data_json || {};

    for (const rule of rules) {
      const conditions = rule.conditions || [];
      let allConditionsMet = true;

      for (const condition of conditions) {
        const fieldValue = data[condition.field];
        const conditionValue = condition.value;

        switch (condition.operator) {
          case 'equals':
            if (fieldValue !== conditionValue) allConditionsMet = false;
            break;
          case 'contains':
            if (!String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase())) {
              allConditionsMet = false;
            }
            break;
          case 'greater_than':
            if (Number(fieldValue) <= Number(conditionValue)) allConditionsMet = false;
            break;
          case 'less_than':
            if (Number(fieldValue) >= Number(conditionValue)) allConditionsMet = false;
            break;
          case 'not_empty':
            if (!fieldValue || fieldValue === '') allConditionsMet = false;
            break;
        }

        if (!allConditionsMet) break;
      }

      if (allConditionsMet) {
        totalScore += rule.score_change;
      }
    }

    // Update submission score
    await this.repository.updateScore(submissionId, totalScore);
    return totalScore;
  }

  async assignLead(submissionId, userId, orgId) {
    const lead = await this.repository.assignTo(submissionId, userId);
    
    // Notify assigned user
    notify(orgId, {
      type: 'lead_assigned',
      title: 'New lead assigned to you',
      body: `You have been assigned a new lead.`,
      userId,
      email: true
    });

    trackActivity(orgId, userId, 'lead.assigned', {
      leadId: submissionId,
      description: `Lead assigned to user`
    });

    return lead;
  }

  async setFollowUpReminder(submissionId, followUpAt, orgId, userId) {
    const lead = await this.repository.setFollowUp(submissionId, followUpAt);
    
    trackActivity(orgId, userId, 'lead.follow_up_scheduled', {
      leadId: submissionId,
      followUpAt,
      description: `Follow-up scheduled for ${new Date(followUpAt).toLocaleString()}`
    });

    return lead;
  }

  async getFollowUpReminders(orgId) {
    return await this.repository.getLeadsNeedingFollowUp(orgId);
  }

  async bulkUpdateStatus(submissionIds, status, orgId) {
    const { rows } = await db.query(
      `UPDATE lead_submissions SET status = $1 WHERE id = ANY($2) AND org_id = $3 RETURNING id`,
      [status, submissionIds, orgId]
    );
    return rows;
  }

  async bulkAssign(submissionIds, userId, orgId) {
    const { rows } = await db.query(
      `UPDATE lead_submissions SET assigned_to = $1 WHERE id = ANY($2) AND org_id = $3 RETURNING id`,
      [userId, submissionIds, orgId]
    );
    
    notify(orgId, {
      type: 'leads_assigned',
      title: `${rows.length} leads assigned to you`,
      userId,
      email: true
    });

    return rows;
  }

  async exportLeads(orgId, filters = {}) {
    let query = `
      SELECT s.*, f.name as form_name, u.full_name as assigned_to_name
      FROM lead_submissions s
      JOIN lead_forms f ON f.id = s.form_id
      LEFT JOIN users u ON u.id = s.assigned_to
      WHERE s.org_id = $1
    `;
    const params = [orgId];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND s.status = $${params.length}`;
    }

    if (filters.formId) {
      params.push(filters.formId);
      query += ` AND s.form_id = $${params.length}`;
    }

    if (filters.assignedTo) {
      params.push(filters.assignedTo);
      query += ` AND s.assigned_to = $${params.length}`;
    }

    query += ` ORDER BY s.submitted_at DESC`;

    const { rows } = await db.query(query, params);
    return rows;
  }
}

module.exports = LeadService;
