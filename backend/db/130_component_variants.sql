-- Migration 130: Component Variants System
-- Enables Figma/Webflow-style component variants for reusable design systems

-- Component definitions (master components)
CREATE TABLE IF NOT EXISTS builder_components (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'button', 'card', 'navigation', 'form', 'layout', etc.
    
    -- Base structure
    base_structure JSONB NOT NULL, -- Base HTML/component structure
    base_styles JSONB DEFAULT '{}', -- Default styles
    
    -- Variant configuration
    has_variants BOOLEAN DEFAULT false,
    variant_properties JSONB DEFAULT '[]', -- Array of variant property definitions
    
    -- Preview
    thumbnail_url VARCHAR(500),
    preview_html TEXT,
    
    -- Metadata
    is_system BOOLEAN DEFAULT false, -- System components vs user-created
    is_published BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(org_id, name)
);

-- Component variants (specific variations of a component)
CREATE TABLE IF NOT EXISTS builder_component_variants (
    id SERIAL PRIMARY KEY,
    component_id INTEGER NOT NULL REFERENCES builder_components(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Variant property values
    property_values JSONB NOT NULL DEFAULT '{}', -- Key-value pairs matching variant_properties
    
    -- Variant-specific overrides
    structure_overrides JSONB DEFAULT '{}',
    style_overrides JSONB DEFAULT '{}',
    
    -- Preview
    thumbnail_url VARCHAR(500),
    
    -- Metadata
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(component_id, name)
);

-- Component instances (placed on pages)
CREATE TABLE IF NOT EXISTS builder_component_instances (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    element_id VARCHAR(255) NOT NULL, -- Builder element ID
    component_id INTEGER NOT NULL REFERENCES builder_components(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES builder_component_variants(id) ON DELETE SET NULL,
    
    -- Instance-specific overrides
    instance_overrides JSONB DEFAULT '{}', -- Overrides on top of variant
    
    -- State
    is_detached BOOLEAN DEFAULT false, -- If true, no longer syncs with master
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(page_id, element_id)
);

-- Component slots (for nested content)
CREATE TABLE IF NOT EXISTS builder_component_slots (
    id SERIAL PRIMARY KEY,
    component_id INTEGER NOT NULL REFERENCES builder_components(id) ON DELETE CASCADE,
    slot_name VARCHAR(100) NOT NULL,
    slot_label VARCHAR(100),
    
    -- Slot configuration
    allowed_elements JSONB DEFAULT '[]', -- Array of allowed element types
    default_content JSONB, -- Default content for the slot
    is_required BOOLEAN DEFAULT false,
    max_items INTEGER, -- Max number of items in slot (null = unlimited)
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(component_id, slot_name)
);

-- Component props (configurable properties)
CREATE TABLE IF NOT EXISTS builder_component_props (
    id SERIAL PRIMARY KEY,
    component_id INTEGER NOT NULL REFERENCES builder_components(id) ON DELETE CASCADE,
    prop_name VARCHAR(100) NOT NULL,
    prop_label VARCHAR(100),
    prop_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'boolean', 'color', 'image', 'select', 'textarea'
    
    -- Prop configuration
    default_value TEXT,
    options JSONB, -- For select type
    validation JSONB, -- Validation rules
    
    -- UI hints
    placeholder TEXT,
    help_text TEXT,
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(component_id, prop_name)
);

-- Component library (collections of components)
CREATE TABLE IF NOT EXISTS builder_component_libraries (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Library settings
    is_shared BOOLEAN DEFAULT false, -- Shared across organization
    is_public BOOLEAN DEFAULT false, -- Public to all users
    
    -- Metadata
    icon VARCHAR(50),
    color VARCHAR(50),
    
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(org_id, name)
);

-- Component library items (components in libraries)
CREATE TABLE IF NOT EXISTS builder_library_components (
    id SERIAL PRIMARY KEY,
    library_id INTEGER NOT NULL REFERENCES builder_component_libraries(id) ON DELETE CASCADE,
    component_id INTEGER NOT NULL REFERENCES builder_components(id) ON DELETE CASCADE,
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(library_id, component_id)
);

-- Indexes for performance
CREATE INDEX idx_components_org ON builder_components(org_id);
CREATE INDEX idx_components_category ON builder_components(category);
CREATE INDEX idx_components_published ON builder_components(is_published);
CREATE INDEX idx_variants_component ON builder_component_variants(component_id);
CREATE INDEX idx_instances_page ON builder_component_instances(page_id);
CREATE INDEX idx_instances_component ON builder_component_instances(component_id);
CREATE INDEX idx_slots_component ON builder_component_slots(component_id);
CREATE INDEX idx_props_component ON builder_component_props(component_id);
CREATE INDEX idx_libraries_org ON builder_component_libraries(org_id);
CREATE INDEX idx_library_components_library ON builder_library_components(library_id);

-- Insert system component library
INSERT INTO builder_component_libraries (org_id, name, description, is_shared, is_public, icon, color, created_by)
SELECT 
    id as org_id,
    'System Components',
    'Built-in components provided by the platform',
    true,
    true,
    'cube',
    'blue',
    NULL
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM builder_component_libraries 
    WHERE org_id = organizations.id AND name = 'System Components'
);

-- Insert common system components
INSERT INTO builder_components (org_id, name, description, category, base_structure, base_styles, has_variants, variant_properties, is_system, is_published)
SELECT 
    id as org_id,
    'Button',
    'Customizable button component',
    'button',
    '{"type": "button", "tag": "button", "children": [{"type": "text", "content": "Button"}]}'::jsonb,
    '{"padding": "12px 24px", "border-radius": "6px", "font-weight": "500", "cursor": "pointer", "border": "none"}'::jsonb,
    true,
    '[
        {"name": "variant", "label": "Variant", "type": "select", "options": ["primary", "secondary", "outline", "ghost"]},
        {"name": "size", "label": "Size", "type": "select", "options": ["sm", "md", "lg"]},
        {"name": "state", "label": "State", "type": "select", "options": ["default", "hover", "active", "disabled"]}
    ]'::jsonb,
    true,
    true
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM builder_components 
    WHERE org_id = organizations.id AND name = 'Button' AND is_system = true
);

-- Insert button variants
INSERT INTO builder_component_variants (component_id, name, property_values, style_overrides, is_default)
SELECT 
    c.id as component_id,
    'Primary Medium',
    '{"variant": "primary", "size": "md", "state": "default"}'::jsonb,
    '{"background": "#3b82f6", "color": "#ffffff", "padding": "12px 24px", "font-size": "16px"}'::jsonb,
    true
FROM builder_components c
WHERE c.name = 'Button' AND c.is_system = true
AND NOT EXISTS (
    SELECT 1 FROM builder_component_variants 
    WHERE component_id = c.id AND name = 'Primary Medium'
);

INSERT INTO builder_component_variants (component_id, name, property_values, style_overrides)
SELECT 
    c.id as component_id,
    'Secondary Medium',
    '{"variant": "secondary", "size": "md", "state": "default"}'::jsonb,
    '{"background": "#6b7280", "color": "#ffffff", "padding": "12px 24px", "font-size": "16px"}'::jsonb
FROM builder_components c
WHERE c.name = 'Button' AND c.is_system = true
AND NOT EXISTS (
    SELECT 1 FROM builder_component_variants 
    WHERE component_id = c.id AND name = 'Secondary Medium'
);

INSERT INTO builder_component_variants (component_id, name, property_values, style_overrides)
SELECT 
    c.id as component_id,
    'Outline Medium',
    '{"variant": "outline", "size": "md", "state": "default"}'::jsonb,
    '{"background": "transparent", "color": "#3b82f6", "border": "2px solid #3b82f6", "padding": "10px 22px", "font-size": "16px"}'::jsonb
FROM builder_components c
WHERE c.name = 'Button' AND c.is_system = true
AND NOT EXISTS (
    SELECT 1 FROM builder_component_variants 
    WHERE component_id = c.id AND name = 'Outline Medium'
);

-- Add button to system library
INSERT INTO builder_library_components (library_id, component_id, sort_order)
SELECT 
    l.id as library_id,
    c.id as component_id,
    0
FROM builder_component_libraries l
JOIN builder_components c ON l.org_id = c.org_id
WHERE l.name = 'System Components' AND c.name = 'Button' AND c.is_system = true
ON CONFLICT DO NOTHING;

COMMENT ON TABLE builder_components IS 'Master component definitions with variant support';
COMMENT ON TABLE builder_component_variants IS 'Specific variations of components';
COMMENT ON TABLE builder_component_instances IS 'Component instances placed on pages';
COMMENT ON TABLE builder_component_slots IS 'Configurable slots for nested content';
COMMENT ON TABLE builder_component_props IS 'Configurable properties for components';
COMMENT ON TABLE builder_component_libraries IS 'Collections of reusable components';
