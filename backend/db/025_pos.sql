CREATE TABLE pos_sessions (
  id           BIGSERIAL PRIMARY KEY,
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opened_at    TIMESTAMPTZ DEFAULT NOW(),
  closed_at    TIMESTAMPTZ,
  opening_cash NUMERIC(14,2) NOT NULL DEFAULT 0,
  closing_cash NUMERIC(14,2),
  total_sales  NUMERIC(14,2) NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed'))
);

CREATE TABLE pos_sales (
  id             BIGSERIAL PRIMARY KEY,
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id     BIGINT REFERENCES pos_sessions(id) ON DELETE SET NULL,
  items          JSONB NOT NULL DEFAULT '[]',
  subtotal       NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate       NUMERIC(5,2)  NOT NULL DEFAULT 0,
  tax_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  total          NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','card','transfer','other')),
  reference      TEXT,
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
