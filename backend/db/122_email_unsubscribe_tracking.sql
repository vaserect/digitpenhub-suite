-- Migration 122: Email Unsubscribe Tracking
-- Add columns to track unsubscribe events and reasons for compliance

-- Add unsubscribe tracking columns
ALTER TABLE email_subscribers 
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT;

-- Add index for unsubscribe queries
CREATE INDEX IF NOT EXISTS idx_email_subscribers_unsubscribed 
ON email_subscribers(unsubscribed_at) 
WHERE status = 'unsubscribed';

-- Add comment for documentation
COMMENT ON COLUMN email_subscribers.unsubscribed_at IS 'Timestamp when subscriber unsubscribed (for compliance tracking)';
COMMENT ON COLUMN email_subscribers.unsubscribe_reason IS 'Optional reason provided by subscriber when unsubscribing';
