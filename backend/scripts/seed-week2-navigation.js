/**
 * Week 2 - Navigation Components
 * 10 professional navigation components
 * 
 * Usage: node scripts/seed-week2-navigation.js
 */

require('dotenv').config();
const db = require('../src/db');

const CATEGORIES = {
  NAVIGATION: 'navigation'
};

function createComponent(name, description, category, blockType, html, css, schema, defaultProps, tags, js = null) {
  return {
    name,
    description,
    category,
    block_type: blockType,
    is_global: true,
    html: html.trim(),
    css: css.trim(),
    js,
    schema,
    default_props: defaultProps,
    tags,
    responsive_settings: {
      mobile: { fontSize: 'smaller', padding: 'reduced' },
      tablet: { fontSize: 'medium', padding: 'normal' }
    }
  };
}

// NAVIGATION COMPONENTS (10 total)
const navigationComponents = [
  createComponent(
    'Navigation - Centered Logo',
    'Clean navigation with centered logo and menu items on sides',
    CATEGORIES.NAVIGATION,
    'navigation',
    `<nav class="nav-centered">
      <div class="nav-container">
        <div class="nav-left">
          <a href="{{link1Url}}">{{link1}}</a>
          <a href="{{link2Url}}">{{link2}}</a>
        </div>
        <a href="/" class="nav-logo">{{logo}}</a>
        <div class="nav-right">
          <a href="{{link3Url}}">{{link3}}</a>
          <a href="{{ctaUrl}}" class="nav-cta">{{ctaText}}</a>
        </div>
      </div>
    </nav>`,
    `.nav-centered {
      padding: 1.5rem 2rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nav-left,
    .nav-right {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    .nav-left a,
    .nav-right a {
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .nav-left a:hover,
    .nav-right a:hover {
      color: #111827;
    }
    .nav-logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      text-decoration: none;
    }
    .nav-cta {
      padding: 0.625rem 1.5rem;
      background: #2563eb;
      color: white !important;
      border-radius: 0.375rem;
      font-weight: 600;
    }
    .nav-cta:hover {
      background: #1d4ed8 !important;
    }
    @media (max-width: 768px) {
      .nav-left,
      .nav-right {
        display: none;
      }
    }`,
    {
      logo: { type: 'text', label: 'Logo Text', default: 'Brand' },
      link1: { type: 'text', label: 'Link 1', default: 'Features' },
      link1Url: { type: 'text', label: 'Link 1 URL', default: '#features' },
      link2: { type: 'text', label: 'Link 2', default: 'Pricing' },
      link2Url: { type: 'text', label: 'Link 2 URL', default: '#pricing' },
      link3: { type: 'text', label: 'Link 3', default: 'About' },
      link3Url: { type: 'text', label: 'Link 3 URL', default: '#about' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Get Started' },
      ctaUrl: { type: 'text', label: 'CTA Button URL', default: '#signup' }
    },
    {
      logo: 'Brand',
      link1: 'Features',
      link1Url: '#features',
      link2: 'Pricing',
      link2Url: '#pricing',
      link3: 'About',
      link3Url: '#about',
      ctaText: 'Get Started',
      ctaUrl: '#signup'
    },
    ['navigation', 'centered', 'logo', 'sticky']
  ),

  createComponent(
    'Navigation - Left Logo',
    'Traditional navigation with logo on left and menu on right',
    CATEGORIES.NAVIGATION,
    'navigation',
    `<nav class="nav-left-logo">
      <div class="nav-container">
        <a href="/" class="nav-logo">{{logo}}</a>
        <div class="nav-menu">
          <a href="{{link1Url}}">{{link1}}</a>
          <a href="{{link2Url}}">{{link2}}</a>
          <a href="{{link3Url}}">{{link3}}</a>
          <a href="{{link4Url}}">{{link4}}</a>
          <a href="{{ctaUrl}}" class="nav-cta">{{ctaText}}</a>
        </div>
        <button class="nav-toggle">☰</button>
      </div>
    </nav>`,
    `.nav-left-logo {
      padding: 1.5rem 2rem;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nav-logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      text-decoration: none;
    }
    .nav-menu {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    .nav-menu a {
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .nav-menu a:hover {
      color: #111827;
    }
    .nav-cta {
      padding: 0.625rem 1.5rem;
      background: #2563eb;
      color: white !important;
      border-radius: 0.375rem;
      font-weight: 600;
    }
    .nav-cta:hover {
      background: #1d4ed8 !important;
    }
    .nav-toggle {
      display: none;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
    @media (max-width: 768px) {
      .nav-menu {
        display: none;
      }
      .nav-toggle {
        display: block;
      }
    }`,
    {
      logo: { type: 'text', label: 'Logo Text', default: 'Company' },
      link1: { type: 'text', label: 'Link 1', default: 'Home' },
      link1Url: { type: 'text', label: 'Link 1 URL', default: '/' },
      link2: { type: 'text', label: 'Link 2', default: 'Features' },
      link2Url: { type: 'text', label: 'Link 2 URL', default: '#features' },
      link3: { type: 'text', label: 'Link 3', default: 'Pricing' },
      link3Url: { type: 'text', label: 'Link 3 URL', default: '#pricing' },
      link4: { type: 'text', label: 'Link 4', default: 'Contact' },
      link4Url: { type: 'text', label: 'Link 4 URL', default: '#contact' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Sign Up' },
      ctaUrl: { type: 'text', label: 'CTA Button URL', default: '#signup' }
    },
    {
      logo: 'Company',
      link1: 'Home',
      link1Url: '/',
      link2: 'Features',
      link2Url: '#features',
      link3: 'Pricing',
      link3Url: '#pricing',
      link4: 'Contact',
      link4Url: '#contact',
      ctaText: 'Sign Up',
      ctaUrl: '#signup'
    },
    ['navigation', 'left-logo', 'traditional', 'sticky']
  ),

  createComponent(
    'Navigation - Transparent',
    'Transparent navigation that overlays content',
    CATEGORIES.NAVIGATION,
    'navigation',
    `<nav class="nav-transparent">
      <div class="nav-container">
        <a href="/" class="nav-logo">{{logo}}</a>
        <div class="nav-menu">
          <a href="{{link1Url}}">{{link1}}</a>
          <a href="{{link2Url}}">{{link2}}</a>
          <a href="{{link3Url}}">{{link3}}</a>
          <a href="{{ctaUrl}}" class="nav-cta">{{ctaText}}</a>
        </div>
      </div>
    </nav>`,
    `.nav-transparent {
      padding: 2rem;
      background: transparent;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nav-logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      text-decoration: none;
    }
    .nav-menu {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    .nav-menu a {
      color: white;
      text-decoration: none;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    .nav-menu a:hover {
      opacity: 0.8;
    }
    .nav-cta {
      padding: 0.625rem 1.5rem;
      background: white;
      color: #111827 !important;
      border-radius: 0.375rem;
      font-weight: 600;
    }
    .nav-cta:hover {
      opacity: 0.9 !important;
    }
    @media (max-width: 768px) {
      .nav-menu {
        display: none;
      }
    }`,
    {
      logo: { type: 'text', label: 'Logo Text', default: 'Brand' },
      link1: { type: 'text', label: 'Link 1', default: 'Features' },
      link1Url: { type: 'text', label: 'Link 1 URL', default: '#features' },
      link2: { type: 'text', label: 'Link 2', default: 'Pricing' },
      link2Url: { type: 'text', label: 'Link 2 URL', default: '#pricing' },
      link3: { type: 'text', label: 'Link 3', default: 'About' },
      link3Url: { type: 'text', label: 'Link 3 URL', default: '#about' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Get Started' },
      ctaUrl: { type: 'text', label: 'CTA Button URL', default: '#signup' }
    },
    {
      logo: 'Brand',
      link1: 'Features',
      link1Url: '#features',
      link2: 'Pricing',
      link2Url: '#pricing',
      link3: 'About',
      link3Url: '#about',
      ctaText: 'Get Started',
      ctaUrl: '#signup'
    },
    ['navigation', 'transparent', 'overlay', 'absolute']
  ),

  createComponent(
    'Navigation - With Dropdown',
    'Navigation with dropdown menu support',
    CATEGORIES.NAVIGATION,
    'navigation',
    `<nav class="nav-dropdown">
      <div class="nav-container">
        <a href="/" class="nav-logo">{{logo}}</a>
        <div class="nav-menu">
          <a href="{{link1Url}}">{{link1}}</a>
          <div class="nav-dropdown-item">
            <a href="{{link2Url}}">{{link2}} ▾</a>
            <div class="nav-dropdown-menu">
              <a href="{{dropdown1Url}}">{{dropdown1}}</a>
              <a href="{{dropdown2Url}}">{{dropdown2}}</a>
              <a href="{{dropdown3Url}}">{{dropdown3}}</a>
            </div>
          </div>
          <a href="{{link3Url}}">{{link3}}</a>
          <a href="{{ctaUrl}}" class="nav-cta">{{ctaText}}</a>
        </div>
      </div>
    </nav>`,
    `.nav-dropdown {
      padding: 1.5rem 2rem;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nav-logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      text-decoration: none;
    }
    .nav-menu {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    .nav-menu > a {
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .nav-menu > a:hover {
      color: #111827;
    }
    .nav-dropdown-item {
      position: relative;
    }
    .nav-dropdown-item > a {
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
    }
    .nav-dropdown-menu {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 0.5rem;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      min-width: 200px;
      padding: 0.5rem 0;
    }
    .nav-dropdown-item:hover .nav-dropdown-menu {
      display: block;
    }
    .nav-dropdown-menu a {
      display: block;
      padding: 0.75rem 1.5rem;
      color: #374151;
      text-decoration: none;
      transition: background 0.2s;
    }
    .nav-dropdown-menu a:hover {
      background: #f9fafb;
    }
    .nav-cta {
      padding: 0.625rem 1.5rem;
      background: #2563eb;
      color: white !important;
      border-radius: 0.375rem;
      font-weight: 600;
    }
    .nav-cta:hover {
      background: #1d4ed8 !important;
    }
    @media (max-width: 768px) {
      .nav-menu {
        display: none;
      }
    }`,
    {
      logo: { type: 'text', label: 'Logo Text', default: 'Company' },
      link1: { type: 'text', label: 'Link 1', default: 'Home' },
      link1Url: { type: 'text', label: 'Link 1 URL', default: '/' },
      link2: { type: 'text', label: 'Link 2 (Dropdown)', default: 'Products' },
      link2Url: { type: 'text', label: 'Link 2 URL', default: '#products' },
      dropdown1: { type: 'text', label: 'Dropdown Item 1', default: 'Product A' },
      dropdown1Url: { type: 'text', label: 'Dropdown Item 1 URL', default: '#product-a' },
      dropdown2: { type: 'text', label: 'Dropdown Item 2', default: 'Product B' },
      dropdown2Url: { type: 'text', label: 'Dropdown Item 2 URL', default: '#product-b' },
      dropdown3: { type: 'text', label: 'Dropdown Item 3', default: 'Product C' },
      dropdown3Url: { type: 'text', label: 'Dropdown Item 3 URL', default: '#product-c' },
      link3: { type: 'text', label: 'Link 3', default: 'Contact' },
      link3Url: { type: 'text', label: 'Link 3 URL', default: '#contact' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Get Started' },
      ctaUrl: { type: 'text', label: 'CTA Button URL', default: '#signup' }
    },
    {
      logo: 'Company',
      link1: 'Home',
      link1Url: '/',
      link2: 'Products',
      link2Url: '#products',
      dropdown1: 'Product A',
      dropdown1Url: '#product-a',
      dropdown2: 'Product B',
      dropdown2Url: '#product-b',
      dropdown3: 'Product C',
      dropdown3Url: '#product-c',
      link3: 'Contact',
      link3Url: '#contact',
      ctaText: 'Get Started',
      ctaUrl: '#signup'
    },
    ['navigation', 'dropdown', 'menu', 'sticky']
  ),

  createComponent(
    'Navigation - Minimal',
    'Minimal navigation with just logo and CTA',
    CATEGORIES.NAVIGATION,
    'navigation',
    `<nav class="nav-minimal">
      <div class="nav-container">
        <a href="/" class="nav-logo">{{logo}}</a>
        <a href="{{ctaUrl}}" class="nav-cta">{{ctaText}}</a>
      </div>
    </nav>`,
    `.nav-minimal {
      padding: 2rem;
      background: transparent;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nav-logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      text-decoration: none;
    }
    .nav-cta {
      padding: 0.75rem 2rem;
      background: #111827;
      color: white;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.2s;
    }
    .nav-cta:hover {
      background: #1f2937;
    }`,
    {
      logo: { type: 'text', label: 'Logo Text', default: 'Brand' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Get Started' },
      ctaUrl: { type: 'text', label: 'CTA Button URL', default: '#signup' }
    },
    {
      logo: 'Brand',
      ctaText: 'Get Started',
      ctaUrl: '#signup'
    },
    ['navigation', 'minimal', 'simple', 'clean']
  ),

  createComponent(
    'Navigation - Dark',
    'Dark themed navigation bar',
    CATEGORIES.NAVIGATION,
    'navigation',
    `<nav class="nav-dark">
      <div class="nav-container">
        <a href="/" class="nav-logo">{{logo}}</a>
        <div class="nav-menu">
          <a href="{{link1Url}}">{{link1}}</a>
          <a href="{{link2Url}}">{{link2}}</a>
          <a href="{{link3Url}}">{{link3}}</a>
          <a href="{{link4Url}}">{{link4}}</a>
          <a href="{{ctaUrl}}" class="nav-cta">{{ctaText}}</a>
        </div>
      </div>
    </nav>`,
    `.nav-dark {
      padding: 1.5rem 2rem;
      background: #111827;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nav-logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      text-decoration: none;
    }
    .nav-menu {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    .nav-menu a {
      color: #d1d5db;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .nav-menu a:hover {
      color: white;
    }
    .nav-cta {
      padding: 0.625rem 1.5rem;
      background: white;
      color: #111827 !important;
      border-radius: 0.375rem;
      font-weight: 600;
    }
    .nav-cta:hover {
      background: #f3f4f6 !important;
    }
    @media (max-width: 768px) {
      .nav-menu {
        display: none;
      }
    }`,
    {
      logo: { type: 'text', label: 'Logo Text', default: 'Brand' },
      link1: { type: 'text', label: 'Link 1', default: 'Home' },
      link1Url: { type: 'text', label: 'Link 1 URL', default: '/' },
      link2: { type: 'text', label: 'Link 2', default: 'Features' },
      link2Url: { type: 'text', label: 'Link 2 URL', default: '#features' },
      link3: { type: 'text', label: 'Link 3', default: 'Pricing' },
      link3Url: { type: 'text', label: 'Link 3 URL', default: '#pricing' },
      link4: { type: 'text', label: 'Link 4', default: 'About' },
      link4Url: { type: 'text', label: 'Link 4 URL', default: '#about' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Sign Up' },
      ctaUrl: { type: 'text', label: 'CTA Button URL', default: '#signup' }
    },
    {
      logo: 'Brand',
      link1: 'Home',
      link1Url: '/',
      link2: 'Features',
      link2Url: '#features',
      link3: 'Pricing',
      link3Url: '#pricing',
      link4: 'About',
      link4Url: '#about',
      ctaText: 'Sign Up',
      ctaUrl: '#signup'
    },
    ['navigation', 'dark', 'theme', 'sticky']
  ),

  createComponent(
    'Navigation - With Search',
    'Navigation with integrated search bar',
    CATEGORIES.NAVIGATION,
    'navigation',
    `<nav class="nav-search">
      <div class="nav-container">
        <a href="/" class="nav-logo">{{logo}}</a>
        <div class="nav-search-bar">
          <input type="search" placeholder="{{searchPlaceholder}}" class="search-input">
          <button class="search-btn">🔍</button>
        </div>
        <div class="nav-menu">
          <a href="{{link1Url}}">{{link1}}</a>
          <a href="{{link2Url}}">{{link2}}</a>
          <a href="{{ctaUrl}}" class="nav-cta">{{ctaText}}</a>
        </div>
      </div>
    </nav>`,
    `.nav-search {
      padding: 1.5rem 2rem;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }
    .nav-logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      text-decoration: none;
      white-space: nowrap;
    }
    .nav-search-bar {
      flex: 1;
      max-width: 400px;
      display: flex;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .search-input {
      flex: 1;
      padding: 0.625rem 1rem;
      border: none;
      outline: none;
      font-size: 0.875rem;
    }
    .search-btn {
      padding: 0.625rem 1rem;
      background: #f9fafb;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
    }
    .search-btn:hover {
      background: #f3f4f6;
    }
    .nav-menu {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    .nav-menu a {
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      white-space: nowrap;
      transition: color 0.2s;
    }
    .nav-menu a:hover {
      color: #111827;
    }
    .nav-cta {
      padding: 0.625rem 1.5rem;
      background: #2563eb;
      color: white !important;
      border-radius: 0.375rem;
      font-weight: 600;
    }
    .nav-cta:hover {
      background: #1d4ed8 !important;
    }
    @media (max-width: 768px) {
      .nav-search-bar,
      .nav-menu {
        display: none;
      }
    }`,
    {
      logo: { type: 'text', label: 'Logo Text', default: 'Store' },
      searchPlaceholder: { type: 'text', label: 'Search Placeholder', default: 'Search products...' },
      link1: { type: 'text', label: 'Link 1', default: 'Shop' },
      link1Url: { type: 'text', label: 'Link 1 URL', default: '#shop' },
      link2: { type: 'text', label: 'Link 2', default: 'About' },
      link2Url: { type: 'text', label: 'Link 2 URL', default: '#about' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Cart (0)' },
      ctaUrl: { type: 'text', label: 'CTA Button URL', default: '#cart' }
    },
    {
      logo: 'Store',
      searchPlaceholder: 'Search products...',
      link1: 'Shop',
      link1Url: '#shop',
      link2: 'About',
      link2Url: '#about',
      ctaText: 'Cart (0)',
      ctaUrl: '#cart'
    },
    ['navigation', 'search', 'ecommerce', 'sticky']
  ),

  createComponent(
    'Navigation - Split',
    'Navigation with links split on both sides of logo',
    CATEGORIES.NAVIGATION,
    'navigation',
    `<nav class="nav-split">
      <div class="nav-container">
        <div class="nav-left">
          <a href="{{link1Url}}">{{link1}}</a>
          <a href="{{link2Url}}">{{link2}}</a>
          <a href="{{link3Url}}">{{link3}}</a>
        </div>
        <a href="/" class="nav-logo">{{logo}}</a>
        <div class="nav-right">
          <a href="{{link4Url}}">{{link4}}</a>
          <a href="{{link5Url}}">{{link5}}</a>
          <a href="{{ctaUrl}}" class="nav-cta">{{ctaText}}</a>
        </div>
      </div>
    </nav>`,
    `.nav-split {
      padding: 1.5rem 2rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 2rem;
    }
    .nav-left {
      display: flex;
      gap: 2rem;
      justify-content: flex-end;
    }
    .nav-right {
      display: flex;
      gap: 2rem;
      justify-content: flex-start;
    }
    .nav-left a,
    .nav-right a {
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .nav-left a:hover,
    .nav-right a:hover {
      color: #111827;
    }
    .nav-logo {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
      text-decoration: none;
      text-align: center;
    }
    .nav-cta {
      padding: 0.625rem 1.5rem;
      background: #2563eb;
      color: white !important;
      border-radius: 0.375rem;
      font-weight: 600;
    }
    .nav-cta:hover {
      background: #1d4ed8 !important;
    }
    @media (max-width: 768px) {
      .nav-container {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .nav-left,
      .nav-right {
        display: none;
      }
    }`,
    {
      logo: { type: 'text', label: 'Logo Text', default: 'BRAND' },
      link1: { type: 'text', label: 'Link 1', default: 'Home' },
      link1Url: { type: 'text', label: 'Link 1 URL', default: '/' },
      link2: { type: 'text', label: 'Link 2', default: 'Shop' },
      link2Url: { type: 'text', label: 'Link 2 URL', default: '#shop' },
      link3: { type: 'text', label: 'Link 3', default: 'Collections' },
      link3Url: { type: 'text', label: 'Link 3 URL', default: '#collections' },
      link4: { type: 'text', label: 'Link 4', default: 'About' },
      link4Url: { type: 'text', label: 'Link 4 URL', default: '#about' },
      link5: { type: 'text', label: 'Link 5', default: 'Contact' },
      link5Url: { type: 'text', label: 'Link 5 URL', default: '#contact' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Account' },
      ctaUrl: { type: 'text', label: 'CTA Button URL', default: '#account' }
    },
    {
      logo: 'BRAND',
      link1: 'Home',
      link1Url: '/',
      link2: 'Shop',
      link2Url: '#shop',
      link3: 'Collections',
      link3Url: '#collections',
      link4: 'About',
      link4Url: '#about',
      link5: 'Contact',
      link5Url: '#contact',
      ctaText: 'Account',
      ctaUrl: '#account'
    },
    ['navigation', 'split', 'centered-logo', 'balanced']
  ),

  createComponent(
    'Navigation - Sidebar',
    'Vertical sidebar navigation',
    CATEGORIES.NAVIGATION,
    'navigation',
    `<nav class="nav-sidebar">
      <div class="sidebar-header">
        <a href="/" class="sidebar-logo">{{logo}}</a>
      </div>
      <div class="sidebar-menu">
        <a href="{{link1Url}}" class="sidebar-link">
          <span class="sidebar-icon">🏠</span>
          <span>{{link1}}</span>
        </a>
        <a href="{{link2Url}}" class="sidebar-link">
          <span class="sidebar-icon">📊</span>
          <span>{{link2}}</span>
        </a>
        <a href="{{link3Url}}" class="sidebar-link">
          <span class="sidebar-icon">⚙️</span>
          <span>{{link3}}</span>
        </a>
        <a href="{{link4Url}}" class="sidebar-link">
          <span class="sidebar-icon">👤</span>
          <span>{{link4}}</span>
        </a>
      </div>
      <div class="sidebar-footer">
        <a href="{{ctaUrl}}" class="sidebar-cta">{{ctaText}}</a>
      </div>
    </nav>`,
    `.nav-sidebar {
      width: 250px;
      height: 100vh;
      background: #111827;
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
    }
    .sidebar-header {
      padding: 2rem 1.5rem;
      border-bottom: 1px solid #374151;
    }
    .sidebar-logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      text-decoration: none;
    }
    .sidebar-menu {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      color: #d1d5db;
      text-decoration: none;
      transition: all 0.2s;
    }
    .sidebar-link:hover {
      background: #1f2937;
      color: white;
    }
    .sidebar-icon {
      font-size: 1.25rem;
    }
    .sidebar-footer {
      padding: 1.5rem;
      border-top: 1px solid #374151;
    }
    .sidebar-cta {
      display: block;
      padding: 0.75rem;
      background: #2563eb;
      color: white;
      text-align: center;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.2s;
    }
    .sidebar-cta:hover {
      background: #1d4ed8;
    }
    @media (max-width: 768px) {
      .nav-sidebar {
        width: 200px;
      }
    }`,
    {
      logo: { type: 'text', label: 'Logo Text', default: 'Dashboard' },
      link1: { type: 'text', label: 'Link 1', default: 'Home' },
      link1Url: { type: 'text', label: 'Link 1 URL', default: '/' },
      link2: { type: 'text', label: 'Link 2', default: 'Analytics' },
      link2Url: { type: 'text', label: 'Link 2 URL', default: '#analytics' },
      link3: { type: 'text', label: 'Link 3', default: 'Settings' },
      link3Url: { type: 'text', label: 'Link 3 URL', default: '#settings' },
      link4: { type: 'text', label: 'Link 4', default: 'Profile' },
      link4Url: { type: 'text', label: 'Link 4 URL', default: '#profile' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Upgrade' },
      ctaUrl: { type: 'text', label: 'CTA Button URL', default: '#upgrade' }
    },
    {
      logo: 'Dashboard',
      link1: 'Home',
      link1Url: '/',
      link2: 'Analytics',
      link2Url: '#analytics',
      link3: 'Settings',
      link3Url: '#settings',
      link4: 'Profile',
      link4Url: '#profile',
      ctaText: 'Upgrade',
      ctaUrl: '#upgrade'
    },
    ['navigation', 'sidebar', 'vertical', 'fixed']
  ),

  createComponent(
    'Navigation - Mega Menu',
    'Navigation with large dropdown mega menu',
    CATEGORIES.NAVIGATION,
    'navigation',
    `<nav class="nav-mega">
      <div class="nav-container">
        <a href="/" class="nav-logo">{{logo}}</a>
        <div class="nav-menu">
          <a href="{{link1Url}}">{{link1}}</a>
          <div class="nav-mega-item">
            <a href="{{link2Url}}">{{link2}} ▾</a>
            <div class="nav-mega-menu">
              <div class="mega-column">
                <h4>{{megaCol1Title}}</h4>
                <a href="{{mega1Url}}">{{mega1}}</a>
                <a href="{{mega2Url}}">{{mega2}}</a>
                <a href="{{mega3Url}}">{{mega3}}</a>
              </div>
              <div class="mega-column">
                <h4>{{megaCol2Title}}</h4>
                <a href="{{mega4Url}}">{{mega4}}</a>
                <a href="{{mega5Url}}">{{mega5}}</a>
                <a href="{{mega6Url}}">{{mega6}}</a>
              </div>
              <div class="mega-column">
                <h4>{{megaCol3Title}}</h4>
                <a href="{{mega7Url}}">{{mega7}}</a>
                <a href="{{mega8Url}}">{{mega8}}</a>
                <a href="{{mega9Url}}">{{mega9}}</a>
              </div>
            </div>
          </div>
          <a href="{{link3Url}}">{{link3}}</a>
          <a href="{{ctaUrl}}" class="nav-cta">{{ctaText}}</a>
        </div>
      </div>
    </nav>`,
    `.nav-mega {
      padding: 1.5rem 2rem;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nav-logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      text-decoration: none;
    }
    .nav-menu {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    .nav-menu > a {
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .nav-menu > a:hover {
      color: #111827;
    }
    .nav-mega-item {
      position: relative;
    }
    .nav-mega-item > a {
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
    }
    .nav-mega-menu {
      display: none;
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 0.5rem;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      padding: 2rem;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      min-width: 600px;
    }
    .nav-mega-item:hover .nav-mega-menu {
      display: grid;
    }
    .mega-column h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .mega-column a {
      display: block;
      padding: 0.5rem 0;
      color: #6b7280;
      text-decoration: none;
      transition: color 0.2s;
    }
    .mega-column a:hover {
      color: #111827;
    }
    .nav-cta {
      padding: 0.625rem 1.5rem;
      background: #2563eb;
      color: white !important;
      border-radius: 0.375rem;
      font-weight: 600;
    }
    .nav-cta:hover {
      background: #1d4ed8 !important;
    }
    @media (max-width: 768px) {
      .nav-menu {
        display: none;
      }
    }`,
    {
      logo: { type: 'text', label: 'Logo Text', default: 'Company' },
      link1: { type: 'text', label: 'Link 1', default: 'Home' },
      link1Url: { type: 'text', label: 'Link 1 URL', default: '/' },
      link2: { type: 'text', label: 'Link 2 (Mega)', default: 'Products' },
      link2Url: { type: 'text', label: 'Link 2 URL', default: '#products' },
      megaCol1Title: { type: 'text', label: 'Mega Column 1 Title', default: 'Category 1' },
      mega1: { type: 'text', label: 'Mega Item 1', default: 'Item 1' },
      mega1Url: { type: 'text', label: 'Mega Item 1 URL', default: '#item1' },
      mega2: { type: 'text', label: 'Mega Item 2', default: 'Item 2' },
      mega2Url: { type: 'text', label: 'Mega Item 2 URL', default: '#item2' },
      mega3: { type: 'text', label: 'Mega Item 3', default: 'Item 3' },
      mega3Url: { type: 'text', label: 'Mega Item 3 URL', default: '#item3' },
      megaCol2Title: { type: 'text', label: 'Mega Column 2 Title', default: 'Category 2' },
      mega4: { type: 'text', label: 'Mega Item 4', default: 'Item 4' },
      mega4Url: { type: 'text', label: 'Mega Item 4 URL', default: '#item4' },
      mega5: { type: 'text', label: 'Mega Item 5', default: 'Item 5' },
      mega5Url: { type: 'text', label: 'Mega Item 5 URL', default: '#item5' },
      mega6: { type: 'text', label: 'Mega Item 6', default: 'Item 6' },
      mega6Url: { type: 'text', label: 'Mega Item 6 URL', default: '#item6' },
      megaCol3Title: { type: 'text', label: 'Mega Column 3 Title', default: 'Category 3' },
      mega7: { type: 'text', label: 'Mega Item 7', default: 'Item 7' },
      mega7Url: { type: 'text', label: 'Mega Item 7 URL', default: '#item7' },
      mega8: { type: 'text', label: 'Mega Item 8', default: 'Item 8' },
      mega8Url: { type: 'text', label: 'Mega Item 8 URL', default: '#item8' },
      mega9: { type: 'text', label: 'Mega Item 9', default: 'Item 9' },
      mega9Url: { type: 'text', label: 'Mega Item 9 URL', default: '#item9' },
      link3: { type: 'text', label: 'Link 3', default: 'Contact' },
      link3Url: { type: 'text', label: 'Link 3 URL', default: '#contact' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Get Started' },
      ctaUrl: { type: 'text', label: 'CTA Button URL', default: '#signup' }
    },
    {
      logo: 'Company',
      link1: 'Home',
      link1Url: '/',
      link2: 'Products',
      link2Url: '#products',
      megaCol1Title: 'Category 1',
      mega1: 'Item 1',
      mega1Url: '#item1',
      mega2: 'Item 2',
      mega2Url: '#item2',
      mega3: 'Item 3',
      mega3Url: '#item3',
      megaCol2Title: 'Category 2',
      mega4: 'Item 4',
      mega4Url: '#item4',
      mega5: 'Item 5',
      mega5Url: '#item5',
      mega6: 'Item 6',
      mega6Url: '#item6',
      megaCol3Title: 'Category 3',
      mega7: 'Item 7',
      mega7Url: '#item7',
      mega8: 'Item 8',
      mega8Url: '#item8',
      mega9: 'Item 9',
      mega9Url: '#item9',
      link3: 'Contact',
      link3Url: '#contact',
      ctaText: 'Get Started',
      ctaUrl: '#signup'
    },
    ['navigation', 'mega-menu', 'dropdown', 'large']
  )
];

// Seeding function
async function seedComponents() {
  console.log('\n🌱 Starting Navigation components seeding...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  try {
    for (const component of navigationComponents) {
      try {
        const componentData = {
          block_type: component.block_type,
          html: component.html,
          css: component.css,
          js: component.js,
          schema: component.schema,
          default_props: component.default_props,
          responsive_settings: component.responsive_settings
        };
        
        const result = await db.query(
          `INSERT INTO builder_components 
           (name, description, category, is_global, component_data, tags)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            component.name,
            component.description,
            component.category,
            component.is_global,
            JSON.stringify(componentData),
            component.tags
          ]
        );
        
        console.log(`✅ Created: ${component.name} (ID: ${result.rows[0].id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error creating ${component.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Navigation Components Seeding Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${navigationComponents.length}`);
    
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedComponents();
}

module.exports = { navigationComponents, seedComponents };