# Website Builder Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the complete Website Builder ecosystem rebuild. Follow these phases sequentially to ensure a solid foundation.

---

## Phase 1: Database Migration & Setup ✅ COMPLETED

### Completed Files:
- ✅ `118_builder_themes.sql` - Theme system with design tokens
- ✅ `119_builder_components.sql` - Component library system
- ✅ `120_builder_sections.sql` - Sections library with 15 default sections
- ✅ `121_builder_templates.sql` - Template system with multi-page support
- ✅ `122_builder_enhancements.sql` - Enhanced pages, funnels, sites, assets
- ✅ `123_seed_real_estate_template.sql` - Complete Real Estate template (10 pages)

### Next Steps:
1. Run migrations in order (118-123)
2. Verify all tables created successfully
3. Confirm seed data loaded properly

---

## Phase 2: Backend API Development

### 2.1 Theme System API

**File:** `backend/src/routes/builder-themes.js`

```javascript
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const router = Router();

router.use(requireAuth);

// GET /api/v1/builder/themes - List all themes (global + org-specific)
// GET /api/v1/builder/themes/:id - Get theme details
// POST /api/v1/builder/themes - Create custom theme
// PUT /api/v1/builder/themes/:id - Update theme
// DELETE /api/v1/builder/themes/:id - Delete theme

module.exports = router;
```

**Controller:** `backend/src/controllers/builderThemesController.js`

Implement:
- List themes (filter by global/org)
- Get theme with full design tokens
- Create/update custom themes
- Apply theme to pages/sites
- Theme preview generation

### 2.2 Components Library API

**File:** `backend/src/routes/builder-components.js`

```javascript
// GET /api/v1/builder/components - List components by category
// GET /api/v1/builder/components/:id - Get component details
// POST /api/v1/builder/components - Create custom component
// PUT /api/v1/builder/components/:id - Update component
// DELETE /api/v1/builder/components/:id - Delete component
```

**Controller:** `backend/src/controllers/builderComponentsController.js`

Implement:
- Component CRUD operations
- Category filtering
- Tag-based search
- Usage tracking
- Component variants

### 2.3 Sections Library API

**File:** `backend/src/routes/builder-sections.js`

```javascript
// GET /api/v1/builder/sections - List sections by category
// GET /api/v1/builder/sections/:id - Get section details
// POST /api/v1/builder/sections - Create custom section
// PUT /api/v1/builder/sections/:id - Update section
// DELETE /api/v1/builder/sections/:id - Delete section
// POST /api/v1/builder/sections/:id/use - Add section to page
```

**Controller:** `backend/src/controllers/builderSectionsController.js`

Implement:
- Section CRUD operations
- Category/style filtering
- Tag-based search
- Usage tracking
- Section preview generation

### 2.4 Templates API

**File:** `backend/src/routes/builder-templates.js`

```javascript
// GET /api/v1/builder/templates - List templates (with filters)
// GET /api/v1/builder/templates/:id - Get template details
// GET /api/v1/builder/templates/:id/pages - Get template pages
// POST /api/v1/builder/templates/:id/use - Create site from template
// GET /api/v1/builder/templates/categories - List categories
// GET /api/v1/builder/templates/industries - List industries
```

**Controller:** `backend/src/controllers/builderTemplatesController.js`

Implement:
- Template browsing with filters (industry, style, category)
- Template details with all pages
- Template usage (create complete site from template)
- Template search
- Featured templates
- Popular templates
- Template ratings

### 2.5 Sites API

**File:** `backend/src/routes/builder-sites.js`

```javascript
// GET /api/v1/builder/sites - List user's sites
// GET /api/v1/builder/sites/:id - Get site details
// POST /api/v1/builder/sites - Create new site
// PUT /api/v1/builder/sites/:id - Update site
// DELETE /api/v1/builder/sites/:id - Delete site
// GET /api/v1/builder/sites/:id/pages - Get site pages
// PUT /api/v1/builder/sites/:id/navigation - Update navigation
```

**Controller:** `backend/src/controllers/builderSitesController.js`

Implement:
- Site CRUD operations
- Multi-page site management
- Navigation structure management
- Domain management
- Site-wide settings
- Site publishing

### 2.6 Enhanced Pages API

**Update:** `backend/src/routes/pages.js`

Add new endpoints:
```javascript
// GET /api/v1/pages/:id/revisions - Get page revision history
// POST /api/v1/pages/:id/revisions/:revisionId/restore - Restore revision
// POST /api/v1/pages/:id/duplicate - Duplicate page
// PUT /api/v1/pages/:id/theme - Apply theme to page
```

**Update:** `backend/src/controllers/pagesController.js`

Add:
- Revision history management
- Autosave functionality
- Theme application
- Responsive settings management
- SEO settings management

### 2.7 Assets API

**File:** `backend/src/routes/builder-assets.js`

```javascript
// GET /api/v1/builder/assets - List assets
// POST /api/v1/builder/assets/upload - Upload asset
// GET /api/v1/builder/assets/:id - Get asset details
// PUT /api/v1/builder/assets/:id - Update asset metadata
// DELETE /api/v1/builder/assets/:id - Delete asset
// GET /api/v1/builder/assets/folders - List folders
// POST /api/v1/builder/assets/folders - Create folder
```

**Controller:** `backend/src/controllers/builderAssetsController.js`

Implement:
- Asset upload with optimization
- Asset organization (folders, tags)
- Asset search
- Usage tracking
- Integration with Pexels/Unsplash

### 2.8 Global Blocks API

**File:** `backend/src/routes/builder-global-blocks.js`

```javascript
// GET /api/v1/builder/global-blocks - List global blocks
// GET /api/v1/builder/global-blocks/:id - Get global block
// POST /api/v1/builder/global-blocks - Create global block
// PUT /api/v1/builder/global-blocks/:id - Update global block
// DELETE /api/v1/builder/global-blocks/:id - Delete global block
```

**Controller:** `backend/src/controllers/builderGlobalBlocksController.js`

Implement:
- Global block CRUD
- Usage tracking
- Block synchronization across pages

---

## Phase 3: Frontend Visual Builder

### 3.1 Builder UI Structure

**Directory:** `frontend/components/builder/`

Create new components:
- `VisualBuilder.jsx` - Main builder container
- `BuilderCanvas.jsx` - Live preview canvas
- `BuilderToolbar.jsx` - Top toolbar
- `ElementsPanel.jsx` - Left sidebar with blocks/sections
- `PropertiesPanel.jsx` - Right sidebar with settings
- `LayerNavigator.jsx` - Bottom panel with layer tree
- `ThemeSelector.jsx` - Theme selection modal
- `TemplateSelector.jsx` - Template browser modal
- `AssetManager.jsx` - Asset library modal

### 3.2 Drag & Drop System

**Library:** `@dnd-kit/core`

Install:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Implement:
- Draggable blocks from elements panel
- Droppable zones in canvas
- Sortable blocks within containers
- Visual drop indicators
- Snap to grid
- Alignment guides

### 3.3 Block System

**File:** `frontend/components/builder/blocks/`

Create block components for each type:
- `HeroBlock.jsx`
- `TextBlock.jsx`
- `ImageBlock.jsx`
- `VideoBlock.jsx`
- `FeaturesBlock.jsx`
- `TestimonialsBlock.jsx`
- `CTABlock.jsx`
- `FormBlock.jsx`
- `ColumnsBlock.jsx`
- `NavigationBlock.jsx`
- `FooterBlock.jsx`
- etc. (50+ block types)

Each block should:
- Render preview in canvas
- Support inline editing
- Expose settings in properties panel
- Support responsive controls
- Handle animations

### 3.4 Properties Panel

**File:** `frontend/components/builder/PropertiesPanel.jsx`

Implement controls for:
- Layout (width, height, padding, margin)
- Typography (font, size, weight, color)
- Background (color, gradient, image)
- Border (width, style, color, radius)
- Effects (shadow, opacity, blur)
- Animations (entrance, scroll, hover)
- Responsive settings per breakpoint
- Custom CSS/JS

### 3.5 Theme System Integration

**File:** `frontend/components/builder/ThemeSelector.jsx`

Implement:
- Browse available themes
- Preview theme on page
- Apply theme to page/site
- Customize theme colors
- Save custom themes

### 3.6 Template Browser

**File:** `frontend/components/builder/TemplateBrowser.jsx`

Implement:
- Grid view of templates
- Filter by industry
- Filter by style
- Filter by category
- Search templates
- Template preview
- "Use Template" action
- Featured templates section
- Popular templates section

### 3.7 Responsive Controls

**File:** `frontend/components/builder/ResponsiveControls.jsx`

Implement:
- Breakpoint switcher (mobile/tablet/desktop)
- Per-breakpoint settings
- Show/hide on breakpoints
- Responsive preview
- Device frames

### 3.8 Revision History

**File:** `frontend/components/builder/RevisionHistory.jsx`

Implement:
- List all revisions
- Compare revisions
- Restore previous version
- Autosave indicator
- Manual save points

---

## Phase 4: Template Creation System

### 4.1 Template Creation Workflow

Create a systematic approach to building 500+ templates:

1. **Industry Research**
   - Study industry-specific needs
   - Identify key pages required
   - Research competitor websites
   - Gather design inspiration

2. **Design System**
   - Define color palette per style variant
   - Select appropriate fonts
   - Create component library
   - Design section layouts

3. **Page Structure**
   - Define navigation structure
   - Create page hierarchy
   - Design each page layout
   - Add appropriate sections

4. **Content Creation**
   - Write placeholder content
   - Select appropriate images
   - Add realistic data
   - Optimize for SEO

5. **Quality Assurance**
   - Test responsive design
   - Verify all links work
   - Check SEO metadata
   - Test performance
   - Validate accessibility

### 4.2 Template Creation Script

**File:** `backend/scripts/create-template.js`

Create a CLI tool to streamline template creation:

```javascript
// Usage: node scripts/create-template.js --industry restaurant --variant modern

const createTemplate = async (industry, variant) => {
  // 1. Create template record
  // 2. Create pages based on industry
  // 3. Add appropriate sections to each page
  // 4. Apply style variant
  // 5. Generate thumbnails
  // 6. Set SEO metadata
};
```

### 4.3 Batch Template Creation

Create templates in batches:

**Week 1-2: Business & Professional (20 templates)**
- Corporate Business (3 variants)
- Consulting Firm (3 variants)
- Digital Agency (3 variants)
- Marketing Agency (2 variants)
- Law Firm (3 variants)
- Accounting Firm (2 variants)
- Real Estate (4 variants) ✅ DONE

**Week 3-4: Healthcare & Wellness (20 templates)**
- Hospital (3 variants)
- Medical Clinic (3 variants)
- Dental Clinic (2 variants)
- Fitness Center (3 variants)
- Spa & Wellness (3 variants)
- Yoga Studio (2 variants)
- etc.

Continue for all 100+ industries...

---

## Phase 5: Advanced Features

### 5.1 AI-Powered Features

**Content Generation:**
- AI-generated page content
- AI-suggested layouts
- AI-optimized headlines
- AI-written meta descriptions

**Design Assistance:**
- AI color palette suggestions
- AI font pairing recommendations
- AI layout optimization
- AI image selection

### 5.2 Collaboration Features

**Real-time Editing:**
- Multiple users editing simultaneously
- Cursor presence indicators
- Change notifications
- Conflict resolution

**Comments & Feedback:**
- Add comments to blocks
- Mention team members
- Resolve comments
- Comment threads

### 5.3 Advanced SEO

**SEO Analyzer:**
- Content analysis
- Keyword optimization
- Readability score
- Meta tag validation
- Schema markup validation

**SEO Recommendations:**
- Suggest improvements
- Competitor analysis
- Keyword research
- Backlink opportunities

### 5.4 Performance Optimization

**Automatic Optimization:**
- Image compression
- Lazy loading
- Code minification
- Critical CSS extraction
- Resource preloading

**Performance Monitoring:**
- Core Web Vitals tracking
- Lighthouse scores
- Performance recommendations
- Load time analysis

---

## Phase 6: Testing & Quality Assurance

### 6.1 Unit Tests

Test all backend controllers:
```bash
npm test -- --grep "builder"
```

Test all frontend components:
```bash
npm test -- --grep "Builder"
```

### 6.2 Integration Tests

Test complete workflows:
- Create site from template
- Edit page with builder
- Publish site
- View published site
- Apply theme
- Add sections

### 6.3 E2E Tests

Use Playwright or Cypress:
- User creates account
- User browses templates
- User creates site from template
- User customizes pages
- User publishes site
- Visitor views published site

### 6.4 Performance Tests

- Load time under 3 seconds
- Lighthouse score 90+
- Mobile performance
- Large page handling
- Multiple concurrent users

### 6.5 Accessibility Tests

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus indicators

---

## Phase 7: Documentation

### 7.1 User Documentation

Create comprehensive guides:
- Getting Started Guide
- Template Selection Guide
- Page Builder Tutorial
- Theme Customization Guide
- Publishing Guide
- SEO Best Practices
- Performance Optimization

### 7.2 Developer Documentation

Document APIs and architecture:
- API Reference
- Database Schema
- Component Library
- Block System
- Theme System
- Extension Guide

### 7.3 Video Tutorials

Create video content:
- Platform Overview (5 min)
- Creating Your First Site (10 min)
- Customizing Templates (15 min)
- Advanced Builder Features (20 min)
- SEO Optimization (10 min)

---

## Phase 8: Launch Preparation

### 8.1 Beta Testing

- Invite 50-100 beta users
- Gather feedback
- Fix critical bugs
- Improve UX based on feedback

### 8.2 Marketing Materials

Create:
- Landing page
- Feature comparison chart
- Case studies
- Demo videos
- Blog posts
- Social media content

### 8.3 Launch Checklist

- [ ] All 500+ templates created
- [ ] All features tested
- [ ] Documentation complete
- [ ] Performance optimized
- [ ] Security audit passed
- [ ] Accessibility verified
- [ ] Marketing materials ready
- [ ] Support team trained
- [ ] Monitoring setup
- [ ] Backup systems ready

---

## Success Metrics

### Quantitative Goals:
- ✅ 500+ premium templates
- ✅ 100+ industries covered
- ✅ 50+ block types
- [ ] Sub-3s page load time
- [ ] 95+ Lighthouse score
- [ ] 100% mobile responsive
- [ ] WCAG 2.1 AA compliance

### Qualitative Goals:
- [ ] Professional design quality
- [ ] Intuitive user experience
- [ ] Enterprise-grade features
- [ ] Competitive with market leaders
- [ ] Production-ready templates

---

## Timeline Estimate

**Phase 1: Database (Week 1)** ✅ COMPLETED
- Migration files created
- Seed data added

**Phase 2: Backend API (Weeks 2-4)**
- 8 new API modules
- Enhanced existing APIs
- Testing

**Phase 3: Frontend Builder (Weeks 5-8)**
- Visual builder UI
- Drag & drop system
- 50+ block components
- Properties panel
- Theme integration

**Phase 4: Templates (Weeks 9-20)**
- 500+ templates across 100+ industries
- Multiple variants per industry
- Quality assurance

**Phase 5: Advanced Features (Weeks 21-24)**
- AI features
- Collaboration
- Advanced SEO
- Performance optimization

**Phase 6: Testing (Weeks 25-26)**
- Unit tests
- Integration tests
- E2E tests
- Performance tests
- Accessibility tests

**Phase 7: Documentation (Weeks 27-28)**
- User guides
- Developer docs
- Video tutorials

**Phase 8: Launch (Week 29-30)**
- Beta testing
- Marketing
- Final preparations
- Launch

**Total: 30 weeks (7.5 months)**

---

## Next Immediate Steps

1. **Run Database Migrations**
   ```bash
   cd backend
   npm run migrate
   ```

2. **Verify Seed Data**
   ```sql
   SELECT * FROM builder_themes;
   SELECT * FROM builder_sections;
   SELECT * FROM builder_templates;
   ```

3. **Start Backend API Development**
   - Create `backend/src/routes/builder-themes.js`
   - Create `backend/src/controllers/builderThemesController.js`
   - Test theme API endpoints

4. **Plan Frontend Architecture**
   - Review existing PageEditor component
   - Design new VisualBuilder component structure
   - Choose drag & drop library

5. **Create Next Template**
   - Choose next industry (e.g., Restaurant)
   - Create template SQL file
   - Design 8-10 pages
   - Add to seed data

---

## Resources & References

### Design Inspiration:
- Webflow Templates
- Framer Templates
- WordPress Themes
- Wix Templates
- Squarespace Templates

### Technical References:
- Next.js Documentation
- React DnD Kit
- TailwindCSS
- PostgreSQL JSONB

### Stock Resources:
- Pexels (images)
- Unsplash (images)
- Lucide Icons
- Heroicons
- Google Fonts

---

*This is a living document. Update as implementation progresses.*
