-- Customer Segmentation Engine Database Schema
-- Module 32 of 40 in Marketing Category
-- Benchmark: Segment / Klaviyo Segmentation

-- Enhanced segments table (already exists, but adding columns)
ALTER TABLE segments ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN DEFAULT true;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS refresh_frequency TEXT DEFAULT 'realtime' CHECK (refresh_frequency IN ('realtime', 'hourly', 'daily', 'manual'));
ALTER TABLE segments ADD COLUMN IF NOT EXISTS last_refresh_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Segment members table (stores calculated membership)
CREATE TABLE IF NOT EXISTS segment_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(segment_id, contact_id)
);

CREATE INDEX IF NOT EXISTS segment_members_segment_id_idx ON segment_members(segment_id);
CREATE INDEX IF NOT EXISTS segment_members_contact_id_idx ON segment_members(contact_id);
CREATE INDEX IF NOT EXISTS segment_members_is_active_idx ON segment_members(is_active);

-- Segment conditions (structured rule storage)
CREATE TABLE IF NOT EXISTS segment_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES segment_conditions(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('group', 'rule')),
  logical_operator TEXT CHECK (logical_operator IN ('AND', 'OR')),
  field_name TEXT,
  operator TEXT,
  value JSONB,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS segment_conditions_segment_id_idx ON segment_conditions(segment_id);
CREATE INDEX IF NOT EXISTS segment_conditions_parent_id_idx ON segment_conditions(parent_id);

-- Segment history (track changes over time)
CREATE TABLE IF NOT EXISTS segment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  member_count INTEGER NOT NULL,
  added_count INTEGER DEFAULT 0,
  removed_count INTEGER DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS segment_history_segment_id_idx ON segment_history(segment_id);
CREATE INDEX IF NOT EXISTS segment_history_recorded_at_idx ON segment_history(recorded_at DESC);

-- Segment analytics (daily aggregates)
CREATE TABLE IF NOT EXISTS segment_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  member_count INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  churned_members INTEGER DEFAULT 0,
  growth_rate DECIMAL(5,2),
  engagement_rate DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(segment_id, date)
);

CREATE INDEX IF NOT EXISTS segment_analytics_daily_segment_id_idx ON segment_analytics_daily(segment_id);
CREATE INDEX IF NOT EXISTS segment_analytics_daily_date_idx ON segment_analytics_daily(date DESC);

-- Segment calculations (track calculation jobs)
CREATE TABLE IF NOT EXISTS segment_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  members_added INTEGER DEFAULT 0,
  members_removed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS segment_calculations_segment_id_idx ON segment_calculations(segment_id);
CREATE INDEX IF NOT EXISTS segment_calculations_status_idx ON segment_calculations(status);
CREATE INDEX IF NOT EXISTS segment_calculations_created_at_idx ON segment_calculations(created_at DESC);

-- Segment events (member added/removed events)
CREATE TABLE IF NOT EXISTS segment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('added', 'removed')),
  triggered_by TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS segment_events_segment_id_idx ON segment_events(segment_id);
CREATE INDEX IF NOT EXISTS segment_events_contact_id_idx ON segment_events(contact_id);
CREATE INDEX IF NOT EXISTS segment_events_event_type_idx ON segment_events(event_type);
CREATE INDEX IF NOT EXISTS segment_events_created_at_idx ON segment_events(created_at DESC);

-- Segment templates (pre-built segment definitions)
CREATE TABLE IF NOT EXISTS segment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  criteria_json JSONB NOT NULL,
  is_system BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS segment_templates_category_idx ON segment_templates(category);
CREATE INDEX IF NOT EXISTS segment_templates_is_system_idx ON segment_templates(is_system);

-- Insert system segment templates
INSERT INTO segment_templates (name, description, category, criteria_json, is_system) VALUES
('Active Customers', 'Customers who made a purchase in the last 30 days', 'Engagement', '{"conditions":[{"field":"last_purchase_date","operator":"within_last","value":30,"unit":"days"}]}'::jsonb, true),
('High Value Customers', 'Customers with lifetime value over $1000', 'Value', '{"conditions":[{"field":"lifetime_value","operator":"greater_than","value":1000}]}'::jsonb, true),
('Email Engaged', 'Contacts who opened an email in the last 7 days', 'Engagement', '{"conditions":[{"field":"last_email_opened","operator":"within_last","value":7,"unit":"days"}]}'::jsonb, true),
('Cart Abandoners', 'Contacts who added to cart but did not purchase', 'Behavior', '{"conditions":[{"field":"cart_abandoned","operator":"equals","value":true},{"field":"last_purchase_date","operator":"is_null"}]}'::jsonb, true),
('New Subscribers', 'Contacts added in the last 7 days', 'Lifecycle', '{"conditions":[{"field":"created_at","operator":"within_last","value":7,"unit":"days"}]}'::jsonb, true)
ON CONFLICT DO NOTHING;
