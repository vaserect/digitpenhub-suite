-- Membership / Community Platform Database Schema
-- Module 33 of 40 in Marketing Category
-- Benchmark: Circle / Mighty Networks

-- Community spaces (forums/groups)
CREATE TABLE IF NOT EXISTS community_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  cover_image_url TEXT,
  space_type TEXT NOT NULL DEFAULT 'public' CHECK (space_type IN ('public', 'private', 'secret')),
  is_active BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

CREATE INDEX IF NOT EXISTS community_spaces_org_id_idx ON community_spaces(org_id);
CREATE INDEX IF NOT EXISTS community_spaces_space_type_idx ON community_spaces(space_type);
CREATE INDEX IF NOT EXISTS community_spaces_is_active_idx ON community_spaces(is_active);

-- Space members
CREATE TABLE IF NOT EXISTS community_space_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES community_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_space_members_space_id_idx ON community_space_members(space_id);
CREATE INDEX IF NOT EXISTS community_space_members_user_id_idx ON community_space_members(user_id);

-- Discussion posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES community_spaces(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question', 'announcement', 'poll')),
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  tags TEXT[],
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS community_posts_space_id_idx ON community_posts(space_id);
CREATE INDEX IF NOT EXISTS community_posts_author_id_idx ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS community_posts_post_type_idx ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS community_posts_created_at_idx ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_last_activity_at_idx ON community_posts(last_activity_at DESC);

-- Comments/replies
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  is_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS community_comments_post_id_idx ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS community_comments_parent_id_idx ON community_comments(parent_id);
CREATE INDEX IF NOT EXISTS community_comments_author_id_idx ON community_comments(author_id);

-- Member profiles
CREATE TABLE IF NOT EXISTS community_member_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  badges JSONB DEFAULT '[]'::jsonb,
  reputation_score INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_member_profiles_org_id_idx ON community_member_profiles(org_id);
CREATE INDEX IF NOT EXISTS community_member_profiles_user_id_idx ON community_member_profiles(user_id);

-- Events
CREATE TABLE IF NOT EXISTS community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  space_id UUID REFERENCES community_spaces(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'online' CHECK (event_type IN ('online', 'in_person', 'hybrid')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'UTC',
  location TEXT,
  meeting_url TEXT,
  cover_image_url TEXT,
  max_attendees INTEGER,
  attendee_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS community_events_org_id_idx ON community_events(org_id);
CREATE INDEX IF NOT EXISTS community_events_space_id_idx ON community_events(space_id);
CREATE INDEX IF NOT EXISTS community_events_start_time_idx ON community_events(start_time);

-- Event attendees
CREATE TABLE IF NOT EXISTS community_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_event_attendees_event_id_idx ON community_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS community_event_attendees_user_id_idx ON community_event_attendees(user_id);

-- Member tiers/roles
CREATE TABLE IF NOT EXISTS community_member_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  badge_icon TEXT,
  badge_color TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS community_member_tiers_org_id_idx ON community_member_tiers(org_id);

-- Member tier assignments
CREATE TABLE IF NOT EXISTS community_member_tier_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES community_member_tiers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, tier_id)
);

CREATE INDEX IF NOT EXISTS community_member_tier_assignments_user_id_idx ON community_member_tier_assignments(user_id);
CREATE INDEX IF NOT EXISTS community_member_tier_assignments_tier_id_idx ON community_member_tier_assignments(tier_id);

-- Likes/reactions
CREATE TABLE IF NOT EXISTS community_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'celebrate', 'insightful')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS community_reactions_target_idx ON community_reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS community_reactions_user_id_idx ON community_reactions(user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS community_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS community_notifications_user_id_idx ON community_notifications(user_id);
CREATE INDEX IF NOT EXISTS community_notifications_is_read_idx ON community_notifications(is_read);
CREATE INDEX IF NOT EXISTS community_notifications_created_at_idx ON community_notifications(created_at DESC);

-- Activity feed
CREATE TABLE IF NOT EXISTS community_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  space_id UUID REFERENCES community_spaces(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS community_activity_feed_org_id_idx ON community_activity_feed(org_id);
CREATE INDEX IF NOT EXISTS community_activity_feed_space_id_idx ON community_activity_feed(space_id);
CREATE INDEX IF NOT EXISTS community_activity_feed_created_at_idx ON community_activity_feed(created_at DESC);
