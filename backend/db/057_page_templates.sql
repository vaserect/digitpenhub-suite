-- Milestone 57: Page/Funnel template library (Website Builder + Landing Page Builder)
-- Templates are org-independent (shared across all orgs) — a curated starter library.

CREATE TABLE page_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT        NOT NULL,
  page_type     TEXT        NOT NULL DEFAULT 'page'
                  CHECK (page_type IN ('page','landing')),
  name          TEXT        NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  blocks        JSONB       NOT NULL DEFAULT '[]',
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX page_templates_category_idx ON page_templates (category);
CREATE INDEX page_templates_page_type_idx ON page_templates (page_type);
