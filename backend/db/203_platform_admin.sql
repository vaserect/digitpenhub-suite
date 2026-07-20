CREATE TABLE IF NOT EXISTS pa_impersonation (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS pa_whitelabel (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS pa_vuln_scans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS pa_incidents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS pa_feedback (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS pa_changelog (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS pa_addons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
