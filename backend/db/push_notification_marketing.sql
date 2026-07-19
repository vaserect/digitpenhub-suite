-- Push Notification Marketing Module Database Schema
-- Module 31 of 40 in Marketing Category
-- Benchmark: OneSignal / PushEngage

-- Main push campaigns table
CREATE TABLE IF NOT EXISTS push_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('web', 'mobile', 'both')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT,
  image_url TEXT,
  badge_url TEXT,
  click_url TEXT,
  action_buttons JSONB DEFAULT '[]'::jsonb,
  schedule_type TEXT NOT NULL DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'UTC',
  recurring_pattern JSONB,
  segment_ids UUID[],
  targeting_rules JSONB DEFAULT '{}'::jsonb,
  is_ab_test BOOLEAN DEFAULT false,
  ab_test_variants JSONB,
  ab_test_winner TEXT,
  ttl INTEGER DEFAULT 259200,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  require_interaction BOOLEAN DEFAULT false,
  silent BOOLEAN DEFAULT false,
  vibrate INTEGER[],
  sound TEXT,
  tags TEXT[],
  custom_data JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS push_campaigns_org_id_idx ON push_campaigns(org_id);
CREATE INDEX IF NOT EXISTS push_campaigns_status_idx ON push_campaigns(status);
CREATE INDEX IF NOT EXISTS push_campaigns_scheduled_at_idx ON push_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS push_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  endpoint TEXT NOT NULL,
  auth_key TEXT,
  p256dh_key TEXT,
  device_token TEXT,
  device_type TEXT,
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  browser TEXT,
  browser_version TEXT,
  subscription_data JSONB,
  is_active BOOLEAN DEFAULT true,
  opted_in BOOLEAN DEFAULT true,
  opted_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opted_out_at TIMESTAMP WITH TIME ZONE,
  country TEXT,
  city TEXT,
  timezone TEXT,
  language TEXT,
  tags TEXT[],
  custom_attributes JSONB DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscribers_org_id_idx ON push_subscribers(org_id);
CREATE INDEX IF NOT EXISTS push_subscribers_user_id_idx ON push_subscribers(user_id);
CREATE INDEX IF NOT EXISTS push_subscribers_contact_id_idx ON push_subscribers(contact_id);
CREATE INDEX IF NOT EXISTS push_subscribers_platform_idx ON push_subscribers(platform);
CREATE INDEX IF NOT EXISTS push_subscribers_is_active_idx ON push_subscribers(is_active);
CREATE INDEX IF NOT EXISTS push_subscribers_tags_idx ON push_subscribers USING gin(tags);

CREATE TABLE IF NOT EXISTS push_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES push_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES push_subscribers(id) ON DELETE CASCADE,
  variant TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'clicked', 'dismissed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_deliveries_org_id_idx ON push_deliveries(org_id);
CREATE INDEX IF NOT EXISTS push_deliveries_campaign_id_idx ON push_deliveries(campaign_id);
CREATE INDEX IF NOT EXISTS push_deliveries_subscriber_id_idx ON push_deliveries(subscriber_id);
CREATE INDEX IF NOT EXISTS push_deliveries_status_idx ON push_deliveries(status);
CREATE INDEX IF NOT EXISTS push_deliveries_created_at_idx ON push_deliveries(created_at DESC);

CREATE TABLE IF NOT EXISTS push_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES push_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sent INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  dismissed INTEGER DEFAULT 0,
  delivery_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  web_sent INTEGER DEFAULT 0,
  web_clicked INTEGER DEFAULT 0,
  mobile_sent INTEGER DEFAULT 0,
  mobile_clicked INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, campaign_id, date)
);

CREATE INDEX IF NOT EXISTS push_analytics_daily_org_id_date_idx ON push_analytics_daily(org_id, date DESC);
CREATE INDEX IF NOT EXISTS push_analytics_daily_campaign_id_idx ON push_analytics_daily(campaign_id);

CREATE TABLE IF NOT EXISTS push_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  subscriber_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_segments_org_id_idx ON push_segments(org_id);

CREATE TABLE IF NOT EXISTS push_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT,
  image_url TEXT,
  click_url TEXT,
  action_buttons JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_templates_org_id_idx ON push_templates(org_id);
CREATE INDEX IF NOT EXISTS push_templates_is_system_idx ON push_templates(is_system);

CREATE TABLE IF NOT EXISTS push_automation_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event', 'behavior', 'date', 'api')),
  trigger_event TEXT,
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  campaign_id UUID REFERENCES push_campaigns(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  delay_minutes INTEGER DEFAULT 0,
  triggered_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_automation_triggers_org_id_idx ON push_automation_triggers(org_id);
CREATE INDEX IF NOT EXISTS push_automation_triggers_is_active_idx ON push_automation_triggers(is_active);

INSERT INTO push_templates (name, description, category, title, body, icon_url, action_buttons, is_system) VALUES
('Welcome New User', 'Welcome message for new subscribers', 'Onboarding', 'Welcome to {{org_name}}!', 'Thanks for subscribing! We are excited to have you here.', '/icons/welcome.png', '[{"action": "get_started", "title": "Get Started"}]'::jsonb, true),
('Cart Abandonment', 'Remind users about items in cart', 'E-commerce', 'You left items in your cart', 'Complete your purchase now and get 10% off!', '/icons/cart.png', '[{"action": "view_cart", "title": "View Cart"}]'::jsonb, true),
('Flash Sale', 'Announce limited-time offers', 'Promotions', '⚡ Flash Sale - 50% Off!', 'Limited time only. Shop now before it is gone!', '/icons/sale.png', '[{"action": "shop_now", "title": "Shop Now"}]'::jsonb, true),
('New Content', 'Notify about new blog posts or content', 'Content', 'New: {{content_title}}', 'Check out our latest article!', '/icons/content.png', '[{"action": "read_now", "title": "Read Now"}]'::jsonb, true),
('Event Reminder', 'Remind about upcoming events', 'Events', 'Reminder: {{event_name}}', 'Your event starts in {{time_until}}', '/icons/event.png', '[{"action": "view_details", "title": "View Details"}]'::jsonb, true)
ON CONFLICT DO NOTHING;
