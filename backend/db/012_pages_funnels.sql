-- Milestone 12: Website Builder & Funnel Builder

CREATE TABLE pages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug            TEXT        NOT NULL,
  title           TEXT        NOT NULL,
  meta_description TEXT,
  status          TEXT        NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','published')),
  blocks          JSONB       NOT NULL DEFAULT '[]',
  view_count      INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX pages_org_slug_idx ON pages (org_id, slug);
CREATE INDEX pages_org_status_idx ON pages (org_id, status);

CREATE TABLE funnels (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','published')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE funnel_steps (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id   UUID        NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  page_id     UUID        NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  step_order  INTEGER     NOT NULL DEFAULT 0,
  step_type   TEXT        NOT NULL DEFAULT 'page'
                CHECK (step_type IN ('page','optin','upsell','downsell','thankyou')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX funnel_steps_funnel_idx ON funnel_steps (funnel_id, step_order);
