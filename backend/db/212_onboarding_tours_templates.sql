-- Migration 212: Interactive onboarding tours + template marketplace + collaboration

-- ── Guided tours: reusable multi-step tour definitions ──
CREATE TABLE IF NOT EXISTS tour_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_slug TEXT NOT NULL,
    name TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Per-org tour progress ──
CREATE TABLE IF NOT EXISTS tour_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tour_id UUID NOT NULL REFERENCES tour_definitions(id) ON DELETE CASCADE,
    completed_steps TEXT[] DEFAULT '{}',
    is_completed BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE(org_id, user_id, tour_id)
);

-- ── Template marketplace (module templates, page templates, etc.) ──
CREATE TABLE IF NOT EXISTS marketplace_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    module_slug TEXT,
    preview_url TEXT,
    thumbnail_url TEXT,
    config JSONB DEFAULT '{}',
    is_free BOOLEAN DEFAULT true,
    price_ngn NUMERIC DEFAULT 0,
    author_id UUID REFERENCES users(id),
    download_count INT DEFAULT 0,
    rating_avg NUMERIC DEFAULT 0,
    rating_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_templates_category ON marketplace_templates(category, is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_templates_module ON marketplace_templates(module_slug);

-- ── Collaboration: comments on any record ──
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL,
    record_id UUID NOT NULL,
    body TEXT NOT NULL,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_record ON comments(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_comments_org ON comments(org_id);

-- ── Workflow automation pipeline ──
CREATE TABLE IF NOT EXISTS workflow_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL DEFAULT 'manual',
    trigger_config JSONB DEFAULT '{}',
    steps JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_pipelines_org ON workflow_pipelines(org_id, is_active);

-- ── Seed onboarding tours ──
INSERT INTO tour_definitions (module_slug, name, steps) VALUES
('crm', 'Getting started with CRM',
  '[{"title":"Welcome to CRM","content":"Manage your contacts, deals, and pipeline all in one place.","action":"next"},{"title":"Add a contact","content":"Click \"Add Contact\" to create your first contact record. Include name, email, phone, and company.","action":"next","highlight":"[data-tour=\"add-contact\"]"},{"title":"Create a deal","content":"Move a contact into your pipeline by creating a deal. Set a value, stage, and expected close date.","action":"next","highlight":"[data-tour=\"new-deal\"]"},{"title":"Track activity","content":"Log calls, emails, and meetings against any contact. Your timeline keeps everything in one view.","action":"done"}]'::jsonb),
('invoices', 'Creating your first invoice',
  '[{"title":"Invoices overview","content":"Generate professional invoices, track payments, and manage clients.","action":"next"},{"title":"New invoice","content":"Click \"New Invoice\" and select a client. Add line items with descriptions, quantities, and prices.","action":"next"},{"title":"Send & track","content":"Send invoices directly via email. Track when they are viewed, paid, or overdue.","action":"done"}]'::jsonb);
