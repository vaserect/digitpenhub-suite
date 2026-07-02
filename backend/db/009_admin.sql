-- Milestone 10: Admin Super Panel

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- Mark platform owner as super admin
UPDATE users SET is_super_admin = true WHERE email = 'sasere@digitpenhub.com';
