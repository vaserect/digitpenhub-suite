-- Milestone 20: Marketing Automation

CREATE TABLE automation_workflows (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  trigger_type TEXT        NOT NULL DEFAULT 'manual'
                 CHECK (trigger_type IN ('manual','new_subscriber','tag_added','form_submitted')),
  trigger_config JSONB     NOT NULL DEFAULT '{}',
  status       TEXT        NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','active','paused')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX automation_workflows_org_idx ON automation_workflows (org_id);

CREATE TABLE automation_steps (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID   NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  step_order  INT    NOT NULL DEFAULT 0,
  step_type   TEXT   NOT NULL CHECK (step_type IN ('send_email','wait_days','add_tag','remove_tag','add_to_list','webhook')),
  config      JSONB  NOT NULL DEFAULT '{}'
);

CREATE INDEX automation_steps_workflow_idx ON automation_steps (workflow_id, step_order);

CREATE TABLE automation_enrollments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id   UUID        NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  contact_email TEXT        NOT NULL,
  contact_name  TEXT,
  status        TEXT        NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','completed','paused','failed')),
  current_step  INT         NOT NULL DEFAULT 0,
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX automation_enrollments_org_wf_idx ON automation_enrollments (org_id, workflow_id);
