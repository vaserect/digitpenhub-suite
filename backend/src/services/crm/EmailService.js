// backend/src/services/crm/EmailService.js
// CRM Email Integration Service
// Date: 2026-07-18

const BaseService = require('../base/BaseService');
const EmailRepository = require('../../repositories/crm/EmailRepository');
const ContactService = require('./ContactService');
const eventBus = require('../../utils/eventBus');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError } = require('../../utils/errors');

/**
 * Service for CRM Email Integration
 * Handles email accounts, sending, tracking, and templates
 */
class EmailService extends BaseService {
  constructor() {
    super(EmailRepository);
    this.contactService = ContactService;
  }

  // ============================================================================
  // EMAIL ACCOUNTS
  // ============================================================================

  /**
   * Connect email account (Gmail/Outlook/SMTP)
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @param {Object} accountData - Account connection data
   * @returns {Promise<Object>} Connected account
   */
  async connectAccount(orgId, userId, accountData) {
    this.validateAccountData(accountData);

    // Check if account already exists
    const existing = await this.repository.findAccountByEmail(userId, accountData.emailAddress);
    if (existing) {
      throw new ValidationError('This email account is already connected');
    }

    // Create account
    const account = await this.repository.createAccount(orgId, userId, accountData);

    // Start initial sync if enabled
    if (account.syncEnabled) {
      this.startSync(account.id, 'full').catch(err => {
        logger.error('Failed to start initial sync', { accountId: account.id, error: err.message });
      });
    }

    // Emit event
    eventBus.emit('crm.email.account.connected', {
      accountId: account.id,
      provider: account.provider,
      emailAddress: account.emailAddress,
      userId,
      orgId
    });

    logger.info('Email account connected', {
      accountId: account.id,
      provider: account.provider,
      emailAddress: account.emailAddress,
      userId,
      orgId
    });

    return this.sanitizeAccount(account);
  }

  /**
   * Disconnect email account
   * @param {string} accountId - Account ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async disconnectAccount(accountId, userId) {
    const account = await this.repository.getAccountById(accountId);
    if (!account) {
      throw new NotFoundError('Email account not found');
    }

    if (account.userId !== userId) {
      throw new ValidationError('You can only disconnect your own email accounts');
    }

    await this.repository.deleteAccount(accountId);

    eventBus.emit('crm.email.account.disconnected', {
      accountId,
      provider: account.provider,
      emailAddress: account.emailAddress,
      userId,
      orgId: account.orgId
    });

    logger.info('Email account disconnected', {
      accountId,
      provider: account.provider,
      userId
    });

    return true;
  }

  /**
   * Get user's email accounts
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Email accounts
   */
  async getUserAccounts(userId) {
    const accounts = await this.repository.getUserAccounts(userId);
    return accounts.map(acc => this.sanitizeAccount(acc));
  }

  /**
   * Update account settings
   * @param {string} accountId - Account ID
   * @param {string} userId - User ID
   * @param {Object} updates - Settings to update
   * @returns {Promise<Object>} Updated account
   */
  async updateAccountSettings(accountId, userId, updates) {
    const account = await this.repository.getAccountById(accountId);
    if (!account) {
      throw new NotFoundError('Email account not found');
    }

    if (account.userId !== userId) {
      throw new ValidationError('You can only update your own email accounts');
    }

    const updated = await this.repository.updateAccount(accountId, updates);

    logger.info('Email account settings updated', {
      accountId,
      userId,
      updates: Object.keys(updates)
    });

    return this.sanitizeAccount(updated);
  }

  // ============================================================================
  // EMAIL SENDING
  // ============================================================================

  /**
   * Send email
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Sent email
   */
  async sendEmail(orgId, userId, emailData) {
    this.validateEmailData(emailData);

    // Get sender account
    const account = emailData.accountId 
      ? await this.repository.getAccountById(emailData.accountId)
      : await this.repository.getDefaultAccount(userId);

    if (!account) {
      throw new ValidationError('No email account configured. Please connect an email account first.');
    }

    // Process template if provided
    let subject = emailData.subject;
    let bodyHtml = emailData.bodyHtml;
    let bodyText = emailData.bodyText;

    if (emailData.templateId) {
      const template = await this.repository.getTemplateById(orgId, emailData.templateId);
      if (!template) {
        throw new NotFoundError('Email template not found');
      }

      // Replace variables
      const variables = emailData.variables || {};
      subject = this.replaceVariables(template.subject, variables);
      bodyHtml = this.replaceVariables(template.bodyHtml, variables);
      bodyText = this.replaceVariables(template.bodyText || '', variables);

      // Update template usage
      await this.repository.incrementTemplateUsage(emailData.templateId);
    }

    // Check unsubscribe status
    const unsubscribed = await this.repository.checkUnsubscribed(orgId, emailData.to);
    if (unsubscribed.length > 0) {
      throw new ValidationError(`Cannot send to unsubscribed addresses: ${unsubscribed.join(', ')}`);
    }

    // Create email record
    const email = await this.repository.createEmail(orgId, {
      emailAccountId: account.id,
      direction: 'outbound',
      fromAddress: account.emailAddress,
      fromName: account.displayName || account.emailAddress,
      toAddresses: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
      ccAddresses: emailData.cc || [],
      bccAddresses: emailData.bcc || [],
      subject,
      bodyHtml,
      bodyText,
      contactId: emailData.contactId || null,
      companyId: emailData.companyId || null,
      dealId: emailData.dealId || null,
      templateId: emailData.templateId || null,
      status: emailData.scheduledAt ? 'scheduled' : 'sending',
      scheduledAt: emailData.scheduledAt || null,
      sentAt: emailData.scheduledAt ? null : new Date(),
      createdBy: userId
    });

    // Handle attachments
    if (emailData.attachments && emailData.attachments.length > 0) {
      await this.repository.createAttachments(email.id, emailData.attachments);
    }

    // Send immediately or schedule
    if (!emailData.scheduledAt) {
      await this.deliverEmail(email.id, account);
    }

    // Track activity
    if (emailData.contactId) {
      await this.trackEmailActivity(orgId, userId, emailData.contactId, email.id, 'email_sent');
    }

    // Emit event
    eventBus.emit('crm.email.sent', {
      emailId: email.id,
      contactId: emailData.contactId,
      companyId: emailData.companyId,
      dealId: emailData.dealId,
      userId,
      orgId
    });

    logger.info('Email sent', {
      emailId: email.id,
      to: emailData.to,
      subject,
      userId,
      orgId
    });

    return email;
  }

  /**
   * Send bulk emails
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @param {Array} recipients - Array of recipient data
   * @param {Object} emailData - Email template data
   * @returns {Promise<Object>} Bulk send results
   */
  async sendBulkEmails(orgId, userId, recipients, emailData) {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new ValidationError('Recipients array is required');
    }

    if (recipients.length > 1000) {
      throw new ValidationError('Maximum 1000 recipients per bulk send');
    }

    const results = {
      sent: [],
      failed: [],
      unsubscribed: []
    };

    // Check unsubscribes
    const allEmails = recipients.map(r => r.email);
    const unsubscribed = await this.repository.checkUnsubscribed(orgId, allEmails);
    const unsubscribedSet = new Set(unsubscribed);

    // Send to each recipient
    for (const recipient of recipients) {
      try {
        if (unsubscribedSet.has(recipient.email)) {
          results.unsubscribed.push({
            email: recipient.email,
            reason: 'Unsubscribed'
          });
          continue;
        }

        const email = await this.sendEmail(orgId, userId, {
          ...emailData,
          to: recipient.email,
          contactId: recipient.contactId,
          variables: {
            ...emailData.variables,
            ...recipient.variables
          }
        });

        results.sent.push({
          email: recipient.email,
          emailId: email.id
        });
      } catch (error) {
        results.failed.push({
          email: recipient.email,
          error: error.message
        });
      }
    }

    logger.info('Bulk email send completed', {
      total: recipients.length,
      sent: results.sent.length,
      failed: results.failed.length,
      unsubscribed: results.unsubscribed.length,
      userId,
      orgId
    });

    return results;
  }

  /**
   * Schedule email
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @param {Object} emailData - Email data with scheduledAt
   * @returns {Promise<Object>} Scheduled email
   */
  async scheduleEmail(orgId, userId, emailData) {
    if (!emailData.scheduledAt) {
      throw new ValidationError('scheduledAt is required for scheduling');
    }

    const scheduledDate = new Date(emailData.scheduledAt);
    if (scheduledDate <= new Date()) {
      throw new ValidationError('scheduledAt must be in the future');
    }

    return this.sendEmail(orgId, userId, emailData);
  }

  // ============================================================================
  // EMAIL TRACKING
  // ============================================================================

  /**
   * Track email open
   * @param {string} emailId - Email ID
   * @param {Object} trackingData - Tracking metadata
   * @returns {Promise<void>}
   */
  async trackOpen(emailId, trackingData = {}) {
    await this.repository.createTrackingEvent(emailId, {
      eventType: 'opened',
      ipAddress: trackingData.ipAddress,
      userAgent: trackingData.userAgent,
      location: trackingData.location,
      deviceType: trackingData.deviceType
    });

    const email = await this.repository.getEmailById(emailId);
    if (email && email.contactId) {
      await this.trackEmailActivity(email.orgId, null, email.contactId, emailId, 'email_opened');
    }

    eventBus.emit('crm.email.opened', {
      emailId,
      contactId: email?.contactId,
      orgId: email?.orgId
    });
  }

  /**
   * Track email click
   * @param {string} emailId - Email ID
   * @param {string} linkUrl - Clicked link URL
   * @param {Object} trackingData - Tracking metadata
   * @returns {Promise<void>}
   */
  async trackClick(emailId, linkUrl, trackingData = {}) {
    await this.repository.createTrackingEvent(emailId, {
      eventType: 'clicked',
      linkUrl,
      ipAddress: trackingData.ipAddress,
      userAgent: trackingData.userAgent,
      location: trackingData.location,
      deviceType: trackingData.deviceType
    });

    const email = await this.repository.getEmailById(emailId);
    if (email && email.contactId) {
      await this.trackEmailActivity(email.orgId, null, email.contactId, emailId, 'email_clicked');
    }

    eventBus.emit('crm.email.clicked', {
      emailId,
      linkUrl,
      contactId: email?.contactId,
      orgId: email?.orgId
    });
  }

  /**
   * Get email tracking stats
   * @param {string} emailId - Email ID
   * @returns {Promise<Object>} Tracking statistics
   */
  async getTrackingStats(emailId) {
    return this.repository.getTrackingStats(emailId);
  }

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  /**
   * Create email template
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  async createTemplate(orgId, userId, templateData) {
    this.validateTemplateData(templateData);

    const template = await this.repository.createTemplate(orgId, userId, templateData);

    logger.info('Email template created', {
      templateId: template.id,
      name: template.name,
      userId,
      orgId
    });

    return template;
  }

  /**
   * Get templates
   * @param {string} orgId - Organization ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Templates
   */
  async getTemplates(orgId, filters = {}) {
    return this.repository.getTemplates(orgId, filters);
  }

  /**
   * Update template
   * @param {string} orgId - Organization ID
   * @param {string} templateId - Template ID
   * @param {Object} updates - Updates
   * @returns {Promise<Object>} Updated template
   */
  async updateTemplate(orgId, templateId, updates) {
    const template = await this.repository.getTemplateById(orgId, templateId);
    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return this.repository.updateTemplate(templateId, updates);
  }

  /**
   * Delete template
   * @param {string} orgId - Organization ID
   * @param {string} templateId - Template ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTemplate(orgId, templateId) {
    const template = await this.repository.getTemplateById(orgId, templateId);
    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return this.repository.deleteTemplate(templateId);
  }

  // ============================================================================
  // EMAIL SYNC
  // ============================================================================

  /**
   * Start email sync
   * @param {string} accountId - Account ID
   * @param {string} syncType - 'full' or 'incremental'
   * @returns {Promise<Object>} Sync log
   */
  async startSync(accountId, syncType = 'incremental') {
    const account = await this.repository.getAccountById(accountId);
    if (!account) {
      throw new NotFoundError('Email account not found');
    }

    if (!account.syncEnabled) {
      throw new ValidationError('Sync is disabled for this account');
    }

    // Create sync log
    const syncLog = await this.repository.createSyncLog(accountId, syncType);

    // Start sync in background
    this.performSync(syncLog.id, account, syncType).catch(err => {
      logger.error('Sync failed', {
        syncLogId: syncLog.id,
        accountId,
        error: err.message
      });
    });

    return syncLog;
  }

  /**
   * Perform email sync (background job)
   * @param {string} syncLogId - Sync log ID
   * @param {Object} account - Email account
   * @param {string} syncType - Sync type
   * @returns {Promise<void>}
   */
  async performSync(syncLogId, account, syncType) {
    try {
      // Update sync log status
      await this.repository.updateSyncLog(syncLogId, { status: 'running' });

      // Sync logic depends on provider
      let stats = { processed: 0, created: 0, updated: 0, skipped: 0, contactsCreated: 0 };

      if (account.provider === 'gmail') {
        stats = await this.syncGmail(account, syncType);
      } else if (account.provider === 'outlook') {
        stats = await this.syncOutlook(account, syncType);
      }

      // Update account last sync
      await this.repository.updateAccount(account.id, {
        lastSyncAt: new Date(),
        syncStatus: 'active',
        syncError: null
      });

      // Complete sync log
      await this.repository.updateSyncLog(syncLogId, {
        status: 'completed',
        completedAt: new Date(),
        emailsProcessed: stats.processed,
        emailsCreated: stats.created,
        emailsUpdated: stats.updated,
        emailsSkipped: stats.skipped,
        contactsCreated: stats.contactsCreated
      });

      logger.info('Email sync completed', {
        syncLogId,
        accountId: account.id,
        stats
      });
    } catch (error) {
      // Update sync log with error
      await this.repository.updateSyncLog(syncLogId, {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message
      });

      // Update account sync status
      await this.repository.updateAccount(account.id, {
        syncStatus: 'error',
        syncError: error.message
      });

      logger.error('Email sync failed', {
        syncLogId,
        accountId: account.id,
        error: error.message
      });

      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Deliver email via provider
   * @param {string} emailId - Email ID
   * @param {Object} account - Email account
   * @returns {Promise<void>}
   */
  async deliverEmail(emailId, account) {
    // Implementation depends on provider
    // This is a placeholder - actual implementation would use
    // nodemailer, Gmail API, or Microsoft Graph API

    try {
      // Update status to sent
      await this.repository.updateEmail(emailId, {
        status: 'sent',
        sentAt: new Date()
      });

      // Create tracking event
      await this.repository.createTrackingEvent(emailId, {
        eventType: 'sent'
      });

      logger.info('Email delivered', { emailId, accountId: account.id });
    } catch (error) {
      // Update status to failed
      await this.repository.updateEmail(emailId, {
        status: 'failed'
      });

      logger.error('Email delivery failed', {
        emailId,
        accountId: account.id,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Sync Gmail emails
   * @param {Object} account - Gmail account
   * @param {string} syncType - Sync type
   * @returns {Promise<Object>} Sync stats
   */
  async syncGmail(account, syncType) {
    // Placeholder for Gmail sync implementation
    // Would use Gmail API to fetch emails
    return { processed: 0, created: 0, updated: 0, skipped: 0, contactsCreated: 0 };
  }

  /**
   * Sync Outlook emails
   * @param {Object} account - Outlook account
   * @param {string} syncType - Sync type
   * @returns {Promise<Object>} Sync stats
   */
  async syncOutlook(account, syncType) {
    // Placeholder for Outlook sync implementation
    // Would use Microsoft Graph API to fetch emails
    return { processed: 0, created: 0, updated: 0, skipped: 0, contactsCreated: 0 };
  }

  /**
   * Replace template variables
   * @param {string} text - Text with variables
   * @param {Object} variables - Variable values
   * @returns {string} Text with replaced variables
   */
  replaceVariables(text, variables) {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    return result;
  }

  /**
   * Track email activity
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID (optional)
   * @param {string} contactId - Contact ID
   * @param {string} emailId - Email ID
   * @param {string} activityType - Activity type
   * @returns {Promise<void>}
   */
  async trackEmailActivity(orgId, userId, contactId, emailId, activityType) {
    // Use activity tracker utility
    const { trackActivity } = require('../../utils/activityTracker');
    await trackActivity(orgId, userId, activityType, {
      contactId,
      emailId,
      description: `Email ${activityType.replace('email_', '')}`,
      metadata: { emailId }
    });
  }

  /**
   * Sanitize account (remove sensitive data)
   * @param {Object} account - Account object
   * @returns {Object} Sanitized account
   */
  sanitizeAccount(account) {
    const { accessToken, refreshToken, smtpPassword, ...safe } = account;
    return safe;
  }

  /**
   * Validate account data
   * @param {Object} data - Account data
   * @throws {ValidationError}
   */
  validateAccountData(data) {
    if (!data.provider || !['gmail', 'outlook', 'smtp'].includes(data.provider)) {
      throw new ValidationError('Invalid provider. Must be gmail, outlook, or smtp');
    }

    if (!data.emailAddress || !this.isValidEmail(data.emailAddress)) {
      throw new ValidationError('Valid email address is required');
    }

    if (data.provider === 'smtp') {
      if (!data.smtpHost || !data.smtpPort || !data.smtpUsername || !data.smtpPassword) {
        throw new ValidationError('SMTP credentials are required for SMTP provider');
      }
    }
  }

  /**
   * Validate email data
   * @param {Object} data - Email data
   * @throws {ValidationError}
   */
  validateEmailData(data) {
    if (!data.to || (Array.isArray(data.to) ? data.to.length === 0 : !data.to)) {
      throw new ValidationError('Recipient (to) is required');
    }

    if (!data.subject || data.subject.trim().length === 0) {
      throw new ValidationError('Subject is required');
    }

    if (!data.bodyHtml && !data.bodyText && !data.templateId) {
      throw new ValidationError('Email body or template is required');
    }
  }

  /**
   * Validate template data
   * @param {Object} data - Template data
   * @throws {ValidationError}
   */
  validateTemplateData(data) {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Template name is required');
    }

    if (!data.subject || data.subject.trim().length === 0) {
      throw new ValidationError('Template subject is required');
    }

    if (!data.bodyHtml || data.bodyHtml.trim().length === 0) {
      throw new ValidationError('Template body is required');
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} Is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = new EmailService();
