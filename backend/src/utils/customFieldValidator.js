/**
 * Custom Field Validation Utility
 * Validates field values against configured validation rules
 */

class ValidationError extends Error {
  constructor(message, field, rule) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.rule = rule;
  }
}

/**
 * Validates a field value against its validation rules
 * @param {*} value - The value to validate
 * @param {Object} fieldDef - The field definition with validation_rules
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateFieldValue(value, fieldDef) {
  const errors = [];
  const rules = fieldDef.validation_rules || [];

  // Skip validation if no rules or value is null/undefined and field not required
  if (rules.length === 0) return { valid: true, errors: [] };
  if ((value === null || value === undefined || value === '') && !fieldDef.required) {
    return { valid: true, errors: [] };
  }

  for (const rule of rules) {
    const result = validateRule(value, rule, fieldDef.field_type);
    if (!result.valid) {
      errors.push(rule.custom_message || result.message);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a single rule
 */
function validateRule(value, rule, fieldType) {
  const { rule_type, rule_config } = rule;

  switch (rule_type) {
    // Text validations
    case 'min_length':
      if (String(value).length < rule_config.min) {
        return { valid: false, message: `Must be at least ${rule_config.min} characters` };
      }
      break;

    case 'max_length':
      if (String(value).length > rule_config.max) {
        return { valid: false, message: `Must be at most ${rule_config.max} characters` };
      }
      break;

    case 'regex':
      const regex = new RegExp(rule_config.pattern);
      if (!regex.test(String(value))) {
        return { valid: false, message: rule_config.message || 'Invalid format' };
      }
      break;

    case 'email_format':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return { valid: false, message: 'Invalid email format' };
      }
      break;

    case 'url_format':
      try {
        new URL(String(value));
      } catch {
        return { valid: false, message: 'Invalid URL format' };
      }
      break;

    case 'no_special_chars':
      if (!/^[a-zA-Z0-9\s]*$/.test(String(value))) {
        return { valid: false, message: 'Special characters not allowed' };
      }
      break;

    // Number validations
    case 'min_value':
      if (Number(value) < rule_config.min) {
        return { valid: false, message: `Must be at least ${rule_config.min}` };
      }
      break;

    case 'max_value':
      if (Number(value) > rule_config.max) {
        return { valid: false, message: `Must be at most ${rule_config.max}` };
      }
      break;

    case 'integer_only':
      if (!Number.isInteger(Number(value))) {
        return { valid: false, message: 'Must be an integer' };
      }
      break;

    case 'positive_only':
      if (Number(value) <= 0) {
        return { valid: false, message: 'Must be positive' };
      }
      break;

    case 'range':
      const num = Number(value);
      if (num < rule_config.min || num > rule_config.max) {
        return { valid: false, message: `Must be between ${rule_config.min} and ${rule_config.max}` };
      }
      break;

    // Date validations
    case 'min_date':
      if (new Date(value) < new Date(rule_config.min)) {
        return { valid: false, message: `Date must be after ${rule_config.min}` };
      }
      break;

    case 'max_date':
      if (new Date(value) > new Date(rule_config.max)) {
        return { valid: false, message: `Date must be before ${rule_config.max}` };
      }
      break;

    case 'future_only':
      if (new Date(value) <= new Date()) {
        return { valid: false, message: 'Date must be in the future' };
      }
      break;

    case 'past_only':
      if (new Date(value) >= new Date()) {
        return { valid: false, message: 'Date must be in the past' };
      }
      break;

    case 'business_days_only':
      const day = new Date(value).getDay();
      if (day === 0 || day === 6) {
        return { valid: false, message: 'Must be a business day (Mon-Fri)' };
      }
      break;

    // Email/URL specific
    case 'domain_whitelist':
      const domain = String(value).split('@')[1] || new URL(String(value)).hostname;
      if (!rule_config.domains.includes(domain)) {
        return { valid: false, message: `Domain must be one of: ${rule_config.domains.join(', ')}` };
      }
      break;

    case 'domain_blacklist':
      const blockedDomain = String(value).split('@')[1] || new URL(String(value)).hostname;
      if (rule_config.domains.includes(blockedDomain)) {
        return { valid: false, message: 'This domain is not allowed' };
      }
      break;

    case 'https_only':
      if (!String(value).startsWith('https://')) {
        return { valid: false, message: 'URL must use HTTPS' };
      }
      break;

    // Phone validations
    case 'phone_format':
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(String(value))) {
        return { valid: false, message: 'Invalid phone format' };
      }
      break;

    case 'country_code':
      if (!String(value).startsWith('+')) {
        return { valid: false, message: 'Phone must include country code (e.g., +1)' };
      }
      break;

    case 'min_digits':
      const digits = String(value).replace(/\D/g, '');
      if (digits.length < rule_config.min) {
        return { valid: false, message: `Phone must have at least ${rule_config.min} digits` };
      }
      break;

    // Select validations
    case 'required_option':
      if (value !== rule_config.option) {
        return { valid: false, message: `Must select: ${rule_config.option}` };
      }
      break;

    // Multi-select validations
    case 'min_selections':
      if (!Array.isArray(value) || value.length < rule_config.min) {
        return { valid: false, message: `Must select at least ${rule_config.min} options` };
      }
      break;

    case 'max_selections':
      if (!Array.isArray(value) || value.length > rule_config.max) {
        return { valid: false, message: `Must select at most ${rule_config.max} options` };
      }
      break;

    default:
      console.warn(`Unknown validation rule type: ${rule_type}`);
  }

  return { valid: true };
}

/**
 * Validates multiple field values at once
 * @param {Object} values - Object with fieldKey: value pairs
 * @param {Array} fieldDefinitions - Array of field definitions
 * @returns {Object} { valid: boolean, errors: Object }
 */
function validateFieldValues(values, fieldDefinitions) {
  const errors = {};
  let valid = true;

  for (const [fieldKey, value] of Object.entries(values)) {
    const fieldDef = fieldDefinitions.find(f => f.key === fieldKey);
    if (!fieldDef) continue;

    const result = validateFieldValue(value, fieldDef);
    if (!result.valid) {
      errors[fieldKey] = result.errors;
      valid = false;
    }
  }

  return { valid, errors };
}

module.exports = {
  validateFieldValue,
  validateFieldValues,
  ValidationError
};
