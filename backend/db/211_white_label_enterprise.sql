-- Migration 211: White-label enhancements + enterprise integration scaffolds

-- ── White-label: Add custom CSS/JS, login page customization ──
ALTER TABLE org_branding ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE org_branding ADD COLUMN IF NOT EXISTS custom_js TEXT;
ALTER TABLE org_branding ADD COLUMN IF NOT EXISTS login_page_message TEXT;
ALTER TABLE org_branding ADD COLUMN IF NOT EXISTS login_page_logo_url TEXT;
ALTER TABLE org_branding ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- ── Enterprise integrations registry ──
CREATE TABLE IF NOT EXISTS enterprise_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_enterprise_integrations_org ON enterprise_integrations(org_id, provider);

-- ── AI workflow templates ──
CREATE TABLE IF NOT EXISTS ai_workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    prompt_template TEXT NOT NULL,
    output_schema JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO ai_workflow_templates (name, description, category, prompt_template) VALUES
  ('Social media post', 'Generate a social media post from a brief description', 'marketing', 'Write a {{tone}} social media post for {{platform}} about {{topic}}. Keep it under {{max_length}} characters. Include relevant hashtags.'),
  ('Email follow-up', 'Draft a professional follow-up email', 'sales', 'Write a {{tone}} follow-up email to {{recipient_name}} regarding {{context}}. Mention our last conversation on {{date}} and suggest next steps.'),
  ('Blog outline', 'Create a blog post outline from a topic', 'content', 'Create a detailed blog post outline for the topic "{{topic}}". Include an introduction, 3-5 main sections with key points, and a conclusion. Target audience: {{audience}}.'),
  ('Product description', 'Write a compelling product description', 'commerce', 'Write a {{tone}} product description for {{product_name}}. Key features: {{features}}. Target customer: {{audience}}. Include benefits and a call to action.');
