-- Module 25: Lead Scoring System
-- Date: 2026-07-18
-- Benchmark: MadKudu / HubSpot Lead Scoring

-- Core scoring models (multiple scoring models per org)
CREATE TABLE IF NOT EXISTS lead_scoring_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Scoring rules (property-based, activity-based, demographic, behavioral)
DROP TABLE IF EXISTS lead_scoring_rules CASCADE;
CREATE TABLE lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES lead_scoring_models(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('property', 'activity', 'demographic', 'behavioral', 'engagement')),
  conditions JSONB NOT NULL DEFAULT '[]',
  score_change INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contact scores (current score per contact per model)
CREATE TABLE contact_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES lead_scoring_models(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL DEFAULT 0,
  demographic_score INTEGER DEFAULT 0,
  behavioral_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  last_score_change INTEGER DEFAULT 0,
  last_scored_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contact_id, model_id)
);

-- Score history (audit trail of all score changes)
CREATE TABLE contact_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES lead_scoring_models(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES lead_scoring_rules(id) ON DELETE SET NULL,
  score_change INTEGER NOT NULL,
  previous_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  reason TEXT,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('manual', 'automation', 'activity', 'property_change', 'bulk_calculation')),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Score thresholds (Hot, Warm, Cold, MQL, SQL, etc.)
CREATE TABLE lead_scoring_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES lead_scoring_models(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_score INTEGER NOT NULL,
  max_score INTEGER,
  color TEXT DEFAULT '#64748b',
  notify_on_reach BOOLEAN DEFAULT false,
  notification_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activity tracking for behavioral scoring
CREATE TABLE lead_scoring_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'email_open', 'email_click', 'page_view', 'form_submit', 
    'download', 'webinar_attend', 'demo_request', 'trial_start',
    'product_usage', 'support_ticket', 'meeting_booked', 'call_completed'
  )),
  activity_data JSONB DEFAULT '{}',
  score_applied INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily score analytics aggregation
CREATE TABLE lead_scoring_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES lead_scoring_models(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_contacts INTEGER DEFAULT 0,
  avg_score NUMERIC(10,2) DEFAULT 0,
  median_score INTEGER DEFAULT 0,
  score_distribution JSONB DEFAULT '{}', -- {"0-20": 10, "21-40": 25, ...}
  threshold_distribution JSONB DEFAULT '{}', -- {"Hot": 5, "Warm": 15, ...}
  new_mqls INTEGER DEFAULT 0,
  new_sqls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, model_id, date)
);

-- Indexes for performance
CREATE INDEX idx_scoring_models_org ON lead_scoring_models(org_id);
CREATE INDEX idx_scoring_models_active ON lead_scoring_models(org_id, is_active);
CREATE INDEX idx_scoring_rules_model ON lead_scoring_rules(model_id);
CREATE INDEX idx_scoring_rules_org ON lead_scoring_rules(org_id);
CREATE INDEX idx_scoring_rules_active ON lead_scoring_rules(model_id, is_active);
CREATE INDEX idx_contact_scores_contact ON contact_scores(contact_id);
CREATE INDEX idx_contact_scores_model ON contact_scores(model_id);
CREATE INDEX idx_contact_scores_org ON contact_scores(org_id);
CREATE INDEX idx_contact_scores_score ON contact_scores(total_score DESC);
CREATE INDEX idx_score_history_contact ON contact_score_history(contact_id);
CREATE INDEX idx_score_history_model ON contact_score_history(model_id);
CREATE INDEX idx_score_history_created ON contact_score_history(created_at DESC);
CREATE INDEX idx_scoring_activities_contact ON lead_scoring_activities(contact_id);
CREATE INDEX idx_scoring_activities_type ON lead_scoring_activities(activity_type);
CREATE INDEX idx_scoring_activities_created ON lead_scoring_activities(created_at DESC);
CREATE INDEX idx_scoring_analytics_org_date ON lead_scoring_analytics_daily(org_id, date DESC);
CREATE INDEX idx_scoring_thresholds_model ON lead_scoring_thresholds(model_id);

-- Insert default scoring model for existing orgs
INSERT INTO lead_scoring_models (org_id, name, description, is_active, is_default)
SELECT id, 'Default Scoring Model', 'Automatically created default scoring model', true, true
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM lead_scoring_models WHERE lead_scoring_models.org_id = organizations.id
);

-- Insert default scoring rules for each default model
INSERT INTO lead_scoring_rules (model_id, org_id, name, rule_type, conditions, score_change, is_active, priority)
SELECT 
  lsm.id,
  lsm.org_id,
  'Email Opened',
  'activity',
  '[{"field": "activity_type", "operator": "equals", "value": "email_open"}]'::jsonb,
  5,
  true,
  1
FROM lead_scoring_models lsm
WHERE lsm.is_default = true;

INSERT INTO lead_scoring_rules (model_id, org_id, name, rule_type, conditions, score_change, is_active, priority)
SELECT 
  lsm.id,
  lsm.org_id,
  'Email Link Clicked',
  'activity',
  '[{"field": "activity_type", "operator": "equals", "value": "email_click"}]'::jsonb,
  10,
  true,
  2
FROM lead_scoring_models lsm
WHERE lsm.is_default = true;

INSERT INTO lead_scoring_rules (model_id, org_id, name, rule_type, conditions, score_change, is_active, priority)
SELECT 
  lsm.id,
  lsm.org_id,
  'Form Submitted',
  'activity',
  '[{"field": "activity_type", "operator": "equals", "value": "form_submit"}]'::jsonb,
  20,
  true,
  3
FROM lead_scoring_models lsm
WHERE lsm.is_default = true;

INSERT INTO lead_scoring_rules (model_id, org_id, name, rule_type, conditions, score_change, is_active, priority)
SELECT 
  lsm.id,
  lsm.org_id,
  'Demo Requested',
  'activity',
  '[{"field": "activity_type", "operator": "equals", "value": "demo_request"}]'::jsonb,
  50,
  true,
  4
FROM lead_scoring_models lsm
WHERE lsm.is_default = true;

-- Insert default thresholds
INSERT INTO lead_scoring_thresholds (model_id, org_id, name, min_score, max_score, color, notify_on_reach)
SELECT 
  lsm.id,
  lsm.org_id,
  'Cold',
  0,
  20,
  '#94a3b8',
  false
FROM lead_scoring_models lsm
WHERE lsm.is_default = true;

INSERT INTO lead_scoring_thresholds (model_id, org_id, name, min_score, max_score, color, notify_on_reach)
SELECT 
  lsm.id,
  lsm.org_id,
  'Warm',
  21,
  50,
  '#fbbf24',
  false
FROM lead_scoring_models lsm
WHERE lsm.is_default = true;

INSERT INTO lead_scoring_thresholds (model_id, org_id, name, min_score, max_score, color, notify_on_reach)
SELECT 
  lsm.id,
  lsm.org_id,
  'Hot',
  51,
  NULL,
  '#ef4444',
  true
FROM lead_scoring_models lsm
WHERE lsm.is_default = true;
