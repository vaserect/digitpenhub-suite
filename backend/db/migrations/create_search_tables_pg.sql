-- ============================================================================
-- Global Search Module - Database Schema (PostgreSQL)
-- Created: 2026-07-19
-- Purpose: Enable cross-module search functionality across all entities
-- ============================================================================

-- Main search index table
CREATE TABLE IF NOT EXISTS search_index (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id BIGINT NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  metadata JSONB,
  searchable_text TEXT,
  org_id BIGINT NOT NULL,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (entity_type, entity_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_search_org_entity ON search_index(org_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_search_entity_lookup ON search_index(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_search_created_by ON search_index(created_by);
CREATE INDEX IF NOT EXISTS idx_search_updated_at ON search_index(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_fulltext ON search_index USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(searchable_text,'')));

COMMENT ON TABLE search_index IS 'Global search index for cross-module search functionality';

-- Search history for user experience and analytics
CREATE TABLE IF NOT EXISTS search_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  org_id BIGINT NOT NULL,
  query VARCHAR(500) NOT NULL,
  filters JSONB,
  result_count INT DEFAULT 0,
  clicked_result_id BIGINT,
  clicked_entity_type VARCHAR(50),
  response_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_recent ON search_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_org_analytics ON search_history(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query_analytics ON search_history(query, created_at DESC);

COMMENT ON TABLE search_history IS 'Search history for recent searches and analytics';

-- Saved searches for power users
CREATE TABLE IF NOT EXISTS saved_searches (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  org_id BIGINT NOT NULL,
  name VARCHAR(200) NOT NULL,
  query VARCHAR(500) NOT NULL,
  filters JSONB,
  is_shared BOOLEAN DEFAULT FALSE,
  use_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_shared ON saved_searches(org_id, is_shared);
CREATE INDEX IF NOT EXISTS idx_saved_searches_popular ON saved_searches(use_count DESC, last_used_at DESC);

COMMENT ON TABLE saved_searches IS 'User-saved searches for quick access';

-- Search analytics aggregation (for admin dashboard)
CREATE TABLE IF NOT EXISTS search_analytics (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT NOT NULL,
  date DATE NOT NULL,
  query VARCHAR(500) NOT NULL,
  search_count INT DEFAULT 1,
  zero_result_count INT DEFAULT 0,
  avg_response_time_ms INT,
  unique_users INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (org_id, date, query)
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_org_date ON search_analytics(org_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_popular ON search_analytics(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_zero_results ON search_analytics(zero_result_count DESC);

COMMENT ON TABLE search_analytics IS 'Aggregated search analytics for reporting';
