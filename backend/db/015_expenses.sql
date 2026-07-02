-- Milestone 15: Expenses & Finance

CREATE TABLE expense_categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  color      TEXT        NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id    UUID        REFERENCES expense_categories(id) ON DELETE SET NULL,
  title          TEXT        NOT NULL,
  amount_ngn     INTEGER     NOT NULL,
  expense_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT        NOT NULL DEFAULT 'cash'
                   CHECK (payment_method IN ('cash','card','transfer','cheque','other')),
  status         TEXT        NOT NULL DEFAULT 'paid'
                   CHECK (status IN ('pending','paid','reimbursed')),
  receipt_url    TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX expenses_org_date_idx ON expenses (org_id, expense_date DESC);

CREATE TABLE expense_budgets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id   UUID        REFERENCES expense_categories(id) ON DELETE CASCADE,
  period_month  INTEGER     NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year   INTEGER     NOT NULL,
  amount_ngn    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One overall budget per org per month (category_id IS NULL)
CREATE UNIQUE INDEX budget_overall_idx
  ON expense_budgets (org_id, period_month, period_year)
  WHERE category_id IS NULL;

-- One per-category budget per org per month
CREATE UNIQUE INDEX budget_category_idx
  ON expense_budgets (org_id, category_id, period_month, period_year)
  WHERE category_id IS NOT NULL;

-- Seed default categories via function (runs inline, no procedural language needed)
-- (Seeding happens per-org at first load, not here)
