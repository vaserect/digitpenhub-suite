// backend/src/repositories/crm/EmailRepository.js
// CRM Email Repository
// Date: 2026-07-18

const BaseRepository = require('../base/BaseRepository');
const db = require('../../db');

/**
 * Repository for CRM Email operations
 */
class EmailRepository extends BaseRepository {
  constructor() {
    super('crm_emails');
  }

  // ============================================================================
  // EMAIL ACCOUNTS
  // ============================================================================

  /**
   * Create email account
   */
  async createAccount(orgId, userId, accountData) {
    const { rows } = await db.query(
      `INSERT INTO crm_email_accounts (
        org_id, user_id, provider, email_address, display_name,
        access_token, refresh_token, token_expires_at,
        smtp_host, smtp_port, smtp_username, smtp_password, smtp_use_tls,
        sync_enabled, sync_direction, auto_create_contacts, auto_log_emails,
        signature, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        orgId, userId, accountData.provider, accountData.emailAddress, accountData.displayName || null,
        accountData.accessToken || null, accountData.refreshToken || null, accountData.tokenExpiresAt || null,
        accountData.smtpHost || null, accountData.smtpPort || null, accountData.smtpUsername || null,
        accountData.smtpPassword || null, accountData.smtpUseTls !== false,
        accountData.syncEnabled !== false, accountData.syncDirection || 'bidirectional',
        accountData.autoCreateContacts !== false, accountData.autoLogEmails !== false,
        accountData.signature || null, accountData.isDefault || false
      ]
    );
    return rows[0];
  }

  /**
   * Get account by ID
   */
  async getAccountById(accountId) {
    const { rows } = await db.query(
      'SELECT * FROM crm_email_accounts WHERE id = $1',
      [accountId]
    );
    return rows[0] || null;
  }

  /**
   * Find account by email address
   */
  async findAccountByEmail(userId, emailAddress) {
    const { rows } = await db.query(
      'SELECT * FROM crm_email_accounts WHERE user_id = $1 AND email_address = $2',
      [userId, emailAddress]
    );
    return rows[0] || null;
  }

  /**
   * Get user's email accounts
   */
  async getUserAccounts(userId) {
    const { rows } = await db.query(
      `SELECT * FROM crm_email_accounts 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    return rows;
  }

  /**
   * Get default account for user
   */
  async getDefaultAccount(userId) {
    const { rows } = await db.query(
      `SELECT * FROM crm_email_accounts 
       WHERE user_id = $1 AND is_default = true AND is_active = true 
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  /**
   * Update account
   */
  async updateAccount(accountId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    if (fields.length === 0) return null;

    values.push(accountId);
    const { rows } = await db.query(
      `UPDATE crm_email_accounts SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  /**
   * Delete account
   */
  async deleteAccount(accountId) {
    await db.query('DELETE FROM crm_email_accounts WHERE id = $1', [accountId]);
    return true;
  }

  // ============================================================================
  // EMAILS
  // ============================================================================

  /**
   * Create email
   */
  async createEmail(orgId, emailData) {
    const { rows } = await db.query(
      `INSERT INTO crm_emails (
        org_id, message_id, thread_id, email_account_id, direction,
        from_address, from_name, to_addresses, cc_addresses, bcc_addresses,
        subject, body_text, body_html, snippet,
        sent_at, received_at, contact_id, company_id, deal_id, template_id,
        status, scheduled_at, synced_from_provider, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        orgId, emailData.messageId || `local-${Date.now()}`, emailData.threadId || null,
        emailData.emailAccountId, emailData.direction,
        emailData.fromAddress, emailData.fromName || null,
        emailData.toAddresses, emailData.ccAddresses || [], emailData.bccAddresses || [],
        emailData.subject, emailData.bodyText || null, emailData.bodyHtml || null,
        emailData.snippet || emailData.subject.substring(0, 200),
        emailData.sentAt || null, emailData.receivedAt || null,
        emailData.contactId || null, emailData.companyId || null, emailData.dealId || null,
        emailData.templateId || null, emailData.status || 'sent',
        emailData.scheduledAt || null, emailData.syncedFromProvider || false,
        emailData.createdBy || null
      ]
    );
    return rows[0];
  }

  /**
   * Get email by ID
   */
  async getEmailById(emailId) {
    const { rows } = await db.query(
      'SELECT * FROM crm_emails WHERE id = $1',
      [emailId]
    );
    return rows[0] || null;
  }

  /**
   * Get emails for contact
   */
  async getContactEmails(contactId, limit = 50, offset = 0) {
    const { rows } = await db.query(
      `SELECT * FROM crm_emails 
       WHERE contact_id = $1 
       ORDER BY sent_at DESC 
       LIMIT $2 OFFSET $3`,
      [contactId, limit, offset]
    );
    return rows;
  }

  /**
   * Get emails for company
   */
  async getCompanyEmails(companyId, limit = 50, offset = 0) {
    const { rows } = await db.query(
      `SELECT * FROM crm_emails 
       WHERE company_id = $1 
       ORDER BY sent_at DESC 
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );
    return rows;
  }

  /**
   * Get emails for deal
   */
  async getDealEmails(dealId, limit = 50, offset = 0) {
    const { rows } = await db.query(
      `SELECT * FROM crm_emails 
       WHERE deal_id = $1 
       ORDER BY sent_at DESC 
       LIMIT $2 OFFSET $3`,
      [dealId, limit, offset]
    );
    return rows;
  }

  /**
   * Update email
   */
  async updateEmail(emailId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    if (fields.length === 0) return null;

    values.push(emailId);
    const { rows } = await db.query(
      `UPDATE crm_emails SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  /**
   * Get scheduled emails
   */
  async getScheduledEmails() {
    const { rows } = await db.query(
      `SELECT * FROM crm_emails 
       WHERE status = 'scheduled' AND scheduled_at <= NOW() 
       ORDER BY scheduled_at ASC 
       LIMIT 100`
    );
    return rows;
  }

  // ============================================================================
  // ATTACHMENTS
  // ============================================================================

  /**
   * Create attachments
   */
  async createAttachments(emailId, attachments) {
    const values = attachments.map((att, idx) => 
      `($1, $${idx * 5 + 2}, $${idx * 5 + 3}, $${idx * 5 + 4}, $${idx * 5 + 5}, $${idx * 5 + 6})`
    ).join(', ');

    const params = [emailId];
    attachments.forEach(att => {
      params.push(att.fileName, att.fileSize, att.fileType, att.storagePath, att.storageProvider || 'local');
    });

    const { rows } = await db.query(
      `INSERT INTO crm_email_attachments (email_id, file_name, file_size, file_type, storage_path, storage_provider)
       VALUES ${values} RETURNING *`,
      params
    );
    return rows;
  }

  /**
   * Get email attachments
   */
  async getEmailAttachments(emailId) {
    const { rows } = await db.query(
      'SELECT * FROM crm_email_attachments WHERE email_id = $1',
      [emailId]
    );
    return rows;
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  /**
   * Create template
   */
  async createTemplate(orgId, userId, templateData) {
    const { rows } = await db.query(
      `INSERT INTO crm_email_templates (
        org_id, name, description, category, subject, body_html, body_text,
        variables, is_shared, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        orgId, templateData.name, templateData.description || null,
        templateData.category || null, templateData.subject,
        templateData.bodyHtml, templateData.bodyText || null,
        JSON.stringify(templateData.variables || []),
        templateData.isShared || false, userId
      ]
    );
    return rows[0];
  }

  /**
   * Get template by ID
   */
  async getTemplateById(orgId, templateId) {
    const { rows } = await db.query(
      'SELECT * FROM crm_email_templates WHERE id = $1 AND org_id = $2',
      [templateId, orgId]
    );
    return rows[0] || null;
  }

  /**
   * Get templates
   */
  async getTemplates(orgId, filters = {}) {
    let query = 'SELECT * FROM crm_email_templates WHERE org_id = $1 AND is_archived = false';
    const params = [orgId];
    let paramCount = 2;

    if (filters.category) {
      query += ` AND category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ' ORDER BY usage_count DESC, name ASC';

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'variables') {
        fields.push(`variables = $${paramCount}`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
        values.push(value);
      }
      paramCount++;
    }

    if (fields.length === 0) return null;

    values.push(templateId);
    const { rows } = await db.query(
      `UPDATE crm_email_templates SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId) {
    await db.query('DELETE FROM crm_email_templates WHERE id = $1', [templateId]);
    return true;
  }

  /**
   * Increment template usage
   */
  async incrementTemplateUsage(templateId) {
    await db.query(
      `UPDATE crm_email_templates 
       SET usage_count = usage_count + 1, last_used_at = NOW() 
       WHERE id = $1`,
      [templateId]
    );
  }

  // ============================================================================
  // TRACKING
  // ============================================================================

  /**
   * Create tracking event
   */
  async createTrackingEvent(emailId, eventData) {
    const { rows } = await db.query(
      `INSERT INTO crm_email_tracking_events (
        email_id, event_type, event_data, ip_address, user_agent,
        location, device_type, link_url, link_position
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        emailId, eventData.eventType, JSON.stringify(eventData.eventData || {}),
        eventData.ipAddress || null, eventData.userAgent || null,
        eventData.location || null, eventData.deviceType || null,
        eventData.linkUrl || null, eventData.linkPosition || null
      ]
    );
    return rows[0];
  }

  /**
   * Get tracking stats
   */
  async getTrackingStats(emailId) {
    const { rows } = await db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE event_type = 'opened') as open_count,
        COUNT(*) FILTER (WHERE event_type = 'clicked') as click_count,
        COUNT(*) FILTER (WHERE event_type = 'bounced') as bounce_count,
        MIN(occurred_at) FILTER (WHERE event_type = 'opened') as first_opened_at,
        MAX(occurred_at) FILTER (WHERE event_type = 'opened') as last_opened_at,
        MIN(occurred_at) FILTER (WHERE event_type = 'clicked') as first_clicked_at
       FROM crm_email_tracking_events 
       WHERE email_id = $1`,
      [emailId]
    );
    return rows[0];
  }

  // ============================================================================
  // SYNC
  // ============================================================================

  /**
   * Create sync log
   */
  async createSyncLog(accountId, syncType) {
    const { rows } = await db.query(
      `INSERT INTO crm_email_sync_log (email_account_id, sync_type, sync_direction, status)
       VALUES ($1, $2, 'inbound', 'running')
       RETURNING *`,
      [accountId, syncType]
    );
    return rows[0];
  }

  /**
   * Update sync log
   */
  async updateSyncLog(syncLogId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    if (fields.length === 0) return null;

    values.push(syncLogId);
    const { rows } = await db.query(
      `UPDATE crm_email_sync_log SET ${fields.join(', ')} 
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  // ============================================================================
  // UNSUBSCRIBES
  // ============================================================================

  /**
   * Check unsubscribed emails
   */
  async checkUnsubscribed(orgId, emails) {
    const emailArray = Array.isArray(emails) ? emails : [emails];
    const { rows } = await db.query(
      'SELECT email_address FROM crm_email_unsubscribes WHERE org_id = $1 AND email_address = ANY($2)',
      [orgId, emailArray]
    );
    return rows.map(r => r.email_address);
  }

  /**
   * Add unsubscribe
   */
  async addUnsubscribe(orgId, emailAddress, contactId = null, emailId = null, reason = null) {
    const { rows } = await db.query(
      `INSERT INTO crm_email_unsubscribes (org_id, email_address, contact_id, email_id, unsubscribe_reason)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (org_id, email_address) DO NOTHING
       RETURNING *`,
      [orgId, emailAddress, contactId, emailId, reason]
    );
    return rows[0] || null;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Convert camelCase to snake_case
   */
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = EmailRepository;
