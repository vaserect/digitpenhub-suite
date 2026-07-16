const nodemailer = require('nodemailer');
const logger = require('./logger');
const { createCircuitBreaker, createFallback } = require('./circuitBreaker');
const { retryEmailSend } = require('./retry');

// Local Postfix (DKIM-signed via opendkim) — same transport pattern as emailController.js.
function makeTransport() {
  return nodemailer.createTransport({ sendmail: true, path: '/usr/sbin/sendmail', newline: 'unix' });
}

// Core email sending function (wrapped by circuit breaker and retry)
async function sendMailCore({ to, subject, html, fromName = 'DigitPen Hub', attachments }) {
  const transport = makeTransport();
  const fromAddress = process.env.ADMIN_EMAIL || 'noreply@digitpenhub.com';
  
  logger.logExternalService('email', 'send', {
    to,
    subject,
    fromName,
    hasAttachments: !!attachments,
  });
  
  const result = await transport.sendMail({ 
    from: `"${fromName}" <${fromAddress}>`, 
    to, 
    subject, 
    html, 
    attachments 
  });
  
  logger.logExternalService('email', 'send_success', {
    to,
    subject,
    messageId: result.messageId,
  });
  
  return result;
}

// Create circuit breaker for email service
const emailCircuitBreaker = createCircuitBreaker(
  sendMailCore,
  {
    name: 'email_service',
    timeout: 15000, // 15 seconds for email send
    errorThresholdPercentage: 60, // More lenient for email
    resetTimeout: 60000, // 1 minute cooldown
  }
);

// Add fallback for circuit breaker
emailCircuitBreaker.fallback(createFallback('email_service', { ok: false, error: 'Email service unavailable' }));

// Fire-and-forget-safe: resolves to { ok: true } or { ok: false, error } rather than throwing,
// so a mail failure never blocks the calling request (e.g. invite creation still succeeds
// even if the email send fails — the in-app link remains available either way).
async function sendMail({ to, subject, html, fromName = 'DigitPen Hub', attachments }) {
  try {
    // Wrap with retry logic, then circuit breaker
    const result = await retryEmailSend(async () => {
      return await emailCircuitBreaker.fire({ to, subject, html, fromName, attachments });
    });
    
    return { ok: true, messageId: result.messageId };
  } catch (err) {
    logger.error('sendMail failed after retries', {
      to,
      subject,
      error: err.message,
      category: 'email',
    });
    return { ok: false, error: err.message };
  }
}

// Export circuit breaker for health checks
module.exports = { sendMail, emailCircuitBreaker };
