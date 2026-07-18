// backend/src/routes/crm/email.routes.js
// CRM Email Integration Routes
// Date: 2026-07-18

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const {
  connectAccount,
  getAccounts,
  updateAccount,
  disconnectAccount,
  startSync,
  sendEmail,
  sendBulkEmails,
  scheduleEmail,
  getContactEmails,
  getCompanyEmails,
  getDealEmails,
  trackOpen,
  trackClick,
  getTrackingStats,
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  unsubscribe
} = require('../../controllers/crm/EmailController');

const router = express.Router();

// ============================================================================
// EMAIL ACCOUNTS
// ============================================================================

// Connect email account (Gmail/Outlook/SMTP)
router.post('/accounts', requireAuth, connectAccount);

// Get user's email accounts
router.get('/accounts', requireAuth, getAccounts);

// Update account settings
router.patch('/accounts/:accountId', requireAuth, updateAccount);

// Disconnect email account
router.delete('/accounts/:accountId', requireAuth, disconnectAccount);

// Start email sync
router.post('/accounts/:accountId/sync', requireAuth, startSync);

// ============================================================================
// EMAIL SENDING
// ============================================================================

// Send single email
router.post('/send', requireAuth, sendEmail);

// Send bulk emails
router.post('/send-bulk', requireAuth, sendBulkEmails);

// Schedule email
router.post('/schedule', requireAuth, scheduleEmail);

// ============================================================================
// EMAIL RETRIEVAL
// ============================================================================

// Get emails for contact (used in contact detail view)
router.get('/contacts/:contactId', requireAuth, getContactEmails);

// Get emails for company
router.get('/companies/:companyId', requireAuth, getCompanyEmails);

// Get emails for deal
router.get('/deals/:dealId', requireAuth, getDealEmails);

// ============================================================================
// EMAIL TRACKING
// ============================================================================

// Track email open (public endpoint - no auth required)
router.get('/track/open/:emailId', trackOpen);

// Track email click (public endpoint - no auth required)
router.get('/track/click/:emailId', trackClick);

// Get tracking stats for email
router.get('/:emailId/tracking', requireAuth, getTrackingStats);

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

// Create template
router.post('/templates', requireAuth, createTemplate);

// Get templates
router.get('/templates', requireAuth, getTemplates);

// Get template by ID
router.get('/templates/:templateId', requireAuth, getTemplate);

// Update template
router.patch('/templates/:templateId', requireAuth, updateTemplate);

// Delete template
router.delete('/templates/:templateId', requireAuth, deleteTemplate);

// ============================================================================
// UNSUBSCRIBE
// ============================================================================

// Unsubscribe from emails
router.post('/unsubscribe', requireAuth, unsubscribe);

module.exports = router;
