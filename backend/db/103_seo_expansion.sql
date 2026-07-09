-- SEO Module Expansion: Page Speed, Search Console, Bing, Local SEO, AI Optimizer, Auto-Indexing

CREATE TABLE IF NOT EXISTS seo_page_speed_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_url        TEXT NOT NULL,
  lcp             NUMERIC(8,2),               -- Largest Contentful Paint (seconds)
  inp             NUMERIC(8,2),               -- Interaction to Next Paint (ms)
  cls             NUMERIC(8,4),               -- Cumulative Layout Shift
  score           INT,                         -- 0-100 Lighthouse-style
  suggestions     JSONB DEFAULT '[]',          -- prioritized fix list
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_speed_org ON seo_page_speed_results(org_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS seo_search_console (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL DEFAULT 'google' CHECK (provider IN ('google','bing')),
  access_token    TEXT,
  refresh_token   TEXT,
  token_expires_at TIMESTAMPTZ,
  property_url    TEXT,                        -- site URL registered in GSC/Bing
  is_connected    BOOLEAN NOT NULL DEFAULT false,
  last_sync_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gsc_org ON seo_search_console(org_id, provider);

CREATE TABLE IF NOT EXISTS seo_search_queries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL,
  query           TEXT NOT NULL,
  impressions     INT DEFAULT 0,
  clicks          INT DEFAULT 0,
  ctr             NUMERIC(6,4),
  avg_position    NUMERIC(6,2),
  recorded_at     DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX IF NOT EXISTS idx_ssq_org ON seo_search_queries(org_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS seo_auto_indexing_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id         UUID REFERENCES pages(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,               -- 'publish', 'update', 'sitemap_ping'
  provider         TEXT NOT NULL DEFAULT 'google' CHECK (provider IN ('google','bing')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  response        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sail_org ON seo_auto_indexing_log(org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS seo_local_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_name   TEXT NOT NULL,
  address         TEXT,
  phone           TEXT,
  website_url     TEXT,
  google_business_id TEXT,
  categories      TEXT[] DEFAULT '{}',
  is_verified     BOOLEAN DEFAULT false,
  last_checked_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seo_content_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content_id      TEXT NOT NULL,
  content_type    TEXT NOT NULL,               -- 'page', 'blog', 'product'
  content_text    TEXT,
  target_keyword  TEXT,
  readability_score NUMERIC(5,2),
  seo_score       NUMERIC(5,2),
  suggestions     JSONB DEFAULT '[]',
  scored_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing pipeline: add is_indexed flag to pages for tracking
ALTER TABLE pages ADD COLUMN IF NOT EXISTS last_indexed_at TIMESTAMPTZ;
