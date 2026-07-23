-- Migration: Add Field Dependencies Support
-- Date: 2026-07-19
-- Purpose: Enable conditional field visibility and requirements based on other field values
-- Feature: Custom Fields Engine P1 - Field Dependencies

-- Add dependencies column to custom_field_definitions
ALTER TABLE custom_field_definitions
ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb;

-- Add index for dependency queries
CREATE INDEX IF NOT EXISTS idx_custom_field_defs_dependencies
ON custom_field_definitions USING gin(dependencies);

-- Add comments
COMMENT ON COLUMN custom_field_definitions.dependencies IS 'Array of dependency rules that control field visibility, requirements, and enabled state based on other field values';

-- Example dependency configurations:
-- Show field when another field equals a value:
-- [{"source_field": "customer_type", "condition_type": "equals", "condition_value": "enterprise", "action": "show"}]
--
-- Require field when another field is not empty:
-- [{"source_field": "has_contract", "condition_type": "is_not_empty", "condition_value": null, "action": "require"}]
--
-- Multiple conditions (all must be met):
-- [
--   {"source_field": "status", "condition_type": "equals", "condition_value": "active", "action": "show"},
--   {"source_field": "tier", "condition_type": "in_list", "condition_value": "premium,enterprise", "action": "require"}
-- ]
--
-- Supported condition_types:
-- - equals, not_equals
-- - contains, not_contains
-- - greater_than, less_than
-- - is_empty, is_not_empty
-- - in_list, not_in_list
--
-- Supported actions:
-- - show, hide (controls visibility)
-- - require, optional (controls required state)
-- - enable, disable (controls enabled/disabled state)

-- Create table for dependency audit trail
CREATE TABLE IF NOT EXISTS custom_field_dependency_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  record_id UUID NOT NULL,
  evaluation_result JSONB NOT NULL,
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for audit queries
CREATE INDEX IF NOT EXISTS idx_dependency_logs_field_record
ON custom_field_dependency_logs(field_id, record_id, evaluated_at DESC);

COMMENT ON TABLE custom_field_dependency_logs IS 'Audit trail of field dependency evaluations for debugging and compliance';
COMMENT ON COLUMN custom_field_dependency_logs.evaluation_result IS 'Result of dependency evaluation: {visible, required, enabled, conditions_met}';
