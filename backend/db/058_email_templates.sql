-- Milestone 58: Email campaign template library (Email Marketing module)

CREATE TABLE email_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  description   TEXT,
  subject       TEXT        NOT NULL,
  preview_text  TEXT,
  body_html     TEXT        NOT NULL,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_templates_category_idx ON email_templates (category);
