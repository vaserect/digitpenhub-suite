-- Custom Fields Engine: shared mechanism for adding custom fields to any
-- record type (CRM contact, Invoice, Student, Inventory item, etc.) instead
-- of each module inventing its own. See Platform Core spec.

CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  record_type         TEXT NOT NULL,
  key                 TEXT NOT NULL,
  label               TEXT NOT NULL,
  field_type          TEXT NOT NULL CHECK (field_type IN (
                        'text','number','date','select','multiselect',
                        'checkbox','file','relation'
                      )),
  description         TEXT,
  required            BOOLEAN NOT NULL DEFAULT false,
  default_value       JSONB,
  validation          JSONB NOT NULL DEFAULT '{}',
  options             JSONB NOT NULL DEFAULT '[]',
  relation_record_type TEXT,
  sort_order          INT NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id, record_type, key)
);
CREATE INDEX IF NOT EXISTS idx_custom_field_defs_org_type
  ON custom_field_definitions(org_id, record_type, is_active);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id    UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  record_id   UUID NOT NULL,
  value       JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (field_id, record_id)
);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_lookup
  ON custom_field_values(org_id, record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field
  ON custom_field_values(field_id);
