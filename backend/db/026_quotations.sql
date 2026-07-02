CREATE SEQUENCE IF NOT EXISTS quotation_number_seq;

CREATE TABLE quotations (
  id             BIGSERIAL PRIMARY KEY,
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quote_number   TEXT NOT NULL,
  client_name    TEXT NOT NULL,
  client_email   TEXT,
  client_address TEXT,
  items          JSONB NOT NULL DEFAULT '[]',
  subtotal       NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate       NUMERIC(5,2)  NOT NULL DEFAULT 0,
  tax_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  total          NUMERIC(14,2) NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  notes          TEXT,
  valid_until    DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
