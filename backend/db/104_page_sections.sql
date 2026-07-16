-- Create page_sections table for pre-built sections
CREATE TABLE IF NOT EXISTS page_sections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  preview_url VARCHAR(500),
  html_content TEXT NOT NULL,
  css_content TEXT DEFAULT '',
  js_content TEXT DEFAULT '',
  components_used TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_page_sections_category ON page_sections(category);
CREATE INDEX IF NOT EXISTS idx_page_sections_tags ON page_sections USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_page_sections_active ON page_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_page_sections_usage ON page_sections(usage_count DESC);

-- Add comments
COMMENT ON TABLE page_sections IS 'Pre-built page sections combining multiple components';
COMMENT ON COLUMN page_sections.name IS 'Section name/title';
COMMENT ON COLUMN page_sections.description IS 'Brief description of the section';
COMMENT ON COLUMN page_sections.category IS 'Section category (e.g., hero-features, cta-testimonials)';
COMMENT ON COLUMN page_sections.preview_url IS 'URL to preview image';
COMMENT ON COLUMN page_sections.html_content IS 'Complete HTML content of the section';
COMMENT ON COLUMN page_sections.css_content IS 'Additional CSS styles if needed';
COMMENT ON COLUMN page_sections.js_content IS 'JavaScript functionality if needed';
COMMENT ON COLUMN page_sections.components_used IS 'Array of component names used in this section';
COMMENT ON COLUMN page_sections.tags IS 'Tags for categorization and search';
COMMENT ON COLUMN page_sections.usage_count IS 'Number of times this section has been used';
