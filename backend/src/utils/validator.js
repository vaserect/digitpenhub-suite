const validator = require('validator');

const rules = {
  required: (msg) => (v) => (v === undefined || v === null || String(v).trim() === '') ? (msg || 'Required') : null,
  minLength: (min, msg) => (v) => (v && String(v).length < min) ? (msg || `Minimum ${min} characters`) : null,
  maxLength: (max, msg) => (v) => (v && String(v).length > max) ? (msg || `Maximum ${max} characters`) : null,
  email: (msg) => (v) => (v && !validator.isEmail(String(v))) ? (msg || 'Invalid email') : null,
  url: (msg) => (v) => (v && !validator.isURL(String(v))) ? (msg || 'Invalid URL') : null,
  uuid: (msg) => (v) => (v && !validator.isUUID(String(v))) ? (msg || 'Invalid UUID') : null,
  numeric: (msg) => (v) => (v !== undefined && v !== null && !validator.isNumeric(String(v))) ? (msg || 'Must be numeric') : null,
  boolean: (msg) => (v) => (v !== undefined && v !== null && typeof v !== 'boolean') ? (msg || 'Must be boolean') : null,
  oneOf: (values, msg) => (v) => (v !== undefined && v !== null && !values.includes(v)) ? (msg || `Must be one of: ${values.join(', ')}`) : null,
  pattern: (regex, msg) => (v) => (v && !regex.test(String(v))) ? (msg || 'Invalid format') : null,
};

function validate(schema) {
  return (req, res, next) => {
    const source = req.body || {};
    const errors = {};
    for (const [field, fieldRules] of Object.entries(schema)) {
      for (const rule of fieldRules) {
        const err = rule(source[field]);
        if (err) {
          errors[field] = errors[field] || [];
          errors[field].push(err);
        }
      }
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', fields: errors });
    }
    next();
  };
}

module.exports = { rules, validate };
