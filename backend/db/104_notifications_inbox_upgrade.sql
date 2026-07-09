-- Upgrade: Notification preferences, Inbox team assignment, internal notes

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'
  CHECK (priority IN ('low','normal','high','urgent'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;

CREATE TABLE IF NOT EXISTS notification_preferences (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notify_email  BOOLEAN NOT NULL DEFAULT true,
  notify_inapp  BOOLEAN NOT NULL DEFAULT true,
  digest_freq   TEXT NOT NULL DEFAULT 'realtime' CHECK (digest_freq IN ('realtime','hourly','daily','never')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE inbox_messages ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
ALTER TABLE inbox_messages ADD COLUMN IF NOT EXISTS channel_badge TEXT;
ALTER TABLE inbox_messages ADD COLUMN IF NOT EXISTS conversation_id UUID;

CREATE TABLE IF NOT EXISTS inbox_internal_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    UUID NOT NULL REFERENCES inbox_messages(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES users(id),
  body          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
