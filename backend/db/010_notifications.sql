-- Milestone 11: Notifications System

CREATE TABLE notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,  -- NULL = broadcast to all org admins
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL DEFAULT '',
  link       TEXT,
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON notifications (org_id, user_id, is_read, created_at DESC);
CREATE INDEX ON notifications (org_id, created_at DESC);
