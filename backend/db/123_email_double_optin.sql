-- Migration 123: Email Double Opt-In
-- Add confirmation token support for GDPR compliance

-- Add confirmation token columns
ALTER TABLE email_subscribers 
ADD COLUMN IF NOT EXISTS confirmation_token VARCHAR(64),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

-- Add index for confirmation lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_confirmation 
ON email_subscribers(confirmation_token) 
WHERE confirmation_token IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN email_subscribers.confirmation_token IS 'Token for double opt-in email confirmation (GDPR compliance)';
COMMENT ON COLUMN email_subscribers.confirmed_at IS 'Timestamp when subscriber confirmed their subscription';
