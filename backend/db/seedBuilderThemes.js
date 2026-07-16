/**
 * Seed Builder Themes
 * 
 * Creates 10 default global themes with complete design systems.
 * Each theme includes colors, typography, spacing, borders, shadows, and animations.
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a theme object with all design tokens
 */
function createTheme(
  name,
  description,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  components = {},
  darkMode = null
) {
  return {
    name,
    description,
    is_global: true,
    colors,
    typography,
    spacing,
    border_radius: borderRadius,
    shadows,
    animations,
    components,
    dark_mode: darkMode,
    thumbnail_url: null,
    is_active: true,
  };
}

// ============================================================================
// THEME DEFINITIONS
// ============================================================================

const themes = [
  // 1. Modern Business (Default)
  createTheme(
    'Modern Business',
    'Clean, contemporary design with professional aesthetics',
    {
      primary: '#2563eb',
      secondary: '#7c3aed',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      neutral: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      background: '#ffffff',
      surface: '#f9fafb',
      text: {
        primary: '#111827',
        secondary: '#6b7280',
        muted: '#9ca3af',
      },
    },
    {
      fontFamily: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif',
        mono: 'JetBrains Mono, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
      },
    },
    {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
    },
    {
      none: '0',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      full: '9999px',
    },
    {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    {
      duration: {
        fast: '150ms',
        base: '300ms',
        slow: '500ms',
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
      },
    },
    {
      button: {
        primary: {
          background: '#2563eb',
          color: '#ffffff',
          hover: '#1d4ed8',
        },
        secondary: {
          background: '#f3f4f6',
          color: '#111827',
          hover: '#e5e7eb',
        },
      },
      card: {
        background: '#ffffff',
        border: '#e5e7eb',
        shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
    }
  ),

  // 2. Classic Elegance
  createTheme(
    'Classic Elegance',
    'Timeless design with serif typography and refined aesthetics',
    {
      primary: '#1e3a8a',
      secondary: '#92400e',
      accent: '#b45309',
      success: '#065f46',
      warning: '#92400e',
      error: '#991b1b',
      neutral: {
        50: '#fafaf9',
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716c',
        600: '#57534e',
        700: '#44403c',
        800: '#292524',
        900: '#1c1917',
      },
      background: '#fefdfb',
      surface: '#fafaf9',
      text: {
        primary: '#1c1917',
        secondary: '#57534e',
        muted: '#78716c',
      },
    },
    {
      fontFamily: {
        heading: 'Playfair Display, serif',
        body: 'Lora, serif',
        mono: 'Courier New, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        '5xl': '3.5rem',
        '6xl': '4.5rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.3,
        normal: 1.6,
        relaxed: 1.8,
      },
    },
    {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.5rem',
      6: '2rem',
      8: '2.5rem',
      10: '3rem',
      12: '4rem',
      16: '5rem',
      20: '6rem',
      24: '8rem',
    },
    {
      none: '0',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      full: '9999px',
    },
    {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.08)',
      base: '0 2px 4px 0 rgba(0, 0, 0, 0.12)',
      md: '0 4px 8px -1px rgba(0, 0, 0, 0.15)',
      lg: '0 10px 20px -3px rgba(0, 0, 0, 0.18)',
      xl: '0 20px 30px -5px rgba(0, 0, 0, 0.2)',
      '2xl': '0 30px 60px -12px rgba(0, 0, 0, 0.25)',
    },
    {
      duration: {
        fast: '200ms',
        base: '400ms',
        slow: '600ms',
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
      },
    }
  ),

  // 3. Minimal Clean
  createTheme(
    'Minimal Clean',
    'Ultra-minimal design with maximum whitespace and clarity',
    {
      primary: '#000000',
      secondary: '#404040',
      accent: '#0066ff',
      success: '#00c853',
      warning: '#ff9800',
      error: '#f44336',
      neutral: {
        50: '#ffffff',
        100: '#fafafa',
        200: '#f5f5f5',
        300: '#eeeeee',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
      },
      background: '#ffffff',
      surface: '#fafafa',
      text: {
        primary: '#000000',
        secondary: '#616161',
        muted: '#9e9e9e',
      },
    },
    {
      fontFamily: {
        heading: 'Helvetica Neue, sans-serif',
        body: 'Helvetica Neue, sans-serif',
        mono: 'Monaco, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '4rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.8,
      },
    },
    {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
    },
    {
      none: '0',
      sm: '0',
      base: '0',
      md: '0',
      lg: '0',
      xl: '0',
      '2xl': '0',
      full: '9999px',
    },
    {
      sm: 'none',
      base: 'none',
      md: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      lg: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
      xl: '0 4px 8px 0 rgba(0, 0, 0, 0.1)',
      '2xl': '0 8px 16px 0 rgba(0, 0, 0, 0.12)',
    },
    {
      duration: {
        fast: '100ms',
        base: '200ms',
        slow: '400ms',
      },
      easing: {
        linear: 'linear',
        ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }
  ),

  // 4. Bold & Vibrant
  createTheme(
    'Bold & Vibrant',
    'High-energy design with bold colors and strong contrasts',
    {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      neutral: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
      },
      background: '#ffffff',
      surface: '#fafafa',
      text: {
        primary: '#18181b',
        secondary: '#52525b',
        muted: '#71717a',
      },
    },
    {
      fontFamily: {
        heading: 'Poppins, sans-serif',
        body: 'Inter, sans-serif',
        mono: 'Fira Code, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        '5xl': '3.5rem',
        '6xl': '4.5rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
      },
    },
    {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
    },
    {
      none: '0',
      sm: '0.25rem',
      base: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
      '2xl': '2rem',
      full: '9999px',
    },
    {
      sm: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
      base: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      md: '0 6px 12px -2px rgba(0, 0, 0, 0.15)',
      lg: '0 12px 24px -4px rgba(0, 0, 0, 0.2)',
      xl: '0 24px 48px -8px rgba(0, 0, 0, 0.25)',
      '2xl': '0 32px 64px -12px rgba(0, 0, 0, 0.3)',
    },
    {
      duration: {
        fast: '150ms',
        base: '300ms',
        slow: '500ms',
      },
      easing: {
        linear: 'linear',
        ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }
  ),

  // 5. Dark Mode Pro
  createTheme(
    'Dark Mode Pro',
    'Professional dark theme with excellent contrast and readability',
    {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      neutral: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
      },
      background: '#0a0a0a',
      surface: '#18181b',
      text: {
        primary: '#fafafa',
        secondary: '#a1a1aa',
        muted: '#71717a',
      },
    },
    {
      fontFamily: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif',
        mono: 'JetBrains Mono, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
      },
    },
    {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
    },
    {
      none: '0',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      full: '9999px',
    },
    {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.7)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
    },
    {
      duration: {
        fast: '150ms',
        base: '300ms',
        slow: '500ms',
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
      },
    }
  ),

  // 6. Soft Pastel
  createTheme(
    'Soft Pastel',
    'Gentle, calming design with soft pastel colors',
    {
      primary: '#a78bfa',
      secondary: '#f9a8d4',
      accent: '#fbbf24',
      success: '#86efac',
      warning: '#fcd34d',
      error: '#fca5a5',
      neutral: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
      },
      background: '#fefefe',
      surface: '#fafafa',
      text: {
        primary: '#424242',
        secondary: '#757575',
        muted: '#9e9e9e',
      },
    },
    {
      fontFamily: {
        heading: 'Quicksand, sans-serif',
        body: 'Nunito, sans-serif',
        mono: 'Source Code Pro, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.3,
        normal: 1.6,
        relaxed: 1.8,
      },
    },
    {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
    },
    {
      none: '0',
      sm: '0.25rem',
      base: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      full: '9999px',
    },
    {
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      base: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
      md: '0 4px 8px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 8px 16px -3px rgba(0, 0, 0, 0.12)',
      xl: '0 16px 24px -5px rgba(0, 0, 0, 0.15)',
      '2xl': '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
    },
    {
      duration: {
        fast: '200ms',
        base: '350ms',
        slow: '550ms',
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
      },
    }
  ),

  // 7. Corporate Blue
  createTheme(
    'Corporate Blue',
    'Professional corporate theme with blue color scheme',
    {
      primary: '#1e40af',
      secondary: '#0891b2',
      accent: '#0ea5e9',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      neutral: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
      background: '#ffffff',
      surface: '#f8fafc',
      text: {
        primary: '#0f172a',
        secondary: '#475569',
        muted: '#64748b',
      },
    },
    {
      fontFamily: {
        heading: 'Roboto, sans-serif',
        body: 'Open Sans, sans-serif',
        mono: 'Roboto Mono, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
      },
    },
    {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
    },
    {
      none: '0',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      full: '9999px',
    },
    {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    {
      duration: {
        fast: '150ms',
        base: '300ms',
        slow: '500ms',
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
      },
    }
  ),

  // 8. Warm Earth
  createTheme(
    'Warm Earth',
    'Natural, organic design with warm earth tones',
    {
      primary: '#92400e',
      secondary: '#78350f',
      accent: '#d97706',
      success: '#15803d',
      warning: '#ca8a04',
      error: '#b91c1c',
      neutral: {
        50: '#fafaf9',
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716c',
        600: '#57534e',
        700: '#44403c',
        800: '#292524',
        900: '#1c1917',
      },
      background: '#fffbf5',
      surface: '#fafaf9',
      text: {
        primary: '#1c1917',
        secondary: '#57534e',
        muted: '#78716c',
      },
    },
    {
      fontFamily: {
        heading: 'Merriweather, serif',
        body: 'Source Sans Pro, sans-serif',
        mono: 'Courier Prime, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.3,
        normal: 1.6,
        relaxed: 1.8,
      },
    },
    {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
    },
    {
      none: '0',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      full: '9999px',
    },
    {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      base: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
      md: '0 4px 8px -1px rgba(0, 0, 0, 0.12)',
      lg: '0 10px 20px -3px rgba(0, 0, 0, 0.15)',
      xl: '0 20px 30px -5px rgba(0, 0, 0, 0.18)',
      '2xl': '0 30px 60px -12px rgba(0, 0, 0, 0.22)',
    },
    {
      duration: {
        fast: '200ms',
        base: '400ms',
        slow: '600ms',
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
      },
    }
  ),

  // 9. Tech Startup
  createTheme(
    'Tech Startup',
    'Modern tech-focused design with gradient accents',
    {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      neutral: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
      },
      background: '#ffffff',
      surface: '#fafafa',
      text: {
        primary: '#18181b',
        secondary: '#52525b',
        muted: '#71717a',
      },
    },
    {
      fontFamily: {
        heading: 'Space Grotesk, sans-serif',
        body: 'Inter, sans-serif',
        mono: 'Fira Code, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
      },
    },
    {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
    },
    {
      none: '0',
      sm: '0.25rem',
      base: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      full: '9999px',
    },
    {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    {
      duration: {
        fast: '150ms',
        base: '300ms',
        slow: '500ms',
      },
      easing: {
        linear: 'linear',
        ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }
  ),

  // 10. Luxury Premium
  createTheme(
    'Luxury Premium',
    'High-end luxury design with gold accents and refined typography',
    {
      primary: '#854d0e',
      secondary: '#713f12',
      accent: '#ca8a04',
      success: '#15803d',
      warning: '#ca8a04',
      error: '#991b1b',
      neutral: {
        50: '#fafaf9',
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716c',
        600: '#57534e',
        700: '#44403c',
        800: '#292524',
        900: '#1c1917',
      },
      background: '#fffef9',
      surface: '#fafaf9',
      text: {
        primary: '#1c1917',
        secondary: '#57534e',
        muted: '#78716c',
      },
    },
    {
      fontFamily: {
        heading: 'Cormorant Garamond, serif',
        body: 'Crimson Text, serif',
        mono: 'IBM Plex Mono, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1.0625rem',
        lg: '1.1875rem',
        xl: '1.3125rem',
        '2xl': '1.625rem',
        '3xl': '2.125rem',
        '4xl': '2.75rem',
        '5xl': '3.75rem',
        '6xl': '5rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.3,
        normal: 1.65,
        relaxed: 1.85,
      },
    },
    {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.5rem',
      6: '2rem',
      8: '2.5rem',
      10: '3rem',
      12: '4rem',
      16: '5rem',
      20: '6rem',
      24: '8rem',
    },
    {
      none: '0',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      full: '9999px',
    },
    {
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
      base: '0 2px 6px 0 rgba(0, 0, 0, 0.12)',
      md: '0 4px 12px -1px rgba(0, 0, 0, 0.15)',
      lg: '0 10px 24px -3px rgba(0, 0, 0, 0.18)',
      xl: '0 20px 36px -5px rgba(0, 0, 0, 0.22)',
      '2xl': '0 30px 72px -12px rgba(0, 0, 0, 0.28)',
    },
    {
      duration: {
        fast: '250ms',
        base: '450ms',
        slow: '700ms',
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
      },
    }
  ),
];

// ============================================================================
// SEEDING FUNCTION
// ============================================================================

async function seedThemes() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌱 Starting theme seeding...\n');

    let inserted = 0;
    let skipped = 0;

    for (const theme of themes) {
      try {
        const result = await client.query(
          `INSERT INTO builder_themes 
           (name, description, is_global, colors, typography, spacing, border_radius, shadows, animations, components, dark_mode, thumbnail_url, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING id`,
          [
            theme.name,
            theme.description,
            theme.is_global,
            JSON.stringify(theme.colors),
            JSON.stringify(theme.typography),
            JSON.stringify(theme.spacing),
            JSON.stringify(theme.border_radius),
            JSON.stringify(theme.shadows),
            JSON.stringify(theme.animations),
            JSON.stringify(theme.components),
            theme.dark_mode ? JSON.stringify(theme.dark_mode) : null,
            theme.thumbnail_url,
            theme.is_active,
          ]
        );

        if (result.rows.length > 0) {
          inserted++;
          console.log(`✓ ${theme.name}`);
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`✗ Failed to insert ${theme.name}:`, error.message);
        skipped++;
      }
    }

    await client.query('COMMIT');

    console.log(`\n✅ Theme seeding complete!`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${themes.length}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding themes:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedThemes()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { seedThemes };
