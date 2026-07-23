-- Custom Fields Engine: Enhanced field types (Phase 2)
-- Adds support for: currency, percent, url, email, phone, rating, progress, location

-- Update field_type constraint to include new types
ALTER TABLE custom_field_definitions 
DROP CONSTRAINT IF EXISTS custom_field_definitions_field_type_check;

ALTER TABLE custom_field_definitions
ADD CONSTRAINT custom_field_definitions_field_type_check 
CHECK (field_type IN (
  'text', 'number', 'date', 'select', 'multiselect', 'checkbox', 'file', 'relation',
  'currency', 'percent', 'url', 'email', 'phone', 'rating', 'progress', 'location'
));

-- Add currency_code column for currency fields
ALTER TABLE custom_field_definitions
ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD';

-- Add min/max columns for rating and progress fields
ALTER TABLE custom_field_definitions
ADD COLUMN IF NOT EXISTS min_value NUMERIC,
ADD COLUMN IF NOT EXISTS max_value NUMERIC;

-- Add format_pattern column for phone/email validation
ALTER TABLE custom_field_definitions
ADD COLUMN IF NOT EXISTS format_pattern TEXT;

-- Create index for currency fields
CREATE INDEX IF NOT EXISTS idx_custom_field_defs_currency 
ON custom_field_definitions(org_id, field_type) 
WHERE field_type = 'currency';

-- Create index for location fields
CREATE INDEX IF NOT EXISTS idx_custom_field_defs_location 
ON custom_field_definitions(org_id, field_type) 
WHERE field_type = 'location';

COMMENT ON COLUMN custom_field_definitions.currency_code IS 'ISO 4217 currency code for currency fields (e.g., USD, EUR, GBP)';
COMMENT ON COLUMN custom_field_definitions.min_value IS 'Minimum value for rating/progress fields';
COMMENT ON COLUMN custom_field_definitions.max_value IS 'Maximum value for rating/progress fields';
COMMENT ON COLUMN custom_field_definitions.format_pattern IS 'Validation pattern for phone/email fields';
