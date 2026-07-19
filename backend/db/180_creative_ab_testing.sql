-- Migration 180: Creative A/B Testing Studio
-- Module 39 of Marketing Category
-- Benchmark: VWO / Optimizely

-- Drop tables if they exist
DROP TABLE IF EXISTS ab_events_daily CASCADE;
DROP TABLE IF EXISTS ab_variations CASCADE;
DROP TABLE IF EXISTS ab_experiments CASCADE;

-- A/B Experiments Header
CREATE TABLE ab_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
    target_type VARCHAR(50) DEFAULT 'custom' CHECK (target_type IN ('landing_page', 'email', 'cta_button', 'custom')),
    target_url TEXT,
    goal_type VARCHAR(50) DEFAULT 'click' CHECK (goal_type IN ('click', 'pageview', 'form_submit')),
    traffic_split INTEGER DEFAULT 50 CHECK (traffic_split >= 0 AND traffic_split <= 100),
    champion_variation_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ab_experiments_org_id ON ab_experiments(org_id);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_experiments(status);

-- Experiment Variations (A, B, C...)
CREATE TABLE ab_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content_changes JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"headline": "...", "button_color": "..."}
    traffic_weight INTEGER DEFAULT 50 CHECK (traffic_weight >= 0 AND traffic_weight <= 100),
    views INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ab_variations_experiment_id ON ab_variations(experiment_id);

-- Add champion constraint link
ALTER TABLE ab_experiments ADD CONSTRAINT fk_champion_variation FOREIGN KEY (champion_variation_id) REFERENCES ab_variations(id) ON DELETE SET NULL;

-- Daily aggregated analytics for charting
CREATE TABLE ab_events_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variation_id UUID NOT NULL REFERENCES ab_variations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(experiment_id, variation_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ab_events_daily_exp ON ab_events_daily(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_daily_date ON ab_events_daily(date);

-- Update module route in registry
UPDATE modules SET route = '/modules/ab-testing' WHERE slug = 'creative-a-b-testing-studio';
