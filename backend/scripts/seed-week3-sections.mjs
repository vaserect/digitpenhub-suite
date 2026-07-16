import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sections = [
  // Hero + Features Sections (5)
  {
    name: 'Hero with Feature Grid',
    description: 'Full-width hero section with integrated 3-column feature grid below',
    category: 'hero-features',
    preview_url: '/previews/sections/hero-feature-grid.jpg',
    html_content: `<section class="relative bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20"><div class="container mx-auto px-4"><div class="max-w-4xl mx-auto text-center mb-16"><h1 class="text-5xl font-bold mb-6">Transform Your Business Today</h1><p class="text-xl mb-8 text-blue-100">Powerful tools to help you grow faster and smarter</p></div></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['hero-gradient', 'feature-grid-3col'],
    tags: ['hero', 'features', 'gradient', 'cta']
  },
  {
    name: 'Hero with Icon Features',
    description: 'Centered hero with icon-based feature highlights',
    category: 'hero-features',
    preview_url: '/previews/sections/hero-icon-features.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><div class="max-w-3xl mx-auto text-center mb-16"><h1 class="text-5xl font-bold mb-6 text-gray-900">The Future of Work</h1></div></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['hero-centered', 'icon-features-4col'],
    tags: ['hero', 'features', 'icons', 'clean']
  },
  {
    name: 'Split Hero with Benefits',
    description: 'Two-column hero with image and benefit list',
    category: 'hero-features',
    preview_url: '/previews/sections/split-hero-benefits.jpg',
    html_content: `<section class="bg-gray-50 py-20"><div class="container mx-auto px-4"><div class="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto"><div><h1 class="text-5xl font-bold mb-6 text-gray-900">Grow Your Business Faster</h1></div></div></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['hero-split', 'benefit-list', 'stat-badge'],
    tags: ['hero', 'benefits', 'image', 'stats']
  },
  {
    name: 'Video Hero with Features',
    description: 'Hero section with background video and feature cards',
    category: 'hero-features',
    preview_url: '/previews/sections/video-hero-features.jpg',
    html_content: `<section class="relative min-h-screen flex items-center"><div class="container mx-auto px-4 relative z-20 text-white"><h1 class="text-6xl font-bold mb-6">Welcome to the Future</h1></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['hero-video', 'feature-cards-glass'],
    tags: ['hero', 'video', 'features', 'glassmorphism']
  },
  {
    name: 'Animated Hero with Stats',
    description: 'Hero with animated elements and live statistics',
    category: 'hero-features',
    preview_url: '/previews/sections/animated-hero-stats.jpg',
    html_content: `<section class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-24"><div class="container mx-auto px-4"><h1 class="text-6xl font-bold mb-6">Join the Revolution</h1></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['hero-gradient', 'animated-stats'],
    tags: ['hero', 'stats', 'animation', 'gradient']
  },

  // CTA + Testimonials Sections (5)
  {
    name: 'CTA with Social Proof',
    description: 'Call-to-action section with customer testimonials',
    category: 'cta-testimonials',
    preview_url: '/previews/sections/cta-social-proof.jpg',
    html_content: `<section class="bg-blue-600 text-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold mb-4">Ready to Get Started?</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['cta-centered', 'testimonial-cards'],
    tags: ['cta', 'testimonials', 'social-proof']
  },
  {
    name: 'Testimonial Grid with CTA',
    description: 'Large testimonial grid with prominent call-to-action',
    category: 'cta-testimonials',
    preview_url: '/previews/sections/testimonial-grid-cta.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-4 text-gray-900">Loved by Thousands</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['testimonial-grid', 'cta-button'],
    tags: ['testimonials', 'cta', 'grid']
  },
  {
    name: 'Video Testimonials with CTA',
    description: 'Video testimonials section with call-to-action',
    category: 'cta-testimonials',
    preview_url: '/previews/sections/video-testimonials-cta.jpg',
    html_content: `<section class="bg-gray-900 text-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-12">Hear From Our Customers</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['video-testimonials', 'cta-centered'],
    tags: ['testimonials', 'video', 'cta']
  },
  {
    name: 'Rotating Testimonials with Stats',
    description: 'Carousel testimonials with company statistics',
    category: 'cta-testimonials',
    preview_url: '/previews/sections/rotating-testimonials-stats.jpg',
    html_content: `<section class="bg-gradient-to-br from-purple-600 to-blue-600 text-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-12">Trusted by Industry Leaders</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['testimonial-carousel', 'stats-row', 'cta-button'],
    tags: ['testimonials', 'stats', 'carousel', 'cta']
  },
  {
    name: 'Trust Badges with CTA',
    description: 'Trust indicators and social proof with call-to-action',
    category: 'cta-testimonials',
    preview_url: '/previews/sections/trust-badges-cta.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold mb-4 text-gray-900">Join 50,000+ Happy Customers</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['trust-badges', 'logo-cloud', 'cta-centered'],
    tags: ['trust', 'social-proof', 'cta', 'logos']
  },

  // Pricing + Features Sections (5)
  {
    name: 'Pricing Table with Features',
    description: 'Three-tier pricing with detailed feature comparison',
    category: 'pricing-features',
    preview_url: '/previews/sections/pricing-features.jpg',
    html_content: `<section class="bg-gray-50 py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-4 text-gray-900">Simple, Transparent Pricing</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['pricing-table-3col', 'feature-list'],
    tags: ['pricing', 'features', 'comparison']
  },
  {
    name: 'Pricing with Toggle',
    description: 'Monthly/Annual pricing toggle with savings badge',
    category: 'pricing-features',
    preview_url: '/previews/sections/pricing-toggle.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-8 text-gray-900">Flexible Pricing Options</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['pricing-toggle', 'pricing-cards'],
    tags: ['pricing', 'toggle', 'savings']
  },
  {
    name: 'Feature Comparison Table',
    description: 'Detailed feature comparison across all plans',
    category: 'pricing-features',
    preview_url: '/previews/sections/feature-comparison.jpg',
    html_content: `<section class="bg-gray-50 py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-12 text-gray-900">Compare All Features</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['comparison-table', 'feature-rows'],
    tags: ['pricing', 'comparison', 'table', 'features']
  },
  {
    name: 'Pricing with FAQ',
    description: 'Pricing cards with frequently asked questions',
    category: 'pricing-features',
    preview_url: '/previews/sections/pricing-faq.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-12 text-gray-900">Pricing & FAQ</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['pricing-cards', 'faq-accordion'],
    tags: ['pricing', 'faq', 'accordion']
  },
  {
    name: 'Enterprise Pricing',
    description: 'Custom enterprise pricing with contact form',
    category: 'pricing-features',
    preview_url: '/previews/sections/enterprise-pricing.jpg',
    html_content: `<section class="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold mb-4">Enterprise Solutions</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['enterprise-card', 'contact-form'],
    tags: ['pricing', 'enterprise', 'contact']
  },

  // Team + Contact Sections (5)
  {
    name: 'Team Grid with Bios',
    description: 'Team member grid with photos and descriptions',
    category: 'team-contact',
    preview_url: '/previews/sections/team-grid.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-4 text-gray-900">Meet Our Team</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['team-grid-4col', 'team-card'],
    tags: ['team', 'about', 'people']
  },
  {
    name: 'Contact Form with Map',
    description: 'Contact form alongside location map',
    category: 'team-contact',
    preview_url: '/previews/sections/contact-map.jpg',
    html_content: `<section class="bg-gray-50 py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold mb-4 text-gray-900">Get In Touch</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['contact-form', 'map-embed'],
    tags: ['contact', 'form', 'map']
  },
  {
    name: 'Team with Contact Info',
    description: 'Team section with contact details and social links',
    category: 'team-contact',
    preview_url: '/previews/sections/team-contact.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-12 text-gray-900">Our Leadership Team</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['team-cards', 'social-links', 'contact-info'],
    tags: ['team', 'contact', 'social']
  },
  {
    name: 'Office Locations',
    description: 'Multiple office locations with contact details',
    category: 'team-contact',
    preview_url: '/previews/sections/office-locations.jpg',
    html_content: `<section class="bg-gray-50 py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-12 text-gray-900">Our Global Offices</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['location-cards', 'contact-details'],
    tags: ['contact', 'locations', 'offices']
  },
  {
    name: 'Support Contact Options',
    description: 'Multiple ways to contact support team',
    category: 'team-contact',
    preview_url: '/previews/sections/support-contact.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-4 text-gray-900">How Can We Help?</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['contact-options', 'icon-cards'],
    tags: ['contact', 'support', 'options']
  },

  // Gallery + Video Sections (5)
  {
    name: 'Image Gallery Grid',
    description: 'Masonry-style image gallery with lightbox',
    category: 'gallery-video',
    preview_url: '/previews/sections/gallery-grid.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-12 text-gray-900">Our Portfolio</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['gallery-grid', 'lightbox'],
    tags: ['gallery', 'images', 'portfolio']
  },
  {
    name: 'Video Showcase',
    description: 'Featured video with thumbnail grid',
    category: 'gallery-video',
    preview_url: '/previews/sections/video-showcase.jpg',
    html_content: `<section class="bg-gray-900 text-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-12">Watch Our Story</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['video-player', 'video-grid'],
    tags: ['video', 'showcase', 'media']
  },
  {
    name: 'Before After Slider',
    description: 'Interactive before/after image comparison',
    category: 'gallery-video',
    preview_url: '/previews/sections/before-after.jpg',
    html_content: `<section class="bg-gray-50 py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-12 text-gray-900">See The Difference</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['before-after-slider'],
    tags: ['gallery', 'comparison', 'interactive']
  },
  {
    name: 'Video Background Section',
    description: 'Full-width section with video background',
    category: 'gallery-video',
    preview_url: '/previews/sections/video-background.jpg',
    html_content: `<section class="relative min-h-96 flex items-center justify-center"><div class="relative z-20 text-white text-center px-4"><h2 class="text-5xl font-bold mb-4">Experience Excellence</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['video-background', 'overlay-content'],
    tags: ['video', 'background', 'hero']
  },
  {
    name: 'Instagram Feed',
    description: 'Social media feed integration',
    category: 'gallery-video',
    preview_url: '/previews/sections/instagram-feed.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-4 text-gray-900">Follow Us</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['instagram-grid', 'social-feed'],
    tags: ['gallery', 'social', 'instagram']
  },

  // Stats + Logos Sections (5)
  {
    name: 'Stats Counter',
    description: 'Animated statistics with icons',
    category: 'stats-logos',
    preview_url: '/previews/sections/stats-counter.jpg',
    html_content: `<section class="bg-blue-600 text-white py-20"><div class="container mx-auto px-4"><div class="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center"><div><div class="text-5xl font-bold mb-2">10M+</div></div></div></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['stats-counter', 'animated-numbers'],
    tags: ['stats', 'numbers', 'metrics']
  },
  {
    name: 'Logo Cloud',
    description: 'Client and partner logo showcase',
    category: 'stats-logos',
    preview_url: '/previews/sections/logo-cloud.jpg',
    html_content: `<section class="bg-gray-50 py-20"><div class="container mx-auto px-4"><h2 class="text-2xl font-bold text-center mb-12 text-gray-600">Trusted by leading companies</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['logo-grid', 'brand-showcase'],
    tags: ['logos', 'clients', 'partners']
  },
  {
    name: 'Achievement Badges',
    description: 'Awards and certifications display',
    category: 'stats-logos',
    preview_url: '/previews/sections/achievement-badges.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-12 text-gray-900">Awards & Recognition</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['badge-grid', 'award-cards'],
    tags: ['awards', 'badges', 'achievements']
  },
  {
    name: 'Stats with Progress Bars',
    description: 'Statistics with visual progress indicators',
    category: 'stats-logos',
    preview_url: '/previews/sections/stats-progress.jpg',
    html_content: `<section class="bg-gray-50 py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-12 text-gray-900">Our Impact</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['progress-bars', 'stats-list'],
    tags: ['stats', 'progress', 'metrics']
  },
  {
    name: 'Certification Showcase',
    description: 'Professional certifications and compliance badges',
    category: 'stats-logos',
    preview_url: '/previews/sections/certifications.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold text-center mb-4 text-gray-900">Certified & Compliant</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['certification-grid', 'badge-cards'],
    tags: ['certifications', 'compliance', 'badges']
  },

  // Navigation + Hero Sections (5)
  {
    name: 'Navbar with Mega Menu',
    description: 'Full-width navigation with dropdown mega menu',
    category: 'navigation-hero',
    preview_url: '/previews/sections/navbar-mega.jpg',
    html_content: `<nav class="bg-white shadow-lg"><div class="container mx-auto px-4"><div class="flex items-center justify-between h-20"><div class="text-2xl font-bold text-blue-600">Brand</div></div></div></nav>`,
    css_content: '',
    js_content: '',
    components_used: ['navbar', 'mega-menu'],
    tags: ['navigation', 'menu', 'header']
  },
  {
    name: 'Sticky Header with CTA',
    description: 'Fixed navigation bar with call-to-action',
    category: 'navigation-hero',
    preview_url: '/previews/sections/sticky-header.jpg',
    html_content: `<header class="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-md z-50"><div class="container mx-auto px-4"><div class="flex items-center justify-between h-16"><div class="text-xl font-bold">Logo</div></div></div></header>`,
    css_content: '',
    js_content: '',
    components_used: ['sticky-header', 'nav-links'],
    tags: ['navigation', 'sticky', 'header']
  },
  {
    name: 'Hero with Breadcrumbs',
    description: 'Page hero with navigation breadcrumbs',
    category: 'navigation-hero',
    preview_url: '/previews/sections/hero-breadcrumbs.jpg',
    html_content: `<section class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16"><div class="container mx-auto px-4"><h1 class="text-5xl font-bold mb-4">Page Title</h1></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['breadcrumbs', 'page-hero'],
    tags: ['navigation', 'breadcrumbs', 'hero']
  },
  {
    name: 'Mobile Menu Drawer',
    description: 'Responsive mobile navigation drawer',
    category: 'navigation-hero',
    preview_url: '/previews/sections/mobile-menu.jpg',
    html_content: `<nav class="bg-white shadow-lg"><div class="container mx-auto px-4"><div class="flex items-center justify-between h-16"><div class="text-xl font-bold">Brand</div></div></div></nav>`,
    css_content: '',
    js_content: '',
    components_used: ['mobile-menu', 'hamburger-button'],
    tags: ['navigation', 'mobile', 'responsive']
  },
  {
    name: 'Search Header',
    description: 'Navigation with integrated search bar',
    category: 'navigation-hero',
    preview_url: '/previews/sections/search-header.jpg',
    html_content: `<header class="bg-white shadow-md"><div class="container mx-auto px-4 py-4"><div class="flex items-center justify-between gap-4"><div class="text-2xl font-bold text-blue-600">Brand</div></div></div></header>`,
    css_content: '',
    js_content: '',
    components_used: ['search-bar', 'header-nav'],
    tags: ['navigation', 'search', 'header']
  },

  // Footer + Newsletter Sections (5)
  {
    name: 'Footer with Newsletter',
    description: 'Comprehensive footer with newsletter signup',
    category: 'footer-newsletter',
    preview_url: '/previews/sections/footer-newsletter.jpg',
    html_content: `<footer class="bg-gray-900 text-white py-16"><div class="container mx-auto px-4"><div class="grid md:grid-cols-4 gap-8 mb-12"><div><h3 class="text-xl font-bold mb-4">Company</h3></div></div></div></footer>`,
    css_content: '',
    js_content: '',
    components_used: ['footer-columns', 'newsletter-form'],
    tags: ['footer', 'newsletter', 'links']
  },
  {
    name: 'Newsletter Popup',
    description: 'Modal newsletter subscription form',
    category: 'footer-newsletter',
    preview_url: '/previews/sections/newsletter-popup.jpg',
    html_content: `<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden"><div class="bg-white rounded-2xl p-8 max-w-md mx-4"><h2 class="text-3xl font-bold mb-4 text-gray-900">Stay Updated</h2></div></div>`,
    css_content: '',
    js_content: '',
    components_used: ['modal', 'newsletter-form'],
    tags: ['newsletter', 'popup', 'modal']
  },
  {
    name: 'Inline Newsletter',
    description: 'Embedded newsletter signup section',
    category: 'footer-newsletter',
    preview_url: '/previews/sections/inline-newsletter.jpg',
    html_content: `<section class="bg-blue-600 py-16"><div class="container mx-auto px-4"><h2 class="text-4xl font-bold mb-4 text-white">Join Our Newsletter</h2></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['newsletter-inline', 'email-form'],
    tags: ['newsletter', 'inline', 'subscription']
  },
  {
    name: 'Minimal Footer',
    description: 'Clean minimal footer with essential links',
    category: 'footer-newsletter',
    preview_url: '/previews/sections/minimal-footer.jpg',
    html_content: `<footer class="bg-white border-t py-8"><div class="container mx-auto px-4"><div class="flex flex-col md:flex-row justify-between items-center"><p class="text-gray-600">&copy; 2024 Company. All rights reserved.</p></div></div></footer>`,
    css_content: '',
    js_content: '',
    components_used: ['footer-minimal', 'social-icons'],
    tags: ['footer', 'minimal', 'simple']
  },
  {
    name: 'Newsletter Banner',
    description: 'Full-width newsletter subscription banner',
    category: 'footer-newsletter',
    preview_url: '/previews/sections/newsletter-banner.jpg',
    html_content: `<section class="bg-gradient-to-r from-purple-600 to-blue-600 py-12"><div class="container mx-auto px-4"><div class="flex flex-col md:flex-row items-center justify-between gap-6"><div class="text-white"><h3 class="text-3xl font-bold mb-2">Stay in the Loop</h3></div></div></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['newsletter-banner', 'inline-form'],
    tags: ['newsletter', 'banner', 'subscription']
  },

  // Full Page Sections (10)
  {
    name: 'Landing Page Hero',
    description: 'Complete landing page hero with all elements',
    category: 'full-page',
    preview_url: '/previews/sections/landing-hero-full.jpg',
    html_content: `<section class="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white flex items-center"><div class="container mx-auto px-4"><div class="max-w-4xl mx-auto text-center"><h1 class="text-6xl font-bold mb-6">Complete Landing Solution</h1></div></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['hero-full', 'features', 'cta', 'social-proof'],
    tags: ['landing', 'hero', 'complete', 'full-page']
  },
  {
    name: 'About Us Page',
    description: 'Full about page with team, mission, and values',
    category: 'full-page',
    preview_url: '/previews/sections/about-page-full.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h1 class="text-5xl font-bold text-center mb-12 text-gray-900">About Our Company</h1></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['about-hero', 'mission', 'team-grid', 'values'],
    tags: ['about', 'team', 'mission', 'full-page']
  },
  {
    name: 'Services Overview',
    description: 'Complete services page layout',
    category: 'full-page',
    preview_url: '/previews/sections/services-page-full.jpg',
    html_content: `<section class="bg-gray-50 py-20"><div class="container mx-auto px-4"><h1 class="text-5xl font-bold text-center mb-12 text-gray-900">Our Services</h1></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['services-hero', 'service-cards', 'process', 'cta'],
    tags: ['services', 'offerings', 'full-page']
  },
  {
    name: 'Portfolio Showcase',
    description: 'Full portfolio page with filters and gallery',
    category: 'full-page',
    preview_url: '/previews/sections/portfolio-page-full.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h1 class="text-5xl font-bold text-center mb-12 text-gray-900">Our Work</h1></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['portfolio-hero', 'filter-tabs', 'gallery-grid', 'case-studies'],
    tags: ['portfolio', 'gallery', 'projects', 'full-page']
  },
  {
    name: 'Contact Page',
    description: 'Complete contact page with form and info',
    category: 'full-page',
    preview_url: '/previews/sections/contact-page-full.jpg',
    html_content: `<section class="bg-gray-50 py-20"><div class="container mx-auto px-4"><h1 class="text-5xl font-bold text-center mb-12 text-gray-900">Get In Touch</h1></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['contact-hero', 'contact-form', 'map', 'office-info'],
    tags: ['contact', 'form', 'locations', 'full-page']
  },
  {
    name: 'Pricing Page',
    description: 'Full pricing page with comparison and FAQ',
    category: 'full-page',
    preview_url: '/previews/sections/pricing-page-full.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h1 class="text-5xl font-bold text-center mb-12 text-gray-900">Choose Your Plan</h1></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['pricing-hero', 'pricing-table', 'comparison', 'faq'],
    tags: ['pricing', 'plans', 'comparison', 'full-page']
  },
  {
    name: 'Blog Homepage',
    description: 'Complete blog listing page',
    category: 'full-page',
    preview_url: '/previews/sections/blog-page-full.jpg',
    html_content: `<section class="bg-gray-50 py-20"><div class="container mx-auto px-4"><h1 class="text-5xl font-bold text-center mb-12 text-gray-900">Latest Articles</h1></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['blog-hero', 'post-grid', 'categories', 'newsletter'],
    tags: ['blog', 'articles', 'content', 'full-page']
  },
  {
    name: 'FAQ Page',
    description: 'Comprehensive FAQ page with search',
    category: 'full-page',
    preview_url: '/previews/sections/faq-page-full.jpg',
    html_content: `<section class="bg-white py-20"><div class="container mx-auto px-4"><h1 class="text-5xl font-bold text-center mb-12 text-gray-900">Frequently Asked Questions</h1></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['faq-hero', 'search-bar', 'faq-accordion', 'contact-cta'],
    tags: ['faq', 'help', 'support', 'full-page']
  },
  {
    name: 'Careers Page',
    description: 'Full careers page with job listings',
    category: 'full-page',
    preview_url: '/previews/sections/careers-page-full.jpg',
    html_content: `<section class="bg-gray-50 py-20"><div class="container mx-auto px-4"><h1 class="text-5xl font-bold text-center mb-12 text-gray-900">Join Our Team</h1></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['careers-hero', 'benefits', 'job-listings', 'culture'],
    tags: ['careers', 'jobs', 'hiring', 'full-page']
  },
  {
    name: 'Thank You Page',
    description: 'Post-submission thank you page',
    category: 'full-page',
    preview_url: '/previews/sections/thankyou-page-full.jpg',
    html_content: `<section class="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 text-white flex items-center justify-center"><div class="container mx-auto px-4 text-center"><h1 class="text-6xl font-bold mb-6">Thank You!</h1></div></section>`,
    css_content: '',
    js_content: '',
    components_used: ['thankyou-hero', 'next-steps', 'social-share'],
    tags: ['thankyou', 'confirmation', 'success', 'full-page']
  }
];

async function seedSections() {
  const client = await pool.connect();
  
  try {
    console.log('Starting Week 3 sections seeding...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const section of sections) {
      try {
        const result = await client.query(
          `INSERT INTO page_sections 
           (name, description, category, preview_url, html_content, css_content, js_content, components_used, tags, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
           RETURNING id, name`,
          [
            section.name,
            section.description,
            section.category,
            section.preview_url,
            section.html_content,
            section.css_content,
            section.js_content,
            section.components_used,
            section.tags
          ]
        );
        
        successCount++;
        console.log(`✓ Created section: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error creating section "${section.name}":`, error.message);
      }
    }
    
    console.log('\n=== Week 3 Seeding Complete ===');
    console.log(`✓ Successfully created: ${successCount} sections`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`📊 Total sections in database: ${successCount}`);
    
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedSections().catch(console.error);
