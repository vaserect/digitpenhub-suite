-- Account lockout: tracks failed login attempts and auto-locks accounts
-- after 10 consecutive failures. Lockout auto-clears after 15 minutes.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS login_attempts     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until      TIMESTAMPTZ;
