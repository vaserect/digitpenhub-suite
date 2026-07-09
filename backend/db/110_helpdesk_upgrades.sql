-- Help Desk upgrades: SLA management, escalation rules, ticket priorities, response tracking

ALTER TABLE helpdesk_tickets ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
  CHECK (priority IN ('low','medium','high','urgent'));
ALTER TABLE helpdesk_tickets ADD COLUMN IF NOT EXISTS sla_id UUID;
ALTER TABLE helpdesk_tickets ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ;
ALTER TABLE helpdesk_tickets ADD COLUMN IF NOT EXISTS resolution_at TIMESTAMPTZ;
ALTER TABLE helpdesk_tickets ADD COLUMN IF NOT EXISTS breached_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS helpdesk_slas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high','urgent')),
  response_hours NUMERIC(6,1) NOT NULL,
  resolution_hours NUMERIC(6,1) NOT NULL,
  escalate_after_hours NUMERIC(6,1),
  escalate_to_role TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, priority)
);

CREATE TABLE IF NOT EXISTS helpdesk_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_id BIGINT NOT NULL,
  escalation_type TEXT NOT NULL CHECK (escalation_type IN ('response','resolution','custom')),
  escalated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  escalated_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_escalations_ticket ON helpdesk_escalations(ticket_id);
