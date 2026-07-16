-- Website Builder: Sections Library
-- Pre-built page sections (hero, CTA, testimonials, pricing, features, etc.)

CREATE TABLE builder_sections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  category        TEXT        NOT NULL, -- hero, cta, testimonials, pricing, features, etc.
  is_global       BOOLEAN     NOT NULL DEFAULT false, -- Global sections available to all orgs
  
  -- Section structure (array of blocks)
  blocks          JSONB       NOT NULL DEFAULT '[]',
  
  -- Preview
  thumbnail_url   TEXT,
  preview_html    TEXT,
  
  -- Style variant (modern, luxury, minimal, etc.)
  style_variant   TEXT        DEFAULT 'modern',
  
  -- Tags for searchability
  tags            TEXT[]      DEFAULT '{}',
  
  -- Usage tracking
  usage_count     INTEGER     NOT NULL DEFAULT 0,
  
  -- Responsive settings
  responsive_settings JSONB   DEFAULT '{}',
  
  -- Version control
  version         INTEGER     NOT NULL DEFAULT 1,
  
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX builder_sections_org_idx ON builder_sections (org_id) WHERE org_id IS NOT NULL;
CREATE INDEX builder_sections_global_idx ON builder_sections (is_global) WHERE is_global = true;
CREATE INDEX builder_sections_category_idx ON builder_sections (category);
CREATE INDEX builder_sections_style_idx ON builder_sections (style_variant);
CREATE INDEX builder_sections_tags_idx ON builder_sections USING gin(tags);

-- Insert default global sections
INSERT INTO builder_sections (name, description, category, is_global, style_variant, blocks, tags) VALUES 
('Modern Hero', 'Clean hero section with centered content', 'hero', true, 'modern', 
 '[{"type":"hero","heading":"Welcome to Our Platform","subheading":"Build amazing websites with ease","ctaText":"Get Started","ctaUrl":"#","bgColor":"#2563eb","textColor":"#ffffff","align":"center"}]',
 ARRAY['hero', 'landing', 'homepage']),

('Feature Grid 3-Column', 'Three-column feature showcase', 'features', true, 'modern',
 '[{"type":"features","heading":"Why Choose Us?","items":[{"icon":"✓","title":"Fast & Reliable","desc":"Lightning-fast performance"},{"icon":"✓","title":"Secure","desc":"Enterprise-grade security"},{"icon":"✓","title":"Scalable","desc":"Grows with your business"}]}]',
 ARRAY['features', 'benefits', 'services']),

('CTA Banner', 'Call-to-action banner section', 'cta', true, 'modern',
 '[{"type":"cta","heading":"Ready to Get Started?","body":"Join thousands of satisfied customers","buttonText":"Sign Up Now","buttonUrl":"#","bgColor":"#f8fafc"}]',
 ARRAY['cta', 'conversion', 'signup']),

('Testimonials Carousel', 'Customer testimonials slider', 'testimonials', true, 'modern',
 '[{"type":"testimonials","heading":"What Our Clients Say","items":[{"quote":"Excellent service and support!","author":"John Doe","role":"CEO, Company Inc"},{"quote":"Best decision we ever made.","author":"Jane Smith","role":"Marketing Director"}]}]',
 ARRAY['testimonials', 'reviews', 'social-proof']),

('Pricing Table 3-Tier', 'Three-tier pricing comparison', 'pricing', true, 'modern',
 '[{"type":"columns","columns":3,"items":[{"heading":"Starter","body":"$29/mo","imageUrl":""},{"heading":"Professional","body":"$79/mo","imageUrl":""},{"heading":"Enterprise","body":"$199/mo","imageUrl":""}]}]',
 ARRAY['pricing', 'plans', 'subscription']),

('Stats Counter', 'Statistics and numbers showcase', 'stats', true, 'modern',
 '[{"type":"columns","columns":4,"items":[{"heading":"10K+","body":"Active Users"},{"heading":"50K+","body":"Projects"},{"heading":"99.9%","body":"Uptime"},{"heading":"24/7","body":"Support"}]}]',
 ARRAY['stats', 'numbers', 'metrics']),

('FAQ Accordion', 'Frequently asked questions', 'faq', true, 'modern',
 '[{"type":"text","heading":"Frequently Asked Questions","body":"Find answers to common questions"}]',
 ARRAY['faq', 'help', 'support']),

('Contact Form', 'Simple contact form section', 'form', true, 'modern',
 '[{"type":"form","heading":"Get in Touch","subheading":"Send us a message and we will get back to you soon.","formId":""}]',
 ARRAY['contact', 'form', 'lead-generation']),

('Logo Cloud', 'Client/partner logo showcase', 'logos', true, 'modern',
 '[{"type":"text","heading":"Trusted by Leading Companies","body":""}]',
 ARRAY['logos', 'clients', 'partners', 'trust']),

('Team Grid', 'Team members showcase', 'team', true, 'modern',
 '[{"type":"columns","columns":3,"items":[{"heading":"Team Member 1","body":"Position","imageUrl":""},{"heading":"Team Member 2","body":"Position","imageUrl":""},{"heading":"Team Member 3","body":"Position","imageUrl":""}]}]',
 ARRAY['team', 'about', 'people']),

('Video Section', 'Video embed with heading', 'video', true, 'modern',
 '[{"type":"video","heading":"Watch Our Story","url":""}]',
 ARRAY['video', 'media', 'demo']),

('Image Gallery', 'Photo gallery grid', 'gallery', true, 'modern',
 '[{"type":"text","heading":"Our Gallery","body":""}]',
 ARRAY['gallery', 'portfolio', 'images']),

('Newsletter Signup', 'Email newsletter subscription', 'newsletter', true, 'modern',
 '[{"type":"cta","heading":"Subscribe to Our Newsletter","body":"Get the latest updates and offers","buttonText":"Subscribe","buttonUrl":"#","bgColor":"#f8fafc"}]',
 ARRAY['newsletter', 'email', 'subscription']),

('Footer Standard', 'Standard footer with links', 'footer', true, 'modern',
 '[{"type":"footer","logoText":"Your Business","copyright":"© 2026 Your Business. All rights reserved.","links":[{"label":"About","href":"/about"},{"label":"Contact","href":"/contact"},{"label":"Privacy","href":"/privacy"}]}]',
 ARRAY['footer', 'navigation']),

('Navigation Bar', 'Standard navigation header', 'navigation', true, 'modern',
 '[{"type":"nav","logoText":"Your Business","homeHref":"/","links":[{"label":"Features","href":"#features"},{"label":"Pricing","href":"#pricing"},{"label":"About","href":"#about"}],"ctaText":"Get Started","ctaHref":"#signup"}]',
 ARRAY['navigation', 'header', 'menu']);
