-- Milestone 13: HR & Payroll

CREATE TABLE departments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE employees (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id     UUID        REFERENCES departments(id) ON DELETE SET NULL,
  full_name         TEXT        NOT NULL,
  email             TEXT,
  phone             TEXT,
  job_title         TEXT,
  employment_type   TEXT        NOT NULL DEFAULT 'full-time'
                      CHECK (employment_type IN ('full-time','part-time','contract','intern')),
  start_date        DATE,
  salary_ngn        INTEGER     NOT NULL DEFAULT 0,
  status            TEXT        NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','on-leave','terminated')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX employees_org_idx ON employees (org_id, status);

CREATE TABLE leave_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id  UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type   TEXT        NOT NULL DEFAULT 'annual'
                 CHECK (leave_type IN ('annual','sick','maternity','paternity','unpaid','other')),
  start_date   DATE        NOT NULL,
  end_date     DATE        NOT NULL,
  reason       TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected')),
  reviewer_notes TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX leave_requests_org_idx ON leave_requests (org_id, status);

CREATE TABLE payroll_runs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_month    INTEGER     NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year     INTEGER     NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','processed')),
  total_gross_ngn INTEGER     NOT NULL DEFAULT 0,
  total_net_ngn   INTEGER     NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  UNIQUE (org_id, period_month, period_year)
);

CREATE TABLE payroll_entries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id  UUID        NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id     UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  gross_ngn       INTEGER     NOT NULL DEFAULT 0,
  deductions_ngn  INTEGER     NOT NULL DEFAULT 0,
  net_ngn         INTEGER     GENERATED ALWAYS AS (gross_ngn - deductions_ngn) STORED,
  notes           TEXT
);

CREATE INDEX payroll_entries_run_idx ON payroll_entries (payroll_run_id);
