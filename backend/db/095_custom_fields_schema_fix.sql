-- Migration: Fix Custom Fields Engine Schema Mismatch
-- Date: 2026-07-19
-- Priority: P0 (Critical Blocker)
-- Issue: Database only supports 8 field types but frontend/controller support 16
-- Issue: Missing columns: currency_code, min_value, max_value, format_pattern

-- Step 1: Add missing columns to custom_field_definitions
ALTER TABLE custom_field_definitions 
  ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS min_value NUMERIC,
  ADD COLUMN IF NOT EXISTS max_value NUMERIC,
  ADD COLUMN IF NOT EXISTS format_pattern TEXT;

-- Step 2: Drop the old CHECK constraint
ALTER TABLE custom_field_definitions 
  DROP CONSTRAINT IF EXISTS custom_field_definitions_field_type_check;

-- Step 3: Add new CHECK constraint with all 16 field types
ALTER TABLE custom_field_definitions 
  ADD CONSTRAINT custom_field_definitions_field_type_check 
  CHECK (field_type IN (
    'text', 'number', 'date', 'select', 'multiselect',
    'checkbox', 'file', 'relation', 'currency', 'percent',
    'url', 'email', 'phone', 'rating', 'progress', 'location'
  ));

-- Step 4: Add index for better query performance on new columns
CREATE INDEX IF NOT EXISTS idx_custom_field_defs_field_type 
  ON custom_field_definitions(field_type);

-- Step 5: Add comments for documentation
COMMENT ON COLUMN custom_field_definitions.currency_code IS 'Currency code for currency field type (e.g., USD, EUR, GBP)';
COMMENT ON COLUMN custom_field_definitions.min_value IS 'Minimum value for rating/progress field types';
COMMENT ON COLUMN custom_field_definitions.max_value IS 'Maximum value for rating/progress field types';
COMMENT ON COLUMN custom_field_definitions.format_pattern IS 'Regex pattern for phone/text field validation';

-- Verification query (run after migration)
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'custom_field_definitions' 
-- AND column_name IN ('currency_code', 'min_value', 'max_value', 'format_pattern');
