import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const templates = [
  // Business/Corporate Templates (2)
  {
    name: 'Corporate Pro',
    description: 'Professional corporate website template with modern design and comprehensive business pages',
    category: 'business',
    preview_url: '/previews/templates/corporate-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/corporate-pro.jpg',
    demo_url: '/demos/corporate-pro',
    pages: [
      { name: 'Home', slug: 'home', sections: ['hero-gradient', 'feature-grid-3col', 'stats-counter', 'testimonial-cards', 'cta-centered'] },
      { name: 'About', slug: 'about', sections: ['page-hero', 'mission-vision', 'team-grid-4col', 'company-values', 'office-locations'] },
      { name: 'Services', slug: 'services', sections: ['services-hero', 'service-cards-grid', 'process-timeline', 'pricing-table-3col', 'contact-cta'] },
      { name: 'Contact', slug: 'contact', sections: ['contact-hero', 'contact-form', 'map-embed', 'office-info', 'social-links'] }
    ],
    color_scheme: {
      primary: '#2563eb',
      secondary: '#1e40af',
      accent: '#3b82f6',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    features: ['Responsive Design', 'SEO Optimized', 'Contact Forms', 'Google Maps', 'Team Showcase', 'Service Pages'],
    tags: ['business', 'corporate', 'professional', 'services'],
    is_premium: false
  },
  {
    name: 'Business Elite',
    description: 'Premium business template with advanced features for established companies',
    category: 'business',
    preview_url: '/previews/templates/business-elite.jpg',
    thumbnail_url: '/previews/templates/thumbs/business-elite.jpg',
    demo_url: '/demos/business-elite',
    pages: [
      { name: 'Home', slug: 'home', sections: ['hero-video', 'feature-cards-glass', 'stats-animated', 'client-logos', 'testimonial-carousel'] },
      { name: 'About', slug: 'about', sections: ['about-hero', 'company-story', 'leadership-team', 'awards-badges', 'careers-cta'] },
      { name: 'Solutions', slug: 'solutions', sections: ['solutions-hero', 'solution-tabs', 'case-studies', 'roi-calculator', 'demo-cta'] },
      { name: 'Resources', slug: 'resources', sections: ['resources-hero', 'blog-grid', 'whitepapers', 'webinars', 'newsletter-signup'] },
      { name: 'Contact', slug: 'contact', sections: ['contact-hero', 'multi-contact-options', 'office-locations', 'support-hours', 'live-chat'] }
    ],
    color_scheme: {
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#3b82f6',
      background: '#ffffff',
      text: '#334155'
    },
    fonts: {
      heading: 'Poppins',
      body: 'Inter'
    },
    features: ['Video Background', 'Advanced Animations', 'Case Studies', 'Resource Library', 'Multi-location Support', 'Live Chat Integration'],
    tags: ['business', 'corporate', 'premium', 'enterprise'],
    is_premium: true
  },

  // E-commerce/Store Templates (2)
  {
    name: 'Shop Modern',
    description: 'Clean and modern e-commerce template perfect for online stores',
    category: 'ecommerce',
    preview_url: '/previews/templates/shop-modern.jpg',
    thumbnail_url: '/previews/templates/thumbs/shop-modern.jpg',
    demo_url: '/demos/shop-modern',
    pages: [
      { name: 'Home', slug: 'home', sections: ['hero-banner', 'featured-products', 'category-grid', 'bestsellers', 'newsletter-signup'] },
      { name: 'Shop', slug: 'shop', sections: ['shop-header', 'filter-sidebar', 'product-grid', 'pagination', 'recently-viewed'] },
      { name: 'Product', slug: 'product', sections: ['product-gallery', 'product-details', 'add-to-cart', 'related-products', 'reviews'] },
      { name: 'Cart', slug: 'cart', sections: ['cart-items', 'cart-summary', 'coupon-code', 'shipping-calculator', 'checkout-cta'] },
      { name: 'About', slug: 'about', sections: ['brand-story', 'our-values', 'sustainability', 'team-photos', 'contact-info'] }
    ],
    color_scheme: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#34d399',
      background: '#ffffff',
      text: '#111827'
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Open Sans'
    },
    features: ['Product Catalog', 'Shopping Cart', 'Product Filters', 'Wishlist', 'Product Reviews', 'Checkout Flow'],
    tags: ['ecommerce', 'shop', 'store', 'retail'],
    is_premium: false
  },
  {
    name: 'Fashion Store Pro',
    description: 'Premium fashion e-commerce template with stunning visuals and advanced features',
    category: 'ecommerce',
    preview_url: '/previews/templates/fashion-store-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/fashion-store-pro.jpg',
    demo_url: '/demos/fashion-store-pro',
    pages: [
      { name: 'Home', slug: 'home', sections: ['hero-slider', 'collection-showcase', 'trending-products', 'instagram-feed', 'brand-story'] },
      { name: 'Collections', slug: 'collections', sections: ['collection-hero', 'collection-grid', 'lookbook', 'style-guide', 'shop-cta'] },
      { name: 'Product', slug: 'product', sections: ['product-images-zoom', 'size-guide', 'product-info', 'styling-tips', 'customer-photos'] },
      { name: 'Lookbook', slug: 'lookbook', sections: ['lookbook-hero', 'outfit-grid', 'shop-the-look', 'style-inspiration', 'follow-us'] },
      { name: 'About', slug: 'about', sections: ['brand-video', 'our-story', 'sustainability', 'artisans', 'press-features'] }
    ],
    color_scheme: {
      primary: '#000000',
      secondary: '#1f2937',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#374151'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lato'
    },
    features: ['Image Zoom', 'Size Guide', 'Lookbook', 'Instagram Integration', 'Style Tips', 'Customer Photos', 'Video Content'],
    tags: ['ecommerce', 'fashion', 'premium', 'luxury'],
    is_premium: true
  },

  // Portfolio/Agency Templates (2)
  {
    name: 'Creative Portfolio',
    description: 'Stunning portfolio template for creatives, designers, and artists',
    category: 'portfolio',
    preview_url: '/previews/templates/creative-portfolio.jpg',
    thumbnail_url: '/previews/templates/thumbs/creative-portfolio.jpg',
    demo_url: '/demos/creative-portfolio',
    pages: [
      { name: 'Home', slug: 'home', sections: ['hero-minimal', 'featured-work', 'about-intro', 'skills-showcase', 'contact-cta'] },
      { name: 'Portfolio', slug: 'portfolio', sections: ['portfolio-hero', 'filter-tabs', 'masonry-gallery', 'load-more', 'testimonials'] },
      { name: 'Project', slug: 'project', sections: ['project-hero', 'project-details', 'image-gallery', 'next-project', 'hire-me-cta'] },
      { name: 'About', slug: 'about', sections: ['about-hero', 'bio', 'experience-timeline', 'awards', 'clients-worked-with'] },
      { name: 'Contact', slug: 'contact', sections: ['contact-hero', 'contact-form', 'availability', 'social-links', 'location'] }
    ],
    color_scheme: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#a78bfa',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Space Grotesk',
      body: 'Inter'
    },
    features: ['Masonry Gallery', 'Project Filtering', 'Lightbox', 'Smooth Animations', 'Contact Form', 'Social Integration'],
    tags: ['portfolio', 'creative', 'designer', 'artist'],
    is_premium: false
  },
  {
    name: 'Agency Pro',
    description: 'Professional agency template for digital agencies and creative studios',
    category: 'portfolio',
    preview_url: '/previews/templates/agency-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/agency-pro.jpg',
    demo_url: '/demos/agency-pro',
    pages: [
      { name: 'Home', slug: 'home', sections: ['hero-animated', 'services-grid', 'case-studies-featured', 'client-logos', 'team-intro'] },
      { name: 'Services', slug: 'services', sections: ['services-hero', 'service-details', 'process', 'pricing-packages', 'faq'] },
      { name: 'Work', slug: 'work', sections: ['work-hero', 'project-grid', 'case-study-preview', 'results-stats', 'testimonials'] },
      { name: 'Case Study', slug: 'case-study', sections: ['case-hero', 'challenge', 'solution', 'results', 'next-case'] },
      { name: 'About', slug: 'about', sections: ['agency-story', 'team-grid', 'culture', 'awards', 'careers'] },
      { name: 'Contact', slug: 'contact', sections: ['contact-hero', 'project-brief-form', 'office-locations', 'meeting-scheduler', 'social'] }
    ],
    color_scheme: {
      primary: '#ef4444',
      secondary: '#dc2626',
      accent: '#f87171',
      background: '#ffffff',
      text: '#111827'
    },
    fonts: {
      heading: 'DM Sans',
      body: 'Inter'
    },
    features: ['Case Studies', 'Team Showcase', 'Service Pages', 'Project Brief Form', 'Meeting Scheduler', 'Awards Display'],
    tags: ['agency', 'portfolio', 'professional', 'creative'],
    is_premium: true
  },

  // SaaS/Tech Templates (2)
  {
    name: 'SaaS Starter',
    description: 'Modern SaaS template perfect for software products and tech startups',
    category: 'saas',
    preview_url: '/previews/templates/saas-starter.jpg',
    thumbnail_url: '/previews/templates/thumbs/saas-starter.jpg',
    demo_url: '/demos/saas-starter',
    pages: [
      { name: 'Home', slug: 'home', sections: ['hero-product', 'features-grid', 'how-it-works', 'pricing-simple', 'testimonials', 'cta-signup'] },
      { name: 'Features', slug: 'features', sections: ['features-hero', 'feature-details', 'integrations', 'security', 'api-docs-link'] },
      { name: 'Pricing', slug: 'pricing', sections: ['pricing-hero', 'pricing-toggle', 'comparison-table', 'faq', 'trial-cta'] },
      { name: 'About', slug: 'about', sections: ['company-mission', 'team', 'investors', 'press', 'careers'] },
      { name: 'Contact', slug: 'contact', sections: ['support-options', 'contact-form', 'knowledge-base-link', 'community', 'social'] }
    ],
    color_scheme: {
      primary: '#6366f1',
      secondary: '#4f46e5',
      accent: '#818cf8',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    features: ['Product Showcase', 'Pricing Calculator', 'Feature Comparison', 'Integration Display', 'Free Trial CTA', 'Knowledge Base'],
    tags: ['saas', 'software', 'tech', 'startup'],
    is_premium: false
  },
  {
    name: 'Tech Platform Pro',
    description: 'Enterprise-grade SaaS template with advanced features and integrations',
    category: 'saas',
    preview_url: '/previews/templates/tech-platform-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/tech-platform-pro.jpg',
    demo_url: '/demos/tech-platform-pro',
    pages: [
      { name: 'Home', slug: 'home', sections: ['hero-interactive', 'product-demo', 'features-tabs', 'social-proof', 'integration-showcase'] },
      { name: 'Product', slug: 'product', sections: ['product-overview', 'feature-deep-dive', 'use-cases', 'technical-specs', 'demo-request'] },
      { name: 'Solutions', slug: 'solutions', sections: ['solutions-hero', 'industry-solutions', 'case-studies', 'roi-calculator', 'consultation'] },
      { name: 'Pricing', slug: 'pricing', sections: ['pricing-hero', 'enterprise-pricing', 'volume-discounts', 'add-ons', 'contact-sales'] },
      { name: 'Resources', slug: 'resources', sections: ['resource-hub', 'documentation', 'api-reference', 'tutorials', 'webinars'] },
      { name: 'Company', slug: 'company', sections: ['about-us', 'leadership', 'investors', 'newsroom', 'careers'] }
    ],
    color_scheme: {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      accent: '#38bdf8',
      background: '#ffffff',
      text: '#0f172a'
    },
    fonts: {
      heading: 'Outfit',
      body: 'Inter'
    },
    features: ['Interactive Demo', 'Use Cases', 'ROI Calculator', 'API Documentation', 'Enterprise Features', 'Resource Hub', 'Webinars'],
    tags: ['saas', 'enterprise', 'platform', 'tech'],
    is_premium: true
  },

  // Blog/Content Templates (2)
  {
    name: 'Blog Simple',
    description: 'Clean and minimal blog template focused on content and readability',
    category: 'blog',
    preview_url: '/previews/templates/blog-simple.jpg',
    thumbnail_url: '/previews/templates/thumbs/blog-simple.jpg',
    demo_url: '/demos/blog-simple',
    pages: [
      { name: 'Home', slug: 'home', sections: ['blog-hero', 'featured-posts', 'recent-posts', 'categories', 'newsletter'] },
      { name: 'Blog', slug: 'blog', sections: ['blog-header', 'post-grid', 'sidebar', 'pagination', 'popular-posts'] },
      { name: 'Post', slug: 'post', sections: ['post-header', 'post-content', 'author-bio', 'related-posts', 'comments'] },
      { name: 'About', slug: 'about', sections: ['author-intro', 'bio', 'social-links', 'contact-form', 'newsletter-signup'] },
      { name: 'Contact', slug: 'contact', sections: ['contact-hero', 'contact-form', 'social-media', 'faq', 'newsletter'] }
    ],
    color_scheme: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#10b981',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Merriweather',
      body: 'Open Sans'
    },
    features: ['Post Grid', 'Categories', 'Tags', 'Author Bio', 'Comments', 'Newsletter', 'Social Sharing'],
    tags: ['blog', 'content', 'minimal', 'writing'],
    is_premium: false
  },
  {
    name: 'Magazine Pro',
    description: 'Feature-rich magazine-style blog template for content creators',
    category: 'blog',
    preview_url: '/previews/templates/magazine-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/magazine-pro.jpg',
    demo_url: '/demos/magazine-pro',
    pages: [
      { name: 'Home', slug: 'home', sections: ['hero-slider', 'featured-grid', 'trending', 'category-sections', 'editors-picks'] },
      { name: 'Category', slug: 'category', sections: ['category-hero', 'featured-in-category', 'post-list', 'subcategories', 'trending-sidebar'] },
      { name: 'Article', slug: 'article', sections: ['article-hero', 'article-content', 'inline-ads', 'author-card', 'related-articles', 'comments'] },
      { name: 'Authors', slug: 'authors', sections: ['authors-grid', 'author-profiles', 'top-contributors', 'join-team-cta'] },
      { name: 'About', slug: 'about', sections: ['magazine-story', 'editorial-team', 'contributors', 'advertise', 'contact'] }
    ],
    color_scheme: {
      primary: '#dc2626',
      secondary: '#b91c1c',
      accent: '#ef4444',
      background: '#ffffff',
      text: '#111827'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lora'
    },
    features: ['Hero Slider', 'Multiple Layouts', 'Author Profiles', 'Ad Spaces', 'Trending Posts', 'Category Pages', 'Editorial Calendar'],
    tags: ['blog', 'magazine', 'content', 'news'],
    is_premium: true
  },

  // Additional Templates (2)
  {
    name: 'Restaurant Deluxe',
    description: 'Elegant restaurant template with menu, reservations, and online ordering',
    category: 'restaurant',
    preview_url: '/previews/templates/restaurant-deluxe.jpg',
    thumbnail_url: '/previews/templates/thumbs/restaurant-deluxe.jpg',
    demo_url: '/demos/restaurant-deluxe',
    pages: [
      { name: 'Home', slug: 'home', sections: ['hero-fullscreen', 'about-intro', 'menu-preview', 'chef-special', 'reservations-cta'] },
      { name: 'Menu', slug: 'menu', sections: ['menu-hero', 'menu-categories', 'dishes-grid', 'drinks', 'order-online'] },
      { name: 'Reservations', slug: 'reservations', sections: ['reservation-form', 'availability-calendar', 'private-dining', 'events', 'policies'] },
      { name: 'About', slug: 'about', sections: ['restaurant-story', 'chef-team', 'ingredients', 'awards', 'press'] },
      { name: 'Contact', slug: 'contact', sections: ['location-map', 'hours', 'contact-info', 'directions', 'parking'] }
    ],
    color_scheme: {
      primary: '#92400e',
      secondary: '#78350f',
      accent: '#d97706',
      background: '#fffbeb',
      text: '#1c1917'
    },
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Lato'
    },
    features: ['Online Menu', 'Reservation System', 'Online Ordering', 'Event Booking', 'Chef Profiles', 'Gallery', 'Location Map'],
    tags: ['restaurant', 'food', 'dining', 'hospitality'],
    is_premium: true
  },
  {
    name: 'Fitness Studio',
    description: 'Dynamic fitness and wellness template with class schedules and memberships',
    category: 'fitness',
    preview_url: '/previews/templates/fitness-studio.jpg',
    thumbnail_url: '/previews/templates/thumbs/fitness-studio.jpg',
    demo_url: '/demos/fitness-studio',
    pages: [
      { name: 'Home', slug: 'home', sections: ['hero-video', 'class-preview', 'trainers-intro', 'membership-plans', 'transformation-stories'] },
      { name: 'Classes', slug: 'classes', sections: ['classes-hero', 'class-schedule', 'class-types', 'virtual-classes', 'book-class'] },
      { name: 'Trainers', slug: 'trainers', sections: ['trainers-grid', 'trainer-profiles', 'specializations', 'book-session', 'testimonials'] },
      { name: 'Membership', slug: 'membership', sections: ['membership-hero', 'plans-comparison', 'amenities', 'trial-offer', 'join-now'] },
      { name: 'About', slug: 'about', sections: ['studio-story', 'facilities-tour', 'community', 'success-stories', 'contact'] }
    ],
    color_scheme: {
      primary: '#ea580c',
      secondary: '#c2410c',
      accent: '#fb923c',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Bebas Neue',
      body: 'Roboto'
    },
    features: ['Class Schedule', 'Booking System', 'Trainer Profiles', 'Membership Plans', 'Virtual Classes', 'Progress Tracking', 'Community'],
    tags: ['fitness', 'gym', 'wellness', 'health'],
    is_premium: false
  }
];

async function seedTemplates() {
  const client = await pool.connect();
  
  try {
    console.log('Starting Week 4 templates seeding...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const template of templates) {
      try {
        const result = await client.query(
          `INSERT INTO site_templates 
           (name, description, category, preview_url, thumbnail_url, demo_url, pages, color_scheme, fonts, features, tags, is_premium, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
           RETURNING id, name`,
          [
            template.name,
            template.description,
            template.category,
            template.preview_url,
            template.thumbnail_url,
            template.demo_url,
            JSON.stringify(template.pages),
            JSON.stringify(template.color_scheme),
            JSON.stringify(template.fonts),
            template.features,
            template.tags,
            template.is_premium
          ]
        );
        
        successCount++;
        console.log(`✓ Created template: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error creating template "${template.name}":`, error.message);
      }
    }
    
    console.log('\n=== Week 4 Seeding Complete ===');
    console.log(`✓ Successfully created: ${successCount} templates`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`📊 Total templates in database: ${successCount}`);
    
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTemplates().catch(console.error);
