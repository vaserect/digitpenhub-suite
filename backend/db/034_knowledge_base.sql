CREATE TABLE kb_categories (
  id         BIGSERIAL PRIMARY KEY,
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '📄',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kb_articles (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES kb_categories(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft')),
  views       INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
