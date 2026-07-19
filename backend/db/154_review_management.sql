-- Review Management Module Schema & Initial Seeds

-- 1. Review Sources (connected integrations like Google, Facebook)
CREATE TABLE IF NOT EXISTS review_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform_slug VARCHAR(100) NOT NULL, -- 'google', 'facebook', 'yelp', 'trustpilot'
  name VARCHAR(255) NOT NULL,
  external_id VARCHAR(255),
  credentials JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'error')),
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (org_id, platform_slug, external_id)
);

-- 2. Business Reviews Feed
CREATE TABLE IF NOT EXISTS business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_id UUID REFERENCES review_sources(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  reviewer_name VARCHAR(255) NOT NULL,
  reviewer_email VARCHAR(255),
  reviewer_avatar VARCHAR(500),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT NOT NULL,
  source_platform VARCHAR(100) NOT NULL DEFAULT 'direct', -- 'direct', 'google', 'facebook', 'yelp', 'trustpilot'
  source_review_id VARCHAR(255),
  reply_content TEXT,
  replied_at TIMESTAMP,
  replied_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'flagged', 'archived')),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 3. Review Request logs
CREATE TABLE IF NOT EXISTS review_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  recipient_value VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms')),
  status VARCHAR(50) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'completed')),
  sent_at TIMESTAMP NOT NULL DEFAULT now(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 4. Review Settings & Gating Configuration
CREATE TABLE IF NOT EXISTS review_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  gating_enabled BOOLEAN NOT NULL DEFAULT true,
  gating_threshold_stars INTEGER NOT NULL DEFAULT 4 CHECK (gating_threshold_stars >= 1 AND gating_threshold_stars <= 5),
  google_review_url VARCHAR(500),
  facebook_review_url VARCHAR(500),
  yelp_review_url VARCHAR(500),
  trustpilot_review_url VARCHAR(500),
  request_email_subject VARCHAR(255) NOT NULL DEFAULT 'How was your experience?',
  request_email_template TEXT NOT NULL DEFAULT 'Hi {{name}},\n\nThank you for choosing us! We would love to hear your feedback. Please take a moment to leave a review:\n\n{{link}}\n\nBest regards,\nThe Team',
  request_sms_template VARCHAR(255) NOT NULL DEFAULT 'Hi {{name}}, how did we do? Please leave us a review here: {{link}}',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Indexes for performant filtering
CREATE INDEX IF NOT EXISTS idx_business_reviews_org ON business_reviews(org_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_rating ON business_reviews(org_id, rating);
CREATE INDEX IF NOT EXISTS idx_business_reviews_platform ON business_reviews(org_id, source_platform);
CREATE INDEX IF NOT EXISTS idx_review_request_logs_org ON review_request_logs(org_id);
