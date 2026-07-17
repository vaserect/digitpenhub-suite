# Website Builder Ecosystem - Complete Rebuild Master Plan

## Executive Summary

This document outlines the complete rebuild of the Digitpen Hub Suite's Website Builder, Funnel Builder, Landing Page Builder, Template Marketplace, and Theme System to create an enterprise-grade visual website platform capable of competing with GoHighLevel, Webflow, Framer, WordPress + Elementor, and other premium website builders.

**Current State:** Basic block-based page builder with limited templates
**Target State:** Enterprise-grade visual website platform with 500+ premium templates across 100+ industries

---

## Phase 1: Architecture & Database Schema Design

### 1.1 Core Database Schema

#### New Tables Required

**`builder_themes`**
- Theme system with global design tokens
- Color palettes, typography, spacing scales
- Light/dark mode support
- Brand kit integration

**`builder_components`**
- Reusable UI components library
- Buttons, cards, forms, navigation, etc.
- Versioning and variants support

**`builder_sections`**
- Pre-built page sections
- Hero, CTA, testimonials, pricing, etc.
- Category and tag system

**`builder_templates`**
- Complete website templates (multi-page)
- Industry categorization
- Style variants (modern, luxury, minimal, etc.)
- Template metadata and preview

**`builder_template_pages`**
- Individual pages within templates
- Page relationships and navigation structure

**`builder_blocks`**
- Enhanced block system
- Container/row/column support
- Responsive breakpoints
- Animation controls

**`builder_assets`**
- Centralized asset management
- Images, icons, illustrations
- Integration with Pexels, Unsplash

**`builder_revisions`**
- Version history for pages
- Rollback capability
- Autosave support

**`builder_global_blocks`**
- Reusable blocks across pages
- Header/footer templates
- Symbols system

**Enhanced `pages` table:**
- Add theme_id reference
- Add parent_page_id for multi-page sites
- Add site_id for grouping pages
- Add responsive_settings JSONB
- Add seo_settings JSONB
- Add performance_settings JSONB

**Enhanced `funnels` table:**
- Add split_testing support
- Add conversion_tracking
- Add automation_rules JSONB
- Add analytics_config JSONB

### 1.2 Block System Architecture

**Container System:**
```
Site
└── Page
    └── Section (full-width container)
        └── Container (max-width wrapper)
            └── Row (flex/grid layout)
                └── Column (responsive sizing)
                    └── Block (content element)
```

**Block Types (50+ types):**

**Layout Blocks:**
- Container
- Row
- Column
- Section
- Spacer
- Divider

**Content Blocks:**
- Heading
- Text/Paragraph
- Rich Text Editor
- Image
- Image Gallery
- Video
- Audio
- Embed/iFrame
- Code Block
- Markdown

**Navigation Blocks:**
- Header/Navigation
- Mega Menu
- Breadcrumbs
- Sidebar Menu
- Footer
- Sticky Navigation

**Interactive Blocks:**
- Button
- Button Group
- Link
- Accordion
- Tabs
- Modal/Popup
- Dropdown
- Carousel/Slider
- Lightbox

**Form Blocks:**
- Form Container
- Input Field
- Textarea
- Select/Dropdown
- Checkbox
- Radio Button
- File Upload
- Date Picker
- Submit Button
- Form Integration (Lead Gen)

**Marketing Blocks:**
- Hero Section
- CTA Banner
- Testimonials
- Reviews
- Pricing Table
- Comparison Table
- Feature Grid
- Benefits List
- Stats/Counter
- Timeline
- Process Steps
- FAQ
- Logo Cloud
- Trust Badges
- Social Proof
- Countdown Timer
- Progress Bar

**Ecommerce Blocks:**
- Product Card
- Product Grid
- Product Details
- Add to Cart
- Shopping Cart
- Checkout Form
- Order Summary

**Blog/Content Blocks:**
- Blog Post List
- Blog Post Card
- Single Post
- Author Bio
- Related Posts
- Categories
- Tags
- Comments
- Share Buttons

**Advanced Blocks:**
- Map (Google Maps)
- Calendar
- Booking Widget
- Chat Widget
- Search Bar
- Newsletter Signup
- Social Media Feed
- Icon
- Icon Box
- Team Member Card
- Portfolio Item
- Case Study
- Before/After Slider

### 1.3 Responsive System

**Breakpoints:**
- Mobile: 0-639px
- Tablet: 640-1023px
- Desktop: 1024-1279px
- Large Desktop: 1280px+

**Per-Block Responsive Controls:**
- Show/hide on breakpoints
- Different layouts per breakpoint
- Responsive spacing
- Responsive typography
- Responsive images

---

## Phase 2: Theme System & Design Tokens

### 2.1 Global Theme Structure

```json
{
  "id": "theme_uuid",
  "name": "Modern Business",
  "colors": {
    "primary": "#2563eb",
    "secondary": "#7c3aed",
    "accent": "#f59e0b",
    "success": "#10b981",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "neutral": {
      "50": "#f9fafb",
      "100": "#f3f4f6",
      "200": "#e5e7eb",
      "300": "#d1d5db",
      "400": "#9ca3af",
      "500": "#6b7280",
      "600": "#4b5563",
      "700": "#374151",
      "800": "#1f2937",
      "900": "#111827"
    },
    "background": "#ffffff",
    "surface": "#f9fafb",
    "text": {
      "primary": "#111827",
      "secondary": "#6b7280",
      "muted": "#9ca3af"
    }
  },
  "typography": {
    "fontFamily": {
      "heading": "Inter, sans-serif",
      "body": "Inter, sans-serif",
      "mono": "JetBrains Mono, monospace"
    },
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem"
    },
    "fontWeight": {
      "light": 300,
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700,
      "extrabold": 800
    },
    "lineHeight": {
      "tight": 1.25,
      "normal": 1.5,
      "relaxed": 1.75
    }
  },
  "spacing": {
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem",
    "20": "5rem",
    "24": "6rem"
  },
  "borderRadius": {
    "none": "0",
    "sm": "0.125rem",
    "base": "0.25rem",
    "md": "0.375rem",
    "lg": "0.5rem",
    "xl": "0.75rem",
    "2xl": "1rem",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "base": "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
  },
  "animations": {
    "duration": {
      "fast": "150ms",
      "base": "300ms",
      "slow": "500ms"
    },
    "easing": {
      "linear": "linear",
      "ease": "ease",
      "easeIn": "ease-in",
      "easeOut": "ease-out",
      "easeInOut": "ease-in-out"
    }
  }
}
```

### 2.2 Component Tokens

Each component inherits from global theme but can override:
- Button styles (variants: primary, secondary, outline, ghost)
- Form input styles
- Card styles
- Navigation styles

---

## Phase 3: Template Library Structure

### 3.1 Industry Categories (100+)

**Business & Professional Services:**
1. Corporate Business
2. Consulting Firm
3. Digital Agency
4. Marketing Agency
5. Creative Agency
6. Advertising Agency
7. PR Agency
8. Accounting Firm
9. Law Firm
10. Financial Services
11. Insurance Agency
12. Real Estate Agency
13. Architecture Firm
14. Interior Design
15. Construction Company
16. Engineering Firm
17. IT Services
18. Software Company
19. SaaS Business
20. Startup
21. Coworking Space
22. Business Coaching

**Healthcare & Wellness:**
23. Hospital
24. Medical Clinic
25. Dental Clinic
26. Veterinary Clinic
27. Pharmacy
28. Mental Health
29. Physical Therapy
30. Chiropractic
31. Spa & Wellness
32. Yoga Studio
33. Fitness Center
34. Gym
35. Personal Trainer
36. Nutrition Coaching
37. Beauty Salon
38. Barber Shop
39. Massage Therapy

**Education & Training:**
40. School
41. University
42. Online Course Platform
43. E-Learning
44. Training Center
45. Tutoring Service
46. Language School
47. Music School
48. Dance Studio
49. Art School
50. Driving School

**Hospitality & Food:**
51. Restaurant
52. Cafe
53. Bar & Pub
54. Food Truck
55. Catering Service
56. Bakery
57. Hotel
58. Resort
59. Bed & Breakfast
60. Vacation Rental
61. Event Venue

**Retail & Ecommerce:**
62. Online Store
63. Fashion Store
64. Jewelry Store
65. Electronics Store
66. Furniture Store
67. Home Decor
68. Bookstore
69. Pet Store
70. Sports Equipment
71. Marketplace

**Creative & Media:**
72. Photographer
73. Videographer
74. Graphic Designer
75. Web Designer
76. Illustrator
77. Artist Portfolio
78. Music Producer
79. Podcast
80. Blog
81. Magazine
82. News Portal
83. Video Production

**Events & Entertainment:**
84. Event Planning
85. Wedding Planner
86. Conference
87. Festival
88. Concert
89. Theater
90. Cinema
91. Entertainment Venue

**Non-Profit & Community:**
92. Charity
93. NGO
94. Church
95. Religious Organization
96. Community Center
97. Political Campaign
98. Fundraising

**Technology & Innovation:**
99. AI Company
100. Blockchain/Crypto
101. Cybersecurity
102. IoT Solutions
103. Mobile App
104. Tech Startup

**Other Services:**
105. Transportation
106. Logistics
107. Cleaning Service
108. Moving Company
109. Security Service
110. Automotive
111. Car Dealership
112. Car Repair
113. Travel Agency
114. Tour Operator

### 3.2 Template Variants Per Industry

Each industry should have multiple style variants:

1. **Modern** - Clean, contemporary design
2. **Luxury** - Premium, high-end aesthetic
3. **Minimal** - Simple, focused design
4. **Corporate** - Professional, traditional
5. **Creative** - Bold, artistic
6. **Dark** - Dark mode optimized
7. **Light** - Bright, airy
8. **Bold** - Strong typography, vibrant colors
9. **Elegant** - Sophisticated, refined

**Target: 500+ templates = 100+ industries × 5 average variants**

### 3.3 Multi-Page Structure Per Template

Each template should include appropriate pages:

**Standard Pages (most templates):**
- Home
- About
- Services/Products
- Portfolio/Projects
- Pricing
- Testimonials
- Blog
- Blog Post (single)
- Contact
- FAQ
- Privacy Policy
- Terms of Service
- 404 Error

**Industry-Specific Pages:**

**Real Estate:**
- Properties Listing
- Property Details
- Agents
- Agent Profile
- Mortgage Calculator
- Neighborhood Guide
- Sell Your Property
- Rent Your Property

**Restaurant:**
- Menu
- Reservations
- Gallery
- Chef Profile
- Events
- Locations
- Gift Cards
- Catering

**Hospital:**
- Departments
- Doctors
- Doctor Profile
- Book Appointment
- Emergency Services
- Insurance
- Health Articles
- Patient Portal

**Education:**
- Courses
- Course Details
- Instructors
- Enrollment
- Student Portal
- Resources
- Events
- Alumni

---

## Phase 4: Visual Builder Frontend

### 4.1 Builder Interface Components

**Main Canvas:**
- Live preview
- Responsive viewport switcher
- Zoom controls
- Grid/guides overlay
- Device frames

**Left Sidebar - Elements Panel:**
- Blocks library (categorized)
- Sections library
- Templates library
- Components library
- Search functionality

**Right Sidebar - Properties Panel:**
- Block settings
- Style controls
- Responsive settings
- Animation controls
- Advanced settings

**Top Toolbar:**
- Undo/Redo
- Save/Publish
- Preview
- Device switcher
- Settings
- Export

**Bottom Panel:**
- Layer navigator
- Structure tree
- Breadcrumb navigation

### 4.2 Drag & Drop System

**Features:**
- Visual drag indicators
- Drop zones highlighting
- Snap to grid
- Alignment guides
- Smart spacing
- Nested containers
- Copy/paste blocks
- Duplicate blocks
- Delete blocks
- Reorder blocks

### 4.3 Style Controls

**Layout:**
- Display (block, flex, grid, inline)
- Position (static, relative, absolute, fixed, sticky)
- Width/Height
- Min/Max dimensions
- Padding
- Margin
- Flex properties
- Grid properties

**Typography:**
- Font family
- Font size
- Font weight
- Line height
- Letter spacing
- Text align
- Text transform
- Text decoration
- Color

**Background:**
- Color
- Gradient
- Image
- Video
- Pattern
- Blend mode
- Opacity

**Border:**
- Width
- Style
- Color
- Radius
- Individual sides

**Effects:**
- Box shadow
- Text shadow
- Opacity
- Blur
- Filters

**Animations:**
- Entrance animations
- Scroll animations
- Hover effects
- Click effects
- Transition duration
- Easing function

### 4.4 Responsive Controls

Per breakpoint settings for:
- Visibility
- Layout
- Spacing
- Typography
- Images
- Order

---

## Phase 5: Funnel Builder Enhancement

### 5.1 Funnel Types

1. **Lead Generation Funnel**
   - Landing page → Form → Thank you

2. **Sales Funnel**
   - Landing → Product → Checkout → Upsell → Thank you

3. **Webinar Funnel**
   - Registration → Confirmation → Reminder → Replay

4. **Course Funnel**
   - Landing → Enrollment → Payment → Access

5. **Appointment Funnel**
   - Landing → Calendar → Confirmation

6. **Application Funnel**
   - Landing → Form → Review → Approval

7. **Survey Funnel**
   - Landing → Questions → Results

8. **Membership Funnel**
   - Landing → Signup → Payment → Welcome

### 5.2 Funnel Features

- Unlimited steps
- Conditional logic
- Split testing (A/B/n)
- Conversion tracking
- Analytics dashboard
- Email automation triggers
- SMS automation triggers
- CRM integration
- Payment integration
- Appointment booking integration

### 5.3 Funnel Templates

Pre-built funnels for:
- Lead magnet download
- Free consultation booking
- Product launch
- Course enrollment
- Event registration
- Membership signup
- Service booking
- Quote request

---

## Phase 6: CMS System

### 6.1 Blog System

**Features:**
- Posts with rich content
- Categories
- Tags
- Authors
- Featured images
- SEO optimization
- Scheduled publishing
- Draft/Published status
- Comments (optional)
- Related posts
- Search functionality

### 6.2 Collections

**Custom Content Types:**
- Portfolio items
- Team members
- Testimonials
- Case studies
- Products
- Events
- Locations
- FAQ items

**Collection Features:**
- Custom fields
- Relationships
- Filtering
- Sorting
- Pagination
- Dynamic pages

### 6.3 Dynamic Content

- Bind blocks to collection data
- Dynamic lists
- Dynamic single pages
- Conditional visibility
- Filters and sorting

---

## Phase 7: SEO & Performance

### 7.1 SEO Features

**On-Page SEO:**
- Meta titles
- Meta descriptions
- Open Graph tags
- Twitter Cards
- Canonical URLs
- Schema.org markup
- XML sitemap
- Robots.txt
- Breadcrumbs
- Alt text for images
- Heading hierarchy

**Technical SEO:**
- Clean URLs
- 301 redirects
- SSL support
- Mobile-friendly
- Fast loading
- Structured data

### 7.2 Performance Optimization

- Image optimization
- Lazy loading
- Code splitting
- Minification
- Caching
- CDN support
- Core Web Vitals optimization

---

## Phase 8: Asset Management

### 8.1 Image Integration

**Stock Photo APIs:**
- Pexels (already integrated)
- Unsplash
- Pixabay

**Features:**
- Search by keyword
- Category browsing
- Favorites
- Recent uploads
- Image optimization
- Responsive images
- WebP support

### 8.2 Icon Libraries

**Integrated Libraries:**
- Lucide Icons
- Heroicons
- Tabler Icons
- Phosphor Icons
- Remix Icons
- Material Symbols
- Font Awesome

**Features:**
- Search icons
- Category browsing
- Size controls
- Color controls
- Stroke width
- Icon picker component

### 8.3 Illustration Libraries

- unDraw
- Storyset
- ManyPixels
- Icons8 Illustrations

### 8.4 Font System

**Premium Fonts:**
- Inter
- Manrope
- Plus Jakarta Sans
- DM Sans
- Outfit
- Poppins
- General Sans
- Space Grotesk
- Urbanist
- Sora
- Satoshi

**Features:**
- Google Fonts integration
- Custom font upload
- Font pairing suggestions
- Variable fonts support

---

## Phase 9: Advanced Features

### 9.1 Global Blocks/Symbols

- Create reusable blocks
- Update once, reflect everywhere
- Header templates
- Footer templates
- CTA sections
- Newsletter forms

### 9.2 Version History

- Autosave every 30 seconds
- Manual save points
- Revision history
- Compare versions
- Restore previous versions

### 9.3 Collaboration

- Real-time editing (future)
- Comments on blocks
- Approval workflow
- Role-based permissions

### 9.4 Custom Code

- Custom CSS per page
- Custom JavaScript per page
- HTML embed blocks
- Third-party integrations

### 9.5 Analytics Integration

- Google Analytics
- Meta Pixel
- Google Ads
- Custom tracking pixels
- Heatmaps (future)
- Session recordings (future)

---

## Phase 10: Template Marketplace

### 10.1 Template Browser

**Features:**
- Category filtering
- Style filtering
- Industry filtering
- Search
- Preview
- Favorites
- Recently used
- Popular templates
- New templates

### 10.2 Template Details

- Full preview
- Multiple screenshots
- Page list
- Features list
- Use template button
- Customize before use

### 10.3 Template Management

- Import templates
- Export templates
- Share templates
- Template versioning
- Template updates

---

## Implementation Roadmap

### Sprint 1-2: Foundation (Weeks 1-2)
- [ ] Design complete database schema
- [ ] Create migration files
- [ ] Set up theme system structure
- [ ] Design block architecture
- [ ] Create API endpoints structure

### Sprint 3-4: Core Builder (Weeks 3-4)
- [ ] Implement enhanced block system
- [ ] Build container/row/column system
- [ ] Create responsive controls
- [ ] Implement theme system
- [ ] Build basic visual editor UI

### Sprint 5-8: Visual Builder (Weeks 5-8)
- [ ] Implement drag & drop
- [ ] Build properties panel
- [ ] Create elements panel
- [ ] Add layer navigator
- [ ] Implement undo/redo
- [ ] Add keyboard shortcuts

### Sprint 9-12: Components & Sections (Weeks 9-12)
- [ ] Build 50+ block types
- [ ] Create sections library
- [ ] Build components library
- [ ] Implement global blocks
- [ ] Add animation controls

### Sprint 13-20: Template Library Phase 1 (Weeks 13-20)
- [ ] Create 20 industries × 3 variants = 60 templates
- [ ] Build multi-page structures
- [ ] Add template browser
- [ ] Implement template import/export

### Sprint 21-28: Template Library Phase 2 (Weeks 21-28)
- [ ] Create 40 more industries × 3 variants = 120 templates
- [ ] Total: 180 templates

### Sprint 29-36: Template Library Phase 3 (Weeks 29-36)
- [ ] Create 40 more industries × 3 variants = 120 templates
- [ ] Total: 300 templates

### Sprint 37-44: Template Library Phase 4 (Weeks 37-44)
- [ ] Create remaining templates to reach 500+
- [ ] Add premium variants
- [ ] Polish all templates

### Sprint 45-48: Funnel Builder (Weeks 45-48)
- [ ] Enhance funnel system
- [ ] Add split testing
- [ ] Implement conversion tracking
- [ ] Build funnel templates

### Sprint 49-52: CMS & Advanced Features (Weeks 49-52)
- [ ] Build blog system
- [ ] Implement collections
- [ ] Add dynamic content
- [ ] Implement version history
- [ ] Add collaboration features

### Sprint 53-56: Polish & Optimization (Weeks 53-56)
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Accessibility testing
- [ ] Cross-browser testing
- [ ] Mobile optimization
- [ ] Documentation

---

## Success Metrics

### Quantitative Metrics:
- 500+ premium templates
- 100+ industries covered
- 50+ block types
- Sub-3s page load time
- 95+ Lighthouse score
- 100% mobile responsive
- WCAG 2.1 AA compliance

### Qualitative Metrics:
- Professional design quality
- Intuitive user experience
- Enterprise-grade features
- Competitive with market leaders
- Production-ready templates

---

## Technical Stack

### Backend:
- Node.js + Express
- PostgreSQL with JSONB
- RESTful API
- File storage (S3 compatible)

### Frontend:
- Next.js 14+
- React 18+
- TailwindCSS
- Drag & Drop: @dnd-kit
- Rich Text: TipTap or Slate
- State Management: Zustand or Jotai

### Assets:
- Pexels API
- Unsplash API
- Icon libraries (SVG)
- Google Fonts API

---

## Risk Mitigation

### Technical Risks:
- **Performance with complex pages**: Implement virtual scrolling, lazy loading
- **Browser compatibility**: Extensive testing, polyfills
- **Mobile responsiveness**: Mobile-first approach, thorough testing

### Scope Risks:
- **Template creation time**: Use AI assistance, template generation tools
- **Feature creep**: Strict prioritization, MVP approach
- **Quality consistency**: Design system, templates review process

### Resource Risks:
- **Development time**: Phased approach, parallel workstreams
- **Testing coverage**: Automated testing, continuous integration

---

## Next Steps

1. **Review and approve this master plan**
2. **Begin Phase 1: Database schema design**
3. **Set up development environment**
4. **Create first migration files**
5. **Start building core infrastructure**

---

*This is a living document. Update as the project evolves.*
