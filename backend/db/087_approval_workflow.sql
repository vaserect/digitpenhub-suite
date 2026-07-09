-- Approval Workflow Engine
--
-- Generic approval chains that any module can plug into. A workflow defines
-- required approvers, escalation rules, and deadlines. When a resource needs
-- approval (e.g. an invoice over a threshold, a contract version, a published
-- page), the creating module triggers this engine instead of building its own
-- approval logic.

CREATE TABLE IF NOT EXISTS approval_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  resource_type TEXT NOT NULL,                -- e.g. 'invoice', 'contract', 'page', 'expense'
  -- JSON array of approval step definitions:
  -- [{"order":0,"type":"any|all","approver_user_ids":["..."], "deadline_hours":24}]
  steps_json    JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id   UUID REFERENCES approval_templates(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,                -- UUID as text (any module's record)
  title         TEXT NOT NULL,                -- human-readable summary
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected','cancelled')),
  submitted_by  UUID NOT NULL REFERENCES users(id),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ,
  resolved_by   UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_apr_org ON approval_requests(org_id, status);
CREATE INDEX IF NOT EXISTS idx_apr_resource ON approval_requests(resource_type, resource_id);

CREATE TABLE IF NOT EXISTS approval_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_order    INT NOT NULL,
  step_type     TEXT NOT NULL DEFAULT 'any'   -- 'any' = one approves, 'all' = everyone must
                CHECK (step_type IN ('any','all')),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected','skipped')),
  deadline_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_actions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id       UUID NOT NULL REFERENCES approval_steps(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  action        TEXT NOT NULL CHECK (action IN ('approve','reject')),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (step_id, user_id)
);
