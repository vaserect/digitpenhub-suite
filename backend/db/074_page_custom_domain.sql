-- Custom domain connection + per-page view analytics for Website/Landing Page Builder

ALTER TABLE pages ADD COLUMN custom_domain TEXT;

CREATE UNIQUE INDEX pages_custom_domain_idx ON pages (custom_domain) WHERE custom_domain IS NOT NULL;

CREATE TABLE page_views (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id      UUID        NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  visitor_hash TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX page_views_page_idx ON page_views (page_id, created_at);
CREATE INDEX page_views_page_visitor_idx ON page_views (page_id, visitor_hash);
