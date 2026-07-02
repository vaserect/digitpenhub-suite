CREATE TABLE IF NOT EXISTS digital_business_cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  title       TEXT,
  company     TEXT,
  email       TEXT,
  phone       TEXT,
  website     TEXT,
  linkedin    TEXT,
  twitter     TEXT,
  instagram   TEXT,
  address     TEXT,
  bio         TEXT,
  avatar_url  TEXT,
  theme       TEXT DEFAULT 'classic',
  accent_color TEXT DEFAULT '#2563eb',
  status      TEXT DEFAULT 'active',
  views       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_in_bio_pages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  bio         TEXT,
  avatar_url  TEXT,
  slug        TEXT NOT NULL,
  bg_color    TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#2563eb',
  status      TEXT DEFAULT 'active',
  views       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

CREATE TABLE IF NOT EXISTS bio_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES link_in_bio_pages(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  icon        TEXT DEFAULT '🔗',
  sort_order  INTEGER DEFAULT 0,
  clicks      INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
