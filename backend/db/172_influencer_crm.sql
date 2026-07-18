-- Migration 172: Influencer/Partner CRM
-- Benchmark: GRIN / Aspire
-- Created: 2026-07-18

-- 1. Influencers (core profiles)
CREATE TABLE IF NOT EXISTS influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  bio TEXT,
  profile_image_url TEXT,
  tier VARCHAR(20) CHECK (tier IN ('nano', 'micro', 'macro', 'mega', 'celebrity')),
  niche VARCHAR(100),
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'prospect' CHECK (status IN ('prospect', 'contacted', 'negotiating', 'active', 'inactive', 'blacklisted')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_influencers_org ON influencers(org_id);
CREATE INDEX idx_influencers_status ON influencers(org_id, status);
CREATE INDEX idx_influencers_tier ON influencers(org_id, tier);
CREATE INDEX idx_influencers_favorite ON influencers(org_id, is_favorite) WHERE is_favorite = TRUE;

-- 2. Social accounts
CREATE TABLE IF NOT EXISTS influencer_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin', 'pinterest', 'twitch')),
  handle VARCHAR(255) NOT NULL,
  profile_url TEXT,
  followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  avg_likes INTEGER,
  avg_comments INTEGER,
  avg_views INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_accounts_influencer ON influencer_social_accounts(influencer_id);
CREATE INDEX idx_social_accounts_platform ON influencer_social_accounts(platform);
CREATE UNIQUE INDEX idx_social_accounts_unique ON influencer_social_accounts(influencer_id, platform, handle);

-- 3. Campaigns
CREATE TABLE IF NOT EXISTS influencer_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2),
  status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  goals TEXT,
  target_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_influencer_campaigns_org ON influencer_campaigns(org_id);
CREATE INDEX idx_influencer_campaigns_status ON influencer_campaigns(org_id, status);

-- 4. Campaign assignments
CREATE TABLE IF NOT EXISTS influencer_campaign_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES influencer_campaigns(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  compensation_amount DECIMAL(12,2),
  compensation_type VARCHAR(50) CHECK (compensation_type IN ('fixed', 'per_post', 'commission', 'product', 'hybrid')),
  status VARCHAR(50) DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'active', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_assignments_campaign ON influencer_campaign_assignments(campaign_id);
CREATE INDEX idx_campaign_assignments_influencer ON influencer_campaign_assignments(influencer_id);
CREATE UNIQUE INDEX idx_campaign_assignments_unique ON influencer_campaign_assignments(campaign_id, influencer_id);

-- 5. Deliverables
CREATE TABLE IF NOT EXISTS campaign_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES influencer_campaign_assignments(id) ON DELETE CASCADE,
  deliverable_type VARCHAR(50) NOT NULL CHECK (deliverable_type IN ('post', 'story', 'reel', 'video', 'blog', 'tweet', 'live')),
  platform VARCHAR(50) NOT NULL,
  due_date DATE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'published')),
  content_url TEXT,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliverables_assignment ON campaign_deliverables(assignment_id);
CREATE INDEX idx_deliverables_status ON campaign_deliverables(status);

-- 6. Content library
CREATE TABLE IF NOT EXISTS influencer_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES influencer_campaigns(id) ON DELETE SET NULL,
  deliverable_id UUID REFERENCES campaign_deliverables(id) ON DELETE SET NULL,
  content_type VARCHAR(50) NOT NULL,
  platform VARCHAR(50),
  content_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  usage_rights VARCHAR(50) CHECK (usage_rights IN ('exclusive', 'non_exclusive', 'limited', 'perpetual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_influencer_content_org ON influencer_content(org_id);
CREATE INDEX idx_influencer_content_influencer ON influencer_content(influencer_id);
CREATE INDEX idx_influencer_content_campaign ON influencer_content(campaign_id);

-- 7. Contracts
CREATE TABLE IF NOT EXISTS influencer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES influencer_campaigns(id) ON DELETE SET NULL,
  contract_type VARCHAR(50) CHECK (contract_type IN ('one_time', 'ongoing', 'ambassador')),
  start_date DATE,
  end_date DATE,
  terms TEXT,
  compensation_details JSONB DEFAULT '{}'::jsonb,
  signed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'active', 'expired', 'terminated')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_influencer_contracts_org ON influencer_contracts(org_id);
CREATE INDEX idx_influencer_contracts_influencer ON influencer_contracts(influencer_id);
CREATE INDEX idx_influencer_contracts_status ON influencer_contracts(org_id, status);

-- 8. Payments
CREATE TABLE IF NOT EXISTS influencer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES influencer_campaigns(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES influencer_campaign_assignments(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  invoice_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_influencer_payments_org ON influencer_payments(org_id);
CREATE INDEX idx_influencer_payments_influencer ON influencer_payments(influencer_id);
CREATE INDEX idx_influencer_payments_status ON influencer_payments(org_id, status);
CREATE INDEX idx_influencer_payments_due ON influencer_payments(org_id, due_date) WHERE status = 'pending';

-- 9. Communications
CREATE TABLE IF NOT EXISTS influencer_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  communication_type VARCHAR(50) CHECK (communication_type IN ('email', 'call', 'meeting', 'message', 'note')),
  subject VARCHAR(500),
  message TEXT,
  direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_influencer_comms_org ON influencer_communications(org_id);
CREATE INDEX idx_influencer_comms_influencer ON influencer_communications(influencer_id, created_at DESC);

COMMENT ON TABLE influencers IS 'Core influencer/partner profiles';
COMMENT ON TABLE influencer_social_accounts IS 'Social media handles and metrics';
COMMENT ON TABLE influencer_campaigns IS 'Influencer marketing campaigns';
COMMENT ON TABLE influencer_campaign_assignments IS 'Influencer assignments to campaigns';
COMMENT ON TABLE campaign_deliverables IS 'Expected and submitted content deliverables';
COMMENT ON TABLE influencer_content IS 'Content library from influencer collaborations';
COMMENT ON TABLE influencer_contracts IS 'Contract terms and agreements';
COMMENT ON TABLE influencer_payments IS 'Payment tracking and history';
COMMENT ON TABLE influencer_communications IS 'Communication history log';
