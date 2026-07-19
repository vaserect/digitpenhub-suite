'use client';

import { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

const CONDITION_TYPES = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
  { value: 'in_list', label: 'In List' },
  { value: 'not_in_list', label: 'Not In List' }
];

const ACTIONS = [
  { value: 'show', label: 'Show Field', color: 'text-green-600' },
  { value: 'hide', label: 'Hide Field', color: 'text-red-600' },
  { value: 'require', label: 'Make Required', color: 'text-orange-600' },
  { value: 'optional', label: 'Make Optional', color: 'text-blue-600' },
  { value: 'enable', label: 'Enable Field', color: 'text-green-600' },
  { value: 'disable', label: 'Disable Field', color: 'text-gray-600' }
];

export default function FieldDependencyBuilder({ 
  availableFields = [], 
  dependencies = [], 
  onChange 
}) {
  const [localDeps, setLocalDeps] = useState(dependencies);

  const addDependency = () => {
    const newDep = {
      source_field: '',
      condition_type: 'equals',
      condition_value: '',
      action: 'show'
    };
    const updated = [...localDeps, newDep];
    setLocalDeps(updated);
    onChange(updated);
  };

  const removeDependency = (index) => {
    const updated = localDeps.filter((_, i) => i !== index);
    setLocalDeps(updated);
    onChange(updated);
  };

  const updateDependency = (index, field, value) => {
    const updated = localDeps.map((dep, i) => 
      i === index ? { ...dep, [field]: value } : dep
    );
    setLocalDeps(updated);
    onChange(updated);
  };

  const needsValue = (conditionType) => {
    return !['is_empty', 'is_not_empty'].includes(conditionType);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Field Dependencies</h3>
          <p className="text-xs text-gray-500 mt-1">
            Control when this field is visible, required, or enabled based on other field values
          </p>
        </div>
        <button
          type="button"
          onClick={addDependency}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Rule
        </button>
      </div>

      {localDeps.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No dependencies configured</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Rule" to create a dependency</p>
        </div>
      )}

      <div className="space-y-3">
        {localDeps.map((dep, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">Rule {index + 1}</span>
              <button
                type="button"
                onClick={() => removeDependency(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  When Field
                </label>
                <select
                  value={dep.source_field}
                  onChange={(e) => updateDependency(index, 'source_field', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select field...</option>
                  {availableFields.map(field => (
                    <option key={field.key} value={field.key}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  value={dep.condition_type}
                  onChange={(e) => updateDependency(index, 'condition_type', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  {CONDITION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {needsValue(dep.condition_type) && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Value
                    {['in_list', 'not_in_list'].includes(dep.condition_type) && (
                      <span className="text-gray-500 ml-1">(comma-separated)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={dep.condition_value || ''}
                    onChange={(e) => updateDependency(index, 'condition_value', e.target.value)}
                    placeholder={
                      ['in_list', 'not_in_list'].includes(dep.condition_type)
                        ? 'value1, value2, value3'
                        : 'Enter value...'
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Then
                </label>
                <select
                  value={dep.action}
                  onChange={(e) => updateDependency(index, 'action', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  {ACTIONS.map(action => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-600">
                <span className="font-medium">Preview:</span> When{' '}
                <span className="font-semibold text-blue-600">
                  {dep.source_field || '[field]'}
                </span>{' '}
                {CONDITION_TYPES.find(t => t.value === dep.condition_type)?.label.toLowerCase()}{' '}
                {needsValue(dep.condition_type) && (
                  <span className="font-semibold text-blue-600">
                    "{dep.condition_value || '[value]'}"
                  </span>
                )}, then{' '}
                <span className={`font-semibold ${ACTIONS.find(a => a.value === dep.action)?.color}`}>
                  {ACTIONS.find(a => a.value === dep.action)?.label.toLowerCase()}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {localDeps.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> All rules are evaluated in order. Multiple rules can affect the same field.
          </p>
        </div>
      )}
    </div>
  );
}
