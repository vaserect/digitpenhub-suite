-- Milestone 17: Accounting

CREATE TABLE coa_accounts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code         TEXT,
  name         TEXT        NOT NULL,
  account_type TEXT        NOT NULL
                 CHECK (account_type IN ('asset','liability','equity','income','expense')),
  is_system    BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX coa_accounts_org_idx ON coa_accounts (org_id, account_type);

CREATE TABLE journal_entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  description TEXT        NOT NULL,
  reference   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX journal_entries_org_date_idx ON journal_entries (org_id, entry_date DESC);

CREATE TABLE journal_lines (
  id         UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id   UUID   NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID   NOT NULL REFERENCES coa_accounts(id),
  debit      BIGINT NOT NULL DEFAULT 0,  -- stored in kobo
  credit     BIGINT NOT NULL DEFAULT 0,  -- stored in kobo
  notes      TEXT,
  CHECK (debit >= 0 AND credit >= 0)
);

CREATE INDEX journal_lines_entry_idx   ON journal_lines (entry_id);
CREATE INDEX journal_lines_account_idx ON journal_lines (account_id);
