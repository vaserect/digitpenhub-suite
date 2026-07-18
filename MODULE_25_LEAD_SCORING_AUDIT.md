# Module 25: Lead Scoring - Initial Audit Report
**Date:** 2026-07-18
**Benchmark:** MadKudu / HubSpot Lead Scoring
**Status:** NOT STARTED (Backend partially referenced, no implementation)

## Current State Analysis

### Database Schema
**Status:** ❌ MISSING
- `lead_scoring_rules` table referenced in code but does NOT exist
- `automation_lead_scores` table EXISTS (used by Marketing Automation module)
- No dedicated lead scoring tables

### Backend Implementation
**Status:** ⚠️ PARTIAL (referenced but not implemented)
- `LeadService.js` has scoring logic that references non-existent `lead_scoring_rules` table
- Marketing Automation has lead scoring integration points
- NO dedicated LeadScoringService
- NO dedicated leadScoringController
- NO API routes for lead scoring management

### Frontend Implementation
**Status:** ❌ MISSING
- No UI for creating/managing scoring rules
- No lead scoring dashboard
- No contact scoring visualization
- No scoring history/timeline

### Cross-Module Integration Points
**Existing:**
- Marketing Automation: `automation_lead_scores` table, workflow step type `update_lead_score`
- CRM: Contacts table exists (target for scoring)

**Missing:**
- No scoring triggers on contact actions
- No scoring decay/time-based rules
- No scoring analytics/reporting

## Gap Analysis vs. Benchmark (MadKudu / HubSpot)

### MadKudu Features
1. ✅ Predictive lead scoring (AI-based) - NOT IN SCOPE (manual rules first)
2. ❌ Rule-based scoring engine
3. ❌ Demographic scoring (company size, industry, role)
4. ❌ Behavioral scoring (page visits, email engagement, content downloads)
5. ❌ Fit vs. Intent scoring separation
6. ❌ Score decay over time
7. ❌ Scoring model templates
8. ❌ Real-time score updates
9. ❌ Score distribution analytics
10. ❌ Integration with CRM stages

### HubSpot Lead Scoring Features
1. ❌ Property-based scoring (contact/company properties)
2. ❌ Activity-based scoring (email opens, page views, form submissions)
3. ❌ Negative scoring (unsubscribes, bounces)
4. ❌ Score thresholds and alerts
5. ❌ Score history and timeline
6. ❌ Bulk score recalculation
7. ❌ Score-based list segmentation
8. ❌ Score reporting and analytics
9. ❌ Multiple scoring models per org
10. ❌ Score visibility in contact records

## Required Implementation

### Phase 1: Database Schema (Priority: HIGH)
```sql
-- Core scoring tables
CREATE TABLE lead_scoring_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES lead_scoring_models(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('property', 'activity', 'demographic', 'behavioral')),
  conditions JSONB NOT NULL DEFAULT '[]',
  score_change INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contact_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES lead_scoring_models(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL DEFAULT 0,
  demographic_score INTEGER DEFAULT 0,
  behavioral_score INTEGER DEFAULT 0,
  last_score_change INTEGER DEFAULT 0,
  last_scored_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contact_id, model_id)
);

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
  triggered_by TEXT, -- 'manual', 'automation', 'activity', 'property_change'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lead_scoring_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES lead_scoring_models(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Hot', 'Warm', 'Cold', 'MQL', 'SQL'
  min_score INTEGER NOT NULL,
  max_score INTEGER,
  color TEXT DEFAULT '#64748b',
  notify_on_reach BOOLEAN DEFAULT false,
  notification_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scoring_rules_model ON lead_scoring_rules(model_id);
CREATE INDEX idx_scoring_rules_org ON lead_scoring_rules(org_id);
CREATE INDEX idx_contact_scores_contact ON contact_scores(contact_id);
CREATE INDEX idx_contact_scores_model ON contact_scores(model_id);
CREATE INDEX idx_score_history_contact ON contact_score_history(contact_id);
CREATE INDEX idx_score_history_created ON contact_score_history(created_at DESC);
```

### Phase 2: Backend Service Layer
**File:** `backend/src/services/leads/LeadScoringService.js`
- Scoring engine (rule evaluation)
- Score calculation and updates
- Bulk scoring operations
- Score decay logic
- Threshold monitoring
- Analytics aggregation

**File:** `backend/src/controllers/leadScoringController.js`
- CRUD for scoring models
- CRUD for scoring rules
- Score calculation endpoints
- Score history retrieval
- Analytics endpoints

**Routes:** `backend/src/routes/leadScoring.routes.js`
- GET /api/v1/lead-scoring/models
- POST /api/v1/lead-scoring/models
- GET /api/v1/lead-scoring/models/:id/rules
- POST /api/v1/lead-scoring/rules
- POST /api/v1/lead-scoring/calculate/:contactId
- POST /api/v1/lead-scoring/bulk-calculate
- GET /api/v1/lead-scoring/contacts/:contactId/score
- GET /api/v1/lead-scoring/contacts/:contactId/history
- GET /api/v1/lead-scoring/analytics

### Phase 3: Frontend UI
**File:** `frontend/components/modules/LeadScoring.jsx`
- Scoring models management
- Rules builder (visual condition builder)
- Score thresholds configuration
- Contact scoring dashboard
- Score distribution charts
- Score history timeline

**File:** `frontend/app/lead-scoring/page.jsx`
- Main dashboard route

### Phase 4: Integration Points
1. **CRM Module:** Display scores in contact records
2. **Marketing Automation:** Trigger workflows based on score changes
3. **Lead Generation:** Auto-score new leads on submission
4. **Analytics:** Score-based segmentation and reporting
5. **Notifications:** Alert on threshold crossings

## Implementation Priority
1. Database schema (blocking)
2. Backend service + controller
3. API routes
4. Frontend rules builder
5. Frontend scoring dashboard
6. Cross-module integrations
7. Testing and optimization

## Estimated Complexity
- **Backend:** Medium-High (scoring engine logic, rule evaluation)
- **Frontend:** High (visual rule builder, real-time scoring)
- **Integration:** Medium (multiple touchpoints)
- **Total Effort:** 6-8 hours for full implementation

## Next Steps
1. Create database migration file
2. Implement LeadScoringService with scoring engine
3. Build leadScoringController with all endpoints
4. Create frontend rules builder UI
5. Build scoring dashboard with analytics
6. Wire up CRM integration (show scores in contacts)
7. Test end-to-end scoring workflow
8. Commit and document
