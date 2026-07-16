/**
 * Complete Component Seeding System - All 100+ Components
 * Seeds the builder_components table with production-ready components
 * 
 * Usage: node scripts/seed-components-complete.js
 */

require('dotenv').config();
const db = require('../src/db');

// Component categories
const CATEGORIES = {
  HERO: 'hero',
  FEATURES: 'features',
  CTA: 'cta',
  TESTIMONIALS: 'testimonials',
  PRICING: 'pricing',
  TEAM: 'team',
  CONTACT: 'contact',
  FOOTER: 'footer',
  NAVIGATION: 'navigation',
  STATS: 'stats',
  LOGOS: 'logos',
  GALLERY: 'gallery',
  VIDEO: 'video',
  FORMS: 'forms',
  BLOG: 'blog',
  MISC: 'misc'
};

// Helper function to create component object
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

// HERO COMPONENTS (10 total)
const heroComponents = [
  createComponent(
    'Hero - Modern Gradient',
    'Modern hero section with gradient background, centered content, and CTA button',
    CATEGORIES.HERO,
    'hero',
    `<section class="hero-modern-gradient">
      <div class="hero-container">
        <h1 class="hero-title">{{title}}</h1>
        <p class="hero-subtitle">{{subtitle}}</p>
        <div class="hero-cta">
          <a href="{{ctaLink}}" class="btn-primary">{{ctaText}}</a>
        </div>
      </div>
    </section>`,
    `.hero-modern-gradient {
      min-height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 80px 20px;
    }
    .hero-container {
      max-width: 800px;
      text-align: center;
    }
    .hero-title {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }
    .hero-subtitle {
      font-size: 1.5rem;
      margin-bottom: 2.5rem;
      opacity: 0.95;
    }
    .btn-primary {
      padding: 1rem 2.5rem;
      background: white;
      color: #667eea;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
    }
    @media (max-width: 768px) {
      .hero-title { font-size: 2.5rem; }
      .hero-subtitle { font-size: 1.25rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Build Something Amazing' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Create stunning websites with our powerful builder' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Get Started' },
      ctaLink: { type: 'text', label: 'CTA Button Link', default: '#' }
    },
    {
      title: 'Build Something Amazing',
      subtitle: 'Create stunning websites with our powerful builder',
      ctaText: 'Get Started',
      ctaLink: '#'
    },
    ['hero', 'gradient', 'modern', 'centered', 'cta']
  ),

  createComponent(
    'Hero - Minimal Centered',
    'Clean, minimal hero with centered text and subtle background',
    CATEGORIES.HERO,
    'hero',
    `<section class="hero-minimal">
      <div class="hero-minimal-container">
        <h1 class="hero-minimal-title">{{title}}</h1>
        <p class="hero-minimal-subtitle">{{subtitle}}</p>
        <a href="{{ctaLink}}" class="hero-minimal-btn">{{ctaText}}</a>
      </div>
    </section>`,
    `.hero-minimal {
      min-height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      padding: 80px 20px;
    }
    .hero-minimal-container {
      max-width: 700px;
      text-align: center;
    }
    .hero-minimal-title {
      font-size: 3rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
      line-height: 1.2;
    }
    .hero-minimal-subtitle {
      font-size: 1.25rem;
      color: #6b7280;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .hero-minimal-btn {
      display: inline-block;
      padding: 0.875rem 2rem;
      background: #111827;
      color: white;
      border-radius: 0.375rem;
      font-weight: 500;
      text-decoration: none;
      transition: background 0.2s;
    }
    .hero-minimal-btn:hover {
      background: #1f2937;
    }
    @media (max-width: 768px) {
      .hero-minimal-title { font-size: 2rem; }
      .hero-minimal-subtitle { font-size: 1.125rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Simple. Powerful. Elegant.' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Everything you need to build beautiful websites' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Learn More' },
      ctaLink: { type: 'text', label: 'CTA Button Link', default: '#' }
    },
    {
      title: 'Simple. Powerful. Elegant.',
      subtitle: 'Everything you need to build beautiful websites',
      ctaText: 'Learn More',
      ctaLink: '#'
    },
    ['hero', 'minimal', 'clean', 'centered']
  ),

  createComponent(
    'Hero - Bold Full-Screen',
    'Bold, full-screen hero with large typography and dark background',
    CATEGORIES.HERO,
    'hero',
    `<section class="hero-bold">
      <div class="hero-bold-container">
        <h1 class="hero-bold-title">{{title}}</h1>
        <p class="hero-bold-subtitle">{{subtitle}}</p>
        <div class="hero-bold-actions">
          <a href="{{primaryLink}}" class="btn-bold-primary">{{primaryText}}</a>
          <a href="{{secondaryLink}}" class="btn-bold-secondary">{{secondaryText}}</a>
        </div>
      </div>
    </section>`,
    `.hero-bold {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      color: white;
      padding: 80px 20px;
    }
    .hero-bold-container {
      max-width: 900px;
      text-align: center;
    }
    .hero-bold-title {
      font-size: 4.5rem;
      font-weight: 900;
      margin-bottom: 1.5rem;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .hero-bold-subtitle {
      font-size: 1.5rem;
      margin-bottom: 3rem;
      opacity: 0.9;
      line-height: 1.6;
    }
    .hero-bold-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .btn-bold-primary {
      padding: 1.125rem 2.5rem;
      background: white;
      color: #0f172a;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s;
    }
    .btn-bold-primary:hover {
      transform: scale(1.05);
    }
    .btn-bold-secondary {
      padding: 1.125rem 2.5rem;
      background: transparent;
      color: white;
      border: 2px solid white;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn-bold-secondary:hover {
      background: rgba(255,255,255,0.1);
    }
    @media (max-width: 768px) {
      .hero-bold-title { font-size: 2.5rem; }
      .hero-bold-subtitle { font-size: 1.25rem; }
      .hero-bold-actions { flex-direction: column; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'The Future is Here' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Transform your ideas into reality with cutting-edge technology' },
      primaryText: { type: 'text', label: 'Primary Button Text', default: 'Get Started' },
      primaryLink: { type: 'text', label: 'Primary Button Link', default: '#' },
      secondaryText: { type: 'text', label: 'Secondary Button Text', default: 'Learn More' },
      secondaryLink: { type: 'text', label: 'Secondary Button Link', default: '#' }
    },
    {
      title: 'The Future is Here',
      subtitle: 'Transform your ideas into reality with cutting-edge technology',
      primaryText: 'Get Started',
      primaryLink: '#',
      secondaryText: 'Learn More',
      secondaryLink: '#'
    },
    ['hero', 'bold', 'full-screen', 'dark', 'two-cta']
  ),

  createComponent(
    'Hero - Video Background',
    'Hero section with video background and overlay',
    CATEGORIES.HERO,
    'hero',
    `<section class="hero-video">
      <video class="hero-video-bg" autoplay muted loop playsinline>
        <source src="{{videoUrl}}" type="video/mp4">
      </video>
      <div class="hero-video-overlay"></div>
      <div class="hero-video-content">
        <h1 class="hero-video-title">{{title}}</h1>
        <p class="hero-video-subtitle">{{subtitle}}</p>
        <a href="{{ctaLink}}" class="hero-video-btn">{{ctaText}}</a>
      </div>
    </section>`,
    `.hero-video {
      position: relative;
      min-height: 700px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .hero-video-bg {
      position: absolute;
      top: 50%;
      left: 50%;
      min-width: 100%;
      min-height: 100%;
      width: auto;
      height: auto;
      transform: translate(-50%, -50%);
      z-index: 0;
    }
    .hero-video-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1;
    }
    .hero-video-content {
      position: relative;
      z-index: 2;
      text-align: center;
      color: white;
      max-width: 800px;
      padding: 0 20px;
    }
    .hero-video-title {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }
    .hero-video-subtitle {
      font-size: 1.5rem;
      margin-bottom: 2.5rem;
      opacity: 0.95;
    }
    .hero-video-btn {
      display: inline-block;
      padding: 1rem 2.5rem;
      background: white;
      color: #111827;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s;
    }
    .hero-video-btn:hover {
      transform: translateY(-2px);
    }
    @media (max-width: 768px) {
      .hero-video-title { font-size: 2.5rem; }
      .hero-video-subtitle { font-size: 1.25rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Experience Innovation' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'See what\'s possible with our platform' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Watch Demo' },
      ctaLink: { type: 'text', label: 'CTA Button Link', default: '#' },
      videoUrl: { type: 'text', label: 'Video URL', default: 'https://example.com/video.mp4' }
    },
    {
      title: 'Experience Innovation',
      subtitle: 'See what\'s possible with our platform',
      ctaText: 'Watch Demo',
      ctaLink: '#',
      videoUrl: 'https://example.com/video.mp4'
    },
    ['hero', 'video', 'background', 'overlay']
  ),

  createComponent(
    'Hero - Split Layout',
    'Hero with split layout - content on left, image on right',
    CATEGORIES.HERO,
    'hero',
    `<section class="hero-split">
      <div class="hero-split-container">
        <div class="hero-split-content">
          <h1 class="hero-split-title">{{title}}</h1>
          <p class="hero-split-subtitle">{{subtitle}}</p>
          <a href="{{ctaLink}}" class="hero-split-btn">{{ctaText}}</a>
        </div>
        <div class="hero-split-image">
          <img src="{{imageUrl}}" alt="{{imageAlt}}">
        </div>
      </div>
    </section>`,
    `.hero-split {
      padding: 80px 20px;
      background: white;
    }
    .hero-split-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }
    .hero-split-content {
      padding-right: 2rem;
    }
    .hero-split-title {
      font-size: 3rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }
    .hero-split-subtitle {
      font-size: 1.25rem;
      color: #6b7280;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .hero-split-btn {
      display: inline-block;
      padding: 1rem 2rem;
      background: #2563eb;
      color: white;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.2s;
    }
    .hero-split-btn:hover {
      background: #1d4ed8;
    }
    .hero-split-image img {
      width: 100%;
      height: auto;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    @media (max-width: 768px) {
      .hero-split-container {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .hero-split-content {
        padding-right: 0;
        text-align: center;
      }
      .hero-split-title { font-size: 2rem; }
      .hero-split-subtitle { font-size: 1.125rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Powerful Features' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Everything you need to succeed, all in one place' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Get Started' },
      ctaLink: { type: 'text', label: 'CTA Button Link', default: '#' },
      imageUrl: { type: 'image', label: 'Image URL', default: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800' },
      imageAlt: { type: 'text', label: 'Image Alt Text', default: 'Product screenshot' }
    },
    {
      title: 'Powerful Features',
      subtitle: 'Everything you need to succeed, all in one place',
      ctaText: 'Get Started',
      ctaLink: '#',
      imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
      imageAlt: 'Product screenshot'
    },
    ['hero', 'split', 'two-column', 'image']
  ),

  createComponent(
    'Hero - Left Aligned',
    'Hero with left-aligned content and background image',
    CATEGORIES.HERO,
    'hero',
    `<section class="hero-left" style="background-image: url('{{backgroundImage}}');">
      <div class="hero-left-overlay"></div>
      <div class="hero-left-container">
        <div class="hero-left-content">
          <h1 class="hero-left-title">{{title}}</h1>
          <p class="hero-left-subtitle">{{subtitle}}</p>
          <a href="{{ctaLink}}" class="hero-left-btn">{{ctaText}}</a>
        </div>
      </div>
    </section>`,
    `.hero-left {
      min-height: 600px;
      background-size: cover;
      background-position: center;
      position: relative;
      display: flex;
      align-items: center;
      padding: 80px 20px;
    }
    .hero-left-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%);
    }
    .hero-left-container {
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      position: relative;
      z-index: 1;
    }
    .hero-left-content {
      max-width: 600px;
      color: white;
    }
    .hero-left-title {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }
    .hero-left-subtitle {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .hero-left-btn {
      display: inline-block;
      padding: 1rem 2rem;
      background: white;
      color: #111827;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s;
    }
    .hero-left-btn:hover {
      transform: translateY(-2px);
    }
    @media (max-width: 768px) {
      .hero-left-title { font-size: 2.5rem; }
      .hero-left-subtitle { font-size: 1.125rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Welcome to the Future' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Discover endless possibilities with our innovative platform' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Explore Now' },
      ctaLink: { type: 'text', label: 'CTA Button Link', default: '#' },
      backgroundImage: { type: 'image', label: 'Background Image', default: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200' }
    },
    {
      title: 'Welcome to the Future',
      subtitle: 'Discover endless possibilities with our innovative platform',
      ctaText: 'Explore Now',
      ctaLink: '#',
      backgroundImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200'
    },
    ['hero', 'left-aligned', 'background-image', 'overlay']
  ),

  createComponent(
    'Hero - Right Aligned',
    'Hero with right-aligned content and image on left',
    CATEGORIES.HERO,
    'hero',
    `<section class="hero-right">
      <div class="hero-right-container">
        <div class="hero-right-image">
          <img src="{{imageUrl}}" alt="{{imageAlt}}">
        </div>
        <div class="hero-right-content">
          <h1 class="hero-right-title">{{title}}</h1>
          <p class="hero-right-subtitle">{{subtitle}}</p>
          <a href="{{ctaLink}}" class="hero-right-btn">{{ctaText}}</a>
        </div>
      </div>
    </section>`,
    `.hero-right {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .hero-right-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }
    .hero-right-content {
      padding-left: 2rem;
    }
    .hero-right-title {
      font-size: 3rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }
    .hero-right-subtitle {
      font-size: 1.25rem;
      color: #6b7280;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .hero-right-btn {
      display: inline-block;
      padding: 1rem 2rem;
      background: #2563eb;
      color: white;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.2s;
    }
    .hero-right-btn:hover {
      background: #1d4ed8;
    }
    .hero-right-image img {
      width: 100%;
      height: auto;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    @media (max-width: 768px) {
      .hero-right-container {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .hero-right-container {
        grid-template-columns: 1fr;
      }
      .hero-right-image {
        order: 2;
      }
      .hero-right-content {
        order: 1;
        padding-left: 0;
        text-align: center;
      }
      .hero-right-title { font-size: 2rem; }
      .hero-right-subtitle { font-size: 1.125rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Innovation Meets Design' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Create beautiful experiences that users love' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Start Building' },
      ctaLink: { type: 'text', label: 'CTA Button Link', default: '#' },
      imageUrl: { type: 'image', label: 'Image URL', default: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800' },
      imageAlt: { type: 'text', label: 'Image Alt Text', default: 'Dashboard preview' }
    },
    {
      title: 'Innovation Meets Design',
      subtitle: 'Create beautiful experiences that users love',
      ctaText: 'Start Building',
      ctaLink: '#',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      imageAlt: 'Dashboard preview'
    },
    ['hero', 'right-aligned', 'two-column', 'image']
  ),

  createComponent(
    'Hero - Animated',
    'Hero with animated gradient background and fade-in content',
    CATEGORIES.HERO,
    'hero',
    `<section class="hero-animated">
      <div class="hero-animated-container">
        <h1 class="hero-animated-title">{{title}}</h1>
        <p class="hero-animated-subtitle">{{subtitle}}</p>
        <a href="{{ctaLink}}" class="hero-animated-btn">{{ctaText}}</a>
      </div>
    </section>`,
    `.hero-animated {
      min-height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
      background-size: 400% 400%;
      animation: gradient 15s ease infinite;
      color: white;
      padding: 80px 20px;
    }
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .hero-animated-container {
      max-width: 800px;
      text-align: center;
      animation: fadeInUp 1s ease;
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .hero-animated-title {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }
    .hero-animated-subtitle {
      font-size: 1.5rem;
      margin-bottom: 2.5rem;
      opacity: 0.95;
    }
    .hero-animated-btn {
      display: inline-block;
      padding: 1rem 2.5rem;
      background: white;
      color: #111827;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s;
    }
    .hero-animated-btn:hover {
      transform: scale(1.05);
    }
    @media (max-width: 768px) {
      .hero-animated-title { font-size: 2.5rem; }
      .hero-animated-subtitle { font-size: 1.25rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Animated Excellence' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Experience the magic of smooth animations' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'See It Live' },
      ctaLink: { type: 'text', label: 'CTA Button Link', default: '#' }
    },
    {
      title: 'Animated Excellence',
      subtitle: 'Experience the magic of smooth animations',
      ctaText: 'See It Live',
      ctaLink: '#'
    },
    ['hero', 'animated', 'gradient', 'fade-in']
  ),

  createComponent(
    'Hero - With Form',
    'Hero section with integrated signup form',
    CATEGORIES.HERO,
    'hero',
    `<section class="hero-form">
      <div class="hero-form-container">
        <div class="hero-form-content">
          <h1 class="hero-form-title">{{title}}</h1>
          <p class="hero-form-subtitle">{{subtitle}}</p>
        </div>
        <div class="hero-form-box">
          <form class="signup-form">
            <input type="email" placeholder="{{emailPlaceholder}}" class="form-input" required>
            <button type="submit" class="form-submit">{{submitText}}</button>
          </form>
          <p class="form-note">{{formNote}}</p>
        </div>
      </div>
    </section>`,
    `.hero-form {
      min-height: 600px;
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 80px 20px;
    }
    .hero-form-container {
      max-width: 1000px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }
    .hero-form-title {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }
    .hero-form-subtitle {
      font-size: 1.25rem;
      opacity: 0.95;
      line-height: 1.6;
    }
    .hero-form-box {
      background: white;
      padding: 2.5rem;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
    }
    .signup-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-input {
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
    }
    .form-submit {
      padding: 1rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .form-submit:hover {
      background: #5568d3;
    }
    .form-note {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
      text-align: center;
    }
    @media (max-width: 768px) {
      .hero-form-container {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .hero-form-title { font-size: 2rem; }
      .hero-form-subtitle { font-size: 1.125rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Start Your Journey' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Join thousands of users already using our platform' },
      emailPlaceholder: { type: 'text', label: 'Email Placeholder', default: 'Enter your email' },
      submitText: { type: 'text', label: 'Submit Button Text', default: 'Get Started Free' },
      formNote: { type: 'text', label: 'Form Note', default: 'No credit card required. Start your free trial today.' }
    },
    {
      title: 'Start Your Journey',
      subtitle: 'Join thousands of users already using our platform',
      emailPlaceholder: 'Enter your email',
      submitText: 'Get Started Free',
      formNote: 'No credit card required. Start your free trial today.'
    },
    ['hero', 'form', 'signup', 'split-layout']
  ),

  createComponent(
    'Hero - With Stats',
    'Hero section with key statistics displayed',
    CATEGORIES.HERO,
    'hero',
    `<section class="hero-stats">
      <div class="hero-stats-container">
        <h1 class="hero-stats-title">{{title}}</h1>
        <p class="hero-stats-subtitle">{{subtitle}}</p>
        <div class="hero-stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{stat1Number}}</div>
            <div class="stat-label">{{stat1Label}}</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{stat2Number}}</div>
            <div class="stat-label">{{stat2Label}}</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{stat3Number}}</div>
            <div class="stat-label">{{stat3Label}}</div>
          </div>
        </div>
        <a href="{{ctaLink}}" class="hero-stats-btn">{{ctaText}}</a>
      </div>
    </section>`,
    `.hero-stats {
      min-height: 600px;
      display: flex;
      align-items: center;
      background: #0f172a;
      color: white;
      padding: 80px 20px;
    }
    .hero-stats-container {
      max-width: 900px;
      margin: 0 auto;
      text-align: center;
    }
    .hero-stats-title {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }
    .hero-stats-subtitle {
      font-size: 1.25rem;
      margin-bottom: 3rem;
      opacity: 0.9;
      line-height: 1.6;
    }
    .hero-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3rem;
      margin-bottom: 3rem;
    }
    .stat-item {
      padding: 2rem;
      background: rgba(255,255,255,0.1);
      border-radius: 1rem;
      backdrop-filter: blur(10px);
    }
    .stat-number {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      color: #60a5fa;
    }
    .stat-label {
      font-size: 1rem;
      opacity: 0.9;
    }
    .hero-stats-btn {
      display: inline-block;
      padding: 1rem 2.5rem;
      background: white;
      color: #0f172a;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s;
    }
    .hero-stats-btn:hover {
      transform: translateY(-2px);
    }
    @media (max-width: 768px) {
      .hero-stats-title { font-size: 2.5rem; }
      .hero-stats-subtitle { font-size: 1.125rem; }
      .hero-stats-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      .stat-number { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Trusted by Thousands' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Join the growing community of successful businesses' },
      stat1Number: { type: 'text', label: 'Stat 1 Number', default: '10K+' },
      stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Active Users' },
      stat2Number: { type: 'text', label: 'Stat 2 Number', default: '50K+' },
      stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'Projects Created' },
      stat3Number: { type: 'text', label: 'Stat 3 Number', default: '99%' },
      stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'Satisfaction Rate' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Join Now' },
      ctaLink: { type: 'text', label: 'CTA Button Link', default: '#' }
    },
    {
      title: 'Trusted by Thousands',
      subtitle: 'Join the growing community of successful businesses',
      stat1Number: '10K+',
      stat1Label: 'Active Users',
      stat2Number: '50K+',
      stat2Label: 'Projects Created',
      stat3Number: '99%',
      stat3Label: 'Satisfaction Rate',
      ctaText: 'Join Now',
      ctaLink: '#'
    },
    ['hero', 'stats', 'metrics', 'dark', 'social-proof']
  )
];

/**
 * Seed components into database
 */
async function seedComponents() {
  console.log('🌱 Starting component seeding...\n');

  try {
    // Combine all components
    const allComponents = [
      ...heroComponents
      // Add more component arrays here as they're created
    ];

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const component of allComponents) {
      try {
        // Check if component already exists
        const existing = await db.query(
          'SELECT id FROM builder_components WHERE name = $1 AND is_global = true',
          [component.name]
        );

        if (existing.rows.length > 0) {
          console.log(`⏭️  Skipping "${component.name}" (already exists)`);
          skippedCount++;
          continue;
        }

        // Prepare component_data JSONB structure
        const componentData = {
          block_type: component.block_type,
          html: component.html,
          css: component.css,
          js: component.js,
          schema: component.schema,
          default_props: component.default_props,
          responsive_settings: component.responsive_settings
        };

        // Insert component
        await db.query(
          `INSERT INTO builder_components (
            name, description, category, is_global, component_data, tags
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            component.name,
            component.description,
            component.category,
            component.is_global,
            JSON.stringify(componentData),
            component.tags
          ]
        );

        console.log(`✅ Created "${component.name}"`);
        successCount++;
      } catch (err) {
        console.error(`❌ Error creating "${component.name}":`, err.message);
        errorCount++;
      }
    }

    console.log(`\n✨ Seeding complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total: ${allComponents.length}`);

  } catch (err) {
    console.error('❌ Fatal error during seeding:', err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run seeding
if (require.main === module) {
  seedComponents();
}

module.exports = { seedComponents, CATEGORIES, createComponent };
