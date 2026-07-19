-- Migration 139: Marketing Automation - Cross-Channel Enhancement
-- Extends existing automation system (020_marketing_automation.sql) with:
-- 1. SMS/WhatsApp channel support
-- 2. Conditional logic and branching
-- 3. Advanced triggers (page visit, link click, purchase, etc.)
-- 4. Goal tracking and conversion optimization
-- 5. Lead scoring integration
-- 6. Multi-channel analytics
-- 7. Split testing for automation paths
-- 8. Time windows and send optimization
-- 9. CRM integration (deals, contact stages)
-- 10. Advanced wait conditions
-- 11. Automation templates library

-- ============================================================================
-- EXTEND EXISTING TABLES
-- ============================================================================

-- Extend automation_workflows with new trigger types and settings
ALTER TABLE automation_workflows
  ADD COLUMN IF NOT EXISTS goal_type TEXT CHECK (goal_type IN ('conversion','engagement','lead_score','deal_created','custom')),
  ADD COLUMN IF NOT EXISTS goal_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_window_start TIME,
  ADD COLUMN IF NOT EXISTS time_window_end TIME,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS send_optimization BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_scoring_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_score_change INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exit_on_goal BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES automation_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('welcome','nurture','re_engagement','abandoned_cart','post_purchase','event_based','lead_scoring')),
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add new trigger types to existing CHECK constraint
ALTER TABLE automation_workflows DROP CONSTRAINT IF EXISTS automation_workflows_trigger_type_check;
ALTER TABLE automation_workflows ADD CONSTRAINT automation_workflows_trigger_type_check 
  CHECK (trigger_type IN (
    'manual','new_subscriber','tag_added','form_submitted',
    'page_visit','link_click','email_opened','email_clicked',
    'purchase','cart_abandoned','sms_reply','whatsapp_reply',
    'api_event','date_based','lead_score_change','deal_stage_change'
  ));

CREATE INDEX IF NOT EXISTS automation_workflows_category_idx ON automation_workflows(org_id, category);
CREATE INDEX IF NOT EXISTS automation_workflows_template_idx ON automation_workflows(template_id);

-- Extend automation_steps with new step types and conditional logic
ALTER TABLE automation_steps
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email' CHECK (channel IN ('email','sms','whatsapp','multi')),
  ADD COLUMN IF NOT EXISTS condition_type TEXT CHECK (condition_type IN ('if_then','split_test','wait_until','goal_check')),
  ADD COLUMN IF NOT EXISTS condition_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS true_path_next_step INT,
  ADD COLUMN IF NOT EXISTS false_path_next_step INT,
  ADD COLUMN IF NOT EXISTS split_percentage INT CHECK (split_percentage >= 0 AND split_percentage <= 100),
  ADD COLUMN IF NOT EXISTS wait_until_condition JSONB,
  ADD COLUMN IF NOT EXISTS max_wait_hours INT DEFAULT 24,
  ADD COLUMN IF NOT EXISTS time_window_start TIME,
  ADD COLUMN IF NOT EXISTS time_window_end TIME,
  ADD COLUMN IF NOT EXISTS lead_score_change INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS crm_action TEXT CHECK (crm_action IN ('create_deal','update_contact_stage','add_note','create_task')),
  ADD COLUMN IF NOT EXISTS crm_config JSONB DEFAULT '{}';

-- Add new step types to existing CHECK constraint
ALTER TABLE automation_steps DROP CONSTRAINT IF EXISTS automation_steps_step_type_check;
ALTER TABLE automation_steps ADD CONSTRAINT automation_steps_step_type_check
  CHECK (step_type IN (
    'send_email','wait_days','add_tag','remove_tag','add_to_list','webhook',
    'send_sms','send_whatsapp','condition','split_test','wait_until',
    'update_lead_score','update_contact_field','crm_action','goal_check','end_workflow'
  ));

CREATE INDEX IF NOT EXISTS automation_steps_channel_idx ON automation_steps(workflow_id, channel);
CREATE INDEX IF NOT EXISTS automation_steps_condition_idx ON automation_steps(workflow_id, condition_type);

-- Extend automation_enrollments with goal tracking and path history
ALTER TABLE automation_enrollments
  ADD COLUMN IF NOT EXISTS goal_achieved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS goal_achieved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS path_taken TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS split_variant TEXT,
  ADD COLUMN IF NOT EXISTS lead_score_start INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_score_current INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_emails_sent INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sms_sent INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_whatsapp_sent INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS automation_enrollments_goal_idx ON automation_enrollments(workflow_id, goal_achieved);
CREATE INDEX IF NOT EXISTS automation_enrollments_variant_idx ON automation_enrollments(workflow_id, split_variant);
CREATE INDEX IF NOT EXISTS automation_enrollments_activity_idx ON automation_enrollments(org_id, last_activity_at);

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- Automation Templates Library (ActiveCampaign Recipes / HubSpot Workflow Templates)
CREATE TABLE automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('welcome','nurture','re_engagement','abandoned_cart','post_purchase','event_based','lead_scoring')),
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  steps_config JSONB NOT NULL, -- Array of step definitions
  goal_type TEXT,
  goal_config JSONB DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  usage_count INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  tags TEXT[] DEFAULT '{}',
  preview_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX automation_templates_category_idx ON automation_templates(category);
CREATE INDEX automation_templates_org_idx ON automation_templates(org_id);
CREATE INDEX automation_templates_system_idx ON automation_templates(is_system);

-- Automation Goals (Conversion tracking and exit conditions)
CREATE TABLE automation_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('conversion','engagement','lead_score','deal_created','custom')),
  goal_config JSONB NOT NULL, -- e.g., {"target_score": 100, "deal_stage": "closed_won"}
  achieved_count INT DEFAULT 0,
  total_enrolled INT DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX automation_goals_workflow_idx ON automation_goals(workflow_id);

-- Automation Step Execution Log (Enhanced from automation_step_runs)
CREATE TABLE automation_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES automation_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES automation_steps(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL,
  channel TEXT,
  executed_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success','failed','skipped','pending')),
  error_message TEXT,
  execution_time_ms INT,
  metadata JSONB DEFAULT '{}', -- Channel-specific data (message_id, send_status, etc.)
  condition_result BOOLEAN, -- For conditional steps
  path_taken TEXT -- 'true_path' or 'false_path' for conditions
);

CREATE INDEX automation_step_executions_enrollment_idx ON automation_step_executions(enrollment_id, executed_at DESC);
CREATE INDEX automation_step_executions_step_idx ON automation_step_executions(step_id);
CREATE INDEX automation_step_executions_status_idx ON automation_step_executions(status);

-- Automation Analytics (Multi-channel performance tracking)
CREATE TABLE automation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_enrolled INT DEFAULT 0,
  total_active INT DEFAULT 0,
  total_completed INT DEFAULT 0,
  total_failed INT DEFAULT 0,
  goal_achieved_count INT DEFAULT 0,
  emails_sent INT DEFAULT 0,
  emails_opened INT DEFAULT 0,
  emails_clicked INT DEFAULT 0,
  sms_sent INT DEFAULT 0,
  sms_delivered INT DEFAULT 0,
  sms_replied INT DEFAULT 0,
  whatsapp_sent INT DEFAULT 0,
  whatsapp_delivered INT DEFAULT 0,
  whatsapp_replied INT DEFAULT 0,
  avg_completion_time_hours DECIMAL(10,2),
  avg_lead_score_change DECIMAL(10,2),
  revenue_generated DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX automation_analytics_unique_idx ON automation_analytics(org_id, workflow_id, date);
CREATE INDEX automation_analytics_workflow_date_idx ON automation_analytics(workflow_id, date DESC);

-- Automation Triggers (Event tracking for trigger conditions)
CREATE TABLE automation_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  trigger_data JSONB DEFAULT '{}', -- Event-specific data
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  enrollment_id UUID REFERENCES automation_enrollments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX automation_triggers_org_workflow_idx ON automation_triggers(org_id, workflow_id, processed);
CREATE INDEX automation_triggers_contact_idx ON automation_triggers(contact_email);
CREATE INDEX automation_triggers_created_idx ON automation_triggers(created_at);

-- Automation Split Tests (A/B testing for automation paths)
CREATE TABLE automation_split_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES automation_steps(id) ON DELETE CASCADE,
  variant_a_name TEXT NOT NULL,
  variant_b_name TEXT NOT NULL,
  variant_a_config JSONB NOT NULL,
  variant_b_config JSONB NOT NULL,
  split_percentage INT DEFAULT 50 CHECK (split_percentage >= 0 AND split_percentage <= 100),
  variant_a_count INT DEFAULT 0,
  variant_b_count INT DEFAULT 0,
  variant_a_goal_achieved INT DEFAULT 0,
  variant_b_goal_achieved INT DEFAULT 0,
  winner TEXT CHECK (winner IN ('variant_a','variant_b','none')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','paused')),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX automation_split_tests_workflow_idx ON automation_split_tests(workflow_id);
CREATE INDEX automation_split_tests_step_idx ON automation_split_tests(step_id);

-- Automation Contact Tags (Unified tagging across channels)
CREATE TABLE automation_contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  tag TEXT NOT NULL,
  source TEXT CHECK (source IN ('automation','manual','import','api')),
  workflow_id UUID REFERENCES automation_workflows(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, contact_email, tag)
);

CREATE INDEX automation_contact_tags_org_contact_idx ON automation_contact_tags(org_id, contact_email);
CREATE INDEX automation_contact_tags_tag_idx ON automation_contact_tags(org_id, tag);

-- Automation Lead Scoring (Integration with lead scoring system)
CREATE TABLE automation_lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  workflow_id UUID REFERENCES automation_workflows(id) ON DELETE SET NULL,
  score_change INT NOT NULL,
  reason TEXT,
  previous_score INT DEFAULT 0,
  new_score INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX automation_lead_scores_org_contact_idx ON automation_lead_scores(org_id, contact_email);
CREATE INDEX automation_lead_scores_workflow_idx ON automation_lead_scores(workflow_id);
CREATE INDEX automation_lead_scores_created_idx ON automation_lead_scores(created_at DESC);

-- Automation CRM Actions (Deal creation, contact updates, etc.)
CREATE TABLE automation_crm_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES automation_enrollments(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('create_deal','update_contact_stage','add_note','create_task')),
  action_config JSONB NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success','failed','pending')),
  error_message TEXT,
  result_data JSONB DEFAULT '{}'
);

CREATE INDEX automation_crm_actions_enrollment_idx ON automation_crm_actions(enrollment_id);
CREATE INDEX automation_crm_actions_org_idx ON automation_crm_actions(org_id, executed_at DESC);

-- Automation Wait Conditions (Advanced wait logic)
CREATE TABLE automation_wait_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES automation_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES automation_steps(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('time_elapsed','event_occurred','field_changed','goal_achieved')),
  condition_config JSONB NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  condition_met BOOLEAN DEFAULT false,
  condition_met_at TIMESTAMPTZ,
  checked_count INT DEFAULT 0,
  last_checked_at TIMESTAMPTZ
);

CREATE INDEX automation_wait_conditions_enrollment_idx ON automation_wait_conditions(enrollment_id, condition_met);
CREATE INDEX automation_wait_conditions_expires_idx ON automation_wait_conditions(expires_at);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX automation_enrollments_workflow_status_idx ON automation_enrollments(workflow_id, status, updated_at);
CREATE INDEX automation_step_executions_channel_status_idx ON automation_step_executions(channel, status, executed_at DESC);

-- ============================================================================
-- SAMPLE DATA (System Templates)
-- ============================================================================

INSERT INTO automation_templates (name, description, category, trigger_type, trigger_config, steps_config, goal_type, goal_config, is_system, tags) VALUES
('Welcome Series - Email + SMS', 'Multi-channel welcome series for new subscribers', 'welcome', 'new_subscriber', '{}', 
'[
  {"step_type":"send_email","channel":"email","config":{"template":"welcome_email_1"},"step_order":1},
  {"step_type":"wait_days","config":{"days":1},"step_order":2},
  {"step_type":"send_sms","channel":"sms","config":{"message":"Welcome! Reply YES for exclusive offers"},"step_order":3},
  {"step_type":"wait_days","config":{"days":2},"step_order":4},
  {"step_type":"send_email","channel":"email","config":{"template":"welcome_email_2"},"step_order":5}
]'::jsonb, 
'engagement', '{"target_opens":2,"target_clicks":1}', true, ARRAY['welcome','multi-channel','beginner']),

('Abandoned Cart Recovery', 'Recover abandoned carts with email and SMS reminders', 'abandoned_cart', 'cart_abandoned', '{"wait_minutes":60}', 
'[
  {"step_type":"send_email","channel":"email","config":{"template":"cart_reminder_1"},"step_order":1},
  {"step_type":"wait_days","config":{"days":1},"step_order":2},
  {"step_type":"condition","condition_type":"if_then","condition_config":{"field":"cart_status","operator":"equals","value":"abandoned"},"step_order":3},
  {"step_type":"send_sms","channel":"sms","config":{"message":"Your cart is waiting! Complete checkout now"},"step_order":4},
  {"step_type":"wait_days","config":{"days":1},"step_order":5},
  {"step_type":"send_email","channel":"email","config":{"template":"cart_reminder_final","discount":"10%"},"step_order":6}
]'::jsonb,
'conversion', '{"target_event":"purchase"}', true, ARRAY['abandoned-cart','conversion','e-commerce']),

('Lead Nurture - Score Based', 'Nurture leads based on engagement score', 'nurture', 'lead_score_change', '{"threshold":50}',
'[
  {"step_type":"send_email","channel":"email","config":{"template":"nurture_content_1"},"step_order":1},
  {"step_type":"wait_days","config":{"days":3},"step_order":2},
  {"step_type":"condition","condition_type":"if_then","condition_config":{"field":"lead_score","operator":"gte","value":75},"step_order":3},
  {"step_type":"crm_action","crm_action":"create_deal","crm_config":{"pipeline":"sales","stage":"qualified"},"step_order":4},
  {"step_type":"send_email","channel":"email","config":{"template":"sales_outreach"},"step_order":5}
]'::jsonb,
'lead_score', '{"target_score":100}', true, ARRAY['lead-nurture','scoring','sales']),

('Re-engagement Campaign', 'Win back inactive subscribers across all channels', 're_engagement', 'tag_added', '{"tag":"inactive"}',
'[
  {"step_type":"send_email","channel":"email","config":{"template":"we_miss_you"},"step_order":1},
  {"step_type":"wait_days","config":{"days":3},"step_order":2},
  {"step_type":"split_test","split_percentage":50,"step_order":3},
  {"step_type":"send_sms","channel":"sms","config":{"message":"Special offer just for you!"},"step_order":4},
  {"step_type":"send_whatsapp","channel":"whatsapp","config":{"template":"reengagement_offer"},"step_order":5},
  {"step_type":"wait_days","config":{"days":7},"step_order":6},
  {"step_type":"goal_check","goal_type":"engagement","step_order":7}
]'::jsonb,
'engagement', '{"target_opens":1}', true, ARRAY['re-engagement','retention','multi-channel']),

('Post-Purchase Follow-up', 'Thank customers and request reviews after purchase', 'post_purchase', 'purchase', '{}',
'[
  {"step_type":"send_email","channel":"email","config":{"template":"thank_you"},"step_order":1},
  {"step_type":"wait_days","config":{"days":3},"step_order":2},
  {"step_type":"send_sms","channel":"sms","config":{"message":"How was your experience? Leave a review!"},"step_order":3},
  {"step_type":"wait_days","config":{"days":7},"step_order":4},
  {"step_type":"send_email","channel":"email","config":{"template":"cross_sell"},"step_order":5}
]'::jsonb,
'engagement', '{"target_event":"review_submitted"}', true, ARRAY['post-purchase','retention','reviews']);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate automation conversion rate
CREATE OR REPLACE FUNCTION calculate_automation_conversion_rate(p_workflow_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_total INT;
  v_achieved INT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE goal_achieved = true)
  INTO v_total, v_achieved
  FROM automation_enrollments
  WHERE workflow_id = p_workflow_id;
  
  IF v_total = 0 THEN
    RETURN 0.00;
  END IF;
  
  RETURN ROUND((v_achieved::DECIMAL / v_total::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update automation analytics daily
CREATE OR REPLACE FUNCTION update_automation_analytics_daily()
RETURNS void AS $$
BEGIN
  INSERT INTO automation_analytics (
    org_id, workflow_id, date,
    total_enrolled, total_active, total_completed, total_failed, goal_achieved_count,
    emails_sent, sms_sent, whatsapp_sent
  )
  SELECT 
    ae.org_id,
    ae.workflow_id,
    CURRENT_DATE,
    COUNT(*) FILTER (WHERE ae.enrolled_at::date = CURRENT_DATE),
    COUNT(*) FILTER (WHERE ae.status = 'active'),
    COUNT(*) FILTER (WHERE ae.status = 'completed' AND ae.updated_at::date = CURRENT_DATE),
    COUNT(*) FILTER (WHERE ae.status = 'failed' AND ae.updated_at::date = CURRENT_DATE),
    COUNT(*) FILTER (WHERE ae.goal_achieved = true AND ae.goal_achieved_at::date = CURRENT_DATE),
    COUNT(*) FILTER (WHERE ae.total_emails_sent > 0),
    COUNT(*) FILTER (WHERE ae.total_sms_sent > 0),
    COUNT(*) FILTER (WHERE ae.total_whatsapp_sent > 0)
  FROM automation_enrollments ae
  GROUP BY ae.org_id, ae.workflow_id
  ON CONFLICT (org_id, workflow_id, date) DO UPDATE SET
    total_active = EXCLUDED.total_active,
    total_completed = automation_analytics.total_completed + EXCLUDED.total_completed,
    total_failed = automation_analytics.total_failed + EXCLUDED.total_failed,
    goal_achieved_count = automation_analytics.goal_achieved_count + EXCLUDED.goal_achieved_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE automation_templates IS 'Library of pre-built automation workflow templates';
COMMENT ON TABLE automation_goals IS 'Goal tracking and conversion optimization for workflows';
COMMENT ON TABLE automation_step_executions IS 'Detailed execution log for each automation step';
COMMENT ON TABLE automation_analytics IS 'Multi-channel performance analytics for workflows';
COMMENT ON TABLE automation_triggers IS 'Event tracking for workflow trigger conditions';
COMMENT ON TABLE automation_split_tests IS 'A/B testing for automation paths and variants';
COMMENT ON TABLE automation_contact_tags IS 'Unified contact tagging across all channels';
COMMENT ON TABLE automation_lead_scores IS 'Lead scoring changes triggered by automations';
COMMENT ON TABLE automation_crm_actions IS 'CRM actions executed by automation workflows';
COMMENT ON TABLE automation_wait_conditions IS 'Advanced wait conditions for workflow steps';
