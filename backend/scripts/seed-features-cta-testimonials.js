/**
 * Feature, CTA, and Testimonial Components
 * Part of Week 1 component creation
 * 
 * Usage: node scripts/seed-features-cta-testimonials.js
 */

require('dotenv').config();
const db = require('../src/db');

const CATEGORIES = {
  FEATURES: 'features',
  CTA: 'cta',
  TESTIMONIALS: 'testimonials'
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

// FEATURE COMPONENTS (10 total)
const featureComponents = [
  createComponent(
    'Features - 3 Column Grid',
    'Three-column feature grid with icons',
    CATEGORIES.FEATURES,
    'features',
    `<section class="features-grid-3">
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
    </section>`,
    `.features-grid-3 {
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
    }`,
    {
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
    {
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
    ['features', 'grid', '3-column', 'icons']
  ),

  createComponent(
    'Features - 4 Column Grid',
    'Four-column feature grid with icons',
    CATEGORIES.FEATURES,
    'features',
    `<section class="features-grid-4">
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
          <div class="feature-card">
            <div class="feature-icon">{{icon4}}</div>
            <h3 class="feature-title">{{feature4Title}}</h3>
            <p class="feature-description">{{feature4Description}}</p>
          </div>
        </div>
      </div>
    </section>`,
    `.features-grid-4 {
      padding: 80px 20px;
      background: #f9fafb;
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
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
    }
    .feature-card {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 1rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .feature-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 1rem;
      background: #dbeafe;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
    }
    .feature-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .feature-description {
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.6;
    }
    @media (max-width: 1024px) {
      .features-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 768px) {
      .features-grid {
        grid-template-columns: 1fr;
      }
      .features-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Why Choose Us' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Discover what makes us different' },
      icon1: { type: 'text', label: 'Feature 1 Icon', default: '🚀' },
      feature1Title: { type: 'text', label: 'Feature 1 Title', default: 'Fast Setup' },
      feature1Description: { type: 'textarea', label: 'Feature 1 Description', default: 'Get started in minutes' },
      icon2: { type: 'text', label: 'Feature 2 Icon', default: '💎' },
      feature2Title: { type: 'text', label: 'Feature 2 Title', default: 'Premium Quality' },
      feature2Description: { type: 'textarea', label: 'Feature 2 Description', default: 'Built with excellence' },
      icon3: { type: 'text', label: 'Feature 3 Icon', default: '🛡️' },
      feature3Title: { type: 'text', label: 'Feature 3 Title', default: 'Secure' },
      feature3Description: { type: 'textarea', label: 'Feature 3 Description', default: 'Your data is safe' },
      icon4: { type: 'text', label: 'Feature 4 Icon', default: '📈' },
      feature4Title: { type: 'text', label: 'Feature 4 Title', default: 'Scalable' },
      feature4Description: { type: 'textarea', label: 'Feature 4 Description', default: 'Grows with your business' }
    },
    {
      title: 'Why Choose Us',
      subtitle: 'Discover what makes us different',
      icon1: '🚀',
      feature1Title: 'Fast Setup',
      feature1Description: 'Get started in minutes',
      icon2: '💎',
      feature2Title: 'Premium Quality',
      feature2Description: 'Built with excellence',
      icon3: '🛡️',
      feature3Title: 'Secure',
      feature3Description: 'Your data is safe',
      icon4: '📈',
      feature4Title: 'Scalable',
      feature4Description: 'Grows with your business'
    },
    ['features', 'grid', '4-column', 'icons', 'cards']
  ),

  createComponent(
    'Features - List with Icons',
    'Vertical list of features with icons on the left',
    CATEGORIES.FEATURES,
    'features',
    `<section class="features-list">
      <div class="features-container">
        <h2 class="features-title">{{title}}</h2>
        <p class="features-subtitle">{{subtitle}}</p>
        <div class="features-list-items">
          <div class="feature-item">
            <div class="feature-icon">{{icon1}}</div>
            <div class="feature-content">
              <h3 class="feature-title">{{feature1Title}}</h3>
              <p class="feature-description">{{feature1Description}}</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">{{icon2}}</div>
            <div class="feature-content">
              <h3 class="feature-title">{{feature2Title}}</h3>
              <p class="feature-description">{{feature2Description}}</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">{{icon3}}</div>
            <div class="feature-content">
              <h3 class="feature-title">{{feature3Title}}</h3>
              <p class="feature-description">{{feature3Description}}</p>
            </div>
          </div>
        </div>
      </div>
    </section>`,
    `.features-list {
      padding: 80px 20px;
      background: white;
    }
    .features-container {
      max-width: 800px;
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
    }
    .features-list-items {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }
    .feature-item {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
    }
    .feature-icon {
      width: 64px;
      height: 64px;
      flex-shrink: 0;
      background: #dbeafe;
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }
    .feature-content {
      flex: 1;
    }
    .feature-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .feature-description {
      color: #6b7280;
      line-height: 1.6;
    }
    @media (max-width: 768px) {
      .features-title { font-size: 2rem; }
      .feature-item {
        flex-direction: column;
        gap: 1rem;
      }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Key Features' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Everything you need in one place' },
      icon1: { type: 'text', label: 'Feature 1 Icon', default: '✨' },
      feature1Title: { type: 'text', label: 'Feature 1 Title', default: 'Easy to Use' },
      feature1Description: { type: 'textarea', label: 'Feature 1 Description', default: 'Intuitive interface designed for everyone' },
      icon2: { type: 'text', label: 'Feature 2 Icon', default: '⚙️' },
      feature2Title: { type: 'text', label: 'Feature 2 Title', default: 'Powerful Tools' },
      feature2Description: { type: 'textarea', label: 'Feature 2 Description', default: 'Advanced features for professionals' },
      icon3: { type: 'text', label: 'Feature 3 Icon', default: '🌐' },
      feature3Title: { type: 'text', label: 'Feature 3 Title', default: 'Global Reach' },
      feature3Description: { type: 'textarea', label: 'Feature 3 Description', default: 'Available worldwide, 24/7 support' }
    },
    {
      title: 'Key Features',
      subtitle: 'Everything you need in one place',
      icon1: '✨',
      feature1Title: 'Easy to Use',
      feature1Description: 'Intuitive interface designed for everyone',
      icon2: '⚙️',
      feature2Title: 'Powerful Tools',
      feature2Description: 'Advanced features for professionals',
      icon3: '🌐',
      feature3Title: 'Global Reach',
      feature3Description: 'Available worldwide, 24/7 support'
    },
    ['features', 'list', 'vertical', 'icons']
  ),

  createComponent(
    'Features - Cards with Images',
    'Feature cards with images and descriptions',
    CATEGORIES.FEATURES,
    'features',
    `<section class="features-cards-images">
      <div class="features-container">
        <h2 class="features-title">{{title}}</h2>
        <p class="features-subtitle">{{subtitle}}</p>
        <div class="features-grid">
          <div class="feature-card">
            <img src="{{image1}}" alt="{{feature1Title}}" class="feature-image">
            <div class="feature-content">
              <h3 class="feature-title">{{feature1Title}}</h3>
              <p class="feature-description">{{feature1Description}}</p>
            </div>
          </div>
          <div class="feature-card">
            <img src="{{image2}}" alt="{{feature2Title}}" class="feature-image">
            <div class="feature-content">
              <h3 class="feature-title">{{feature2Title}}</h3>
              <p class="feature-description">{{feature2Description}}</p>
            </div>
          </div>
          <div class="feature-card">
            <img src="{{image3}}" alt="{{feature3Title}}" class="feature-image">
            <div class="feature-content">
              <h3 class="feature-title">{{feature3Title}}</h3>
              <p class="feature-description">{{feature3Description}}</p>
            </div>
          </div>
        </div>
      </div>
    </section>`,
    `.features-cards-images {
      padding: 80px 20px;
      background: #f9fafb;
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
      gap: 2rem;
    }
    .feature-card {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .feature-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    .feature-content {
      padding: 2rem;
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
      }
      .features-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Our Services' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Comprehensive solutions for your needs' },
      image1: { type: 'image', label: 'Feature 1 Image', default: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400' },
      feature1Title: { type: 'text', label: 'Feature 1 Title', default: 'Design' },
      feature1Description: { type: 'textarea', label: 'Feature 1 Description', default: 'Beautiful, modern designs that convert' },
      image2: { type: 'image', label: 'Feature 2 Image', default: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400' },
      feature2Title: { type: 'text', label: 'Feature 2 Title', default: 'Development' },
      feature2Description: { type: 'textarea', label: 'Feature 2 Description', default: 'Robust, scalable solutions' },
      image3: { type: 'image', label: 'Feature 3 Image', default: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400' },
      feature3Title: { type: 'text', label: 'Feature 3 Title', default: 'Marketing' },
      feature3Description: { type: 'textarea', label: 'Feature 3 Description', default: 'Strategies that drive growth' }
    },
    {
      title: 'Our Services',
      subtitle: 'Comprehensive solutions for your needs',
      image1: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400',
      feature1Title: 'Design',
      feature1Description: 'Beautiful, modern designs that convert',
      image2: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
      feature2Title: 'Development',
      feature2Description: 'Robust, scalable solutions',
      image3: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400',
      feature3Title: 'Marketing',
      feature3Description: 'Strategies that drive growth'
    },
    ['features', 'cards', 'images', 'grid']
  ),

  createComponent(
    'Features - Comparison Table',
    'Feature comparison table with checkmarks',
    CATEGORIES.FEATURES,
    'features',
    `<section class="features-comparison">
      <div class="features-container">
        <h2 class="features-title">{{title}}</h2>
        <p class="features-subtitle">{{subtitle}}</p>
        <div class="comparison-table">
          <div class="comparison-row header">
            <div class="comparison-cell">Feature</div>
            <div class="comparison-cell">Basic</div>
            <div class="comparison-cell">Pro</div>
            <div class="comparison-cell">Enterprise</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell">{{feature1}}</div>
            <div class="comparison-cell">✓</div>
            <div class="comparison-cell">✓</div>
            <div class="comparison-cell">✓</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell">{{feature2}}</div>
            <div class="comparison-cell">—</div>
            <div class="comparison-cell">✓</div>
            <div class="comparison-cell">✓</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell">{{feature3}}</div>
            <div class="comparison-cell">—</div>
            <div class="comparison-cell">—</div>
            <div class="comparison-cell">✓</div>
          </div>
        </div>
      </div>
    </section>`,
    `.features-comparison {
      padding: 80px 20px;
      background: white;
    }
    .features-container {
      max-width: 1000px;
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
    }
    .comparison-table {
      border: 1px solid #e5e7eb;
      border-radius: 1rem;
      overflow: hidden;
    }
    .comparison-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      border-bottom: 1px solid #e5e7eb;
    }
    .comparison-row:last-child {
      border-bottom: none;
    }
    .comparison-row.header {
      background: #f9fafb;
      font-weight: 600;
    }
    .comparison-cell {
      padding: 1.5rem;
      text-align: center;
      border-right: 1px solid #e5e7eb;
    }
    .comparison-cell:first-child {
      text-align: left;
    }
    .comparison-cell:last-child {
      border-right: none;
    }
    @media (max-width: 768px) {
      .comparison-row {
        grid-template-columns: 1fr;
      }
      .comparison-cell {
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
      }
      .comparison-cell:last-child {
        border-bottom: none;
      }
      .features-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Compare Plans' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Choose the plan that fits your needs' },
      feature1: { type: 'text', label: 'Feature 1', default: 'Basic Features' },
      feature2: { type: 'text', label: 'Feature 2', default: 'Advanced Analytics' },
      feature3: { type: 'text', label: 'Feature 3', default: 'Priority Support' }
    },
    {
      title: 'Compare Plans',
      subtitle: 'Choose the plan that fits your needs',
      feature1: 'Basic Features',
      feature2: 'Advanced Analytics',
      feature3: 'Priority Support'
    },
    ['features', 'comparison', 'table', 'pricing']
  ),

  createComponent(
    'Features - Timeline',
    'Feature timeline showing process or history',
    CATEGORIES.FEATURES,
    'features',
    `<section class="features-timeline">
      <div class="features-container">
        <h2 class="features-title">{{title}}</h2>
        <p class="features-subtitle">{{subtitle}}</p>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-marker">1</div>
            <div class="timeline-content">
              <h3 class="timeline-title">{{step1Title}}</h3>
              <p class="timeline-description">{{step1Description}}</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-marker">2</div>
            <div class="timeline-content">
              <h3 class="timeline-title">{{step2Title}}</h3>
              <p class="timeline-description">{{step2Description}}</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-marker">3</div>
            <div class="timeline-content">
              <h3 class="timeline-title">{{step3Title}}</h3>
              <p class="timeline-description">{{step3Description}}</p>
            </div>
          </div>
        </div>
      </div>
    </section>`,
    `.features-timeline {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .features-container {
      max-width: 800px;
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
    }
    .timeline {
      position: relative;
      padding-left: 3rem;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 1.5rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e5e7eb;
    }
    .timeline-item {
      position: relative;
      margin-bottom: 3rem;
    }
    .timeline-item:last-child {
      margin-bottom: 0;
    }
    .timeline-marker {
      position: absolute;
      left: -3rem;
      width: 3rem;
      height: 3rem;
      background: #2563eb;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
    }
    .timeline-content {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .timeline-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .timeline-description {
      color: #6b7280;
      line-height: 1.6;
    }
    @media (max-width: 768px) {
      .features-title { font-size: 2rem; }
      .timeline {
        padding-left: 2rem;
      }
      .timeline-marker {
        left: -2rem;
        width: 2.5rem;
        height: 2.5rem;
        font-size: 1rem;
      }
      .timeline::before {
        left: 1.25rem;
      }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'How It Works' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Simple steps to get started' },
      step1Title: { type: 'text', label: 'Step 1 Title', default: 'Sign Up' },
      step1Description: { type: 'textarea', label: 'Step 1 Description', default: 'Create your account in seconds' },
      step2Title: { type: 'text', label: 'Step 2 Title', default: 'Configure' },
      step2Description: { type: 'textarea', label: 'Step 2 Description', default: 'Set up your preferences' },
      step3Title: { type: 'text', label: 'Step 3 Title', default: 'Launch' },
      step3Description: { type: 'textarea', label: 'Step 3 Description', default: 'Go live and start growing' }
    },
    {
      title: 'How It Works',
      subtitle: 'Simple steps to get started',
      step1Title: 'Sign Up',
      step1Description: 'Create your account in seconds',
      step2Title: 'Configure',
      step2Description: 'Set up your preferences',
      step3Title: 'Launch',
      step3Description: 'Go live and start growing'
    },
    ['features', 'timeline', 'process', 'steps']
  ),

  createComponent(
    'Features - Process Steps',
    'Horizontal process steps with numbers',
    CATEGORIES.FEATURES,
    'features',
    `<section class="features-process">
      <div class="features-container">
        <h2 class="features-title">{{title}}</h2>
        <p class="features-subtitle">{{subtitle}}</p>
        <div class="process-steps">
          <div class="process-step">
            <div class="step-number">01</div>
            <h3 class="step-title">{{step1Title}}</h3>
            <p class="step-description">{{step1Description}}</p>
          </div>
          <div class="process-arrow">→</div>
          <div class="process-step">
            <div class="step-number">02</div>
            <h3 class="step-title">{{step2Title}}</h3>
            <p class="step-description">{{step2Description}}</p>
          </div>
          <div class="process-arrow">→</div>
          <div class="process-step">
            <div class="step-number">03</div>
            <h3 class="step-title">{{step3Title}}</h3>
            <p class="step-description">{{step3Description}}</p>
          </div>
        </div>
      </div>
    </section>`,
    `.features-process {
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
    }
    .process-steps {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
    }
    .process-step {
      flex: 1;
      text-align: center;
    }
    .step-number {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 700;
    }
    .step-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.75rem;
    }
    .step-description {
      color: #6b7280;
      line-height: 1.6;
    }
    .process-arrow {
      font-size: 2rem;
      color: #d1d5db;
      flex-shrink: 0;
    }
    @media (max-width: 768px) {
      .process-steps {
        flex-direction: column;
      }
      .process-arrow {
        transform: rotate(90deg);
      }
      .features-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Our Process' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'From concept to completion' },
      step1Title: { type: 'text', label: 'Step 1 Title', default: 'Discover' },
      step1Description: { type: 'textarea', label: 'Step 1 Description', default: 'We learn about your goals' },
      step2Title: { type: 'text', label: 'Step 2 Title', default: 'Design' },
      step2Description: { type: 'textarea', label: 'Step 2 Description', default: 'We create the perfect solution' },
      step3Title: { type: 'text', label: 'Step 3 Title', default: 'Deliver' },
      step3Description: { type: 'textarea', label: 'Step 3 Description', default: 'We launch your project' }
    },
    {
      title: 'Our Process',
      subtitle: 'From concept to completion',
      step1Title: 'Discover',
      step1Description: 'We learn about your goals',
      step2Title: 'Design',
      step2Description: 'We create the perfect solution',
      step3Title: 'Deliver',
      step3Description: 'We launch your project'
    },
    ['features', 'process', 'steps', 'horizontal']
  ),

  createComponent(
    'Features - Benefits Grid',
    'Grid of benefits with checkmarks',
    CATEGORIES.FEATURES,
    'features',
    `<section class="features-benefits">
      <div class="features-container">
        <h2 class="features-title">{{title}}</h2>
        <p class="features-subtitle">{{subtitle}}</p>
        <div class="benefits-grid">
          <div class="benefit-item">
            <div class="benefit-check">✓</div>
            <p class="benefit-text">{{benefit1}}</p>
          </div>
          <div class="benefit-item">
            <div class="benefit-check">✓</div>
            <p class="benefit-text">{{benefit2}}</p>
          </div>
          <div class="benefit-item">
            <div class="benefit-check">✓</div>
            <p class="benefit-text">{{benefit3}}</p>
          </div>
          <div class="benefit-item">
            <div class="benefit-check">✓</div>
            <p class="benefit-text">{{benefit4}}</p>
          </div>
          <div class="benefit-item">
            <div class="benefit-check">✓</div>
            <p class="benefit-text">{{benefit5}}</p>
          </div>
          <div class="benefit-item">
            <div class="benefit-check">✓</div>
            <p class="benefit-text">{{benefit6}}</p>
          </div>
        </div>
      </div>
    </section>`,
    `.features-benefits {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .features-container {
      max-width: 1000px;
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
    }
    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }
    .benefit-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      background: white;
      padding: 1.5rem;
      border-radius: 0.75rem;
    }
    .benefit-check {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      background: #10b981;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    .benefit-text {
      color: #111827;
      font-size: 1.125rem;
      line-height: 1.6;
    }
    @media (max-width: 768px) {
      .benefits-grid {
        grid-template-columns: 1fr;
      }
      .features-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Why Choose Us' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'All the benefits you need' },
      benefit1: { type: 'text', label: 'Benefit 1', default: 'No credit card required' },
      benefit2: { type: 'text', label: 'Benefit 2', default: 'Cancel anytime' },
      benefit3: { type: 'text', label: 'Benefit 3', default: '24/7 customer support' },
      benefit4: { type: 'text', label: 'Benefit 4', default: 'Free updates forever' },
      benefit5: { type: 'text', label: 'Benefit 5', default: 'Money-back guarantee' },
      benefit6: { type: 'text', label: 'Benefit 6', default: 'Secure and reliable' }
    },
    {
      title: 'Why Choose Us',
      subtitle: 'All the benefits you need',
      benefit1: 'No credit card required',
      benefit2: 'Cancel anytime',
      benefit3: '24/7 customer support',
      benefit4: 'Free updates forever',
      benefit5: 'Money-back guarantee',
      benefit6: 'Secure and reliable'
    },
    ['features', 'benefits', 'grid', 'checkmarks']
  ),

  createComponent(
    'Features - Showcase',
    'Large feature showcase with image and content side-by-side',
    CATEGORIES.FEATURES,
    'features',
    `<section class="features-showcase">
      <div class="features-container">
        <div class="showcase-item">
          <div class="showcase-content">
            <h2 class="showcase-title">{{feature1Title}}</h2>
            <p class="showcase-description">{{feature1Description}}</p>
            <ul class="showcase-list">
              <li>{{feature1Point1}}</li>
              <li>{{feature1Point2}}</li>
              <li>{{feature1Point3}}</li>
            </ul>
          </div>
          <div class="showcase-image">
            <img src="{{feature1Image}}" alt="{{feature1Title}}">
          </div>
        </div>
        <div class="showcase-item reverse">
          <div class="showcase-content">
            <h2 class="showcase-title">{{feature2Title}}</h2>
            <p class="showcase-description">{{feature2Description}}</p>
            <ul class="showcase-list">
              <li>{{feature2Point1}}</li>
              <li>{{feature2Point2}}</li>
              <li>{{feature2Point3}}</li>
            </ul>
          </div>
          <div class="showcase-image">
            <img src="{{feature2Image}}" alt="{{feature2Title}}">
          </div>
        </div>
      </div>
    </section>`,
    `.features-showcase {
      padding: 80px 20px;
      background: white;
    }
    .features-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .showcase-item {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
      margin-bottom: 6rem;
    }
    .showcase-item:last-child {
      margin-bottom: 0;
    }
    .showcase-item.reverse {
      grid-template-columns: 1fr 1fr;
    }
    .showcase-content {
      padding: 2rem;
    }
    .showcase-title {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
    }
    .showcase-description {
      font-size: 1.125rem;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .showcase-list {
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .showcase-list li {
      padding-left: 1.5rem;
      position: relative;
      color: #374151;
    }
    .showcase-list li:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: 700;
    }
    .showcase-image {
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .showcase-image img {
      width: 100%;
      height: auto;
      display: block;
    }
    @media (max-width: 768px) {
      .showcase-item,
      .showcase-item.reverse {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .showcase-title { font-size: 1.75rem; }
    }`,
    {
      feature1Title: { type: 'text', label: 'Feature 1 Title', default: 'Advanced Analytics' },
      feature1Description: { type: 'textarea', label: 'Feature 1 Description', default: 'Get deep insights into your business with our powerful analytics dashboard.' },
      feature1Point1: { type: 'text', label: 'Feature 1 Point 1', default: 'Real-time data visualization' },
      feature1Point2: { type: 'text', label: 'Feature 1 Point 2', default: 'Custom report generation' },
      feature1Point3: { type: 'text', label: 'Feature 1 Point 3', default: 'Export to multiple formats' },
      feature1Image: { type: 'image', label: 'Feature 1 Image', default: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800' },
      feature2Title: { type: 'text', label: 'Feature 2 Title', default: 'Team Collaboration' },
      feature2Description: { type: 'textarea', label: 'Feature 2 Description', default: 'Work together seamlessly with built-in collaboration tools.' },
      feature2Point1: { type: 'text', label: 'Feature 2 Point 1', default: 'Real-time collaboration' },
      feature2Point2: { type: 'text', label: 'Feature 2 Point 2', default: 'Comment and feedback system' },
      feature2Point3: { type: 'text', label: 'Feature 2 Point 3', default: 'Role-based permissions' },
      feature2Image: { type: 'image', label: 'Feature 2 Image', default: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800' }
    },
    {
      feature1Title: 'Advanced Analytics',
      feature1Description: 'Get deep insights into your business with our powerful analytics dashboard.',
      feature1Point1: 'Real-time data visualization',
      feature1Point2: 'Custom report generation',
      feature1Point3: 'Export to multiple formats',
      feature1Image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      feature2Title: 'Team Collaboration',
      feature2Description: 'Work together seamlessly with built-in collaboration tools.',
      feature2Point1: 'Real-time collaboration',
      feature2Point2: 'Comment and feedback system',
      feature2Point3: 'Role-based permissions',
      feature2Image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'
    },
    ['features', 'showcase', 'large', 'alternating']
  )
];

// Seeding function
async function seedComponents() {
  console.log('\n🌱 Starting Feature components seeding...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  try {
    for (const component of featureComponents) {
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

    console.log(`\n📊 Feature Components Seeding Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${featureComponents.length}`);
    
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

module.exports = { featureComponents, seedComponents };