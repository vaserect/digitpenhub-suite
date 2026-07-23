CREATE TABLE IF NOT EXISTS util_json_formats (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_ujf ON util_json_formats(org_id);
CREATE TABLE IF NOT EXISTS util_image_conversions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_uic ON util_image_conversions(org_id);
CREATE TABLE IF NOT EXISTS util_file_conversions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_ufc ON util_file_conversions(org_id);
CREATE TABLE IF NOT EXISTS util_passwords (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_upw ON util_passwords(org_id);
