-- Milestone 21: WhatsApp Marketing

CREATE TABLE whatsapp_contacts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  phone      TEXT        NOT NULL,
  tags       TEXT[]      NOT NULL DEFAULT '{}',
  status     TEXT        NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','opted_out','blocked')),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX whatsapp_contacts_org_idx ON whatsapp_contacts (org_id);

CREATE TABLE whatsapp_templates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  category   TEXT        NOT NULL DEFAULT 'marketing'
               CHECK (category IN ('marketing','utility','authentication')),
  body       TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','active')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX whatsapp_templates_org_idx ON whatsapp_templates (org_id);

CREATE TABLE whatsapp_broadcasts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id     UUID        REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  name            TEXT        NOT NULL,
  recipient_count INT         NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','scheduled','sent','failed')),
  notes           TEXT,
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX whatsapp_broadcasts_org_idx ON whatsapp_broadcasts (org_id);
