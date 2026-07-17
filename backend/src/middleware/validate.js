const validator = require('validator');

function validateBody(schema) {
  return (req, res, next) => {
    const data = req.body || {};
    const errors = {};

    for (const [field, rules] of Object.entries(schema)) {
      const val = data[field];

      // Required check
      if (rules.required && (val === undefined || val === null || String(val).trim() === '')) {
        errors[field] = `${field} is required.`;
        continue;
      }

      // If optional and not provided, skip other checks
      if (val === undefined || val === null) {
        continue;
      }

      // Type check
      if (rules.type) {
        if (rules.type === 'string' && typeof val !== 'string') {
          errors[field] = `${field} must be a string.`;
          continue;
        }
        if (rules.type === 'number' && typeof val !== 'number') {
          errors[field] = `${field} must be a number.`;
          continue;
        }
        if (rules.type === 'boolean' && typeof val !== 'boolean') {
          errors[field] = `${field} must be a boolean.`;
          continue;
        }
        if (rules.type === 'object' && (typeof val !== 'object' || Array.isArray(val))) {
          errors[field] = `${field} must be an object.`;
          continue;
        }
        if (rules.type === 'array' && !Array.isArray(val)) {
          errors[field] = `${field} must be an array.`;
          continue;
        }
      }

      // minLength / maxLength checks for strings
      if (typeof val === 'string') {
        if (rules.minLength !== undefined && val.length < rules.minLength) {
          errors[field] = `${field} must be at least ${rules.minLength} characters.`;
        }
        if (rules.maxLength !== undefined && val.length > rules.maxLength) {
          errors[field] = `${field} must be at most ${rules.maxLength} characters.`;
        }
      }

      // min / max checks for numbers
      if (typeof val === 'number') {
        if (rules.min !== undefined && val < rules.min) {
          errors[field] = `${field} must be at least ${rules.min}.`;
        }
        if (rules.max !== undefined && val > rules.max) {
          errors[field] = `${field} must be at most ${rules.max}.`;
        }
      }

      // Enum checks
      if (rules.enum && !rules.enum.includes(val)) {
        errors[field] = `${field} must be one of: ${rules.enum.join(', ')}.`;
      }

      // Format checks
      if (rules.format === 'uuid' && !validator.isUUID(String(val))) {
        errors[field] = `${field} must be a valid UUID.`;
      }
      if (rules.format === 'date' && isNaN(Date.parse(val))) {
        errors[field] = `${field} must be a valid date.`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', fields: errors });
    }

    next();
  };
}

module.exports = {
  body: validateBody
};
