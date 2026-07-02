-- Milestone 7: Lead Generation Module

CREATE TABLE lead_forms (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  fields_json       JSONB       NOT NULL DEFAULT '[]',
  thank_you_message TEXT        NOT NULL DEFAULT 'Thank you! We will be in touch soon.',
  redirect_url      TEXT,
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_submissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id      UUID        NOT NULL REFERENCES lead_forms(id) ON DELETE CASCADE,
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  data_json    JSONB       NOT NULL DEFAULT '{}',
  ip_address   TEXT,
  status       TEXT        NOT NULL DEFAULT 'new'
                           CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  notes        TEXT        NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_pipelines (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_stages (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID    NOT NULL REFERENCES lead_pipelines(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  color       TEXT    NOT NULL DEFAULT '#64748b'
);

CREATE INDEX ON lead_forms (org_id);
CREATE INDEX ON lead_submissions (form_id);
CREATE INDEX ON lead_submissions (org_id);
CREATE INDEX ON lead_submissions (status);
CREATE INDEX ON lead_pipelines (org_id);
CREATE INDEX ON lead_stages (pipeline_id);
