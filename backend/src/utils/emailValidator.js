const validator = require('validator');
const dns = require('dns').promises;

// List of disposable email domains (expand as needed)
const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'throwaway.email',
  'mailinator.com',
  'trashmail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'yopmail.com',
  'maildrop.cc',
];

/**
 * Validates an email address with multiple checks:
 * - Format validation
 * - Disposable email detection
 * - DNS MX record verification (optional)
 * 
 * @param {string} email - The email address to validate
 * @param {object} options - Validation options
 * @param {boolean} options.checkDNS - Whether to verify DNS MX records (default: true)
 * @returns {Promise<{valid: boolean, reason?: string}>}
 */
async function validateEmail(email, options = { checkDNS: true }) {
  // Format validation
  if (!validator.isEmail(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }
  
  // Check for disposable email domains
  const domain = email.split('@')[1].toLowerCase();
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return { valid: false, reason: 'Disposable email addresses not allowed' };
  }
  
  // Check if domain has MX records (optional but recommended)
  if (options.checkDNS) {
    try {
      const mxRecords = await dns.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return { valid: false, reason: 'Email domain has no mail servers' };
      }
    } catch (err) {
      // DNS lookup failed - domain doesn't exist or network issue
      return { valid: false, reason: 'Email domain does not exist' };
    }
  }
  
  return { valid: true };
}

/**
 * Normalizes an email address (lowercase, trim)
 * @param {string} email - The email to normalize
 * @returns {string}
 */
function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

module.exports = { validateEmail, normalizeEmail, DISPOSABLE_DOMAINS };
