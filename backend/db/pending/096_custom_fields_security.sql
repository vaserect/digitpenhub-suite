-- Migration: Add field-level security to custom fields
-- Date: 2026-07-19
-- Purpose: Enable field visibility and edit permissions by role

-- Add security column to custom_field_definitions
ALTER TABLE custom_field_definitions
ADD COLUMN IF NOT EXISTS security JSONB DEFAULT '{
  "visibility": ["owner", "admin", "member"],
  "editable": ["owner", "admin"],
  "sensitive": false,
  "mask_value": false
}'::jsonb;

-- Add index for security queries
CREATE INDEX IF NOT EXISTS idx_custom_field_defs_security 
ON custom_field_definitions USING gin(security);

-- Add comments
COMMENT ON COLUMN custom_field_definitions.security IS 'Field-level security settings: visibility roles, edit permissions, sensitive flag';

-- Example security configurations:
-- Admin only: {"visibility": ["owner", "admin"], "editable": ["owner", "admin"], "sensitive": false}
-- Read-only for members: {"visibility": ["owner", "admin", "member"], "editable": ["owner", "admin"], "sensitive": false}
-- Sensitive field: {"visibility": ["owner"], "editable": ["owner"], "sensitive": true, "mask_value": true}
