-- Milestone 6: Email Marketing Module

CREATE TABLE email_lists (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE email_subscribers (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id        UUID        NOT NULL REFERENCES email_lists(id) ON DELETE CASCADE,
  org_id         UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email          TEXT        NOT NULL,
  name           TEXT,
  status         TEXT        NOT NULL DEFAULT 'subscribed'
                             CHECK (status IN ('subscribed', 'unsubscribed')),
  subscribed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (list_id, email)
);

CREATE TABLE email_campaigns (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  list_id      UUID        REFERENCES email_lists(id) ON DELETE SET NULL,
  subject      TEXT        NOT NULL,
  preview_text TEXT,
  body_html    TEXT        NOT NULL DEFAULT '',
  status       TEXT        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'scheduled', 'sent')),
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  opens        INTEGER     NOT NULL DEFAULT 0,
  clicks       INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON email_lists (org_id);
CREATE INDEX ON email_subscribers (list_id);
CREATE INDEX ON email_subscribers (org_id);
CREATE INDEX ON email_campaigns (org_id);
