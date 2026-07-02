-- Milestone 9: Subscription & Billing

CREATE TABLE plans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  price_ngn   INTEGER     NOT NULL DEFAULT 0,   -- monthly price in Naira (0 = free)
  max_users   INTEGER     NOT NULL DEFAULT 1,
  features    JSONB       NOT NULL DEFAULT '[]',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INTEGER     NOT NULL DEFAULT 0
);

CREATE TABLE subscriptions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID        NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id               UUID        NOT NULL REFERENCES plans(id),
  status                TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','cancelled','expired')),
  current_period_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end    TIMESTAMPTZ,            -- NULL = free tier (never expires)
  flw_subscription_ref  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id         UUID        NOT NULL REFERENCES plans(id),
  tx_ref          TEXT        NOT NULL UNIQUE,
  flw_tx_id       TEXT,
  amount_ngn      INTEGER     NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','successful','failed')),
  period_months   INTEGER     NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON payments (org_id, created_at DESC);

-- Seed plans
INSERT INTO plans (slug, name, price_ngn, max_users, features, sort_order) VALUES
  ('free',     'Free',     0,      1,  '["1 user","50 contacts","5 invoices","Lead forms","Basic CRM"]', 0),
  ('starter',  'Starter',  9900,   5,  '["Up to 5 users","500 contacts","Unlimited invoices","Email marketing","All modules"]', 1),
  ('growth',   'Growth',   29900,  15, '["Up to 15 users","5,000 contacts","Unlimited everything","Priority support","Analytics"]', 2),
  ('business', 'Business', 79900,  999,'["Unlimited users","Unlimited contacts","All modules","API access","Dedicated support"]', 3);

-- Auto-create free subscriptions for existing orgs
DO $$
DECLARE
  free_plan_id UUID;
BEGIN
  SELECT id INTO free_plan_id FROM plans WHERE slug = 'free';
  INSERT INTO subscriptions (org_id, plan_id, status, current_period_end)
    SELECT id, free_plan_id, 'active', NULL
    FROM organizations
    ON CONFLICT (org_id) DO NOTHING;
END $$;

-- Trigger: new org → free subscription
CREATE OR REPLACE FUNCTION auto_create_subscription()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE free_plan_id UUID;
BEGIN
  SELECT id INTO free_plan_id FROM plans WHERE slug = 'free';
  INSERT INTO subscriptions (org_id, plan_id, status, current_period_end)
    VALUES (NEW.id, free_plan_id, 'active', NULL)
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_org_subscription
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION auto_create_subscription();
