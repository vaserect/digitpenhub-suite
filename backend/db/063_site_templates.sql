-- Milestone 63: Multi-page site templates (Step 1b) — a site template bundles
-- several linked pages (home/about/services/etc) into one "use" action, unlike
-- page_templates which creates a single standalone page.

CREATE TABLE site_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE site_template_pages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_template_id UUID        NOT NULL REFERENCES site_templates(id) ON DELETE CASCADE,
  page_role        TEXT        NOT NULL, -- 'home','about','services','portfolio','testimonials','contact','blog'
  slug_suffix      TEXT        NOT NULL, -- appended to the site's base slug, e.g. 'about'
  title            TEXT        NOT NULL,
  nav_label        TEXT        NOT NULL,
  meta_description TEXT,
  blocks           JSONB       NOT NULL DEFAULT '[]', -- content blocks only — nav/footer injected at use-time
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX site_templates_category_idx ON site_templates (category);
CREATE INDEX site_template_pages_template_idx ON site_template_pages (site_template_id, sort_order);
