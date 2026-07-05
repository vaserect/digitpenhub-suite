-- CRM was missing notes, tasks, tags, and custom fields on contacts — a
-- baseline CRM capability, not an enhancement. Notes and tasks get their own
-- tables scoped to a contact (kept separate from the unrelated
-- project-management `tasks` table, which requires a project_id and has
-- different semantics).
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS contact_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contact_notes_org ON contact_notes(org_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact ON contact_notes(contact_id, created_at DESC);

CREATE TABLE IF NOT EXISTS contact_tasks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  due_date   DATE,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contact_tasks_org ON contact_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_contact_tasks_contact ON contact_tasks(contact_id, status);
