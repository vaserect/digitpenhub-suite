/**
 * Week 1 Complete Component Seeding
 * All 50 core components: Hero (10), Features (10), CTA (5), Testimonials (5), 
 * Pricing (5), Team (5), Contact (5), Footer (5)
 * 
 * Usage: node scripts/seed-week1-complete.js
 */

require('dotenv').config();
const db = require('../src/db');

const CATEGORIES = {
  HERO: 'hero',
  FEATURES: 'features',
  CTA: 'cta',
  TESTIMONIALS: 'testimonials',
  PRICING: 'pricing',
  TEAM: 'team',
  CONTACT: 'contact',
  FOOTER: 'footer'
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

const allComponents = [];

// CTA COMPONENTS (5 total)
const ctaComponents = [
  createComponent(
    'CTA - Centered',
    'Centered call-to-action with gradient background',
    CATEGORIES.CTA,
    'cta',
    `<section class="cta-centered">
      <div class="cta-container">
        <h2 class="cta-title">{{title}}</h2>
        <p class="cta-subtitle">{{subtitle}}</p>
        <a href="{{ctaLink}}" class="cta-btn">{{ctaText}}</a>
      </div>
    </section>`,
    `.cta-centered {
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
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Ready to Get Started?' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Join thousands of satisfied customers today' },
      ctaText: { type: 'text', label: 'Button Text', default: 'Sign Up Now' },
      ctaLink: { type: 'text', label: 'Button Link', default: '#' }
    },
    {
      title: 'Ready to Get Started?',
      subtitle: 'Join thousands of satisfied customers today',
      ctaText: 'Sign Up Now',
      ctaLink: '#'
    },
    ['cta', 'centered', 'gradient']
  ),

  createComponent(
    'CTA - Split Layout',
    'CTA with split layout - content and form side by side',
    CATEGORIES.CTA,
    'cta',
    `<section class="cta-split">
      <div class="cta-container">
        <div class="cta-content">
          <h2 class="cta-title">{{title}}</h2>
          <p class="cta-subtitle">{{subtitle}}</p>
        </div>
        <div class="cta-form">
          <input type="email" placeholder="{{emailPlaceholder}}" class="cta-input">
          <button class="cta-submit">{{submitText}}</button>
        </div>
      </div>
    </section>`,
    `.cta-split {
      padding: 80px 20px;
      background: #0f172a;
      color: white;
    }
    .cta-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }
    .cta-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .cta-subtitle {
      font-size: 1.25rem;
      opacity: 0.9;
    }
    .cta-form {
      display: flex;
      gap: 1rem;
    }
    .cta-input {
      flex: 1;
      padding: 1rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
    }
    .cta-submit {
      padding: 1rem 2rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .cta-submit:hover {
      background: #1d4ed8;
    }
    @media (max-width: 768px) {
      .cta-container {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .cta-form {
        flex-direction: column;
      }
      .cta-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Start Your Free Trial' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'No credit card required. Cancel anytime.' },
      emailPlaceholder: { type: 'text', label: 'Email Placeholder', default: 'Enter your email' },
      submitText: { type: 'text', label: 'Submit Button Text', default: 'Get Started' }
    },
    {
      title: 'Start Your Free Trial',
      subtitle: 'No credit card required. Cancel anytime.',
      emailPlaceholder: 'Enter your email',
      submitText: 'Get Started'
    },
    ['cta', 'split', 'form', 'dark']
  ),

  createComponent(
    'CTA - Banner',
    'Full-width banner CTA with minimal design',
    CATEGORIES.CTA,
    'cta',
    `<section class="cta-banner">
      <div class="cta-container">
        <div class="cta-content">
          <h2 class="cta-title">{{title}}</h2>
          <p class="cta-subtitle">{{subtitle}}</p>
        </div>
        <div class="cta-actions">
          <a href="{{primaryLink}}" class="cta-btn primary">{{primaryText}}</a>
          <a href="{{secondaryLink}}" class="cta-btn secondary">{{secondaryText}}</a>
        </div>
      </div>
    </section>`,
    `.cta-banner {
      padding: 60px 20px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    .cta-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }
    .cta-title {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .cta-subtitle {
      font-size: 1.125rem;
      color: #6b7280;
    }
    .cta-actions {
      display: flex;
      gap: 1rem;
      flex-shrink: 0;
    }
    .cta-btn {
      padding: 0.875rem 2rem;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }
    .cta-btn.primary {
      background: #2563eb;
      color: white;
    }
    .cta-btn.primary:hover {
      background: #1d4ed8;
    }
    .cta-btn.secondary {
      background: white;
      color: #111827;
      border: 1px solid #e5e7eb;
    }
    .cta-btn.secondary:hover {
      background: #f9fafb;
    }
    @media (max-width: 768px) {
      .cta-container {
        flex-direction: column;
        text-align: center;
      }
      .cta-actions {
        flex-direction: column;
        width: 100%;
      }
      .cta-btn {
        width: 100%;
      }
      .cta-title { font-size: 1.75rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Ready to Transform Your Business?' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Join over 10,000 companies already using our platform' },
      primaryText: { type: 'text', label: 'Primary Button Text', default: 'Get Started' },
      primaryLink: { type: 'text', label: 'Primary Button Link', default: '#' },
      secondaryText: { type: 'text', label: 'Secondary Button Text', default: 'Contact Sales' },
      secondaryLink: { type: 'text', label: 'Secondary Button Link', default: '#' }
    },
    {
      title: 'Ready to Transform Your Business?',
      subtitle: 'Join over 10,000 companies already using our platform',
      primaryText: 'Get Started',
      primaryLink: '#',
      secondaryText: 'Contact Sales',
      secondaryLink: '#'
    },
    ['cta', 'banner', 'minimal', 'two-buttons']
  ),

  createComponent(
    'CTA - Card Style',
    'CTA in a card with shadow and rounded corners',
    CATEGORIES.CTA,
    'cta',
    `<section class="cta-card-wrapper">
      <div class="cta-card">
        <h2 class="cta-title">{{title}}</h2>
        <p class="cta-subtitle">{{subtitle}}</p>
        <div class="cta-features">
          <div class="cta-feature">✓ {{feature1}}</div>
          <div class="cta-feature">✓ {{feature2}}</div>
          <div class="cta-feature">✓ {{feature3}}</div>
        </div>
        <a href="{{ctaLink}}" class="cta-btn">{{ctaText}}</a>
      </div>
    </section>`,
    `.cta-card-wrapper {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .cta-card {
      max-width: 600px;
      margin: 0 auto;
      padding: 3rem;
      background: white;
      border-radius: 1.5rem;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
      text-align: center;
    }
    .cta-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
    }
    .cta-subtitle {
      font-size: 1.125rem;
      color: #6b7280;
      margin-bottom: 2rem;
    }
    .cta-features {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
      text-align: left;
    }
    .cta-feature {
      color: #111827;
      font-size: 1rem;
    }
    .cta-btn {
      display: inline-block;
      padding: 1rem 2.5rem;
      background: #2563eb;
      color: white;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.2s;
    }
    .cta-btn:hover {
      background: #1d4ed8;
    }
    @media (max-width: 768px) {
      .cta-card {
        padding: 2rem;
      }
      .cta-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Start Today' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Everything you need to succeed' },
      feature1: { type: 'text', label: 'Feature 1', default: 'No credit card required' },
      feature2: { type: 'text', label: 'Feature 2', default: '14-day free trial' },
      feature3: { type: 'text', label: 'Feature 3', default: 'Cancel anytime' },
      ctaText: { type: 'text', label: 'Button Text', default: 'Start Free Trial' },
      ctaLink: { type: 'text', label: 'Button Link', default: '#' }
    },
    {
      title: 'Start Today',
      subtitle: 'Everything you need to succeed',
      feature1: 'No credit card required',
      feature2: '14-day free trial',
      feature3: 'Cancel anytime',
      ctaText: 'Start Free Trial',
      ctaLink: '#'
    },
    ['cta', 'card', 'features', 'shadow']
  ),

  createComponent(
    'CTA - Minimal Inline',
    'Minimal inline CTA with single button',
    CATEGORIES.CTA,
    'cta',
    `<section class="cta-inline">
      <div class="cta-container">
        <p class="cta-text">{{text}}</p>
        <a href="{{ctaLink}}" class="cta-btn">{{ctaText}}</a>
      </div>
    </section>`,
    `.cta-inline {
      padding: 60px 20px;
      background: white;
    }
    .cta-container {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
      padding: 2rem;
      background: #f9fafb;
      border-radius: 1rem;
      border: 1px solid #e5e7eb;
    }
    .cta-text {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }
    .cta-btn {
      display: inline-block;
      padding: 0.875rem 2rem;
      background: #111827;
      color: white;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.2s;
    }
    .cta-btn:hover {
      background: #1f2937;
    }
    @media (max-width: 768px) {
      .cta-container {
        flex-direction: column;
        text-align: center;
      }
      .cta-text { font-size: 1.125rem; }
    }`,
    {
      text: { type: 'text', label: 'Text', default: 'Ready to take the next step?' },
      ctaText: { type: 'text', label: 'Button Text', default: 'Get Started' },
      ctaLink: { type: 'text', label: 'Button Link', default: '#' }
    },
    {
      text: 'Ready to take the next step?',
      ctaText: 'Get Started',
      ctaLink: '#'
    },
    ['cta', 'inline', 'minimal', 'simple']
  )
];

allComponents.push(...ctaComponents);

// TESTIMONIAL COMPONENTS (5 total)
const testimonialComponents = [
  createComponent(
    'Testimonials - Grid',
    'Grid of testimonial cards with avatars',
    CATEGORIES.TESTIMONIALS,
    'testimonials',
    `<section class="testimonials-grid">
      <div class="testimonials-container">
        <h2 class="testimonials-title">{{title}}</h2>
        <p class="testimonials-subtitle">{{subtitle}}</p>
        <div class="testimonials-grid-items">
          <div class="testimonial-card">
            <p class="testimonial-text">"{{testimonial1Text}}"</p>
            <div class="testimonial-author">
              <img src="{{testimonial1Avatar}}" alt="{{testimonial1Name}}" class="author-avatar">
              <div class="author-info">
                <p class="author-name">{{testimonial1Name}}</p>
                <p class="author-role">{{testimonial1Role}}</p>
              </div>
            </div>
          </div>
          <div class="testimonial-card">
            <p class="testimonial-text">"{{testimonial2Text}}"</p>
            <div class="testimonial-author">
              <img src="{{testimonial2Avatar}}" alt="{{testimonial2Name}}" class="author-avatar">
              <div class="author-info">
                <p class="author-name">{{testimonial2Name}}</p>
                <p class="author-role">{{testimonial2Role}}</p>
              </div>
            </div>
          </div>
          <div class="testimonial-card">
            <p class="testimonial-text">"{{testimonial3Text}}"</p>
            <div class="testimonial-author">
              <img src="{{testimonial3Avatar}}" alt="{{testimonial3Name}}" class="author-avatar">
              <div class="author-info">
                <p class="author-name">{{testimonial3Name}}</p>
                <p class="author-role">{{testimonial3Role}}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>`,
    `.testimonials-grid {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .testimonials-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .testimonials-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 1rem;
    }
    .testimonials-subtitle {
      font-size: 1.25rem;
      text-align: center;
      color: #6b7280;
      margin-bottom: 4rem;
    }
    .testimonials-grid-items {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }
    .testimonial-card {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .testimonial-text {
      color: #111827;
      font-size: 1.125rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .testimonial-author {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .author-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }
    .author-name {
      font-weight: 600;
      color: #111827;
    }
    .author-role {
      font-size: 0.875rem;
      color: #6b7280;
    }
    @media (max-width: 768px) {
      .testimonials-grid-items {
        grid-template-columns: 1fr;
      }
      .testimonials-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'What Our Customers Say' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Trusted by thousands of businesses worldwide' },
      testimonial1Text: { type: 'textarea', label: 'Testimonial 1 Text', default: 'This product has completely transformed how we work. Highly recommended!' },
      testimonial1Name: { type: 'text', label: 'Testimonial 1 Name', default: 'John Doe' },
      testimonial1Role: { type: 'text', label: 'Testimonial 1 Role', default: 'CEO, Company Inc' },
      testimonial1Avatar: { type: 'image', label: 'Testimonial 1 Avatar', default: 'https://i.pravatar.cc/150?img=1' },
      testimonial2Text: { type: 'textarea', label: 'Testimonial 2 Text', default: 'Amazing support and incredible features. Worth every penny!' },
      testimonial2Name: { type: 'text', label: 'Testimonial 2 Name', default: 'Jane Smith' },
      testimonial2Role: { type: 'text', label: 'Testimonial 2 Role', default: 'Marketing Director' },
      testimonial2Avatar: { type: 'image', label: 'Testimonial 2 Avatar', default: 'https://i.pravatar.cc/150?img=2' },
      testimonial3Text: { type: 'textarea', label: 'Testimonial 3 Text', default: 'Best decision we made this year. Our productivity has doubled!' },
      testimonial3Name: { type: 'text', label: 'Testimonial 3 Name', default: 'Mike Johnson' },
      testimonial3Role: { type: 'text', label: 'Testimonial 3 Role', default: 'Product Manager' },
      testimonial3Avatar: { type: 'image', label: 'Testimonial 3 Avatar', default: 'https://i.pravatar.cc/150?img=3' }
    },
    {
      title: 'What Our Customers Say',
      subtitle: 'Trusted by thousands of businesses worldwide',
      testimonial1Text: 'This product has completely transformed how we work. Highly recommended!',
      testimonial1Name: 'John Doe',
      testimonial1Role: 'CEO, Company Inc',
      testimonial1Avatar: 'https://i.pravatar.cc/150?img=1',
      testimonial2Text: 'Amazing support and incredible features. Worth every penny!',
      testimonial2Name: 'Jane Smith',
      testimonial2Role: 'Marketing Director',
      testimonial2Avatar: 'https://i.pravatar.cc/150?img=2',
      testimonial3Text: 'Best decision we made this year. Our productivity has doubled!',
      testimonial3Name: 'Mike Johnson',
      testimonial3Role: 'Product Manager',
      testimonial3Avatar: 'https://i.pravatar.cc/150?img=3'
    },
    ['testimonials', 'grid', '3-column', 'avatars']
  ),

  createComponent(
    'Testimonials - Featured',
    'Large featured testimonial with image',
    CATEGORIES.TESTIMONIALS,
    'testimonials',
    `<section class="testimonials-featured">
      <div class="testimonials-container">
        <div class="featured-testimonial">
          <div class="testimonial-content">
            <div class="quote-icon">"</div>
            <p class="testimonial-text">{{testimonialText}}</p>
            <div class="testimonial-author">
              <img src="{{authorAvatar}}" alt="{{authorName}}" class="author-avatar">
              <div class="author-info">
                <p class="author-name">{{authorName}}</p>
                <p class="author-role">{{authorRole}}</p>
                <p class="author-company">{{authorCompany}}</p>
              </div>
            </div>
          </div>
          <div class="testimonial-image">
            <img src="{{testimonialImage}}" alt="Testimonial">
          </div>
        </div>
      </div>
    </section>`,
    `.testimonials-featured {
      padding: 80px 20px;
      background: white;
    }
    .testimonials-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .featured-testimonial {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }
    .testimonial-content {
      padding: 2rem;
    }
    .quote-icon {
      font-size: 4rem;
      color: #2563eb;
      line-height: 1;
      margin-bottom: 1rem;
    }
    .testimonial-text {
      font-size: 1.5rem;
      color: #111827;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .testimonial-author {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .author-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
    }
    .author-name {
      font-weight: 700;
      font-size: 1.125rem;
      color: #111827;
    }
    .author-role {
      color: #6b7280;
      font-size: 0.875rem;
    }
    .author-company {
      color: #2563eb;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .testimonial-image img {
      width: 100%;
      height: auto;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    @media (max-width: 768px) {
      .featured-testimonial {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .testimonial-text { font-size: 1.25rem; }
    }`,
    {
      testimonialText: { type: 'textarea', label: 'Testimonial Text', default: 'This platform has revolutionized our business operations. The ROI has been incredible, and our team productivity has increased by 300%. I cannot recommend it enough!' },
      authorName: { type: 'text', label: 'Author Name', default: 'Sarah Williams' },
      authorRole: { type: 'text', label: 'Author Role', default: 'CEO & Founder' },
      authorCompany: { type: 'text', label: 'Author Company', default: 'TechCorp Solutions' },
      authorAvatar: { type: 'image', label: 'Author Avatar', default: 'https://i.pravatar.cc/150?img=5' },
      testimonialImage: { type: 'image', label: 'Testimonial Image', default: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600' }
    },
    {
      testimonialText: 'This platform has revolutionized our business operations. The ROI has been incredible, and our team productivity has increased by 300%. I cannot recommend it enough!',
      authorName: 'Sarah Williams',
      authorRole: 'CEO & Founder',
      authorCompany: 'TechCorp Solutions',
      authorAvatar: 'https://i.pravatar.cc/150?img=5',
      testimonialImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600'
    },
    ['testimonials', 'featured', 'large', 'image']
  ),

  createComponent(
    'Testimonials - Carousel Style',
    'Testimonial carousel with navigation dots',
    CATEGORIES.TESTIMONIALS,
    'testimonials',
    `<section class="testimonials-carousel">
      <div class="testimonials-container">
        <h2 class="testimonials-title">{{title}}</h2>
        <div class="carousel-wrapper">
          <div class="testimonial-slide active">
            <p class="testimonial-text">"{{testimonial1Text}}"</p>
            <div class="testimonial-author">
              <img src="{{testimonial1Avatar}}" alt="{{testimonial1Name}}" class="author-avatar">
              <div class="author-info">
                <p class="author-name">{{testimonial1Name}}</p>
                <p class="author-role">{{testimonial1Role}}</p>
              </div>
            </div>
          </div>
          <div class="carousel-dots">
            <span class="dot active"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    </section>`,
    `.testimonials-carousel {
      padding: 80px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .testimonials-container {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    .testimonials-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 3rem;
    }
    .carousel-wrapper {
      position: relative;
    }
    .testimonial-slide {
      padding: 2rem;
    }
    .testimonial-text {
      font-size: 1.5rem;
      line-height: 1.6;
      margin-bottom: 2rem;
      opacity: 0.95;
    }
    .testimonial-author {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }
    .author-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid white;
    }
    .author-name {
      font-weight: 600;
      font-size: 1.125rem;
    }
    .author-role {
      font-size: 0.875rem;
      opacity: 0.9;
    }
    .carousel-dots {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 2rem;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      cursor: pointer;
      transition: background 0.2s;
    }
    .dot.active {
      background: white;
    }
    @media (max-width: 768px) {
      .testimonials-title { font-size: 2rem; }
      .testimonial-text { font-size: 1.25rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Loved by Customers' },
      testimonial1Text: { type: 'textarea', label: 'Testimonial Text', default: 'The best investment we have made for our business. The results speak for themselves!' },
      testimonial1Name: { type: 'text', label: 'Author Name', default: 'Alex Chen' },
      testimonial1Role: { type: 'text', label: 'Author Role', default: 'Operations Manager' },
      testimonial1Avatar: { type: 'image', label: 'Author Avatar', default: 'https://i.pravatar.cc/150?img=8' }
    },
    {
      title: 'Loved by Customers',
      testimonial1Text: 'The best investment we have made for our business. The results speak for themselves!',
      testimonial1Name: 'Alex Chen',
      testimonial1Role: 'Operations Manager',
      testimonial1Avatar: 'https://i.pravatar.cc/150?img=8'
    },
    ['testimonials', 'carousel', 'slider', 'gradient']
  ),

  createComponent(
    'Testimonials - Video',
    'Video testimonial with play button',
    CATEGORIES.TESTIMONIALS,
    'testimonials',
    `<section class="testimonials-video">
      <div class="testimonials-container">
        <h2 class="testimonials-title">{{title}}</h2>
        <p class="testimonials-subtitle">{{subtitle}}</p>
        <div class="video-wrapper">
          <div class="video-thumbnail" style="background-image: url('{{thumbnailUrl}}');">
            <button class="play-button">▶</button>
          </div>
          <div class="video-info">
            <p class="video-quote">"{{quote}}"</p>
            <div class="video-author">
              <img src="{{authorAvatar}}" alt="{{authorName}}" class="author-avatar">
              <div class="author-info">
                <p class="author-name">{{authorName}}</p>
                <p class="author-role">{{authorRole}}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>`,
    `.testimonials-video {
      padding: 80px 20px;
      background: white;
    }
    .testimonials-container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .testimonials-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 1rem;
    }
    .testimonials-subtitle {
      font-size: 1.25rem;
      text-align: center;
      color: #6b7280;
      margin-bottom: 3rem;
    }
    .video-wrapper {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;
    }
    .video-thumbnail {
      position: relative;
      padding-top: 56.25%;
      background-size: cover;
      background-position: center;
      border-radius: 1rem;
      overflow: hidden;
      cursor: pointer;
    }
    .play-button {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80px;
      height: 80px;
      background: white;
      border: none;
      border-radius: 50%;
      font-size: 1.5rem;
      color: #2563eb;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .play-button:hover {
      transform: translate(-50%, -50%) scale(1.1);
    }
    .video-quote {
      font-size: 1.25rem;
      color: #111827;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .video-author {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .author-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
    }
    .author-name {
      font-weight: 600;
      color: #111827;
    }
    .author-role {
      font-size: 0.875rem;
      color: #6b7280;
    }
    @media (max-width: 768px) {
      .video-wrapper {
        grid-template-columns: 1fr;
      }
      .testimonials-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'See What Our Customers Say' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Real stories from real customers' },
      quote: { type: 'textarea', label: 'Quote', default: 'Watch how we transformed our business with this amazing platform' },
      authorName: { type: 'text', label: 'Author Name', default: 'David Martinez' },
      authorRole: { type: 'text', label: 'Author Role', default: 'Founder, StartupXYZ' },
      authorAvatar: { type: 'image', label: 'Author Avatar', default: 'https://i.pravatar.cc/150?img=12' },
      thumbnailUrl: { type: 'image', label: 'Video Thumbnail', default: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600' }
    },
    {
      title: 'See What Our Customers Say',
      subtitle: 'Real stories from real customers',
      quote: 'Watch how we transformed our business with this amazing platform',
      authorName: 'David Martinez',
      authorRole: 'Founder, StartupXYZ',
      authorAvatar: 'https://i.pravatar.cc/150?img=12',
      thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600'
    },
    ['testimonials', 'video', 'play-button', 'split']
  ),

  createComponent(
    'Testimonials - Compact Cards',
    'Compact testimonial cards in 2-column layout',
    CATEGORIES.TESTIMONIALS,
    'testimonials',
    `<section class="testimonials-compact">
      <div class="testimonials-container">
        <h2 class="testimonials-title">{{title}}</h2>
        <div class="testimonials-grid">
          <div class="testimonial-card">
            <div class="rating">★★★★★</div>
            <p class="testimonial-text">{{testimonial1Text}}</p>
            <div class="testimonial-author">
              <img src="{{testimonial1Avatar}}" alt="{{testimonial1Name}}">
              <div>
                <p class="author-name">{{testimonial1Name}}</p>
                <p class="author-role">{{testimonial1Role}}</p>
              </div>
            </div>
          </div>
          <div class="testimonial-card">
            <div class="rating">★★★★★</div>
            <p class="testimonial-text">{{testimonial2Text}}</p>
            <div class="testimonial-author">
              <img src="{{testimonial2Avatar}}" alt="{{testimonial2Name}}">
              <div>
                <p class="author-name">{{testimonial2Name}}</p>
                <p class="author-role">{{testimonial2Role}}</p>
              </div>
            </div>
          </div>
          <div class="testimonial-card">
            <div class="rating">★★★★★</div>
            <p class="testimonial-text">{{testimonial3Text}}</p>
            <div class="testimonial-author">
              <img src="{{testimonial3Avatar}}" alt="{{testimonial3Name}}">
              <div>
                <p class="author-name">{{testimonial3Name}}</p>
                <p class="author-role">{{testimonial3Role}}</p>
              </div>
            </div>
          </div>
          <div class="testimonial-card">
            <div class="rating">★★★★★</div>
            <p class="testimonial-text">{{testimonial4Text}}</p>
            <div class="testimonial-author">
              <img src="{{testimonial4Avatar}}" alt="{{testimonial4Name}}">
              <div>
                <p class="author-name">{{testimonial4Name}}</p>
                <p class="author-role">{{testimonial4Role}}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>`,
    `.testimonials-compact {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .testimonials-container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .testimonials-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 3rem;
    }
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    .testimonial-card {
      background: white;
      padding: 1.5rem;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
    }
    .rating {
      color: #fbbf24;
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    .testimonial-text {
      color: #111827;
      font-size: 0.875rem;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .testimonial-author {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .testimonial-author img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
    .author-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: #111827;
    }
    .author-role {
      font-size: 0.75rem;
      color: #6b7280;
    }
    @media (max-width: 768px) {
      .testimonials-grid {
        grid-template-columns: 1fr;
      }
      .testimonials-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Customer Reviews' },
      testimonial1Text: { type: 'textarea', label: 'Testimonial 1', default: 'Great product! Easy to use and powerful features.' },
      testimonial1Name: { type: 'text', label: 'Name 1', default: 'Emma Wilson' },
      testimonial1Role: { type: 'text', label: 'Role 1', default: 'Designer' },
      testimonial1Avatar: { type: 'image', label: 'Avatar 1', default: 'https://i.pravatar.cc/150?img=20' },
      testimonial2Text: { type: 'textarea', label: 'Testimonial 2', default: 'Excellent support team. They helped us every step of the way.' },
      testimonial2Name: { type: 'text', label: 'Name 2', default: 'Tom Brown' },
      testimonial2Role: { type: 'text', label: 'Role 2', default: 'Developer' },
      testimonial2Avatar: { type: 'image', label: 'Avatar 2', default: 'https://i.pravatar.cc/150?img=21' },
      testimonial3Text: { type: 'textarea', label: 'Testimonial 3', default: 'Best value for money. Highly recommend!' },
      testimonial3Name: { type: 'text', label: 'Name 3', default: 'Lisa Anderson' },
      testimonial3Role: { type: 'text', label: 'Role 3', default: 'Manager' },
      testimonial3Avatar: { type: 'image', label: 'Avatar 3', default: 'https://i.pravatar.cc/150?img=22' },
      testimonial4Text: { type: 'textarea', label: 'Testimonial 4', default: 'Transformed our workflow completely. Amazing!' },
      testimonial4Name: { type: 'text', label: 'Name 4', default: 'Chris Lee' },
      testimonial4Role: { type: 'text', label: 'Role 4', default: 'Consultant' },
      testimonial4Avatar: { type: 'image', label: 'Avatar 4', default: 'https://i.pravatar.cc/150?img=23' }
    },
    {
      title: 'Customer Reviews',
      testimonial1Text: 'Great product! Easy to use and powerful features.',
      testimonial1Name: 'Emma Wilson',
      testimonial1Role: 'Designer',
      testimonial1Avatar: 'https://i.pravatar.cc/150?img=20',
      testimonial2Text: 'Excellent support team. They helped us every step of the way.',
      testimonial2Name: 'Tom Brown',
      testimonial2Role: 'Developer',
      testimonial2Avatar: 'https://i.pravatar.cc/150?img=21',
      testimonial3Text: 'Best value for money. Highly recommend!',
      testimonial3Name: 'Lisa Anderson',
      testimonial3Role: 'Manager',
      testimonial3Avatar: 'https://i.pravatar.cc/150?img=22',
      testimonial4Text: 'Transformed our workflow completely. Amazing!',
      testimonial4Name: 'Chris Lee',
      testimonial4Role: 'Consultant',
      testimonial4Avatar: 'https://i.pravatar.cc/150?img=23'
    },
    ['testimonials', 'compact', '2-column', 'ratings']
  )
];

allComponents.push(...testimonialComponents);

// PRICING COMPONENTS (5 total)
const pricingComponents = [
  createComponent(
    'Pricing - 3 Column',
    'Three-column pricing table with featured plan',
    CATEGORIES.PRICING,
    'pricing',
    `<section class="pricing-3col">
      <div class="pricing-container">
        <h2 class="pricing-title">{{title}}</h2>
        <p class="pricing-subtitle">{{subtitle}}</p>
        <div class="pricing-grid">
          <div class="pricing-card">
            <h3 class="plan-name">{{plan1Name}}</h3>
            <div class="plan-price">
              <span class="currency">$</span>
              <span class="amount">{{plan1Price}}</span>
              <span class="period">/mo</span>
            </div>
            <p class="plan-description">{{plan1Description}}</p>
            <ul class="plan-features">
              <li>✓ {{plan1Feature1}}</li>
              <li>✓ {{plan1Feature2}}</li>
              <li>✓ {{plan1Feature3}}</li>
            </ul>
            <a href="{{plan1Link}}" class="plan-btn">{{plan1ButtonText}}</a>
          </div>
          <div class="pricing-card featured">
            <div class="featured-badge">Most Popular</div>
            <h3 class="plan-name">{{plan2Name}}</h3>
            <div class="plan-price">
              <span class="currency">$</span>
              <span class="amount">{{plan2Price}}</span>
              <span class="period">/mo</span>
            </div>
            <p class="plan-description">{{plan2Description}}</p>
            <ul class="plan-features">
              <li>✓ {{plan2Feature1}}</li>
              <li>✓ {{plan2Feature2}}</li>
              <li>✓ {{plan2Feature3}}</li>
              <li>✓ {{plan2Feature4}}</li>
            </ul>
            <a href="{{plan2Link}}" class="plan-btn primary">{{plan2ButtonText}}</a>
          </div>
          <div class="pricing-card">
            <h3 class="plan-name">{{plan3Name}}</h3>
            <div class="plan-price">
              <span class="currency">$</span>
              <span class="amount">{{plan3Price}}</span>
              <span class="period">/mo</span>
            </div>
            <p class="plan-description">{{plan3Description}}</p>
            <ul class="plan-features">
              <li>✓ {{plan3Feature1}}</li>
              <li>✓ {{plan3Feature2}}</li>
              <li>✓ {{plan3Feature3}}</li>
              <li>✓ {{plan3Feature4}}</li>
              <li>✓ {{plan3Feature5}}</li>
            </ul>
            <a href="{{plan3Link}}" class="plan-btn">{{plan3ButtonText}}</a>
          </div>
        </div>
      </div>
    </section>`,
    `.pricing-3col {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .pricing-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .pricing-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 1rem;
    }
    .pricing-subtitle {
      font-size: 1.25rem;
      text-align: center;
      color: #6b7280;
      margin-bottom: 4rem;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      align-items: start;
    }
    .pricing-card {
      background: white;
      padding: 2.5rem;
      border-radius: 1rem;
      border: 2px solid #e5e7eb;
      position: relative;
    }
    .pricing-card.featured {
      border-color: #2563eb;
      transform: scale(1.05);
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    .featured-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #2563eb;
      color: white;
      padding: 0.25rem 1rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .plan-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
    }
    .plan-price {
      display: flex;
      align-items: baseline;
      margin-bottom: 1rem;
    }
    .currency {
      font-size: 1.5rem;
      color: #6b7280;
    }
    .amount {
      font-size: 3rem;
      font-weight: 700;
      color: #111827;
    }
    .period {
      font-size: 1rem;
      color: #6b7280;
      margin-left: 0.25rem;
    }
    .plan-description {
      color: #6b7280;
      margin-bottom: 2rem;
    }
    .plan-features {
      list-style: none;
      padding: 0;
      margin-bottom: 2rem;
    }
    .plan-features li {
      padding: 0.5rem 0;
      color: #111827;
    }
    .plan-btn {
      display: block;
      width: 100%;
      padding: 1rem;
      text-align: center;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      background: white;
      color: #111827;
      border: 2px solid #e5e7eb;
    }
    .plan-btn:hover {
      background: #f9fafb;
    }
    .plan-btn.primary {
      background: #2563eb;
      color: white;
      border-color: #2563eb;
    }
    .plan-btn.primary:hover {
      background: #1d4ed8;
    }
    @media (max-width: 768px) {
      .pricing-grid {
        grid-template-columns: 1fr;
      }
      .pricing-card.featured {
        transform: scale(1);
      }
      .pricing-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Simple, Transparent Pricing' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Choose the plan that fits your needs' },
      plan1Name: { type: 'text', label: 'Plan 1 Name', default: 'Starter' },
      plan1Price: { type: 'text', label: 'Plan 1 Price', default: '29' },
      plan1Description: { type: 'text', label: 'Plan 1 Description', default: 'Perfect for individuals' },
      plan1Feature1: { type: 'text', label: 'Plan 1 Feature 1', default: '10 Projects' },
      plan1Feature2: { type: 'text', label: 'Plan 1 Feature 2', default: 'Basic Support' },
      plan1Feature3: { type: 'text', label: 'Plan 1 Feature 3', default: '5GB Storage' },
      plan1ButtonText: { type: 'text', label: 'Plan 1 Button', default: 'Get Started' },
      plan1Link: { type: 'text', label: 'Plan 1 Link', default: '#' },
      plan2Name: { type: 'text', label: 'Plan 2 Name', default: 'Professional' },
      plan2Price: { type: 'text', label: 'Plan 2 Price', default: '79' },
      plan2Description: { type: 'text', label: 'Plan 2 Description', default: 'For growing teams' },
      plan2Feature1: { type: 'text', label: 'Plan 2 Feature 1', default: 'Unlimited Projects' },
      plan2Feature2: { type: 'text', label: 'Plan 2 Feature 2', default: 'Priority Support' },
      plan2Feature3: { type: 'text', label: 'Plan 2 Feature 3', default: '50GB Storage' },
      plan2Feature4: { type: 'text', label: 'Plan 2 Feature 4', default: 'Advanced Analytics' },
      plan2ButtonText: { type: 'text', label: 'Plan 2 Button', default: 'Start Free Trial' },
      plan2Link: { type: 'text', label: 'Plan 2 Link', default: '#' },
      plan3Name: { type: 'text', label: 'Plan 3 Name', default: 'Enterprise' },
      plan3Price: { type: 'text', label: 'Plan 3 Price', default: '199' },
      plan3Description: { type: 'text', label: 'Plan 3 Description', default: 'For large organizations' },
      plan3Feature1: { type: 'text', label: 'Plan 3 Feature 1', default: 'Everything in Pro' },
      plan3Feature2: { type: 'text', label: 'Plan 3 Feature 2', default: 'Dedicated Support' },
      plan3Feature3: { type: 'text', label: 'Plan 3 Feature 3', default: 'Unlimited Storage' },
      plan3Feature4: { type: 'text', label: 'Plan 3 Feature 4', default: 'Custom Integrations' },
      plan3Feature5: { type: 'text', label: 'Plan 3 Feature 5', default: 'SLA Guarantee' },
      plan3ButtonText: { type: 'text', label: 'Plan 3 Button', default: 'Contact Sales' },
      plan3Link: { type: 'text', label: 'Plan 3 Link', default: '#' }
    },
    {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Choose the plan that fits your needs',
      plan1Name: 'Starter',
      plan1Price: '29',
      plan1Description: 'Perfect for individuals',
      plan1Feature1: '10 Projects',
      plan1Feature2: 'Basic Support',
      plan1Feature3: '5GB Storage',
      plan1ButtonText: 'Get Started',
      plan1Link: '#',
      plan2Name: 'Professional',
      plan2Price: '79',
      plan2Description: 'For growing teams',
      plan2Feature1: 'Unlimited Projects',
      plan2Feature2: 'Priority Support',
      plan2Feature3: '50GB Storage',
      plan2Feature4: 'Advanced Analytics',
      plan2ButtonText: 'Start Free Trial',
      plan2Link: '#',
      plan3Name: 'Enterprise',
      plan3Price: '199',
      plan3Description: 'For large organizations',
      plan3Feature1: 'Everything in Pro',
      plan3Feature2: 'Dedicated Support',
      plan3Feature3: 'Unlimited Storage',
      plan3Feature4: 'Custom Integrations',
      plan3Feature5: 'SLA Guarantee',
      plan3ButtonText: 'Contact Sales',
      plan3Link: '#'
    },
    ['pricing', '3-column', 'featured', 'plans']
  ),

  createComponent(
    'Pricing - Toggle Annual/Monthly',
    'Pricing with toggle between annual and monthly billing',
    CATEGORIES.PRICING,
    'pricing',
    `<section class="pricing-toggle">
      <div class="pricing-container">
        <h2 class="pricing-title">{{title}}</h2>
        <p class="pricing-subtitle">{{subtitle}}</p>
        <div class="billing-toggle">
          <span class="toggle-label">Monthly</span>
          <label class="toggle-switch">
            <input type="checkbox" id="billing-toggle">
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-label">Annual <span class="save-badge">Save 20%</span></span>
        </div>
        <div class="pricing-grid">
          <div class="pricing-card">
            <h3 class="plan-name">{{planName}}</h3>
            <div class="plan-price">
              <span class="currency">$</span>
              <span class="amount monthly">{{monthlyPrice}}</span>
              <span class="amount annual" style="display:none;">{{annualPrice}}</span>
              <span class="period">/mo</span>
            </div>
            <ul class="plan-features">
              <li>✓ {{feature1}}</li>
              <li>✓ {{feature2}}</li>
              <li>✓ {{feature3}}</li>
            </ul>
            <a href="{{ctaLink}}" class="plan-btn">{{ctaText}}</a>
          </div>
        </div>
      </div>
    </section>`,
    `.pricing-toggle {
      padding: 80px 20px;
      background: white;
    }
    .pricing-container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .pricing-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 1rem;
    }
    .pricing-subtitle {
      font-size: 1.25rem;
      text-align: center;
      color: #6b7280;
      margin-bottom: 2rem;
    }
    .billing-toggle {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-bottom: 3rem;
    }
    .toggle-label {
      font-weight: 600;
      color: #111827;
    }
    .save-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      margin-left: 0.5rem;
    }
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 26px;
    }
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #cbd5e1;
      transition: 0.4s;
      border-radius: 26px;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }
    input:checked + .toggle-slider {
      background-color: #2563eb;
    }
    input:checked + .toggle-slider:before {
      transform: translateX(24px);
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: 1fr;
      max-width: 400px;
      margin: 0 auto;
    }
    .pricing-card {
      background: #f9fafb;
      padding: 2.5rem;
      border-radius: 1rem;
      border: 2px solid #e5e7eb;
      text-align: center;
    }
    .plan-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
    }
    .plan-price {
      display: flex;
      align-items: baseline;
      justify-content: center;
      margin-bottom: 2rem;
    }
    .currency {
      font-size: 1.5rem;
      color: #6b7280;
    }
    .amount {
      font-size: 3rem;
      font-weight: 700;
      color: #111827;
    }
    .period {
      font-size: 1rem;
      color: #6b7280;
      margin-left: 0.25rem;
    }
    .plan-features {
      list-style: none;
      padding: 0;
      margin-bottom: 2rem;
      text-align: left;
    }
    .plan-features li {
      padding: 0.5rem 0;
      color: #111827;
    }
    .plan-btn {
      display: block;
      width: 100%;
      padding: 1rem;
      text-align: center;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      background: #2563eb;
      color: white;
      transition: background 0.2s;
    }
    .plan-btn:hover {
      background: #1d4ed8;
    }
    @media (max-width: 768px) {
      .pricing-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Flexible Pricing' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Pay monthly or save with annual billing' },
      planName: { type: 'text', label: 'Plan Name', default: 'Pro Plan' },
      monthlyPrice: { type: 'text', label: 'Monthly Price', default: '49' },
      annualPrice: { type: 'text', label: 'Annual Price (per month)', default: '39' },
      feature1: { type: 'text', label: 'Feature 1', default: 'Unlimited Projects' },
      feature2: { type: 'text', label: 'Feature 2', default: 'Priority Support' },
      feature3: { type: 'text', label: 'Feature 3', default: 'Advanced Features' },
      ctaText: { type: 'text', label: 'Button Text', default: 'Get Started' },
      ctaLink: { type: 'text', label: 'Button Link', default: '#' }
    },
    {
      title: 'Flexible Pricing',
      subtitle: 'Pay monthly or save with annual billing',
      planName: 'Pro Plan',
      monthlyPrice: '49',
      annualPrice: '39',
      feature1: 'Unlimited Projects',
      feature2: 'Priority Support',
      feature3: 'Advanced Features',
      ctaText: 'Get Started',
      ctaLink: '#'
    },
    ['pricing', 'toggle', 'annual', 'monthly']
  ),

  createComponent(
    'Pricing - Comparison Table',
    'Detailed pricing comparison table',
    CATEGORIES.PRICING,
    'pricing',
    `<section class="pricing-comparison">
      <div class="pricing-container">
        <h2 class="pricing-title">{{title}}</h2>
        <p class="pricing-subtitle">{{subtitle}}</p>
        <div class="comparison-table">
          <div class="comparison-header">
            <div class="header-cell feature-col">Features</div>
            <div class="header-cell">{{plan1Name}}</div>
            <div class="header-cell">{{plan2Name}}</div>
            <div class="header-cell">{{plan3Name}}</div>
          </div>
          <div class="comparison-row">
            <div class="feature-cell">{{feature1}}</div>
            <div class="value-cell">✓</div>
            <div class="value-cell">✓</div>
            <div class="value-cell">✓</div>
          </div>
          <div class="comparison-row">
            <div class="feature-cell">{{feature2}}</div>
            <div class="value-cell">—</div>
            <div class="value-cell">✓</div>
            <div class="value-cell">✓</div>
          </div>
          <div class="comparison-row">
            <div class="feature-cell">{{feature3}}</div>
            <div class="value-cell">—</div>
            <div class="value-cell">—</div>
            <div class="value-cell">✓</div>
          </div>
        </div>
      </div>
    </section>`,
    `.pricing-comparison {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .pricing-container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .pricing-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 1rem;
    }
    .pricing-subtitle {
      font-size: 1.25rem;
      text-align: center;
      color: #6b7280;
      margin-bottom: 3rem;
    }
    .comparison-table {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    .comparison-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
    }
    .header-cell {
      padding: 1.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
    }
    .header-cell.feature-col {
      text-align: left;
    }
    .comparison-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      border-bottom: 1px solid #e5e7eb;
    }
    .comparison-row:last-child {
      border-bottom: none;
    }
    .feature-cell {
      padding: 1.5rem;
      color: #111827;
      font-weight: 500;
    }
    .value-cell {
      padding: 1.5rem;
      text-align: center;
      color: #111827;
    }
    @media (max-width: 768px) {
      .comparison-header,
      .comparison-row {
        grid-template-columns: 1fr;
      }
      .header-cell,
      .feature-cell,
      .value-cell {
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }
      .pricing-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Compare Plans' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Find the perfect plan for your needs' },
      plan1Name: { type: 'text', label: 'Plan 1 Name', default: 'Basic' },
      plan2Name: { type: 'text', label: 'Plan 2 Name', default: 'Pro' },
      plan3Name: { type: 'text', label: 'Plan 3 Name', default: 'Enterprise' },
      feature1: { type: 'text', label: 'Feature 1', default: 'Core Features' },
      feature2: { type: 'text', label: 'Feature 2', default: 'Advanced Analytics' },
      feature3: { type: 'text', label: 'Feature 3', default: 'Priority Support' }
    },
    {
      title: 'Compare Plans',
      subtitle: 'Find the perfect plan for your needs',
      plan1Name: 'Basic',
      plan2Name: 'Pro',
      plan3Name: 'Enterprise',
      feature1: 'Core Features',
      feature2: 'Advanced Analytics',
      feature3: 'Priority Support'
    },
    ['pricing', 'comparison', 'table', 'features']
  ),

  createComponent(
    'Pricing - Simple Card',
    'Single pricing card with clean design',
    CATEGORIES.PRICING,
    'pricing',
    `<section class="pricing-simple">
      <div class="pricing-container">
        <div class="pricing-card">
          <h2 class="plan-name">{{planName}}</h2>
          <div class="plan-price">
            <span class="currency">$</span>
            <span class="amount">{{price}}</span>
            <span class="period">/{{period}}</span>
          </div>
          <p class="plan-description">{{description}}</p>
          <ul class="plan-features">
            <li>✓ {{feature1}}</li>
            <li>✓ {{feature2}}</li>
            <li>✓ {{feature3}}</li>
            <li>✓ {{feature4}}</li>
          </ul>
          <a href="{{ctaLink}}" class="plan-btn">{{ctaText}}</a>
          <p class="plan-note">{{note}}</p>
        </div>
      </div>
    </section>`,
    `.pricing-simple {
      padding: 80px 20px;
      background: white;
    }
    .pricing-container {
      max-width: 500px;
      margin: 0 auto;
    }
    .pricing-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 3rem;
      border-radius: 1.5rem;
      text-align: center;
      color: white;
    }
    .plan-name {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .plan-price {
      display: flex;
      align-items: baseline;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .currency {
      font-size: 2rem;
      opacity: 0.9;
    }
    .amount {
      font-size: 4rem;
      font-weight: 700;
    }
    .period {
      font-size: 1.25rem;
      opacity: 0.9;
      margin-left: 0.25rem;
    }
    .plan-description {
      font-size: 1.125rem;
      opacity: 0.95;
      margin-bottom: 2rem;
    }
    .plan-features {
      list-style: none;
      padding: 0;
      margin-bottom: 2rem;
      text-align: left;
    }
    .plan-features li {
      padding: 0.75rem 0;
      font-size: 1.125rem;
    }
    .plan-btn {
      display: block;
      width: 100%;
      padding: 1.25rem;
      background: white;
      color: #667eea;
      border-radius: 0.75rem;
      font-weight: 700;
      font-size: 1.125rem;
      text-decoration: none;
      transition: transform 0.2s;
      margin-bottom: 1rem;
    }
    .plan-btn:hover {
      transform: translateY(-2px);
    }
    .plan-note {
      font-size: 0.875rem;
      opacity: 0.9;
    }
    @media (max-width: 768px) {
      .pricing-card {
        padding: 2rem;
      }
      .amount { font-size: 3rem; }
    }`,
    {
      planName: { type: 'text', label: 'Plan Name', default: 'Premium Plan' },
      price: { type: 'text', label: 'Price', default: '99' },
      period: { type: 'text', label: 'Period', default: 'month' },
      description: { type: 'text', label: 'Description', default: 'Everything you need to succeed' },
      feature1: { type: 'text', label: 'Feature 1', default: 'Unlimited access' },
      feature2: { type: 'text', label: 'Feature 2', default: 'Priority support' },
      feature3: { type: 'text', label: 'Feature 3', default: 'Advanced features' },
      feature4: { type: 'text', label: 'Feature 4', default: 'Free updates' },
      ctaText: { type: 'text', label: 'Button Text', default: 'Start Free Trial' },
      ctaLink: { type: 'text', label: 'Button Link', default: '#' },
      note: { type: 'text', label: 'Note', default: 'No credit card required' }
    },
    {
      planName: 'Premium Plan',
      price: '99',
      period: 'month',
      description: 'Everything you need to succeed',
      feature1: 'Unlimited access',
      feature2: 'Priority support',
      feature3: 'Advanced features',
      feature4: 'Free updates',
      ctaText: 'Start Free Trial',
      ctaLink: '#',
      note: 'No credit card required'
    },
    ['pricing', 'simple', 'single', 'gradient']
  ),

  createComponent(
    'Pricing - FAQ Included',
    'Pricing with integrated FAQ section',
    CATEGORIES.PRICING,
    'pricing',
    `<section class="pricing-faq">
      <div class="pricing-container">
        <h2 class="pricing-title">{{title}}</h2>
        <div class="pricing-content">
          <div class="pricing-card">
            <h3 class="plan-name">{{planName}}</h3>
            <div class="plan-price">
              <span class="currency">$</span>
              <span class="amount">{{price}}</span>
              <span class="period">/mo</span>
            </div>
            <ul class="plan-features">
              <li>✓ {{feature1}}</li>
              <li>✓ {{feature2}}</li>
              <li>✓ {{feature3}}</li>
            </ul>
            <a href="{{ctaLink}}" class="plan-btn">{{ctaText}}</a>
          </div>
          <div class="faq-section">
            <h3 class="faq-title">Frequently Asked Questions</h3>
            <div class="faq-item">
              <h4 class="faq-question">{{question1}}</h4>
              <p class="faq-answer">{{answer1}}</p>
            </div>
            <div class="faq-item">
              <h4 class="faq-question">{{question2}}</h4>
              <p class="faq-answer">{{answer2}}</p>
            </div>
          </div>
        </div>
      </div>
    </section>`,
    `.pricing-faq {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .pricing-container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .pricing-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 3rem;
    }
    .pricing-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: start;
    }
    .pricing-card {
      background: white;
      padding: 2.5rem;
      border-radius: 1rem;
      border: 2px solid #e5e7eb;
    }
    .plan-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
    }
    .plan-price {
      display: flex;
      align-items: baseline;
      margin-bottom: 2rem;
    }
    .currency {
      font-size: 1.5rem;
      color: #6b7280;
    }
    .amount {
      font-size: 3rem;
      font-weight: 700;
      color: #111827;
    }
    .period {
      font-size: 1rem;
      color: #6b7280;
      margin-left: 0.25rem;
    }
    .plan-features {
      list-style: none;
      padding: 0;
      margin-bottom: 2rem;
    }
    .plan-features li {
      padding: 0.5rem 0;
      color: #111827;
    }
    .plan-btn {
      display: block;
      width: 100%;
      padding: 1rem;
      text-align: center;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      background: #2563eb;
      color: white;
      transition: background 0.2s;
    }
    .plan-btn:hover {
      background: #1d4ed8;
    }
    .faq-section {
      background: white;
      padding: 2.5rem;
      border-radius: 1rem;
    }
    .faq-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 2rem;
    }
    .faq-item {
      margin-bottom: 2rem;
    }
    .faq-item:last-child {
      margin-bottom: 0;
    }
    .faq-question {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .faq-answer {
      color: #6b7280;
      line-height: 1.6;
    }
    @media (max-width: 768px) {
      .pricing-content {
        grid-template-columns: 1fr;
      }
      .pricing-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Pricing & FAQ' },
      planName: { type: 'text', label: 'Plan Name', default: 'Standard Plan' },
      price: { type: 'text', label: 'Price', default: '59' },
      feature1: { type: 'text', label: 'Feature 1', default: 'All core features' },
      feature2: { type: 'text', label: 'Feature 2', default: 'Email support' },
      feature3: { type: 'text', label: 'Feature 3', default: 'Regular updates' },
      ctaText: { type: 'text', label: 'Button Text', default: 'Get Started' },
      ctaLink: { type: 'text', label: 'Button Link', default: '#' },
      question1: { type: 'text', label: 'Question 1', default: 'Can I cancel anytime?' },
      answer1: { type: 'textarea', label: 'Answer 1', default: 'Yes, you can cancel your subscription at any time with no penalties.' },
      question2: { type: 'text', label: 'Question 2', default: 'Do you offer refunds?' },
      answer2: { type: 'textarea', label: 'Answer 2', default: 'We offer a 30-day money-back guarantee if you are not satisfied.' }
    },
    {
      title: 'Pricing & FAQ',
      planName: 'Standard Plan',
      price: '59',
      feature1: 'All core features',
      feature2: 'Email support',
      feature3: 'Regular updates',
      ctaText: 'Get Started',
      ctaLink: '#',
      question1: 'Can I cancel anytime?',
      answer1: 'Yes, you can cancel your subscription at any time with no penalties.',
      question2: 'Do you offer refunds?',
      answer2: 'We offer a 30-day money-back guarantee if you are not satisfied.'
    },
    ['pricing', 'faq', 'questions', 'split']
  )
];

allComponents.push(...pricingComponents);

// TEAM COMPONENTS (5 total)
const teamComponents = [
  createComponent(
    'Team - Grid 4 Column',
    'Four-column team member grid with photos',
    CATEGORIES.TEAM,
    'team',
    `<section class="team-grid-4">
      <div class="team-container">
        <h2 class="team-title">{{title}}</h2>
        <p class="team-subtitle">{{subtitle}}</p>
        <div class="team-grid">
          <div class="team-member">
            <img src="{{member1Photo}}" alt="{{member1Name}}" class="member-photo">
            <h3 class="member-name">{{member1Name}}</h3>
            <p class="member-role">{{member1Role}}</p>
            <p class="member-bio">{{member1Bio}}</p>
          </div>
          <div class="team-member">
            <img src="{{member2Photo}}" alt="{{member2Name}}" class="member-photo">
            <h3 class="member-name">{{member2Name}}</h3>
            <p class="member-role">{{member2Role}}</p>
            <p class="member-bio">{{member2Bio}}</p>
          </div>
          <div class="team-member">
            <img src="{{member3Photo}}" alt="{{member3Name}}" class="member-photo">
            <h3 class="member-name">{{member3Name}}</h3>
            <p class="member-role">{{member3Role}}</p>
            <p class="member-bio">{{member3Bio}}</p>
          </div>
          <div class="team-member">
            <img src="{{member4Photo}}" alt="{{member4Name}}" class="member-photo">
            <h3 class="member-name">{{member4Name}}</h3>
            <p class="member-role">{{member4Role}}</p>
            <p class="member-bio">{{member4Bio}}</p>
          </div>
        </div>
      </div>
    </section>`,
    `.team-grid-4 {
      padding: 80px 20px;
      background: white;
    }
    .team-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .team-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 1rem;
    }
    .team-subtitle {
      font-size: 1.25rem;
      text-align: center;
      color: #6b7280;
      margin-bottom: 4rem;
    }
    .team-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
    }
    .team-member {
      text-align: center;
    }
    .member-photo {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 1rem;
      margin-bottom: 1.5rem;
    }
    .member-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .member-role {
      color: #2563eb;
      font-weight: 500;
      margin-bottom: 1rem;
    }
    .member-bio {
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.6;
    }
    @media (max-width: 1024px) {
      .team-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 768px) {
      .team-grid {
        grid-template-columns: 1fr;
      }
      .team-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Meet Our Team' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'The talented people behind our success' },
      member1Name: { type: 'text', label: 'Member 1 Name', default: 'John Smith' },
      member1Role: { type: 'text', label: 'Member 1 Role', default: 'CEO & Founder' },
      member1Bio: { type: 'textarea', label: 'Member 1 Bio', default: 'Passionate about innovation and leadership' },
      member1Photo: { type: 'image', label: 'Member 1 Photo', default: 'https://i.pravatar.cc/300?img=10' },
      member2Name: { type: 'text', label: 'Member 2 Name', default: 'Sarah Johnson' },
      member2Role: { type: 'text', label: 'Member 2 Role', default: 'CTO' },
      member2Bio: { type: 'textarea', label: 'Member 2 Bio', default: 'Tech enthusiast with 15 years of experience' },
      member2Photo: { type: 'image', label: 'Member 2 Photo', default: 'https://i.pravatar.cc/300?img=11' },
      member3Name: { type: 'text', label: 'Member 3 Name', default: 'Mike Davis' },
      member3Role: { type: 'text', label: 'Member 3 Role', default: 'Head of Design' },
      member3Bio: { type: 'textarea', label: 'Member 3 Bio', default: 'Creating beautiful user experiences' },
      member3Photo: { type: 'image', label: 'Member 3 Photo', default: 'https://i.pravatar.cc/300?img=12' },
      member4Name: { type: 'text', label: 'Member 4 Name', default: 'Emily Brown' },
      member4Role: { type: 'text', label: 'Member 4 Role', default: 'Marketing Director' },
      member4Bio: { type: 'textarea', label: 'Member 4 Bio', default: 'Driving growth through strategic marketing' },
      member4Photo: { type: 'image', label: 'Member 4 Photo', default: 'https://i.pravatar.cc/300?img=13' }
    },
    {
      title: 'Meet Our Team',
      subtitle: 'The talented people behind our success',
      member1Name: 'John Smith',
      member1Role: 'CEO & Founder',
      member1Bio: 'Passionate about innovation and leadership',
      member1Photo: 'https://i.pravatar.cc/300?img=10',
      member2Name: 'Sarah Johnson',
      member2Role: 'CTO',
      member2Bio: 'Tech enthusiast with 15 years of experience',
      member2Photo: 'https://i.pravatar.cc/300?img=11',
      member3Name: 'Mike Davis',
      member3Role: 'Head of Design',
      member3Bio: 'Creating beautiful user experiences',
      member3Photo: 'https://i.pravatar.cc/300?img=12',
      member4Name: 'Emily Brown',
      member4Role: 'Marketing Director',
      member4Bio: 'Driving growth through strategic marketing',
      member4Photo: 'https://i.pravatar.cc/300?img=13'
    },
    ['team', 'grid', '4-column', 'photos']
  ),

  createComponent(
    'Team - Cards with Social',
    'Team member cards with social media links',
    CATEGORIES.TEAM,
    'team',
    `<section class="team-cards-social">
      <div class="team-container">
        <h2 class="team-title">{{title}}</h2>
        <div class="team-grid">
          <div class="team-card">
            <img src="{{member1Photo}}" alt="{{member1Name}}" class="member-photo">
            <div class="member-info">
              <h3 class="member-name">{{member1Name}}</h3>
              <p class="member-role">{{member1Role}}</p>
              <div class="social-links">
                <a href="{{member1Twitter}}" class="social-link">𝕏</a>
                <a href="{{member1LinkedIn}}" class="social-link">in</a>
              </div>
            </div>
          </div>
          <div class="team-card">
            <img src="{{member2Photo}}" alt="{{member2Name}}" class="member-photo">
            <div class="member-info">
              <h3 class="member-name">{{member2Name}}</h3>
              <p class="member-role">{{member2Role}}</p>
              <div class="social-links">
                <a href="{{member2Twitter}}" class="social-link">𝕏</a>
                <a href="{{member2LinkedIn}}" class="social-link">in</a>
              </div>
            </div>
          </div>
          <div class="team-card">
            <img src="{{member3Photo}}" alt="{{member3Name}}" class="member-photo">
            <div class="member-info">
              <h3 class="member-name">{{member3Name}}</h3>
              <p class="member-role">{{member3Role}}</p>
              <div class="social-links">
                <a href="{{member3Twitter}}" class="social-link">𝕏</a>
                <a href="{{member3LinkedIn}}" class="social-link">in</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>`,
    `.team-cards-social {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .team-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .team-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 4rem;
    }
    .team-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }
    .team-card {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .team-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .member-photo {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
    }
    .member-info {
      padding: 2rem;
      text-align: center;
    }
    .member-name {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .member-role {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }
    .social-links {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    .social-link {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      border-radius: 50%;
      color: #111827;
      text-decoration: none;
      transition: background 0.2s;
    }
    .social-link:hover {
      background: #2563eb;
      color: white;
    }
    @media (max-width: 768px) {
      .team-grid {
        grid-template-columns: 1fr;
      }
      .team-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Our Leadership' },
      member1Name: { type: 'text', label: 'Member 1 Name', default: 'Alex Turner' },
      member1Role: { type: 'text', label: 'Member 1 Role', default: 'CEO' },
      member1Photo: { type: 'image', label: 'Member 1 Photo', default: 'https://i.pravatar.cc/400?img=14' },
      member1Twitter: { type: 'text', label: 'Member 1 Twitter', default: '#' },
      member1LinkedIn: { type: 'text', label: 'Member 1 LinkedIn', default: '#' },
      member2Name: { type: 'text', label: 'Member 2 Name', default: 'Jessica Lee' },
      member2Role: { type: 'text', label: 'Member 2 Role', default: 'COO' },
      member2Photo: { type: 'image', label: 'Member 2 Photo', default: 'https://i.pravatar.cc/400?img=15' },
      member2Twitter: { type: 'text', label: 'Member 2 Twitter', default: '#' },
      member2LinkedIn: { type: 'text', label: 'Member 2 LinkedIn', default: '#' },
      member3Name: { type: 'text', label: 'Member 3 Name', default: 'David Chen' },
      member3Role: { type: 'text', label: 'Member 3 Role', default: 'CFO' },
      member3Photo: { type: 'image', label: 'Member 3 Photo', default: 'https://i.pravatar.cc/400?img=16' },
      member3Twitter: { type: 'text', label: 'Member 3 Twitter', default: '#' },
      member3LinkedIn: { type: 'text', label: 'Member 3 LinkedIn', default: '#' }
    },
    {
      title: 'Our Leadership',
      member1Name: 'Alex Turner',
      member1Role: 'CEO',
      member1Photo: 'https://i.pravatar.cc/400?img=14',
      member1Twitter: '#',
      member1LinkedIn: '#',
      member2Name: 'Jessica Lee',
      member2Role: 'COO',
      member2Photo: 'https://i.pravatar.cc/400?img=15',
      member2Twitter: '#',
      member2LinkedIn: '#',
      member3Name: 'David Chen',
      member3Role: 'CFO',
      member3Photo: 'https://i.pravatar.cc/400?img=16',
      member3Twitter: '#',
      member3LinkedIn: '#'
    },
    ['team', 'cards', 'social', '3-column']
  ),

  createComponent(
    'Team - Circular Photos',
    'Team members with circular photos and minimal design',
    CATEGORIES.TEAM,
    'team',
    `<section class="team-circular">
      <div class="team-container">
        <h2 class="team-title">{{title}}</h2>
        <p class="team-subtitle">{{subtitle}}</p>
        <div class="team-grid">
          <div class="team-member">
            <img src="{{member1Photo}}" alt="{{member1Name}}" class="member-photo">
            <h3 class="member-name">{{member1Name}}</h3>
            <p class="member-role">{{member1Role}}</p>
          </div>
          <div class="team-member">
            <img src="{{member2Photo}}" alt="{{member2Name}}" class="member-photo">
            <h3 class="member-name">{{member2Name}}</h3>
            <p class="member-role">{{member2Role}}</p>
          </div>
          <div class="team-member">
            <img src="{{member3Photo}}" alt="{{member3Name}}" class="member-photo">
            <h3 class="member-name">{{member3Name}}</h3>
            <p class="member-role">{{member3Role}}</p>
          </div>
          <div class="team-member">
            <img src="{{member4Photo}}" alt="{{member4Name}}" class="member-photo">
            <h3 class="member-name">{{member4Name}}</h3>
            <p class="member-role">{{member4Role}}</p>
          </div>
          <div class="team-member">
            <img src="{{member5Photo}}" alt="{{member5Name}}" class="member-photo">
            <h3 class="member-name">{{member5Name}}</h3>
            <p class="member-role">{{member5Role}}</p>
          </div>
          <div class="team-member">
            <img src="{{member6Photo}}" alt="{{member6Name}}" class="member-photo">
            <h3 class="member-name">{{member6Name}}</h3>
            <p class="member-role">{{member6Role}}</p>
          </div>
        </div>
      </div>
    </section>`,
    `.team-circular {
      padding: 80px 20px;
      background: white;
    }
    .team-container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .team-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 1rem;
    }
    .team-subtitle {
      font-size: 1.25rem;
      text-align: center;
      color: #6b7280;
      margin-bottom: 4rem;
    }
    .team-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3rem;
    }
    .team-member {
      text-align: center;
    }
    .member-photo {
      width: 150px;
      height: 150px;
      object-fit: cover;
      border-radius: 50%;
      margin: 0 auto 1.5rem;
      border: 4px solid #f9fafb;
    }
    .member-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .member-role {
      color: #6b7280;
      font-size: 0.875rem;
    }
    @media (max-width: 768px) {
      .team-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
      }
      .member-photo {
        width: 120px;
        height: 120px;
      }
      .team-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'The Team' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Meet the people who make it happen' },
      member1Name: { type: 'text', label: 'Member 1 Name', default: 'Anna Wilson' },
      member1Role: { type: 'text', label: 'Member 1 Role', default: 'Product Manager' },
      member1Photo: { type: 'image', label: 'Member 1 Photo', default: 'https://i.pravatar.cc/300?img=25' },
      member2Name: { type: 'text', label: 'Member 2 Name', default: 'Tom Harris' },
      member2Role: { type: 'text', label: 'Member 2 Role', default: 'Lead Developer' },
      member2Photo: { type: 'image', label: 'Member 2 Photo', default: 'https://i.pravatar.cc/300?img=26' },
      member3Name: { type: 'text', label: 'Member 3 Name', default: 'Lisa Martin' },
      member3Role: { type: 'text', label: 'Member 3 Role', default: 'UX Designer' },
      member3Photo: { type: 'image', label: 'Member 3 Photo', default: 'https://i.pravatar.cc/300?img=27' },
      member4Name: { type: 'text', label: 'Member 4 Name', default: 'Chris Taylor' },
      member4Role: { type: 'text', label: 'Member 4 Role', default: 'Sales Director' },
      member4Photo: { type: 'image', label: 'Member 4 Photo', default: 'https://i.pravatar.cc/300?img=28' },
      member5Name: { type: 'text', label: 'Member 5 Name', default: 'Rachel Green' },
      member5Role: { type: 'text', label: 'Member 5 Role', default: 'Content Manager' },
      member5Photo: { type: 'image', label: 'Member 5 Photo', default: 'https://i.pravatar.cc/300?img=29' },
      member6Name: { type: 'text', label: 'Member 6 Name', default: 'Mark Anderson' },
      member6Role: { type: 'text', label: 'Member 6 Role', default: 'Support Lead' },
      member6Photo: { type: 'image', label: 'Member 6 Photo', default: 'https://i.pravatar.cc/300?img=30' }
    },
    {
      title: 'The Team',
      subtitle: 'Meet the people who make it happen',
      member1Name: 'Anna Wilson',
      member1Role: 'Product Manager',
      member1Photo: 'https://i.pravatar.cc/300?img=25',
      member2Name: 'Tom Harris',
      member2Role: 'Lead Developer',
      member2Photo: 'https://i.pravatar.cc/300?img=26',
      member3Name: 'Lisa Martin',
      member3Role: 'UX Designer',
      member3Photo: 'https://i.pravatar.cc/300?img=27',
      member4Name: 'Chris Taylor',
      member4Role: 'Sales Director',
      member4Photo: 'https://i.pravatar.cc/300?img=28',
      member5Name: 'Rachel Green',
      member5Role: 'Content Manager',
      member5Photo: 'https://i.pravatar.cc/300?img=29',
      member6Name: 'Mark Anderson',
      member6Role: 'Support Lead',
      member6Photo: 'https://i.pravatar.cc/300?img=30'
    },
    ['team', 'circular', 'minimal', '6-members']
  ),

  createComponent(
    'Team - Featured Leader',
    'Featured team leader with supporting team members',
    CATEGORIES.TEAM,
    'team',
    `<section class="team-featured">
      <div class="team-container">
        <h2 class="team-title">{{title}}</h2>
        <div class="featured-leader">
          <img src="{{leaderPhoto}}" alt="{{leaderName}}" class="leader-photo">
          <div class="leader-info">
            <h3 class="leader-name">{{leaderName}}</h3>
            <p class="leader-role">{{leaderRole}}</p>
            <p class="leader-bio">{{leaderBio}}</p>
          </div>
        </div>
        <div class="team-grid">
          <div class="team-member">
            <img src="{{member1Photo}}" alt="{{member1Name}}" class="member-photo">
            <h4 class="member-name">{{member1Name}}</h4>
            <p class="member-role">{{member1Role}}</p>
          </div>
          <div class="team-member">
            <img src="{{member2Photo}}" alt="{{member2Name}}" class="member-photo">
            <h4 class="member-name">{{member2Name}}</h4>
            <p class="member-role">{{member2Role}}</p>
          </div>
          <div class="team-member">
            <img src="{{member3Photo}}" alt="{{member3Name}}" class="member-photo">
            <h4 class="member-name">{{member3Name}}</h4>
            <p class="member-role">{{member3Role}}</p>
          </div>
        </div>
      </div>
    </section>`,
    `.team-featured {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .team-container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .team-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 4rem;
    }
    .featured-leader {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 3rem;
      align-items: center;
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      margin-bottom: 4rem;
    }
    .leader-photo {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 1rem;
    }
    .leader-name {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .leader-role {
      color: #2563eb;
      font-weight: 600;
      font-size: 1.125rem;
      margin-bottom: 1.5rem;
    }
    .leader-bio {
      color: #6b7280;
      line-height: 1.6;
    }
    .team-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }
    .team-member {
      text-align: center;
      background: white;
      padding: 2rem;
      border-radius: 1rem;
    }
    .member-photo {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 50%;
      margin: 0 auto 1rem;
    }
    .member-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }
    .member-role {
      color: #6b7280;
      font-size: 0.875rem;
    }
    @media (max-width: 768px) {
      .featured-leader {
        grid-template-columns: 1fr;
        padding: 2rem;
      }
      .team-grid {
        grid-template-columns: 1fr;
      }
      .team-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Leadership Team' },
      leaderName: { type: 'text', label: 'Leader Name', default: 'Jennifer Martinez' },
      leaderRole: { type: 'text', label: 'Leader Role', default: 'Chief Executive Officer' },
      leaderBio: { type: 'textarea', label: 'Leader Bio', default: 'With over 20 years of experience in the industry, Jennifer leads our company with vision and passion. She is committed to innovation and excellence.' },
      leaderPhoto: { type: 'image', label: 'Leader Photo', default: 'https://i.pravatar.cc/400?img=35' },
      member1Name: { type: 'text', label: 'Member 1 Name', default: 'Robert Kim' },
      member1Role: { type: 'text', label: 'Member 1 Role', default: 'VP Engineering' },
      member1Photo: { type: 'image', label: 'Member 1 Photo', default: 'https://i.pravatar.cc/200?img=36' },
      member2Name: { type: 'text', label: 'Member 2 Name', default: 'Maria Garcia' },
      member2Role: { type: 'text', label: 'Member 2 Role', default: 'VP Marketing' },
      member2Photo: { type: 'image', label: 'Member 2 Photo', default: 'https://i.pravatar.cc/200?img=37' },
      member3Name: { type: 'text', label: 'Member 3 Name', default: 'James Wilson' },
      member3Role: { type: 'text', label: 'Member 3 Role', default: 'VP Sales' },
      member3Photo: { type: 'image', label: 'Member 3 Photo', default: 'https://i.pravatar.cc/200?img=38' }
    },
    {
      title: 'Leadership Team',
      leaderName: 'Jennifer Martinez',
      leaderRole: 'Chief Executive Officer',
      leaderBio: 'With over 20 years of experience in the industry, Jennifer leads our company with vision and passion. She is committed to innovation and excellence.',
      leaderPhoto: 'https://i.pravatar.cc/400?img=35',
      member1Name: 'Robert Kim',
      member1Role: 'VP Engineering',
      member1Photo: 'https://i.pravatar.cc/200?img=36',
      member2Name: 'Maria Garcia',
      member2Role: 'VP Marketing',
      member2Photo: 'https://i.pravatar.cc/200?img=37',
      member3Name: 'James Wilson',
      member3Role: 'VP Sales',
      member3Photo: 'https://i.pravatar.cc/200?img=38'
    },
    ['team', 'featured', 'leader', 'hierarchy']
  ),

  createComponent(
    'Team - Compact List',
    'Compact team member list with small photos',
    CATEGORIES.TEAM,
    'team',
    `<section class="team-compact">
      <div class="team-container">
        <h2 class="team-title">{{title}}</h2>
        <div class="team-list">
          <div class="team-member">
            <img src="{{member1Photo}}" alt="{{member1Name}}" class="member-photo">
            <div class="member-info">
              <h3 class="member-name">{{member1Name}}</h3>
              <p class="member-role">{{member1Role}}</p>
            </div>
          </div>
          <div class="team-member">
            <img src="{{member2Photo}}" alt="{{member2Name}}" class="member-photo">
            <div class="member-info">
              <h3 class="member-name">{{member2Name}}</h3>
              <p class="member-role">{{member2Role}}</p>
            </div>
          </div>
          <div class="team-member">
            <img src="{{member3Photo}}" alt="{{member3Name}}" class="member-photo">
            <div class="member-info">
              <h3 class="member-name">{{member3Name}}</h3>
              <p class="member-role">{{member3Role}}</p>
            </div>
          </div>
          <div class="team-member">
            <img src="{{member4Photo}}" alt="{{member4Name}}" class="member-photo">
            <div class="member-info">
              <h3 class="member-name">{{member4Name}}</h3>
              <p class="member-role">{{member4Role}}</p>
            </div>
          </div>
          <div class="team-member">
            <img src="{{member5Photo}}" alt="{{member5Name}}" class="member-photo">
            <div class="member-info">
              <h3 class="member-name">{{member5Name}}</h3>
              <p class="member-role">{{member5Role}}</p>
            </div>
          </div>
          <div class="team-member">
            <img src="{{member6Photo}}" alt="{{member6Name}}" class="member-photo">
            <div class="member-info">
              <h3 class="member-name">{{member6Name}}</h3>
              <p class="member-role">{{member6Role}}</p>
            </div>
          </div>
        </div>
      </div>
    </section>`,
    `.team-compact {
      padding: 80px 20px;
      background: white;
    }
    .team-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .team-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 3rem;
    }
    .team-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }
    .team-member {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 0.75rem;
    }
    .member-photo {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .member-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }
    .member-role {
      color: #6b7280;
      font-size: 0.875rem;
    }
    @media (max-width: 768px) {
      .team-list {
        grid-template-columns: 1fr;
      }
      .team-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Our Team Members' },
      member1Name: { type: 'text', label: 'Member 1 Name', default: 'Sophie Turner' },
      member1Role: { type: 'text', label: 'Member 1 Role', default: 'Senior Developer' },
      member1Photo: { type: 'image', label: 'Member 1 Photo', default: 'https://i.pravatar.cc/200?img=40' },
      member2Name: { type: 'text', label: 'Member 2 Name', default: 'Daniel Park' },
      member2Role: { type: 'text', label: 'Member 2 Role', default: 'Product Designer' },
      member2Photo: { type: 'image', label: 'Member 2 Photo', default: 'https://i.pravatar.cc/200?img=41' },
      member3Name: { type: 'text', label: 'Member 3 Name', default: 'Emma Davis' },
      member3Role: { type: 'text', label: 'Member 3 Role', default: 'Marketing Specialist' },
      member3Photo: { type: 'image', label: 'Member 3 Photo', default: 'https://i.pravatar.cc/200?img=42' },
      member4Name: { type: 'text', label: 'Member 4 Name', default: 'Lucas Brown' },
      member4Role: { type: 'text', label: 'Member 4 Role', default: 'Sales Manager' },
      member4Photo: { type: 'image', label: 'Member 4 Photo', default: 'https://i.pravatar.cc/200?img=43' },
      member5Name: { type: 'text', label: 'Member 5 Name', default: 'Olivia White' },
      member5Role: { type: 'text', label: 'Member 5 Role', default: 'Customer Success' },
      member5Photo: { type: 'image', label: 'Member 5 Photo', default: 'https://i.pravatar.cc/200?img=44' },
      member6Name: { type: 'text', label: 'Member 6 Name', default: 'Noah Johnson' },
      member6Role: { type: 'text', label: 'Member 6 Role', default: 'DevOps Engineer' },
      member6Photo: { type: 'image', label: 'Member 6 Photo', default: 'https://i.pravatar.cc/200?img=45' }
    },
    {
      title: 'Our Team Members',
      member1Name: 'Sophie Turner',
      member1Role: 'Senior Developer',
      member1Photo: 'https://i.pravatar.cc/200?img=40',
      member2Name: 'Daniel Park',
      member2Role: 'Product Designer',
      member2Photo: 'https://i.pravatar.cc/200?img=41',
      member3Name: 'Emma Davis',
      member3Role: 'Marketing Specialist',
      member3Photo: 'https://i.pravatar.cc/200?img=42',
      member4Name: 'Lucas Brown',
      member4Role: 'Sales Manager',
      member4Photo: 'https://i.pravatar.cc/200?img=43',
      member5Name: 'Olivia White',
      member5Role: 'Customer Success',
      member5Photo: 'https://i.pravatar.cc/200?img=44',
      member6Name: 'Noah Johnson',
      member6Role: 'DevOps Engineer',
      member6Photo: 'https://i.pravatar.cc/200?img=45'
    },
    ['team', 'compact', 'list', '2-column']
  )
];

allComponents.push(...teamComponents);

// CONTACT COMPONENTS (5 total)
const contactComponents = [
  createComponent(
    'Contact - Form with Map',
    'Contact form with embedded map side-by-side',
    CATEGORIES.CONTACT,
    'contact',
    `<section class="contact-form-map">
      <div class="contact-container">
        <h2 class="contact-title">{{title}}</h2>
        <p class="contact-subtitle">{{subtitle}}</p>
        <div class="contact-content">
          <form class="contact-form">
            <div class="form-group">
              <input type="text" placeholder="{{namePlaceholder}}" class="form-input">
            </div>
            <div class="form-group">
              <input type="email" placeholder="{{emailPlaceholder}}" class="form-input">
            </div>
            <div class="form-group">
              <textarea placeholder="{{messagePlaceholder}}" rows="5" class="form-textarea"></textarea>
            </div>
            <button type="submit" class="form-submit">{{submitText}}</button>
          </form>
          <div class="contact-map">
            <iframe src="{{mapUrl}}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
          </div>
        </div>
      </div>
    </section>`,
    `.contact-form-map {
      padding: 80px 20px;
      background: white;
    }
    .contact-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .contact-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 1rem;
    }
    .contact-subtitle {
      font-size: 1.25rem;
      text-align: center;
      color: #6b7280;
      margin-bottom: 4rem;
    }
    .contact-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
    }
    .contact-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-input,
    .form-textarea {
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-family: inherit;
    }
    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #2563eb;
    }
    .form-submit {
      padding: 1rem 2rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .form-submit:hover {
      background: #1d4ed8;
    }
    .contact-map {
      height: 100%;
      min-height: 400px;
      border-radius: 1rem;
      overflow: hidden;
    }
    @media (max-width: 768px) {
      .contact-content {
        grid-template-columns: 1fr;
      }
      .contact-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Get In Touch' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'We would love to hear from you' },
      namePlaceholder: { type: 'text', label: 'Name Placeholder', default: 'Your Name' },
      emailPlaceholder: { type: 'text', label: 'Email Placeholder', default: 'Your Email' },
      messagePlaceholder: { type: 'text', label: 'Message Placeholder', default: 'Your Message' },
      submitText: { type: 'text', label: 'Submit Button Text', default: 'Send Message' },
      mapUrl: { type: 'text', label: 'Google Maps Embed URL', default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1!2d-73.98!3d40.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM40zMCcwMC4wIk4gNzPCsDU4JzQ4LjAiVw!5e0!3m2!1sen!2sus!4v1234567890' }
    },
    {
      title: 'Get In Touch',
      subtitle: 'We would love to hear from you',
      namePlaceholder: 'Your Name',
      emailPlaceholder: 'Your Email',
      messagePlaceholder: 'Your Message',
      submitText: 'Send Message',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1!2d-73.98!3d40.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM40zMCcwMC4wIk4gNzPCsDU4JzQ4LjAiVw!5e0!3m2!1sen!2sus!4v1234567890'
    },
    ['contact', 'form', 'map', 'split']
  ),

  createComponent(
    'Contact - Simple Form',
    'Clean and simple contact form',
    CATEGORIES.CONTACT,
    'contact',
    `<section class="contact-simple">
      <div class="contact-container">
        <h2 class="contact-title">{{title}}</h2>
        <p class="contact-subtitle">{{subtitle}}</p>
        <form class="contact-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{nameLabel}}</label>
              <input type="text" class="form-input" placeholder="{{namePlaceholder}}">
            </div>
            <div class="form-group">
              <label class="form-label">{{emailLabel}}</label>
              <input type="email" class="form-input" placeholder="{{emailPlaceholder}}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">{{subjectLabel}}</label>
            <input type="text" class="form-input" placeholder="{{subjectPlaceholder}}">
          </div>
          <div class="form-group">
            <label class="form-label">{{messageLabel}}</label>
            <textarea class="form-textarea" rows="6" placeholder="{{messagePlaceholder}}"></textarea>
          </div>
          <button type="submit" class="form-submit">{{submitText}}</button>
        </form>
      </div>
    </section>`,
    `.contact-simple {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .contact-container {
      max-width: 700px;
      margin: 0 auto;
    }
    .contact-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 1rem;
    }
    .contact-subtitle {
      font-size: 1.25rem;
      text-align: center;
      color: #6b7280;
      margin-bottom: 3rem;
    }
    .contact-form {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      margin-bottom: 1.5rem;
    }
    .form-label {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .form-input,
    .form-textarea {
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-family: inherit;
    }
    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #2563eb;
    }
    .form-submit {
      width: 100%;
      padding: 1rem 2rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 1.125rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .form-submit:hover {
      background: #1d4ed8;
    }
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      .contact-form {
        padding: 2rem;
      }
      .contact-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Contact Us' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Fill out the form below and we will get back to you' },
      nameLabel: { type: 'text', label: 'Name Label', default: 'Name' },
      namePlaceholder: { type: 'text', label: 'Name Placeholder', default: 'John Doe' },
      emailLabel: { type: 'text', label: 'Email Label', default: 'Email' },
      emailPlaceholder: { type: 'text', label: 'Email Placeholder', default: 'john@example.com' },
      subjectLabel: { type: 'text', label: 'Subject Label', default: 'Subject' },
      subjectPlaceholder: { type: 'text', label: 'Subject Placeholder', default: 'How can we help?' },
      messageLabel: { type: 'text', label: 'Message Label', default: 'Message' },
      messagePlaceholder: { type: 'text', label: 'Message Placeholder', default: 'Tell us more...' },
      submitText: { type: 'text', label: 'Submit Button Text', default: 'Send Message' }
    },
    {
      title: 'Contact Us',
      subtitle: 'Fill out the form below and we will get back to you',
      nameLabel: 'Name',
      namePlaceholder: 'John Doe',
      emailLabel: 'Email',
      emailPlaceholder: 'john@example.com',
      subjectLabel: 'Subject',
      subjectPlaceholder: 'How can we help?',
      messageLabel: 'Message',
      messagePlaceholder: 'Tell us more...',
      submitText: 'Send Message'
    },
    ['contact', 'form', 'simple', 'labels']
  ),

  createComponent(
    'Contact - Info Cards',
    'Contact information displayed as cards',
    CATEGORIES.CONTACT,
    'contact',
    `<section class="contact-info-cards">
      <div class="contact-container">
        <h2 class="contact-title">{{title}}</h2>
        <p class="contact-subtitle">{{subtitle}}</p>
        <div class="info-grid">
          <div class="info-card">
            <div class="info-icon">📍</div>
            <h3 class="info-title">{{addressTitle}}</h3>
            <p class="info-text">{{address}}</p>
          </div>
          <div class="info-card">
            <div class="info-icon">📧</div>
            <h3 class="info-title">{{emailTitle}}</h3>
            <p class="info-text">{{email}}</p>
          </div>
          <div class="info-card">
            <div class="info-icon">📞</div>
            <h3 class="info-title">{{phoneTitle}}</h3>
            <p class="info-text">{{phone}}</p>
          </div>
          <div class="info-card">
            <div class="info-icon">🕐</div>
            <h3 class="info-title">{{hoursTitle}}</h3>
            <p class="info-text">{{hours}}</p>
          </div>
        </div>
      </div>
    </section>`,
    `.contact-info-cards {
      padding: 80px 20px;
      background: white;
    }
    .contact-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .contact-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      color: #111827;
      margin-bottom: 1rem;
    }
    .contact-subtitle {
      font-size: 1.25rem;
      text-align: center;
      color: #6b7280;
      margin-bottom: 4rem;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
    }
    .info-card {
      text-align: center;
      padding: 2rem;
      background: #f9fafb;
      border-radius: 1rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .info-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .info-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .info-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.75rem;
    }
    .info-text {
      color: #6b7280;
      line-height: 1.6;
    }
    @media (max-width: 1024px) {
      .info-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 768px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
      .contact-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Section Title', default: 'Contact Information' },
      subtitle: { type: 'text', label: 'Section Subtitle', default: 'Reach out to us through any of these channels' },
      addressTitle: { type: 'text', label: 'Address Title', default: 'Visit Us' },
      address: { type: 'textarea', label: 'Address', default: '123 Business Street\nNew York, NY 10001' },
      emailTitle: { type: 'text', label: 'Email Title', default: 'Email Us' },
      email: { type: 'text', label: 'Email', default: 'hello@company.com' },
      phoneTitle: { type: 'text', label: 'Phone Title', default: 'Call Us' },
      phone: { type: 'text', label: 'Phone', default: '+1 (555) 123-4567' },
      hoursTitle: { type: 'text', label: 'Hours Title', default: 'Business Hours' },
      hours: { type: 'textarea', label: 'Hours', default: 'Mon-Fri: 9AM - 6PM\nSat-Sun: Closed' }
    },
    {
      title: 'Contact Information',
      subtitle: 'Reach out to us through any of these channels',
      addressTitle: 'Visit Us',
      address: '123 Business Street\nNew York, NY 10001',
      emailTitle: 'Email Us',
      email: 'hello@company.com',
      phoneTitle: 'Call Us',
      phone: '+1 (555) 123-4567',
      hoursTitle: 'Business Hours',
      hours: 'Mon-Fri: 9AM - 6PM\nSat-Sun: Closed'
    },
    ['contact', 'info', 'cards', '4-column']
  ),

  createComponent(
    'Contact - Split Layout',
    'Contact form and info side by side',
    CATEGORIES.CONTACT,
    'contact',
    `<section class="contact-split">
      <div class="contact-container">
        <div class="contact-info">
          <h2 class="contact-title">{{title}}</h2>
          <p class="contact-description">{{description}}</p>
          <div class="info-items">
            <div class="info-item">
              <div class="info-icon">📧</div>
              <div>
                <p class="info-label">Email</p>
                <p class="info-value">{{email}}</p>
              </div>
            </div>
            <div class="info-item">
              <div class="info-icon">📞</div>
              <div>
                <p class="info-label">Phone</p>
                <p class="info-value">{{phone}}</p>
              </div>
            </div>
            <div class="info-item">
              <div class="info-icon">📍</div>
              <div>
                <p class="info-label">Address</p>
                <p class="info-value">{{address}}</p>
              </div>
            </div>
          </div>
        </div>
        <form class="contact-form">
          <h3 class="form-title">{{formTitle}}</h3>
          <div class="form-group">
            <input type="text" placeholder="{{namePlaceholder}}" class="form-input">
          </div>
          <div class="form-group">
            <input type="email" placeholder="{{emailPlaceholder}}" class="form-input">
          </div>
          <div class="form-group">
            <textarea placeholder="{{messagePlaceholder}}" rows="5" class="form-textarea"></textarea>
          </div>
          <button type="submit" class="form-submit">{{submitText}}</button>
        </form>
      </div>
    </section>`,
    `.contact-split {
      padding: 80px 20px;
      background: #f9fafb;
    }
    .contact-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: start;
    }
    .contact-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
    }
    .contact-description {
      font-size: 1.125rem;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 3rem;
    }
    .info-items {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    .info-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .info-label {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }
    .info-value {
      color: #6b7280;
    }
    .contact-form {
      background: white;
      padding: 2.5rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .form-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 2rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-input,
    .form-textarea {
      width: 100%;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-family: inherit;
    }
    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #2563eb;
    }
    .form-submit {
      width: 100%;
      padding: 1rem 2rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .form-submit:hover {
      background: #1d4ed8;
    }
    @media (max-width: 768px) {
      .contact-container {
        grid-template-columns: 1fr;
        gap: 3rem;
      }
      .contact-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Let\'s Talk' },
      description: { type: 'textarea', label: 'Description', default: 'Have a question or want to work together? We would love to hear from you.' },
      email: { type: 'text', label: 'Email', default: 'contact@company.com' },
      phone: { type: 'text', label: 'Phone', default: '+1 (555) 987-6543' },
      address: { type: 'text', label: 'Address', default: '456 Main St, City, State 12345' },
      formTitle: { type: 'text', label: 'Form Title', default: 'Send us a message' },
      namePlaceholder: { type: 'text', label: 'Name Placeholder', default: 'Your Name' },
      emailPlaceholder: { type: 'text', label: 'Email Placeholder', default: 'Your Email' },
      messagePlaceholder: { type: 'text', label: 'Message Placeholder', default: 'Your Message' },
      submitText: { type: 'text', label: 'Submit Button Text', default: 'Send Message' }
    },
    {
      title: 'Let\'s Talk',
      description: 'Have a question or want to work together? We would love to hear from you.',
      email: 'contact@company.com',
      phone: '+1 (555) 987-6543',
      address: '456 Main St, City, State 12345',
      formTitle: 'Send us a message',
      namePlaceholder: 'Your Name',
      emailPlaceholder: 'Your Email',
      messagePlaceholder: 'Your Message',
      submitText: 'Send Message'
    },
    ['contact', 'split', 'form', 'info']
  ),

  createComponent(
    'Contact - Minimal',
    'Minimal contact section with centered form',
    CATEGORIES.CONTACT,
    'contact',
    `<section class="contact-minimal">
      <div class="contact-container">
        <h2 class="contact-title">{{title}}</h2>
        <p class="contact-subtitle">{{subtitle}}</p>
        <form class="contact-form">
          <input type="email" placeholder="{{emailPlaceholder}}" class="form-input">
          <button type="submit" class="form-submit">{{submitText}}</button>
        </form>
        <p class="contact-note">{{note}}</p>
      </div>
    </section>`,
    `.contact-minimal {
      padding: 80px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .contact-container {
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
    .contact-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .contact-subtitle {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.95;
    }
    .contact-form {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .form-input {
      flex: 1;
      padding: 1rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
    }
    .form-input:focus {
      outline: none;
    }
    .form-submit {
      padding: 1rem 2rem;
      background: white;
      color: #667eea;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: transform 0.2s;
    }
    .form-submit:hover {
      transform: translateY(-2px);
    }
    .contact-note {
      font-size: 0.875rem;
      opacity: 0.9;
    }
    @media (max-width: 768px) {
      .contact-form {
        flex-direction: column;
      }
      .contact-title { font-size: 2rem; }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Stay Connected' },
      subtitle: { type: 'text', label: 'Subtitle', default: 'Subscribe to our newsletter for updates' },
      emailPlaceholder: { type: 'text', label: 'Email Placeholder', default: 'Enter your email' },
      submitText: { type: 'text', label: 'Submit Button Text', default: 'Subscribe' },
      note: { type: 'text', label: 'Note', default: 'We respect your privacy. Unsubscribe at any time.' }
    },
    {
      title: 'Stay Connected',
      subtitle: 'Subscribe to our newsletter for updates',
      emailPlaceholder: 'Enter your email',
      submitText: 'Subscribe',
      note: 'We respect your privacy. Unsubscribe at any time.'
    },
    ['contact', 'minimal', 'newsletter', 'gradient']
  )
];

allComponents.push(...contactComponents);

// FOOTER COMPONENTS (5 total)
const footerComponents = [
  createComponent(
    'Footer - 4 Column',
    'Comprehensive footer with 4 columns of links',
    CATEGORIES.FOOTER,
    'footer',
    `<footer class="footer-4col">
      <div class="footer-container">
        <div class="footer-grid">
          <div class="footer-column">
            <h3 class="footer-title">{{column1Title}}</h3>
            <ul class="footer-links">
              <li><a href="{{column1Link1Url}}">{{column1Link1}}</a></li>
              <li><a href="{{column1Link2Url}}">{{column1Link2}}</a></li>
              <li><a href="{{column1Link3Url}}">{{column1Link3}}</a></li>
              <li><a href="{{column1Link4Url}}">{{column1Link4}}</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h3 class="footer-title">{{column2Title}}</h3>
            <ul class="footer-links">
              <li><a href="{{column2Link1Url}}">{{column2Link1}}</a></li>
              <li><a href="{{column2Link2Url}}">{{column2Link2}}</a></li>
              <li><a href="{{column2Link3Url}}">{{column2Link3}}</a></li>
              <li><a href="{{column2Link4Url}}">{{column2Link4}}</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h3 class="footer-title">{{column3Title}}</h3>
            <ul class="footer-links">
              <li><a href="{{column3Link1Url}}">{{column3Link1}}</a></li>
              <li><a href="{{column3Link2Url}}">{{column3Link2}}</a></li>
              <li><a href="{{column3Link3Url}}">{{column3Link3}}</a></li>
              <li><a href="{{column3Link4Url}}">{{column3Link4}}</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h3 class="footer-title">{{column4Title}}</h3>
            <p class="footer-text">{{column4Text}}</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p class="footer-copyright">{{copyright}}</p>
        </div>
      </div>
    </footer>`,
    `.footer-4col {
      padding: 60px 20px 30px;
      background: #111827;
      color: white;
    }
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3rem;
      margin-bottom: 3rem;
    }
    .footer-column {
      display: flex;
      flex-direction: column;
    }
    .footer-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    .footer-links {
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .footer-links a {
      color: #9ca3af;
      text-decoration: none;
      transition: color 0.2s;
    }
    .footer-links a:hover {
      color: white;
    }
    .footer-text {
      color: #9ca3af;
      line-height: 1.6;
    }
    .footer-bottom {
      padding-top: 2rem;
      border-top: 1px solid #374151;
      text-align: center;
    }
    .footer-copyright {
      color: #9ca3af;
      font-size: 0.875rem;
    }
    @media (max-width: 1024px) {
      .footer-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 768px) {
      .footer-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }`,
    {
      column1Title: { type: 'text', label: 'Column 1 Title', default: 'Product' },
      column1Link1: { type: 'text', label: 'Column 1 Link 1', default: 'Features' },
      column1Link1Url: { type: 'text', label: 'Column 1 Link 1 URL', default: '#' },
      column1Link2: { type: 'text', label: 'Column 1 Link 2', default: 'Pricing' },
      column1Link2Url: { type: 'text', label: 'Column 1 Link 2 URL', default: '#' },
      column1Link3: { type: 'text', label: 'Column 1 Link 3', default: 'Testimonials' },
      column1Link3Url: { type: 'text', label: 'Column 1 Link 3 URL', default: '#' },
      column1Link4: { type: 'text', label: 'Column 1 Link 4', default: 'FAQ' },
      column1Link4Url: { type: 'text', label: 'Column 1 Link 4 URL', default: '#' },
      column2Title: { type: 'text', label: 'Column 2 Title', default: 'Company' },
      column2Link1: { type: 'text', label: 'Column 2 Link 1', default: 'About' },
      column2Link1Url: { type: 'text', label: 'Column 2 Link 1 URL', default: '#' },
      column2Link2: { type: 'text', label: 'Column 2 Link 2', default: 'Blog' },
      column2Link2Url: { type: 'text', label: 'Column 2 Link 2 URL', default: '#' },
      column2Link3: { type: 'text', label: 'Column 2 Link 3', default: 'Careers' },
      column2Link3Url: { type: 'text', label: 'Column 2 Link 3 URL', default: '#' },
      column2Link4: { type: 'text', label: 'Column 2 Link 4', default: 'Contact' },
      column2Link4Url: { type: 'text', label: 'Column 2 Link 4 URL', default: '#' },
      column3Title: { type: 'text', label: 'Column 3 Title', default: 'Resources' },
      column3Link1: { type: 'text', label: 'Column 3 Link 1', default: 'Documentation' },
      column3Link1Url: { type: 'text', label: 'Column 3 Link 1 URL', default: '#' },
      column3Link2: { type: 'text', label: 'Column 3 Link 2', default: 'Help Center' },
      column3Link2Url: { type: 'text', label: 'Column 3 Link 2 URL', default: '#' },
      column3Link3: { type: 'text', label: 'Column 3 Link 3', default: 'Community' },
      column3Link3Url: { type: 'text', label: 'Column 3 Link 3 URL', default: '#' },
      column3Link4: { type: 'text', label: 'Column 3 Link 4', default: 'Status' },
      column3Link4Url: { type: 'text', label: 'Column 3 Link 4 URL', default: '#' },
      column4Title: { type: 'text', label: 'Column 4 Title', default: 'Newsletter' },
      column4Text: { type: 'textarea', label: 'Column 4 Text', default: 'Subscribe to our newsletter for the latest updates and news.' },
      copyright: { type: 'text', label: 'Copyright Text', default: '© 2024 Company Name. All rights reserved.' }
    },
    {
      column1Title: 'Product',
      column1Link1: 'Features',
      column1Link1Url: '#',
      column1Link2: 'Pricing',
      column1Link2Url: '#',
      column1Link3: 'Testimonials',
      column1Link3Url: '#',
      column1Link4: 'FAQ',
      column1Link4Url: '#',
      column2Title: 'Company',
      column2Link1: 'About',
      column2Link1Url: '#',
      column2Link2: 'Blog',
      column2Link2Url: '#',
      column2Link3: 'Careers',
      column2Link3Url: '#',
      column2Link4: 'Contact',
      column2Link4Url: '#',
      column3Title: 'Resources',
      column3Link1: 'Documentation',
      column3Link1Url: '#',
      column3Link2: 'Help Center',
      column3Link2Url: '#',
      column3Link3: 'Community',
      column3Link3Url: '#',
      column3Link4: 'Status',
      column3Link4Url: '#',
      column4Title: 'Newsletter',
      column4Text: 'Subscribe to our newsletter for the latest updates and news.',
      copyright: '© 2024 Company Name. All rights reserved.'
    },
    ['footer', '4-column', 'links', 'comprehensive']
  ),

  createComponent(
    'Footer - Centered',
    'Centered footer with logo and social links',
    CATEGORIES.FOOTER,
    'footer',
    `<footer class="footer-centered">
      <div class="footer-container">
        <div class="footer-logo">{{logo}}</div>
        <nav class="footer-nav">
          <a href="{{link1Url}}">{{link1}}</a>
          <a href="{{link2Url}}">{{link2}}</a>
          <a href="{{link3Url}}">{{link3}}</a>
          <a href="{{link4Url}}">{{link4}}</a>
          <a href="{{link5Url}}">{{link5}}</a>
        </nav>
        <div class="footer-social">
          <a href="{{twitterUrl}}" class="social-link">𝕏</a>
          <a href="{{facebookUrl}}" class="social-link">f</a>
          <a href="{{linkedinUrl}}" class="social-link">in</a>
          <a href="{{instagramUrl}}" class="social-link">📷</a>
        </div>
        <p class="footer-copyright">{{copyright}}</p>
      </div>
    </footer>`,
    `.footer-centered {
      padding: 60px 20px;
      background: #f9fafb;
      text-align: center;
    }
    .footer-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .footer-logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 2rem;
    }
    .footer-nav {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .footer-nav a {
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .footer-nav a:hover {
      color: #111827;
    }
    .footer-social {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .social-link {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 50%;
      color: #111827;
      text-decoration: none;
      transition: all 0.2s;
      border: 1px solid #e5e7eb;
    }
    .social-link:hover {
      background: #111827;
      color: white;
      border-color: #111827;
    }
    .footer-copyright {
      color: #6b7280;
      font-size: 0.875rem;
    }
    @media (max-width: 768px) {
      .footer-nav {
        flex-direction: column;
        gap: 1rem;
      }
    }`,
    {
      logo: { type: 'text', label: 'Logo Text', default: 'Company' },
      link1: { type: 'text', label: 'Link 1', default: 'About' },
      link1Url: { type: 'text', label: 'Link 1 URL', default: '#' },
      link2: { type: 'text', label: 'Link 2', default: 'Features' },
      link2Url: { type: 'text', label: 'Link 2 URL', default: '#' },
      link3: { type: 'text', label: 'Link 3', default: 'Pricing' },
      link3Url: { type: 'text', label: 'Link 3 URL', default: '#' },
      link4: { type: 'text', label: 'Link 4', default: 'Blog' },
      link4Url: { type: 'text', label: 'Link 4 URL', default: '#' },
      link5: { type: 'text', label: 'Link 5', default: 'Contact' },
      link5Url: { type: 'text', label: 'Link 5 URL', default: '#' },
      twitterUrl: { type: 'text', label: 'Twitter URL', default: '#' },
      facebookUrl: { type: 'text', label: 'Facebook URL', default: '#' },
      linkedinUrl: { type: 'text', label: 'LinkedIn URL', default: '#' },
      instagramUrl: { type: 'text', label: 'Instagram URL', default: '#' },
      copyright: { type: 'text', label: 'Copyright Text', default: '© 2024 Company. All rights reserved.' }
    },
    {
      logo: 'Company',
      link1: 'About',
      link1Url: '#',
      link2: 'Features',
      link2Url: '#',
      link3: 'Pricing',
      link3Url: '#',
      link4: 'Blog',
      link4Url: '#',
      link5: 'Contact',
      link5Url: '#',
      twitterUrl: '#',
      facebookUrl: '#',
      linkedinUrl: '#',
      instagramUrl: '#',
      copyright: '© 2024 Company. All rights reserved.'
    },
    ['footer', 'centered', 'social', 'minimal']
  ),

  createComponent(
    'Footer - Minimal',
    'Minimal footer with single line',
    CATEGORIES.FOOTER,
    'footer',
    `<footer class="footer-minimal">
      <div class="footer-container">
        <p class="footer-text">{{text}}</p>
        <div class="footer-links">
          <a href="{{link1Url}}">{{link1}}</a>
          <a href="{{link2Url}}">{{link2}}</a>
          <a href="{{link3Url}}">{{link3}}</a>
        </div>
      </div>
    </footer>`,
    `.footer-minimal {
      padding: 30px 20px;
      background: white;
      border-top: 1px solid #e5e7eb;
    }
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-text {
      color: #6b7280;
      font-size: 0.875rem;
    }
    .footer-links {
      display: flex;
      gap: 2rem;
    }
    .footer-links a {
      color: #6b7280;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;
    }
    .footer-links a:hover {
      color: #111827;
    }
    @media (max-width: 768px) {
      .footer-container {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
    }`,
    {
      text: { type: 'text', label: 'Footer Text', default: '© 2024 Company. All rights reserved.' },
      link1: { type: 'text', label: 'Link 1', default: 'Privacy' },
      link1Url: { type: 'text', label: 'Link 1 URL', default: '#' },
      link2: { type: 'text', label: 'Link 2', default: 'Terms' },
      link2Url: { type: 'text', label: 'Link 2 URL', default: '#' },
      link3: { type: 'text', label: 'Link 3', default: 'Cookies' },
      link3Url: { type: 'text', label: 'Link 3 URL', default: '#' }
    },
    {
      text: '© 2024 Company. All rights reserved.',
      link1: 'Privacy',
      link1Url: '#',
      link2: 'Terms',
      link2Url: '#',
      link3: 'Cookies',
      link3Url: '#'
    },
    ['footer', 'minimal', 'simple', 'single-line']
  ),

  createComponent(
    'Footer - Newsletter',
    'Footer with newsletter signup',
    CATEGORIES.FOOTER,
    'footer',
    `<footer class="footer-newsletter">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-info">
            <h3 class="footer-title">{{title}}</h3>
            <p class="footer-description">{{description}}</p>
          </div>
          <form class="newsletter-form">
            <input type="email" placeholder="{{emailPlaceholder}}" class="newsletter-input">
            <button type="submit" class="newsletter-submit">{{submitText}}</button>
          </form>
        </div>
        <div class="footer-bottom">
          <div class="footer-links">
            <a href="{{link1Url}}">{{link1}}</a>
            <a href="{{link2Url}}">{{link2}}</a>
            <a href="{{link3Url}}">{{link3}}</a>
            <a href="{{link4Url}}">{{link4}}</a>
          </div>
          <p class="footer-copyright">{{copyright}}</p>
        </div>
      </div>
    </footer>`,
    `.footer-newsletter {
      padding: 60px 20px 30px;
      background: #111827;
      color: white;
    }
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .footer-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;
      margin-bottom: 3rem;
      padding-bottom: 3rem;
      border-bottom: 1px solid #374151;
    }
    .footer-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .footer-description {
      color: #9ca3af;
      line-height: 1.6;
    }
    .newsletter-form {
      display: flex;
      gap: 1rem;
    }
    .newsletter-input {
      flex: 1;
      padding: 1rem;
      border: 1px solid #374151;
      border-radius: 0.5rem;
      background: #1f2937;
      color: white;
      font-size: 1rem;
    }
    .newsletter-input:focus {
      outline: none;
      border-color: #2563eb;
    }
    .newsletter-submit {
      padding: 1rem 2rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s;
    }
    .newsletter-submit:hover {
      background: #1d4ed8;
    }
    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-links {
      display: flex;
      gap: 2rem;
    }
    .footer-links a {
      color: #9ca3af;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;
    }
    .footer-links a:hover {
      color: white;
    }
    .footer-copyright {
      color: #9ca3af;
      font-size: 0.875rem;
    }
    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
      }
      .newsletter-form {
        flex-direction: column;
      }
      .footer-bottom {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
      }
      .footer-links {
        flex-direction: column;
        gap: 1rem;
      }
    }`,
    {
      title: { type: 'text', label: 'Title', default: 'Stay Updated' },
      description: { type: 'textarea', label: 'Description', default: 'Subscribe to our newsletter and never miss our latest news and promotions.' },
      emailPlaceholder: { type: 'text', label: 'Email Placeholder', default: 'Enter your email' },
      submitText: { type: 'text', label: 'Submit Button Text', default: 'Subscribe' },
      link1: { type: 'text', label: 'Link 1', default: 'About' },
      link1Url: { type: 'text', label: 'Link 1 URL', default: '#' },
      link2: { type: 'text', label: 'Link 2', default: 'Privacy Policy' },
      link2Url: { type: 'text', label: 'Link 2 URL', default: '#' },
      link3: { type: 'text', label: 'Link 3', default: 'Terms of Service' },
      link3Url: { type: 'text', label: 'Link 3 URL', default: '#' },
      link4: { type: 'text', label: 'Link 4', default: 'Contact' },
      link4Url: { type: 'text', label: 'Link 4 URL', default: '#' },
      copyright: { type: 'text', label: 'Copyright Text', default: '© 2024 Company Name. All rights reserved.' }
    },
    {
      title: 'Stay Updated',
      description: 'Subscribe to our newsletter and never miss our latest news and promotions.',
      emailPlaceholder: 'Enter your email',
      submitText: 'Subscribe',
      link1: 'About',
      link1Url: '#',
      link2: 'Privacy Policy',
      link2Url: '#',
      link3: 'Terms of Service',
      link3Url: '#',
      link4: 'Contact',
      link4Url: '#',
      copyright: '© 2024 Company Name. All rights reserved.'
    },
    ['footer', 'newsletter', 'subscription', 'dark']
  ),

  createComponent(
    'Footer - Social Links',
    'Footer focused on social media links',
    CATEGORIES.FOOTER,
    'footer',
    `<footer class="footer-social">
      <div class="footer-container">
        <div class="footer-brand">
          <div class="footer-logo">{{logo}}</div>
          <p class="footer-tagline">{{tagline}}</p>
        </div>
        <div class="social-section">
          <p class="social-title">{{socialTitle}}</p>
          <div class="social-links">
            <a href="{{twitterUrl}}" class="social-link">
              <span class="social-icon">𝕏</span>
              <span class="social-name">Twitter</span>
            </a>
            <a href="{{facebookUrl}}" class="social-link">
              <span class="social-icon">f</span>
              <span class="social-name">Facebook</span>
            </a>
            <a href="{{linkedinUrl}}" class="social-link">
              <span class="social-icon">in</span>
              <span class="social-name">LinkedIn</span>
            </a>
            <a href="{{instagramUrl}}" class="social-link">
              <span class="social-icon">📷</span>
              <span class="social-name">Instagram</span>
            </a>
            <a href="{{youtubeUrl}}" class="social-link">
              <span class="social-icon">▶</span>
              <span class="social-name">YouTube</span>
            </a>
          </div>
        </div>
        <p class="footer-copyright">{{copyright}}</p>
      </div>
    </footer>`,
    `.footer-social {
      padding: 60px 20px 30px;
      background: white;
      border-top: 1px solid #e5e7eb;
    }
    .footer-container {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    .footer-brand {
      margin-bottom: 3rem;
    }
    .footer-logo {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .footer-tagline {
      color: #6b7280;
      font-size: 1.125rem;
    }
    .social-section {
      margin-bottom: 3rem;
    }
    .social-title {
      font-weight: 600;
      color: #111827;
      margin-bottom: 1.5rem;
    }
    .social-links {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .social-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #f9fafb;
      border-radius: 0.5rem;
      color: #111827;
      text-decoration: none;
      transition: all 0.2s;
      border: 1px solid #e5e7eb;
    }
    .social-link:hover {
      background: #111827;
      color: white;
      border-color: #111827;
    }
    .social-icon {
      font-size: 1.25rem;
    }
    .social-name {
      font-weight: 500;
    }
    .footer-copyright {
      color: #6b7280;
      font-size: 0.875rem;
    }
    @media (max-width: 768px) {
      .social-links {
        flex-direction: column;
        align-items: stretch;
      }
      .social-link {
        justify-content: center;
      }
    }`,
    {
      logo: { type: 'text', label: 'Logo Text', default: 'Brand' },
      tagline: { type: 'text', label: 'Tagline', default: 'Connect with us on social media' },
      socialTitle: { type: 'text', label: 'Social Section Title', default: 'Follow Us' },
      twitterUrl: { type: 'text', label: 'Twitter URL', default: '#' },
      facebookUrl: { type: 'text', label: 'Facebook URL', default: '#' },
      linkedinUrl: { type: 'text', label: 'LinkedIn URL', default: '#' },
      instagramUrl: { type: 'text', label: 'Instagram URL', default: '#' },
      youtubeUrl: { type: 'text', label: 'YouTube URL', default: '#' },
      copyright: { type: 'text', label: 'Copyright Text', default: '© 2024 Brand. All rights reserved.' }
    },
    {
      logo: 'Brand',
      tagline: 'Connect with us on social media',
      socialTitle: 'Follow Us',
      twitterUrl: '#',
      facebookUrl: '#',
      linkedinUrl: '#',
      instagramUrl: '#',
      youtubeUrl: '#',
      copyright: '© 2024 Brand. All rights reserved.'
    },
    ['footer', 'social', 'links', 'centered']
  )
];

allComponents.push(...footerComponents);

console.log(`\n🎉 Week 1 Components Summary:`);
console.log(`✅ Created ${ctaComponents.length} CTA components`);
console.log(`✅ Created ${testimonialComponents.length} Testimonial components`);
console.log(`✅ Created ${pricingComponents.length} Pricing components`);
console.log(`✅ Created ${teamComponents.length} Team components`);
console.log(`✅ Created ${contactComponents.length} Contact components`);
console.log(`✅ Created ${footerComponents.length} Footer components`);
console.log(`\n📦 Total components in this file: ${allComponents.length}`);
console.log(`📝 Note: Hero (10) and Features (8) components are in separate files`);

// Seeding function
async function seedComponents() {
  try {
    console.log('🌱 Starting component seeding...\n');
    
    let successCount = 0;
    let errorCount = 0;

    for (const component of allComponents) {
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

    console.log(`\n📊 Seeding Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${allComponents.length}`);
    
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

module.exports = { allComponents, seedComponents };