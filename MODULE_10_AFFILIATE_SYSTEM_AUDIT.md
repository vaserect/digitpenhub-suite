# Module 10: Affiliate System - Audit & Implementation Plan

**Audit Date:** 2026-07-18  
**Module:** Affiliate System (Module 10 of 40 Marketing Modules)  
**Benchmark Competitors:** PartnerStack, Tapfiliate, Refersion, Impact.com

---

## 1. AUDIT FINDINGS

### 1.1 Database Schema (PARTIAL - 30% Complete)

**Existing Tables:**
- ✅ `affiliates` - Basic affiliate profiles (id, org_id, name, email, phone, promo_code, commission_type, commission_value, status, notes)
- ✅ `affiliate_conversions` - Basic conversion tracking (id, org_id, affiliate_id, order_ref, amount_ngn, commission_ngn, status, notes, conversion_date)

**Missing Critical Tables:**
- ❌ `affiliate_tracking_links` - Unique tracking URLs per affiliate
- ❌ `affiliate_clicks` - Click tracking and analytics
- ❌ `affiliate_payouts` - Payout batch management
- ❌ `affiliate_payout_items` - Individual payout line items
- ❌ `affiliate_marketing_materials` - Banners, creatives, email templates
- ❌ `affiliate_tiers` - Multi-tier commission structures
- ❌ `affiliate_performance_cache` - Aggregated performance metrics
- ❌ `affiliate_fraud_alerts` - Fraud detection and prevention

**Schema Gaps:**
- No link tracking mechanism
- No click analytics
- No payout batch processing
- No marketing materials library
- No multi-tier commission support
- No fraud detection
- No performance caching

### 1.2 Backend Implementation (MISSING - 0% Complete)

**Status:** NO backend implementation exists

**Missing Components:**
- ❌ `backend/src/services/AffiliateService.js` - Core business logic
- ❌ `backend/src/controllers/affiliateController.js` - API endpoints
- ❌ `backend/src/routes/affiliate.js` - Route definitions
- ❌ Link generation and tracking logic
- ❌ Commission calculation engine
- ❌ Payout processing system
- ❌ Fraud detection algorithms
- ❌ Performance analytics aggregation

### 1.3 Frontend Implementation (MISSING - 0% Complete)

**Status:** NO frontend pages exist

**Missing Pages:**
- ❌ Main affiliate dashboard (`/modules/affiliate-system/page.jsx`)
- ❌ Affiliate registration/onboarding (`/modules/affiliate-system/register/page.jsx`)
- ❌ Tracking links management (`/modules/affiliate-system/links/page.jsx`)
- ❌ Performance analytics (`/modules/affiliate-system/analytics/page.jsx`)
- ❌ Payouts management (`/modules/affiliate-system/payouts/page.jsx`)
- ❌ Marketing materials library (`/modules/affiliate-system/materials/page.jsx`)
- ❌ Affiliate profile settings (`/modules/affiliate-system/settings/page.jsx`)

---

## 2. BENCHMARK ANALYSIS

### 2.1 PartnerStack Features (Target Benchmark)

**Core Features:**
1. ✅ Affiliate registration and approval workflow
2. ✅ Unique tracking links per affiliate
3. ✅ Real-time click and conversion tracking
4. ✅ Multi-tier commission structures
5. ✅ Automated commission calculations
6. ✅ Payout batch processing
7. ✅ Marketing materials library (banners, emails, social posts)
8. ✅ Performance analytics dashboard
9. ✅ Fraud detection and prevention
10. ✅ Affiliate portal with self-service tools
11. ✅ Email notifications for conversions and payouts
12. ✅ Custom commission rules per affiliate
13. ✅ Referral cookie tracking (30-90 days)
14. ✅ Multi-currency support
15. ✅ Tax form management (W-9, W-8BEN)

**Advanced Features:**
16. ✅ Sub-affiliate networks (MLM support)
17. ✅ Performance-based tier upgrades
18. ✅ Branded affiliate portals
19. ✅ API for external integrations
20. ✅ Webhook notifications

### 2.2 Tapfiliate Features

**Additional Features:**
1. ✅ Lifetime commission tracking
2. ✅ Recurring commission for subscriptions
3. ✅ Custom conversion events
4. ✅ A/B testing for affiliate campaigns
5. ✅ Social media tracking
6. ✅ Mobile app deep linking
7. ✅ Coupon code tracking
8. ✅ QR code generation for affiliates

### 2.3 Our Implementation Target

**Must-Have (MVP):**
1. Affiliate registration with approval workflow
2. Unique tracking links with click tracking
3. Conversion attribution and commission calculation
4. Performance analytics dashboard
5. Payout management system
6. Marketing materials library
7. Fraud detection basics
8. Email notifications

**Should-Have (Phase 2):**
9. Multi-tier commission structures
10. Recurring commissions for subscriptions
11. Custom commission rules per affiliate
12. Sub-affiliate networks
13. Performance-based tier upgrades
14. Tax form management

**Nice-to-Have (Phase 3):**
15. Branded affiliate portals
16. A/B testing for campaigns
17. Social media tracking
18. Mobile app deep linking

---

## 3. IMPLEMENTATION PLAN

### Phase 1: Database Enhancement (Migration 022b)

**New Tables to Create:**

```sql
-- Tracking Links
CREATE TABLE affiliate_tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  link_code TEXT NOT NULL, -- Short unique code (e.g., "ABC123")
  destination_url TEXT NOT NULL,
  campaign_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, link_code)
);

-- Click Tracking
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  link_id UUID REFERENCES affiliate_tracking_links(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country_code TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  clicked_at TIMESTAMPTZ DEFAULT now()
);

-- Payout Batches
CREATE TABLE affiliate_payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  batch_name TEXT NOT NULL,
  total_amount_ngn BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  payment_method TEXT, -- 'bank_transfer', 'paypal', 'stripe'
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Payout Items
CREATE TABLE affiliate_payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES affiliate_payout_batches(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  conversion_ids UUID[], -- Array of conversion IDs included
  amount_ngn BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Materials
CREATE TABLE affiliate_marketing_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN ('banner','email','social','video','landing_page')),
  file_url TEXT,
  thumbnail_url TEXT,
  dimensions TEXT, -- e.g., "300x250" for banners
  download_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Commission Tiers
CREATE TABLE affiliate_commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tier_name TEXT NOT NULL,
  min_conversions INT NOT NULL DEFAULT 0,
  commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage','flat')),
  commission_value NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fraud Alerts
CREATE TABLE affiliate_fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'suspicious_clicks', 'duplicate_conversions', 'invalid_traffic'
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Cache (for fast dashboard loading)
CREATE TABLE affiliate_performance_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_clicks INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  total_revenue_ngn BIGINT DEFAULT 0,
  total_commission_ngn BIGINT DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, affiliate_id, period_start, period_end)
);
```

**Indexes:**
```sql
CREATE INDEX affiliate_clicks_affiliate_idx ON affiliate_clicks(affiliate_id, clicked_at DESC);
CREATE INDEX affiliate_clicks_org_date_idx ON affiliate_clicks(org_id, clicked_at DESC);
CREATE INDEX affiliate_conversions_status_idx ON affiliate_conversions(org_id, status);
CREATE INDEX affiliate_payouts_batch_idx ON affiliate_payout_items(batch_id);
CREATE INDEX affiliate_fraud_unresolved_idx ON affiliate_fraud_alerts(org_id, is_resolved) WHERE is_resolved = false;
```

### Phase 2: Backend Implementation

**File: `backend/src/services/AffiliateService.js`**

**Methods Required (25+):**
1. `createAffiliate(orgId, data)` - Register new affiliate
2. `updateAffiliate(orgId, affiliateId, data)` - Update affiliate profile
3. `deleteAffiliate(orgId, affiliateId)` - Remove affiliate
4. `getAffiliate(orgId, affiliateId)` - Get single affiliate
5. `listAffiliates(orgId, filters)` - List all affiliates with filters
6. `approveAffiliate(orgId, affiliateId)` - Approve pending affiliate
7. `pauseAffiliate(orgId, affiliateId)` - Pause affiliate account
8. `generateTrackingLink(orgId, affiliateId, destination, campaign)` - Create tracking link
9. `listTrackingLinks(orgId, affiliateId)` - Get affiliate's links
10. `trackClick(linkCode, metadata)` - Record click event
11. `trackConversion(orgId, affiliateId, orderData)` - Record conversion
12. `calculateCommission(orgId, affiliateId, amount)` - Calculate commission
13. `getPerformanceStats(orgId, affiliateId, dateRange)` - Get performance metrics
14. `getTopAffiliates(orgId, limit, metric)` - Get top performers
15. `createPayoutBatch(orgId, affiliateIds, dateRange)` - Create payout batch
16. `processPayoutBatch(orgId, batchId)` - Process payments
17. `getPayoutHistory(orgId, affiliateId)` - Get payout history
18. `uploadMarketingMaterial(orgId, data)` - Add marketing material
19. `listMarketingMaterials(orgId, type)` - List materials
20. `trackMaterialDownload(orgId, materialId)` - Track downloads
21. `detectFraud(orgId, affiliateId)` - Run fraud detection
22. `getFraudAlerts(orgId, filters)` - Get fraud alerts
23. `resolveAlert(orgId, alertId)` - Mark alert as resolved
24. `getConversionsByAffiliate(orgId, affiliateId, filters)` - Get conversions
25. `updateConversionStatus(orgId, conversionId, status)` - Approve/reject conversion
26. `getAffiliateAnalytics(orgId, dateRange)` - Overall analytics
27. `exportAffiliateReport(orgId, format)` - Export data

**File: `backend/src/controllers/affiliateController.js`**

**Endpoints Required (30+):**
```javascript
// Affiliate Management
POST   /api/affiliates                    - Create affiliate
GET    /api/affiliates                    - List affiliates
GET    /api/affiliates/:id                - Get affiliate
PUT    /api/affiliates/:id                - Update affiliate
DELETE /api/affiliates/:id                - Delete affiliate
POST   /api/affiliates/:id/approve        - Approve affiliate
POST   /api/affiliates/:id/pause          - Pause affiliate
POST   /api/affiliates/:id/resume         - Resume affiliate

// Tracking Links
POST   /api/affiliates/:id/links          - Create tracking link
GET    /api/affiliates/:id/links          - List tracking links
PUT    /api/affiliates/links/:linkId      - Update link
DELETE /api/affiliates/links/:linkId      - Delete link
GET    /api/track/:linkCode               - Public tracking endpoint (redirect)

// Conversions
POST   /api/affiliates/conversions        - Record conversion
GET    /api/affiliates/:id/conversions    - Get affiliate conversions
GET    /api/affiliates/conversions/:id    - Get conversion details
PUT    /api/affiliates/conversions/:id    - Update conversion status

// Performance & Analytics
GET    /api/affiliates/:id/performance    - Get performance stats
GET    /api/affiliates/analytics          - Overall analytics
GET    /api/affiliates/top-performers     - Get top affiliates
GET    /api/affiliates/:id/clicks         - Get click history

// Payouts
POST   /api/affiliates/payouts/batches    - Create payout batch
GET    /api/affiliates/payouts/batches    - List payout batches
GET    /api/affiliates/payouts/batches/:id - Get batch details
POST   /api/affiliates/payouts/batches/:id/process - Process batch
GET    /api/affiliates/:id/payouts        - Get affiliate payout history

// Marketing Materials
POST   /api/affiliates/materials          - Upload material
GET    /api/affiliates/materials          - List materials
GET    /api/affiliates/materials/:id      - Get material
DELETE /api/affiliates/materials/:id      - Delete material
POST   /api/affiliates/materials/:id/download - Track download

// Fraud Detection
GET    /api/affiliates/fraud-alerts       - List fraud alerts
POST   /api/affiliates/fraud-alerts/:id/resolve - Resolve alert
POST   /api/affiliates/:id/fraud-check    - Run fraud check
```

### Phase 3: Frontend Implementation

**Pages Required (6 pages):**

1. **Main Dashboard** (`/modules/affiliate-system/page.jsx`)
   - Overview stats (total affiliates, active, pending approval)
   - Total clicks, conversions, revenue this month
   - Top performers table
   - Recent conversions list
   - Quick actions (add affiliate, create payout)

2. **Affiliate Management** (`/modules/affiliate-system/affiliates/page.jsx`)
   - Searchable affiliate list with filters
   - Status badges (active, paused, pending)
   - Bulk actions (approve, pause, delete)
   - Individual affiliate cards with quick stats
   - Add/edit affiliate modal

3. **Tracking Links** (`/modules/affiliate-system/links/page.jsx`)
   - Link generator form
   - List of all tracking links
   - Click analytics per link
   - QR code generation
   - Copy link button

4. **Performance Analytics** (`/modules/affiliate-system/analytics/page.jsx`)
   - Date range selector
   - Charts: clicks over time, conversions over time, revenue over time
   - Conversion rate trends
   - Top performing links
   - Geographic distribution map
   - Device breakdown (desktop/mobile/tablet)

5. **Payouts Management** (`/modules/affiliate-system/payouts/page.jsx`)
   - Create payout batch wizard
   - List of payout batches (pending, processing, completed)
   - Batch details with line items
   - Export payout reports
   - Payment method configuration

6. **Marketing Materials** (`/modules/affiliate-system/materials/page.jsx`)
   - Material library grid view
   - Filter by type (banner, email, social, video)
   - Upload new materials
   - Preview modal
   - Download tracking stats

---

## 4. FEATURE COMPARISON

| Feature | PartnerStack | Tapfiliate | Our Target | Status |
|---------|--------------|------------|------------|--------|
| Affiliate Registration | ✅ | ✅ | ✅ | TODO |
| Tracking Links | ✅ | ✅ | ✅ | TODO |
| Click Tracking | ✅ | ✅ | ✅ | TODO |
| Conversion Tracking | ✅ | ✅ | ✅ | PARTIAL |
| Commission Calculation | ✅ | ✅ | ✅ | PARTIAL |
| Payout Processing | ✅ | ✅ | ✅ | TODO |
| Marketing Materials | ✅ | ✅ | ✅ | TODO |
| Performance Analytics | ✅ | ✅ | ✅ | TODO |
| Fraud Detection | ✅ | ✅ | ✅ | TODO |
| Multi-tier Commissions | ✅ | ✅ | ✅ | TODO |
| Recurring Commissions | ✅ | ✅ | ⚠️ Phase 2 | TODO |
| Sub-affiliates (MLM) | ✅ | ❌ | ⚠️ Phase 2 | TODO |
| Branded Portals | ✅ | ✅ | ⚠️ Phase 3 | TODO |
| API/Webhooks | ✅ | ✅ | ⚠️ Phase 2 | TODO |
| Tax Forms | ✅ | ❌ | ⚠️ Phase 2 | TODO |

---

## 5. IMPLEMENTATION PRIORITY

### High Priority (Must Complete)
1. ✅ Database migration with 8 new tables
2. ✅ AffiliateService with 27 methods
3. ✅ affiliateController with 30+ endpoints
4. ✅ 6 frontend pages
5. ✅ Link tracking and click analytics
6. ✅ Commission calculation engine
7. ✅ Payout batch processing
8. ✅ Basic fraud detection

### Medium Priority (Should Complete)
9. Multi-tier commission structures
10. Performance-based tier upgrades
11. Email notifications
12. Marketing materials library
13. Advanced fraud detection

### Low Priority (Nice to Have)
14. Sub-affiliate networks
15. Recurring commissions
16. Tax form management
17. Branded affiliate portals

---

## 6. SUCCESS CRITERIA

**Module 10 is COMPLETE when:**
1. ✅ Database has 8+ new tables for full affiliate system
2. ✅ Backend has AffiliateService with 25+ methods
3. ✅ Backend has 30+ API endpoints
4. ✅ Frontend has 6 complete pages
5. ✅ Link tracking works end-to-end
6. ✅ Commission calculation is accurate
7. ✅ Payout processing is functional
8. ✅ Fraud detection alerts work
9. ✅ Performance analytics display correctly
10. ✅ All features match or exceed PartnerStack benchmark

---

## 7. ESTIMATED EFFORT

- **Database Migration:** 1 hour
- **Backend Service:** 3 hours
- **Backend Controller/Routes:** 2 hours
- **Frontend Pages:** 4 hours
- **Testing:** 1 hour
- **Documentation:** 30 minutes

**Total:** ~11.5 hours

---

## 8. NEXT STEPS

1. Create database migration `022b_affiliate_system_expansion.sql`
2. Implement `AffiliateService.js`
3. Implement `affiliateController.js`
4. Create affiliate routes
5. Build 6 frontend pages
6. Test end-to-end flows
7. Create completion report
8. Update progress ledger

---

**Audit Complete** ✅  
**Ready to Begin Implementation** 🚀
