CREATE TABLE coupons (
  id             BIGSERIAL PRIMARY KEY,
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code           TEXT NOT NULL,
  description    TEXT,
  type           TEXT NOT NULL DEFAULT 'percent' CHECK (type IN ('percent','fixed')),
  value          NUMERIC(10,2) NOT NULL,
  min_order      NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses       INT,
  uses_count     INT NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','expired')),
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
