const BaseService = require('../base/BaseService');
const HelpdeskRepository = require('../../repositories/helpdesk/HelpdeskRepository');
const logger = require('../../utils/logger');

class HelpdeskService extends BaseService {
  constructor() {
    const repository = new HelpdeskRepository();
    super(repository, { serviceName: 'HelpdeskService', logger });
  }

  async getStats(orgId) {
    return this.repository.getStats(orgId);
  }

  async getTicketWithReplies(id, orgId) {
    return this.repository.getTicketWithReplies(id, orgId);
  }

  async createTicket(data, orgId, userId) {
    this.validateCreate(data);
    const ticketNumber = await this.repository.generateTicketNumber();
    const entity = await this.repository.create({
      ticket_number: ticketNumber,
      subject: data.subject.trim(),
      description: data.description || null,
      requester_name: data.requesterName.trim(),
      requester_email: data.requesterEmail || null,
      priority: data.priority || 'medium',
      assignee: data.assignee || null,
    }, orgId, userId);
    return this.enrichEntity(entity);
  }

  async addReply(ticketId, orgId, data) {
    const exists = await this.repository.checkTicketExists(ticketId, orgId);
    if (!exists) return null;
    return this.repository.addReply(ticketId, orgId, data);
  }

  async findAll(orgId, filters = {}) {
    return this.repository.findAllByOrg(orgId, filters);
  }

  async exportAll(orgId) {
    return this.repository.exportAll(orgId);
  }

  validateCreate(data) {
    if (!data.subject?.trim()) throw new Error('subject required');
    if (!data.requesterName?.trim()) throw new Error('requesterName required');
  }
}

module.exports = HelpdeskService;
