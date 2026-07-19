'use client';

import { useState } from 'react';
import Button from '../ui/Button';
import { X, Plus, AlertCircle } from 'lucide-react';

const RULE_TYPES = {
  text: [
    { value: 'min_length', label: 'Minimum Length', config: { min: 1 } },
    { value: 'max_length', label: 'Maximum Length', config: { max: 100 } },
    { value: 'regex', label: 'Regular Expression', config: { pattern: '', message: '' } },
    { value: 'email_format', label: 'Email Format', config: {} },
    { value: 'url_format', label: 'URL Format', config: {} },
    { value: 'no_special_chars', label: 'No Special Characters', config: {} },
  ],
  number: [
    { value: 'min_value', label: 'Minimum Value', config: { min: 0 } },
    { value: 'max_value', label: 'Maximum Value', config: { max: 100 } },
    { value: 'integer_only', label: 'Integer Only', config: {} },
    { value: 'positive_only', label: 'Positive Only', config: {} },
    { value: 'range', label: 'Value Range', config: { min: 0, max: 100 } },
  ],
  date: [
    { value: 'min_date', label: 'Minimum Date', config: { min: '' } },
    { value: 'max_date', label: 'Maximum Date', config: { max: '' } },
    { value: 'future_only', label: 'Future Dates Only', config: {} },
    { value: 'past_only', label: 'Past Dates Only', config: {} },
    { value: 'business_days_only', label: 'Business Days Only', config: {} },
  ],
  email: [
    { value: 'email_format', label: 'Valid Email Format', config: {} },
    { value: 'domain_whitelist', label: 'Allowed Domains', config: { domains: [] } },
    { value: 'domain_blacklist', label: 'Blocked Domains', config: { domains: [] } },
  ],
  phone: [
    { value: 'phone_format', label: 'Valid Phone Format', config: {} },
    { value: 'country_code', label: 'Require Country Code', config: {} },
    { value: 'min_digits', label: 'Minimum Digits', config: { min: 10 } },
  ],
  url: [
    { value: 'url_format', label: 'Valid URL Format', config: {} },
    { value: 'https_only', label: 'HTTPS Only', config: {} },
    { value: 'domain_whitelist', label: 'Allowed Domains', config: { domains: [] } },
  ],
  select: [
    { value: 'required_option', label: 'Specific Option Required', config: { option: '' } },
  ],
  multiselect: [
    { value: 'min_selections', label: 'Minimum Selections', config: { min: 1 } },
    { value: 'max_selections', label: 'Maximum Selections', config: { max: 5 } },
  ],
};

export default function ValidationRuleBuilder({ 
  fieldType, 
  rules = [], 
  onRulesChange,
  fieldId,
  orgId 
}) {
  const [showAddRule, setShowAddRule] = useState(false);
  const [selectedRuleType, setSelectedRuleType] = useState('');
  const [ruleConfig, setRuleConfig] = useState({});
  const [customMessage, setCustomMessage] = useState('');

  const availableRules = RULE_TYPES[fieldType] || RULE_TYPES.text;

  const handleAddRule = () => {
    if (!selectedRuleType) return;

    const ruleTemplate = availableRules.find(r => r.value === selectedRuleType);
    const newRule = {
      id: `rule_${Date.now()}`,
      rule_type: selectedRuleType,
      rule_config: { ...ruleTemplate.config, ...ruleConfig },
      custom_message: customMessage || undefined,
      created_at: new Date().toISOString(),
    };

    onRulesChange([...rules, newRule]);
    
    // Reset form
    setSelectedRuleType('');
    setRuleConfig({});
    setCustomMessage('');
    setShowAddRule(false);
  };

  const handleRemoveRule = (ruleId) => {
    onRulesChange(rules.filter(r => r.id !== ruleId));
  };

  const getRuleLabel = (rule) => {
    const template = availableRules.find(r => r.value === rule.rule_type);
    return template?.label || rule.rule_type;
  };

  const getRuleDescription = (rule) => {
    const config = rule.rule_config || {};
    switch (rule.rule_type) {
      case 'min_length':
        return `At least ${config.min} characters`;
      case 'max_length':
        return `Maximum ${config.max} characters`;
      case 'min_value':
        return `Minimum value: ${config.min}`;
      case 'max_value':
        return `Maximum value: ${config.max}`;
      case 'range':
        return `Between ${config.min} and ${config.max}`;
      case 'regex':
        return `Pattern: ${config.pattern}`;
      case 'domain_whitelist':
        return `Allowed: ${config.domains?.join(', ') || 'none'}`;
      case 'domain_blacklist':
        return `Blocked: ${config.domains?.join(', ') || 'none'}`;
      default:
        return '';
    }
  };

  const renderConfigInputs = () => {
    if (!selectedRuleType) return null;

    const ruleTemplate = availableRules.find(r => r.value === selectedRuleType);
    if (!ruleTemplate) return null;

    const config = ruleTemplate.config;

    return (
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.keys(config).map(key => {
          if (key === 'domains') {
            return (
              <div key={key} className="field">
                <label className="field-label">Domains (comma-separated)</label>
                <input
                  className="field-input"
                  value={ruleConfig[key]?.join(', ') || ''}
                  onChange={(e) => setRuleConfig({
                    ...ruleConfig,
                    [key]: e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                  })}
                  placeholder="example.com, test.com"
                />
              </div>
            );
          }

          return (
            <div key={key} className="field">
              <label className="field-label" style={{ textTransform: 'capitalize' }}>
                {key.replace(/_/g, ' ')}
              </label>
              <input
                className="field-input"
                type={typeof config[key] === 'number' ? 'number' : 'text'}
                value={ruleConfig[key] ?? config[key]}
                onChange={(e) => setRuleConfig({
                  ...ruleConfig,
                  [key]: typeof config[key] === 'number' ? Number(e.target.value) : e.target.value
                })}
              />
            </div>
          );
        })}

        <div className="field">
          <label className="field-label">Custom Error Message (optional)</label>
          <input
            className="field-input"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="This field must meet the validation requirements"
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={16} />
          Validation Rules
        </h4>
        {!showAddRule && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowAddRule(true)}
          >
            <Plus size={14} /> Add Rule
          </Button>
        )}
      </div>

      {/* Existing Rules */}
      {rules.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {rules.map(rule => (
            <div
              key={rule.id}
              style={{
                padding: 12,
                border: '1px solid var(--border)',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                  {getRuleLabel(rule)}
                </div>
                {getRuleDescription(rule) && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {getRuleDescription(rule)}
                  </div>
                )}
                {rule.custom_message && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                    "{rule.custom_message}"
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveRule(rule.id)}
                style={{
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 4,
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Rule Form */}
      {showAddRule && (
        <div style={{ 
          padding: 16, 
          border: '1px solid var(--border)', 
          borderRadius: 6,
          backgroundColor: 'var(--bg-secondary)',
        }}>
          <div className="field">
            <label className="field-label">Rule Type</label>
            <select
              className="field-input"
              value={selectedRuleType}
              onChange={(e) => {
                setSelectedRuleType(e.target.value);
                setRuleConfig({});
              }}
            >
              <option value="">Select a rule type...</option>
              {availableRules.map(rule => (
                <option key={rule.value} value={rule.value}>
                  {rule.label}
                </option>
              ))}
            </select>
          </div>

          {renderConfigInputs()}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddRule(false);
                setSelectedRuleType('');
                setRuleConfig({});
                setCustomMessage('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddRule}
              disabled={!selectedRuleType}
            >
              Add Rule
            </Button>
          </div>
        </div>
      )}

      {rules.length === 0 && !showAddRule && (
        <div style={{ 
          padding: 16, 
          textAlign: 'center', 
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          border: '1px dashed var(--border)',
          borderRadius: 6,
        }}>
          No validation rules configured. Click "Add Rule" to get started.
        </div>
      )}
    </div>
  );
}
