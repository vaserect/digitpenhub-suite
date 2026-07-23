-- =====================================================
-- QR Code Generator — Safe Enterprise Column Backfill
-- Adds enterprise columns without the destructive DROP TABLE
-- in migration 113. This ensures backward compatibility
-- regardless of which migrations have been applied.
-- =====================================================

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS total_scans BIGINT DEFAULT 0;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS unique_scans BIGINT DEFAULT 0;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMPTZ;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS qr_type TEXT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN DEFAULT FALSE;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS redirect_url TEXT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS foreground_color TEXT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS background_color TEXT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS folder_id BIGINT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS design_template_id BIGINT;

-- Migrate existing data from original columns to enterprise columns
UPDATE qr_codes SET total_scans = scans WHERE total_scans IS NULL AND scans IS NOT NULL;
UPDATE qr_codes SET status = 'active' WHERE status IS NULL;
UPDATE qr_codes SET qr_type = type WHERE qr_type IS NULL AND type IS NOT NULL;
UPDATE qr_codes SET foreground_color = color WHERE foreground_color IS NULL AND color IS NOT NULL;
UPDATE qr_codes SET background_color = bg_color WHERE background_color IS NULL AND bg_color IS NOT NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON qr_codes(status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_qr_type ON qr_codes(qr_type);

-- Create scan events table if not exists
CREATE TABLE IF NOT EXISTS qr_scan_events (
  id          BIGSERIAL PRIMARY KEY,
  qr_code_id  UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  scanned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address  TEXT,
  user_agent  TEXT,
  referer     TEXT,
  country     TEXT,
  device_type TEXT,
  browser     TEXT,
  os          TEXT,
  metadata    JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_qr_scan_events_code ON qr_scan_events(qr_code_id, scanned_at);

-- Create qr_folders table if not exists
CREATE TABLE IF NOT EXISTS qr_folders (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_folders_org ON qr_folders(org_id);

-- Create qr_templates table if not exists
CREATE TABLE IF NOT EXISTS qr_templates (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_global   BOOLEAN DEFAULT FALSE,
  config      JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger function to update last_scanned_at and total_scans
CREATE OR REPLACE FUNCTION update_qr_code_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE qr_codes SET
    total_scans = total_scans + 1,
    last_scanned_at = NEW.scanned_at
  WHERE id = NEW.qr_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger idempotently
DROP TRIGGER IF EXISTS trg_update_qr_code_stats ON qr_scan_events;
CREATE TRIGGER trg_update_qr_code_stats
  AFTER INSERT ON qr_scan_events
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_code_stats();
