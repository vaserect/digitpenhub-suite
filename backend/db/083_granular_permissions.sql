-- Granular Role-Based Permissions
-- Replaces the hardcoded owner/admin/member enum with a flexible system of
-- role definitions + permission scopes per module. Migrates existing rows
-- to the new schema idempotently.

-- ── Role definitions ──────────────────────────────────────────────────────────
-- Each org defines its own roles. Built-in roles (owner, admin, member) are
-- pre-seeded. Custom roles have is_system=false.
CREATE TABLE IF NOT EXISTS role_definitions (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name    TEXT NOT NULL,                     -- e.g. "Manager", "Viewer", "Custom Role"
  slug    TEXT NOT NULL,                      -- e.g. "manager", "viewer"
  is_system BOOLEAN NOT NULL DEFAULT false,   -- true for owner/admin/member
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

-- ── Permission scopes ─────────────────────────────────────────────────────────
-- Defines what a role can do within a specific module. Each row is a single
-- permission grant. If no row exists for a (role_id, module_slug) pair, the
-- role has no access to that module at all.
--   scope: 'none' | 'view' | 'create' | 'edit' | 'delete' | 'manage'
--   record_scope: 'own' | 'team' | 'all'
CREATE TABLE IF NOT EXISTS role_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID NOT NULL REFERENCES role_definitions(id) ON DELETE CASCADE,
  module_slug   TEXT NOT NULL,               -- matches modules.slug
  scope         TEXT NOT NULL DEFAULT 'none'
                CHECK (scope IN ('none','view','create','edit','delete','manage')),
  record_scope  TEXT NOT NULL DEFAULT 'own'
                CHECK (record_scope IN ('own','team','all')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role_id, module_slug)
);
CREATE INDEX IF NOT EXISTS idx_role_perms_role ON role_permissions(role_id);

-- ── Record-level overrides ────────────────────────────────────────────────────
-- For per-record ACLs (e.g. "User A can edit Invoice X but not Invoice Y").
-- resource_type + resource_id identify the record. If this table is empty,
-- all records follow the role_permissions scope.
CREATE TABLE IF NOT EXISTS record_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,               -- e.g. 'invoice', 'contact', 'project'
  resource_id   UUID NOT NULL,
  scope         TEXT NOT NULL DEFAULT 'view'
                CHECK (scope IN ('view','edit','delete','manage')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_type, resource_id)
);
CREATE INDEX IF NOT EXISTS idx_record_perms_resource ON record_permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_record_perms_user ON record_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_record_perms_org ON record_permissions(org_id);

-- ── Migrate existing user roles ──────────────────────────────────────────────
-- For each existing org, ensure the three built-in roles exist, and link
-- existing users to their role_definitions row via a new role_id column.
DO $$
DECLARE
  org RECORD;
  builtin_role_id UUID;
BEGIN
  -- Add role_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='role_id') THEN
    ALTER TABLE users ADD COLUMN role_id UUID REFERENCES role_definitions(id) ON DELETE SET NULL;
  END IF;

  -- Drop the old role column constraint — we'll keep the column for backward
  -- compatibility but the new system uses role_id.
  -- (Keep the column so old code doesn't crash, but it's no longer authoritative.)

  -- Ensure built-in roles exist for every org
  FOR org IN SELECT id FROM organizations LOOP
    -- Owner role
    INSERT INTO role_definitions (org_id, name, slug, is_system, sort_order)
    VALUES (org.id, 'Owner', 'owner', true, 0)
    ON CONFLICT (org_id, slug) DO NOTHING
    RETURNING id INTO builtin_role_id;

    -- Admin role
    INSERT INTO role_definitions (org_id, name, slug, is_system, sort_order)
    VALUES (org.id, 'Admin', 'admin', true, 1)
    ON CONFLICT (org_id, slug) DO NOTHING;

    -- Member role
    INSERT INTO role_definitions (org_id, name, slug, is_system, sort_order)
    VALUES (org.id, 'Member', 'member', true, 2)
    ON CONFLICT (org_id, slug) DO NOTHING;
  END LOOP;
END $$;

-- Grant full access (manage scope, all records) to Owner and Admin roles
-- for all existing modules.
INSERT INTO role_permissions (role_id, module_slug, scope, record_scope)
SELECT rd.id, m.slug, 'manage', 'all'
FROM role_definitions rd
CROSS JOIN modules m
WHERE rd.slug IN ('owner', 'admin')
  AND rd.is_system = true
ON CONFLICT (role_id, module_slug) DO NOTHING;

-- Grant view-only access to Member role for all existing modules
INSERT INTO role_permissions (role_id, module_slug, scope, record_scope)
SELECT rd.id, m.slug, 'view', 'own'
FROM role_definitions rd
CROSS JOIN modules m
WHERE rd.slug = 'member'
  AND rd.is_system = true
ON CONFLICT (role_id, module_slug) DO NOTHING;

-- Backfill role_id for existing users
-- Backfill role_id for existing users
UPDATE users u SET role_id = rd.id
FROM role_definitions rd
WHERE rd.org_id = u.org_id
  AND rd.slug = (u.role)::text
  AND u.role_id IS NULL;
