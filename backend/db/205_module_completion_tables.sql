-- Module Completion: Create missing tables for registered modules
-- that have no database table yet. All follow the standard pattern:
-- id UUID PK, org_id FK, typed columns, created_at.

BEGIN;

-- ── Marketing ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS social_media_scheduler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'twitter',
  post_content TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  media_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  posted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_social_media_scheduler_org ON social_media_scheduler(org_id);

CREATE TABLE IF NOT EXISTS review_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source TEXT,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_review_management_org ON review_management(org_id);

CREATE TABLE IF NOT EXISTS referral_affiliate_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_ngn NUMERIC DEFAULT 0,
  period_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referral_affiliate_analytics_org ON referral_affiliate_analytics(org_id);

CREATE TABLE IF NOT EXISTS landing_page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID,
  page_url TEXT,
  visits INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_scroll_depth NUMERIC DEFAULT 0,
  heatmap_data JSONB DEFAULT '{}',
  period_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_landing_page_analytics_org ON landing_page_analytics(org_id);

CREATE TABLE IF NOT EXISTS influencer_crm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  platform TEXT,
  followers INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_influencer_crm_org ON influencer_crm(org_id);

CREATE TABLE IF NOT EXISTS push_notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT,
  target_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_notification_campaigns_org ON push_notification_campaigns(org_id);

CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customer_segments_org ON customer_segments(org_id);

CREATE TABLE IF NOT EXISTS direct_mail_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  recipient_count INTEGER DEFAULT 0,
  template_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_direct_mail_campaigns_org ON direct_mail_campaigns(org_id);

CREATE TABLE IF NOT EXISTS print_fulfillment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  design_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  tracking_code TEXT,
  delivery_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_print_fulfillment_orders_org ON print_fulfillment_orders(org_id);

CREATE TABLE IF NOT EXISTS ab_testing_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  control_variant TEXT,
  test_variant TEXT,
  metric TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  confidence_level NUMERIC DEFAULT 0,
  winner TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ab_testing_experiments_org ON ab_testing_experiments(org_id);

CREATE TABLE IF NOT EXISTS ugc_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  creator_name TEXT,
  source_url TEXT,
  content_type TEXT NOT NULL DEFAULT 'image',
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ugc_content_org ON ugc_content(org_id);

-- ── Education ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS edu_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id UUID,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  instructor TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_edu_schedule_org ON edu_schedule(org_id);

CREATE TABLE IF NOT EXISTS edu_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id UUID,
  title TEXT NOT NULL,
  author_name TEXT,
  body TEXT,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_edu_discussions_org ON edu_discussions(org_id);

CREATE TABLE IF NOT EXISTS edu_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id UUID,
  course_id UUID,
  score NUMERIC,
  max_score NUMERIC,
  grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_edu_grades_org ON edu_grades(org_id);

CREATE TABLE IF NOT EXISTS edu_plagiarism (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  submission_id UUID,
  content_hash TEXT,
  similarity_score NUMERIC DEFAULT 0,
  matched_sources JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_edu_plagiarism_org ON edu_plagiarism(org_id);

-- ── Commerce ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos_inventory_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pos_session_id UUID,
  product_id UUID,
  quantity INTEGER NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos_inventory_sync_org ON pos_inventory_sync(org_id);

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_org ON product_reviews(org_id);

CREATE TABLE IF NOT EXISTS warranty_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  serial_number TEXT,
  purchaser_name TEXT,
  purchaser_email TEXT,
  purchase_date DATE,
  warranty_months INTEGER DEFAULT 12,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_org ON warranty_registrations(org_id);

COMMIT;
