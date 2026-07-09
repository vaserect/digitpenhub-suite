-- Master Data Management / Deduplication Engine
-- Tracks duplicate record pairs and merge history.

CREATE TABLE IF NOT EXISTS duplicate_groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,                -- 'contact', 'lead', 'company'
  master_id     TEXT NOT NULL,                 -- the surviving record
  merged_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dup_groups_org ON duplicate_groups(org_id, resource_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dup_groups_master ON duplicate_groups(org_id, resource_type, master_id);

CREATE TABLE IF NOT EXISTS duplicate_candidates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID REFERENCES duplicate_groups(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  record_id     TEXT NOT NULL,
  duplicate_of  TEXT,                          -- the record_id this is a duplicate of
  score         NUMERIC(5,2),                  -- 0-100 confidence score
  match_reason  TEXT,                          -- e.g. 'email_match', 'name_fuzzy'
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','confirmed','rejected','merged')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dup_candidates_org ON duplicate_candidates(org_id, resource_type, status);
CREATE INDEX IF NOT EXISTS idx_dup_candidates_record ON duplicate_candidates(record_id);

CREATE TABLE IF NOT EXISTS merge_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  survived_id   TEXT NOT NULL,
  merged_ids    TEXT[] NOT NULL,
  fields_kept   JSONB,                         -- which field values survived
  performed_by  UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
