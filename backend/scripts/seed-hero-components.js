/**
 * Seed Script: Hero Components
 * Creates 10 premium hero section components with different styles
 * 
 * Usage: node scripts/seed-hero-components.js
 */

require('dotenv').config();
const db = require('../src/db');

const heroComponents = [
  {
    name: 'Modern Hero - Centered',
    description: 'Clean, centered hero section with gradient background and CTA button',
    category: 'hero',
    is_global: true,
    is_active: true,
    tags: ['hero', 'modern', 'centered', 'gradient'],
    component_data: {
      type: 'hero',
      variant: 'centered',
      html: `<section class="hero-modern-centered"><div class="hero-content"><h1 class="hero-title">{{title}}</h1><p class="hero-subtitle">{{subtitle}}</p><div class="hero-cta"><a href="{{ctaLink}}" class="btn-primary">{{ctaText}}</a></div></div></section>`,
      css: `.hero-modern-centered{min-height:600px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:4rem 2rem;text-align:center}.hero-content{max-width:800px;color:white}.hero-title{font-size:3.5rem;font-weight:800;margin-bottom:1.5rem;line-height:1.2}.hero-subtitle{font-size:1.5rem;margin-bottom:2.5rem;opacity:.95;line-height:1.6}.btn-primary{display:inline-block;padding:1rem 2.5rem;background:white;color:#667eea;font-weight:600;border-radius:.5rem;text-decoration:none;transition:transform .2s,box-shadow .2s}.btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(0,0,0,.2)}@media(max-width:768px){.hero-title{font-size:2.5rem}.hero-subtitle{font-size:1.25rem}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Build Something Amazing' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Create stunning websites without code' },
        ctaText: { type: 'text', label: 'Button Text', default: 'Get Started' },
        ctaLink: { type: 'text', label: 'Button Link', default: '#' }
      },
      defaultProps: {
        title: 'Build Something Amazing',
        subtitle: 'Create stunning websites without code',
        ctaText: 'Get Started',
        ctaLink: '#'
      }
    }
  },
  {
    name: 'Split Hero - Image Right',
    description: 'Two-column hero with content on left and image on right',
    category: 'hero',
    is_global: true,
    is_active: true,
    tags: ['hero', 'split', 'image', 'two-column'],
    component_data: {
      type: 'hero',
      variant: 'split',
      html: `<section class="hero-split"><div class="hero-split-container"><div class="hero-split-content"><h1 class="hero-split-title">{{title}}</h1><p class="hero-split-subtitle">{{subtitle}}</p><div class="hero-split-cta"><a href="{{ctaLink}}" class="btn-primary">{{ctaText}}</a><a href="{{secondaryLink}}" class="btn-secondary">{{secondaryText}}</a></div></div><div class="hero-split-image"><img src="{{imageUrl}}" alt="{{imageAlt}}"/></div></div></section>`,
      css: `.hero-split{padding:4rem 2rem;background:#f9fafb}.hero-split-container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}.hero-split-title{font-size:3rem;font-weight:800;color:#1f2937;margin-bottom:1.5rem;line-height:1.2}.hero-split-subtitle{font-size:1.25rem;color:#6b7280;margin-bottom:2rem;line-height:1.6}.hero-split-cta{display:flex;gap:1rem}.btn-primary{padding:.875rem 2rem;background:#3b82f6;color:white;font-weight:600;border-radius:.5rem;text-decoration:none;transition:background .2s}.btn-primary:hover{background:#2563eb}.btn-secondary{padding:.875rem 2rem;background:white;color:#3b82f6;font-weight:600;border:2px solid #3b82f6;border-radius:.5rem;text-decoration:none;transition:all .2s}.btn-secondary:hover{background:#eff6ff}.hero-split-image img{width:100%;height:auto;border-radius:1rem;box-shadow:0 20px 50px rgba(0,0,0,.1)}@media(max-width:768px){.hero-split-container{grid-template-columns:1fr;gap:2rem}.hero-split-title{font-size:2.25rem}.hero-split-cta{flex-direction:column}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Transform Your Business' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Powerful tools to grow your business faster' },
        ctaText: { type: 'text', label: 'Primary Button', default: 'Start Free Trial' },
        ctaLink: { type: 'text', label: 'Primary Link', default: '#' },
        secondaryText: { type: 'text', label: 'Secondary Button', default: 'Learn More' },
        secondaryLink: { type: 'text', label: 'Secondary Link', default: '#' },
        imageUrl: { type: 'image', label: 'Image URL', default: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800' },
        imageAlt: { type: 'text', label: 'Image Alt Text', default: 'Hero Image' }
      },
      defaultProps: {
        title: 'Transform Your Business',
        subtitle: 'Powerful tools to grow your business faster',
        ctaText: 'Start Free Trial',
        ctaLink: '#',
        secondaryText: 'Learn More',
        secondaryLink: '#',
        imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
        imageAlt: 'Hero Image'
      }
    }
  },
  {
    name: 'Video Background Hero',
    description: 'Full-screen hero with video background and overlay',
    category: 'hero',
    is_global: true,
    is_active: true,
    tags: ['hero', 'video', 'fullscreen', 'overlay'],
    component_data: {
      type: 'hero',
      variant: 'video',
      html: `<section class="hero-video"><video class="hero-video-bg" autoplay muted loop playsinline><source src="{{videoUrl}}" type="video/mp4"></video><div class="hero-video-overlay"></div><div class="hero-video-content"><h1 class="hero-video-title">{{title}}</h1><p class="hero-video-subtitle">{{subtitle}}</p><a href="{{ctaLink}}" class="btn-video-cta">{{ctaText}}</a></div></section>`,
      css: `.hero-video{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden}.hero-video-bg{position:absolute;top:50%;left:50%;min-width:100%;min-height:100%;width:auto;height:auto;transform:translate(-50%,-50%);z-index:0}.hero-video-overlay{position:absolute;inset:0;background:rgba(0,0,0,.5);z-index:1}.hero-video-content{position:relative;z-index:2;text-align:center;color:white;padding:2rem;max-width:900px}.hero-video-title{font-size:4rem;font-weight:900;margin-bottom:1.5rem;line-height:1.1;text-shadow:0 2px 10px rgba(0,0,0,.3)}.hero-video-subtitle{font-size:1.5rem;margin-bottom:2.5rem;line-height:1.6;text-shadow:0 2px 10px rgba(0,0,0,.3)}.btn-video-cta{display:inline-block;padding:1.25rem 3rem;background:white;color:#1f2937;font-weight:700;font-size:1.125rem;border-radius:.5rem;text-decoration:none;transition:transform .2s,box-shadow .2s}.btn-video-cta:hover{transform:scale(1.05);box-shadow:0 15px 40px rgba(0,0,0,.3)}@media(max-width:768px){.hero-video-title{font-size:2.5rem}.hero-video-subtitle{font-size:1.25rem}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Welcome to the Future' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Experience innovation like never before' },
        ctaText: { type: 'text', label: 'Button Text', default: 'Explore Now' },
        ctaLink: { type: 'text', label: 'Button Link', default: '#' },
        videoUrl: { type: 'text', label: 'Video URL', default: 'https://example.com/video.mp4' }
      },
      defaultProps: {
        title: 'Welcome to the Future',
        subtitle: 'Experience innovation like never before',
        ctaText: 'Explore Now',
        ctaLink: '#',
        videoUrl: 'https://example.com/video.mp4'
      }
    }
  },
  {
    name: 'Minimal Hero - Left Aligned',
    description: 'Clean, minimal hero with left-aligned text',
    category: 'hero',
    is_global: true,
    is_active: true,
    tags: ['hero', 'minimal', 'left-aligned', 'clean'],
    component_data: {
      type: 'hero',
      variant: 'minimal',
      html: `<section class="hero-minimal"><div class="hero-minimal-container"><div class="hero-minimal-badge">{{badge}}</div><h1 class="hero-minimal-title">{{title}}</h1><p class="hero-minimal-subtitle">{{subtitle}}</p><div class="hero-minimal-cta"><a href="{{ctaLink}}" class="btn-minimal-primary">{{ctaText}}</a><span class="hero-minimal-note">{{note}}</span></div></div></section>`,
      css: `.hero-minimal{padding:8rem 2rem 6rem;background:white}.hero-minimal-container{max-width:700px}.hero-minimal-badge{display:inline-block;padding:.5rem 1rem;background:#f3f4f6;color:#6b7280;font-size:.875rem;font-weight:600;border-radius:2rem;margin-bottom:2rem}.hero-minimal-title{font-size:4rem;font-weight:900;color:#111827;margin-bottom:1.5rem;line-height:1.1;letter-spacing:-.02em}.hero-minimal-subtitle{font-size:1.5rem;color:#6b7280;margin-bottom:2.5rem;line-height:1.6}.hero-minimal-cta{display:flex;align-items:center;gap:1.5rem}.btn-minimal-primary{padding:1rem 2rem;background:#111827;color:white;font-weight:600;border-radius:.5rem;text-decoration:none;transition:background .2s}.btn-minimal-primary:hover{background:#1f2937}.hero-minimal-note{font-size:.875rem;color:#9ca3af}@media(max-width:768px){.hero-minimal{padding:4rem 2rem 3rem}.hero-minimal-title{font-size:2.5rem}.hero-minimal-subtitle{font-size:1.25rem}.hero-minimal-cta{flex-direction:column;align-items:flex-start}}`,
      schema: {
        badge: { type: 'text', label: 'Badge Text', default: '✨ New Release' },
        title: { type: 'text', label: 'Title', default: 'Build faster, ship sooner' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'The modern platform for building exceptional digital experiences' },
        ctaText: { type: 'text', label: 'Button Text', default: 'Get Started' },
        ctaLink: { type: 'text', label: 'Button Link', default: '#' },
        note: { type: 'text', label: 'Note', default: 'No credit card required' }
      },
      defaultProps: {
        badge: '✨ New Release',
        title: 'Build faster, ship sooner',
        subtitle: 'The modern platform for building exceptional digital experiences',
        ctaText: 'Get Started',
        ctaLink: '#',
        note: 'No credit card required'
      }
    }
  },
  {
    name: 'Animated Gradient Hero',
    description: 'Eye-catching hero with animated gradient background',
    category: 'hero',
    is_global: true,
    is_active: true,
    tags: ['hero', 'animated', 'gradient', 'modern'],
    component_data: {
      type: 'hero',
      variant: 'animated-gradient',
      html: `<section class="hero-animated-gradient"><div class="hero-animated-bg"></div><div class="hero-animated-content"><h1 class="hero-animated-title">{{title}}</h1><p class="hero-animated-subtitle">{{subtitle}}</p><div class="hero-animated-cta"><a href="{{ctaLink}}" class="btn-animated-primary">{{ctaText}}</a></div><div class="hero-animated-features"><span>✓ {{feature1}}</span><span>✓ {{feature2}}</span><span>✓ {{feature3}}</span></div></div></section>`,
      css: `.hero-animated-gradient{position:relative;min-height:700px;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:4rem 2rem}.hero-animated-bg{position:absolute;inset:0;background:linear-gradient(45deg,#ff6b6b,#4ecdc4,#45b7d1,#f7b731);background-size:400% 400%;animation:gradientShift 15s ease infinite}@keyframes gradientShift{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}.hero-animated-content{position:relative;z-index:1;text-align:center;color:white;max-width:800px}.hero-animated-title{font-size:3.5rem;font-weight:900;margin-bottom:1.5rem;line-height:1.2;text-shadow:0 2px 20px rgba(0,0,0,.2)}.hero-animated-subtitle{font-size:1.5rem;margin-bottom:2.5rem;line-height:1.6;opacity:.95}.btn-animated-primary{display:inline-block;padding:1.25rem 3rem;background:white;color:#1f2937;font-weight:700;font-size:1.125rem;border-radius:.5rem;text-decoration:none;box-shadow:0 10px 30px rgba(0,0,0,.2);transition:transform .2s,box-shadow .2s}.btn-animated-primary:hover{transform:translateY(-3px);box-shadow:0 15px 40px rgba(0,0,0,.3)}.hero-animated-features{margin-top:3rem;display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;font-size:1rem;opacity:.9}@media(max-width:768px){.hero-animated-title{font-size:2.5rem}.hero-animated-subtitle{font-size:1.25rem}.hero-animated-features{flex-direction:column;gap:.5rem}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Create. Innovate. Succeed.' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Join thousands of creators building amazing things' },
        ctaText: { type: 'text', label: 'Button Text', default: 'Start Creating' },
        ctaLink: { type: 'text', label: 'Button Link', default: '#' },
        feature1: { type: 'text', label: 'Feature 1', default: 'No coding required' },
        feature2: { type: 'text', label: 'Feature 2', default: 'Free forever' },
        feature3: { type: 'text', label: 'Feature 3', default: 'Cancel anytime' }
      },
      defaultProps: {
        title: 'Create. Innovate. Succeed.',
        subtitle: 'Join thousands of creators building amazing things',
        ctaText: 'Start Creating',
        ctaLink: '#',
        feature1: 'No coding required',
        feature2: 'Free forever',
        feature3: 'Cancel anytime'
      }
    }
  },
  {
    name: 'Hero with Stats',
    description: 'Hero section with impressive statistics',
    category: 'hero',
    is_global: true,
    is_active: true,
    tags: ['hero', 'stats', 'metrics', 'social-proof'],
    component_data: {
      type: 'hero',
      variant: 'stats',
      html: `<section class="hero-stats"><div class="hero-stats-container"><div class="hero-stats-content"><h1 class="hero-stats-title">{{title}}</h1><p class="hero-stats-subtitle">{{subtitle}}</p><div class="hero-stats-cta"><a href="{{ctaLink}}" class="btn-stats-primary">{{ctaText}}</a><a href="{{secondaryLink}}" class="btn-stats-secondary">{{secondaryText}}</a></div></div><div class="hero-stats-metrics"><div class="stat-item"><div class="stat-value">{{stat1Value}}</div><div class="stat-label">{{stat1Label}}</div></div><div class="stat-item"><div class="stat-value">{{stat2Value}}</div><div class="stat-label">{{stat2Label}}</div></div><div class="stat-item"><div class="stat-value">{{stat3Value}}</div><div class="stat-label">{{stat3Label}}</div></div><div class="stat-item"><div class="stat-value">{{stat4Value}}</div><div class="stat-label">{{stat4Label}}</div></div></div></div></section>`,
      css: `.hero-stats{padding:6rem 2rem 4rem;background:linear-gradient(to bottom,#f9fafb 0%,white 100%)}.hero-stats-container{max-width:1200px;margin:0 auto}.hero-stats-content{text-align:center;margin-bottom:4rem}.hero-stats-title{font-size:3.5rem;font-weight:900;color:#111827;margin-bottom:1.5rem;line-height:1.2}.hero-stats-subtitle{font-size:1.5rem;color:#6b7280;margin-bottom:2.5rem;line-height:1.6;max-width:700px;margin-left:auto;margin-right:auto}.hero-stats-cta{display:flex;justify-content:center;gap:1rem}.btn-stats-primary{padding:1rem 2.5rem;background:#3b82f6;color:white;font-weight:600;border-radius:.5rem;text-decoration:none;transition:background .2s}.btn-stats-primary:hover{background:#2563eb}.btn-stats-secondary{padding:1rem 2.5rem;background:transparent;color:#3b82f6;font-weight:600;border:2px solid #3b82f6;border-radius:.5rem;text-decoration:none;transition:all .2s}.btn-stats-secondary:hover{background:#eff6ff}.hero-stats-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:2rem;padding:3rem;background:white;border-radius:1rem;box-shadow:0 10px 40px rgba(0,0,0,.05)}.stat-item{text-align:center}.stat-value{font-size:2.5rem;font-weight:800;color:#3b82f6;margin-bottom:.5rem}.stat-label{font-size:1rem;color:#6b7280;font-weight:500}@media(max-width:768px){.hero-stats-title{font-size:2.5rem}.hero-stats-subtitle{font-size:1.25rem}.hero-stats-cta{flex-direction:column}.hero-stats-metrics{grid-template-columns:repeat(2,1fr);gap:1.5rem;padding:2rem}.stat-value{font-size:2rem}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Trusted by Industry Leaders' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Join thousands of companies already using our platform' },
        ctaText: { type: 'text', label: 'Primary Button', default: 'Get Started' },
        ctaLink: { type: 'text', label: 'Primary Link', default: '#' },
        secondaryText: { type: 'text', label: 'Secondary Button', default: 'View Demo' },
        secondaryLink: { type: 'text', label: 'Secondary Link', default: '#' },
        stat1Value: { type: 'text', label: 'Stat 1 Value', default: '10K+' },
        stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Active Users' },
        stat2Value: { type: 'text', label: 'Stat 2 Value', default: '99.9%' },
        stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'Uptime' },
        stat3Value: { type: 'text', label: 'Stat 3 Value', default: '50M+' },
        stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'API Calls' },
        stat4Value: { type: 'text', label: 'Stat 4 Value', default: '4.9/5' },
        stat4Label: { type: 'text', label: 'Stat 4 Label', default: 'Rating' }
      },
      defaultProps: {
        title: 'Trusted by Industry Leaders',
        subtitle: 'Join thousands of companies already using our platform',
        ctaText: 'Get Started',
        ctaLink: '#',
        secondaryText: 'View Demo',
        secondaryLink: '#',
        stat1Value: '10K+',
        stat1Label: 'Active Users',
        stat2Value: '99.9%',
        stat2Label: 'Uptime',
        stat3Value: '50M+',
        stat3Label: 'API Calls',
        stat4Value: '4.9/5',
        stat4Label: 'Rating'
      }
    }
  },
  {
    name: 'Hero with Image Grid',
    description: 'Hero with content on left and image grid on right',
    category: 'hero',
    is_global: true,
    is_active: true,
    tags: ['hero', 'image-grid', 'showcase', 'portfolio'],
    component_data: {
      type: 'hero',
      variant: 'image-grid',
      html: `<section class="hero-image-grid"><div class="hero-grid-container"><div class="hero-grid-content"><h1 class="hero-grid-title">{{title}}</h1><p class="hero-grid-subtitle">{{subtitle}}</p><div class="hero-grid-features"><div class="feature-item">✓ {{feature1}}</div><div class="feature-item">✓ {{feature2}}</div><div class="feature-item">✓ {{feature3}}</div></div><a href="{{ctaLink}}" class="btn-grid-cta">{{ctaText}}</a></div><div class="hero-grid-images"><img src="{{image1}}" alt="Showcase 1" class="grid-img grid-img-1"/><img src="{{image2}}" alt="Showcase 2" class="grid-img grid-img-2"/><img src="{{image3}}" alt="Showcase 3" class="grid-img grid-img-3"/><img src="{{image4}}" alt="Showcase 4" class="grid-img grid-img-4"/></div></div></section>`,
      css: `.hero-image-grid{padding:4rem 2rem;background:white}.hero-grid-container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}.hero-grid-title{font-size:3rem;font-weight:900;color:#111827;margin-bottom:1.5rem;line-height:1.2}.hero-grid-subtitle{font-size:1.25rem;color:#6b7280;margin-bottom:2rem;line-height:1.6}.hero-grid-features{margin-bottom:2rem}.feature-item{padding:.75rem 0;color:#374151;font-size:1rem}.btn-grid-cta{display:inline-block;padding:1rem 2.5rem;background:#111827;color:white;font-weight:600;border-radius:.5rem;text-decoration:none;transition:background .2s}.btn-grid-cta:hover{background:#1f2937}.hero-grid-images{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}.grid-img{width:100%;height:200px;object-fit:cover;border-radius:.75rem;box-shadow:0 4px 15px rgba(0,0,0,.1);transition:transform .3s}.grid-img:hover{transform:scale(1.05)}.grid-img-1{grid-row:span 2;height:100%}@media(max-width:768px){.hero-grid-container{grid-template-columns:1fr;gap:2rem}.hero-grid-title{font-size:2.25rem}.hero-grid-images{grid-template-columns:1fr}.grid-img-1{grid-row:span 1;height:200px}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Showcase Your Work' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Beautiful portfolio layouts that make your work shine' },
        feature1: { type: 'text', label: 'Feature 1', default: 'Responsive design' },
        feature2: { type: 'text', label: 'Feature 2', default: 'Fast loading' },
        feature3: { type: 'text', label: 'Feature 3', default: 'SEO optimized' },
        ctaText: { type: 'text', label: 'Button Text', default: 'View Gallery' },
        ctaLink: { type: 'text', label: 'Button Link', default: '#' },
        image1: { type: 'image', label: 'Image 1', default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400' },
        image2: { type: 'image', label: 'Image 2', default: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400' },
        image3: { type: 'image', label: 'Image 3', default: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=400' },
        image4: { type: 'image', label: 'Image 4', default: 'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=400' }
      },
      defaultProps: {
        title: 'Showcase Your Work',
        subtitle: 'Beautiful portfolio layouts that make your work shine',
        feature1: 'Responsive design',
        feature2: 'Fast loading',
        feature3: 'SEO optimized',
        ctaText: 'View Gallery',
        ctaLink: '#',
        image1: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
        image2: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400',
        image3: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=400',
        image4: 'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=400'
      }
    }
  },
  {
    name: 'SaaS Hero - Product Focus',
    description: 'SaaS-style hero with product screenshot',
    category: 'hero',
    is_global: true,
    is_active: true,
    tags: ['hero', 'saas', 'product', 'screenshot'],
    component_data: {
      type: 'hero',
      variant: 'saas',
      html: `<section class="hero-saas"><div class="hero-saas-container"><div class="hero-saas-content"><div class="hero-saas-badge">{{badge}}</div><h1 class="hero-saas-title">{{title}}</h1><p class="hero-saas-subtitle">{{subtitle}}</p><div class="hero-saas-cta"><a href="{{ctaLink}}" class="btn-saas-primary">{{ctaText}}</a><div class="hero-saas-trust"><span>★★★★★</span><span>{{trustText}}</span></div></div></div><div class="hero-saas-product"><img src="{{productImage}}" alt="Product Screenshot" class="product-screenshot"/></div></div></section>`,
      css: `.hero-saas{padding:6rem 2rem 4rem;background:linear-gradient(to bottom,#eff6ff 0%,white 100%)}.hero-saas-container{max-width:1200px;margin:0 auto}.hero-saas-content{text-align:center;margin-bottom:3rem}.hero-saas-badge{display:inline-block;padding:.5rem 1.25rem;background:#dbeafe;color:#1e40af;font-size:.875rem;font-weight:600;border-radius:2rem;margin-bottom:1.5rem}.hero-saas-title{font-size:3.5rem;font-weight:900;color:#111827;margin-bottom:1.5rem;line-height:1.2;max-width:900px;margin-left:auto;margin-right:auto}.hero-saas-subtitle{font-size:1.5rem;color:#6b7280;margin-bottom:2.5rem;line-height:1.6;max-width:700px;margin-left:auto;margin-right:auto}.hero-saas-cta{display:flex;flex-direction:column;align-items:center;gap:1rem}.btn-saas-primary{padding:1.25rem 3rem;background:#3b82f6;color:white;font-weight:700;font-size:1.125rem;border-radius:.5rem;text-decoration:none;box-shadow:0 4px 15px rgba(59,130,246,.3);transition:all .2s}.btn-saas-primary:hover{background:#2563eb;transform:translateY(-2px);box-shadow:0 6px 20px rgba(59,130,246,.4)}.hero-saas-trust{display:flex;align-items:center;gap:.5rem;font-size:.875rem;color:#6b7280}.hero-saas-trust span:first-child{color:#fbbf24}.hero-saas-product{max-width:1000px;margin:0 auto}.product-screenshot{width:100%;height:auto;border-radius:1rem;box-shadow:0 25px 60px rgba(0,0,0,.15)}@media(max-width:768px){.hero-saas{padding:4rem 2rem 2rem}.hero-saas-title{font-size:2.5rem}.hero-saas-subtitle{font-size:1.25rem}}`,
      schema: {
        badge: { type: 'text', label: 'Badge', default: '🚀 Now in Beta' },
        title: { type: 'text', label: 'Title', default: 'The All-in-One Platform for Modern Teams' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Streamline your workflow with powerful tools designed for collaboration' },
        ctaText: { type: 'text', label: 'Button Text', default: 'Start Free Trial' },
        ctaLink: { type: 'text', label: 'Button Link', default: '#' },
        trustText: { type: 'text', label: 'Trust Text', default: 'Rated 4.9/5 by 1000+ users' },
        productImage: { type: 'image', label: 'Product Screenshot', default: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1000' }
      },
      defaultProps: {
        badge: '🚀 Now in Beta',
        title: 'The All-in-One Platform for Modern Teams',
        subtitle: 'Streamline your workflow with powerful tools designed for collaboration',
        ctaText: 'Start Free Trial',
        ctaLink: '#',
        trustText: 'Rated 4.9/5 by 1000+ users',
        productImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1000'
      }
    }
  },
  {
    name: 'Hero with Form',
    description: 'Hero section with inline signup form',
    category: 'hero',
    is_global: true,
    is_active: true,
    tags: ['hero', 'form', 'lead-generation', 'signup'],
    component_data: {
      type: 'hero',
      variant: 'form',
      html: `<section class="hero-form"><div class="hero-form-container"><div class="hero-form-content"><h1 class="hero-form-title">{{title}}</h1><p class="hero-form-subtitle">{{subtitle}}</p><form class="hero-form-signup"><input type="email" placeholder="{{emailPlaceholder}}" class="form-input"/><button type="submit" class="form-submit">{{submitText}}</button></form><p class="hero-form-note">{{note}}</p><div class="hero-form-social-proof"><div class="avatar-group"><img src="https://i.pravatar.cc/40?img=1" alt="User" class="avatar"/><img src="https://i.pravatar.cc/40?img=2" alt="User" class="avatar"/><img src="https://i.pravatar.cc/40?img=3" alt="User" class="avatar"/><img src="https://i.pravatar.cc/40?img=4" alt="User" class="avatar"/></div><span>{{socialProofText}}</span></div></div></div></section>`,
      css: `.hero-form{min-height:600px;display:flex;align-items:center;padding:4rem 2rem;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}.hero-form-container{max-width:600px;margin:0 auto}.hero-form-content{text-align:center;color:white}.hero-form-title{font-size:3.5rem;font-weight:900;margin-bottom:1.5rem;line-height:1.2}.hero-form-subtitle{font-size:1.5rem;margin-bottom:2.5rem;opacity:.95;line-height:1.6}.hero-form-signup{display:flex;gap:.75rem;margin-bottom:1rem}.form-input{flex:1;padding:1rem 1.5rem;border:none;border-radius:.5rem;font-size:1rem;outline:none}.form-submit{padding:1rem 2rem;background:#111827;color:white;border:none;border-radius:.5rem;font-weight:600;cursor:pointer;transition:background .2s}.form-submit:hover{background:#1f2937}.hero-form-note{font-size:.875rem;margin-bottom:2rem;opacity:.9}.hero-form-social-proof{display:flex;align-items:center;justify-content:center;gap:1rem;font-size:.875rem}.avatar-group{display:flex;margin-left:-0.5rem}.avatar{width:40px;height:40px;border-radius:50%;border:2px solid white;margin-left:-.5rem}@media(max-width:768px){.hero-form-title{font-size:2.5rem}.hero-form-subtitle{font-size:1.25rem}.hero-form-signup{flex-direction:column}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Start Your Free Trial Today' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Join thousands of satisfied customers' },
        emailPlaceholder: { type: 'text', label: 'Email Placeholder', default: 'Enter your email' },
        submitText: { type: 'text', label: 'Submit Button', default: 'Get Started' },
        note: { type: 'text', label: 'Note', default: 'No credit card required • Cancel anytime' },
        socialProofText: { type: 'text', label: 'Social Proof', default: 'Join 10,000+ users' }
      },
      defaultProps: {
        title: 'Start Your Free Trial Today',
        subtitle: 'Join thousands of satisfied customers',
        emailPlaceholder: 'Enter your email',
        submitText: 'Get Started',
        note: 'No credit card required • Cancel anytime',
        socialProofText: 'Join 10,000+ users'
      }
    }
  },
  {
    name: 'Hero with App Preview',
    description: 'Hero showcasing mobile app with device mockup',
    category: 'hero',
    is_global: true,
    is_active: true,
    tags: ['hero', 'app', 'mobile', 'mockup'],
    component_data: {
      type: 'hero',
      variant: 'app',
      html: `<section class="hero-app"><div class="hero-app-container"><div class="hero-app-content"><h1 class="hero-app-title">{{title}}</h1><p class="hero-app-subtitle">{{subtitle}}</p><div class="hero-app-badges"><a href="{{appStoreLink}}" class="app-badge"><img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store"/></a><a href="{{playStoreLink}}" class="app-badge"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Google Play"/></a></div><div class="hero-app-features"><span>✓ {{feature1}}</span><span>✓ {{feature2}}</span><span>✓ {{feature3}}</span></div></div><div class="hero-app-mockup"><img src="{{mockupImage}}" alt="App Preview" class="mockup-image"/></div></div></section>`,
      css: `.hero-app{padding:4rem 2rem;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}.hero-app-container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}.hero-app-content{color:white}.hero-app-title{font-size:3.5rem;font-weight:900;margin-bottom:1.5rem;line-height:1.2}.hero-app-subtitle{font-size:1.5rem;margin-bottom:2.5rem;opacity:.95;line-height:1.6}.hero-app-badges{display:flex;gap:1rem;margin-bottom:2rem}.app-badge img{height:50px;width:auto}.hero-app-features{display:flex;flex-direction:column;gap:.75rem;font-size:1.125rem}.hero-app-mockup{display:flex;justify-content:center}.mockup-image{max-width:100%;height:auto;filter:drop-shadow(0 25px 50px rgba(0,0,0,.3))}@media(max-width:768px){.hero-app-container{grid-template-columns:1fr;gap:2rem}.hero-app-title{font-size:2.5rem}.hero-app-subtitle{font-size:1.25rem}.hero-app-badges{flex-direction:column}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Your Life, Simplified' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'The app that helps you stay organized and productive' },
        feature1: { type: 'text', label: 'Feature 1', default: 'Available on iOS & Android' },
        feature2: { type: 'text', label: 'Feature 2', default: 'Sync across all devices' },
        feature3: { type: 'text', label: 'Feature 3', default: 'Free to download' },
        appStoreLink: { type: 'text', label: 'App Store Link', default: '#' },
        playStoreLink: { type: 'text', label: 'Play Store Link', default: '#' },
        mockupImage: { type: 'image', label: 'Mockup Image', default: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400' }
      },
      defaultProps: {
        title: 'Your Life, Simplified',
        subtitle: 'The app that helps you stay organized and productive',
        feature1: 'Available on iOS & Android',
        feature2: 'Sync across all devices',
        feature3: 'Free to download',
        appStoreLink: '#',
        playStoreLink: '#',
        mockupImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400'
      }
    }
  }
];

async function seedHeroComponents() {
  console.log('🌱 Seeding hero components...\n');
  
  try {
    let successCount = 0;
    let errorCount = 0;

    for (const component of heroComponents) {
      try {
        await db.query(
          `INSERT INTO builder_components (
            name, description, category, is_global, is_active,
            component_data, tags
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT DO NOTHING`,
          [
            component.name,
            component.description,
            component.category,
            component.is_global,
            component.is_active,
            JSON.stringify(component.component_data),
            component.tags
          ]
        );
        successCount++;
        console.log(`✓ Created: ${component.name}`);
      } catch (err) {
        errorCount++;
        console.error(`✗ Failed to create ${component.name}:`, err.message);
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Success: ${successCount}/${heroComponents.length}`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount}`);
    }
    
    await db.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedHeroComponents();
}

module.exports = { seedHeroComponents, heroComponents };