-- Activity Timeline: central feed for all CRM events
-- Every contact action creates an activity log entry for unified timeline display.
-- Stored in a separate table to keep contacts table lightweight and to
-- support fast timeline queries across all contacts.

CREATE TABLE IF NOT EXISTS activity_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_timeline_org ON activity_timeline(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_contact ON activity_timeline(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_type ON activity_timeline(activity_type, created_at DESC);

-- Add activity_types as a helper enum for consistent logging
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
    CREATE TYPE activity_type AS ENUM (
      'contact.created', 'contact.updated', 'contact.deleted',
      'contact.stage_changed', 'contact.merged',
      'note.added', 'note.deleted',
      'task.added', 'task.updated', 'task.deleted', 'task.completed',
      'email.sent', 'email.received',
      'sms.sent', 'sms.received',
      'call.logged',
      'whatsapp.sent',
      'meeting.scheduled',
      'file.uploaded', 'file.deleted',
      'lead.captured', 'lead.qualified', 'lead.converted',
      'score.updated',
      'tag.added', 'tag.removed',
      'relationship.added', 'relationship.removed'
    );
  END IF;
END $$;
