CREATE TABLE IF NOT EXISTS payroll_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','processing','paid','cancelled')),
  total_gross   NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_deductions NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_net     NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  run_id         UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_name  TEXT NOT NULL,
  employee_email TEXT,
  department     TEXT,
  gross_salary   NUMERIC(15,2) NOT NULL DEFAULT 0,
  allowances     NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax            NUMERIC(15,2) NOT NULL DEFAULT 0,
  pension        NUMERIC(15,2) NOT NULL DEFAULT 0,
  other_deductions NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_pay        NUMERIC(15,2) NOT NULL DEFAULT 0,
  bank_name      TEXT,
  account_number TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
