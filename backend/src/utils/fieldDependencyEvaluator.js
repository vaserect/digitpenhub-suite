/**
 * Field Dependency Evaluator
 * Evaluates field dependencies and determines field visibility/requirements
 * 
 * Supports both simple and advanced (complex logic) dependencies:
 * - Simple: Single condition per dependency (backward compatible)
 * - Advanced: Multiple conditions with AND/OR/NOT logic operators
 */

/**
 * Evaluates a single dependency condition
 * @param {*} sourceValue - The value of the source field
 * @param {Object} condition - The condition configuration
 * @returns {boolean} - Whether the condition is met
 */
function evaluateCondition(sourceValue, condition) {
  const { condition_type, condition_value } = condition;

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

    // Advanced condition types
    case 'greater_than_or_equal':
      return Number(sourceValue) >= Number(condition_value);

    case 'less_than_or_equal':
      return Number(sourceValue) <= Number(condition_value);

    case 'starts_with':
      return String(sourceValue).toLowerCase().startsWith(String(condition_value).toLowerCase());

    case 'ends_with':
      return String(sourceValue).toLowerCase().endsWith(String(condition_value).toLowerCase());

    case 'matches_regex':
      try {
        const regex = new RegExp(condition_value);
        return regex.test(String(sourceValue));
      } catch (e) {
        console.warn(`Invalid regex pattern: ${condition_value}`, e);
        return false;
      }

    default:
      console.warn(`Unknown condition type: ${condition_type}`);
      return false;
  }
}

/**
 * Evaluates complex conditions with logic operators (AND/OR/NOT)
 * @param {Array} conditions - Array of condition objects
 * @param {string} logicOperator - 'AND', 'OR', or 'NOT'
 * @param {Object} allValues - All current field values
 * @returns {boolean} - Whether the complex condition is met
 */
function evaluateComplexConditions(conditions, logicOperator, allValues) {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return true;
  }

  const results = conditions.map(condition => {
    const sourceValue = allValues[condition.source_field];
    return evaluateCondition(sourceValue, condition);
  });

  switch (logicOperator) {
    case 'AND':
      return results.every(result => result === true);

    case 'OR':
      return results.some(result => result === true);

    case 'NOT':
      // NOT operator negates the first condition
      return !results[0];

    default:
      // Default to AND if no operator specified
      return results.every(result => result === true);
  }
}

/**
 * Determines if a dependency uses advanced (complex) logic
 * @param {Object} dependency - The dependency configuration
 * @returns {boolean} - True if using advanced logic
 */
function isAdvancedDependency(dependency) {
  return (
    dependency.logic_operator !== undefined ||
    (Array.isArray(dependency.conditions) && dependency.conditions.length > 0)
  );
}

/**
 * Evaluates all dependencies for a field (supports both simple and advanced)
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
    let conditionMet;

    // Check if this is an advanced dependency with multiple conditions
    if (isAdvancedDependency(dep)) {
      // Advanced dependency: multiple conditions with logic operator
      const logicOperator = dep.logic_operator || 'AND';
      conditionMet = evaluateComplexConditions(dep.conditions, logicOperator, allValues);
    } else {
      // Simple dependency: single condition (backward compatible)
      const sourceValue = allValues[dep.source_field];
      conditionMet = evaluateCondition(sourceValue, dep);
    }

    // Apply action based on whether condition was met
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

/**
 * Validates dependency configuration
 * @param {Object} dependency - The dependency to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateDependency(dependency) {
  const validConditionTypes = [
    'equals', 'not_equals', 'contains', 'not_contains',
    'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal',
    'is_empty', 'is_not_empty', 'in_list', 'not_in_list',
    'starts_with', 'ends_with', 'matches_regex'
  ];
  const validActions = ['show', 'hide', 'require', 'optional', 'enable', 'disable'];
  const validLogicOperators = ['AND', 'OR', 'NOT'];

  // Check if advanced dependency
  if (isAdvancedDependency(dependency)) {
    // Validate logic operator
    if (dependency.logic_operator && !validLogicOperators.includes(dependency.logic_operator)) {
      return {
        valid: false,
        error: `Invalid logic_operator. Must be one of: ${validLogicOperators.join(', ')}`
      };
    }

    // Validate conditions array
    if (!Array.isArray(dependency.conditions) || dependency.conditions.length === 0) {
      return {
        valid: false,
        error: 'Advanced dependencies must have a non-empty conditions array'
      };
    }

    // Validate each condition
    for (const condition of dependency.conditions) {
      if (!condition.source_field || typeof condition.source_field !== 'string') {
        return {
          valid: false,
          error: 'Each condition must have a source_field (string)'
        };
      }

      if (!validConditionTypes.includes(condition.condition_type)) {
        return {
          valid: false,
          error: `Invalid condition_type. Must be one of: ${validConditionTypes.join(', ')}`
        };
      }
    }

    // Validate action
    if (!validActions.includes(dependency.action)) {
      return {
        valid: false,
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`
      };
    }
  } else {
    // Simple dependency validation (backward compatible)
    if (!dependency.source_field || typeof dependency.source_field !== 'string') {
      return {
        valid: false,
        error: 'Dependency must have a source_field (string)'
      };
    }

    if (!validConditionTypes.includes(dependency.condition_type)) {
      return {
        valid: false,
        error: `Invalid condition_type. Must be one of: ${validConditionTypes.join(', ')}`
      };
    }

    if (!validActions.includes(dependency.action)) {
      return {
        valid: false,
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`
      };
    }
  }

  return { valid: true };
}

module.exports = {
  evaluateCondition,
  evaluateComplexConditions,
  evaluateFieldDependencies,
  evaluateAllDependencies,
  filterFieldsByDependencies,
  validateDependency,
  isAdvancedDependency,
};
