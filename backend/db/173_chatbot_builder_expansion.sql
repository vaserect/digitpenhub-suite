-- Migration 173: Chatbot Builder Expansion
-- Expands chatbot functionality to match Intercom/ManyChat benchmark
-- Date: 2026-07-18

-- Enhance existing chatbot_flows table
ALTER TABLE chatbot_flows 
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS fallback_message TEXT DEFAULT 'I didn''t understand that. Can you rephrase?',
ADD COLUMN IF NOT EXISTS handoff_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_chatbot_flows_updated_at ON chatbot_flows(updated_at DESC);

-- 1. Chatbot Conversations - Track individual chat sessions
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES chatbot_flows(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL,
  channel TEXT DEFAULT 'web',
  status TEXT DEFAULT 'active', -- active, completed, abandoned, handed_off
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  messages_count INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT FALSE,
  current_node_id TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_org ON chatbot_conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_flow ON chatbot_conversations(flow_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_visitor ON chatbot_conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_status ON chatbot_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_started ON chatbot_conversations(started_at DESC);

-- 2. Chatbot Messages - Store all messages in conversations
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  node_id TEXT,
  sender TEXT NOT NULL, -- bot, user, agent
  content TEXT,
  media_url TEXT,
  media_type TEXT, -- image, video, audio, file
  buttons JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created ON chatbot_messages(created_at DESC);

-- 3. Chatbot Visitors - Track unique visitors across sessions
CREATE TABLE IF NOT EXISTS chatbot_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id TEXT, -- For tracking across sessions (cookie/fingerprint)
  name TEXT,
  email TEXT,
  phone TEXT,
  attributes JSONB DEFAULT '{}',
  tags JSONB DEFAULT '[]',
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  conversations_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_visitors_org ON chatbot_visitors(org_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_visitors_external ON chatbot_visitors(external_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_visitors_email ON chatbot_visitors(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbot_visitors_org_external ON chatbot_visitors(org_id, external_id) WHERE external_id IS NOT NULL;

-- 4. Chatbot Templates - Pre-built flow templates
CREATE TABLE IF NOT EXISTS chatbot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general', -- support, sales, onboarding, lead_gen, general
  thumbnail_url TEXT,
  nodes JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_templates_org ON chatbot_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_templates_category ON chatbot_templates(category);
CREATE INDEX IF NOT EXISTS idx_chatbot_templates_system ON chatbot_templates(is_system);

-- 5. Chatbot Analytics Daily - Daily aggregated stats
CREATE TABLE IF NOT EXISTS chatbot_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES chatbot_flows(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  conversations_started INTEGER DEFAULT 0,
  conversations_completed INTEGER DEFAULT 0,
  conversations_abandoned INTEGER DEFAULT 0,
  avg_duration_seconds INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  handoffs INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbot_analytics_daily_unique ON chatbot_analytics_daily(org_id, flow_id, date);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_daily_date ON chatbot_analytics_daily(date DESC);

-- 6. Chatbot Node Analytics - Per-node performance tracking
CREATE TABLE IF NOT EXISTS chatbot_node_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES chatbot_flows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  drop_offs INTEGER DEFAULT 0,
  avg_time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbot_node_analytics_unique ON chatbot_node_analytics(org_id, flow_id, node_id, date);
CREATE INDEX IF NOT EXISTS idx_chatbot_node_analytics_date ON chatbot_node_analytics(date DESC);

-- 7. Chatbot Integrations - External service connections
CREATE TABLE IF NOT EXISTS chatbot_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- crm, email, webhook, sms, whatsapp
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_integrations_org ON chatbot_integrations(org_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_integrations_type ON chatbot_integrations(type);

-- 8. Chatbot Broadcasts - Mass messaging campaigns
CREATE TABLE IF NOT EXISTS chatbot_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flow_id UUID REFERENCES chatbot_flows(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  media_url TEXT,
  target_segment JSONB DEFAULT '{}', -- Filtering criteria
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, scheduled, sending, sent, failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_broadcasts_org ON chatbot_broadcasts(org_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_broadcasts_status ON chatbot_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_broadcasts_scheduled ON chatbot_broadcasts(scheduled_at);

-- 9. Chatbot A/B Tests - A/B testing experiments
CREATE TABLE IF NOT EXISTS chatbot_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES chatbot_flows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variant_a_nodes JSONB DEFAULT '[]',
  variant_b_nodes JSONB DEFAULT '[]',
  traffic_split INTEGER DEFAULT 50, -- Percentage to variant A (0-100)
  winner TEXT, -- a, b, or null
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  variant_a_conversions INTEGER DEFAULT 0,
  variant_b_conversions INTEGER DEFAULT 0,
  variant_a_views INTEGER DEFAULT 0,
  variant_b_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_ab_tests_org ON chatbot_ab_tests(org_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_ab_tests_flow ON chatbot_ab_tests(flow_id);

-- 10. Chatbot Widget Settings - Customization for live chat widget
CREATE TABLE IF NOT EXISTS chatbot_widget_settings (
  org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  position TEXT DEFAULT 'bottom-right', -- bottom-right, bottom-left, top-right, top-left
  color TEXT DEFAULT '#0066FF',
  greeting TEXT DEFAULT 'Hi! How can we help you today?',
  avatar_url TEXT,
  show_branding BOOLEAN DEFAULT TRUE,
  offline_message TEXT DEFAULT 'We''re currently offline. Leave us a message!',
  custom_css TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Chatbot Handoffs - Live agent handoff tracking
CREATE TABLE IF NOT EXISTS chatbot_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending, accepted, resolved, declined
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_handoffs_conversation ON chatbot_handoffs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_handoffs_agent ON chatbot_handoffs(agent_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_handoffs_status ON chatbot_handoffs(status);

-- 12. Chatbot User Attributes - Custom user data for personalization
CREATE TABLE IF NOT EXISTS chatbot_user_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES chatbot_visitors(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  type TEXT DEFAULT 'text', -- text, number, boolean, date
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_user_attributes_visitor ON chatbot_user_attributes(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_user_attributes_key ON chatbot_user_attributes(key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbot_user_attributes_unique ON chatbot_user_attributes(visitor_id, key);

-- Insert system templates
INSERT INTO chatbot_templates (org_id, name, description, category, is_system, nodes) VALUES
(NULL, 'Customer Support', 'Basic customer support flow with FAQ and handoff', 'support', TRUE, '[
  {"id":"start","type":"message","content":"Hi! How can I help you today?","buttons":[{"text":"Technical Issue","value":"tech"},{"text":"Billing Question","value":"billing"},{"text":"Talk to Agent","value":"agent"}]},
  {"id":"tech","type":"message","content":"I can help with technical issues. What seems to be the problem?"},
  {"id":"billing","type":"message","content":"For billing questions, please provide your account email."},
  {"id":"agent","type":"handoff","message":"Let me connect you with a live agent."}
]'::jsonb),

(NULL, 'Lead Qualification', 'Qualify leads and capture contact information', 'sales', TRUE, '[
  {"id":"start","type":"message","content":"Welcome! Let me help you find the right solution."},
  {"id":"name","type":"question","question":"What''s your name?","field":"name"},
  {"id":"email","type":"question","question":"What''s your email address?","field":"email","validation":"email"},
  {"id":"company","type":"question","question":"What company do you work for?","field":"company"},
  {"id":"qualify","type":"condition","field":"company","operator":"exists","true":"qualified","false":"end"},
  {"id":"qualified","type":"action","action":"tag","value":"qualified_lead"},
  {"id":"end","type":"message","content":"Thanks! We''ll be in touch soon."}
]'::jsonb),

(NULL, 'Product Demo Booking', 'Schedule product demonstrations', 'sales', TRUE, '[
  {"id":"start","type":"message","content":"Interested in a demo? Let''s get you scheduled!"},
  {"id":"name","type":"question","question":"What''s your name?","field":"name"},
  {"id":"email","type":"question","question":"What''s your email?","field":"email","validation":"email"},
  {"id":"date","type":"question","question":"What date works best for you?","field":"demo_date","type":"date"},
  {"id":"confirm","type":"action","action":"create_appointment","data":{"type":"demo"}},
  {"id":"end","type":"message","content":"Great! You''ll receive a confirmation email shortly."}
]'::jsonb),

(NULL, 'Welcome & Onboarding', 'Welcome new users and guide them through setup', 'onboarding', TRUE, '[
  {"id":"start","type":"message","content":"Welcome! Let me help you get started.","buttons":[{"text":"Quick Tour","value":"tour"},{"text":"Setup Account","value":"setup"},{"text":"Skip","value":"skip"}]},
  {"id":"tour","type":"message","content":"Here''s a quick overview of our platform..."},
  {"id":"setup","type":"message","content":"Let''s set up your account. First, tell me about your business."},
  {"id":"skip","type":"message","content":"No problem! You can always access help from the menu."}
]'::jsonb),

(NULL, 'Feedback Collection', 'Collect customer feedback and satisfaction ratings', 'general', TRUE, '[
  {"id":"start","type":"message","content":"We''d love your feedback! How was your experience?","buttons":[{"text":"😊 Great","value":"5"},{"text":"🙂 Good","value":"4"},{"text":"😐 Okay","value":"3"},{"text":"😞 Poor","value":"2"}]},
  {"id":"5","type":"message","content":"Wonderful! Would you mind leaving us a review?"},
  {"id":"4","type":"message","content":"Thanks! What could we improve?"},
  {"id":"3","type":"message","content":"We appreciate your honesty. What went wrong?"},
  {"id":"2","type":"message","content":"We''re sorry to hear that. Please tell us what happened so we can make it right."},
  {"id":"details","type":"question","question":"Please share more details:","field":"feedback"},
  {"id":"end","type":"message","content":"Thank you for your feedback!"}
]'::jsonb);

-- Create default widget settings for existing organizations
INSERT INTO chatbot_widget_settings (org_id)
SELECT id FROM organizations
ON CONFLICT (org_id) DO NOTHING;

COMMENT ON TABLE chatbot_conversations IS 'Individual chat sessions between visitors and chatbots';
COMMENT ON TABLE chatbot_messages IS 'All messages exchanged in conversations';
COMMENT ON TABLE chatbot_visitors IS 'Unique visitors tracked across multiple conversations';
COMMENT ON TABLE chatbot_templates IS 'Pre-built chatbot flow templates';
COMMENT ON TABLE chatbot_analytics_daily IS 'Daily aggregated chatbot performance metrics';
COMMENT ON TABLE chatbot_node_analytics IS 'Per-node performance tracking for flow optimization';
COMMENT ON TABLE chatbot_integrations IS 'External service integrations (CRM, email, webhooks)';
COMMENT ON TABLE chatbot_broadcasts IS 'Mass messaging campaigns to visitor segments';
COMMENT ON TABLE chatbot_ab_tests IS 'A/B testing experiments for flow optimization';
COMMENT ON TABLE chatbot_widget_settings IS 'Customization settings for the live chat widget';
COMMENT ON TABLE chatbot_handoffs IS 'Live agent handoff requests and tracking';
COMMENT ON TABLE chatbot_user_attributes IS 'Custom attributes for visitor personalization';
