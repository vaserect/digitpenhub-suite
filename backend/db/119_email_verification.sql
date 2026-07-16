-- Email verification: add columns for email verification flow.
-- New users will need to verify their email before accessing the platform.
-- Existing users are considered verified (backwards-compatible).

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ;

-- Mark all existing users as verified so they're not affected
UPDATE users SET email_verified = true WHERE email_verified = false;
