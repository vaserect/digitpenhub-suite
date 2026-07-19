const BaseService = require('../base/BaseService');
const EmailRepository = require('../../repositories/email/EmailRepository');
const logger = require('../../utils/logger');

class EmailService extends BaseService {
  constructor() {
    const repository = new EmailRepository();
    super(repository, { serviceName: 'EmailService', logger });
  }

  async listLists(orgId) {
    return this.repository.listListsWithCounts(orgId);
  }

  async listSubscribers(orgId, listId) {
    return this.repository.listSubscribers(orgId, listId);
  }

  async addSubscriber(orgId, listId, email, name) {
    return this.repository.addSubscriber(orgId, listId, email, name);
  }

  async importSubscribers(orgId, listId, subscribers) {
    return this.repository.importSubscribers(orgId, listId, subscribers);
  }

  async removeSubscriber(orgId, subscriberId) {
    return this.repository.removeSubscriber(orgId, subscriberId);
  }

  async listCampaigns(orgId) {
    return this.repository.listCampaigns(orgId);
  }

  async getCampaignStats(orgId, campaignId) {
    return this.repository.getCampaignStats(orgId, campaignId);
  }

  validateCreate(data) {
    if (!data.name?.trim()) throw new Error('name is required.');
  }

  validateUpdate(data) {
    if (!data.name?.trim()) throw new Error('name is required.');
  }
}

module.exports = EmailService;
