-- Milestone 81: Extend the admin CMS (site_content, from migration 067) to
-- cover the /features and /pricing marketing pages, following the same
-- pattern already proven on the homepage — hero eyebrow/title/subtitle only,
-- not every string on the page. FeaturesPage.jsx and PricingPage.jsx read
-- these with these exact strings as their fallback if a row is ever missing,
-- so a failed fetch (or a not-yet-applied migration) never breaks the page.
INSERT INTO site_content (content_key, content_value, content_type, label, section, sort_order) VALUES
  ('features.hero.eyebrow', 'Features', 'text', 'Hero eyebrow', 'features', 1),
  ('features.hero.title', 'Everything a growing business needs, under one roof.', 'text', 'Hero title', 'features', 2),
  ('features.hero.subtitle', '97 modules, grouped by what you''re actually trying to do — market, sell, manage, and analyze — not by which team built them.', 'html', 'Hero subtitle', 'features', 3),
  ('pricing.hero.eyebrow', 'Pricing', 'text', 'Hero eyebrow', 'pricing', 1),
  ('pricing.hero.title', 'Start on CRM and invoicing for free. Unlock the rest when you''re ready.', 'text', 'Hero title', 'pricing', 2),
  ('pricing.hero.subtitle', 'Free gets you a real CRM and invoicing, no card required. Starter and up unlock all 97 modules — the difference between plans is seats and usage limits, not which tools you''re allowed to touch.', 'html', 'Hero subtitle', 'pricing', 3)
ON CONFLICT (content_key) DO NOTHING;
