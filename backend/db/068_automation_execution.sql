-- Milestone 68: Marketing Automation real execution
--
-- Found during Pass 14's integrity check (flagged in Pass 13's log as
-- worth checking): Marketing Automation had full CRUD for workflows/steps/
-- enrollments but NO execution mechanism at all — not even a simulated
-- one. An enrollment's `current_step` never advanced, no email a workflow
-- claimed to send ever sent. Bigger gap than Workflow Automation had.
--
-- add_tag/remove_tag need somewhere real to write to. Rather than widen
-- the core `contacts` table's shape (out of scope, would need CRM UI
-- changes too), scope tags to this system specifically — still real,
-- still queryable, still exactly what a "tag_added" trigger needs to
-- check against later.

CREATE TABLE automation_contact_tags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  tag           TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, contact_email, tag)
);
CREATE INDEX automation_contact_tags_lookup_idx ON automation_contact_tags (org_id, contact_email);

-- Tracks per-step run outcomes so the frontend can show a real history —
-- same "honest run log" pattern as Workflow Automation's run log.
CREATE TABLE automation_step_runs (
  id            BIGSERIAL PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES automation_enrollments(id) ON DELETE CASCADE,
  step_id       UUID REFERENCES automation_steps(id) ON DELETE SET NULL,
  step_type     TEXT NOT NULL,
  ok            BOOLEAN NOT NULL,
  note          TEXT,
  ran_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX automation_step_runs_enrollment_idx ON automation_step_runs (enrollment_id, ran_at DESC);

-- Enrollments need to know when they *reached* their current step, so a
-- wait_days step can be timed against something real instead of guessing.
ALTER TABLE automation_enrollments ADD COLUMN current_step_started_at TIMESTAMPTZ NOT NULL DEFAULT now();
