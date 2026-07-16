-- Website Builder: Theme System
-- Global design tokens, color palettes, typography, spacing scales

CREATE TABLE builder_themes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  is_global       BOOLEAN     NOT NULL DEFAULT false, -- Global themes available to all orgs
  
  -- Color System
  colors          JSONB       NOT NULL DEFAULT '{
    "primary": "#2563eb",
    "secondary": "#7c3aed",
    "accent": "#f59e0b",
    "success": "#10b981",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "neutral": {
      "50": "#f9fafb",
      "100": "#f3f4f6",
      "200": "#e5e7eb",
      "300": "#d1d5db",
      "400": "#9ca3af",
      "500": "#6b7280",
      "600": "#4b5563",
      "700": "#374151",
      "800": "#1f2937",
      "900": "#111827"
    },
    "background": "#ffffff",
    "surface": "#f9fafb",
    "text": {
      "primary": "#111827",
      "secondary": "#6b7280",
      "muted": "#9ca3af"
    }
  }',
  
  -- Typography System
  typography      JSONB       NOT NULL DEFAULT '{
    "fontFamily": {
      "heading": "Inter, sans-serif",
      "body": "Inter, sans-serif",
      "mono": "JetBrains Mono, monospace"
    },
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem"
    },
    "fontWeight": {
      "light": 300,
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700,
      "extrabold": 800
    },
    "lineHeight": {
      "tight": 1.25,
      "normal": 1.5,
      "relaxed": 1.75
    }
  }',
  
  -- Spacing System
  spacing         JSONB       NOT NULL DEFAULT '{
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem",
    "20": "5rem",
    "24": "6rem"
  }',
  
  -- Border Radius
  border_radius   JSONB       NOT NULL DEFAULT '{
    "none": "0",
    "sm": "0.125rem",
    "base": "0.25rem",
    "md": "0.375rem",
    "lg": "0.5rem",
    "xl": "0.75rem",
    "2xl": "1rem",
    "full": "9999px"
  }',
  
  -- Shadows
  shadows         JSONB       NOT NULL DEFAULT '{
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "base": "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
  }',
  
  -- Animations
  animations      JSONB       NOT NULL DEFAULT '{
    "duration": {
      "fast": "150ms",
      "base": "300ms",
      "slow": "500ms"
    },
    "easing": {
      "linear": "linear",
      "ease": "ease",
      "easeIn": "ease-in",
      "easeOut": "ease-out",
      "easeInOut": "ease-in-out"
    }
  }',
  
  -- Component Tokens (button, form, card styles)
  components      JSONB       NOT NULL DEFAULT '{}',
  
  -- Dark Mode Support
  dark_mode       JSONB       DEFAULT NULL,
  
  thumbnail_url   TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX builder_themes_org_idx ON builder_themes (org_id) WHERE org_id IS NOT NULL;
CREATE INDEX builder_themes_global_idx ON builder_themes (is_global) WHERE is_global = true;

-- Insert default global theme
INSERT INTO builder_themes (name, description, is_global) VALUES 
('Modern Business', 'Clean, contemporary design with professional aesthetics', true);
