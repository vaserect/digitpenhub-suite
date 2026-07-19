-- Migration: Enhanced validation rules for custom fields
-- Date: 2026-07-19
-- Purpose: Add advanced validation capabilities including cross-field validation, regex patterns, and custom error messages

-- Add validation_rules table for reusable validation templates
CREATE TABLE IF NOT EXISTS custom_field_validation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  field_type TEXT NOT NULL,
  validation_config JSONB NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for template lookups
CREATE INDEX IF NOT EXISTS idx_validation_templates_field_type 
ON custom_field_validation_templates(field_type);

-- Insert common validation templates
INSERT INTO custom_field_validation_templates (name, description, field_type, validation_config, is_system) VALUES
('Email Format', 'Standard email validation', 'email', '{"type":"regex","pattern":"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$","message":"Please enter a valid email address"}', true),
('US Phone', 'US phone number format', 'phone', '{"type":"regex","pattern":"^\\+?1?[-.]?\\(?([0-9]{3})\\)?[-.]?([0-9]{3})[-.]?([0-9]{4})$","message":"Please enter a valid US phone number"}', true),
('URL Format', 'Valid URL with http/https', 'url', '{"type":"regex","pattern":"^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$","message":"Please enter a valid URL starting with http:// or https://"}', true),
('Positive Number', 'Must be greater than zero', 'number', '{"type":"formula","expression":"value > 0","message":"Value must be greater than zero"}', true),
('Future Date', 'Date must be in the future', 'date', '{"type":"formula","expression":"value > today","message":"Date must be in the future"}', true),
('Strong Password', 'At least 8 chars, 1 uppercase, 1 lowercase, 1 number', 'text', '{"type":"regex","pattern":"^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$","message":"Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number"}', true),
('Alphanumeric Only', 'Only letters and numbers allowed', 'text', '{"type":"regex","pattern":"^[a-zA-Z0-9]+$","message":"Only letters and numbers are allowed"}', true),
('Percentage Range', 'Value between 0 and 100', 'percent', '{"type":"formula","expression":"value >= 0 && value <= 100","message":"Percentage must be between 0 and 100"}', true),
('Currency Positive', 'Amount must be positive', 'currency', '{"type":"formula","expression":"value.amount > 0","message":"Amount must be greater than zero"}', true),
('Rating Range', 'Rating between 1 and 5', 'rating', '{"type":"formula","expression":"value >= 1 && value <= 5","message":"Rating must be between 1 and 5"}', true)
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE custom_field_validation_templates IS 'Reusable validation rule templates for custom fields';
COMMENT ON COLUMN custom_field_validation_templates.validation_config IS 'Validation configuration: {type: "regex|formula|cross_field", pattern/expression, message}';

-- Enhance validation column in custom_field_definitions to support advanced rules
-- The existing validation JSONB column will now support:
-- {
--   "rules": [
--     {"type": "regex", "pattern": "...", "message": "..."},
--     {"type": "formula", "expression": "...", "message": "..."},
--     {"type": "cross_field", "field": "other_field", "operator": "gt|lt|eq", "message": "..."}
--   ],
--   "minLength": 3,
--   "maxLength": 100,
--   "min": 0,
--   "max": 100
-- }

COMMENT ON COLUMN custom_field_definitions.validation IS 'Enhanced validation rules supporting regex, formulas, and cross-field validation';
