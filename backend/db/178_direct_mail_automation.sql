-- Migration 178: Direct Mail Automation
-- Module 37 of Marketing Category
-- Benchmark: Lob / PostGrid

-- Drop tables if they exist
DROP TABLE IF EXISTS dm_analytics_daily CASCADE;
DROP TABLE IF EXISTS dm_sends CASCADE;
DROP TABLE IF EXISTS dm_campaigns CASCADE;
DROP TABLE IF EXISTS dm_templates CASCADE;

-- Direct Mail Templates
CREATE TABLE dm_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    size VARCHAR(20) DEFAULT '4x6' CHECK (size IN ('4x6', '6x9', '8.5x11')),
    type VARCHAR(20) DEFAULT 'postcard' CHECK (type IN ('postcard', 'letter')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dm_templates_org_id ON dm_templates(org_id);

-- Direct Mail Campaigns
CREATE TABLE dm_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES dm_templates(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    schedule_type VARCHAR(20) DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'scheduled', 'triggered')),
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dm_campaigns_org_id ON dm_campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_dm_campaigns_status ON dm_campaigns(status);

-- Direct Mail Sends (individual mail delivery logs)
CREATE TABLE dm_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES dm_campaigns(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    template_id UUID REFERENCES dm_templates(id) ON DELETE SET NULL,
    to_name VARCHAR(255) NOT NULL,
    to_address_line1 VARCHAR(255) NOT NULL,
    to_address_line2 VARCHAR(255),
    to_city VARCHAR(100) NOT NULL,
    to_state VARCHAR(100) NOT NULL,
    to_postal_code VARCHAR(20) NOT NULL,
    to_country VARCHAR(100) DEFAULT 'US',
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'rendered', 'printed', 'in_transit', 'processed', 'delivered', 'returned', 'failed')),
    status_details TEXT,
    api_provider VARCHAR(50) DEFAULT 'mock_lob',
    provider_job_id VARCHAR(100),
    estimated_delivery_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,
    cost NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dm_sends_org_id ON dm_sends(org_id);
CREATE INDEX IF NOT EXISTS idx_dm_sends_campaign_id ON dm_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dm_sends_contact_id ON dm_sends(contact_id);
CREATE INDEX IF NOT EXISTS idx_dm_sends_status ON dm_sends(status);

-- Direct Mail Analytics (daily aggregated statistics)
CREATE TABLE dm_analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sends INTEGER DEFAULT 0,
    delivered INTEGER DEFAULT 0,
    returned INTEGER DEFAULT 0,
    cost NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, date)
);

CREATE INDEX IF NOT EXISTS idx_dm_analytics_daily_org_id ON dm_analytics_daily(org_id);
CREATE INDEX IF NOT EXISTS idx_dm_analytics_daily_date ON dm_analytics_daily(date);

-- Update module route in registry
UPDATE modules SET route = '/modules/direct-mail-automation' WHERE slug = 'direct-mail-automation';
