# Unified Website Builder - Architecture Plan

**Goal:** Consolidate `/website-builder`, `/builder`, and `/funnel-builder` into ONE unified builder interface

---

## 🎯 Unified Builder Vision

### Single Entry Point: `/builder`

**One interface for:**
- ✅ Single pages (landing pages, blog posts)
- ✅ Multi-page websites (full sites with navigation)
- ✅ Sales funnels (multi-step conversion flows)
- ✅ Templates (browse and use)
- ✅ Assets (manage media)

---

## 🏗️ Architecture Design

### Main Builder Interface Structure

```
/builder
├── Left Sidebar (Context-Aware)
│   ├── Project Selector (Sites/Pages/Funnels)
│   ├── Page/Step Navigator
│   ├── Block Library (32+ blocks)
│   ├── Section Library
│   ├── Template Browser
│   └── Asset Manager
│
├── Top Toolbar
│   ├── Project Info & Breadcrumbs
│   ├── View Mode Toggle (Desktop/Tablet/Mobile)
│   ├── Undo/Redo
│   ├── Save/Publish
│   └── Settings Menu
│
├── Center Canvas (Responsive)
│   ├── Visual Editor
│   ├── Block Rendering
│   ├── Drag & Drop
│   └── Inline Editing
│
└── Right Panel (Context-Aware)
    ├── Block Properties
    ├── Page Settings
    ├── Site Settings
    ├── Funnel Settings
    └── SEO/Analytics
```

---

## 🔄 Unified Data Model

### Project Types
```javascript
{
  type: 'page' | 'site' | 'funnel',
  id: string,
  name: string,
  status: 'draft' | 'published',
  // Type-specific data
}
```

### Unified Block System
- Merge all block types from PageEditor + ExpandedBlockTypes
- 32+ total block types
- Consistent block data structure
- Shared rendering engine

---

## 📱 User Workflows

### Workflow 1: Create Single Page
1. Click "New Project" → Select "Single Page"
2. Choose template or start blank
3. Add/edit blocks in canvas
4. Configure SEO settings
5. Publish

### Workflow 2: Create Multi-Page Site
1. Click "New Project" → Select "Website"
2. Choose site template
3. Add/edit pages
4. Configure navigation
5. Set theme/styling
6. Publish entire site

### Workflow 3: Create Funnel
1. Click "New Project" → Select "Funnel"
2. Choose funnel template
3. Add/edit steps
4. Configure step flow
5. Set conversion tracking
6. Publish funnel

---

## 🧩 Component Architecture

### Core Components

#### 1. `UnifiedBuilder.jsx` (NEW - Main Container)
```javascript
- Manages overall builder state
- Handles project type switching
- Coordinates all sub-components
- Manages save/publish operations
```

#### 2. `UnifiedCanvas.jsx` (NEW - Merged Canvas)
```javascript
- Combines EnhancedBuilderCanvas + PageEditor rendering
- Responsive preview modes
- Block drag & drop
- Inline editing
- Grid overlay
```

#### 3. `UnifiedSidebar.jsx` (NEW - Context-Aware Sidebar)
```javascript
- Project selector
- Page/step navigator
- Block library (32+ blocks)
- Section library
- Template browser
- Asset manager
```

#### 4. `UnifiedToolbar.jsx` (NEW - Top Toolbar)
```javascript
- Project breadcrumbs
- View mode toggle
- Undo/redo
- Save/publish
- Settings
```

#### 5. `UnifiedPropertiesPanel.jsx` (NEW - Right Panel)
```javascript
- Block properties
- Page settings
- Site settings
- Funnel settings
- SEO/analytics
```

#### 6. `BlockRenderer.jsx` (NEW - Unified Block Rendering)
```javascript
- Renders all 32+ block types
- Consistent styling
- Responsive behavior
- Edit mode vs preview mode
```

---

## 🔧 Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Create UnifiedBuilder.jsx main container
- [ ] Merge all block types (12 + 20 = 32 blocks)
- [ ] Create unified block data structure
- [ ] Create BlockRenderer.jsx

### Phase 2: Canvas & Editing (Week 1-2)
- [ ] Create UnifiedCanvas.jsx
- [ ] Implement drag & drop
- [ ] Implement inline editing
- [ ] Add responsive preview modes
- [ ] Add undo/redo

### Phase 3: Navigation & UI (Week 2)
- [ ] Create UnifiedSidebar.jsx
- [ ] Create UnifiedToolbar.jsx
- [ ] Create UnifiedPropertiesPanel.jsx
- [ ] Implement project type switching

### Phase 4: Integration (Week 2-3)
- [ ] Integrate with existing APIs
- [ ] Migrate data from old builders
- [ ] Add template browser
- [ ] Add asset manager
- [ ] Add section library

### Phase 5: Advanced Features (Week 3)
- [ ] Global blocks/symbols
- [ ] Version history
- [ ] Theme customizer
- [ ] Collaboration features

### Phase 6: Migration & Cleanup (Week 4)
- [ ] Redirect old routes to new builder
- [ ] Deprecate old components
- [ ] Update documentation
- [ ] User migration guide

---

## 🗄️ Database Changes

### No Major Schema Changes Required!
- Existing tables work for unified builder
- Add `project_type` field to track context
- Use existing: `pages`, `builder_sites`, `funnels`

### New Fields (Optional)
```sql
ALTER TABLE pages ADD COLUMN IF NOT EXISTS project_type VARCHAR(20) DEFAULT 'page';
ALTER TABLE builder_sites ADD COLUMN IF NOT EXISTS project_type VARCHAR(20) DEFAULT 'site';
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS project_type VARCHAR(20) DEFAULT 'funnel';
```

---

## 🎨 32+ Unified Block Types

### Basic Blocks (12 - from PageEditor)
1. Hero
2. Text
3. Features
4. CTA
5. Testimonials
6. Image
7. Columns
8. Video
9. Spacer
10. Divider
11. Nav
12. Footer
13. Form

### Advanced Blocks (20 - from ExpandedBlockTypes)
14. Pricing
15. FAQ
16. Team
17. Portfolio
18. Gallery
19. Blog
20. Newsletter
21. Stats
22. Timeline
23. Tabs
24. Accordion
25. Countdown
26. Map
27. Social
28. Contact
29. Logo Cloud
30. Process
31. Comparison
32. Embed

---

## 🔀 Migration Strategy

### For Existing Users

#### Pages (/website-builder)
- Automatically migrate to unified builder
- All existing pages work as-is
- No data loss

#### Sites (/builder)
- Automatically migrate to unified builder
- All existing sites work as-is
- No data loss

#### Funnels (/funnel-builder)
- Automatically migrate to unified builder
- All existing funnels work as-is
- No data loss

### Route Redirects
```javascript
// Old routes redirect to new unified builder
/website-builder → /builder?type=page
/builder → /builder (already correct)
/funnel-builder → /builder?type=funnel
```

---

## 📊 Success Metrics

### User Experience
- ✅ Single learning curve (one interface)
- ✅ Consistent editing experience
- ✅ Easy switching between project types
- ✅ No feature loss from consolidation

### Technical
- ✅ Reduced code duplication
- ✅ Easier maintenance
- ✅ Better performance
- ✅ Cleaner architecture

### Business
- ✅ Higher user engagement
- ✅ Faster feature development
- ✅ Better user retention
- ✅ Competitive advantage

---

## 🚀 Launch Plan

### Beta Testing (Week 3)
1. Internal testing with team
2. Select beta users
3. Gather feedback
4. Fix critical issues

### Soft Launch (Week 4)
1. Enable for new users
2. Gradual rollout to existing users
3. Monitor performance
4. Quick iteration

### Full Launch (Week 5)
1. Announce to all users
2. Deprecate old builders
3. Update documentation
4. Marketing push

---

## 📝 File Structure

```
/frontend/app/builder/
├── page.jsx (NEW - Unified Builder Entry)
├── components/
│   ├── UnifiedBuilder.jsx (NEW)
│   ├── UnifiedCanvas.jsx (NEW)
│   ├── UnifiedSidebar.jsx (NEW)
│   ├── UnifiedToolbar.jsx (NEW)
│   ├── UnifiedPropertiesPanel.jsx (NEW)
│   ├── BlockRenderer.jsx (NEW)
│   ├── blocks/ (NEW - 32+ block components)
│   │   ├── HeroBlock.jsx
│   │   ├── TextBlock.jsx
│   │   ├── PricingBlock.jsx
│   │   └── ... (30+ more)
│   └── shared/
│       ├── ProjectSelector.jsx
│       ├── PageNavigator.jsx
│       ├── BlockLibrary.jsx
│       └── TemplateGallery.jsx
```

---

## 🎯 Next Immediate Steps

1. **Create UnifiedBuilder.jsx** - Main container component
2. **Merge Block Types** - Combine all 32 blocks into one system
3. **Create BlockRenderer.jsx** - Unified rendering engine
4. **Create UnifiedCanvas.jsx** - Merged canvas component
5. **Test with existing data** - Ensure backward compatibility

---

**This architecture provides:**
- ✅ Single unified interface
- ✅ All features from 3 builders
- ✅ Better user experience
- ✅ Easier maintenance
- ✅ Future-proof design
