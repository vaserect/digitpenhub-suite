-- =============================================================
-- Social Media Scheduler — Phase 1: Foundation
-- 
-- Tables: platforms, accounts, workspaces, posts, targets,
--         media assets, folders, publish queue, analytics,
--         inbox messages, approvals, comments, automation rules
-- =============================================================

-- 1. SEED: Supported social platforms
CREATE TABLE IF NOT EXISTS social_platforms (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  icon              TEXT,
  supports_stories  BOOLEAN NOT NULL DEFAULT false,
  supports_reels    BOOLEAN NOT NULL DEFAULT false,
  supports_threads  BOOLEAN NOT NULL DEFAULT false,
  supports_polls    BOOLEAN NOT NULL DEFAULT false,
  max_carousel      INT DEFAULT 10,
  max_video_duration INT,
  max_video_size    INT,
  max_image_count   INT DEFAULT 10,
  character_limit   INT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO social_platforms (name, slug, icon, supports_stories, supports_reels, supports_threads, supports_polls, max_carousel, max_video_duration, character_limit) VALUES
  ('Facebook',      'facebook',   'facebook',  true,  false, false, true,  10, NULL, 63206),
  ('Instagram',     'instagram',  'instagram', true,  true,  false, true,  10, 90,   2200),
  ('X (Twitter)',   'twitter',    'twitter',   false, false, false, true,  4,  140,  40000),
  ('LinkedIn',      'linkedin',   'linkedin',  false, false, false, true,  9,  NULL, 3000),
  ('TikTok',        'tiktok',     'tiktok',    false, true,  false, false, 1,  600,  2200),
  ('YouTube',       'youtube',    'youtube',   false, false, true,  true,  1,  NULL, 5000),
  ('Pinterest',     'pinterest',  'pinterest', false, false, false, true,  10, NULL, 500),
  ('Google Business Profile', 'google-business', 'google', false, false, false, false, 10, NULL, 1500),
  ('Telegram',      'telegram',   'telegram',  false, false, false, true,  10, NULL, 4096),
  ('WhatsApp Business', 'whatsapp-business', 'whatsapp', false, false, false, true,  1,  NULL, 1024)
  ('Bluesky',     'bluesky',    'bluesky',   false, false, false, true,  1,  NULL,  300),
  ('Threads',     'threads',    'threads',   false, false, true,  true,  10, NULL,  500),
ON CONFLICT (slug) DO NOTHING;

-- 2. WORKSPACES (multi-client isolation)
CREATE TABLE IF NOT EXISTS social_workspaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  client_name     TEXT,
  color           TEXT DEFAULT '#2563eb',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_workspaces_org ON social_workspaces(org_id);

-- 3. SOCIAL ACCOUNTS
CREATE TABLE IF NOT EXISTS social_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform_id     UUID NOT NULL REFERENCES social_platforms(id),
  platform_user_id TEXT,
  account_type    TEXT NOT NULL DEFAULT 'profile'
                  CHECK (account_type IN ('profile','page','group','business')),
  account_name    TEXT NOT NULL,
  account_avatar  TEXT,
  access_token    TEXT NOT NULL,
  refresh_token   TEXT,
  token_expires_at TIMESTAMPTZ,
  token_scopes    TEXT[] DEFAULT '{}',
  workspace_id    UUID REFERENCES social_workspaces(id) ON DELETE SET NULL,
  brand_id        UUID,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  health_status   TEXT NOT NULL DEFAULT 'connected'
                  CHECK (health_status IN ('connected','error','expired','revoked')),
  last_checked_at TIMESTAMPTZ,
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, platform_id, platform_user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_org ON social_accounts(org_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_workspace ON social_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_health ON social_accounts(health_status);

-- 4. SOCIAL POSTS (content)
CREATE TABLE IF NOT EXISTS social_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id    UUID REFERENCES social_workspaces(id) ON DELETE SET NULL,
  created_by      UUID NOT NULL REFERENCES users(id),
  content_text    TEXT,
  content_html    TEXT,
  media_ids       UUID[] DEFAULT '{}',
  link_url        TEXT,
  link_preview    JSONB,
  post_type       TEXT NOT NULL DEFAULT 'post'
                  CHECK (post_type IN ('post','story','reel','thread','carousel')),
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','pending_approval','approved','scheduled','publishing','published','failed','archived')),
  is_recurring    BOOLEAN NOT NULL DEFAULT false,
  recurring_config JSONB,
  ai_generated    BOOLEAN NOT NULL DEFAULT false,
  ai_prompt       TEXT,
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_org ON social_posts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_creator ON social_posts(created_by);

-- 5. SOCIAL POST TARGETS (maps posts → platforms)
CREATE TABLE IF NOT EXISTS social_post_targets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform_specific JSONB,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','scheduled','publishing','published','failed')),
  scheduled_at    TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  platform_post_id TEXT,
  platform_post_url TEXT,
  error_message   TEXT,
  retry_count     INT NOT NULL DEFAULT 0,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_targets_schedule ON social_post_targets(scheduled_at, status)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_targets_account ON social_post_targets(account_id);

-- 6. SOCIAL MEDIA ASSETS (media library)
CREATE TABLE IF NOT EXISTS social_media_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL
                  CHECK (type IN ('image','video','gif','audio','document')),
  url             TEXT NOT NULL,
  thumbnail_url   TEXT,
  size            INT,
  width           INT,
  height          INT,
  duration        INT,
  alt_text        TEXT,
  tags            TEXT[] DEFAULT '{}',
  ai_tags         TEXT[] DEFAULT '{}',
  folder_id       UUID,
  is_brand_asset  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_assets_org ON social_media_assets(org_id);

-- 7. SOCIAL ASSET FOLDERS
CREATE TABLE IF NOT EXISTS social_asset_folders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  parent_id       UUID REFERENCES social_asset_folders(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. PUBLISH QUEUE (processed by background worker)
CREATE TABLE IF NOT EXISTS social_publish_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id       UUID NOT NULL REFERENCES social_post_targets(id) ON DELETE CASCADE,
  post_id         UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','processing','published','failed','retrying')),
  scheduled_at    TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  retry_count     INT NOT NULL DEFAULT 0,
  max_retries     INT NOT NULL DEFAULT 3,
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_queue_next
  ON social_publish_queue(scheduled_at, status, retry_count)
  WHERE status IN ('queued', 'retrying');

-- 9. SOCIAL POST ANALYTICS (per-post performance)
CREATE TABLE IF NOT EXISTS social_post_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id       UUID NOT NULL REFERENCES social_post_targets(id) ON DELETE CASCADE,
  post_id         UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  impressions     INT DEFAULT 0,
  reach           INT DEFAULT 0,
  likes           INT DEFAULT 0,
  comments_count  INT DEFAULT 0,
  shares          INT DEFAULT 0,
  saves           INT DEFAULT 0,
  clicks          INT DEFAULT 0,
  video_views     INT DEFAULT 0,
  video_watch_time INT DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  collected_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(target_id, collected_at)
);

-- 10. SOCIAL ACCOUNT ANALYTICS (daily account-level metrics)
CREATE TABLE IF NOT EXISTS social_account_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  followers       INT DEFAULT 0,
  follower_growth INT DEFAULT 0,
  impressions     INT DEFAULT 0,
  reach           INT DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  posts_count     INT DEFAULT 0,
  stories_count   INT DEFAULT 0,
  profile_visits  INT DEFAULT 0,
  data_source     TEXT DEFAULT 'manual',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, date)
);

-- 11. SOCIAL INBOX MESSAGES (unified inbox)
CREATE TABLE IF NOT EXISTS social_inbox_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform_message_id TEXT,
  type            TEXT NOT NULL
                  CHECK (type IN ('comment','direct_message','mention','review')),
  sender_name     TEXT,
  sender_avatar   TEXT,
  sender_platform_id TEXT,
  content         TEXT NOT NULL,
  parent_id       TEXT,
  platform_post_id TEXT,
  platform_post_url TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  is_starred      BOOLEAN NOT NULL DEFAULT false,
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'unread'
                  CHECK (status IN ('unread','read','replied','archived','spam')),
  sentiment       TEXT CHECK (sentiment IN ('positive','neutral','negative')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_inbox_account ON social_inbox_messages(account_id, status);
CREATE INDEX IF NOT EXISTS idx_social_inbox_assignee ON social_inbox_messages(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_social_inbox_org ON social_inbox_messages(org_id, created_at DESC);

-- 12. SOCIAL INBOX REPLIES
CREATE TABLE IF NOT EXISTS social_inbox_replies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID NOT NULL REFERENCES social_inbox_messages(id) ON DELETE CASCADE,
  replied_by      UUID NOT NULL REFERENCES users(id),
  content         TEXT NOT NULL,
  platform_reply_id TEXT,
  ai_generated    BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. APPROVAL REQUESTS (approval workflow)
CREATE TABLE IF NOT EXISTS social_approval_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  requested_by    UUID NOT NULL REFERENCES users(id),
  assigned_to     UUID NOT NULL REFERENCES users(id),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','changes_requested')),
  feedback        TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_approvals_assigned ON social_approval_requests(assigned_to, status);

-- 14. POST COMMENTS (internal collaboration)
CREATE TABLE IF NOT EXISTS social_post_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  content         TEXT NOT NULL,
  parent_id       UUID REFERENCES social_post_comments(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. AUTOMATION RULES
CREATE TABLE IF NOT EXISTS social_automation_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  trigger_type    TEXT NOT NULL,
  trigger_config  JSONB NOT NULL DEFAULT '{}',
  action_type     TEXT NOT NULL,
  action_config   JSONB NOT NULL DEFAULT '{}',
  created_by      UUID NOT NULL REFERENCES users(id),
  execution_count INT NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_automation_org ON social_automation_rules(org_id, is_active);
