-- =====================================================
-- Funnel Builder — Ensure funnel_conversions table exists
-- Handles both 135 (original) and standalone deployments
-- =====================================================

CREATE TABLE IF NOT EXISTS funnel_conversions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id       UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  session_id      TEXT,
  lead_id         UUID REFERENCES contacts(id) ON DELETE SET NULL,
  converted_from  TEXT,
  value           NUMERIC(12,2) DEFAULT 0,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_conversions_funnel ON funnel_conversions(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_conversions_session ON funnel_conversions(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_conversions_date ON funnel_conversions(created_at DESC);
