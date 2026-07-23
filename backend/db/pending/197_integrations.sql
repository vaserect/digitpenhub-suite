CREATE TABLE IF NOT EXISTS int_native_hub (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_int_hub ON int_native_hub(org_id);
CREATE TABLE IF NOT EXISTS int_developer_apps (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_int_dev ON int_developer_apps(org_id);
CREATE TABLE IF NOT EXISTS int_sandbox_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_int_sbx ON int_sandbox_sessions(org_id);
CREATE TABLE IF NOT EXISTS int_oauth_apps (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_int_oauth ON int_oauth_apps(org_id);
