-- Digital Asset Management (DAM)
-- Media library with tagging, transformations, CDN paths, and cross-module usage tracking.

CREATE TABLE IF NOT EXISTS dam_folders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id     UUID REFERENCES dam_folders(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, parent_id, name)
);
CREATE INDEX IF NOT EXISTS idx_dam_folders_org ON dam_folders(org_id, parent_id);

CREATE TABLE IF NOT EXISTS dam_tags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  color         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

CREATE TABLE IF NOT EXISTS dam_assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  folder_id     UUID REFERENCES dam_folders(id) ON DELETE SET NULL,
  filename      TEXT NOT NULL,
  disk_path     TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  size_bytes    BIGINT NOT NULL,
  width         INT,
  height        INT,
  duration_secs NUMERIC,
  alt_text      TEXT,
  caption       TEXT,
  credit        TEXT,
  is_public     BOOLEAN NOT NULL DEFAULT false,
  thumb_path    TEXT,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dam_assets_org ON dam_assets(org_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_dam_assets_mime ON dam_assets(org_id, mime_type);
CREATE INDEX IF NOT EXISTS idx_dam_assets_search ON dam_assets USING gin(to_tsvector('english', filename || ' ' || coalesce(alt_text,'') || ' ' || coalesce(caption,'')));

CREATE TABLE IF NOT EXISTS dam_asset_tags (
  asset_id      UUID NOT NULL REFERENCES dam_assets(id) ON DELETE CASCADE,
  tag_id        UUID NOT NULL REFERENCES dam_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (asset_id, tag_id)
);

CREATE TABLE IF NOT EXISTS dam_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id      UUID NOT NULL REFERENCES dam_assets(id) ON DELETE CASCADE,
  module_slug   TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  field         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dam_usage_asset ON dam_usage(asset_id);
CREATE INDEX IF NOT EXISTS idx_dam_usage_module ON dam_usage(module_slug, resource_type, resource_id);
