-- =====================================================
-- Module 20: Digital Business Cards - Enterprise Upgrade
-- Version: 2.0.0
-- Description: Advanced digital business card platform with
--              NFC support, analytics, templates, QR codes,
--              contact management, and team collaboration
-- Benchmark: HiHello, Linktree, Taplink, Blinq
-- =====================================================

-- =====================================================
-- DROP EXISTING TABLES (Clean slate)
-- =====================================================

DROP TABLE IF EXISTS card_media CASCADE;
DROP TABLE IF EXISTS card_testimonials CASCADE;
DROP TABLE IF EXISTS card_products CASCADE;
DROP TABLE IF EXISTS card_appointments CASCADE;
DROP TABLE IF EXISTS card_appointment_slots CASCADE;
DROP TABLE IF EXISTS card_integrations CASCADE;
DROP TABLE IF EXISTS card_folder_items CASCADE;
DROP TABLE IF EXISTS card_folders CASCADE;
DROP TABLE IF EXISTS card_shares CASCADE;
DROP TABLE IF EXISTS card_team_members CASCADE;
DROP TABLE IF EXISTS card_teams CASCADE;
DROP TABLE IF EXISTS card_lead_submissions CASCADE;
DROP TABLE IF EXISTS card_lead_forms CASCADE;
DROP TABLE IF EXISTS card_contacts CASCADE;
DROP TABLE IF EXISTS card_analytics_daily CASCADE;
DROP TABLE IF EXISTS card_view_events CASCADE;
DROP TABLE IF EXISTS card_links CASCADE;
DROP TABLE IF EXISTS card_sections CASCADE;
DROP TABLE IF EXISTS card_templates CASCADE;
DROP TABLE IF EXISTS bio_links CASCADE;
DROP TABLE IF EXISTS link_in_bio_pages CASCADE;
DROP TABLE IF EXISTS digital_business_cards CASCADE;

-- =====================================================
-- 1. CARD TEMPLATES (No dependencies)
-- =====================================================

CREATE TABLE card_templates (
  id                BIGSERIAL PRIMARY KEY,
  org_id            UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name              TEXT NOT NULL,
  description       TEXT,
  category          TEXT,
  
  is_global         BOOLEAN DEFAULT FALSE,
  is_premium        BOOLEAN DEFAULT FALSE,
  
  preview_url       TEXT,
  thumbnail_url     TEXT,
  
  layout_config     JSONB NOT NULL,
  color_scheme      JSONB,
  
  usage_count       INT DEFAULT 0,
  rating            NUMERIC(3,2) DEFAULT 0,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CORE BUSINESS CARDS TABLE
-- =====================================================

CREATE TABLE digital_business_cards (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Information
  name              TEXT NOT NULL,
  title             TEXT,
  company           TEXT,
  department        TEXT,
  
  -- Contact Information
  email             TEXT,
  phone             TEXT,
  mobile            TEXT,
  fax               TEXT,
  website           TEXT,
  
  -- Social Media
  linkedin          TEXT,
  twitter           TEXT,
  facebook          TEXT,
  instagram         TEXT,
  youtube           TEXT,
  tiktok            TEXT,
  github            TEXT,
  behance           TEXT,
  dribbble          TEXT,
  
  -- Location
  address           TEXT,
  city              TEXT,
  state             TEXT,
  country           TEXT,
  postal_code       TEXT,
  timezone          TEXT,
  
  -- Professional
  bio               TEXT,
  tagline           TEXT,
  skills            TEXT[],
  languages         TEXT[],
  certifications    TEXT[],
  
  -- Media
  avatar_url        TEXT,
  cover_image_url   TEXT,
  logo_url          TEXT,
  video_url         TEXT,
  
  -- Design & Branding
  template_id       BIGINT REFERENCES card_templates(id) ON DELETE SET NULL,
  theme             TEXT DEFAULT 'modern',
  primary_color     TEXT DEFAULT '#2563eb',
  secondary_color   TEXT DEFAULT '#1e40af',
  background_color  TEXT DEFAULT '#ffffff',
  text_color        TEXT DEFAULT '#1f2937',
  font_family       TEXT DEFAULT 'Inter',
  
  -- Layout
  layout_style      TEXT DEFAULT 'standard' CHECK (layout_style IN ('standard','minimal','creative','corporate','modern')),
  show_avatar       BOOLEAN DEFAULT TRUE,
  show_cover        BOOLEAN DEFAULT TRUE,
  show_social       BOOLEAN DEFAULT TRUE,
  show_qr           BOOLEAN DEFAULT TRUE,
  
  -- QR Code
  qr_code_url       TEXT,
  qr_code_style     TEXT DEFAULT 'standard',
  qr_code_color     TEXT DEFAULT '#000000',
  
  -- NFC
  nfc_enabled       BOOLEAN DEFAULT FALSE,
  nfc_tag_id        TEXT,
  nfc_write_count   INT DEFAULT 0,
  
  -- Sharing
  slug              TEXT UNIQUE,
  share_token       TEXT UNIQUE,
  is_public         BOOLEAN DEFAULT TRUE,
  password_protected BOOLEAN DEFAULT FALSE,
  password_hash     TEXT,
  
  -- Analytics
  total_views       BIGINT DEFAULT 0,
  unique_views      BIGINT DEFAULT 0,
  total_shares      INT DEFAULT 0,
  total_saves       INT DEFAULT 0,
  last_viewed_at    TIMESTAMPTZ,
  
  -- Contact Actions
  email_clicks      INT DEFAULT 0,
  phone_clicks      INT DEFAULT 0,
  website_clicks    INT DEFAULT 0,
  social_clicks     INT DEFAULT 0,
  vcf_downloads     INT DEFAULT 0,
  
  -- Status
  status            TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','archived','draft')),
  is_featured       BOOLEAN DEFAULT FALSE,
  
  -- SEO
  meta_title        TEXT,
  meta_description  TEXT,
  meta_keywords     TEXT[],
  
  -- Custom Fields
  custom_fields     JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  published_at      TIMESTAMPTZ
);

-- =====================================================
-- 3. CUSTOM SECTIONS & LINKS
-- =====================================================

CREATE TABLE card_sections (
  id                BIGSERIAL PRIMARY KEY,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  
  title             TEXT NOT NULL,
  section_type      TEXT NOT NULL CHECK (section_type IN ('links','gallery','video','text','products','services','testimonials','custom')),
  
  icon              TEXT,
  sort_order        INT DEFAULT 0,
  is_visible        BOOLEAN DEFAULT TRUE,
  
  config            JSONB DEFAULT '{}',
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_links (
  id                BIGSERIAL PRIMARY KEY,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  section_id        BIGINT REFERENCES card_sections(id) ON DELETE CASCADE,
  
  title             TEXT NOT NULL,
  url               TEXT NOT NULL,
  description       TEXT,
  
  icon              TEXT,
  thumbnail_url     TEXT,
  
  link_type         TEXT DEFAULT 'url' CHECK (link_type IN ('url','email','phone','whatsapp','telegram','file','video','calendar')),
  
  sort_order        INT DEFAULT 0,
  is_active         BOOLEAN DEFAULT TRUE,
  
  clicks            INT DEFAULT 0,
  last_clicked_at   TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ANALYTICS & TRACKING
-- =====================================================

CREATE TABLE card_view_events (
  id                BIGSERIAL PRIMARY KEY,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  visitor_id        TEXT NOT NULL,
  session_id        TEXT,
  
  ip_address        INET,
  user_agent        TEXT,
  referer           TEXT,
  
  country           TEXT,
  country_code      TEXT,
  region            TEXT,
  city              TEXT,
  latitude          NUMERIC(10,7),
  longitude         NUMERIC(10,7),
  
  device_type       TEXT,
  device_brand      TEXT,
  os_name           TEXT,
  browser_name      TEXT,
  
  view_source       TEXT,
  
  viewed_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_analytics_daily (
  id                BIGSERIAL PRIMARY KEY,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  
  total_views       INT DEFAULT 0,
  unique_views      INT DEFAULT 0,
  
  email_clicks      INT DEFAULT 0,
  phone_clicks      INT DEFAULT 0,
  website_clicks    INT DEFAULT 0,
  social_clicks     INT DEFAULT 0,
  vcf_downloads     INT DEFAULT 0,
  
  countries         JSONB DEFAULT '{}',
  cities            JSONB DEFAULT '{}',
  devices           JSONB DEFAULT '{}',
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(card_id, date)
);

-- =====================================================
-- 5. CONTACT MANAGEMENT
-- =====================================================

CREATE TABLE card_contacts (
  id                BIGSERIAL PRIMARY KEY,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name              TEXT,
  email             TEXT,
  phone             TEXT,
  company           TEXT,
  
  source            TEXT,
  visitor_id        TEXT,
  
  notes             TEXT,
  tags              TEXT[],
  
  status            TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','archived')),
  
  metadata          JSONB DEFAULT '{}',
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. LEAD CAPTURE FORMS
-- =====================================================

CREATE TABLE card_lead_forms (
  id                BIGSERIAL PRIMARY KEY,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  
  title             TEXT NOT NULL,
  description       TEXT,
  
  fields            JSONB NOT NULL,
  
  is_enabled        BOOLEAN DEFAULT TRUE,
  require_email     BOOLEAN DEFAULT TRUE,
  success_message   TEXT,
  redirect_url      TEXT,
  
  notify_email      TEXT,
  auto_reply        BOOLEAN DEFAULT FALSE,
  auto_reply_message TEXT,
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_lead_submissions (
  id                BIGSERIAL PRIMARY KEY,
  form_id           BIGINT NOT NULL REFERENCES card_lead_forms(id) ON DELETE CASCADE,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  
  data              JSONB NOT NULL,
  
  visitor_id        TEXT,
  ip_address        INET,
  user_agent        TEXT,
  
  status            TEXT DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')),
  
  submitted_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. TEAM CARDS & COLLABORATION
-- =====================================================

CREATE TABLE card_teams (
  id                BIGSERIAL PRIMARY KEY,
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name              TEXT NOT NULL,
  description       TEXT,
  
  logo_url          TEXT,
  primary_color     TEXT,
  
  is_public         BOOLEAN DEFAULT FALSE,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_team_members (
  id                BIGSERIAL PRIMARY KEY,
  team_id           BIGINT NOT NULL REFERENCES card_teams(id) ON DELETE CASCADE,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  
  role              TEXT,
  sort_order        INT DEFAULT 0,
  
  joined_at         TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, card_id)
);

-- =====================================================
-- 8. CARD SHARING & COLLABORATION
-- =====================================================

CREATE TABLE card_shares (
  id                BIGSERIAL PRIMARY KEY,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  shared_by         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with       UUID REFERENCES users(id) ON DELETE CASCADE,
  
  share_type        TEXT NOT NULL CHECK (share_type IN ('view','edit','admin')),
  
  share_email       TEXT,
  share_token       TEXT UNIQUE,
  expires_at        TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. CARD COLLECTIONS & FOLDERS
-- =====================================================

CREATE TABLE card_folders (
  id                BIGSERIAL PRIMARY KEY,
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id         BIGINT REFERENCES card_folders(id) ON DELETE CASCADE,
  
  name              TEXT NOT NULL,
  description       TEXT,
  color             TEXT,
  icon              TEXT,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, parent_id, name)
);

CREATE TABLE card_folder_items (
  id                BIGSERIAL PRIMARY KEY,
  folder_id         BIGINT NOT NULL REFERENCES card_folders(id) ON DELETE CASCADE,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  
  added_at          TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(folder_id, card_id)
);

-- =====================================================
-- 10. INTEGRATIONS
-- =====================================================

CREATE TABLE card_integrations (
  id                BIGSERIAL PRIMARY KEY,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  
  integration_type  TEXT NOT NULL CHECK (integration_type IN ('zapier','mailchimp','hubspot','salesforce','google_analytics','facebook_pixel','calendly','stripe')),
  
  config            JSONB NOT NULL,
  
  is_active         BOOLEAN DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. APPOINTMENTS & SCHEDULING
-- =====================================================

CREATE TABLE card_appointment_slots (
  id                BIGSERIAL PRIMARY KEY,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  
  title             TEXT NOT NULL,
  description       TEXT,
  duration_minutes  INT NOT NULL,
  
  available_days    TEXT[],
  start_time        TIME,
  end_time          TIME,
  
  buffer_minutes    INT DEFAULT 0,
  max_bookings_per_day INT,
  
  is_active         BOOLEAN DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_appointments (
  id                BIGSERIAL PRIMARY KEY,
  slot_id           BIGINT NOT NULL REFERENCES card_appointment_slots(id) ON DELETE CASCADE,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  
  attendee_name     TEXT NOT NULL,
  attendee_email    TEXT NOT NULL,
  attendee_phone    TEXT,
  
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INT NOT NULL,
  
  status            TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','cancelled','completed','no_show')),
  
  notes             TEXT,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. PRODUCTS & SERVICES
-- =====================================================

CREATE TABLE card_products (
  id                BIGSERIAL PRIMARY KEY,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  
  name              TEXT NOT NULL,
  description       TEXT,
  
  price             NUMERIC(12,2),
  currency          TEXT DEFAULT 'USD',
  
  image_url         TEXT,
  purchase_url      TEXT,
  
  is_active         BOOLEAN DEFAULT TRUE,
  sort_order        INT DEFAULT 0,
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 13. TESTIMONIALS & REVIEWS
-- =====================================================

CREATE TABLE card_testimonials (
  id                BIGSERIAL PRIMARY KEY,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  
  author_name       TEXT NOT NULL,
  author_title      TEXT,
  author_company    TEXT,
  author_avatar     TEXT,
  
  content           TEXT NOT NULL,
  rating            INT CHECK (rating >= 1 AND rating <= 5),
  
  is_featured       BOOLEAN DEFAULT FALSE,
  is_visible        BOOLEAN DEFAULT TRUE,
  sort_order        INT DEFAULT 0,
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 14. MEDIA GALLERY
-- =====================================================

CREATE TABLE card_media (
  id                BIGSERIAL PRIMARY KEY,
  card_id           UUID NOT NULL REFERENCES digital_business_cards(id) ON DELETE CASCADE,
  
  media_type        TEXT NOT NULL CHECK (media_type IN ('image','video','document','audio')),
  
  title             TEXT,
  description       TEXT,
  
  file_url          TEXT NOT NULL,
  thumbnail_url     TEXT,
  file_size         INT,
  mime_type         TEXT,
  
  sort_order        INT DEFAULT 0,
  is_visible        BOOLEAN DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 15. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_cards_org_id ON digital_business_cards(org_id);
CREATE INDEX idx_cards_user_id ON digital_business_cards(user_id);
CREATE INDEX idx_cards_slug ON digital_business_cards(slug);
CREATE INDEX idx_cards_status ON digital_business_cards(status);
CREATE INDEX idx_cards_created_at ON digital_business_cards(created_at DESC);
CREATE INDEX idx_cards_template_id ON digital_business_cards(template_id);

CREATE INDEX idx_card_templates_org_id ON card_templates(org_id);
CREATE INDEX idx_card_templates_is_global ON card_templates(is_global);
CREATE INDEX idx_card_templates_category ON card_templates(category);

CREATE INDEX idx_card_sections_card_id ON card_sections(card_id);
CREATE INDEX idx_card_links_card_id ON card_links(card_id);
CREATE INDEX idx_card_links_section_id ON card_links(section_id);

CREATE INDEX idx_card_views_card_id ON card_view_events(card_id);
CREATE INDEX idx_card_views_viewed_at ON card_view_events(viewed_at);
CREATE INDEX idx_card_views_visitor_id ON card_view_events(visitor_id);

CREATE INDEX idx_card_contacts_card_id ON card_contacts(card_id);
CREATE INDEX idx_card_contacts_org_id ON card_contacts(org_id);
CREATE INDEX idx_card_contacts_email ON card_contacts(email);

CREATE INDEX idx_card_folders_org_id ON card_folders(org_id);
CREATE INDEX idx_card_folders_parent_id ON card_folders(parent_id);

CREATE INDEX idx_card_teams_org_id ON card_teams(org_id);

-- =====================================================
-- 16. FUNCTIONS & TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_card_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cards_updated_at
  BEFORE UPDATE ON digital_business_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_card_updated_at();

CREATE TRIGGER card_templates_updated_at
  BEFORE UPDATE ON card_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_card_updated_at();

CREATE TRIGGER card_teams_updated_at
  BEFORE UPDATE ON card_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_card_updated_at();

CREATE TRIGGER card_folders_updated_at
  BEFORE UPDATE ON card_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_card_updated_at();

CREATE OR REPLACE FUNCTION update_card_view_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE digital_business_cards
  SET 
    total_views = total_views + 1,
    last_viewed_at = NEW.viewed_at
  WHERE id = NEW.card_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER card_view_stats_update
  AFTER INSERT ON card_view_events
  FOR EACH ROW
  EXECUTE FUNCTION update_card_view_stats();

CREATE OR REPLACE FUNCTION generate_card_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL THEN
    base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM digital_business_cards WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_card_slug_trigger
  BEFORE INSERT OR UPDATE ON digital_business_cards
  FOR EACH ROW
  EXECUTE FUNCTION generate_card_slug();

-- =====================================================
-- 17. VIEWS FOR COMMON QUERIES
-- =====================================================

CREATE OR REPLACE VIEW card_performance AS
SELECT 
  c.id,
  c.org_id,
  c.name,
  c.title,
  c.company,
  c.status,
  c.total_views,
  c.unique_views,
  c.email_clicks,
  c.phone_clicks,
  c.website_clicks,
  c.vcf_downloads,
  c.created_at,
  c.last_viewed_at,
  COUNT(DISTINCT cv.visitor_id) as unique_visitors_7d,
  COUNT(cv.id) as views_7d,
  COUNT(DISTINCT cc.id) as contacts_count,
  COUNT(DISTINCT cl.id) as links_count
FROM digital_business_cards c
LEFT JOIN card_view_events cv ON c.id = cv.card_id 
  AND cv.viewed_at > NOW() - INTERVAL '7 days'
LEFT JOIN card_contacts cc ON c.id = cc.card_id
LEFT JOIN card_links cl ON c.id = cl.card_id AND cl.is_active = true
GROUP BY c.id;

-- =====================================================
-- 18. SAMPLE DATA & DEFAULTS
-- =====================================================

INSERT INTO card_templates (name, description, category, is_global, layout_config)
VALUES 
  ('Modern Professional', 'Clean and modern design for professionals', 'business', true, '{"layout":"standard","sections":["contact","social","links"]}'),
  ('Creative Portfolio', 'Showcase your creative work', 'creative', true, '{"layout":"creative","sections":["gallery","contact","testimonials"]}'),
  ('Minimal Elegance', 'Simple and elegant design', 'minimal', true, '{"layout":"minimal","sections":["contact","bio"]}'),
  ('Corporate Executive', 'Professional corporate design', 'corporate', true, '{"layout":"corporate","sections":["contact","company","team"]}'),
  ('Entrepreneur', 'Perfect for entrepreneurs and startups', 'business', true, '{"layout":"modern","sections":["contact","products","social"]}');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE digital_business_cards IS 'Enterprise digital business cards - v2.0.0 - HiHello/Linktree benchmark features';
COMMENT ON TABLE card_view_events IS 'Detailed view analytics with geo, device tracking';
COMMENT ON TABLE card_templates IS 'Reusable design templates for business cards';
COMMENT ON TABLE card_contacts IS 'Contact management and lead capture';
COMMENT ON TABLE card_teams IS 'Team collaboration and shared cards';