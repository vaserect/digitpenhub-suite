-- Migration 170: Landing Page Heat/Scroll Analytics - Core Tables
-- Benchmark: Hotjar / Microsoft Clarity
-- Created: 2026-07-18

-- 1. Heatmap aggregated data
CREATE TABLE IF NOT EXISTS heatmap_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_title TEXT,
  heatmap_type VARCHAR(20) NOT NULL CHECK (heatmap_type IN ('click', 'scroll', 'move', 'attention')),
  viewport_width INTEGER NOT NULL,
  viewport_height INTEGER NOT NULL,
  data_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  session_count INTEGER NOT NULL DEFAULT 0,
  last_aggregated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_heatmap_data_org_page ON heatmap_data(org_id, page_url, heatmap_type);
CREATE INDEX idx_heatmap_data_updated ON heatmap_data(org_id, updated_at DESC);

-- 2. Page snapshots
CREATE TABLE IF NOT EXISTS heatmap_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  viewport_width INTEGER NOT NULL,
  viewport_height INTEGER NOT NULL,
  screenshot_url TEXT,
  dom_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_heatmap_snapshots_org_page ON heatmap_snapshots(org_id, page_url);

-- 3. Click events
CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES session_recordings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  viewport_width INTEGER NOT NULL,
  viewport_height INTEGER NOT NULL,
  element_selector TEXT,
  element_text TEXT,
  is_rage_click BOOLEAN DEFAULT FALSE,
  is_dead_click BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_click_events_session ON click_events(session_id);
CREATE INDEX idx_click_events_org_page ON click_events(org_id, page_url, timestamp DESC);
CREATE INDEX idx_click_events_rage ON click_events(org_id, is_rage_click) WHERE is_rage_click = TRUE;

-- 4. Scroll events
CREATE TABLE IF NOT EXISTS scroll_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES session_recordings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  max_scroll_depth INTEGER NOT NULL,
  max_scroll_percent INTEGER NOT NULL,
  viewport_height INTEGER NOT NULL,
  page_height INTEGER NOT NULL,
  scroll_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scroll_events_session ON scroll_events(session_id);
CREATE INDEX idx_scroll_events_org_page ON scroll_events(org_id, page_url, timestamp DESC);

-- 5. Mouse events
CREATE TABLE IF NOT EXISTS mouse_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES session_recordings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  movement_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  viewport_width INTEGER NOT NULL,
  viewport_height INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mouse_events_session ON mouse_events(session_id);
CREATE INDEX idx_mouse_events_org_page ON mouse_events(org_id, page_url, timestamp DESC);

-- 6. Form events
CREATE TABLE IF NOT EXISTS form_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES session_recordings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  form_selector TEXT,
  field_selector TEXT NOT NULL,
  field_name TEXT,
  field_type VARCHAR(50),
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('focus', 'blur', 'change', 'submit', 'abandon')),
  field_value TEXT,
  time_to_interact INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_form_events_session ON form_events(session_id);
CREATE INDEX idx_form_events_org_page ON form_events(org_id, page_url, event_type);

-- 7. Error events
CREATE TABLE IF NOT EXISTS error_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES session_recordings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_type VARCHAR(100),
  line_number INTEGER,
  column_number INTEGER,
  source_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_events_session ON error_events(session_id);
CREATE INDEX idx_error_events_org ON error_events(org_id, timestamp DESC);

-- 8. Network events
CREATE TABLE IF NOT EXISTS network_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES session_recordings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_url TEXT NOT NULL,
  request_method VARCHAR(10),
  status_code INTEGER,
  duration_ms INTEGER,
  request_size INTEGER,
  response_size INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_network_events_session ON network_events(session_id);

-- 9. Console logs
CREATE TABLE IF NOT EXISTS console_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES session_recordings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('log', 'info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_console_logs_session ON console_logs(session_id);
CREATE INDEX idx_console_logs_level ON console_logs(org_id, log_level) WHERE log_level IN ('error', 'warn');

-- 10. Page snapshots for replay
CREATE TABLE IF NOT EXISTS page_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES session_recordings(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_type VARCHAR(20) NOT NULL CHECK (snapshot_type IN ('full', 'incremental')),
  snapshot_data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_snapshots_session ON page_snapshots(session_id, timestamp);

-- 11. Daily analytics
CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  date DATE NOT NULL,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_pageviews INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  avg_session_duration INTEGER,
  avg_scroll_depth INTEGER,
  bounce_rate DECIMAL(5,2),
  total_clicks INTEGER NOT NULL DEFAULT 0,
  rage_clicks INTEGER NOT NULL DEFAULT 0,
  dead_clicks INTEGER NOT NULL DEFAULT 0,
  form_starts INTEGER NOT NULL DEFAULT 0,
  form_submits INTEGER NOT NULL DEFAULT 0,
  form_abandons INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  device_breakdown JSONB DEFAULT '{}'::jsonb,
  browser_breakdown JSONB DEFAULT '{}'::jsonb,
  country_breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_analytics_daily_unique ON analytics_daily(org_id, page_url, date);
CREATE INDEX idx_analytics_daily_org_date ON analytics_daily(org_id, date DESC);

-- 12. Saved filters
CREATE TABLE IF NOT EXISTS heatmap_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  filter_config JSONB NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_heatmap_filters_org ON heatmap_filters(org_id);
CREATE INDEX idx_heatmap_filters_user ON heatmap_filters(user_id);

-- 13. Feedback responses
CREATE TABLE IF NOT EXISTS feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id UUID REFERENCES session_recordings(id) ON DELETE SET NULL,
  page_url TEXT NOT NULL,
  widget_id UUID,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  feedback_type VARCHAR(50),
  visitor_hash TEXT,
  device_type VARCHAR(20),
  browser VARCHAR(100),
  country VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_responses_org ON feedback_responses(org_id, created_at DESC);
CREATE INDEX idx_feedback_responses_page ON feedback_responses(org_id, page_url);

-- 14. Tracking settings
CREATE TABLE IF NOT EXISTS tracking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_url_pattern TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  track_clicks BOOLEAN DEFAULT TRUE,
  track_scrolls BOOLEAN DEFAULT TRUE,
  track_mouse BOOLEAN DEFAULT TRUE,
  track_forms BOOLEAN DEFAULT TRUE,
  track_errors BOOLEAN DEFAULT TRUE,
  track_console BOOLEAN DEFAULT FALSE,
  track_network BOOLEAN DEFAULT FALSE,
  sampling_rate INTEGER DEFAULT 100 CHECK (sampling_rate >= 0 AND sampling_rate <= 100),
  privacy_mode VARCHAR(20) DEFAULT 'balanced' CHECK (privacy_mode IN ('strict', 'balanced', 'minimal')),
  data_retention_days INTEGER DEFAULT 90,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tracking_settings_org ON tracking_settings(org_id);

-- 15. Recording shares
CREATE TABLE IF NOT EXISTS recording_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES session_recordings(id) ON DELETE CASCADE,
  share_token VARCHAR(64) NOT NULL UNIQUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  password_hash TEXT,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recording_shares_token ON recording_shares(share_token);
CREATE INDEX idx_recording_shares_session ON recording_shares(session_id);

-- Enhance session_recordings
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS device_type VARCHAR(20);
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS browser VARCHAR(100);
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS browser_version VARCHAR(50);
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS os VARCHAR(100);
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS os_version VARCHAR(50);
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS screen_width INTEGER;
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS screen_height INTEGER;
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS viewport_width INTEGER;
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS viewport_height INTEGER;
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255);
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255);
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS has_rage_clicks BOOLEAN DEFAULT FALSE;
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS has_errors BOOLEAN DEFAULT FALSE;
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS max_scroll_percent INTEGER;
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE session_recordings ADD COLUMN IF NOT EXISTS form_submits INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sr_device ON session_recordings(org_id, device_type);
CREATE INDEX IF NOT EXISTS idx_sr_country ON session_recordings(org_id, country);
CREATE INDEX IF NOT EXISTS idx_sr_rage ON session_recordings(org_id, has_rage_clicks) WHERE has_rage_clicks = TRUE;
CREATE INDEX IF NOT EXISTS idx_sr_errors ON session_recordings(org_id, has_errors) WHERE has_errors = TRUE;
