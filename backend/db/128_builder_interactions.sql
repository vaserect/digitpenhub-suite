-- Migration 128: Website Builder Interactions & Animations
-- Enables Webflow-style interactions and animations for builder elements

-- Interaction definitions (reusable animations)
CREATE TABLE IF NOT EXISTS builder_interactions (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Trigger configuration
    trigger_type VARCHAR(50) NOT NULL, -- 'click', 'hover', 'scroll', 'load', 'mouse_move', 'form_submit'
    trigger_selector VARCHAR(255), -- CSS selector for trigger element
    trigger_options JSONB DEFAULT '{}', -- Additional trigger config (delay, offset, etc.)
    
    -- Animation configuration
    animation_type VARCHAR(50) NOT NULL, -- 'move', 'scale', 'rotate', 'fade', 'slide', 'custom'
    animation_properties JSONB NOT NULL DEFAULT '{}', -- CSS properties to animate
    animation_duration INTEGER DEFAULT 300, -- milliseconds
    animation_easing VARCHAR(50) DEFAULT 'ease', -- 'ease', 'linear', 'ease-in', 'ease-out', 'cubic-bezier(...)'
    animation_delay INTEGER DEFAULT 0, -- milliseconds
    animation_iterations INTEGER DEFAULT 1, -- 0 = infinite
    animation_direction VARCHAR(20) DEFAULT 'normal', -- 'normal', 'reverse', 'alternate'
    
    -- Advanced options
    affect_children BOOLEAN DEFAULT false,
    stagger_delay INTEGER DEFAULT 0, -- Delay between child animations
    preserve_3d BOOLEAN DEFAULT false,
    
    -- Metadata
    is_preset BOOLEAN DEFAULT false, -- System preset vs user-created
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applied interactions (instances on specific elements)
CREATE TABLE IF NOT EXISTS builder_element_interactions (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    element_id VARCHAR(255) NOT NULL, -- Builder element ID
    interaction_id INTEGER REFERENCES builder_interactions(id) ON DELETE CASCADE,
    
    -- Override options (optional, overrides interaction defaults)
    override_duration INTEGER,
    override_delay INTEGER,
    override_easing VARCHAR(50),
    override_properties JSONB,
    
    -- Conditional logic
    conditions JSONB DEFAULT '[]', -- Array of conditions for when to trigger
    
    -- State management
    is_active BOOLEAN DEFAULT true,
    execution_order INTEGER DEFAULT 0, -- For multiple interactions on same element
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Animation presets library
CREATE TABLE IF NOT EXISTS builder_animation_presets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- 'entrance', 'exit', 'emphasis', 'motion'
    description TEXT,
    
    -- Animation configuration
    keyframes JSONB NOT NULL, -- CSS keyframes definition
    default_duration INTEGER DEFAULT 500,
    default_easing VARCHAR(50) DEFAULT 'ease',
    
    -- Preview
    preview_url VARCHAR(500), -- GIF/video preview
    thumbnail_url VARCHAR(500),
    
    -- Metadata
    is_premium BOOLEAN DEFAULT false,
    popularity_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scroll-based animations (parallax, reveal, etc.)
CREATE TABLE IF NOT EXISTS builder_scroll_animations (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    element_id VARCHAR(255) NOT NULL,
    
    -- Scroll trigger configuration
    trigger_start VARCHAR(50) DEFAULT 'top bottom', -- 'top top', 'center center', etc.
    trigger_end VARCHAR(50) DEFAULT 'bottom top',
    scrub BOOLEAN DEFAULT false, -- Link animation to scroll position
    pin BOOLEAN DEFAULT false, -- Pin element during animation
    
    -- Animation timeline
    timeline JSONB NOT NULL DEFAULT '[]', -- Array of animation steps with scroll positions
    
    -- Options
    markers BOOLEAN DEFAULT false, -- Show debug markers
    anticipate_pin BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_builder_interactions_org ON builder_interactions(org_id);
CREATE INDEX idx_builder_interactions_trigger ON builder_interactions(trigger_type);
CREATE INDEX idx_element_interactions_page ON builder_element_interactions(page_id);
CREATE INDEX idx_element_interactions_element ON builder_element_interactions(element_id);
CREATE INDEX idx_scroll_animations_page ON builder_scroll_animations(page_id);
CREATE INDEX idx_animation_presets_category ON builder_animation_presets(category);

-- Insert popular animation presets
INSERT INTO builder_animation_presets (name, category, description, keyframes, default_duration, default_easing) VALUES
-- Entrance animations
('Fade In', 'entrance', 'Simple fade in effect', 
 '{"0%": {"opacity": 0}, "100%": {"opacity": 1}}', 500, 'ease'),
 
('Slide In Up', 'entrance', 'Slide in from bottom',
 '{"0%": {"opacity": 0, "transform": "translateY(30px)"}, "100%": {"opacity": 1, "transform": "translateY(0)"}}', 600, 'ease-out'),
 
('Slide In Down', 'entrance', 'Slide in from top',
 '{"0%": {"opacity": 0, "transform": "translateY(-30px)"}, "100%": {"opacity": 1, "transform": "translateY(0)"}}', 600, 'ease-out'),
 
('Slide In Left', 'entrance', 'Slide in from left',
 '{"0%": {"opacity": 0, "transform": "translateX(-30px)"}, "100%": {"opacity": 1, "transform": "translateX(0)"}}', 600, 'ease-out'),
 
('Slide In Right', 'entrance', 'Slide in from right',
 '{"0%": {"opacity": 0, "transform": "translateX(30px)"}, "100%": {"opacity": 1, "transform": "translateX(0)"}}', 600, 'ease-out'),
 
('Scale In', 'entrance', 'Scale up from small',
 '{"0%": {"opacity": 0, "transform": "scale(0.8)"}, "100%": {"opacity": 1, "transform": "scale(1)"}}', 500, 'ease-out'),
 
('Zoom In', 'entrance', 'Zoom in effect',
 '{"0%": {"opacity": 0, "transform": "scale(0.5)"}, "100%": {"opacity": 1, "transform": "scale(1)"}}', 600, 'cubic-bezier(0.34, 1.56, 0.64, 1)'),

-- Exit animations
('Fade Out', 'exit', 'Simple fade out effect',
 '{"0%": {"opacity": 1}, "100%": {"opacity": 0}}', 500, 'ease'),
 
('Slide Out Up', 'exit', 'Slide out to top',
 '{"0%": {"opacity": 1, "transform": "translateY(0)"}, "100%": {"opacity": 0, "transform": "translateY(-30px)"}}', 600, 'ease-in'),
 
('Scale Out', 'exit', 'Scale down to small',
 '{"0%": {"opacity": 1, "transform": "scale(1)"}, "100%": {"opacity": 0, "transform": "scale(0.8)"}}', 500, 'ease-in'),

-- Emphasis animations
('Pulse', 'emphasis', 'Pulsing scale effect',
 '{"0%, 100%": {"transform": "scale(1)"}, "50%": {"transform": "scale(1.05)"}}', 1000, 'ease-in-out'),
 
('Shake', 'emphasis', 'Horizontal shake',
 '{"0%, 100%": {"transform": "translateX(0)"}, "10%, 30%, 50%, 70%, 90%": {"transform": "translateX(-5px)"}, "20%, 40%, 60%, 80%": {"transform": "translateX(5px)"}}', 800, 'ease-in-out'),
 
('Bounce', 'emphasis', 'Bouncing effect',
 '{"0%, 20%, 50%, 80%, 100%": {"transform": "translateY(0)"}, "40%": {"transform": "translateY(-20px)"}, "60%": {"transform": "translateY(-10px)"}}', 1000, 'ease'),
 
('Wiggle', 'emphasis', 'Rotation wiggle',
 '{"0%, 100%": {"transform": "rotate(0deg)"}, "25%": {"transform": "rotate(-5deg)"}, "75%": {"transform": "rotate(5deg)"}}', 600, 'ease-in-out'),

-- Motion animations
('Float', 'motion', 'Floating up and down',
 '{"0%, 100%": {"transform": "translateY(0)"}, "50%": {"transform": "translateY(-10px)"}}', 2000, 'ease-in-out'),
 
('Rotate', 'motion', 'Full rotation',
 '{"0%": {"transform": "rotate(0deg)"}, "100%": {"transform": "rotate(360deg)"}}', 1000, 'linear'),
 
('Swing', 'motion', 'Pendulum swing',
 '{"0%, 100%": {"transform": "rotate(0deg)"}, "20%": {"transform": "rotate(15deg)"}, "40%": {"transform": "rotate(-10deg)"}, "60%": {"transform": "rotate(5deg)"}, "80%": {"transform": "rotate(-5deg)"}}', 1000, 'ease-in-out');

-- Insert common interaction patterns (will be created per-org via application logic)
-- Skipping preset interactions in migration to avoid UUID casting issues

COMMENT ON TABLE builder_interactions IS 'Reusable interaction and animation definitions';
COMMENT ON TABLE builder_element_interactions IS 'Applied interactions on specific page elements';
COMMENT ON TABLE builder_animation_presets IS 'Library of pre-built animation presets';
COMMENT ON TABLE builder_scroll_animations IS 'Scroll-triggered animations and parallax effects';
