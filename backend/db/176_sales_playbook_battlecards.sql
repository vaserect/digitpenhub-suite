-- Migration 176: Sales Playbook / Battlecard Library
-- Module 35 of Marketing Category
-- Benchmark: Klue / Highspot / Seismic

DROP TABLE IF EXISTS content_analytics_daily CASCADE;
DROP TABLE IF EXISTS content_comments CASCADE;
DROP TABLE IF EXISTS content_shares CASCADE;
DROP TABLE IF EXISTS content_favorites CASCADE;
DROP TABLE IF EXISTS content_ratings CASCADE;
DROP TABLE IF EXISTS content_views CASCADE;
DROP TABLE IF EXISTS battlecard_tags CASCADE;
DROP TABLE IF EXISTS playbook_tags CASCADE;
DROP TABLE IF EXISTS content_tags CASCADE;
DROP TABLE IF EXISTS content_categories CASCADE;
DROP TABLE IF EXISTS battlecards CASCADE;
DROP TABLE IF EXISTS playbook_sections CASCADE;
DROP TABLE IF EXISTS playbooks CASCADE;

-- Playbooks
CREATE TABLE playbooks (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    content JSONB,
    metadata JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    version INTEGER DEFAULT 1,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_playbooks_org_id ON playbooks(org_id);
CREATE INDEX IF NOT EXISTS idx_playbooks_status ON playbooks(status);
CREATE INDEX IF NOT EXISTS idx_playbooks_category ON playbooks(category);
CREATE INDEX IF NOT EXISTS idx_playbooks_created_by ON playbooks(created_by);

-- Playbook Sections
CREATE TABLE playbook_sections (
    id SERIAL PRIMARY KEY,
    playbook_id INTEGER NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    section_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_playbook_sections_playbook_id ON playbook_sections(playbook_id);

-- Battlecards
CREATE TABLE battlecards (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    competitor_name VARCHAR(255) NOT NULL,
    competitor_logo TEXT,
    overview TEXT,
    strengths JSONB,
    weaknesses JSONB,
    differentiators JSONB,
    pricing_comparison JSONB,
    feature_comparison JSONB,
    win_strategies JSONB,
    objection_handling JSONB,
    market_position TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_battlecards_org_id ON battlecards(org_id);
CREATE INDEX IF NOT EXISTS idx_battlecards_status ON battlecards(status);
CREATE INDEX IF NOT EXISTS idx_battlecards_competitor_name ON battlecards(competitor_name);

-- Content Categories
CREATE TABLE content_categories (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES content_categories(id) ON DELETE SET NULL,
    category_type VARCHAR(20) CHECK (category_type IN ('playbook', 'battlecard', 'both')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_categories_org_id ON content_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_content_categories_parent_id ON content_categories(parent_id);

-- Content Tags
CREATE TABLE content_tags (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_content_tags_org_id ON content_tags(org_id);

-- Playbook Tags (junction)
CREATE TABLE playbook_tags (
    id SERIAL PRIMARY KEY,
    playbook_id INTEGER NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES content_tags(id) ON DELETE CASCADE,
    UNIQUE(playbook_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_playbook_tags_playbook_id ON playbook_tags(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_tags_tag_id ON playbook_tags(tag_id);

-- Battlecard Tags (junction)
CREATE TABLE battlecard_tags (
    id SERIAL PRIMARY KEY,
    battlecard_id INTEGER NOT NULL REFERENCES battlecards(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES content_tags(id) ON DELETE CASCADE,
    UNIQUE(battlecard_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_battlecard_tags_battlecard_id ON battlecard_tags(battlecard_id);
CREATE INDEX IF NOT EXISTS idx_battlecard_tags_tag_id ON battlecard_tags(tag_id);

-- Content Usage Tracking
CREATE TABLE content_views (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('playbook', 'battlecard')),
    content_id INTEGER NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0,
    source VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_content_views_content ON content_views(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_views_user_id ON content_views(user_id);
CREATE INDEX IF NOT EXISTS idx_content_views_viewed_at ON content_views(viewed_at);

-- Content Ratings
CREATE TABLE content_ratings (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('playbook', 'battlecard')),
    content_id INTEGER NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_type, content_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_content_ratings_content ON content_ratings(content_type, content_id);

-- Content Favorites
CREATE TABLE content_favorites (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('playbook', 'battlecard')),
    content_id INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_type, content_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_content_favorites_user_id ON content_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_content_favorites_content ON content_favorites(content_type, content_id);

-- Content Shares
CREATE TABLE content_shares (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('playbook', 'battlecard')),
    content_id INTEGER NOT NULL,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with JSONB,
    share_method VARCHAR(50),
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_shares_content ON content_shares(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_shares_shared_by ON content_shares(shared_by);

-- Content Comments
CREATE TABLE content_comments (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('playbook', 'battlecard')),
    content_id INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES content_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_comments_content ON content_comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_user_id ON content_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_parent ON content_comments(parent_comment_id);

-- Content Analytics (daily aggregation)
CREATE TABLE content_analytics_daily (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('playbook', 'battlecard')),
    content_id INTEGER NOT NULL,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    avg_duration_seconds INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    ratings_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_type, content_id, date)
);

CREATE INDEX IF NOT EXISTS idx_content_analytics_daily_content ON content_analytics_daily(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_daily_date ON content_analytics_daily(date);

