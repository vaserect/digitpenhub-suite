-- Migration 171: Content Calendar Expansion
-- Benchmark: CoSchedule / Loomly
-- Created: 2026-07-18

-- 1. Content campaigns (create first - referenced by content_items)
CREATE TABLE IF NOT EXISTS content_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6',
  start_date DATE,
  end_date DATE,
  goals TEXT,
  budget DECIMAL(12,2),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_campaigns_org ON content_campaigns(org_id);
CREATE INDEX idx_content_campaigns_status ON content_campaigns(org_id, status);

-- 2. Content items (main content planning table)
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES content_campaigns(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('blog', 'social_facebook', 'social_twitter', 'social_linkedin', 'social_instagram', 'email', 'video', 'podcast', 'infographic', 'ebook', 'webinar', 'press_release', 'other')),
  channel VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('idea', 'draft', 'in_review', 'approved', 'scheduled', 'published', 'archived')),
  content_body TEXT,
  excerpt TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  seo_title VARCHAR(255),
  seo_description TEXT,
  keywords TEXT[],
  hashtags TEXT[],
  target_url TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  published_by UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_items_org ON content_items(org_id);
CREATE INDEX idx_content_items_campaign ON content_items(campaign_id);
CREATE INDEX idx_content_items_status ON content_items(org_id, status);
CREATE INDEX idx_content_items_scheduled ON content_items(org_id, scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_content_items_assigned ON content_items(assigned_to) WHERE assigned_to IS NOT NULL;

-- 3. Content templates
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  template_body TEXT NOT NULL,
  default_hashtags TEXT[],
  default_settings JSONB DEFAULT '{}'::jsonb,
  is_shared BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_templates_org ON content_templates(org_id);
CREATE INDEX idx_content_templates_type ON content_templates(org_id, content_type);

-- 4. Content approvals
CREATE TABLE IF NOT EXISTS content_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_approvals_content ON content_approvals(content_id);
CREATE INDEX idx_content_approvals_approver ON content_approvals(approver_id, status);

-- 5. Content comments
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  mentions UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_comments_content ON content_comments(content_id, created_at DESC);
CREATE INDEX idx_content_comments_user ON content_comments(user_id);

-- 6. Publishing connections
CREATE TABLE IF NOT EXISTS publishing_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'instagram', 'wordpress', 'medium', 'mailchimp', 'youtube', 'tiktok', 'pinterest')),
  account_name VARCHAR(255),
  credentials_encrypted TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'expired')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_publishing_connections_org ON publishing_connections(org_id);
CREATE INDEX idx_publishing_connections_platform ON publishing_connections(org_id, platform);
CREATE UNIQUE INDEX idx_publishing_connections_unique ON publishing_connections(org_id, platform, account_name);

-- Comments
COMMENT ON TABLE content_campaigns IS 'Marketing campaigns grouping related content';
COMMENT ON TABLE content_items IS 'Content planning and scheduling for multi-channel publishing';
COMMENT ON TABLE content_templates IS 'Reusable content templates';
COMMENT ON TABLE content_approvals IS 'Content approval workflow tracking';
COMMENT ON TABLE content_comments IS 'Team collaboration comments on content';
COMMENT ON TABLE publishing_connections IS 'Social media and platform publishing credentials';
