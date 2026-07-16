/**
 * Component Seeding System
 * Seeds the builder_components table with pre-built, production-ready components
 * 
 * Usage: node scripts/seed-components.js
 */

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

// Hero Components (10 variants)
const heroComponents = [
  {
    name: 'Hero - Modern Gradient',
    description: 'Modern hero section with gradient background, centered content, and CTA button',
    category: CATEGORIES.HERO,
    block_type: 'hero',
    is_global: true,
    html: `
      <section class="hero-modern-gradient">
        <div class="hero-container">
          <h1 class="hero-title">{{title}}</h1>
          <p class="hero-subtitle">{{subtitle}}</p>
          <div class="hero-cta">
            <a href="{{ctaLink}}" class="btn-primary">{{ctaText}}</a>
          </div>
        </div>
      </section>
    `,
    css: `
      .hero-modern-gradient {
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
      .hero-cta {
        display: flex;
        justify-content: center;
        gap: 1rem;
      }
      .btn-primary {
        padding: 1rem 2.5rem;
        background: white;
        color: #667eea;
        border-radius: 0.5rem;
        font-weight: 600;
        text-decoration: none;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      }
      @media (max-width: 768px) {
        .hero-title { font-size: 2.5rem; }
        .hero-subtitle { font-size: 1.25rem; }
      }
    `,
    schema: {
      title: { type: 'text', label: 'Title', default: 'Build Something Amazing' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Create stunning websites with our powerful builder' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Get Started' },
      ctaLink: { type: 'text', label: 'CTA Button Link', default: '#' }
    },
    default_props: {
      title: 'Build Something Amazing',
      subtitle: 'Create stunning websites with our powerful builder',
      ctaText: 'Get Started',
      ctaLink: '#'
    },
    tags: ['hero', 'gradient', 'modern', 'centered', 'cta'],
    responsive_settings: {
      mobile: { fontSize: 'smaller', padding: 'reduced' },
      tablet: { fontSize: 'medium', padding: 'normal' }
    }
  },
  {
    name: 'Hero - Minimal Centered',
    description: 'Clean, minimal hero with centered text and subtle background',
    category: CATEGORIES.HERO,
    block_type: 'hero',
    is_global: true,
    html: `
      <section class="hero-minimal">
        <div class="hero-minimal-container">
          <h1 class="hero-minimal-title">{{title}}</h1>
          <p class="hero-minimal-subtitle">{{subtitle}}</p>
          <a href="{{ctaLink}}" class="hero-minimal-btn">{{ctaText}}</a>
        </div>
      </section>
    `,
    css: `
      .hero-minimal {
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
      }
    `,
    schema: {
      title: { type: 'text', label: 'Title', default: 'Simple. Powerful. Elegant.' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Everything you need to build beautiful websites' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Learn More' },
      ctaLink: { type: 'text', label: 'CTA Button Link', default: '#' }
    },
    default_props: {
      title: 'Simple. Powerful. Elegant.',
      subtitle: 'Everything you need to build beautiful websites',
      ctaText: 'Learn More',
      ctaLink: '#'
    },
    tags: ['hero', 'minimal', 'clean', 'centered'],
    responsive_settings: {
      mobile: { fontSize: 'smaller' },
      tablet: { fontSize: 'medium' }
    }
  },
  {
    name: 'Hero - Bold Full-Screen',
    description: 'Bold, full-screen hero with large typography and dark background',
    category: CATEGORIES.HERO,
    block_type: 'hero',
    is_global: true,
    html: `
      <section class="hero-bold">
        <div class="hero-bold-container">
          <h1 class="hero-bold-title">{{title}}</h1>
          <p class="hero-bold-subtitle">{{subtitle}}</p>
          <div class="hero-bold-actions">
            <a href="{{primaryLink}}" class="btn-bold-primary">{{primaryText}}</a>
            <a href="{{secondaryLink}}" class="btn-bold-secondary">{{secondaryText}}</a>
          </div>
        </div>
      </section>
    `,
    css: `
      .hero-bold {
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
      }
    `,
    schema: {
      title: { type: 'text', label: 'Title', default: 'The Future is Here' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Transform your ideas into reality with cutting-edge technology' },
      primaryText: { type: 'text', label: 'Primary Button Text', default: 'Get Started' },
      primaryLink: { type: 'text', label: 'Primary Button Link', default: '#' },
      secondaryText: { type: 'text', label: 'Secondary Button Text', default: 'Learn More' },
      secondaryLink: { type: 'text', label: 'Secondary Button Link', default: '#' }
    },
    default_props: {
      title: 'The Future is Here',
      subtitle: 'Transform your ideas into reality with cutting-edge technology',
      primaryText: 'Get Started',
      primaryLink: '#',
      secondaryText: 'Learn More',
      secondaryLink: '#'
    },
    tags: ['hero', 'bold', 'full-screen', 'dark', 'two-cta'],
    responsive_settings: {
      mobile: { fontSize: 'smaller', minHeight: '80vh' },
      tablet: { fontSize: 'medium', minHeight: '90vh' }
    }
  },
  {
    name: 'Hero - Video Background',
    description: 'Hero section with video background and overlay',
    category: CATEGORIES.HERO,
    block_type: 'hero',
    is_global: true,
    html: `
      <section class="hero-video">
        <video class="hero-video-bg" autoplay muted loop playsinline>
          <source src="{{videoUrl}}" type="video/mp4">
        </video>
        <div class="hero-video-overlay"></div>
        <div class="hero-video-content">
          <h1 class="hero-video-title">{{title}}</h1>
          <p class="hero-video-subtitle">{{subtitle}}</p>
          <a href="{{ctaLink}}" class="hero-video-btn">{{ctaText}}</a>
        </div>
      </section>
    `,
    css: `
      .hero-video {
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
      }
    `,
    schema: {
      title: { type: 'text', label: 'Title', default: 'Experience Innovation' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'See what\'s possible with our platform' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Watch Demo' },
      ctaLink: { type: 'text', label: 'CTA Button Link', default: '#' },
      videoUrl: { type: 'text', label: 'Video URL', default: 'https://example.com/video.mp4' }
    },
    default_props: {
      title: 'Experience Innovation',
      subtitle: 'See what\'s possible with our platform',
      ctaText: 'Watch Demo',
      ctaLink: '#',
      videoUrl: 'https://example.com/video.mp4'
    },
    tags: ['hero', 'video', 'background', 'overlay'],
    responsive_settings: {
      mobile: { fontSize: 'smaller', minHeight: '500px' },
      tablet: { fontSize: 'medium', minHeight: '600px' }
    }
  },
  {
    name: 'Hero - Split Layout',
    description: 'Hero with split layout - content on left, image on right',
    category: CATEGORIES.HERO,
    block_type: 'hero',
    is_global: true,
    html: `
      <section class="hero-split">
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
      </section>
    `,
    css: `
      .hero-split {
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
      }
    `,
    schema: {
      title: { type: 'text', label: 'Title', default: 'Powerful Features' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Everything you need to succeed, all in one place' },
      ctaText: { type: 'text', label: 'CTA Button Text', default: 'Get Started' },
      ctaLink: { type: 'text', label: 'CTA Button Link', default: '#' },
      imageUrl: { type: 'image', label: 'Image URL', default: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800' },
      imageAlt: { type: 'text', label: 'Image Alt Text', default: 'Product screenshot' }
    },
    default_props: {
      title: 'Powerful Features',
      subtitle: 'Everything you need to succeed, all in one place',
      ctaText: 'Get Started',
      ctaLink: '#',
      imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
      imageAlt: 'Product screenshot'
    },
    tags: ['hero', 'split', 'two-column', 'image'],
    responsive_settings: {
      mobile: { layout: 'stacked', fontSize: 'smaller' },
      tablet: { layout: 'stacked', fontSize: 'medium' }
    }
  }
];

// Feature Components (10 variants)
const featureComponents = [
  {
    name: 'Features - 3 Column Grid',
    description: 'Three-column feature grid with icons',
    category: CATEGORIES.FEATURES,
    block_type: 'features',
    is_global: true,
    html: `
      <section class="features-grid-3">
        <div class="features-container">
          <h2 class="features-title">{{title}}</h2>
          <p class="features-subtitle">{{subtitle}}</p>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">{{icon1}}</div>
              <h3 class="feature-title">{{feature1Title}}</h3>
              <p class="feature-description">{{feature1Description}}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">{{icon2}}</div>
              <h3 class="feature-title">{{feature2Title}}</h3>
              <p class="feature-description">{{feature2Description}}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">{{icon3}}</div>
              <h3 class="feature-title">{{feature3Title}}</h3>
              <p class="feature-description">{{feature3Description}}</p>
            </div>
          </div>
        </div>
      </section>
    `,
    css: `
      .features-grid-3 {
        padding: 80px 20px;
        background: white;
      }
      .features-container {
        max-width: 1200px;
        margin: 0 auto;
      }
      .features-title {
        font-size: 2.5rem;
        font-weight: 700;
        text-align: center;
        color: #111827;
        margin-bottom: 1rem;
      }
      .features-subtitle {
        font-size: 1.25rem;
        text-align: center;
        color: #6b7280;
        margin-bottom: 4rem;
        max-width: 700px;
        margin-left: auto;
        margin-right: auto;
      }
      .features-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 3rem;
      }
      .feature-card {
        text-align: center;
      }
      .feature-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 1.5rem;
        background: #dbeafe;
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
      }
      .feature-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
        margin-bottom: 0.75rem;
      }
      .feature-description {
        color: #6b7280;
        line-height: 1.6;
      }
      @media (max-width: 768px) {
        .features-grid {
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        .features-title { font-size: 2rem; }
      }
    `,
    schema: {
      title: { type: 'text', label: 'Section Title', default: 'Amazing Features' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Everything you need to build great products' },
      icon1: { type: 'text', label: 'Feature 1 Icon', default: '⚡' },
      feature1Title: { type: 'text', label: 'Feature 1 Title', default: 'Lightning Fast' },
      feature1Description: { type: 'textarea', label: 'Feature 1 Description', default: 'Optimized for speed and performance' },
      icon2: { type: 'text', label: 'Feature 2 Icon', default: '🔒' },
      feature2Title: { type: 'text', label: 'Feature 2 Title', default: 'Secure' },
      feature2Description: { type: 'textarea', label: 'Feature 2 Description', default: 'Enterprise-grade security built-in' },
      icon3: { type: 'text', label: 'Feature 3 Icon', default: '🎨' },
      feature3Title: { type: 'text', label: 'Feature 3 Title', default: 'Beautiful' },
      feature3Description: { type: 'textarea', label: 'Feature 3 Description', default: 'Stunning designs out of the box' }
    },
    default_props: {
      title: 'Amazing Features',
      subtitle: 'Everything you need to build great products',
      icon1: '⚡',
      feature1Title: 'Lightning Fast',
      feature1Description: 'Optimized for speed and performance',
      icon2: '🔒',
      feature2Title: 'Secure',
      feature2Description: 'Enterprise-grade security built-in',
      icon3: '🎨',
      feature3Title: 'Beautiful',
      feature3Description: 'Stunning designs out of the box'
    },
    tags: ['features', 'grid', '3-column', 'icons'],
    responsive_settings: {
      mobile: { columns: 1 },
      tablet: { columns: 2 }
    }
  }
];

// CTA Components (5 variants)
const ctaComponents = [
  {
    name: 'CTA - Centered',
    description: 'Centered call-to-action with gradient background',
    category: CATEGORIES.CTA,
    block_type: 'cta',
    is_global: true,
    html: `
      <section class="cta-centered">
        <div class="cta-container">
          <h2 class="cta-title">{{title}}</h2>
          <p class="cta-subtitle">{{subtitle}}</p>
          <a href="{{ctaLink}}" class="cta-btn">{{ctaText}}</a>
        </div>
      </section>
    `,
    css: `
      .cta-centered {
        padding: 80px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .cta-container {
        max-width: 800px;
        margin: 0 auto;
        text-align: center;
      }
      .cta-title {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
      }
      .cta-subtitle {
        font-size: 1.25rem;
        margin-bottom: 2rem;
        opacity: 0.95;
      }
      .cta-btn {
        display: inline-block;
        padding: 1rem 2.5rem;
        background: white;
        color: #667eea;
        border-radius: 0.5rem;
        font-weight: 600;
        text-decoration: none;
        transition: transform 0.2s;
      }
      .cta-btn:hover {
        transform: translateY(-2px);
      }
      @media (max-width: 768px) {
        .cta-title { font-size: 2rem; }
        .cta-subtitle { font-size: 1.125rem; }
      }
    `,
    schema: {
      title: { type: 'text', label: 'Title', default: 'Ready to Get Started?' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Join thousands of satisfied customers today' },
      ctaText: { type: 'text', label: 'Button Text', default: 'Sign Up Now' },
      ctaLink: { type: 'text', label: 'Button Link', default: '#' }
    },
    default_props: {
      title: 'Ready to Get Started?',
      subtitle: 'Join thousands of satisfied customers today',
      ctaText: 'Sign Up Now',
      ctaLink: '#'
    },
    tags: ['cta', 'centered', 'gradient'],
    responsive_settings: {
      mobile: { fontSize: 'smaller' },
      tablet: { fontSize: 'medium' }
    }
  }
];

/**
 * Seed components into database
 */
async function seedComponents() {
  console.log('🌱 Starting component seeding...\n');

  try {
    // Combine all components
    const allComponents = [
      ...heroComponents,
      ...featureComponents,
      ...ctaComponents
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const component of allComponents) {
      try {
        // Check if component already exists
        const existing = await db.query(
          'SELECT id FROM builder_components WHERE name = $1 AND is_global = true',
          [component.name]
        );

        if (existing.rows.length > 0) {
          console.log(`⏭️  Skipping "${component.name}" (already exists)`);
          continue;
        }

        // Insert component
        await db.query(
          `INSERT INTO builder_components (
            org_id, name, description, category, block_type, is_global,
            html, css, js, schema, default_props, tags, responsive_settings
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            null, // org_id is null for global components
            component.name,
            component.description,
            component.category,
            component.block_type,
            component.is_global,
            component.html,
            component.css,
            component.js || null,
            JSON.stringify(component.schema),
            JSON.stringify(component.default_props),
            component.tags,
            JSON.stringify(component.responsive_settings)
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

module.exports = { seedComponents, CATEGORIES };
