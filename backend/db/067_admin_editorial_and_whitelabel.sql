-- Milestone 67: Admin editorial content system, scoped admin roles, and
-- white-label branding/activation.
--
-- Three related systems bundled in one migration since they're all part of
-- "give the platform owner genuine, comprehensive control":
-- 1. site_content — structured, admin-editable content blocks (starting
--    with the marketing homepage, the highest-value surface per the
--    standing prompt's own priority order).
-- 2. is_content_admin — a scoped admin role that can edit content but not
--    touch orgs/users/billing, alongside the existing is_super_admin.
-- 3. org_branding — white-label state per org (logo, colors, domain,
--    sender identity) plus which stage of the guided activation flow
--    they've completed.

CREATE TABLE site_content (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key    TEXT NOT NULL UNIQUE,
  content_value  TEXT NOT NULL DEFAULT '',
  content_type   TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text','html','image_url')),
  label          TEXT NOT NULL,
  section        TEXT NOT NULL DEFAULT 'general',
  sort_order     INTEGER NOT NULL DEFAULT 0,
  updated_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scoped admin role — a content editor can reach /admin and edit
-- site_content, but every other admin route stays behind is_super_admin.
ALTER TABLE users ADD COLUMN is_content_admin BOOLEAN NOT NULL DEFAULT false;

-- White-label branding + guided-activation state, one row per org.
CREATE TABLE org_branding (
  org_id                UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url              TEXT,
  favicon_url           TEXT,
  primary_color         TEXT NOT NULL DEFAULT '#2563eb',
  accent_color           TEXT NOT NULL DEFAULT '#38bdf8',
  display_name          TEXT,
  custom_domain         TEXT,
  custom_domain_verified BOOLEAN NOT NULL DEFAULT false,
  sender_name           TEXT,
  sender_email          TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT false,
  activated_at          TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the marketing homepage's editable blocks with real, improved copy —
-- specific and confident rather than the generic placeholders an audit this
-- pass found (vague "stitching together tools" hyperbole, a bare feature
-- list with no stated problem being solved, a quantity-boast headline).
-- These become the new defaults; MarketingHome.jsx reads from this table
-- with these exact strings as its fallback if a row is ever missing, so a
-- failed fetch never regresses to worse copy than before.
INSERT INTO site_content (content_key, content_value, content_type, label, section, sort_order) VALUES
  ('homepage.hero.eyebrow', 'One login. Every part of your business.', 'text', 'Hero eyebrow', 'homepage', 1),
  ('homepage.hero.title', 'Stop paying for eleven tools that don''t talk to each other.', 'text', 'Hero title', 'homepage', 2),
  ('homepage.hero.subtitle', 'Digitpen Hub replaces your CRM, website builder, email/SMS marketing, invoicing, HR, and analytics stack with one connected suite — so a contact who fills out a form, gets invoiced, and books a call shows up as one person with one history, not three disconnected records in three different apps.', 'html', 'Hero subtitle', 'homepage', 3),
  ('homepage.hero.cta_primary', 'Start free — no card required', 'text', 'Hero primary button', 'homepage', 4),
  ('homepage.value.title', '97 modules. One dataset. Zero busywork stitching them together.', 'text', 'Value section title', 'homepage', 5),
  ('homepage.value.body', 'Every module shares the same contacts, the same billing, and the same login — so automations, reports, and your team''s day-to-day work span the whole business instead of stopping at the edge of one app.', 'html', 'Value section body', 'homepage', 6),
  ('footer.tagline', 'The operations suite for teams who''d rather run their business than manage software subscriptions.', 'text', 'Footer tagline', 'footer', 1)
ON CONFLICT (content_key) DO NOTHING;
