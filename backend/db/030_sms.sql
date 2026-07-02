CREATE TABLE sms_contacts (
  id         BIGSERIAL PRIMARY KEY,
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  tags       TEXT[] NOT NULL DEFAULT '{}',
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','unsubscribed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sms_campaigns (
  id               BIGSERIAL PRIMARY KEY,
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  message          TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','failed')),
  recipients_count INT NOT NULL DEFAULT 0,
  sent_count       INT NOT NULL DEFAULT 0,
  failed_count     INT NOT NULL DEFAULT 0,
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sms_campaign_contacts (
  campaign_id BIGINT NOT NULL REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  contact_id  BIGINT NOT NULL REFERENCES sms_contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, contact_id)
);
