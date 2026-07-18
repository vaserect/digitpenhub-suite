-- Migration 131: SEO Meta Editor Enhancements
-- Advanced SEO features for Website Builder pages

-- Enhanced SEO metadata for pages
CREATE TABLE IF NOT EXISTS page_seo_metadata (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    
    -- Basic SEO
    meta_title VARCHAR(70), -- Optimal: 50-60 chars
    meta_description VARCHAR(160), -- Optimal: 150-160 chars
    meta_keywords TEXT[],
    canonical_url TEXT,
    
    -- Open Graph (Facebook, LinkedIn)
    og_title VARCHAR(100),
    og_description VARCHAR(200),
    og_image TEXT,
    og_type VARCHAR(50) DEFAULT 'website',
    og_locale VARCHAR(10) DEFAULT 'en_US',
    
    -- Twitter Card
    twitter_card VARCHAR(50) DEFAULT 'summary_large_image',
    twitter_title VARCHAR(70),
    twitter_description VARCHAR(200),
    twitter_image TEXT,
    twitter_site VARCHAR(50), -- @username
    twitter_creator VARCHAR(50), -- @username
    
    -- Structured Data (Schema.org)
    schema_type VARCHAR(100), -- 'Article', 'Product', 'Organization', etc.
    schema_data JSONB DEFAULT '{}',
    
    -- Robots directives
    robots_index BOOLEAN DEFAULT true,
    robots_follow BOOLEAN DEFAULT true,
    robots_directives TEXT[], -- 'noarchive', 'nosnippet', etc.
    
    -- Advanced
    hreflang JSONB DEFAULT '[]', -- Array of {lang, url} objects
    alternate_urls JSONB DEFAULT '[]', -- Mobile, AMP versions
    
    -- SEO Score & Analysis
    seo_score INTEGER DEFAULT 0, -- 0-100
    seo_issues JSONB DEFAULT '[]', -- Array of detected issues
    last_analyzed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(page_id)
);

-- SEO audit history
CREATE TABLE IF NOT EXISTS page_seo_audits (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    
    -- Audit results
    overall_score INTEGER NOT NULL,
    performance_score INTEGER,
    accessibility_score INTEGER,
    best_practices_score INTEGER,
    seo_score INTEGER,
    
    -- Detailed findings
    issues JSONB NOT NULL DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    
    -- Metrics
    page_load_time INTEGER, -- milliseconds
    page_size INTEGER, -- bytes
    total_requests INTEGER,
    
    -- Audit metadata
    audit_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'scheduled', 'auto'
    audited_by UUID REFERENCES users(id),
    audited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SEO templates (reusable SEO configurations)
CREATE TABLE IF NOT EXISTS seo_templates (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template configuration
    template_data JSONB NOT NULL,
    
    -- Usage
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(org_id, name)
);

-- Sitemap configuration
CREATE TABLE IF NOT EXISTS sitemap_config (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Sitemap settings
    is_enabled BOOLEAN DEFAULT true,
    auto_generate BOOLEAN DEFAULT true,
    update_frequency VARCHAR(20) DEFAULT 'daily', -- 'always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'
    priority DECIMAL(2,1) DEFAULT 0.5, -- 0.0 to 1.0
    
    -- Exclusions
    excluded_pages UUID[],
    excluded_patterns TEXT[],
    
    -- Advanced
    include_images BOOLEAN DEFAULT true,
    include_videos BOOLEAN DEFAULT false,
    compress_sitemap BOOLEAN DEFAULT true,
    
    last_generated_at TIMESTAMP,
    sitemap_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(org_id)
);

-- Robots.txt configuration
CREATE TABLE IF NOT EXISTS robots_config (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Robots.txt content
    content TEXT NOT NULL,
    
    -- Common directives
    allow_all BOOLEAN DEFAULT true,
    disallow_patterns TEXT[],
    crawl_delay INTEGER, -- seconds
    
    -- Sitemap reference
    sitemap_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(org_id)
);

-- Redirect rules for SEO
CREATE TABLE IF NOT EXISTS seo_redirects (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Redirect configuration
    source_path TEXT NOT NULL,
    destination_path TEXT NOT NULL,
    redirect_type INTEGER DEFAULT 301, -- 301 (permanent), 302 (temporary), 307, 308
    
    -- Matching
    match_type VARCHAR(20) DEFAULT 'exact', -- 'exact', 'prefix', 'regex'
    is_case_sensitive BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMP,
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_page_seo_metadata_page ON page_seo_metadata(page_id);
CREATE INDEX idx_page_seo_audits_page ON page_seo_audits(page_id);
CREATE INDEX idx_page_seo_audits_date ON page_seo_audits(audited_at DESC);
CREATE INDEX idx_seo_templates_org ON seo_templates(org_id);
CREATE INDEX idx_sitemap_config_org ON sitemap_config(org_id);
CREATE INDEX idx_robots_config_org ON robots_config(org_id);
CREATE INDEX idx_seo_redirects_org ON seo_redirects(org_id);
CREATE INDEX idx_seo_redirects_source ON seo_redirects(source_path);
CREATE INDEX idx_seo_redirects_active ON seo_redirects(is_active) WHERE is_active = true;

-- Insert default sitemap config for all organizations
INSERT INTO sitemap_config (org_id, is_enabled, auto_generate)
SELECT id, true, true
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM sitemap_config WHERE org_id = organizations.id
);

-- Insert default robots.txt for all organizations
INSERT INTO robots_config (org_id, content, allow_all)
SELECT 
    id,
    E'User-agent: *\nAllow: /\n\nSitemap: https://yourdomain.com/sitemap.xml',
    true
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM robots_config WHERE org_id = organizations.id
);

-- Insert common SEO templates
INSERT INTO seo_templates (org_id, name, description, template_data, is_default)
SELECT 
    id as org_id,
    'Blog Post',
    'SEO template for blog posts',
    '{
        "schema_type": "Article",
        "og_type": "article",
        "twitter_card": "summary_large_image",
        "robots_index": true,
        "robots_follow": true
    }'::jsonb,
    false
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM seo_templates 
    WHERE org_id = organizations.id AND name = 'Blog Post'
);

INSERT INTO seo_templates (org_id, name, description, template_data, is_default)
SELECT 
    id as org_id,
    'Product Page',
    'SEO template for product pages',
    '{
        "schema_type": "Product",
        "og_type": "product",
        "twitter_card": "summary",
        "robots_index": true,
        "robots_follow": true
    }'::jsonb,
    false
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM seo_templates 
    WHERE org_id = organizations.id AND name = 'Product Page'
);

COMMENT ON TABLE page_seo_metadata IS 'Enhanced SEO metadata for website builder pages';
COMMENT ON TABLE page_seo_audits IS 'SEO audit history and scores';
COMMENT ON TABLE seo_templates IS 'Reusable SEO configuration templates';
COMMENT ON TABLE sitemap_config IS 'Sitemap generation configuration';
COMMENT ON TABLE robots_config IS 'Robots.txt configuration';
COMMENT ON TABLE seo_redirects IS 'SEO-friendly redirect rules';
