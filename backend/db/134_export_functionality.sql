-- Migration 134: Export Functionality for Website Builder
-- Export pages as static HTML/CSS/JS

-- Export configurations
CREATE TABLE IF NOT EXISTS page_exports (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    
    -- Export configuration
    export_type VARCHAR(50) NOT NULL, -- 'html', 'zip', 'ftp', 'github'
    export_format VARCHAR(50) DEFAULT 'standalone', -- 'standalone', 'template', 'component'
    
    -- Export options
    include_css BOOLEAN DEFAULT true,
    include_js BOOLEAN DEFAULT true,
    include_images BOOLEAN DEFAULT true,
    minify_code BOOLEAN DEFAULT false,
    inline_styles BOOLEAN DEFAULT false,
    inline_scripts BOOLEAN DEFAULT false,
    
    -- Output
    export_url TEXT,
    file_size INTEGER, -- bytes
    file_path TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    
    -- Metadata
    exported_by UUID NOT NULL REFERENCES users(id),
    exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP
);

-- Export templates (reusable export configurations)
CREATE TABLE IF NOT EXISTS export_templates (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template configuration
    config JSONB NOT NULL,
    
    -- Usage
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(org_id, name)
);

-- FTP/SFTP deployment configurations
CREATE TABLE IF NOT EXISTS deployment_configs (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    
    -- Connection details
    protocol VARCHAR(20) NOT NULL, -- 'ftp', 'sftp', 'github', 's3', 'netlify', 'vercel'
    host VARCHAR(255),
    port INTEGER,
    username VARCHAR(255),
    password_encrypted TEXT, -- Encrypted password
    
    -- Paths
    remote_path VARCHAR(500),
    
    -- Additional config (API keys, tokens, etc.)
    additional_config JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(org_id, name)
);

-- Deployment history
CREATE TABLE IF NOT EXISTS deployment_history (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    config_id INTEGER REFERENCES deployment_configs(id) ON DELETE SET NULL,
    
    -- Deployment details
    deployment_type VARCHAR(50) NOT NULL,
    deployment_url TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'deploying', 'success', 'failed'
    error_message TEXT,
    
    -- Metadata
    deployed_by UUID NOT NULL REFERENCES users(id),
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER
);

-- Indexes
CREATE INDEX idx_page_exports_page ON page_exports(page_id);
CREATE INDEX idx_page_exports_status ON page_exports(status);
CREATE INDEX idx_page_exports_date ON page_exports(exported_at DESC);
CREATE INDEX idx_export_templates_org ON export_templates(org_id);
CREATE INDEX idx_deployment_configs_org ON deployment_configs(org_id);
CREATE INDEX idx_deployment_history_page ON deployment_history(page_id);
CREATE INDEX idx_deployment_history_date ON deployment_history(deployed_at DESC);

-- Insert default export templates
INSERT INTO export_templates (org_id, name, description, config, is_default)
SELECT 
    id as org_id,
    'Standard HTML',
    'Export as standalone HTML with embedded CSS and JS',
    '{
        "export_type": "html",
        "export_format": "standalone",
        "include_css": true,
        "include_js": true,
        "include_images": true,
        "minify_code": false,
        "inline_styles": true,
        "inline_scripts": true
    }'::jsonb,
    true
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM export_templates 
    WHERE org_id = organizations.id AND name = 'Standard HTML'
);

INSERT INTO export_templates (org_id, name, description, config, is_default)
SELECT 
    id as org_id,
    'Production Ready',
    'Minified and optimized for production deployment',
    '{
        "export_type": "zip",
        "export_format": "standalone",
        "include_css": true,
        "include_js": true,
        "include_images": true,
        "minify_code": true,
        "inline_styles": false,
        "inline_scripts": false
    }'::jsonb,
    false
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM export_templates 
    WHERE org_id = organizations.id AND name = 'Production Ready'
);

COMMENT ON TABLE page_exports IS 'Export history and configurations for pages';
COMMENT ON TABLE export_templates IS 'Reusable export configuration templates';
COMMENT ON TABLE deployment_configs IS 'FTP/SFTP and hosting deployment configurations';
COMMENT ON TABLE deployment_history IS 'History of page deployments';
