-- Milestone 22: Affiliate System

CREATE TABLE affiliates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  email           TEXT,
  phone           TEXT,
  promo_code      TEXT        NOT NULL,
  commission_type TEXT        NOT NULL DEFAULT 'percentage'
                    CHECK (commission_type IN ('percentage','flat')),
  commission_value NUMERIC(10,2) NOT NULL DEFAULT 10,
  status          TEXT        NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','paused','terminated')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, promo_code)
);

CREATE INDEX affiliates_org_idx ON affiliates (org_id);

CREATE TABLE affiliate_conversions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliate_id    UUID        NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  order_ref       TEXT,
  amount_ngn      BIGINT      NOT NULL DEFAULT 0,
  commission_ngn  BIGINT      NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','paid','rejected')),
  notes           TEXT,
  conversion_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX affiliate_conversions_org_aff_idx ON affiliate_conversions (org_id, affiliate_id);
