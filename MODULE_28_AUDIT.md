# Module 28: Landing Page Heat/Scroll Analytics - Initial Audit

**Benchmark:** Hotjar / Microsoft Clarity  
**Current Status:** Minimal skeleton implementation (~5% complete)  
**Audit Date:** 2026-07-18

## What Currently Exists

### Backend (Minimal)
- **File:** `backend/src/routes/heatmaps.js` (50 lines)
- **Routes:**
  - `POST /api/v1/heatmaps/track` - Public endpoint for tracking page events
  - `GET /api/v1/heatmaps/` - List session recordings (paginated)
  - `GET /api/v1/heatmaps/:id` - Get single session recording
- **Route Registration:** Registered in `routes.config.js` as public route

### Database (Basic)
- **Table:** `session_recordings` (8 columns)
  - `id` (uuid, PK)
  - `org_id` (uuid, FK to organizations)
  - `visitor_hash` (text) - visitor identifier
  - `page_url` (text) - tracked page URL
  - `page_title` (text) - page title
  - `events` (jsonb) - raw event data array
  - `duration_secs` (integer) - session duration
  - `created_at` (timestamp)
- **Index:** `idx_sr_org` on (org_id, created_at DESC)

### Frontend
- **Status:** NONE - No UI exists for this module
- **Expected Location:** `frontend/app/modules/landing-page-analytics/` or similar
- **Current:** Module not accessible from frontend

## Gap Analysis vs. Benchmark (Hotjar/Microsoft Clarity)

### Missing Core Features (95% of functionality)

#### 1. Heatmap Generation & Visualization
- ❌ Click heatmaps (where users click)
- ❌ Move heatmaps (mouse movement tracking)
- ❌ Scroll depth heatmaps (how far users scroll)
- ❌ Attention maps (time spent in viewport areas)
- ❌ Rage click detection (frustrated clicking)
- ❌ Dead click detection (clicks on non-interactive elements)
- ❌ Heatmap aggregation engine (combining multiple sessions)
- ❌ Heatmap rendering (canvas/SVG overlay on page screenshots)

#### 2. Session Replay
- ❌ DOM snapshot capture
- ❌ Session playback UI with timeline
- ❌ Speed controls (1x, 2x, 4x)
- ❌ Skip inactivity feature
- ❌ Console log capture
- ❌ Network request tracking
- ❌ Error tracking during sessions
- ❌ Form interaction replay
- ❌ Privacy masking (PII redaction)

#### 3. Analytics & Insights
- ❌ Scroll depth analytics (% of users reaching each depth)
- ❌ Click analytics (most clicked elements)
- ❌ Form analytics (field completion rates, abandonment)
- ❌ Conversion funnel visualization
- ❌ Device/browser breakdown
- ❌ Geographic analytics
- ❌ Entry/exit page analysis
- ❌ Time on page distribution
- ❌ Bounce rate tracking

#### 4. Filtering & Segmentation
- ❌ Filter by URL/page
- ❌ Filter by device type
- ❌ Filter by traffic source
- ❌ Filter by user behavior (rage clicks, errors, etc.)
- ❌ Filter by conversion status
- ❌ Custom event filtering
- ❌ Date range selection

#### 5. Integration Features
- ❌ Landing Page Builder integration (track specific pages)
- ❌ Website Builder integration (track all site pages)
- ❌ Funnel Builder integration (track funnel steps)
- ❌ A/B Testing integration (compare variants)
- ❌ CRM integration (link sessions to contacts)
- ❌ Marketing Automation triggers (based on behavior)

#### 6. Advanced Features
- ❌ Feedback widgets (on-page surveys)
- ❌ User recordings search
- ❌ Saved filters/segments
- ❌ Scheduled reports
- ❌ Team collaboration (comments on recordings)
- ❌ Recording sharing (public links)
- ❌ GDPR compliance tools (data retention, deletion)
- ❌ Sampling controls (% of traffic to track)

#### 7. Performance & Scale
- ❌ Event batching (reduce network requests)
- ❌ Compression (reduce payload size)
- ❌ CDN delivery for tracking script
- ❌ Async processing (background heatmap generation)
- ❌ Data aggregation (daily/hourly rollups)
- ❌ Storage optimization (old session cleanup)

#### 8. Tracking Script
- ❌ Lightweight JavaScript SDK (<10KB)
- ❌ Auto-capture (clicks, scrolls, moves)
- ❌ Custom event tracking API
- ❌ SPA support (React/Vue/Angular)
- ❌ Error handling (graceful degradation)
- ❌ Privacy controls (opt-out, DNT)

#### 9. Admin UI
- ❌ Dashboard with key metrics
- ❌ Heatmap viewer (overlay on page)
- ❌ Session replay player
- ❌ Analytics charts/graphs
- ❌ Filter/search interface
- ❌ Settings panel (tracking config)
- ❌ Embed code generator

#### 10. Database Schema Gaps
Current: 1 table (session_recordings)
Needed: ~15 tables for full functionality:
- ❌ `heatmap_data` - aggregated click/scroll data
- ❌ `heatmap_snapshots` - page screenshots
- ❌ `click_events` - individual click tracking
- ❌ `scroll_events` - scroll depth tracking
- ❌ `mouse_events` - mouse movement tracking
- ❌ `form_events` - form interaction tracking
- ❌ `error_events` - JavaScript errors
- ❌ `network_events` - API calls during session
- ❌ `console_logs` - console output
- ❌ `page_snapshots` - DOM snapshots for replay
- ❌ `analytics_daily` - daily aggregated metrics
- ❌ `filters` - saved filter configurations
- ❌ `feedback_responses` - on-page survey responses
- ❌ `tracking_settings` - per-page tracking config
- ❌ `recording_shares` - shared recording links

## What Needs to Be Built

### Phase 1: Core Backend (Priority 1)
1. **HeatmapService** (~800 lines)
   - Event aggregation engine
   - Heatmap data generation
   - Click/scroll/move tracking
   - Rage click detection
   - Analytics calculations

2. **Database Migrations** (15 new tables)
   - Full schema for all event types
   - Indexes for performance
   - Foreign key relationships

3. **API Endpoints** (~30 endpoints)
   - Heatmap CRUD
   - Session replay CRUD
   - Analytics queries
   - Filter management
   - Settings management

4. **Tracking Script** (separate package)
   - Lightweight JS SDK
   - Event capture
   - Batching & compression
   - Privacy controls

### Phase 2: Frontend UI (Priority 1)
1. **Main Dashboard** (`frontend/app/modules/landing-page-analytics/page.jsx`)
   - Key metrics cards
   - Recent recordings list
   - Quick filters
   - Navigation to sub-pages

2. **Heatmap Viewer** (`frontend/app/modules/landing-page-analytics/heatmaps/[pageId]/page.jsx`)
   - Page screenshot display
   - Heatmap overlay (click/scroll/move)
   - Type switcher
   - Filter controls

3. **Session Replay Player** (`frontend/app/modules/landing-page-analytics/recordings/[id]/page.jsx`)
   - Video-like playback UI
   - Timeline with events
   - Speed controls
   - Event markers

4. **Analytics Dashboard** (`frontend/app/modules/landing-page-analytics/analytics/page.jsx`)
   - Charts (scroll depth, clicks, etc.)
   - Device/browser breakdown
   - Geographic map
   - Conversion funnel

5. **Settings Page** (`frontend/app/modules/landing-page-analytics/settings/page.jsx`)
   - Tracking configuration
   - Privacy settings
   - Embed code generator
   - Data retention controls

### Phase 3: Integrations (Priority 2)
1. Landing Page Builder integration
2. Website Builder integration
3. Funnel Builder integration
4. CRM contact linking
5. Marketing Automation triggers

### Phase 4: Advanced Features (Priority 3)
1. Feedback widgets
2. A/B testing integration
3. Team collaboration
4. Scheduled reports
5. Advanced filtering

## Benchmark Feature Comparison

| Feature | Hotjar | Clarity | Current | Needed |
|---------|--------|---------|---------|--------|
| Click Heatmaps | ✅ | ✅ | ❌ | ✅ |
| Scroll Heatmaps | ✅ | ✅ | ❌ | ✅ |
| Move Heatmaps | ✅ | ✅ | ❌ | ✅ |
| Session Replay | ✅ | ✅ | ⚠️ (data only) | ✅ |
| Rage Clicks | ✅ | ✅ | ❌ | ✅ |
| Dead Clicks | ✅ | ✅ | ❌ | ✅ |
| Form Analytics | ✅ | ✅ | ❌ | ✅ |
| Funnel Analysis | ✅ | ✅ | ❌ | ✅ |
| Feedback Widgets | ✅ | ❌ | ❌ | ✅ |
| Filtering | ✅ | ✅ | ❌ | ✅ |
| Device Breakdown | ✅ | ✅ | ❌ | ✅ |
| Geographic Data | ✅ | ✅ | ❌ | ✅ |
| Privacy Controls | ✅ | ✅ | ❌ | ✅ |
| Team Collaboration | ✅ | ❌ | ❌ | ✅ |
| API Access | ✅ | ✅ | ⚠️ (basic) | ✅ |

## Estimated Effort

- **Backend:** ~1200 lines (service + controller + migrations)
- **Frontend:** ~1500 lines (5 major pages + components)
- **Tracking Script:** ~500 lines (separate package)
- **Testing:** Full end-to-end testing required
- **Total:** ~3200 lines of production code

## Recommendation

This module requires a **complete rebuild** from the ground up. The existing skeleton (session_recordings table + basic routes) can be kept as a foundation, but 95% of the functionality needs to be built.

**Build Order:**
1. Database schema (all 15 tables)
2. Backend service layer (event processing, aggregation)
3. API endpoints (CRUD + analytics)
4. Tracking script (JS SDK)
5. Frontend UI (dashboard, heatmap viewer, replay player)
6. Integrations (Landing Page Builder, Website Builder)
7. Testing & optimization

**Priority:** HIGH - This is a core analytics module that provides critical insights for marketing optimization.
