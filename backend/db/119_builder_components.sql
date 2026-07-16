-- Website Builder: Components Library
-- Reusable UI components (buttons, cards, forms, navigation, etc.)

CREATE TABLE builder_components (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  category        TEXT        NOT NULL, -- button, card, form, navigation, etc.
  is_global       BOOLEAN     NOT NULL DEFAULT false, -- Global components available to all orgs
  
  -- Component structure and styling
  component_data  JSONB       NOT NULL DEFAULT '{}', -- Full component definition
  
  -- Preview
  thumbnail_url   TEXT,
  preview_html    TEXT,
  
  -- Variants (e.g., primary, secondary, outline for buttons)
  variants        JSONB       DEFAULT '[]',
  
  -- Tags for searchability
  tags            TEXT[]      DEFAULT '{}',
  
  -- Usage tracking
  usage_count     INTEGER     NOT NULL DEFAULT 0,
  
  -- Version control
  version         INTEGER     NOT NULL DEFAULT 1,
  
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX builder_components_org_idx ON builder_components (org_id) WHERE org_id IS NOT NULL;
CREATE INDEX builder_components_global_idx ON builder_components (is_global) WHERE is_global = true;
CREATE INDEX builder_components_category_idx ON builder_components (category);
CREATE INDEX builder_components_tags_idx ON builder_components USING gin(tags);

-- Insert default global components
INSERT INTO builder_components (name, description, category, is_global, component_data) VALUES 
('Primary Button', 'Standard primary action button', 'button', true, '{"type":"button","variant":"primary","size":"md"}'),
('Secondary Button', 'Secondary action button', 'button', true, '{"type":"button","variant":"secondary","size":"md"}'),
('Outline Button', 'Outlined button style', 'button', true, '{"type":"button","variant":"outline","size":"md"}'),
('Basic Card', 'Simple card container', 'card', true, '{"type":"card","padding":"md","shadow":"md","radius":"lg"}'),
('Feature Card', 'Card with icon and description', 'card', true, '{"type":"card","hasIcon":true,"hasTitle":true,"hasDescription":true}'),
('Text Input', 'Standard text input field', 'form', true, '{"type":"input","inputType":"text","size":"md"}'),
('Textarea', 'Multi-line text input', 'form', true, '{"type":"textarea","rows":4}'),
('Select Dropdown', 'Dropdown select field', 'form', true, '{"type":"select","size":"md"}');
