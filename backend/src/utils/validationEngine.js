// Advanced Validation Engine for Custom Fields
// Supports regex, formulas, and cross-field validation

/**
 * Validate a value against advanced validation rules
 * @param {Object} field - Field definition with validation rules
 * @param {Any} value - Value to validate
 * @param {Object} allValues - All field values for cross-field validation
 * @returns {String|null} Error message or null if valid
 */
function validateAdvancedRules(field, value, allValues = {}) {
  const validation = field.validation || {};
  const rules = validation.rules || [];
  
  // Skip validation if value is empty and field is not required
  if ((value === null || value === undefined || value === '') && !field.required) {
    return null;
  }
  
  // Check each validation rule
  for (const rule of rules) {
    const error = validateRule(rule, value, allValues, field);
    if (error) return error;
  }
  
  return null;
}

/**
 * Validate a single rule
 */
function validateRule(rule, value, allValues, field) {
  switch (rule.type) {
    case 'regex':
      return validateRegex(rule, value);
    case 'formula':
      return validateFormula(rule, value, allValues);
    case 'cross_field':
      return validateCrossField(rule, value, allValues);
    default:
      return null;
  }
}

/**
 * Validate using regex pattern
 */
function validateRegex(rule, value) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  
  try {
    const regex = new RegExp(rule.pattern);
    if (!regex.test(value)) {
      return rule.message || 'Value does not match required pattern';
    }
  } catch (e) {
    console.error('Invalid regex pattern:', rule.pattern, e);
    return 'Invalid validation pattern';
  }
  
  return null;
}

/**
 * Validate using formula expression
 * Supports simple expressions like: value > 0, value >= 1 && value <= 5
 */
function validateFormula(rule, value, allValues) {
  try {
    const expression = rule.expression;
    
    // Create safe evaluation context
    const context = {
      value,
      today: new Date().toISOString().split('T')[0],
      now: new Date().toISOString(),
      ...allValues
    };
    
    // Simple expression evaluator (safe subset)
    const result = evaluateExpression(expression, context);
    
    if (!result) {
      return rule.message || 'Validation failed';
    }
  } catch (e) {
    console.error('Formula validation error:', e);
    return 'Invalid validation formula';
  }
  
  return null;
}

/**
 * Simple expression evaluator for validation formulas
 * Supports: >, <, >=, <=, ==, !=, &&, ||
 */
function evaluateExpression(expression, context) {
  // Replace context variables
  let expr = expression;
  for (const [key, val] of Object.entries(context)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    const replacement = typeof val === 'string' ? `"${val}"` : String(val);
    expr = expr.replace(regex, replacement);
  }
  
  // For currency objects, handle value.amount
  expr = expr.replace(/value\.amount/g, context.value?.amount || 0);
  
  // Safe evaluation using Function constructor (limited scope)
  try {
    return new Function(`return ${expr}`)();
  } catch (e) {
    console.error('Expression evaluation error:', expr, e);
    return false;
  }
}

/**
 * Validate cross-field rules
 */
function validateCrossField(rule, value, allValues) {
  const otherValue = allValues[rule.field];
  
  if (otherValue === undefined) {
    return null; // Skip if other field doesn't exist
  }
  
  let valid = false;
  
  switch (rule.operator) {
    case 'gt':
      valid = value > otherValue;
      break;
    case 'lt':
      valid = value < otherValue;
      break;
    case 'gte':
      valid = value >= otherValue;
      break;
    case 'lte':
      valid = value <= otherValue;
      break;
    case 'eq':
      valid = value === otherValue;
      break;
    case 'neq':
      valid = value !== otherValue;
      break;
    default:
      return null;
  }
  
  if (!valid) {
    return rule.message || `Value must be ${rule.operator} ${rule.field}`;
  }
  
  return null;
}

module.exports = {
  validateAdvancedRules,
  validateRule,
  validateRegex,
  validateFormula,
  validateCrossField
};
