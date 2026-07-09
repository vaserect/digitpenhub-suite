CREATE TABLE IF NOT EXISTS gdpr_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requester_email TEXT NOT NULL,
  request_type  TEXT NOT NULL CHECK (request_type IN ('access','rectification','erasure','portability','restrict')),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','processing','completed','rejected')),
  details       TEXT,
  data_export   TEXT,
  completed_at  TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gdpr_org ON gdpr_requests(org_id, status);

CREATE TABLE IF NOT EXISTS consent_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subject_type  TEXT NOT NULL,                -- 'contact', 'lead', 'subscriber'
  subject_id    TEXT NOT NULL,
  purpose       TEXT NOT NULL,                -- 'marketing', 'analytics', 'tracking', 'communication'
  consented     BOOLEAN NOT NULL DEFAULT true,
  source        TEXT,                          -- 'form', 'checkbox', 'api', 'import'
  ip_address    TEXT,
  consented_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subject_type, subject_id, purpose)
);
CREATE INDEX IF NOT EXISTS idx_consent_subject ON consent_records(subject_type, subject_id);
