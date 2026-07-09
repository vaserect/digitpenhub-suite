CREATE TABLE IF NOT EXISTS segments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  criteria_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  member_count  INT NOT NULL DEFAULT 0,
  last_calculated TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);
CREATE INDEX IF NOT EXISTS idx_segments_org ON segments(org_id);

CREATE TABLE IF NOT EXISTS segment_members (
  segment_id    UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (segment_id, entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_seg_members ON segment_members(entity_type, entity_id);
