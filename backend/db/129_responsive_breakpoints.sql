-- Migration 129: Responsive Breakpoints System
-- Enables Webflow-style responsive design with custom breakpoints

-- Breakpoint definitions (organization-level)
CREATE TABLE IF NOT EXISTS builder_breakpoints (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    label VARCHAR(100) NOT NULL, -- Display name (e.g., "Desktop", "Tablet", "Mobile")
    
    -- Breakpoint configuration
    min_width INTEGER, -- Minimum viewport width (null for mobile-first)
    max_width INTEGER, -- Maximum viewport width (null for largest breakpoint)
    base_font_size INTEGER DEFAULT 16, -- Base font size in pixels
    
    -- Media query
    media_query TEXT NOT NULL, -- Generated CSS media query
    
    -- Icon and display
    icon VARCHAR(50), -- Icon identifier (e.g., 'desktop', 'tablet', 'mobile')
    sort_order INTEGER DEFAULT 0,
    
    -- System vs custom
    is_system BOOLEAN DEFAULT false, -- System breakpoints cannot be deleted
    is_default BOOLEAN DEFAULT false, -- Default editing breakpoint
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(org_id, name)
);

-- Element styles per breakpoint
CREATE TABLE IF NOT EXISTS builder_element_styles (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    element_id VARCHAR(255) NOT NULL, -- Builder element ID
    breakpoint_id INTEGER NOT NULL REFERENCES builder_breakpoints(id) ON DELETE CASCADE,
    
    -- CSS styles for this breakpoint
    styles JSONB NOT NULL DEFAULT '{}', -- All CSS properties
    
    -- Visibility control
    is_hidden BOOLEAN DEFAULT false,
    
    -- Layout overrides
    display_mode VARCHAR(50), -- 'block', 'flex', 'grid', 'inline', etc.
    position_type VARCHAR(50), -- 'static', 'relative', 'absolute', 'fixed', 'sticky'
    
    -- Flexbox/Grid overrides
    flex_direction VARCHAR(50),
    flex_wrap VARCHAR(50),
    justify_content VARCHAR(50),
    align_items VARCHAR(50),
    grid_template_columns TEXT,
    grid_template_rows TEXT,
    gap VARCHAR(50),
    
    -- Spacing overrides
    margin_top VARCHAR(50),
    margin_right VARCHAR(50),
    margin_bottom VARCHAR(50),
    margin_left VARCHAR(50),
    padding_top VARCHAR(50),
    padding_right VARCHAR(50),
    padding_bottom VARCHAR(50),
    padding_left VARCHAR(50),
    
    -- Typography overrides
    font_size VARCHAR(50),
    line_height VARCHAR(50),
    letter_spacing VARCHAR(50),
    
    -- Dimensions
    width VARCHAR(50),
    height VARCHAR(50),
    min_width VARCHAR(50),
    max_width VARCHAR(50),
    min_height VARCHAR(50),
    max_height VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(page_id, element_id, breakpoint_id)
);

-- Breakpoint inheritance rules
CREATE TABLE IF NOT EXISTS builder_breakpoint_inheritance (
    id SERIAL PRIMARY KEY,
    child_breakpoint_id INTEGER NOT NULL REFERENCES builder_breakpoints(id) ON DELETE CASCADE,
    parent_breakpoint_id INTEGER NOT NULL REFERENCES builder_breakpoints(id) ON DELETE CASCADE,
    
    -- Inheritance behavior
    inherit_styles BOOLEAN DEFAULT true,
    override_on_change BOOLEAN DEFAULT true, -- Create override when style changes
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(child_breakpoint_id, parent_breakpoint_id)
);

-- Responsive images (different images per breakpoint)
CREATE TABLE IF NOT EXISTS builder_responsive_images (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    element_id VARCHAR(255) NOT NULL,
    breakpoint_id INTEGER NOT NULL REFERENCES builder_breakpoints(id) ON DELETE CASCADE,
    
    -- Image configuration
    image_url TEXT NOT NULL,
    alt_text TEXT,
    loading VARCHAR(20) DEFAULT 'lazy', -- 'lazy', 'eager'
    
    -- Optimization
    width INTEGER,
    height INTEGER,
    format VARCHAR(20), -- 'webp', 'jpg', 'png', etc.
    quality INTEGER DEFAULT 80,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(page_id, element_id, breakpoint_id)
);

-- Indexes for performance
CREATE INDEX idx_breakpoints_org ON builder_breakpoints(org_id);
CREATE INDEX idx_breakpoints_sort ON builder_breakpoints(org_id, sort_order);
CREATE INDEX idx_element_styles_page ON builder_element_styles(page_id);
CREATE INDEX idx_element_styles_element ON builder_element_styles(element_id);
CREATE INDEX idx_element_styles_breakpoint ON builder_element_styles(breakpoint_id);
CREATE INDEX idx_responsive_images_page ON builder_responsive_images(page_id);
CREATE INDEX idx_responsive_images_element ON builder_responsive_images(element_id);

-- Insert default system breakpoints for all organizations
INSERT INTO builder_breakpoints (org_id, name, label, min_width, max_width, media_query, icon, sort_order, is_system, is_default)
SELECT 
    id as org_id,
    'desktop',
    'Desktop',
    1280,
    NULL,
    '@media (min-width: 1280px)',
    'desktop',
    0,
    true,
    true
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM builder_breakpoints WHERE org_id = organizations.id AND name = 'desktop'
);

INSERT INTO builder_breakpoints (org_id, name, label, min_width, max_width, media_query, icon, sort_order, is_system, is_default)
SELECT 
    id as org_id,
    'laptop',
    'Laptop',
    1024,
    1279,
    '@media (min-width: 1024px) and (max-width: 1279px)',
    'laptop',
    1,
    true,
    false
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM builder_breakpoints WHERE org_id = organizations.id AND name = 'laptop'
);

INSERT INTO builder_breakpoints (org_id, name, label, min_width, max_width, media_query, icon, sort_order, is_system, is_default)
SELECT 
    id as org_id,
    'tablet',
    'Tablet',
    768,
    1023,
    '@media (min-width: 768px) and (max-width: 1023px)',
    'tablet',
    2,
    true,
    false
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM builder_breakpoints WHERE org_id = organizations.id AND name = 'tablet'
);

INSERT INTO builder_breakpoints (org_id, name, label, min_width, max_width, media_query, icon, sort_order, is_system, is_default)
SELECT 
    id as org_id,
    'mobile-landscape',
    'Mobile Landscape',
    480,
    767,
    '@media (min-width: 480px) and (max-width: 767px)',
    'mobile-landscape',
    3,
    true,
    false
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM builder_breakpoints WHERE org_id = organizations.id AND name = 'mobile-landscape'
);

INSERT INTO builder_breakpoints (org_id, name, label, min_width, max_width, media_query, icon, sort_order, is_system, is_default)
SELECT 
    id as org_id,
    'mobile',
    'Mobile Portrait',
    NULL,
    479,
    '@media (max-width: 479px)',
    'mobile',
    4,
    true,
    false
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM builder_breakpoints WHERE org_id = organizations.id AND name = 'mobile'
);

-- Set up inheritance chain (mobile inherits from mobile-landscape, etc.)
INSERT INTO builder_breakpoint_inheritance (child_breakpoint_id, parent_breakpoint_id)
SELECT 
    child.id as child_breakpoint_id,
    parent.id as parent_breakpoint_id
FROM builder_breakpoints child
JOIN builder_breakpoints parent ON child.org_id = parent.org_id
WHERE child.name = 'mobile-landscape' AND parent.name = 'tablet'
ON CONFLICT DO NOTHING;

INSERT INTO builder_breakpoint_inheritance (child_breakpoint_id, parent_breakpoint_id)
SELECT 
    child.id as child_breakpoint_id,
    parent.id as parent_breakpoint_id
FROM builder_breakpoints child
JOIN builder_breakpoints parent ON child.org_id = parent.org_id
WHERE child.name = 'mobile' AND parent.name = 'mobile-landscape'
ON CONFLICT DO NOTHING;

INSERT INTO builder_breakpoint_inheritance (child_breakpoint_id, parent_breakpoint_id)
SELECT 
    child.id as child_breakpoint_id,
    parent.id as parent_breakpoint_id
FROM builder_breakpoints child
JOIN builder_breakpoints parent ON child.org_id = parent.org_id
WHERE child.name = 'tablet' AND parent.name = 'laptop'
ON CONFLICT DO NOTHING;

INSERT INTO builder_breakpoint_inheritance (child_breakpoint_id, parent_breakpoint_id)
SELECT 
    child.id as child_breakpoint_id,
    parent.id as parent_breakpoint_id
FROM builder_breakpoints child
JOIN builder_breakpoints parent ON child.org_id = parent.org_id
WHERE child.name = 'laptop' AND parent.name = 'desktop'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE builder_breakpoints IS 'Responsive breakpoint definitions for website builder';
COMMENT ON TABLE builder_element_styles IS 'Element styles per breakpoint with inheritance';
COMMENT ON TABLE builder_breakpoint_inheritance IS 'Defines which breakpoints inherit from others';
COMMENT ON TABLE builder_responsive_images IS 'Different images for different breakpoints';
