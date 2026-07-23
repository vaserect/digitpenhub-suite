CREATE TABLE IF NOT EXISTS cbt_tests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_cbt_tests_org ON cbt_tests(org_id);

CREATE TABLE IF NOT EXISTS assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, title TEXT NOT NULL, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_assignments_org ON assignments(org_id);

CREATE TABLE IF NOT EXISTS education_upgrades (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, feature TEXT, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_edu_upgrades_org ON education_upgrades(org_id);

CREATE TABLE IF NOT EXISTS edu_courses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_edu_courses ON edu_courses(org_id);

CREATE TABLE IF NOT EXISTS edu_students (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, user_id UUID, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_edu_students ON edu_students(org_id);

CREATE TABLE IF NOT EXISTS edu_teachers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, user_id UUID, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_edu_teachers ON edu_teachers(org_id);

CREATE TABLE IF NOT EXISTS edu_certificates (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_edu_certs ON edu_certificates(org_id);

CREATE TABLE IF NOT EXISTS edu_schedule (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_edu_sched ON edu_schedule(org_id);

CREATE TABLE IF NOT EXISTS edu_discussions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_edu_disc ON edu_discussions(org_id);

CREATE TABLE IF NOT EXISTS edu_grades (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_edu_grades ON edu_grades(org_id);

CREATE TABLE IF NOT EXISTS edu_plagiarism (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_edu_plag ON edu_plagiarism(org_id);
