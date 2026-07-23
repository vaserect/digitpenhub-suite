-- Migration 177: Ambassador Program - Enterprise Implementation
-- Benchmark: Brandbassador / GRIN Ambassador
-- Date: 2026-07-19

-- ============================================================================
-- 1. Ambassador Programs (Multiple programs per organization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ambassador_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  
  -- Application settings
  application_enabled BOOLEAN DEFAULT true,
  auto_approve BOOLEAN DEFAULT false,
  application_questions JSONB DEFAULT '[]',
  
  -- Program rules
  min_age INTEGER,
  min_followers INTEGER,
  allowed_countries TEXT[],
  required_platforms TEXT[],
  
  -- Branding
  logo_url TEXT,
  banner_url TEXT,
  primary_color VARCHAR(7),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(org_id, slug)
);

CREATE INDEX idx_ambassador_programs_org ON ambassador_programs(org_id);
CREATE INDEX idx_ambassador_programs_status ON ambassador_programs(status);

-- ============================================================================
-- 2. Ambassador Tiers (Tier definitions with benefits)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ambassador_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES ambassador_programs(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL, -- 1=lowest, higher=better
  
  -- Requirements
  min_referrals INTEGER DEFAULT 0,
  min_revenue NUMERIC(12,2) DEFAULT 0,
  min_content_pieces INTEGER DEFAULT 0,
  
  -- Benefits
  commission_rate NUMERIC(5,2) DEFAULT 0, -- Percentage
  bonus_per_referral NUMERIC(10,2) DEFAULT 0,
  exclusive_perks TEXT[],
  
  -- Rewards
  welcome_bonus NUMERIC(10,2) DEFAULT 0,
  monthly_bonus NUMERIC(10,2) DEFAULT 0,
  
  -- Display
  badge_icon TEXT,
  badge_color VARCHAR(7),
  description TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(program_id, slug),
  UNIQUE(program_id, level)
);

CREATE INDEX idx_ambassador_tiers_program ON ambassador_tiers(program_id);
CREATE INDEX idx_ambassador_tiers_level ON ambassador_tiers(level);

-- ============================================================================
-- 3. Ambassadors (Enhanced from existing table)
-- ============================================================================
-- Drop existing simple table if it exists
DROP TABLE IF EXISTS ambassadors CASCADE;

CREATE TABLE ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES ambassador_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES ambassador_tiers(id),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'suspended', 'terminated')),
  
  -- Referral tracking
  referral_code VARCHAR(50) NOT NULL UNIQUE,
  custom_link TEXT,
  
  -- Performance metrics
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  total_content_pieces INTEGER DEFAULT 0,
  
  -- Rewards
  points_balance INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  rewards_earned NUMERIC(12,2) DEFAULT 0,
  rewards_paid NUMERIC(12,2) DEFAULT 0,
  pending_payout NUMERIC(12,2) DEFAULT 0,
  
  -- Social profiles
  instagram_handle VARCHAR(255),
  tiktok_handle VARCHAR(255),
  youtube_channel VARCHAR(255),
  twitter_handle VARCHAR(255),
  facebook_profile VARCHAR(255),
  
  -- Demographics
  country VARCHAR(2),
  city VARCHAR(255),
  timezone VARCHAR(100),
  
  -- Dates
  applied_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  
  UNIQUE(org_id, user_id, program_id)
);

CREATE INDEX idx_ambassadors_org ON ambassadors(org_id);
CREATE INDEX idx_ambassadors_program ON ambassadors(program_id);
CREATE INDEX idx_ambassadors_user ON ambassadors(user_id);
CREATE INDEX idx_ambassadors_tier ON ambassadors(tier_id);
CREATE INDEX idx_ambassadors_status ON ambassadors(status);
CREATE INDEX idx_ambassadors_referral_code ON ambassadors(referral_code);

-- ============================================================================
-- 4. Ambassador Applications
-- ============================================================================
CREATE TABLE IF NOT EXISTS ambassador_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES ambassador_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Application data
  answers JSONB NOT NULL DEFAULT '{}',
  social_profiles JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  
  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Dates
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(org_id, program_id, user_id)
);

CREATE INDEX idx_ambassador_applications_org ON ambassador_applications(org_id);
CREATE INDEX idx_ambassador_applications_program ON ambassador_applications(program_id);
CREATE INDEX idx_ambassador_applications_user ON ambassador_applications(user_id);
CREATE INDEX idx_ambassador_applications_status ON ambassador_applications(status);

-- ============================================================================
-- 5. Ambassador Activities (Activity tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ambassador_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type VARCHAR(100) NOT NULL, -- referral, content_submission, campaign_participation, etc.
  activity_data JSONB DEFAULT '{}',
  
  -- Points/rewards
  points_earned INTEGER DEFAULT 0,
  reward_amount NUMERIC(10,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_ambassador_activities_org ON ambassador_activities(org_id);
CREATE INDEX idx_ambassador_activities_ambassador ON ambassador_activities(ambassador_id);
CREATE INDEX idx_ambassador_activities_type ON ambassador_activities(activity_type);
CREATE INDEX idx_ambassador_activities_created ON ambassador_activities(created_at DESC);

-- ============================================================================
-- 6. Ambassador Rewards (Reward history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ambassador_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
  
  -- Reward details
  reward_type VARCHAR(100) NOT NULL, -- commission, bonus, milestone, tier_upgrade, etc.
  description TEXT,
  
  -- Amounts
  points INTEGER DEFAULT 0,
  cash_amount NUMERIC(10,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  
  -- Related entities
  activity_id UUID REFERENCES ambassador_activities(id),
  campaign_id UUID, -- Will reference ambassador_campaigns
  
  -- Dates
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

CREATE INDEX idx_ambassador_rewards_org ON ambassador_rewards(org_id);
CREATE INDEX idx_ambassador_rewards_ambassador ON ambassador_rewards(ambassador_id);
CREATE INDEX idx_ambassador_rewards_type ON ambassador_rewards(reward_type);
CREATE INDEX idx_ambassador_rewards_status ON ambassador_rewards(status);
CREATE INDEX idx_ambassador_rewards_earned ON ambassador_rewards(earned_at DESC);

-- ============================================================================
-- 7. Ambassador Content (Content submissions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ambassador_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
  campaign_id UUID, -- Optional: related campaign
  
  -- Content details
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('photo', 'video', 'testimonial', 'review', 'social_post', 'blog_post', 'other')),
  title VARCHAR(255),
  description TEXT,
  
  -- Media
  media_url TEXT,
  thumbnail_url TEXT,
  external_url TEXT, -- Link to social post, blog, etc.
  
  -- Approval workflow
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Usage rights
  usage_rights_granted BOOLEAN DEFAULT false,
  usage_rights_expiry TIMESTAMPTZ,
  
  -- Performance
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  
  -- Metadata
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  tags TEXT[]
);

CREATE INDEX idx_ambassador_content_org ON ambassador_content(org_id);
CREATE INDEX idx_ambassador_content_ambassador ON ambassador_content(ambassador_id);
CREATE INDEX idx_ambassador_content_campaign ON ambassador_content(campaign_id);
CREATE INDEX idx_ambassador_content_type ON ambassador_content(content_type);
CREATE INDEX idx_ambassador_content_status ON ambassador_content(status);
CREATE INDEX idx_ambassador_content_submitted ON ambassador_content(submitted_at DESC);

-- ============================================================================
-- 8. Ambassador Campaigns
-- ============================================================================
CREATE TABLE IF NOT EXISTS ambassador_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES ambassador_programs(id) ON DELETE CASCADE,
  
  -- Campaign details
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  brief TEXT, -- Campaign brief/guidelines
  
  -- Requirements
  required_content_type VARCHAR(50),
  min_content_pieces INTEGER DEFAULT 1,
  hashtags TEXT[],
  mentions TEXT[],
  
  -- Rewards
  reward_per_piece NUMERIC(10,2) DEFAULT 0,
  bonus_for_completion NUMERIC(10,2) DEFAULT 0,
  points_per_piece INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  
  -- Dates
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  
  UNIQUE(org_id, slug)
);

CREATE INDEX idx_ambassador_campaigns_org ON ambassador_campaigns(org_id);
CREATE INDEX idx_ambassador_campaigns_program ON ambassador_campaigns(program_id);
CREATE INDEX idx_ambassador_campaigns_status ON ambassador_campaigns(status);
CREATE INDEX idx_ambassador_campaigns_dates ON ambassador_campaigns(start_date, end_date);

-- ============================================================================
-- 9. Ambassador Campaign Participants
-- ============================================================================
CREATE TABLE IF NOT EXISTS ambassador_campaign_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ambassador_campaigns(id) ON DELETE CASCADE,
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
  
  -- Participation
  status VARCHAR(50) NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'completed', 'disqualified')),
  
  -- Progress
  content_submitted INTEGER DEFAULT 0,
  content_approved INTEGER DEFAULT 0,
  
  -- Rewards
  rewards_earned NUMERIC(10,2) DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  
  -- Dates
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  UNIQUE(campaign_id, ambassador_id)
);

CREATE INDEX idx_campaign_participants_campaign ON ambassador_campaign_participants(campaign_id);
CREATE INDEX idx_campaign_participants_ambassador ON ambassador_campaign_participants(ambassador_id);
CREATE INDEX idx_campaign_participants_status ON ambassador_campaign_participants(status);

-- ============================================================================
-- 10. Ambassador Payouts
-- ============================================================================
CREATE TABLE IF NOT EXISTS ambassador_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
  
  -- Payout details
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment method
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe', 'check', 'gift_card', 'other')),
  payment_details JSONB DEFAULT '{}', -- Encrypted payment info
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Related rewards
  reward_ids UUID[], -- Array of reward IDs included in this payout
  
  -- Tax info
  tax_form_required BOOLEAN DEFAULT false,
  tax_form_submitted BOOLEAN DEFAULT false,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  
  -- Dates
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  transaction_id TEXT,
  failure_reason TEXT
);

CREATE INDEX idx_ambassador_payouts_org ON ambassador_payouts(org_id);
CREATE INDEX idx_ambassador_payouts_ambassador ON ambassador_payouts(ambassador_id);
CREATE INDEX idx_ambassador_payouts_status ON ambassador_payouts(status);
CREATE INDEX idx_ambassador_payouts_requested ON ambassador_payouts(requested_at DESC);

-- ============================================================================
-- 11. Ambassador Analytics Daily
-- ============================================================================
CREATE TABLE IF NOT EXISTS ambassador_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES ambassador_programs(id) ON DELETE CASCADE,
  ambassador_id UUID REFERENCES ambassadors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Metrics
  new_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  revenue_generated NUMERIC(12,2) DEFAULT 0,
  content_submitted INTEGER DEFAULT 0,
  content_approved INTEGER DEFAULT 0,
  
  -- Engagement
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Rewards
  points_earned INTEGER DEFAULT 0,
  rewards_earned NUMERIC(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(org_id, program_id, ambassador_id, date)
);

CREATE INDEX idx_ambassador_analytics_org ON ambassador_analytics_daily(org_id);
CREATE INDEX idx_ambassador_analytics_program ON ambassador_analytics_daily(program_id);
CREATE INDEX idx_ambassador_analytics_ambassador ON ambassador_analytics_daily(ambassador_id);
CREATE INDEX idx_ambassador_analytics_date ON ambassador_analytics_daily(date DESC);

-- ============================================================================
-- 12. Ambassador Training Materials
-- ============================================================================
CREATE TABLE IF NOT EXISTS ambassador_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES ambassador_programs(id) ON DELETE CASCADE,
  
  -- Training details
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT, -- Markdown or HTML
  
  -- Type
  training_type VARCHAR(50) NOT NULL CHECK (training_type IN ('video', 'article', 'quiz', 'checklist', 'pdf', 'other')),
  media_url TEXT,
  duration_minutes INTEGER,
  
  -- Requirements
  required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Dates
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  
  UNIQUE(org_id, program_id, slug)
);

CREATE INDEX idx_ambassador_training_org ON ambassador_training(org_id);
CREATE INDEX idx_ambassador_training_program ON ambassador_training(program_id);
CREATE INDEX idx_ambassador_training_status ON ambassador_training(status);
CREATE INDEX idx_ambassador_training_order ON ambassador_training(order_index);

-- ============================================================================
-- 13. Ambassador Training Progress
-- ============================================================================
CREATE TABLE IF NOT EXISTS ambassador_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
  training_id UUID NOT NULL REFERENCES ambassador_training(id) ON DELETE CASCADE,
  
  -- Progress
  status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Quiz results (if applicable)
  quiz_score INTEGER,
  quiz_passed BOOLEAN,
  
  -- Dates
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  
  UNIQUE(ambassador_id, training_id)
);

CREATE INDEX idx_training_progress_ambassador ON ambassador_training_progress(ambassador_id);
CREATE INDEX idx_training_progress_training ON ambassador_training_progress(training_id);
CREATE INDEX idx_training_progress_status ON ambassador_training_progress(status);

-- ============================================================================
-- Add foreign key for campaign_id in ambassador_content
-- ============================================================================
ALTER TABLE ambassador_content 
  ADD CONSTRAINT fk_ambassador_content_campaign 
  FOREIGN KEY (campaign_id) REFERENCES ambassador_campaigns(id) ON DELETE SET NULL;

-- ============================================================================
-- Seed default data
-- ============================================================================

-- Note: Seeding will be done via backend service on first program creation
-- to ensure proper org_id and user_id references

COMMENT ON TABLE ambassador_programs IS 'Ambassador program configurations';
COMMENT ON TABLE ambassador_tiers IS 'Tier definitions with benefits and requirements';
COMMENT ON TABLE ambassadors IS 'Ambassador profiles and performance tracking';
COMMENT ON TABLE ambassador_applications IS 'Ambassador program applications';
COMMENT ON TABLE ambassador_activities IS 'Activity tracking for ambassadors';
COMMENT ON TABLE ambassador_rewards IS 'Reward history and payout tracking';
COMMENT ON TABLE ambassador_content IS 'Content submissions from ambassadors';
COMMENT ON TABLE ambassador_campaigns IS 'Campaign definitions and briefs';
COMMENT ON TABLE ambassador_campaign_participants IS 'Campaign participation tracking';
COMMENT ON TABLE ambassador_payouts IS 'Payout processing and history';
COMMENT ON TABLE ambassador_analytics_daily IS 'Daily performance metrics';
COMMENT ON TABLE ambassador_training IS 'Training materials and resources';
COMMENT ON TABLE ambassador_training_progress IS 'Ambassador training completion tracking';
