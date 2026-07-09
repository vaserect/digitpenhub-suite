-- CRM upgrades: deals pipeline, company records, email sequences, activity timeline, lead scoring

CREATE TABLE IF NOT EXISTS crm_companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  website       TEXT,
  industry      TEXT,
  size          TEXT,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_companies_org ON crm_companies(org_id);

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS probability INT CHECK (probability >= 0 AND probability <= 100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deal_value NUMERIC(12,2);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead','qualified','proposal','negotiation','won','lost'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS crm_email_sequences (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_sequence_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id   UUID NOT NULL REFERENCES crm_email_sequences(id) ON DELETE CASCADE,
  step_order    INT NOT NULL DEFAULT 0,
  subject       TEXT NOT NULL,
  body          TEXT NOT NULL,
  delay_days    INT NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_sequence_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id   UUID NOT NULL REFERENCES crm_email_sequences(id) ON DELETE CASCADE,
  contact_id    UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
  current_step  INT NOT NULL DEFAULT 0,
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sequence_id, contact_id)
);

CREATE TABLE IF NOT EXISTS crm_activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id    UUID REFERENCES contacts(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  detail        TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_activity_contact ON crm_activity_log(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activity_org ON crm_activity_log(org_id, created_at DESC);
