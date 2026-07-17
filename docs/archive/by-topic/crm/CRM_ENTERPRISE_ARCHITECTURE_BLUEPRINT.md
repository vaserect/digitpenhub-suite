# CRM Enterprise Architecture Blueprint
**Date:** July 16, 2026  
**Version:** 1.0  
**Project:** DigitPenHub Suite CRM Transformation  
**Architect:** Principal CRM Architect

---

## 1. Architecture Vision

### 1.1 Design Principles

**Scalability First:**
- Support unlimited contacts, companies, deals, pipelines
- Horizontal scaling capability
- Efficient data partitioning
- Optimized query performance

**Modularity:**
- Loosely coupled components
- Clear separation of concerns
- Reusable services
- Plugin architecture for extensions

**Integration Hub:**
- Central intelligence for all 137 modules
- Event-driven architecture
- Real-time data synchronization
- Bidirectional data flow

**Performance:**
- Sub-200ms API response times
- Real-time updates via WebSocket
- Intelligent caching strategy
- Optimized database queries

**Security:**
- Field-level permissions
- Record-level security
- Data encryption
- Audit trail for all operations

---

## 2. Database Architecture

### 2.1 Core Entity Schema

```sql
-- ============================================================
-- CORE ENTITIES
-- ============================================================

-- Contacts (Enhanced)
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Basic Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  title TEXT,
  department TEXT,
  
  -- Social & Web
  linkedin_url TEXT,
  twitter_handle TEXT,
  website TEXT,
  
  -- Address
  street_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Lead Information
  lead_source TEXT,
  lead_status TEXT DEFAULT 'new',
  lead_score INT DEFAULT 0,
  
  -- Lifecycle
  lifecycle_stage TEXT DEFAULT 'lead' CHECK (lifecycle_stage IN 
    ('subscriber', 'lead', 'marketing_qualified_lead', 'sales_qualified_lead', 
     'opportunity', 'customer', 'evangelist', 'other')),
  
  -- Engagement
  last_contacted_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  email_opt_in BOOLEAN DEFAULT true,
  sms_opt_in BOOLEAN DEFAULT false,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(first_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(last_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(email, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(company_id::text, '')), 'C')
  ) STORED
);

-- Indexes
CREATE INDEX idx_crm_contacts_org ON crm_contacts(org_id);
CREATE INDEX idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX idx_crm_contacts_owner ON crm_contacts(owner_id);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_crm_contacts_lifecycle ON crm_contacts(org_id, lifecycle_stage);
CREATE INDEX idx_crm_contacts_score ON crm_contacts(org_id, lead_score DESC);
CREATE INDEX idx_crm_contacts_search ON crm_contacts USING GIN(search_vector);
CREATE INDEX idx_crm_contacts_tags ON crm_contacts USING GIN(tags);
CREATE INDEX idx_crm_contacts_custom ON crm_contacts USING GIN(custom_fields);

-- Companies
CREATE TABLE crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  legal_name TEXT,
  website TEXT,
  domain TEXT,
  
  -- Classification
  industry TEXT,
  company_type TEXT,
  company_size TEXT,
  annual_revenue NUMERIC(15,2),
  employee_count INT,
  
  -- Contact Information
  phone TEXT,
  email TEXT,
  
  -- Address
  street_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Social
  linkedin_url TEXT,
  twitter_handle TEXT,
  facebook_url TEXT,
  
  -- Business Details
  founded_year INT,
  description TEXT,
  
  -- Engagement
  lifecycle_stage TEXT DEFAULT 'lead',
  last_activity_at TIMESTAMPTZ,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(domain, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(industry, '')), 'C')
  ) STORED
);

CREATE INDEX idx_crm_companies_org ON crm_companies(org_id);
CREATE INDEX idx_crm_companies_owner ON crm_companies(owner_id);
CREATE INDEX idx_crm_companies_parent ON crm_companies(parent_company_id);
CREATE INDEX idx_crm_companies_domain ON crm_companies(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_crm_companies_search ON crm_companies USING GIN(search_vector);
CREATE INDEX idx_crm_companies_tags ON crm_companies USING GIN(tags);

-- Pipelines (Custom)
CREATE TABLE crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Configuration
  deal_probability_enabled BOOLEAN DEFAULT true,
  auto_archive_days INT,
  
  -- Metadata
  sort_order INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  UNIQUE(org_id, name)
);

CREATE INDEX idx_crm_pipelines_org ON crm_pipelines(org_id, is_active);

-- Pipeline Stages (Custom)
CREATE TABLE crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Stage Configuration
  stage_type TEXT NOT NULL CHECK (stage_type IN ('open', 'won', 'lost')),
  probability INT CHECK (probability >= 0 AND probability <= 100),
  
  -- Automation
  auto_move_after_days INT,
  auto_move_to_stage_id UUID REFERENCES crm_pipeline_stages(id) ON DELETE SET NULL,
  
  -- Display
  color TEXT DEFAULT '#3B82F6',
  sort_order INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(pipeline_id, name)
);

CREATE INDEX idx_crm_stages_pipeline ON crm_pipeline_stages(pipeline_id, sort_order);

-- Deals/Opportunities
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE RESTRICT,
  stage_id UUID NOT NULL REFERENCES crm_pipeline_stages(id) ON DELETE RESTRICT,
  
  -- Relationships
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,
  
  -- Financial
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  probability INT CHECK (probability >= 0 AND probability <= 100),
  expected_revenue NUMERIC(15,2) GENERATED ALWAYS AS (amount * probability / 100.0) STORED,
  
  -- Dates
  close_date DATE,
  expected_close_date DATE,
  
  -- Source
  deal_source TEXT,
  
  -- Status
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_reason TEXT,
  
  -- Engagement
  last_activity_at TIMESTAMPTZ,
  next_activity_at TIMESTAMPTZ,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  stage_changed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED
);

CREATE INDEX idx_crm_deals_org ON crm_deals(org_id);
CREATE INDEX idx_crm_deals_pipeline ON crm_deals(pipeline_id, stage_id);
CREATE INDEX idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_company ON crm_deals(company_id);
CREATE INDEX idx_crm_deals_owner ON crm_deals(owner_id);
CREATE INDEX idx_crm_deals_close_date ON crm_deals(org_id, close_date) WHERE close_date IS NOT NULL;
CREATE INDEX idx_crm_deals_amount ON crm_deals(org_id, amount DESC);
CREATE INDEX idx_crm_deals_search ON crm_deals USING GIN(search_vector);
CREATE INDEX idx_crm_deals_active ON crm_deals(org_id, pipeline_id, stage_id) WHERE is_archived = false;

-- Deal Products/Line Items
CREATE TABLE crm_deal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  
  -- Product Information
  product_name TEXT NOT NULL,
  product_code TEXT,
  description TEXT,
  
  -- Pricing
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  tax_percent NUMERIC(5,2) DEFAULT 0,
  
  -- Calculated
  subtotal NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  discount_total NUMERIC(15,2) GENERATED ALWAYS AS (
    CASE 
      WHEN discount_amount > 0 THEN discount_amount
      ELSE (quantity * unit_price * discount_percent / 100.0)
    END
  ) STORED,
  tax_amount NUMERIC(15,2) GENERATED ALWAYS AS (
    ((quantity * unit_price) - 
     CASE 
       WHEN discount_amount > 0 THEN discount_amount
       ELSE (quantity * unit_price * discount_percent / 100.0)
     END) * tax_percent / 100.0
  ) STORED,
  total NUMERIC(15,2) GENERATED ALWAYS AS (
    (quantity * unit_price) - 
    CASE 
      WHEN discount_amount > 0 THEN discount_amount
      ELSE (quantity * unit_price * discount_percent / 100.0)
    END +
    ((quantity * unit_price) - 
     CASE 
       WHEN discount_amount > 0 THEN discount_amount
       ELSE (quantity * unit_price * discount_percent / 100.0)
     END) * tax_percent / 100.0
  ) STORED,
  
  -- Metadata
  sort_order INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_deal_products_deal ON crm_deal_products(deal_id, sort_order);

-- ============================================================
-- RELATIONSHIPS
-- ============================================================

CREATE TABLE crm_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Source Entity
  source_type TEXT NOT NULL CHECK (source_type IN ('contact', 'company')),
  source_id UUID NOT NULL,
  
  -- Target Entity
  target_type TEXT NOT NULL CHECK (target_type IN ('contact', 'company')),
  target_id UUID NOT NULL,
  
  -- Relationship Details
  relationship_type TEXT NOT NULL,
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  UNIQUE(source_type, source_id, target_type, target_id, relationship_type)
);

CREATE INDEX idx_crm_relationships_source ON crm_relationships(source_type, source_id);
CREATE INDEX idx_crm_relationships_target ON crm_relationships(target_type, target_id);

-- ============================================================
-- ACTIVITIES
-- ============================================================

CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Related Entities
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  
  -- Activity Details
  activity_type TEXT NOT NULL CHECK (activity_type IN 
    ('call', 'email', 'meeting', 'task', 'note', 'sms', 'whatsapp', 'other')),
  subject TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INT,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN 
    ('scheduled', 'completed', 'cancelled', 'no_show')),
  
  -- Outcome
  outcome TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_crm_activities_org ON crm_activities(org_id, created_at DESC);
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id, created_at DESC);
CREATE INDEX idx_crm_activities_company ON crm_activities(company_id, created_at DESC);
CREATE INDEX idx_crm_activities_deal ON crm_activities(deal_id, created_at DESC);
CREATE INDEX idx_crm_activities_assigned ON crm_activities(assigned_to, status, scheduled_at);
CREATE INDEX idx_crm_activities_type ON crm_activities(org_id, activity_type, created_at DESC);

-- ============================================================
-- EMAIL TRACKING
-- ============================================================

CREATE TABLE crm_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Related Entities
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES crm_activities(id) ON DELETE SET NULL,
  
  -- Email Details
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[] DEFAULT '{}',
  bcc_emails TEXT[] DEFAULT '{}',
  
  -- Content
  body_html TEXT,
  body_text TEXT,
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  
  -- Metrics
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN 
    ('draft', 'scheduled', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_crm_email_tracking_org ON crm_email_tracking(org_id, sent_at DESC);
CREATE INDEX idx_crm_email_tracking_contact ON crm_email_tracking(contact_id, sent_at DESC);
CREATE INDEX idx_crm_email_tracking_deal ON crm_email_tracking(deal_id, sent_at DESC);
CREATE INDEX idx_crm_email_tracking_status ON crm_email_tracking(org_id, status);

-- ============================================================
-- LEAD SCORING
-- ============================================================

CREATE TABLE crm_lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Rule Configuration
  rule_type TEXT NOT NULL CHECK (rule_type IN 
    ('demographic', 'behavioral', 'engagement', 'firmographic')),
  
  -- Condition (JSONB for flexibility)
  condition JSONB NOT NULL,
  
  -- Scoring
  score_value INT NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_crm_scoring_rules_org ON crm_lead_scoring_rules(org_id, is_active);

-- Lead Score History
CREATE TABLE crm_lead_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  
  old_score INT NOT NULL,
  new_score INT NOT NULL,
  score_change INT NOT NULL,
  
  reason TEXT,
  rule_id UUID REFERENCES crm_lead_scoring_rules(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_score_history_contact ON crm_lead_score_history(contact_id, created_at DESC);

-- ============================================================
-- DUPLICATE DETECTION
-- ============================================================

CREATE TABLE crm_duplicate_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company')),
  
  -- Master Record
  master_id UUID NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'merged', 'ignored')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_duplicate_groups_org ON crm_duplicate_groups(org_id, entity_type, status);

CREATE TABLE crm_duplicate_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES crm_duplicate_groups(id) ON DELETE CASCADE,
  
  entity_id UUID NOT NULL,
  similarity_score NUMERIC(5,2) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_duplicate_members_group ON crm_duplicate_group_members(group_id);

-- ============================================================
-- ANALYTICS & REPORTING
-- ============================================================

-- Pipeline Snapshots (for historical reporting)
CREATE TABLE crm_pipeline_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  
  snapshot_date DATE NOT NULL,
  
  -- Metrics
  total_deals INT NOT NULL,
  total_value NUMERIC(15,2) NOT NULL,
  weighted_value NUMERIC(15,2) NOT NULL,
  
  -- Stage Breakdown (JSONB for flexibility)
  stage_metrics JSONB NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(org_id, pipeline_id, snapshot_date)
);

CREATE INDEX idx_crm_snapshots_org ON crm_pipeline_snapshots(org_id, snapshot_date DESC);
CREATE INDEX idx_crm_snapshots_pipeline ON crm_pipeline_snapshots(pipeline_id, snapshot_date DESC);

-- Conversion Metrics
CREATE TABLE crm_conversion_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  metric_date DATE NOT NULL,
  
  -- Lead Metrics
  leads_created INT DEFAULT 0,
  leads_qualified INT DEFAULT 0,
  leads_converted INT DEFAULT 0,
  
  -- Deal Metrics
  deals_created INT DEFAULT 0,
  deals_won INT DEFAULT 0,
  deals_lost INT DEFAULT 0,
  
  -- Revenue
  revenue_won NUMERIC(15,2) DEFAULT 0,
  revenue_lost NUMERIC(15,2) DEFAULT 0,
  
  -- Conversion Rates
  lead_to_opportunity_rate NUMERIC(5,2),
  opportunity_to_customer_rate NUMERIC(5,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(org_id, metric_date)
);

CREATE INDEX idx_crm_conversion_metrics_org ON crm_conversion_metrics(org_id, metric_date DESC);

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Update deal amount when products change
CREATE OR REPLACE FUNCTION update_deal_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE crm_deals
  SET amount = (
    SELECT COALESCE(SUM(total), 0)
    FROM crm_deal_products
    WHERE deal_id = NEW.deal_id
  ),
  updated_at = now()
  WHERE id = NEW.deal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deal_amount
AFTER INSERT OR UPDATE OR DELETE ON crm_deal_products
FOR EACH ROW
EXECUTE FUNCTION update_deal_amount();

-- Track stage changes
CREATE OR REPLACE FUNCTION track_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    NEW.stage_changed_at = now();
    
    -- Log activity
    INSERT INTO crm_activities (
      org_id, deal_id, activity_type, subject, description, completed_at, status, created_by
    ) VALUES (
      NEW.org_id,
      NEW.id,
      'other',
      'Stage Changed',
      'Deal moved to new stage',
      now(),
      'completed',
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_stage_change
BEFORE UPDATE ON crm_deals
FOR EACH ROW
EXECUTE FUNCTION track_stage_change();

-- Update contact last_activity_at
CREATE OR REPLACE FUNCTION update_contact_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE crm_contacts
    SET last_activity_at = now()
    WHERE id = NEW.contact_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_activity
AFTER INSERT ON crm_activities
FOR EACH ROW
EXECUTE FUNCTION update_contact_activity();
```

### 2.2 Scalability Features

**Partitioning Strategy:**
```sql
-- Partition activities by month for better performance
CREATE TABLE crm_activities_2026_01 PARTITION OF crm_activities
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Partition email tracking by month
CREATE TABLE crm_email_tracking_2026_01 PARTITION OF crm_email_tracking
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

**Archival Strategy:**
```sql
-- Archive old deals
CREATE TABLE crm_deals_archive (LIKE crm_deals INCLUDING ALL);

-- Archive old activities
CREATE TABLE crm_activities_archive (LIKE crm_activities INCLUDING ALL);
```

---

## 3. Backend Service Architecture

### 3.1 Service Layer Structure

```
backend/src/
├── services/
│   └── crm/
│       ├── ContactService.js          # Contact management
│       ├── CompanyService.js          # Company management
│       ├── DealService.js             # Deal/opportunity management
│       ├── PipelineService.js         # Pipeline & stage management
│       ├── ActivityService.js         # Activity tracking
│       ├── EmailTrackingService.js    # Email integration
│       ├── LeadScoringService.js      # Lead scoring engine
│       ├── DuplicateDetectionService.js # Deduplication
│       ├── RelationshipService.js     # Relationship mapping
│       ├── ReportingService.js        # Analytics & reports
│       ├── ForecastingService.js      # Revenue forecasting
│       ├── WorkflowService.js         # Automation engine
│       └── IntegrationService.js      # Module integrations
├── repositories/
│   └── crm/
│       ├── ContactRepository.js
│       ├── CompanyRepository.js
│       ├── DealRepository.js
│       ├── PipelineRepository.js
│       ├── ActivityRepository.js
│       └── ...
├── controllers/
│   └── crm/
│       ├── contactController.js
│       ├── companyController.js
│       ├── dealController.js
│       ├── pipelineController.js
│       ├── activityController.js
│       └── ...
├── routes/
│   └── crm/
│       ├── contacts.js
│       ├── companies.js
│       ├── deals.js
│       ├── pipelines.js
│       ├── activities.js
│       └── ...
├── middleware/
│   └── crm/
│       ├── permissions.js
│       ├── validation.js
│       └── rateLimit.js
├── events/
│   └── crm/
│       ├── ContactEvents.js
│       ├── DealEvents.js
│       └── ActivityEvents.js
└── jobs/
    └── crm/
        ├── LeadScoringJob.js
        ├── DuplicateDetectionJob.js
        ├── EmailSequenceJob.js
        └── SnapshotJob.js
```

### 3.2 Service Patterns

**Base Service Pattern:**
```javascript
class BaseService {
  constructor(repository, options = {}) {
    this.repository = repository;
    this.logger = options.logger || console;
    this.cache = options.cache;
    this.eventEmitter = options.eventEmitter;
  }
  
  async findAll(orgId, filters = {}) {
    const cacheKey = this.getCacheKey('findAll', orgId, filters);
    
    // Check cache
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;
    }
    
    // Query database
    const results = await this.repository.findAll(orgId, filters);
    
    // Cache results
    if (this.cache) {
      await this.cache.set(cacheKey, results, 300); // 5 min TTL
    }
    
    return results;
  }
  
  async create(data, userId) {
    // Validate
    this.validate(data);
    
    // Create
    const entity = await this.repository.create(data, userId);
    
    // Emit event
    if (this.eventEmitter) {
      this.eventEmitter.emit('entity.created', {
        type: this.entityType,
        id: entity.id,
        data: entity
      });
    }
    
    // Invalidate cache
    if (this.cache) {
      await this.cache.invalidate(this.getCachePattern(data.orgId));
    }
    
    return entity;
  }
}
```

**Event-Driven Pattern:**
```javascript
// Event Emitter
const EventEmitter = require('events');
const crmEvents = new EventEmitter();

// Event Handlers
crmEvents.on('contact.created', async (data) => {
  // Update lead score
  await LeadScoringService.calculateScore(data.contactId);
  
  // Check for duplicates
  await DuplicateDetectionService.checkDuplicates(data.contactId);
  
  // Trigger workflows
  await WorkflowService.trigger('contact.created', data);
  
  // Send notifications
  await NotificationService.notify(data.orgId, {
    type: 'contact.created',
    message: `New contact: ${data.fullName}`
  });
});

crmEvents.on('deal.stage_changed', async (data) => {
  // Update pipeline metrics
  await ReportingService.updatePipelineMetrics(data.pipelineId);
  
  // Trigger stage-specific workflows
  await WorkflowService.trigger('deal.stage_changed', data);
  
  // Update forecasts
  await ForecastingService.recalculate(data.orgId);
});
```

### 3.3 Caching Strategy

**Redis Cache Layers:**
```javascript
// L1: Hot data (1-5 min TTL)
- Contact lists
- Deal lists
- Pipeline configurations

// L2: Warm data (5-30 min TTL)
- Company data
- Activity feeds
- Statistics

// L3: Cold data (30-60 min TTL)
- Historical reports
- Analytics data
- Archived records

// Cache Invalidation
- On create/update/delete
- Pattern-based invalidation
- Time-based expiration
```

### 3.4 Queue System

**Bull Queue Jobs:**
```javascript
// High Priority Queue
- Email sending
- Real-time notifications
- Webhook deliveries

// Medium Priority Queue
- Lead scoring calculations
- Duplicate detection
- Activity logging

// Low Priority Queue
- Report generation
- Data exports
- Snapshot creation
- Archive operations
```

---

## 4. Frontend Architecture

### 4.1 Component Structure

```
frontend/
├── app/
│   └── crm/
│       ├── page.jsx                    # Main CRM page
│       ├── contacts/
│       │   ├── page.jsx                # Contact list
│       │   └── [id]/
│       │       └── page.jsx            # Contact detail
│       ├── companies/
│       │   ├── page.jsx
│       │   └── [id]/
│       │       └── page.jsx
│       ├── deals/
│       │   ├── page.jsx
│       │   └── [id]/
│       │       └── page.jsx
│       ├── pipelines/
│       │   ├── page.jsx
│       │   └── [id]/
│       │       └── page.jsx
│       └── reports/
│           └── page.jsx
├── components/
│   └── crm/
│       ├── contacts/
│       │   ├── ContactList.jsx
│       │   ├── ContactCard.jsx
│       │   ├── ContactDetail.jsx
│       │   ├── ContactForm.jsx
│       │   ├── ContactImport.jsx
│       │   └── ContactMerge.jsx
│       ├── companies/
│       │   ├── CompanyList.jsx
│       │   ├── CompanyCard.jsx
│       │   ├── CompanyDetail.jsx
│       │   ├── CompanyForm.jsx
│       │   └── CompanyHierarchy.jsx
│       ├── deals/
│       │   ├── DealList.jsx
│       │   ├── DealCard.jsx
│       │   ├── DealDetail.jsx
│       │   ├── DealForm.jsx
│       │   ├── DealKanban.jsx
│       │   ├── DealProducts.jsx
│       │   └── DealTimeline.jsx
│       ├── pipelines/
│       │   ├── PipelineView.jsx
│       │   ├── PipelineConfig.jsx
│       │   ├── StageConfig.jsx
│       │   └── PipelineMetrics.jsx
│       ├── activities/
│       │   ├── ActivityTimeline.jsx
│       │   ├── ActivityFeed.jsx
│       │   ├── ActivityForm.jsx
│       │   ├── ActivityCalendar.jsx
│       │   └── ActivityList.jsx
│       ├── reports/
│       │   ├── Dashboard.jsx
│       │   ├── ReportBuilder.jsx
│       │   ├── ForecastReport.jsx
│       │   ├── ConversionReport.jsx
│       │   └── charts/
│       │       ├── PipelineChart.jsx
│       │       ├── RevenueChart.jsx
│       │       ├── ActivityChart.jsx
│       │       └── LeaderboardChart.jsx
│       ├── shared/
│       │   ├── CRMLayout.jsx
│       │   ├── CRMSidebar.jsx
│       │   ├── CRMFilters.jsx
│       │   ├── CRMSearch.jsx
│       │   ├── EntitySelector.jsx
│       │   ├── RelationshipGraph.jsx
│       │   ├── KanbanBoard.jsx
│       │   ├── Timeline.jsx
│       │   └── FileUpload.jsx
│       └── integrations/
│           ├── EmailComposer.jsx
│           ├── CalendarSync.jsx
│           ├── TaskSync.jsx
│           └── DocumentAttach.jsx
├── hooks/
│   └── crm/
│       ├── useContacts.js
│       ├── useCompanies.js
│       ├── useDeals.js
│       ├── usePipelines.js
│       ├── useActivities.js
│       └── useRealtime.js
├── lib/
│   └── crm/
│       ├── api.js
│       ├── websocket.js
│       ├── cache.js
│       └── utils.js
└── stores/
    └── crm/
        ├── contactStore.js
        ├── dealStore.js
        ├── pipelineStore.js
        └── filterStore.js
```

### 4.2 State Management

**Zustand Store Pattern:**
```javascript
// stores/crm/dealStore.js
import create from 'zustand';

export const useDealStore = create((set, get) => ({
  deals: [],
  selectedDeal: null,
  filters: {},
  loading: false,
  
  // Actions
  fetchDeals: async (filters) => {
    set({ loading: true });
    const deals = await api.getDeals(filters);
    set({ deals, loading: false });
  },
  
  selectDeal: (dealId) => {
    const deal = get().deals.find(d => d.id === dealId);
    set({ selectedDeal: deal });
  },
  
  updateDeal: async (dealId, updates) => {
    const updated = await api.updateDeal(dealId, updates);
    set(state => ({
      deals: state.deals.map(d => d.id === dealId ? updated : d),
      selectedDeal: state.selectedDeal?.id === dealId ? updated : state.selectedDeal
    }));
  },
  
  moveDeal: async (dealId, stageId) => {
    await api.moveDeal(dealId, stageId);
    get().fetchDeals(get().filters);
  }
}));
```

### 4.3 Real-time Updates

**WebSocket Integration:**
```javascript
// lib/crm/websocket.js
import io from 'socket.io-client';

class CRMWebSocket {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }
  
  connect(orgId) {
    this.socket = io('/crm', {
      query: { orgId }
    });
    
    this.socket.on('deal.updated', (data) => {
      this.emit('deal.updated', data);
    });
    
    this.socket.on('contact.created', (data) => {
      this.emit('contact.created', data);
    });
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }
}

export const crmWebSocket = new CRMWebSocket();
```

---

## 5. API Architecture

### 5.1 RESTful Endpoints

**Contacts:**
```
GET    /api/v1/crm/contacts
POST   /api/v1/crm/contacts
GET    /api/v1/crm/contacts/:id
PATCH  /api/v1/crm/contacts/:id
DELETE /api/v1/crm/contacts/:id
POST   /api/v1/crm/contacts/import
POST   /api/v1/crm/contacts/export
POST   /api/v1/crm/contacts/bulk-update
POST   /api/v1/crm/contacts/bulk-delete
GET    /api/v1/crm/contacts/:id/activities
GET    /api/v1/crm/contacts/:id/deals
GET    /api/v1/crm/contacts/:id/timeline
POST   /api/v1/crm/contacts/:id/merge
GET    /api/v1/crm/contacts/:id/duplicates
```

**Companies:**
```
GET    /api/v1/crm/companies
POST   /api/v1/crm/companies
GET    /api/v1/crm/companies/:id
PATCH  /api/v1/crm/companies/:id
DELETE /api/v1/crm/companies/:id
GET    /api/v1/crm/companies/:id/contacts
GET    /api/v1/crm/companies/:id/deals
GET    /api/v1/crm/companies/:id/hierarchy
POST   /api/v1/crm/companies/:id/merge
```

**Deals:**
```
GET    /api/v1/crm/deals
POST   /api/v1/crm/deals
GET    /api/v1/crm/deals/:id
PATCH  /api/v1/crm/deals/:id
DELETE /api/v1/crm/deals/:id
POST   /api/v1/crm/deals/:id/move
GET    /api/v1/crm/deals/:id/products
POST   /api/v1/crm/deals/:id/products
PATCH  /api/v1/crm/deals/:id/products/:productId
DELETE /api/v1/crm/deals/:id/products/:productId
POST   /api/v1/crm/deals/:id/archive
POST   /api/v1/crm/deals/:id/restore
```

**Pipelines:**
```
GET    /api/v1/crm/pipelines
POST   /api/v1/crm/pipelines
GET    /api/v1/crm/pipelines/:id
PATCH  /api/v1/crm/pipelines/:id
DELETE /api/v1/crm/pipelines/:id
GET    /api/v1/crm/pipelines/:id/stages
POST   /api/v1/crm/pipelines/:id/stages
PATCH  /api/v1/crm/pipelines/:id/stages/:stageId
DELETE /api/v1/crm/pipelines/:id/stages/:stageId
POST   /api/v1/crm/pipelines/:id/stages/reorder
GET    /api/v1/crm/pipelines/:id/metrics
```

**Activities:**
```
GET    /api/v1/crm/activities
POST   /api/v1/crm/activities
GET    /api/v1/crm/activities/:id
PATCH  /api/v1/crm/activities/:id
DELETE /api/v1/crm/activities/:id
POST   /api/v1/crm/activities/:id/complete
GET    /api/v1/crm/activities/upcoming
GET    /api/v1/crm/activities/overdue
```

**Reports:**
```
GET    /api/v1/crm/reports/dashboard
GET    /api/v1/crm/reports/pipeline
GET    /api/v1/crm/reports/forecast
GET    /api/v1/crm/reports/conversion
GET    /api/v1/crm/reports/leaderboard
POST   /api/v1/crm/reports/custom
```

### 5.2 GraphQL Schema (Optional)

```graphql
type Contact {
  id: ID!
  firstName: String!
  lastName: String!
  fullName: String!
  email: String
  phone: String
  company: Company
  deals: [Deal!]!
  activities: [Activity!]!
  leadScore: Int!
  lifecycleStage: String!
  tags: [String!]!
  customFields: JSON
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Company {
  id: ID!
  name: String!
  website: String
  industry: String
  contacts: [Contact!]!
  deals: [Deal!]!
  revenue: Float
  employeeCount: Int
}

type Deal {
  id: ID!
  name: String!
  amount: Float!
  probability: Int
  expectedRevenue: Float!
  stage: PipelineStage!
  pipeline: Pipeline!
  contact: Contact
  company: Company
  products: [DealProduct!]!
  activities: [Activity!]!
  closeDate: Date
  createdAt: DateTime!
}

type Pipeline {
  id: ID!
  name: String!
  stages: [PipelineStage!]!
  deals: [Deal!]!
  metrics: PipelineMetrics!
}

type PipelineStage {
  id: ID!
  name: String!
  probability: Int
  stageType: StageType!
  deals: [Deal!]!
}

type Activity {
  id: ID!
  type: ActivityType!
  subject: String!
  description: String
  scheduledAt: DateTime
  completedAt: DateTime
  status: ActivityStatus!
  contact: Contact
  deal: Deal
}

enum ActivityType {
  CALL
  EMAIL
  MEETING
  TASK
  NOTE
  SMS
  WHATSAPP
}

enum StageType {
  OPEN
  WON
  LOST
}

type Query {
  contacts(filters: ContactFilters): [Contact!]!
  contact(id: ID!): Contact
  companies(filters: CompanyFilters): [Company!]!
  company(id: ID!): Company
  deals(filters: DealFilters): [Deal!]!
  deal(id: ID!): Deal
  pipelines: [Pipeline!]!
  pipeline(id: ID!): Pipeline
  activities(filters: ActivityFilters): [Activity!]!
}

type Mutation {
  createContact(inpu