-- Migration 132: Accessibility Checks for Website Builder
-- WCAG 2.1 compliance checking and reporting

-- Accessibility audit results
CREATE TABLE IF NOT EXISTS page_accessibility_audits (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    
    -- Overall scores
    wcag_level VARCHAR(10), -- 'A', 'AA', 'AAA'
    overall_score INTEGER NOT NULL, -- 0-100
    
    -- Category scores
    perceivable_score INTEGER,
    operable_score INTEGER,
    understandable_score INTEGER,
    robust_score INTEGER,
    
    -- Detailed findings
    violations JSONB NOT NULL DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    passes JSONB DEFAULT '[]',
    
    -- Element-specific issues
    elements_with_issues JSONB DEFAULT '[]',
    
    -- Audit metadata
    audit_tool VARCHAR(50) DEFAULT 'axe-core',
    audited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    audited_by UUID REFERENCES users(id)
);

-- Accessibility rules configuration
CREATE TABLE IF NOT EXISTS accessibility_rules (
    id SERIAL PRIMARY KEY,
    rule_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Rule configuration
    wcag_level VARCHAR(10) NOT NULL, -- 'A', 'AA', 'AAA'
    wcag_criteria VARCHAR(50), -- e.g., '1.1.1', '2.4.7'
    severity VARCHAR(20) DEFAULT 'moderate', -- 'critical', 'serious', 'moderate', 'minor'
    
    -- Rule details
    help_text TEXT,
    help_url TEXT,
    tags TEXT[],
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accessibility fixes tracking
CREATE TABLE IF NOT EXISTS accessibility_fixes (
    id SERIAL PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    element_id VARCHAR(255) NOT NULL,
    rule_id VARCHAR(100) NOT NULL REFERENCES accessibility_rules(rule_id),
    
    -- Issue details
    issue_description TEXT NOT NULL,
    suggested_fix TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'fixed', 'ignored'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Resolution
    fixed_by UUID REFERENCES users(id),
    fixed_at TIMESTAMP,
    fix_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_page_a11y_audits_page ON page_accessibility_audits(page_id);
CREATE INDEX idx_page_a11y_audits_date ON page_accessibility_audits(audited_at DESC);
CREATE INDEX idx_a11y_fixes_page ON accessibility_fixes(page_id);
CREATE INDEX idx_a11y_fixes_status ON accessibility_fixes(status);
CREATE INDEX idx_a11y_rules_enabled ON accessibility_rules(is_enabled) WHERE is_enabled = true;

-- Insert common WCAG rules
INSERT INTO accessibility_rules (rule_id, name, description, wcag_level, wcag_criteria, severity, help_text, tags) VALUES
('image-alt', 'Images must have alternate text', 'Ensures <img> elements have alternate text or a role of none or presentation', 'A', '1.1.1', 'critical', 'All images must have an alt attribute that describes the image content', ARRAY['wcag2a', 'section508', 'cat.text-alternatives']),
('color-contrast', 'Elements must have sufficient color contrast', 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds', 'AA', '1.4.3', 'serious', 'Text must have a contrast ratio of at least 4.5:1 (3:1 for large text)', ARRAY['wcag2aa', 'cat.color']),
('html-has-lang', 'HTML element must have a lang attribute', 'Ensures every HTML document has a lang attribute', 'A', '3.1.1', 'serious', 'The html element must have a lang attribute to identify the language of the page', ARRAY['wcag2a', 'cat.language']),
('label', 'Form elements must have labels', 'Ensures every form element has a label', 'A', '4.1.2', 'critical', 'All form inputs must have an associated label element', ARRAY['wcag2a', 'section508', 'cat.forms']),
('link-name', 'Links must have discernible text', 'Ensures links have discernible text', 'A', '4.1.2', 'serious', 'Links must have text content or an aria-label', ARRAY['wcag2a', 'section508', 'cat.name-role-value']),
('button-name', 'Buttons must have discernible text', 'Ensures buttons have discernible text', 'A', '4.1.2', 'critical', 'Buttons must have text content or an aria-label', ARRAY['wcag2a', 'section508', 'cat.name-role-value']),
('heading-order', 'Heading levels should only increase by one', 'Ensures the order of headings is semantically correct', 'A', '1.3.1', 'moderate', 'Headings should be in a logical order (h1, h2, h3, etc.)', ARRAY['wcag2a', 'cat.semantics']),
('landmark-one-main', 'Document must have one main landmark', 'Ensures the document has a main landmark', 'A', '1.3.1', 'moderate', 'Page should have exactly one main landmark', ARRAY['wcag2a', 'cat.semantics']),
('meta-viewport', 'Zooming and scaling must not be disabled', 'Ensures <meta name="viewport"> does not disable text scaling and zooming', 'AA', '1.4.4', 'critical', 'Users must be able to zoom and scale the page', ARRAY['wcag2aa', 'cat.sensory-and-visual-cues']),
('aria-valid-attr', 'ARIA attributes must conform to valid names', 'Ensures attributes that begin with aria- are valid ARIA attributes', 'A', '4.1.2', 'critical', 'Only use valid ARIA attributes', ARRAY['wcag2a', 'cat.aria']),
('aria-required-attr', 'Required ARIA attributes must be provided', 'Ensures elements with ARIA roles have all required ARIA attributes', 'A', '4.1.2', 'critical', 'Elements with ARIA roles must have all required attributes', ARRAY['wcag2a', 'cat.aria']),
('tabindex', 'Elements should not have tabindex greater than zero', 'Ensures tabindex attribute values are not greater than 0', 'A', '2.4.3', 'serious', 'Avoid positive tabindex values as they disrupt natural tab order', ARRAY['wcag2a', 'cat.keyboard']),
('focus-order-semantics', 'Elements in the focus order need a role appropriate for interactive content', 'Ensures elements in the focus order have an appropriate role', 'A', '4.1.2', 'serious', 'Interactive elements must have appropriate ARIA roles', ARRAY['wcag2a', 'cat.keyboard']);

COMMENT ON TABLE page_accessibility_audits IS 'Accessibility audit results for pages';
COMMENT ON TABLE accessibility_rules IS 'WCAG accessibility rules configuration';
COMMENT ON TABLE accessibility_fixes IS 'Tracking of accessibility issues and fixes';
