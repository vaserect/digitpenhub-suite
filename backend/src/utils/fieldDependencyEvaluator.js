/**
 * Field Dependency Evaluator
 * Evaluates field dependencies and determines field visibility/requirements
 */

/**
 * Evaluates a single dependency condition
 * @param {*} sourceValue - The value of the source field
 * @param {Object} dependency - The dependency configuration
 * @returns {boolean} - Whether the condition is met
 */
function evaluateCondition(sourceValue, dependency) {
  const { condition_type, condition_value } = dependency;

  switch (condition_type) {
    case 'equals':
      return String(sourceValue) === String(condition_value);

    case 'not_equals':
      return String(sourceValue) !== String(condition_value);

    case 'contains':
      return String(sourceValue).toLowerCase().includes(String(condition_value).toLowerCase());

    case 'not_contains':
      return !String(sourceValue).toLowerCase().includes(String(condition_value).toLowerCase());

    case 'greater_than':
      return Number(sourceValue) > Number(condition_value);

    case 'less_than':
      return Number(sourceValue) < Number(condition_value);

    case 'is_empty':
      return sourceValue === null || sourceValue === undefined || sourceValue === '';

    case 'is_not_empty':
      return sourceValue !== null && sourceValue !== undefined && sourceValue !== '';

    case 'in_list':
      const listValues = String(condition_value).split(',').map(v => v.trim());
      return listValues.includes(String(sourceValue));

    case 'not_in_list':
      const excludeValues = String(condition_value).split(',').map(v => v.trim());
      return !excludeValues.includes(String(sourceValue));

    default:
      console.warn(`Unknown condition type: ${condition_type}`);
      return false;
  }
}

/**
 * Evaluates all dependencies for a field
 * @param {Object} fieldDef - The field definition with dependencies
 * @param {Object} allValues - All current field values
 * @returns {Object} - { visible, required, enabled }
 */
function evaluateFieldDependencies(fieldDef, allValues) {
  const dependencies = fieldDef.dependencies || [];
  
  if (dependencies.length === 0) {
    return {
      visible: true,
      required: fieldDef.required || false,
      enabled: true,
    };
  }

  let visible = true;
  let required = fieldDef.required || false;
  let enabled = true;

  for (const dep of dependencies) {
    const sourceValue = allValues[dep.source_field];
    const conditionMet = evaluateCondition(sourceValue, dep);

    if (conditionMet) {
      switch (dep.action) {
        case 'show':
          visible = true;
          break;
        case 'hide':
          visible = false;
          break;
        case 'require':
          required = true;
          break;
        case 'optional':
          required = false;
          break;
        case 'enable':
          enabled = true;
          break;
        case 'disable':
          enabled = false;
          break;
      }
    } else {
      // Inverse actions when condition not met
      switch (dep.action) {
        case 'show':
          visible = false;
          break;
        case 'hide':
          visible = true;
          break;
      }
    }
  }

  return { visible, required, enabled };
}

/**
 * Evaluates dependencies for all fields
 * @param {Array} fieldDefinitions - Array of field definitions
 * @param {Object} values - Current field values
 * @returns {Object} - Map of fieldKey to { visible, required, enabled }
 */
function evaluateAllDependencies(fieldDefinitions, values) {
  const result = {};

  for (const fieldDef of fieldDefinitions) {
    result[fieldDef.key] = evaluateFieldDependencies(fieldDef, values);
  }

  return result;
}

/**
 * Filters field definitions based on dependency evaluation
 * @param {Array} fieldDefinitions - Array of field definitions
 * @param {Object} values - Current field values
 * @returns {Array} - Filtered field definitions with dependency state
 */
function filterFieldsByDependencies(fieldDefinitions, values) {
  const dependencyStates = evaluateAllDependencies(fieldDefinitions, values);

  return fieldDefinitions
    .map(field => ({
      ...field,
      _dependencyState: dependencyStates[field.key],
    }))
    .filter(field => field._dependencyState.visible);
}

module.exports = {
  evaluateCondition,
  evaluateFieldDependencies,
  evaluateAllDependencies,
  filterFieldsByDependencies,
};
