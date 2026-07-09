-- Knowledge Base upgrades: version history, article analytics, rich content

ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS helpful_count INT DEFAULT 0;
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS unhelpful_count INT DEFAULT 0;
ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS kb_article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id BIGINT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  version INT NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kb_versions_article ON kb_article_versions(article_id, version DESC);

CREATE TABLE IF NOT EXISTS kb_article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id BIGINT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  visitor_hash TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kb_views_article ON kb_article_views(article_id, viewed_at DESC);
