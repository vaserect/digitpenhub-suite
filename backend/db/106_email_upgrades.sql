-- Email Marketing upgrades: A/B testing, send-time optimization, spam checking, segment analytics

ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS ab_test_enabled BOOLEAN DEFAULT false;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS ab_test_subject_b TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS ab_test_body_b TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS ab_test_split_pct INT DEFAULT 50 CHECK (ab_test_split_pct >= 10 AND ab_test_split_pct <= 50);
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS ab_test_winner TEXT; -- 'a' or 'b'
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS send_optimization BOOLEAN DEFAULT false;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS spam_score NUMERIC(5,2);
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS spam_issues TEXT[];

CREATE TABLE IF NOT EXISTS email_campaign_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ,
  recipients INT DEFAULT 0,
  opens INT DEFAULT 0,
  unique_opens INT DEFAULT 0,
  clicks INT DEFAULT 0,
  unique_clicks INT DEFAULT 0,
  bounces INT DEFAULT 0,
  complaints INT DEFAULT 0,
  variant TEXT, -- NULL for single, 'a'/'b' for A/B test
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_stats_campaign ON email_campaign_stats(campaign_id);

CREATE TABLE IF NOT EXISTS email_spam_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  issues TEXT[] DEFAULT '{}',
  suggestions TEXT[] DEFAULT '{}',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_spam_campaign ON email_spam_checks(campaign_id);

ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS template_category TEXT;
