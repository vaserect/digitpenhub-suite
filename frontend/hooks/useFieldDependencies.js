'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * Evaluates a single dependency condition
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
 * React hook for managing field dependencies
 * @param {Array} fieldDefinitions - Array of field definitions with dependencies
 * @param {Object} formValues - Current form values
 * @returns {Object} - Map of fieldKey to { visible, required, enabled }
 */
export function useFieldDependencies(fieldDefinitions, formValues) {
  const [evaluationResults, setEvaluationResults] = useState({});

  // Memoize field definitions to prevent unnecessary re-evaluations
  const fieldDefMap = useMemo(() => {
    const map = {};
    fieldDefinitions.forEach(field => {
      map[field.key] = field;
    });
    return map;
  }, [fieldDefinitions]);

  // Re-evaluate dependencies whenever form values change
  useEffect(() => {
    const results = {};
    
    fieldDefinitions.forEach(fieldDef => {
      results[fieldDef.key] = evaluateFieldDependencies(fieldDef, formValues);
    });

    setEvaluationResults(results);
  }, [fieldDefinitions, formValues]);

  // Helper function to check if a field should be visible
  const isFieldVisible = (fieldKey) => {
    return evaluationResults[fieldKey]?.visible ?? true;
  };

  // Helper function to check if a field is required
  const isFieldRequired = (fieldKey) => {
    return evaluationResults[fieldKey]?.required ?? fieldDefMap[fieldKey]?.required ?? false;
  };

  // Helper function to check if a field is enabled
  const isFieldEnabled = (fieldKey) => {
    return evaluationResults[fieldKey]?.enabled ?? true;
  };

  // Get visible fields only
  const visibleFields = useMemo(() => {
    return fieldDefinitions.filter(field => isFieldVisible(field.key));
  }, [fieldDefinitions, evaluationResults]);

  return {
    evaluationResults,
    isFieldVisible,
    isFieldRequired,
    isFieldEnabled,
    visibleFields
  };
}

export default useFieldDependencies;
