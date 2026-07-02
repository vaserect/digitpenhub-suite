CREATE TABLE IF NOT EXISTS issued_certificates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  recipient_name  TEXT NOT NULL,
  recipient_email TEXT,
  description     TEXT,
  issued_by       TEXT,
  issue_date      DATE DEFAULT CURRENT_DATE,
  expiry_date     DATE,
  certificate_id  TEXT NOT NULL,
  template        TEXT DEFAULT 'classic',
  status          TEXT DEFAULT 'issued',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS cert_number_seq START 1001;
