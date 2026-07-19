-- CMS Collections for Website Builder
-- Enables dynamic content management (Webflow CMS / Framer CMS equivalent)

-- Content Types / Collections
CREATE TABLE IF NOT EXISTS cms_collections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id         UUID        REFERENCES builder_sites(id) ON DELETE CASCADE,
  
  -- Collection details
  name            TEXT        NOT NULL,
  slug            TEXT        NOT NULL,
  description     TEXT,
  icon            TEXT        DEFAULT '📦',
  
  -- Schema definition (fields)
  fields          JSONB       NOT NULL DEFAULT '[]',
  -- Example: [
  --   { "name": "title", "type": "text", "required": true },
  --   { "name": "description", "type": "richtext", "required": false },
  --   { "name": "image", "type": "image", "required": false },
  --   { "name": "category", "type": "reference", "collection": "categories" }
  -- ]
  
  -- Display settings
  display_field   TEXT,       -- Which field to use as the item title
  sort_field      TEXT,       -- Default sort field
  sort_order      TEXT        DEFAULT 'desc' CHECK (sort_order IN ('asc', 'desc')),
  
  -- Permissions
  is_public       BOOLEAN     NOT NULL DEFAULT false,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX cms_collections_org_slug_idx ON cms_collections (org_id, slug);
CREATE INDEX cms_collections_site_idx ON cms_collections (site_id);

-- Collection Items (actual content)
CREATE TABLE IF NOT EXISTS cms_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id   UUID        NOT NULL REFERENCES cms_collections(id) ON DELETE CASCADE,
  
  -- Item data (flexible JSON matching collection schema)
  data            JSONB       NOT NULL DEFAULT '{}',
  
  -- Slug for URL routing
  slug            TEXT,
  
  -- Status
  status          TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at    TIMESTAMPTZ,
  
  -- Metadata
  created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  updated_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cms_items_collection_idx ON cms_items (collection_id);
CREATE INDEX cms_items_status_idx ON cms_items (status);
CREATE INDEX cms_items_slug_idx ON cms_items (collection_id, slug);
CREATE INDEX cms_items_data_idx ON cms_items USING gin(data);

-- Collection Templates (page templates bound to collections)
CREATE TABLE IF NOT EXISTS cms_collection_templates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id   UUID        NOT NULL REFERENCES cms_collections(id) ON DELETE CASCADE,
  
  -- Template type
  template_type   TEXT        NOT NULL CHECK (template_type IN ('list', 'detail', 'archive')),
  -- list: shows multiple items (blog index)
  -- detail: shows single item (blog post)
  -- archive: filtered list (category archive)
  
  -- Page reference
  page_id         UUID        REFERENCES pages(id) ON DELETE CASCADE,
  
  -- URL pattern for detail pages
  url_pattern     TEXT,       -- e.g., "/blog/{slug}"
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cms_collection_templates_collection_idx ON cms_collection_templates (collection_id);
CREATE INDEX cms_collection_templates_page_idx ON cms_collection_templates (page_id);

-- Insert starter collections for common use cases
INSERT INTO cms_collections (org_id, name, slug, description, icon, fields, display_field, is_public)
SELECT 
  o.id,
  'Blog Posts',
  'blog-posts',
  'Articles and blog content',
  '📝',
  '[
    {"name": "title", "type": "text", "required": true, "label": "Title"},
    {"name": "slug", "type": "text", "required": true, "label": "URL Slug"},
    {"name": "excerpt", "type": "textarea", "required": false, "label": "Excerpt"},
    {"name": "content", "type": "richtext", "required": true, "label": "Content"},
    {"name": "featured_image", "type": "image", "required": false, "label": "Featured Image"},
    {"name": "author", "type": "text", "required": false, "label": "Author"},
    {"name": "category", "type": "text", "required": false, "label": "Category"},
    {"name": "tags", "type": "tags", "required": false, "label": "Tags"},
    {"name": "published_date", "type": "date", "required": false, "label": "Published Date"}
  ]'::jsonb,
  'title',
  true
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM cms_collections WHERE org_id = o.id AND slug = 'blog-posts'
)
LIMIT 1;

INSERT INTO cms_collections (org_id, name, slug, description, icon, fields, display_field, is_public)
SELECT 
  o.id,
  'Team Members',
  'team-members',
  'Team member profiles',
  '👥',
  '[
    {"name": "name", "type": "text", "required": true, "label": "Name"},
    {"name": "role", "type": "text", "required": true, "label": "Role"},
    {"name": "bio", "type": "textarea", "required": false, "label": "Bio"},
    {"name": "photo", "type": "image", "required": false, "label": "Photo"},
    {"name": "email", "type": "email", "required": false, "label": "Email"},
    {"name": "linkedin", "type": "url", "required": false, "label": "LinkedIn"},
    {"name": "twitter", "type": "url", "required": false, "label": "Twitter"}
  ]'::jsonb,
  'name',
  true
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM cms_collections WHERE org_id = o.id AND slug = 'team-members'
)
LIMIT 1;

INSERT INTO cms_collections (org_id, name, slug, description, icon, fields, display_field, is_public)
SELECT 
  o.id,
  'Portfolio Projects',
  'portfolio-projects',
  'Portfolio work and case studies',
  '🎨',
  '[
    {"name": "title", "type": "text", "required": true, "label": "Project Title"},
    {"name": "slug", "type": "text", "required": true, "label": "URL Slug"},
    {"name": "description", "type": "textarea", "required": false, "label": "Description"},
    {"name": "featured_image", "type": "image", "required": false, "label": "Featured Image"},
    {"name": "gallery", "type": "images", "required": false, "label": "Gallery"},
    {"name": "client", "type": "text", "required": false, "label": "Client"},
    {"name": "year", "type": "number", "required": false, "label": "Year"},
    {"name": "category", "type": "text", "required": false, "label": "Category"},
    {"name": "tags", "type": "tags", "required": false, "label": "Tags"},
    {"name": "url", "type": "url", "required": false, "label": "Project URL"}
  ]'::jsonb,
  'title',
  true
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM cms_collections WHERE org_id = o.id AND slug = 'portfolio-projects'
)
LIMIT 1;

INSERT INTO cms_collections (org_id, name, slug, description, icon, fields, display_field, is_public)
SELECT 
  o.id,
  'Testimonials',
  'testimonials',
  'Customer testimonials and reviews',
  '⭐',
  '[
    {"name": "name", "type": "text", "required": true, "label": "Customer Name"},
    {"name": "company", "type": "text", "required": false, "label": "Company"},
    {"name": "role", "type": "text", "required": false, "label": "Role"},
    {"name": "testimonial", "type": "textarea", "required": true, "label": "Testimonial"},
    {"name": "photo", "type": "image", "required": false, "label": "Photo"},
    {"name": "rating", "type": "number", "required": false, "label": "Rating (1-5)"},
    {"name": "featured", "type": "boolean", "required": false, "label": "Featured"}
  ]'::jsonb,
  'name',
  true
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM cms_collections WHERE org_id = o.id AND slug = 'testimonials'
)
LIMIT 1;

INSERT INTO cms_collections (org_id, name, slug, description, icon, fields, display_field, is_public)
SELECT 
  o.id,
  'Products',
  'products',
  'Product catalog',
  '🛍️',
  '[
    {"name": "name", "type": "text", "required": true, "label": "Product Name"},
    {"name": "slug", "type": "text", "required": true, "label": "URL Slug"},
    {"name": "description", "type": "richtext", "required": false, "label": "Description"},
    {"name": "price", "type": "number", "required": true, "label": "Price"},
    {"name": "images", "type": "images", "required": false, "label": "Product Images"},
    {"name": "category", "type": "text", "required": false, "label": "Category"},
    {"name": "sku", "type": "text", "required": false, "label": "SKU"},
    {"name": "stock", "type": "number", "required": false, "label": "Stock Quantity"},
    {"name": "featured", "type": "boolean", "required": false, "label": "Featured"}
  ]'::jsonb,
  'name',
  true
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM cms_collections WHERE org_id = o.id AND slug = 'products'
)
LIMIT 1;
