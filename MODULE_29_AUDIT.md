# Module 29: Content Calendar - Initial Audit

**Benchmark:** CoSchedule / Loomly  
**Current Status:** Basic calendar exists (~20% complete)  
**Audit Date:** 2026-07-18

## What Currently Exists

### Backend
**File:** `backend/src/controllers/calendarController.js` (~60 lines)
- Basic CRUD operations for calendar events
- `listEvents(start, end)` - List events in date range
- `createEvent()` - Create calendar event
- `updateEvent()` - Update event
- `deleteEvent()` - Delete event
- Bulk delete support

**Routes:** `backend/src/routes/calendar.js`
- Registered in routes.config.js

### Database
**Table:** `calendar_events` (11 columns)
- id, org_id, title, description
- start_at, end_at, all_day
- color, location, url
- created_at

**Indexes:** org_id index

### Frontend
- Status: UNKNOWN (need to check)

## Gap Analysis vs. Benchmark (CoSchedule/Loomly)

### Missing Core Features (80% of functionality)

#### 1. Content Planning & Scheduling
- ❌ Content types (blog post, social media, email, video, etc.)
- ❌ Multi-channel publishing (schedule across platforms)
- ❌ Content status workflow (draft, review, scheduled, published)
- ❌ Recurring content templates
- ❌ Content categories/tags
- ❌ Campaign grouping
- ❌ Content templates library

#### 2. Team Collaboration
- ❌ Task assignments (who creates, who reviews, who publishes)
- ❌ Approval workflows
- ❌ Comments/notes on content items
- ❌ @mentions and notifications
- ❌ Team member availability
- ❌ Workload balancing view

#### 3. Content Creation
- ❌ Rich text editor for content
- ❌ Media library integration
- ❌ SEO optimization tools
- ❌ Hashtag suggestions
- ❌ Content briefs/guidelines
- ❌ Version history

#### 4. Publishing Integration
- ❌ Social media platform connections (Facebook, Twitter, LinkedIn, Instagram)
- ❌ Blog/CMS integration (WordPress, etc.)
- ❌ Email marketing integration
- ❌ Auto-publish functionality
- ❌ Publishing queue management

#### 5. Analytics & Reporting
- ❌ Content performance metrics
- ❌ Engagement tracking
- ❌ Best time to post analysis
- ❌ Content gap analysis
- ❌ Team productivity reports

#### 6. Calendar Views
- ❌ Month/week/day/list views
- ❌ Drag-and-drop rescheduling
- ❌ Color coding by content type/campaign
- ❌ Filter by channel/status/assignee
- ❌ Multi-calendar view (different teams/brands)

#### 7. Content Library
- ❌ Reusable content snippets
- ❌ Brand assets library
- ❌ Content ideas backlog
- ❌ Content recycling suggestions

#### 8. Integrations
- ❌ Email Marketing (Module 6)
- ❌ Social Media Scheduler (Module 21)
- ❌ Blog/Website Builder (Module 4)
- ❌ CRM (Module 1)
- ❌ Marketing Automation (Module 9)

## What Needs to Be Built

### Phase 1: Enhanced Data Model
1. **Content Items Table**
   - content_type (blog, social, email, video, etc.)
   - status (draft, review, scheduled, published, archived)
   - channel (facebook, twitter, linkedin, blog, email, etc.)
   - campaign_id
   - assigned_to, reviewed_by, published_by
   - content_body (rich text)
   - media_urls (array)
   - seo_title, seo_description, keywords
   - hashtags
   - scheduled_at, published_at
   - performance_metrics (jsonb)

2. **Content Campaigns Table**
   - name, description, color
   - start_date, end_date
   - goals, budget

3. **Content Templates Table**
   - name, content_type, template_body
   - default_hashtags, default_settings

4. **Content Approvals Table**
   - content_id, approver_id
   - status (pending, approved, rejected)
   - comments, approved_at

5. **Content Comments Table**
   - content_id, user_id, comment_text
   - mentions (array of user_ids)

6. **Publishing Connections Table**
   - platform (facebook, twitter, etc.)
   - credentials (encrypted)
   - status (connected, disconnected)

### Phase 2: Backend Service
1. **ContentCalendarService**
   - Content CRUD with status workflow
   - Campaign management
   - Template management
   - Approval workflow
   - Publishing queue
   - Analytics aggregation

2. **Publishing Integrations**
   - Social media APIs (Facebook, Twitter, LinkedIn, Instagram)
   - WordPress/blog integration
   - Email marketing integration

### Phase 3: Frontend UI
1. **Calendar View**
   - Month/week/day/list views
   - Drag-and-drop
   - Color coding
   - Filtering

2. **Content Editor**
   - Rich text editor
   - Media upload
   - SEO tools
   - Preview

3. **Campaign Manager**
   - Campaign creation/editing
   - Content grouping
   - Progress tracking

4. **Team Dashboard**
   - Task assignments
   - Approval queue
   - Team workload

5. **Analytics Dashboard**
   - Performance metrics
   - Best time to post
   - Content gap analysis

## Benchmark Feature Comparison

| Feature | CoSchedule | Loomly | Current | Needed |
|---------|-----------|--------|---------|--------|
| Calendar Views | ✅ | ✅ | ⚠️ (basic) | ✅ |
| Content Types | ✅ | ✅ | ❌ | ✅ |
| Multi-Channel | ✅ | ✅ | ❌ | ✅ |
| Approval Workflow | ✅ | ✅ | ❌ | ✅ |
| Team Collaboration | ✅ | ✅ | ❌ | ✅ |
| Content Editor | ✅ | ✅ | ❌ | ✅ |
| Publishing | ✅ | ✅ | ❌ | ✅ |
| Analytics | ✅ | ✅ | ❌ | ✅ |
| Templates | ✅ | ✅ | ❌ | ✅ |
| Campaigns | ✅ | ✅ | ❌ | ✅ |

## Estimated Effort

- **Backend:** ~800 lines (service + controller + migrations)
- **Frontend:** ~1200 lines (calendar view + editor + dashboards)
- **Integrations:** ~400 lines (social media APIs)
- **Total:** ~2400 lines of production code

## Recommendation

This module requires **significant expansion** from the basic calendar. The existing calendar_events table can be kept for simple events, but a new content-focused data model is needed.

**Build Order:**
1. Database schema (6 new tables)
2. Backend service (content management, workflows)
3. Frontend calendar view (enhanced)
4. Content editor
5. Publishing integrations
6. Analytics dashboard

**Priority:** HIGH - Content Calendar is central to marketing operations and integrates with multiple other modules.
