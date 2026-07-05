const nodemailer = require('nodemailer');

// Local Postfix (DKIM-signed via opendkim) — same transport pattern as emailController.js.
function makeTransport() {
  return nodemailer.createTransport({ sendmail: true, path: '/usr/sbin/sendmail', newline: 'unix' });
}

// Fire-and-forget-safe: resolves to { ok: true } or { ok: false, error } rather than throwing,
// so a mail failure never blocks the calling request (e.g. invite creation still succeeds
// even if the email send fails — the in-app link remains available either way).
async function sendMail({ to, subject, html, fromName = 'DigitPen Hub', attachments }) {
  try {
    const transport = makeTransport();
    const fromAddress = process.env.ADMIN_EMAIL || 'noreply@digitpenhub.com';
    await transport.sendMail({ from: `"${fromName}" <${fromAddress}>`, to, subject, html, attachments });
    return { ok: true };
  } catch (err) {
    console.error('sendMail failed:', err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { sendMail };
