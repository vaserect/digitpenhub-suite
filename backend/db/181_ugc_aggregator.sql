-- Migration 181: UGC/Creator Content Aggregator
-- Module 40 of Marketing Category (Final Module)
-- Benchmark: Taggbox / Flowbox

-- Drop tables if they exist
DROP TABLE IF EXISTS ugc_widget_stats CASCADE;
DROP TABLE IF EXISTS ugc_posts CASCADE;
DROP TABLE IF EXISTS ugc_feeds CASCADE;

-- UGC Feeds / Sources
CREATE TABLE ugc_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    source_platform VARCHAR(50) NOT NULL CHECK (source_platform IN ('instagram', 'twitter', 'tiktok', 'youtube')),
    query_type VARCHAR(50) NOT NULL CHECK (query_type IN ('hashtag', 'handle', 'mention')),
    query_value VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ugc_feeds_org_id ON ugc_feeds(org_id);

-- UGC Posts Aggregated
CREATE TABLE ugc_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id UUID NOT NULL REFERENCES ugc_feeds(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    creator_name VARCHAR(255) NOT NULL,
    creator_handle VARCHAR(255) NOT NULL,
    creator_avatar TEXT,
    media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'carousel')),
    media_url TEXT NOT NULL,
    caption TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    shoppable_product_id UUID, -- Optional link to store products catalog
    pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ugc_posts_org_id ON ugc_posts(org_id);
CREATE INDEX IF NOT EXISTS idx_ugc_posts_feed_id ON ugc_posts(feed_id);
CREATE INDEX IF NOT EXISTS idx_ugc_posts_moderation ON ugc_posts(moderation_status);

-- Widget Impressions / Click Analytics
CREATE TABLE ugc_widget_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    shoppable_clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ugc_widget_stats_org_id ON ugc_widget_stats(org_id);
CREATE INDEX IF NOT EXISTS idx_ugc_widget_stats_date ON ugc_widget_stats(date);

-- Update module route in registry
UPDATE modules SET route = '/modules/ugc-aggregator' WHERE slug = 'ugc-creator-content-aggregator';
