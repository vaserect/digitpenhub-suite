-- Add tracked_url column to whatsapp_messages so link tracking stores the
-- actual destination URL rather than the message body text.
-- Note: whatsapp_messages may not exist if the parent migration was partial.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_messages') THEN
    ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS tracked_url TEXT;
  END IF;
END $$;

-- Tracked URLs are also stored in a dedicated table for easier querying.
CREATE TABLE IF NOT EXISTS whatsapp_tracked_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  message_id    UUID,
  short_code    TEXT NOT NULL UNIQUE,
  original_url  TEXT NOT NULL,
  click_count   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wt_links_org ON whatsapp_tracked_links(org_id);
CREATE INDEX IF NOT EXISTS idx_wt_links_message ON whatsapp_tracked_links(message_id);
CREATE INDEX IF NOT EXISTS idx_wt_links_short ON whatsapp_tracked_links(short_code);
