-- Custom Fields Engine: Validation Rules (Phase 5)
-- Pre-built validation rule templates and enhanced validation support

-- Add validation_rules column if not exists (for storing structured validation rules)
ALTER TABLE custom_field_definitions
ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '[]';

-- Create validation rule templates table
CREATE TABLE IF NOT EXISTS custom_field_validation_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  field_type        TEXT NOT NULL,
  rule_type         TEXT NOT NULL, -- 'regex', 'range', 'length', 'format', 'custom'
  rule_config       JSONB NOT NULL DEFAULT '{}',
  is_system         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_templates_field_type 
ON custom_field_validation_templates(field_type);

-- Seed common validation rule templates
INSERT INTO custom_field_validation_templates (name, description, field_type, rule_type, rule_config, is_system) VALUES
-- Text field validations
('Email Format', 'Validates email address format', 'text', 'regex', '{"pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", "message": "Must be a valid email address"}', true),
('Phone Format (US)', 'Validates US phone number format', 'text', 'regex', '{"pattern": "^\\+?1?\\d{10}$", "message": "Must be a valid US phone number"}', true),
('URL Format', 'Validates URL format', 'text', 'regex', '{"pattern": "^https?://[^\\s]+$", "message": "Must be a valid URL starting with http:// or https://"}', true),
('Alphanumeric Only', 'Only letters and numbers allowed', 'text', 'regex', '{"pattern": "^[a-zA-Z0-9]+$", "message": "Only letters and numbers are allowed"}', true),
('No Special Characters', 'Letters, numbers, spaces, hyphens, underscores only', 'text', 'regex', '{"pattern": "^[a-zA-Z0-9\\s\\-_]+$", "message": "Special characters not allowed"}', true),
('Min Length 3', 'Minimum 3 characters', 'text', 'length', '{"min": 3, "message": "Must be at least 3 characters"}', true),
('Max Length 100', 'Maximum 100 characters', 'text', 'length', '{"max": 100, "message": "Must be no more than 100 characters"}', true),

-- Number field validations
('Positive Numbers Only', 'Must be greater than 0', 'number', 'range', '{"min": 0.01, "message": "Must be a positive number"}', true),
('Percentage (0-100)', 'Must be between 0 and 100', 'number', 'range', '{"min": 0, "max": 100, "message": "Must be between 0 and 100"}', true),
('Age Range (18-120)', 'Valid age range', 'number', 'range', '{"min": 18, "max": 120, "message": "Must be between 18 and 120"}', true),

-- Currency field validations
('Max Budget 1M', 'Maximum budget of $1,000,000', 'currency', 'range', '{"max": 1000000, "message": "Cannot exceed $1,000,000"}', true),
('Min Purchase $10', 'Minimum purchase amount', 'currency', 'range', '{"min": 10, "message": "Minimum purchase is $10"}', true),

-- Date field validations
('Future Date Only', 'Date must be in the future', 'date', 'custom', '{"type": "future", "message": "Date must be in the future"}', true),
('Past Date Only', 'Date must be in the past', 'date', 'custom', '{"type": "past", "message": "Date must be in the past"}', true),
('Within 30 Days', 'Date must be within next 30 days', 'date', 'custom', '{"type": "within_days", "days": 30, "message": "Date must be within the next 30 days"}', true),

-- Email field validations
('Corporate Email Only', 'Must be a corporate email (no free providers)', 'email', 'regex', '{"pattern": "^(?!.*@(gmail|yahoo|hotmail|outlook)\\.com).*@.*\\..*$", "message": "Must use a corporate email address"}', true),

-- Phone field validations
('International Format', 'Must include country code', 'phone', 'regex', '{"pattern": "^\\+[1-9]\\d{1,14}$", "message": "Must include country code (e.g., +1234567890)"}', true)

ON CONFLICT DO NOTHING;

COMMENT ON TABLE custom_field_validation_templates IS 'Pre-built validation rule templates for common use cases';
COMMENT ON COLUMN custom_field_definitions.validation_rules IS 'Structured validation rules array (replaces simple validation JSONB)';
