-- ============================================================================
-- Global Search Module - Database Schema
-- Created: 2026-07-19
-- Purpose: Enable cross-module search functionality across all entities
-- ============================================================================

-- Main search index table
CREATE TABLE IF NOT EXISTS search_index (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  entity_type VARCHAR(50) NOT NULL COMMENT 'Type of entity (contact, deal, task, etc.)',
  entity_id BIGINT NOT NULL COMMENT 'ID of the actual entity record',
  title VARCHAR(500) NOT NULL COMMENT 'Primary display text (name, subject, etc.)',
  content TEXT COMMENT 'Searchable content/description',
  metadata JSON COMMENT 'Additional searchable fields as JSON',
  searchable_text TEXT COMMENT 'Concatenated searchable content for full-text',
  org_id BIGINT NOT NULL COMMENT 'Organization ID for multi-tenancy',
  created_by BIGINT COMMENT 'User who created the entity',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_org_entity (org_id, entity_type),
  INDEX idx_entity_lookup (entity_type, entity_id),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_at (updated_at DESC),
  
  -- Full-text search index (MySQL native)
  FULLTEXT INDEX ft_search (title, content, searchable_text),
  
  -- Ensure uniqueness per entity
  UNIQUE KEY uk_entity (entity_type, entity_id, org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Global search index for cross-module search functionality';

-- Search history for user experience and analytics
CREATE TABLE IF NOT EXISTS search_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT 'User who performed the search',
  org_id BIGINT NOT NULL COMMENT 'Organization context',
  query VARCHAR(500) NOT NULL COMMENT 'Search query text',
  filters JSON COMMENT 'Applied filters (entity_type, date_range, etc.)',
  result_count INT DEFAULT 0 COMMENT 'Number of results returned',
  clicked_result_id BIGINT COMMENT 'ID of result user clicked (if any)',
  clicked_entity_type VARCHAR(50) COMMENT 'Type of entity user clicked',
  response_time_ms INT COMMENT 'Search response time in milliseconds',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_user_recent (user_id, created_at DESC),
  INDEX idx_org_analytics (org_id, created_at DESC),
  INDEX idx_query_analytics (query(100), created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Search history for recent searches and analytics';

-- Saved searches for power users
CREATE TABLE IF NOT EXISTS saved_searches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT 'User who saved the search',
  org_id BIGINT NOT NULL COMMENT 'Organization context',
  name VARCHAR(200) NOT NULL COMMENT 'User-defined name for saved search',
  query VARCHAR(500) NOT NULL COMMENT 'Search query',
  filters JSON COMMENT 'Saved filter configuration',
  is_shared BOOLEAN DEFAULT FALSE COMMENT 'Whether search is shared with team',
  use_count INT DEFAULT 0 COMMENT 'Number of times this search was used',
  last_used_at TIMESTAMP NULL COMMENT 'Last time search was executed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_user_searches (user_id, org_id),
  INDEX idx_shared_searches (org_id, is_shared),
  INDEX idx_popular (use_count DESC, last_used_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User-saved searches for quick access';

-- Search analytics aggregation (for admin dashboard)
CREATE TABLE IF NOT EXISTS search_analytics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  org_id BIGINT NOT NULL,
  date DATE NOT NULL COMMENT 'Analytics date',
  query VARCHAR(500) NOT NULL COMMENT 'Search query',
  search_count INT DEFAULT 1 COMMENT 'Number of times searched',
  zero_result_count INT DEFAULT 0 COMMENT 'Times this query returned no results',
  avg_response_time_ms INT COMMENT 'Average response time',
  unique_users INT DEFAULT 1 COMMENT 'Number of unique users who searched this',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_org_date (org_id, date DESC),
  INDEX idx_popular_queries (search_count DESC),
  INDEX idx_zero_results (zero_result_count DESC),
  
  -- Unique constraint for daily aggregation
  UNIQUE KEY uk_org_date_query (org_id, date, query(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Aggregated search analytics for reporting';

-- ============================================================================
-- Initial Data / Configuration
-- ============================================================================

-- No initial data needed - tables will be populated as users search
-- and as entities are indexed

