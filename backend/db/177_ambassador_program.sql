-- Migration 177: Ambassador Program
-- Module 36 of Marketing Category
-- Benchmark: Brandbassador / GRIN Ambassador

-- Drop amb_ tables if they exist (to support clean rollback/re-run)
DROP TABLE IF EXISTS amb_analytics_daily CASCADE;
DROP TABLE IF EXISTS amb_payouts CASCADE;
DROP TABLE IF EXISTS amb_conversions CASCADE;
DROP TABLE IF EXISTS amb_clicks CASCADE;
DROP TABLE IF EXISTS amb_submissions CASCADE;
DROP TABLE IF EXISTS amb_missions CASCADE;
DROP TABLE IF EXISTS amb_profiles CASCADE;

-- Ambassador Profiles (isolated from legacy tables)
CREATE TABLE amb_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    referral_code VARCHAR(100) NOT NULL UNIQUE,
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'declined')),
    points_balance INTEGER DEFAULT 0,
    total_referrals INTEGER DEFAULT 0,
    rewards_earned NUMERIC(12,2) DEFAULT 0,
    referred_visits_count INTEGER DEFAULT 0,
    social_handles JSONB,
    notes TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_amb_profiles_org_id ON amb_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_amb_profiles_user_id ON amb_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_amb_profiles_contact_id ON amb_profiles(contact_id);
CREATE INDEX IF NOT EXISTS idx_amb_profiles_status ON amb_profiles(status);

-- Ambassador Missions (Campaign Tasks)
CREATE TABLE amb_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    mission_type VARCHAR(50) DEFAULT 'social_post' CHECK (mission_type IN ('social_post', 'content_creation', 'referral', 'feedback', 'other')),
    reward_type VARCHAR(20) DEFAULT 'points' CHECK (reward_type IN ('points', 'cash', 'discount_code', 'gift')),
    reward_value NUMERIC(12,2) DEFAULT 0,
    points_reward INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_amb_missions_org_id ON amb_missions(org_id);
CREATE INDEX IF NOT EXISTS idx_amb_missions_status ON amb_missions(status);

-- Ambassador Mission Submissions (Proof of task completion)
CREATE TABLE amb_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ambassador_id UUID NOT NULL REFERENCES amb_profiles(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES amb_missions(id) ON DELETE CASCADE,
    submission_url TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    rewarded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_amb_submissions_org_id ON amb_submissions(org_id);
CREATE INDEX IF NOT EXISTS idx_amb_submissions_ambassador_id ON amb_submissions(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_amb_submissions_mission_id ON amb_submissions(mission_id);
CREATE INDEX IF NOT EXISTS idx_amb_submissions_status ON amb_submissions(status);

-- Ambassador Click Events (for custom referral links)
CREATE TABLE amb_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambassador_id UUID NOT NULL REFERENCES amb_profiles(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_amb_clicks_ambassador_id ON amb_clicks(ambassador_id);

-- Ambassador Referral Conversions
CREATE TABLE amb_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ambassador_id UUID NOT NULL REFERENCES amb_profiles(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) DEFAULT 0,
    commission_status VARCHAR(20) DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid', 'cancelled')),
    commission_amount NUMERIC(12,2) DEFAULT 0,
    payout_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_amb_conversions_org_id ON amb_conversions(org_id);
CREATE INDEX IF NOT EXISTS idx_amb_conversions_ambassador_id ON amb_conversions(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_amb_conversions_contact_id ON amb_conversions(contact_id);
CREATE INDEX IF NOT EXISTS idx_amb_conversions_commission_status ON amb_conversions(commission_status);

-- Ambassador Payouts
CREATE TABLE amb_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ambassador_id UUID NOT NULL REFERENCES amb_profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payout_method VARCHAR(50) DEFAULT 'bank_transfer',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
    paid_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_amb_payouts_org_id ON amb_payouts(org_id);
CREATE INDEX IF NOT EXISTS idx_amb_payouts_ambassador_id ON amb_payouts(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_amb_payouts_status ON amb_payouts(status);

-- Ambassador Analytics (daily summary)
CREATE TABLE amb_analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ambassador_id UUID REFERENCES amb_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue NUMERIC(12,2) DEFAULT 0,
    commissions NUMERIC(12,2) DEFAULT 0,
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, ambassador_id, date)
);

CREATE INDEX IF NOT EXISTS idx_amb_analytics_daily_org_id ON amb_analytics_daily(org_id);
CREATE INDEX IF NOT EXISTS idx_amb_analytics_daily_ambassador_id ON amb_analytics_daily(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_amb_analytics_daily_date ON amb_analytics_daily(date);

-- Update module status in registry to Live
UPDATE modules SET status = 'live' WHERE slug = 'ambassador-program';

