-- Cloudflare for SaaS custom hostname tracking, for both white-label
-- domains (org_branding) and page/site custom domains (pages).

ALTER TABLE org_branding ADD COLUMN IF NOT EXISTS custom_hostname_id TEXT;
ALTER TABLE org_branding ADD COLUMN IF NOT EXISTS custom_hostname_status TEXT NOT NULL DEFAULT 'not_started';
-- Possible values: not_started, pending, active, error

ALTER TABLE pages ADD COLUMN IF NOT EXISTS custom_hostname_id TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS custom_hostname_status TEXT NOT NULL DEFAULT 'not_started';
