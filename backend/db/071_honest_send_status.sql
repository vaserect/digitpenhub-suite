-- "Send" actions for SMS campaigns and WhatsApp broadcasts previously marked
-- status='sent' with no gateway ever contacted. Add a `simulated` flag so the
-- API and UI can be honest about the difference between "sent for real"
-- (a configured provider accepted it) and "simulated" (no provider
-- configured, recorded for pipeline/testing purposes only).
ALTER TABLE sms_campaigns ADD COLUMN IF NOT EXISTS simulated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE whatsapp_broadcasts ADD COLUMN IF NOT EXISTS simulated BOOLEAN NOT NULL DEFAULT false;
