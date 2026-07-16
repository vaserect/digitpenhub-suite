-- Component Marketplace Schema
-- Allows users to share and sell custom components

-- Marketplace Components Table
CREATE TABLE IF NOT EXISTS marketplace_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Component Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    tags TEXT[], -- Array of tags for search
    
    -- Component Data
    component_data JSONB NOT NULL, -- The actual component structure
    thumbnail_url TEXT,
    preview_images TEXT[], -- Array of preview image URLs
    demo_url TEXT, -- Link to live demo
    
    -- Pricing
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, published, unpublished
    is_featured BOOLEAN DEFAULT false,
    
    -- Stats
    downloads INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    rating_average DECIMAL(3, 2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    
    -- Metadata
    version VARCHAR(50) DEFAULT '1.0.0',
    compatibility_version VARCHAR(50), -- Builder version compatibility
    license VARCHAR(100) DEFAULT 'MIT',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT valid_rating CHECK (rating_average >= 0 AND rating_average <= 5)
);

-- Marketplace Component Reviews
CREATE TABLE IF NOT EXISTS marketplace_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id UUID NOT NULL REFERENCES marketplace_components(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    
    -- Status
    is_verified_purchase BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'published', -- published, hidden, flagged
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(component_id, user_id) -- One review per user per component
);

-- Marketplace Purchases
CREATE TABLE IF NOT EXISTS marketplace_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id UUID NOT NULL REFERENCES marketplace_components(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Purchase Details
    price_paid DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payment Info
    payment_method VARCHAR(50), -- stripe, paypal, etc.
    payment_id VARCHAR(255), -- External payment ID
    payment_status VARCHAR(50) DEFAULT 'completed', -- completed, refunded, failed
    
    -- License
    license_key VARCHAR(255) UNIQUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(component_id, buyer_id) -- One purchase per user per component
);

-- Marketplace Downloads (for free components)
CREATE TABLE IF NOT EXISTS marketplace_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id UUID NOT NULL REFERENCES marketplace_components(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(component_id, user_id) -- Track unique downloads
);

-- Marketplace Collections (curated lists)
CREATE TABLE IF NOT EXISTS marketplace_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collection Items
CREATE TABLE IF NOT EXISTS marketplace_collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES marketplace_collections(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES marketplace_components(id) ON DELETE CASCADE,
    
    position INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(collection_id, component_id)
);

-- Component Favorites/Bookmarks
CREATE TABLE IF NOT EXISTS marketplace_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id UUID NOT NULL REFERENCES marketplace_components(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(component_id, user_id)
);

-- Component Reports (for flagging inappropriate content)
CREATE TABLE IF NOT EXISTS marketplace_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id UUID NOT NULL REFERENCES marketplace_components(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    reason VARCHAR(100) NOT NULL, -- spam, inappropriate, copyright, etc.
    description TEXT,
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_marketplace_components_creator ON marketplace_components(creator_id);
CREATE INDEX idx_marketplace_components_category ON marketplace_components(category);
CREATE INDEX idx_marketplace_components_status ON marketplace_components(status);
CREATE INDEX idx_marketplace_components_featured ON marketplace_components(is_featured) WHERE is_featured = true;
CREATE INDEX idx_marketplace_components_free ON marketplace_components(is_free);
CREATE INDEX idx_marketplace_components_rating ON marketplace_components(rating_average DESC);
CREATE INDEX idx_marketplace_components_downloads ON marketplace_components(downloads DESC);
CREATE INDEX idx_marketplace_components_tags ON marketplace_components USING GIN(tags);

CREATE INDEX idx_marketplace_reviews_component ON marketplace_reviews(component_id);
CREATE INDEX idx_marketplace_reviews_user ON marketplace_reviews(user_id);
CREATE INDEX idx_marketplace_reviews_rating ON marketplace_reviews(rating);

CREATE INDEX idx_marketplace_purchases_buyer ON marketplace_purchases(buyer_id);
CREATE INDEX idx_marketplace_purchases_component ON marketplace_purchases(component_id);

CREATE INDEX idx_marketplace_downloads_user ON marketplace_downloads(user_id);
CREATE INDEX idx_marketplace_downloads_component ON marketplace_downloads(component_id);

CREATE INDEX idx_marketplace_favorites_user ON marketplace_favorites(user_id);
CREATE INDEX idx_marketplace_favorites_component ON marketplace_favorites(component_id);

-- Full-text search index
CREATE INDEX idx_marketplace_components_search ON marketplace_components 
USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_component_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_component_updated
    BEFORE UPDATE ON marketplace_components
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_component_timestamp();

-- Function to update component rating
CREATE OR REPLACE FUNCTION update_component_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE marketplace_components
    SET 
        rating_average = (
            SELECT COALESCE(AVG(rating), 0)
            FROM marketplace_reviews
            WHERE component_id = NEW.component_id
            AND status = 'published'
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM marketplace_reviews
            WHERE component_id = NEW.component_id
            AND status = 'published'
        )
    WHERE id = NEW.component_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review
    AFTER INSERT OR UPDATE ON marketplace_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_component_rating();

-- Sample data for testing (commented out - requires valid UUID creator_id)
-- INSERT INTO marketplace_components (
--     creator_id, name, description, category, tags,
--     component_data, is_free, is_featured, status
-- ) VALUES
-- ((SELECT id FROM users LIMIT 1), 'Modern Hero Section', 'A stunning hero section with gradient background and call-to-action', 'hero', 
--  ARRAY['hero', 'gradient', 'modern', 'cta'],
--  '{"type": "hero", "props": {"title": "Welcome", "subtitle": "Get started today"}}',
--  true, true, 'published'),
-- ((SELECT id FROM users LIMIT 1), 'Pricing Table Pro', 'Professional pricing table with 3 tiers and feature comparison', 'pricing',
--  ARRAY['pricing', 'table', 'comparison', 'professional'],
--  '{"type": "pricing", "props": {"plans": 3}}',
--  false, true, 'published'),
-- ((SELECT id FROM users LIMIT 1), 'Testimonial Carousel', 'Beautiful testimonial carousel with auto-play', 'testimonials',
--  ARRAY['testimonials', 'carousel', 'reviews', 'slider'],
--  '{"type": "testimonials", "props": {"autoplay": true}}',
--  true, false, 'published');

-- Update prices for paid components
UPDATE marketplace_components 
SET price = 29.99 
WHERE name = 'Pricing Table Pro';

COMMENT ON TABLE marketplace_components IS 'User-created components available in the marketplace';
COMMENT ON TABLE marketplace_reviews IS 'User reviews and ratings for marketplace components';
COMMENT ON TABLE marketplace_purchases IS 'Purchase records for paid components';
COMMENT ON TABLE marketplace_downloads IS 'Download tracking for free components';
COMMENT ON TABLE marketplace_collections IS 'Curated collections of components';
COMMENT ON TABLE marketplace_favorites IS 'User bookmarks/favorites';
COMMENT ON TABLE marketplace_reports IS 'User reports for inappropriate content';
