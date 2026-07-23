-- Fix search_index, search_history, and saved_searches tables
-- org_id and user_id/created_by are bigint but should be UUID
-- These are cache/analytics tables — safe to recreate

DROP TABLE IF EXISTS search_index CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS saved_searches CASCADE;
DROP TABLE IF EXISTS search_cache CASCADE;
DROP TABLE IF EXISTS search_events CASCADE;
DROP TABLE IF EXISTS search_synonyms CASCADE;

-- Search index with proper UUID types
CREATE TABLE search_index (
  id              BIGSERIAL PRIMARY KEY,
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       VARCHAR(100) NOT NULL,
  title           VARCHAR(500) NOT NULL,
  content         TEXT,
  metadata        JSONB DEFAULT '{}',
  searchable_text TEXT,
  org_id          UUID NOT NULL,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_search_org_entity ON search_index(org_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_search_created_by ON search_index(created_by);
CREATE INDEX IF NOT EXISTS idx_search_entity_lookup ON search_index(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_search_fulltext ON search_index USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(searchable_text,'')));
CREATE INDEX IF NOT EXISTS idx_search_index_created_at ON search_index(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_index_fts_title ON search_index USING gin(to_tsvector('english', title::text));
CREATE INDEX IF NOT EXISTS idx_search_index_fts_content ON search_index USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_search_index_fts_searchable ON search_index USING gin(to_tsvector('english', searchable_text));
CREATE INDEX IF NOT EXISTS idx_search_index_trgm_title ON search_index USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_search_index_trgm_content ON search_index USING gin(content gin_trgm_ops);

-- Search history with proper UUID types
CREATE TABLE search_history (
  id                BIGSERIAL PRIMARY KEY,
  user_id           UUID NOT NULL,
  org_id            UUID NOT NULL,
  query             VARCHAR(500) NOT NULL,
  filters           JSONB DEFAULT '{}',
  result_count      INTEGER DEFAULT 0,
  clicked_result_id BIGINT,
  clicked_entity_type VARCHAR(50),
  response_time_ms  INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_org ON search_history(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query, created_at DESC);

-- Saved searches with proper UUID types
CREATE TABLE saved_searches (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL,
  org_id        UUID NOT NULL,
  name          VARCHAR(200) NOT NULL,
  query         VARCHAR(500) NOT NULL,
  filters       JSONB DEFAULT '{}',
  is_shared     BOOLEAN DEFAULT FALSE,
  use_count     INTEGER DEFAULT 0,
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_shared ON saved_searches(org_id, is_shared);
CREATE INDEX IF NOT EXISTS idx_saved_searches_popular ON saved_searches(use_count DESC, last_used_at DESC);

-- Search synonyms with proper UUID
CREATE TABLE search_synonyms (
  id        BIGSERIAL PRIMARY KEY,
  term      VARCHAR(200) NOT NULL,
  synonym   VARCHAR(200) NOT NULL,
  org_id    UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (term, synonym, COALESCE(org_id, '00000000-0000-0000-0000-000000000000'))
);

-- Search cache
CREATE TABLE search_cache (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL,
  cache_key   VARCHAR(500) NOT NULL,
  results     JSONB NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_cache_lookup ON search_cache(org_id, cache_key);
