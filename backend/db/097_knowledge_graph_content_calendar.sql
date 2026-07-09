-- Knowledge Graph / Entity Relationship Mapping
-- Tracks connections between records across modules so users can
-- explore the graph visually.

CREATE TABLE IF NOT EXISTS entity_relationships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_type   TEXT NOT NULL,                -- e.g. 'contact', 'invoice', 'project', 'ticket'
  source_id     TEXT NOT NULL,
  target_type   TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  relation_type TEXT NOT NULL,                -- e.g. 'has_invoice', 'assigned_to', 'belongs_to'
  meta          JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id, target_type, target_id, relation_type)
);
CREATE INDEX IF NOT EXISTS idx_er_source ON entity_relationships(org_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_er_target ON entity_relationships(org_id, target_type, target_id);

-- Content Calendar — unified planning across email, social, blog, SMS
CREATE TABLE IF NOT EXISTS content_calendar_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  channel       TEXT NOT NULL CHECK (channel IN ('email','social','blog','sms','whatsapp','push')),
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','cancelled')),
  scheduled_at  TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  content       TEXT,
  author_id     UUID REFERENCES users(id),
  tags          TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_org ON content_calendar_items(org_id, scheduled_at);

-- Cross-Module Activity Feed — unified chronological feed of actions
CREATE TABLE IF NOT EXISTS activity_feed (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  action        TEXT NOT NULL,                -- e.g. 'created_invoice', 'updated_contact', 'sent_campaign'
  entity_type   TEXT NOT NULL,
  entity_id     TEXT,
  summary       TEXT NOT NULL,                -- human-readable: "Alice created invoice #1042"
  meta          JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_af_org ON activity_feed(org_id, created_at DESC);

-- Legal Template Library — pre-written legal document templates
CREATE TABLE IF NOT EXISTS legal_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('nda','service_agreement','privacy_policy','terms_of_service','employment_contract','freelance_contract','partnership_agreement','other')),
  content       TEXT NOT NULL,
  placeholder_keys TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

-- Vulnerability Scanning Dashboard — dependency/CVE risk tracking
CREATE TABLE IF NOT EXISTS vuln_scans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scan_type     TEXT NOT NULL CHECK (scan_type IN ('dependency','cve','ssl','custom')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  summary       JSONB DEFAULT '{}',
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vuln_findings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id       UUID NOT NULL REFERENCES vuln_scans(id) ON DELETE CASCADE,
  severity      TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low','info')),
  title         TEXT NOT NULL,
  description   TEXT,
  package_name  TEXT,
  cve_id        TEXT,
  fix_version   TEXT,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','ignored')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vf_severity ON vuln_findings(scan_id, severity);

-- Security Incident Response Runbook Tool
CREATE TABLE IF NOT EXISTS incident_runbooks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  severity      TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  steps_json    JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  severity      TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  status        TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected','triaging','contained','resolved','post_mortem')),
  runbook_id    UUID REFERENCES incident_runbooks(id),
  description   TEXT,
  detected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incident_timeline (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id   UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  note          TEXT,
  performed_by  UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_it_incident ON incident_timeline(incident_id);
