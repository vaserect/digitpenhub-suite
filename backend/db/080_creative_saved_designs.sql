-- Creative tools: persist Graphic Design Editor / Flyer Builder / Logo Maker
-- work, which was previously client-only state lost on refresh.
CREATE TABLE IF NOT EXISTS saved_designs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tool       TEXT NOT NULL CHECK (tool IN ('graphic-design-editor','flyer-builder','logo-maker')),
  name       TEXT NOT NULL DEFAULT 'Untitled design',
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_designs_org_tool ON saved_designs(org_id, tool, updated_at DESC);
