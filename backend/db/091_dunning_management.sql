-- Dunning Management — automated failed-payment recovery sequences
--
-- Tracks each billing failure and the recovery actions taken (email
-- reminders, usage restrictions, escalation, final suspension). Designed
-- to slot into the existing subscriptions + payments system.

CREATE TABLE IF NOT EXISTS dunning_cycles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id     UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'collecting'
                      CHECK (status IN ('collecting','reminding','escalated','suspended','resolved')),
  amount_due          NUMERIC(12,2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'NGN',
  failure_count       INT NOT NULL DEFAULT 0,
  last_attempt_at     TIMESTAMPTZ,
  next_action_at      TIMESTAMPTZ,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dunning_org ON dunning_cycles(org_id);
CREATE INDEX IF NOT EXISTS idx_dunning_next ON dunning_cycles(next_action_at)
  WHERE status NOT IN ('resolved','suspended');

CREATE TABLE IF NOT EXISTS dunning_actions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id            UUID NOT NULL REFERENCES dunning_cycles(id) ON DELETE CASCADE,
  action_type         TEXT NOT NULL
                      CHECK (action_type IN ('email_reminder','email_final','restrict_usage','suspend_notice','auto_retry','admin_escalate','resolved')),
  subject             TEXT,
  detail              TEXT,
  executed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  success             BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_dunning_actions_cycle ON dunning_actions(cycle_id);

-- Default dunning schedule template (per org or global)
CREATE TABLE IF NOT EXISTS dunning_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  schedule            JSONB NOT NULL DEFAULT '[{"delay_days":3,"action":"email_reminder"},{"delay_days":7,"action":"email_final"},{"delay_days":14,"action":"restrict_usage"},{"delay_days":21,"action":"suspend_notice"}]'::jsonb,
  max_retries         INT NOT NULL DEFAULT 3,
  is_default          BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert a default dunning template (org-agnostic)
INSERT INTO dunning_templates (name, schedule, max_retries, is_default)
VALUES ('Default', '[{"delay_days":3,"action":"email_reminder"},{"delay_days":7,"action":"email_reminder"},{"delay_days":14,"action":"email_final"},{"delay_days":21,"action":"restrict_usage"},{"delay_days":28,"action":"suspend_notice"}]', 3, true)
ON CONFLICT DO NOTHING;
