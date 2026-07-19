const BaseService = require('./base/BaseService');
const crypto = require('crypto');
const { trackActivity } = require('../utils/activityTracker');
const { notify } = require('../utils/notify');

/**
 * DirectMailService - Manages business logic for Direct Mail Automation (Lob/PostGrid benchmark)
 */
class DirectMailService extends BaseService {
  constructor(repository) {
    super(repository, { serviceName: 'DirectMailService' });
  }

  // ==================== TEMPLATES ====================

  async listTemplates(orgId, filters) {
    return this.repository.findTemplates(orgId, filters);
  }

  async getTemplate(id, orgId) {
    const template = await this.repository.findById(id, orgId);
    if (!template) throw new Error('Template not found');
    return template;
  }

  async createTemplate(data, orgId) {
    return this.repository.create({
      org_id: orgId,
      name: data.name,
      description: data.description || '',
      html_content: data.html_content,
      size: data.size || '4x6',
      type: data.type || 'postcard'
    }, orgId);
  }

  async updateTemplate(id, data, orgId) {
    const template = await this.getTemplate(id, orgId);
    return this.repository.update(id, {
      ...template,
      name: data.name || template.name,
      description: data.description !== undefined ? data.description : template.description,
      html_content: data.html_content || template.html_content,
      size: data.size || template.size,
      type: data.type || template.type
    }, orgId);
  }

  async deleteTemplate(id, orgId) {
    const template = await this.getTemplate(id, orgId);
    return this.repository.delete(id, orgId);
  }

  // ==================== CAMPAIGNS ====================

  async listCampaigns(orgId, filters) {
    return this.repository.findCampaigns(orgId, filters);
  }

  async getCampaign(id, orgId) {
    const campaign = await this.repository.findCampaignById(id, orgId);
    if (!campaign) throw new Error('Campaign not found');
    return campaign;
  }

  async createCampaign(data, orgId) {
    return this.repository.createCampaign(data, orgId);
  }

  async updateCampaign(id, data, orgId) {
    return this.repository.updateCampaign(id, data, orgId);
  }

  async deleteCampaign(id, orgId) {
    return this.repository.deleteCampaign(id, orgId);
  }

  // ==================== MAIL SENDS ====================

  async listSends(orgId, filters) {
    return this.repository.findSends(orgId, filters);
  }

  async getSend(id, orgId) {
    const send = await this.repository.findSendById(id, orgId);
    if (!send) throw new Error('Mail record not found');
    return send;
  }

  /**
   * Validate mailing address rules (USPS baseline simulation)
   */
  validateAddress(address) {
    const { to_name, to_address_line1, to_city, to_state, to_postal_code } = address;
    if (!to_name || !to_name.trim()) return 'Recipient name is required';
    if (!to_address_line1 || !to_address_line1.trim()) return 'Delivery address line 1 is required';
    if (!to_city || !to_city.trim()) return 'City is required';
    if (!to_state || !to_state.trim()) return 'State/Region is required';
    if (!to_postal_code || !to_postal_code.trim()) return 'ZIP/Postal code is required';
    return null;
  }

  /**
   * Send direct mail to a list of recipients (or single recipient)
   */
  async sendDirectMail(data, orgId) {
    try {
      const { template_id, campaign_id, contact_id, recipient } = data;
      
      // Load template
      const template = await this.getTemplate(template_id, orgId);

      // Validate address details
      const addressError = this.validateAddress(recipient);
      if (addressError) {
        throw new Error(`Address validation failed: ${addressError}`);
      }

      // Calculate cost based on type/size (Lob pricing model)
      let cost = 0.48; // Default 4x6 Postcard
      if (template.size === '6x9') cost = 0.68;
      else if (template.size === '8.5x11' || template.type === 'letter') cost = 0.88;

      // Mock integration job generation
      const providerJobId = 'job_' + crypto.randomBytes(8).toString('hex');
      const estimatedDays = template.type === 'letter' ? 5 : 3;
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays);

      const sendRecord = await this.repository.createSend({
        campaign_id: campaign_id || null,
        contact_id: contact_id || null,
        template_id: template_id,
        to_name: recipient.to_name,
        to_address_line1: recipient.to_address_line1,
        to_address_line2: recipient.to_address_line2 || '',
        to_city: recipient.to_city,
        to_state: recipient.to_state,
        to_postal_code: recipient.to_postal_code,
        to_country: recipient.to_country || 'US',
        status: 'created',
        status_details: 'Mail order accepted, routing to printing queue.',
        api_provider: 'mock_lob',
        provider_job_id: providerJobId,
        estimated_delivery_date: estimatedDelivery,
        cost
      }, orgId);

      // Track daily analytics
      const today = new Date().toISOString().split('T')[0];
      await this.repository.db.query(
        `INSERT INTO dm_analytics_daily (org_id, date, sends, cost)
         VALUES ($1, $2, 1, $3)
         ON CONFLICT (org_id, date) 
         DO UPDATE SET sends = dm_analytics_daily.sends + 1, cost = dm_analytics_daily.cost + $3`,
        [orgId, today, cost]
      );

      // Log Activity
      await trackActivity(orgId, null, 'direct_mail.sent', {
        contactId: contact_id || null,
        description: `Direct mail (${template.type}) sent to ${recipient.to_name}. Job ID: ${providerJobId}`,
        metadata: { jobId: providerJobId, type: template.type, size: template.size, cost }
      });

      return sendRecord;
    } catch (error) {
      this.logger.error('DirectMailService: Error sending direct mail', { data, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Advance a mail status through tracking stages (Simulates printing/transit carrier callbacks)
   */
  async simulateStatusAdvance(id, orgId) {
    const send = await this.getSend(id, orgId);
    
    const sequence = ['created', 'rendered', 'printed', 'in_transit', 'delivered'];
    const currentIdx = sequence.indexOf(send.status);
    
    if (currentIdx === -1 || send.status === 'delivered' || send.status === 'returned' || send.status === 'failed') {
      return send;
    }

    const nextStatus = sequence[currentIdx + 1];
    let details = `Job status updated automatically. Current stage: ${nextStatus}.`;
    if (nextStatus === 'rendered') details = 'Mail HTML layout successfully compiled to print-ready PDF.';
    else if (nextStatus === 'printed') details = 'Mail printed on high-resolution cardstock at local partner house.';
    else if (nextStatus === 'in_transit') details = 'Mailing carrier scanned and sorted in national sorting hub.';
    else if (nextStatus === 'delivered') details = 'Delivered to recipient address mail bin.';

    const updated = await this.repository.updateSendStatus(id, nextStatus, details, orgId);

    if (nextStatus === 'delivered') {
      // Update daily delivered aggregation
      const today = new Date().toISOString().split('T')[0];
      await this.repository.db.query(
        `INSERT INTO dm_analytics_daily (org_id, date, delivered)
         VALUES ($1, $2, 1)
         ON CONFLICT (org_id, date) DO UPDATE SET delivered = dm_analytics_daily.delivered + 1`,
        [orgId, today]
      );

      // Trigger standard platform notification
      await notify(orgId, {
        type: 'direct_mail_delivered',
        title: 'Direct Mail Delivered!',
        body: `Your postcard/letter to ${send.to_name} (Job: ${send.provider_job_id}) has been delivered successfully.`,
        email: false
      });
    }

    return updated;
  }

  // ==================== ANALYTICS ====================

  async getExecutiveAnalytics(orgId, startDate, endDate) {
    return this.repository.getAnalytics(orgId, startDate, endDate);
  }
}

module.exports = DirectMailService;
