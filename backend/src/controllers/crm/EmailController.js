// backend/src/controllers/crm/EmailController.js
// CRM Email Controller
// Date: 2026-07-18

const EmailService = require('../../services/crm/EmailService');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ValidationError } = require('../../utils/errors');

/**
 * Connect email account
 * POST /api/v1/crm/email/accounts
 */
exports.connectAccount = asyncHandler(async (req, res) => {
  const { provider, emailAddress, displayName, accessToken, refreshToken, tokenExpiresAt,
          smtpHost, smtpPort, smtpUsername, smtpPassword, smtpUseTls,
          syncEnabled, syncDirection, autoCreateContacts, autoLogEmails, signature, isDefault } = req.body;

  const account = await EmailService.connectAccount(req.user.orgId, req.user.id, {
    provider, emailAddress, displayName, accessToken, refreshToken, tokenExpiresAt,
    smtpHost, smtpPort, smtpUsername, smtpPassword, smtpUseTls,
    syncEnabled, syncDirection, autoCreateContacts, autoLogEmails, signature, isDefault
  });

  res.status(201).json({ account });
});

/**
 * Get user's email accounts
 * GET /api/v1/crm/email/accounts
 */
exports.getAccounts = asyncHandler(async (req, res) => {
  const accounts = await EmailService.getUserAccounts(req.user.id);
  res.json({ accounts });
});

/**
 * Update email account settings
 * PATCH /api/v1/crm/email/accounts/:accountId
 */
exports.updateAccount = asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  const updates = req.body;

  const account = await EmailService.updateAccountSettings(accountId, req.user.id, updates);
  res.json({ account });
});

/**
 * Disconnect email account
 * DELETE /api/v1/crm/email/accounts/:accountId
 */
exports.disconnectAccount = asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  await EmailService.disconnectAccount(accountId, req.user.id);
  res.json({ ok: true });
});

/**
 * Start email sync
 * POST /api/v1/crm/email/accounts/:accountId/sync
 */
exports.startSync = asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  const { syncType } = req.body;

  const syncLog = await EmailService.startSync(accountId, syncType || 'incremental');
  res.json({ syncLog });
});

/**
 * Send email
 * POST /api/v1/crm/email/send
 */
exports.sendEmail = asyncHandler(async (req, res) => {
  const { accountId, to, cc, bcc, subject, bodyHtml, bodyText, templateId, variables,
          contactId, companyId, dealId, attachments, scheduledAt } = req.body;

  const email = await EmailService.sendEmail(req.user.orgId, req.user.id, {
    accountId, to, cc, bcc, subject, bodyHtml, bodyText, templateId, variables,
    contactId, companyId, dealId, attachments, scheduledAt
  });

  res.status(201).json({ email });
});

/**
 * Send bulk emails
 * POST /api/v1/crm/email/send-bulk
 */
exports.sendBulkEmails = asyncHandler(async (req, res) => {
  const { recipients, emailData } = req.body;

  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new ValidationError('recipients array is required');
  }

  const results = await EmailService.sendBulkEmails(req.user.orgId, req.user.id, recipients, emailData);
  res.json(results);
});

/**
 * Schedule email
 * POST /api/v1/crm/email/schedule
 */
exports.scheduleEmail = asyncHandler(async (req, res) => {
  const emailData = req.body;

  const email = await EmailService.scheduleEmail(req.user.orgId, req.user.id, emailData);
  res.status(201).json({ email });
});

/**
 * Get emails for contact
 * GET /api/v1/crm/contacts/:contactId/emails
 */
exports.getContactEmails = asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  const { limit, offset } = req.query;

  const emails = await EmailService.repository.getContactEmails(
    contactId,
    parseInt(limit) || 50,
    parseInt(offset) || 0
  );

  res.json({ emails });
});

/**
 * Get emails for company
 * GET /api/v1/crm/companies/:companyId/emails
 */
exports.getCompanyEmails = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { limit, offset } = req.query;

  const emails = await EmailService.repository.getCompanyEmails(
    companyId,
    parseInt(limit) || 50,
    parseInt(offset) || 0
  );

  res.json({ emails });
});

/**
 * Get emails for deal
 * GET /api/v1/crm/deals/:dealId/emails
 */
exports.getDealEmails = asyncHandler(async (req, res) => {
  const { dealId } = req.params;
  const { limit, offset } = req.query;

  const emails = await EmailService.repository.getDealEmails(
    dealId,
    parseInt(limit) || 50,
    parseInt(offset) || 0
  );

  res.json({ emails });
});

/**
 * Track email open (pixel tracking)
 * GET /api/v1/crm/email/track/open/:emailId
 */
exports.trackOpen = asyncHandler(async (req, res) => {
  const { emailId } = req.params;

  await EmailService.trackOpen(emailId, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    // Additional tracking data can be added here
  });

  // Return 1x1 transparent pixel
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(pixel);
});

/**
 * Track email click
 * GET /api/v1/crm/email/track/click/:emailId
 */
exports.trackClick = asyncHandler(async (req, res) => {
  const { emailId } = req.params;
  const { url } = req.query;

  if (!url) {
    throw new ValidationError('url parameter is required');
  }

  await EmailService.trackClick(emailId, url, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Redirect to the actual URL
  res.redirect(url);
});

/**
 * Get email tracking stats
 * GET /api/v1/crm/email/:emailId/tracking
 */
exports.getTrackingStats = asyncHandler(async (req, res) => {
  const { emailId } = req.params;

  const stats = await EmailService.getTrackingStats(emailId);
  res.json({ stats });
});

/**
 * Create email template
 * POST /api/v1/crm/email/templates
 */
exports.createTemplate = asyncHandler(async (req, res) => {
  const { name, description, category, subject, bodyHtml, bodyText, variables, isShared } = req.body;

  const template = await EmailService.createTemplate(req.user.orgId, req.user.id, {
    name, description, category, subject, bodyHtml, bodyText, variables, isShared
  });

  res.status(201).json({ template });
});

/**
 * Get email templates
 * GET /api/v1/crm/email/templates
 */
exports.getTemplates = asyncHandler(async (req, res) => {
  const { category, search } = req.query;

  const templates = await EmailService.getTemplates(req.user.orgId, { category, search });
  res.json({ templates });
});

/**
 * Get email template by ID
 * GET /api/v1/crm/email/templates/:templateId
 */
exports.getTemplate = asyncHandler(async (req, res) => {
  const { templateId } = req.params;

  const template = await EmailService.repository.getTemplateById(req.user.orgId, templateId);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json({ template });
});

/**
 * Update email template
 * PATCH /api/v1/crm/email/templates/:templateId
 */
exports.updateTemplate = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const updates = req.body;

  const template = await EmailService.updateTemplate(req.user.orgId, templateId, updates);
  res.json({ template });
});

/**
 * Delete email template
 * DELETE /api/v1/crm/email/templates/:templateId
 */
exports.deleteTemplate = asyncHandler(async (req, res) => {
  const { templateId } = req.params;

  await EmailService.deleteTemplate(req.user.orgId, templateId);
  res.json({ ok: true });
});

/**
 * Unsubscribe from emails
 * POST /api/v1/crm/email/unsubscribe
 */
exports.unsubscribe = asyncHandler(async (req, res) => {
  const { emailAddress, emailId, reason } = req.body;

  if (!emailAddress) {
    throw new ValidationError('emailAddress is required');
  }

  await EmailService.repository.addUnsubscribe(
    req.user.orgId,
    emailAddress,
    null,
    emailId || null,
    reason || null
  );

  res.json({ ok: true, message: 'Successfully unsubscribed' });
});
