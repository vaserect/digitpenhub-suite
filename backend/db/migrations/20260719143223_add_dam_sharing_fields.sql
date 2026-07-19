-- Add sharing fields to dam_assets table
ALTER TABLE dam_assets
ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS share_permissions VARCHAR(20) DEFAULT 'view',
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create index for share token lookups
CREATE INDEX IF NOT EXISTS idx_dam_assets_share_token ON dam_assets(share_token) WHERE share_token IS NOT NULL;

-- Create index for public assets
CREATE INDEX IF NOT EXISTS idx_dam_assets_is_public ON dam_assets(is_public) WHERE is_public = true;
