-- Gamification Engine — Badges, Achievements, Leaderboards, Streaks, Points
-- Powers the 4 declared gamification modules:
--   Achievement / Badge System
--   Leaderboards
--   Streaks / Habit Tracking
--   Product Tour / Onboarding Checklist Builder

CREATE TABLE IF NOT EXISTS gamification_badge_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  icon_url        TEXT,
  category        TEXT NOT NULL DEFAULT 'general'
                  CHECK (category IN ('general','sales','marketing','crm','pm','education','community','onboarding')),
  criteria_type   TEXT NOT NULL DEFAULT 'count'
                  CHECK (criteria_type IN ('count','sum','streak','milestone','custom')),
  criteria_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- criteria_config examples:
  -- count:  { "action": "deal.won", "threshold": 10 }
  -- sum:    { "field": "deal.amount", "threshold": 100000 }
  -- streak: { "action": "login", "days": 7 }
  -- milestone: { "action": "first_deal" }
  points          INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

CREATE TABLE IF NOT EXISTS gamification_user_badges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id        UUID NOT NULL REFERENCES gamification_badge_definitions(id) ON DELETE CASCADE,
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  context         JSONB, -- e.g. { "dealId": "...", "amount": 50000 }
  notified        BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS gamification_points (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points          INT NOT NULL DEFAULT 0,
  source          TEXT NOT NULL, -- e.g. 'deal.won', 'task.completed', 'login.streak'
  source_id       TEXT,         -- optional reference ID
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gam_points_user ON gamification_points(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_gam_points_source ON gamification_points(org_id, user_id, source);

CREATE TABLE IF NOT EXISTS gamification_streaks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streak_type     TEXT NOT NULL DEFAULT 'login'
                  CHECK (streak_type IN ('login','daily_task','weekly_goal','custom')),
  current_streak  INT NOT NULL DEFAULT 0,
  longest_streak  INT NOT NULL DEFAULT 0,
  last_activity_date DATE NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id, streak_type)
);

CREATE TABLE IF NOT EXISTS gamification_leaderboards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  metric          TEXT NOT NULL DEFAULT 'points'
                  CHECK (metric IN ('points','deals_won','revenue','tasks_done','streak','custom')),
  period          TEXT NOT NULL DEFAULT 'all_time'
                  CHECK (period IN ('daily','weekly','monthly','quarterly','all_time')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  config          JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

CREATE TABLE IF NOT EXISTS gamification_leaderboard_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id  UUID NOT NULL REFERENCES gamification_leaderboards(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score           NUMERIC(15,2) NOT NULL DEFAULT 0,
  rank            INT,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (leaderboard_id, user_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_gam_leaderboard_entries ON gamification_leaderboard_entries(leaderboard_id, rank);

CREATE TABLE IF NOT EXISTS gamification_onboarding_checklists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  items           JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- items: [ { "id": "create_first_contact", "label": "Create your first contact", "link": "/crm", "optional": false }, ... ]
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

CREATE TABLE IF NOT EXISTS gamification_user_checklist_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checklist_id    UUID NOT NULL REFERENCES gamification_onboarding_checklists(id) ON DELETE CASCADE,
  completed_items TEXT[] NOT NULL DEFAULT '{}',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  UNIQUE (user_id, checklist_id)
);

-- Seed default badges for new orgs
INSERT INTO gamification_badge_definitions (org_id, slug, name, description, category, criteria_type, criteria_config, points, sort_order)
SELECT o.id, b.slug, b.name, b.description, b.category, b.criteria_type, b.criteria_config, b.points, b.sort_order
FROM organizations o
CROSS JOIN (VALUES
  ('first_deal', 'First Deal Closed', 'Close your first deal in the CRM', 'sales', 'milestone', '{"action":"deal.won","threshold":1}'::jsonb, 100, 1),
  ('deal_master', 'Deal Master', 'Close 10 deals', 'sales', 'count', '{"action":"deal.won","threshold":10}'::jsonb, 500, 2),
  ('six_figure', 'Six Figure Deal', 'Close a single deal worth ₦1,000,000+', 'sales', 'sum', '{"action":"deal.amount","threshold":1000000}'::jsonb, 1000, 3),
  ('contact_builder', 'Contact Builder', 'Create 50 contacts', 'crm', 'count', '{"action":"contact.created","threshold":50}'::jsonb, 300, 4),
  ('collaborator', 'Collaborator', 'Complete 20 tasks', 'pm', 'count', '{"action":"task.completed","threshold":20}'::jsonb, 200, 5),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day login streak', 'general', 'streak', '{"action":"login","days":7}'::jsonb, 150, 6),
  ('streak_30', 'Monthly Champion', 'Maintain a 30-day login streak', 'general', 'streak', '{"action":"login","days":30}'::jsonb, 500, 7),
  ('first_invoice', 'Paid Professional', 'Send your first invoice', 'general', 'milestone', '{"action":"invoice.sent","threshold":1}'::jsonb, 100, 8),
  ('team_player', 'Team Player', 'Invite 3 team members', 'general', 'count', '{"action":"team.invited","threshold":3}'::jsonb, 250, 9),
  ('community_starter', 'Community Starter', 'Create a community space', 'community', 'milestone', '{"action":"community.created","threshold":1}'::jsonb, 100, 10)
) AS b(slug, name, description, category, criteria_type, criteria_config, points, sort_order)
ON CONFLICT (org_id, slug) DO NOTHING;

-- Seed default leaderboard
INSERT INTO gamification_leaderboards (org_id, name, slug, metric, period, config)
SELECT o.id, 'Points Leaderboard', 'points', 'points', 'all_time', '{}'::jsonb
FROM organizations o
ON CONFLICT (org_id, slug) DO NOTHING;

-- Seed default onboarding checklist
INSERT INTO gamification_onboarding_checklists (org_id, slug, title, description, items, sort_order)
SELECT o.id, 'getting_started', 'Getting Started', 'Complete these steps to get the most out of DigitPen Hub',
  '[
    {"id":"explore_workspace","label":"Explore your workspace","link":"/","optional":false},
    {"id":"create_contact","label":"Add your first contact","link":"/crm","optional":false},
    {"id":"create_deal","label":"Create your first deal","link":"/pipeline-deals","optional":false},
    {"id":"invite_team","label":"Invite team members","link":"/team","optional":true},
    {"id":"customize_brand","label":"Customize your brand kit","link":"/brand-kit","optional":true}
  ]'::jsonb, 1
FROM organizations o
ON CONFLICT (org_id, slug) DO NOTHING;
