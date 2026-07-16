-- Website Builder: Template System
-- Complete website templates with multi-page structures

CREATE TABLE builder_templates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  
  -- Categorization
  industry        TEXT        NOT NULL, -- real-estate, restaurant, hospital, etc.
  category        TEXT        NOT NULL, -- business, healthcare, education, etc.
  style_variant   TEXT        NOT NULL DEFAULT 'modern', -- modern, luxury, minimal, corporate, creative, dark, light, bold, elegant
  
  -- Template metadata
  is_global       BOOLEAN     NOT NULL DEFAULT false, -- Global templates available to all orgs
  is_premium      BOOLEAN     NOT NULL DEFAULT false,
  is_featured     BOOLEAN     NOT NULL DEFAULT false,
  
  -- Preview
  thumbnail_url   TEXT,
  preview_images  TEXT[]      DEFAULT '{}', -- Multiple preview screenshots
  demo_url        TEXT,
  
  -- Theme reference
  theme_id        UUID        REFERENCES builder_themes(id) ON DELETE SET NULL,
  
  -- Template configuration
  template_config JSONB       NOT NULL DEFAULT '{}', -- Colors, fonts, settings
  
  -- Tags for searchability
  tags            TEXT[]      DEFAULT '{}',
  
  -- Usage and popularity
  usage_count     INTEGER     NOT NULL DEFAULT 0,
  rating          DECIMAL(3,2) DEFAULT 0.00,
  rating_count    INTEGER     NOT NULL DEFAULT 0,
  
  -- Version control
  version         INTEGER     NOT NULL DEFAULT 1,
  
  -- SEO
  seo_title       TEXT,
  seo_description TEXT,
  seo_keywords    TEXT[],
  
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX builder_templates_org_idx ON builder_templates (org_id) WHERE org_id IS NOT NULL;
CREATE INDEX builder_templates_global_idx ON builder_templates (is_global) WHERE is_global = true;
CREATE INDEX builder_templates_industry_idx ON builder_templates (industry);
CREATE INDEX builder_templates_category_idx ON builder_templates (category);
CREATE INDEX builder_templates_style_idx ON builder_templates (style_variant);
CREATE INDEX builder_templates_featured_idx ON builder_templates (is_featured) WHERE is_featured = true;
CREATE INDEX builder_templates_tags_idx ON builder_templates USING gin(tags);
CREATE INDEX builder_templates_usage_idx ON builder_templates (usage_count DESC);
CREATE INDEX builder_templates_rating_idx ON builder_templates (rating DESC);

-- Template pages (multi-page structure)
CREATE TABLE builder_template_pages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID        NOT NULL REFERENCES builder_templates(id) ON DELETE CASCADE,
  
  -- Page details
  name            TEXT        NOT NULL, -- Home, About, Services, Contact, etc.
  slug            TEXT        NOT NULL,
  description     TEXT,
  page_type       TEXT        NOT NULL DEFAULT 'page', -- page, landing, blog, etc.
  
  -- Page structure
  blocks          JSONB       NOT NULL DEFAULT '[]',
  
  -- Page settings
  meta_title      TEXT,
  meta_description TEXT,
  og_image        TEXT,
  
  -- Navigation
  is_home         BOOLEAN     NOT NULL DEFAULT false,
  show_in_nav     BOOLEAN     NOT NULL DEFAULT true,
  nav_order       INTEGER     NOT NULL DEFAULT 0,
  parent_page_id  UUID        REFERENCES builder_template_pages(id) ON DELETE SET NULL,
  
  -- Preview
  thumbnail_url   TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX builder_template_pages_template_idx ON builder_template_pages (template_id);
CREATE INDEX builder_template_pages_slug_idx ON builder_template_pages (template_id, slug);
CREATE INDEX builder_template_pages_nav_idx ON builder_template_pages (template_id, show_in_nav, nav_order);
CREATE INDEX builder_template_pages_home_idx ON builder_template_pages (template_id, is_home) WHERE is_home = true;

-- Template categories for organization
CREATE TABLE builder_template_categories (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL UNIQUE,
  slug            TEXT        NOT NULL UNIQUE,
  description     TEXT,
  icon            TEXT,
  parent_id       UUID        REFERENCES builder_template_categories(id) ON DELETE SET NULL,
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX builder_template_categories_parent_idx ON builder_template_categories (parent_id);
CREATE INDEX builder_template_categories_sort_idx ON builder_template_categories (sort_order);

-- Insert default template categories
INSERT INTO builder_template_categories (name, slug, description, icon, sort_order) VALUES 
('Business & Professional', 'business-professional', 'Corporate, consulting, and professional services', '💼', 1),
('Healthcare & Wellness', 'healthcare-wellness', 'Medical, dental, fitness, and wellness', '🏥', 2),
('Education & Training', 'education-training', 'Schools, courses, and training centers', '🎓', 3),
('Hospitality & Food', 'hospitality-food', 'Restaurants, hotels, and catering', '🍽️', 4),
('Retail & Ecommerce', 'retail-ecommerce', 'Online stores and retail businesses', '🛍️', 5),
('Creative & Media', 'creative-media', 'Portfolios, agencies, and media', '🎨', 6),
('Events & Entertainment', 'events-entertainment', 'Event planning and entertainment', '🎉', 7),
('Non-Profit & Community', 'nonprofit-community', 'Charities, NGOs, and community organizations', '🤝', 8),
('Technology & Innovation', 'technology-innovation', 'Tech startups, SaaS, and innovation', '💻', 9),
('Services', 'services', 'Various service-based businesses', '🔧', 10);
