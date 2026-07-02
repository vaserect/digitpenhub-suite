-- Milestone 12: 2FA + Security Hardening

ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_backup_codes JSONB  NOT NULL DEFAULT '[]';
