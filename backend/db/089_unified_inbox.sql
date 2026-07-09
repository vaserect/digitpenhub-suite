-- Unified Inbox — aggregates messages from tickets, notifications, and
-- cross-module activity into one chronological feed per user.

CREATE TABLE IF NOT EXISTS inbox_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source        TEXT NOT NULL,                -- 'ticket', 'notification', 'lead', 'comment', 'system'
  source_id     TEXT,                          -- optional: the record that generated this
  title         TEXT NOT NULL,
  body          TEXT,
  link          TEXT,                          -- deep link to the record
  is_read       BOOLEAN NOT NULL DEFAULT false,
  priority      TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inbox_org_user ON inbox_messages(org_id, user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_inbox_created ON inbox_messages(org_id, user_id, created_at DESC);
