-- Add indexes for marketplace search and filtering performance
-- Migration: 084_marketplace_search_indexes.sql

-- Full-text search index for component name, description, and tags
-- Note: Commented out due to IMMUTABLE function requirement. Will be added via generated column in future migration.
-- CREATE INDEX IF NOT EXISTS idx_marketplace_components_search 
-- ON marketplace_components 
-- USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(array_to_string(tags, ' '), '')))
-- WHERE status = 'published';

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_marketplace_components_category 
ON marketplace_components(category) 
WHERE status = 'published';

-- Index for price range filtering
CREATE INDEX IF NOT EXISTS idx_marketplace_components_price 
ON marketplace_components(price) 
WHERE status = 'published';

-- Index for rating filtering and sorting
CREATE INDEX IF NOT EXISTS idx_marketplace_components_rating 
ON marketplace_components(rating_average DESC, rating_count DESC) 
WHERE status = 'published';

-- Index for popularity sorting (downloads + purchases)
CREATE INDEX IF NOT EXISTS idx_marketplace_components_popularity 
ON marketplace_components(downloads DESC, purchases DESC) 
WHERE status = 'published';

-- Index for newest sorting
CREATE INDEX IF NOT EXISTS idx_marketplace_components_newest 
ON marketplace_components(created_at DESC) 
WHERE status = 'published';

-- Index for free/paid filtering
CREATE INDEX IF NOT EXISTS idx_marketplace_components_is_free 
ON marketplace_components(is_free) 
WHERE status = 'published';

-- Composite index for category + price filtering
CREATE INDEX IF NOT EXISTS idx_marketplace_components_category_price 
ON marketplace_components(category, price) 
WHERE status = 'published';

-- Index for tags array filtering (GIN index)
CREATE INDEX IF NOT EXISTS idx_marketplace_components_tags 
ON marketplace_components USING gin(tags)
WHERE status = 'published';

-- Index for status filtering (used in all queries)
CREATE INDEX IF NOT EXISTS idx_marketplace_components_status 
ON marketplace_components(status);

-- Index for creator_id (for creator dashboard queries)
CREATE INDEX IF NOT EXISTS idx_marketplace_components_creator 
ON marketplace_components(creator_id, created_at DESC);

-- Index for favorites count aggregation
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_component 
ON marketplace_favorites(component_id);

-- Index for purchases aggregation
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_component 
ON marketplace_purchases(component_id);

-- Index for downloads aggregation
CREATE INDEX IF NOT EXISTS idx_marketplace_downloads_component 
ON marketplace_downloads(component_id);

-- Index for reviews aggregation
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_component 
ON marketplace_reviews(component_id, status);

-- Composite index for trending calculation (recent activity)
CREATE INDEX IF NOT EXISTS idx_marketplace_components_trending 
ON marketplace_components(created_at, downloads, purchases) 
WHERE status = 'published';

-- Add comments for documentation
COMMENT ON INDEX idx_marketplace_components_search IS 'Full-text search index for component name, description, and tags';
COMMENT ON INDEX idx_marketplace_components_category IS 'Index for category filtering';
COMMENT ON INDEX idx_marketplace_components_price IS 'Index for price range filtering';
COMMENT ON INDEX idx_marketplace_components_rating IS 'Index for rating filtering and sorting';
COMMENT ON INDEX idx_marketplace_components_popularity IS 'Index for popularity sorting';
COMMENT ON INDEX idx_marketplace_components_newest IS 'Index for newest sorting';
COMMENT ON INDEX idx_marketplace_components_is_free IS 'Index for free/paid filtering';
COMMENT ON INDEX idx_marketplace_components_category_price IS 'Composite index for category + price filtering';
COMMENT ON INDEX idx_marketplace_components_tags IS 'GIN index for tags array filtering';
COMMENT ON INDEX idx_marketplace_components_trending IS 'Composite index for trending calculation';
