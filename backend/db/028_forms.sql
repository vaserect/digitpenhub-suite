CREATE TABLE forms (
  id             BIGSERIAL PRIMARY KEY,
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  fields         JSONB NOT NULL DEFAULT '[]',
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft')),
  submit_message TEXT NOT NULL DEFAULT 'Thank you for your submission!',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE form_responses (
  id           BIGSERIAL PRIMARY KEY,
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  form_id      BIGINT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  data         JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
