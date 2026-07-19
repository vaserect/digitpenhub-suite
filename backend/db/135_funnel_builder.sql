-- Migration 135: Funnel Builder System
-- Complete funnel creation, management, and optimization (ClickFunnels/Leadpages equivalent)

-- Funnel definitions
CREATE TABLE IF NOT EXISTS funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Funnel configuration
    funnel_type VARCHAR(50) NOT NULL, -- 'sales', 'lead_generation', 'webinar', 'product_launch', 'membership', 'survey'
    goal VARCHAR(100), -- 'conversions', 'leads', 'registrations', 'sales'
    target_metric JSONB DEFAULT '{}', -- {metric: 'conversion_rate', target: 15}
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'archived'
    is_published BOOLEAN DEFAULT false,
    
    -- Domain & URL
    custom_domain VARCHAR(255),
    subdomain VARCHAR(100),
    url_slug VARCHAR(255),
    
    -- Settings
    settings JSONB DEFAULT '{}', -- tracking pixels, integrations, etc.
    
    -- Analytics
    total_visitors INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    
    UNIQUE(org_id, url_slug)
);

-- Funnel steps (pages in the funnel)
CREATE TABLE IF NOT EXISTS funnel_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
    
    -- Step configuration
    step_name VARCHAR(255) NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- 'landing', 'opt_in', 'sales', 'upsell', 'downsell', 'thank_you', 'checkout'
    step_order INTEGER NOT NULL,
    
    -- URL
    url_path VARCHAR(255) NOT NULL,
    
    -- Navigation rules
    next_step_id UUID REFERENCES funnel_steps(id) ON DELETE SET NULL,
    success_step_id UUID REFERENCES funnel_steps(id) ON DELETE SET NULL, -- On conversion
    failure_step_id UUID REFERENCES funnel_steps(id) ON DELETE SET NULL, -- On rejection
    
    -- Conditional logic
    conditions JSONB DEFAULT '[]', -- Array of conditions for step visibility
    
    -- Analytics
    visitors INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_time_on_page INTEGER DEFAULT 0, -- seconds
    bounce_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(funnel_id, step_order)
);

-- Funnel templates
CREATE TABLE IF NOT EXISTS funnel_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'sales', 'lead_gen', 'webinar', 'product_launch'
    
    -- Template data
    template_data JSONB NOT NULL, -- Complete funnel structure
    preview_image TEXT,
    
    -- Template metadata
    is_system BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- Tags for filtering
    tags TEXT[],
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A/B test variants
CREATE TABLE IF NOT EXISTS funnel_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    step_id UUID REFERENCES funnel_steps(id) ON DELETE CASCADE,
    
    -- Test configuration
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(50) DEFAULT 'page', -- 'page', 'headline', 'cta', 'image', 'form'
    
    -- Variants
    control_variant_id UUID, -- Original version
    variants JSONB NOT NULL DEFAULT '[]', -- Array of variant configurations
    
    -- Traffic split
    traffic_allocation JSONB DEFAULT '{}', -- {variant_a: 50, variant_b: 50}
    
    -- Test status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
    winner_variant_id UUID,
    
    -- Test period
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- Statistical significance
    confidence_level DECIMAL(5,2) DEFAULT 95.00,
    is_significant BOOLEAN DEFAULT false,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A/B test results
CREATE TABLE IF NOT EXISTS funnel_ab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES funnel_ab_tests(id) ON DELETE CASCADE,
    variant_id VARCHAR(100) NOT NULL,
    
    -- Metrics
    visitors INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    revenue DECIMAL(12,2) DEFAULT 0.00,
    avg_order_value DECIMAL(10,2) DEFAULT 0.00,
    
    -- Engagement
    avg_time_on_page INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Statistical data
    confidence_interval JSONB,
    p_value DECIMAL(10,8),
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(test_id, variant_id)
);

-- Funnel analytics events
CREATE TABLE IF NOT EXISTS funnel_analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    step_id UUID REFERENCES funnel_steps(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'page_view', 'conversion', 'exit', 'form_submit', 'button_click'
    event_data JSONB DEFAULT '{}',
    
    -- User info
    user_id UUID REFERENCES users(id),
    visitor_id VARCHAR(255), -- Anonymous visitor tracking
    
    -- Context
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    
    -- Device & location
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(2),
    city VARCHAR(100),
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Funnel conversions tracking
CREATE TABLE IF NOT EXISTS funnel_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    
    -- Conversion details
    conversion_type VARCHAR(50) NOT NULL, -- 'lead', 'sale', 'registration', 'download'
    conversion_value DECIMAL(10,2) DEFAULT 0.00,
    
    -- Journey
    entry_step_id UUID REFERENCES funnel_steps(id),
    conversion_step_id UUID REFERENCES funnel_steps(id),
    steps_taken JSONB DEFAULT '[]', -- Array of step IDs in order
    time_to_convert INTEGER, -- seconds
    
    -- User info
    user_id UUID REFERENCES users(id),
    visitor_id VARCHAR(255),
    email VARCHAR(255),
    
    -- Attribution
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Metadata
    conversion_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Funnel integrations
CREATE TABLE IF NOT EXISTS funnel_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    
    -- Integration details
    integration_type VARCHAR(50) NOT NULL, -- 'email', 'crm', 'payment', 'analytics', 'webhook'
    integration_name VARCHAR(100) NOT NULL, -- 'mailchimp', 'stripe', 'zapier', etc.
    
    -- Configuration
    config JSONB NOT NULL DEFAULT '{}',
    credentials_encrypted TEXT,
    
    -- Trigger conditions
    trigger_on VARCHAR(50) NOT NULL, -- 'step_entry', 'conversion', 'exit', 'form_submit'
    trigger_step_id UUID REFERENCES funnel_steps(id),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_funnels_org ON funnels(org_id);
CREATE INDEX idx_funnels_status ON funnels(status);
CREATE INDEX idx_funnels_published ON funnels(is_published) WHERE is_published = true;
CREATE INDEX idx_funnel_steps_funnel ON funnel_steps(funnel_id);
CREATE INDEX idx_funnel_steps_order ON funnel_steps(funnel_id, step_order);
CREATE INDEX idx_funnel_templates_org ON funnel_templates(org_id);
CREATE INDEX idx_funnel_templates_category ON funnel_templates(category);
CREATE INDEX idx_funnel_ab_tests_funnel ON funnel_ab_tests(funnel_id);
CREATE INDEX idx_funnel_ab_tests_status ON funnel_ab_tests(status);
CREATE INDEX idx_funnel_ab_results_test ON funnel_ab_results(test_id);
CREATE INDEX idx_funnel_analytics_funnel ON funnel_analytics_events(funnel_id);
CREATE INDEX idx_funnel_analytics_session ON funnel_analytics_events(session_id);
CREATE INDEX idx_funnel_analytics_date ON funnel_analytics_events(created_at DESC);
CREATE INDEX idx_funnel_conversions_funnel ON funnel_conversions(funnel_id);
CREATE INDEX idx_funnel_conversions_session ON funnel_conversions(session_id);
CREATE INDEX idx_funnel_conversions_date ON funnel_conversions(created_at DESC);
CREATE INDEX idx_funnel_integrations_funnel ON funnel_integrations(funnel_id);

-- Insert system funnel templates
INSERT INTO funnel_templates (org_id, name, description, category, template_data, is_system, tags)
VALUES
(NULL, 'Lead Magnet Funnel', 'Simple 2-step funnel for lead generation with opt-in and thank you page', 'lead_gen', 
 '{"steps": [{"name": "Opt-in Page", "type": "opt_in", "order": 1}, {"name": "Thank You", "type": "thank_you", "order": 2}]}'::jsonb,
 true, ARRAY['lead_generation', 'simple', '2_step']),

(NULL, 'Product Launch Funnel', 'Complete product launch sequence with pre-launch, launch, and post-launch pages', 'product_launch',
 '{"steps": [{"name": "Pre-Launch", "type": "landing", "order": 1}, {"name": "Launch Page", "type": "sales", "order": 2}, {"name": "Checkout", "type": "checkout", "order": 3}, {"name": "Upsell", "type": "upsell", "order": 4}, {"name": "Thank You", "type": "thank_you", "order": 5}]}'::jsonb,
 true, ARRAY['product_launch', 'sales', '5_step']),

(NULL, 'Webinar Funnel', 'Registration to replay funnel for webinars', 'webinar',
 '{"steps": [{"name": "Registration", "type": "opt_in", "order": 1}, {"name": "Confirmation", "type": "thank_you", "order": 2}, {"name": "Webinar Room", "type": "landing", "order": 3}, {"name": "Replay", "type": "sales", "order": 4}]}'::jsonb,
 true, ARRAY['webinar', 'registration', '4_step']),

(NULL, 'Tripwire Funnel', 'Low-ticket offer with upsell sequence', 'sales',
 '{"steps": [{"name": "Landing Page", "type": "landing", "order": 1}, {"name": "Checkout", "type": "checkout", "order": 2}, {"name": "Upsell 1", "type": "upsell", "order": 3}, {"name": "Upsell 2", "type": "upsell", "order": 4}, {"name": "Thank You", "type": "thank_you", "order": 5}]}'::jsonb,
 true, ARRAY['sales', 'tripwire', 'upsell']);

COMMENT ON TABLE funnels IS 'Funnel definitions and configurations';
COMMENT ON TABLE funnel_steps IS 'Individual steps/pages within funnels';
COMMENT ON TABLE funnel_templates IS 'Reusable funnel templates';
COMMENT ON TABLE funnel_ab_tests IS 'A/B test configurations for funnel optimization';
COMMENT ON TABLE funnel_ab_results IS 'A/B test results and metrics';
COMMENT ON TABLE funnel_analytics_events IS 'Detailed analytics events for funnel tracking';
COMMENT ON TABLE funnel_conversions IS 'Conversion tracking and attribution';
COMMENT ON TABLE funnel_integrations IS 'Third-party integrations for funnels';
