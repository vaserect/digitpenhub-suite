-- Funnel Templates: a named sequence of page templates with step types

CREATE TABLE IF NOT EXISTS funnel_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funnel_template_steps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_template_id UUID NOT NULL REFERENCES funnel_templates(id) ON DELETE CASCADE,
  step_order        INT NOT NULL DEFAULT 0,
  step_type         TEXT NOT NULL DEFAULT 'page' CHECK (step_type IN ('page','optin','upsell','downsell','thankyou')),
  -- References page_templates by name (resolved at use-time for portability)
  page_template_name TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fts_template ON funnel_template_steps(funnel_template_id, step_order);
