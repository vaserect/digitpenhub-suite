-- ============================================================================
-- CRM ENTERPRISE FOUNDATION SCHEMA
-- Date: 2026-07-16
-- Purpose: Complete enterprise-grade CRM database architecture
-- Supports: Unlimited scalability for all CRM entities
-- ============================================================================

-- ============================================================================
-- SECTION 1: PIPELINES & STAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'pipeline',
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, name)
);

CREATE INDEX idx_crm_pipelines_org ON crm_pipelines(org_id, is_archived);
CREATE INDEX idx_crm_pipelines_default ON crm_pipelines(org_id, is_default) WHERE is_default = true;

CREATE TABLE IF NOT EXISTS crm_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  is_closed_won BOOLEAN NOT NULL DEFAULT false,
  is_closed_lost BOOLEAN NOT NULL DEFAULT false,
  color TEXT DEFAULT '#6B7280',
  automation_rules JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pipeline_id, name)
);

CREATE INDEX idx_crm_stages_pipeline ON crm_stages(pipeline_id, display_order);

-- ============================================================================
-- SECTION 2: DEALS/OPPORTUNITIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE RESTRICT,
  stage_id UUID NOT NULL REFERENCES crm_stages(id) ON DELETE RESTRICT,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  source TEXT,
  lost_reason TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_deals_org ON crm_deals(org_id, is_archived);
CREATE INDEX idx_crm_deals_pipeline ON crm_deals(pipeline_id, stage_id);
CREATE INDEX idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_company ON crm_deals(company_id);
CREATE INDEX idx_crm_deals_owner ON crm_deals(owner_id);
CREATE INDEX idx_crm_deals_close_date ON crm_deals(expected_close_date);
CREATE INDEX idx_crm_deals_tags ON crm_deals USING GIN(tags);

-- ============================================================================
-- SECTION 3: CUSTOM FIELDS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect', 'url', 'email', 'phone', 'textarea', 'currency')),
  field_options JSONB DEFAULT '[]',
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_searchable BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  validation_rules JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, entity_type, field_name)
);

CREATE INDEX idx_crm_custom_fields_org_entity ON crm_custom_field_definitions(org_id, entity_type);

-- ============================================================================
-- SECTION 4: TAG MANAGEMENT SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_tag_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  description TEXT,
  entity_types TEXT[] DEFAULT '{"contact", "company", "deal"}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, name)
);

CREATE INDEX idx_crm_tags_org ON crm_tag_definitions(org_id);
CREATE INDEX idx_crm_tags_usage ON crm_tag_definitions(org_id, usage_count DESC);

-- ============================================================================
-- SECTION 5: LISTS & SEGMENTATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  is_dynamic BOOLEAN NOT NULL DEFAULT false,
  filter_criteria JSONB DEFAULT '{}',
  member_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, name, entity_type)
);

CREATE INDEX idx_crm_lists_org ON crm_lists(org_id, entity_type);

CREATE TABLE IF NOT EXISTS crm_list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES crm_lists(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(list_id, entity_id)
);

CREATE INDEX idx_crm_list_members_list ON crm_list_members(list_id);
CREATE INDEX idx_crm_list_members_entity ON crm_list_members(entity_id);

-- ============================================================================
-- SECTION 6: RELATIONSHIPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_entity_type TEXT NOT NULL CHECK (from_entity_type IN ('contact', 'company')),
  from_entity_id UUID NOT NULL,
  to_entity_type TEXT NOT NULL CHECK (to_entity_type IN ('contact', 'company')),
  to_entity_id UUID NOT NULL,
  relationship_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_entity_type, from_entity_id, to_entity_type, to_entity_id, relationship_type)
);

CREATE INDEX idx_crm_relationships_from ON crm_relationships(from_entity_type, from_entity_id);
CREATE INDEX idx_crm_relationships_to ON crm_relationships(to_entity_type, to_entity_id);

-- ============================================================================
-- SECTION 7: ATTACHMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_attachments_entity ON crm_attachments(entity_type, entity_id);
CREATE INDEX idx_crm_attachments_org ON crm_attachments(org_id);

-- ============================================================================
-- SECTION 8: WORKFLOWS & AUTOMATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'field_change', 'stage_change', 'time_based', 'webhook')),
  trigger_config JSONB DEFAULT '{}',
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_workflows_org ON crm_workflows(org_id, is_active);
CREATE INDEX idx_crm_workflows_entity ON crm_workflows(entity_type, is_active);

CREATE TABLE IF NOT EXISTS crm_workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES crm_workflows(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  execution_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_crm_workflow_executions_workflow ON crm_workflow_executions(workflow_id, status);
CREATE INDEX idx_crm_workflow_executions_entity ON crm_workflow_executions(entity_id);

-- ============================================================================
-- SECTION 9: REPORTS & DASHBOARDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('pipeline', 'forecast', 'activity', 'performance', 'custom')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  filters JSONB DEFAULT '{}',
  grouping JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '[]',
  visualization_config JSONB DEFAULT '{}',
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_reports_org ON crm_reports(org_id);
CREATE INDEX idx_crm_reports_type ON crm_reports(report_type);

CREATE TABLE IF NOT EXISTS crm_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB DEFAULT '[]',
  widgets JSONB DEFAULT '[]',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_dashboards_org ON crm_dashboards(org_id);
CREATE INDEX idx_crm_dashboards_default ON crm_dashboards(org_id, is_default) WHERE is_default = true;

-- ============================================================================
-- SECTION 10: ENHANCED ACTIVITY TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  entity_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note', 'sms', 'whatsapp')),
  subject TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  outcome TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_activities_entity ON crm_activities(entity_type, entity_id);
CREATE INDEX idx_crm_activities_assigned ON crm_activities(assigned_to, is_completed);
CREATE INDEX idx_crm_activities_scheduled ON crm_activities(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- ============================================================================
-- SECTION 11: LEAD SCORING & AI
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  score_factors JSONB DEFAULT '{}',
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contact_id)
);

CREATE INDEX idx_crm_lead_scores_org ON crm_lead_scores(org_id, score DESC);
CREATE INDEX idx_crm_lead_scores_contact ON crm_lead_scores(contact_id);

CREATE TABLE IF NOT EXISTS crm_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  entity_id UUID NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('next_action', 'churn_risk', 'upsell_opportunity', 'engagement_trend')),
  insight_data JSONB NOT NULL,
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_crm_ai_insights_entity ON crm_ai_insights(entity_type, entity_id, is_dismissed);
CREATE INDEX idx_crm_ai_insights_type ON crm_ai_insights(insight_type, is_dismissed);

-- ============================================================================
-- SECTION 12: AUDIT TRAIL
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'merge', 'archive', 'restore')),
  field_changes JSONB DEFAULT '{}',
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_audit_log_entity ON crm_audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_crm_audit_log_org ON crm_audit_log(org_id, created_at DESC);
CREATE INDEX idx_crm_audit_log_user ON crm_audit_log(performed_by, created_at DESC);

-- ============================================================================
-- SECTION 13: TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crm_pipelines_updated_at BEFORE UPDATE ON crm_pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_stages_updated_at BEFORE UPDATE ON crm_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON crm_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_custom_field_definitions_updated_at BEFORE UPDATE ON crm_custom_field_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_tag_definitions_updated_at BEFORE UPDATE ON crm_tag_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_lists_updated_at BEFORE UPDATE ON crm_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_workflows_updated_at BEFORE UPDATE ON crm_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_reports_updated_at BEFORE UPDATE ON crm_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_dashboards_updated_at BEFORE UPDATE ON crm_dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON crm_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 14: DEFAULT DATA
-- ============================================================================

-- Function to create default pipeline for new organizations
CREATE OR REPLACE FUNCTION create_default_crm_pipeline()
RETURNS TRIGGER AS $$
DECLARE
  pipeline_id UUID;
BEGIN
  -- Create default pipeline
  INSERT INTO crm_pipelines (org_id, name, description, is_default, display_order)
  VALUES (NEW.id, 'Sales Pipeline', 'Default sales pipeline', true, 0)
  RETURNING id INTO pipeline_id;
  
  -- Create default stages
  INSERT INTO crm_stages (pipeline_id, name, display_order, probability) VALUES
    (pipeline_id, 'Lead', 0, 10),
    (pipeline_id, 'Qualified', 1, 25),
    (pipeline_id, 'Proposal', 2, 50),
    (pipeline_id, 'Negotiation', 3, 75),
    (pipeline_id, 'Closed Won', 4, 100),
    (pipeline_id, 'Closed Lost', 5, 0);
  
  UPDATE crm_stages SET is_closed_won = true WHERE pipeline_id = pipeline_id AND name = 'Closed Won';
  UPDATE crm_stages SET is_closed_lost = true WHERE pipeline_id = pipeline_id AND name = 'Closed Lost';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger will be created after verifying organizations table exists
-- CREATE TRIGGER create_default_pipeline_on_org_create
-- AFTER INSERT ON organizations
-- FOR EACH ROW EXECUTE FUNCTION create_default_crm_pipeline();

