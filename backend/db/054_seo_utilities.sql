-- SEO: Rank tracking
CREATE TABLE IF NOT EXISTS seo_tracked_keywords (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keyword     TEXT NOT NULL,
  target_url  TEXT,
  current_rank INTEGER,
  prev_rank   INTEGER,
  best_rank   INTEGER,
  last_checked TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_rank_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id  UUID NOT NULL REFERENCES seo_tracked_keywords(id) ON DELETE CASCADE,
  rank        INTEGER,
  checked_at  TIMESTAMPTZ DEFAULT NOW()
);

-- SEO: Audits
CREATE TABLE IF NOT EXISTS seo_audits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  score       INTEGER,
  results     JSONB DEFAULT '{}',
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- SEO: Backlink monitoring
CREATE TABLE IF NOT EXISTS seo_backlink_domains (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain        TEXT NOT NULL,
  total_backlinks INTEGER DEFAULT 0,
  last_checked  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, domain)
);

CREATE TABLE IF NOT EXISTS seo_backlinks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id   UUID NOT NULL REFERENCES seo_backlink_domains(id) ON DELETE CASCADE,
  source_url  TEXT NOT NULL,
  anchor_text TEXT,
  link_type   TEXT DEFAULT 'dofollow',
  domain_authority INTEGER,
  status      TEXT DEFAULT 'active',
  first_seen  TIMESTAMPTZ DEFAULT NOW()
);
