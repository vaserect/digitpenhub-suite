CREATE TABLE IF NOT EXISTS subscription_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(15,2) NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly','monthly','quarterly','yearly','one-time')),
  trial_days    INT NOT NULL DEFAULT 0,
  features      JSONB NOT NULL DEFAULT '[]',
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id         UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT,
  customer_phone  TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','trialing','past_due','cancelled','expired')),
  started_at      DATE NOT NULL DEFAULT CURRENT_DATE,
  current_period_end DATE,
  cancelled_at    DATE,
  amount          NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
