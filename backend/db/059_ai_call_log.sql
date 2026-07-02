-- Milestone 59: AI call reliability logging — so failures are visible instead
-- of a silent mystery (continuous-improvement Step 1e).

CREATE TABLE ai_call_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  feature      TEXT        NOT NULL,
  provider     TEXT        NOT NULL,
  success      BOOLEAN     NOT NULL,
  used_fallback BOOLEAN    NOT NULL DEFAULT false,
  error_message TEXT,
  duration_ms  INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_call_log_feature_idx ON ai_call_log (feature, created_at DESC);
