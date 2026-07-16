import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const industryTemplatesBatch2 = [
  // Automotive Template
  {
    name: 'Auto Dealership Pro',
    description: 'Professional automotive dealership website with inventory, financing, and service booking',
    category: 'automotive',
    preview_url: '/previews/templates/auto-dealership-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/auto-dealership-pro.jpg',
    demo_url: '/demos/auto-dealership-pro',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-automotive', 'featured-vehicles', 'search-inventory', 'special-offers', 'testimonials', 'financing-cta'] 
      },
      { 
        name: 'Inventory', 
        slug: 'inventory', 
        sections: ['inventory-hero', 'vehicle-filters', 'vehicle-grid', 'compare-vehicles', 'financing-calculator', 'trade-in-value'] 
      },
      { 
        name: 'Vehicle Details', 
        slug: 'vehicle', 
        sections: ['vehicle-gallery', 'specs-features', 'pricing-options', 'financing-options', 'schedule-test-drive', 'similar-vehicles'] 
      },
      { 
        name: 'Financing', 
        slug: 'financing', 
        sections: ['financing-hero', 'loan-calculator', 'credit-application', 'financing-options', 'trade-in-appraisal', 'faq'] 
      },
      { 
        name: 'Service', 
        slug: 'service', 
        sections: ['service-hero', 'service-types', 'maintenance-packages', 'parts-accessories', 'schedule-service', 'service-specials'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['dealership-story', 'team', 'awards', 'community-involvement', 'careers', 'why-choose-us'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'location-map', 'hours', 'departments', 'contact-form', 'directions'] 
      }
    ],
    color_scheme: {
      primary: '#dc2626',
      secondary: '#b91c1c',
      accent: '#ef4444',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Open Sans'
    },
    features: ['Vehicle Inventory', 'Advanced Search', 'Financing Calculator', 'Trade-in Appraisal', 'Service Booking', 'Test Drive Scheduling', 'Compare Vehicles', 'Special Offers'],
    tags: ['automotive', 'dealership', 'cars', 'vehicles'],
    is_premium: true
  },

  // Architecture Firm Template
  {
    name: 'Architecture Studio',
    description: 'Elegant architecture firm website showcasing projects, services, and design philosophy',
    category: 'architecture',
    preview_url: '/previews/templates/architecture-studio.jpg',
    thumbnail_url: '/previews/templates/thumbs/architecture-studio.jpg',
    demo_url: '/demos/architecture-studio',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-minimal-architecture', 'featured-projects', 'services-overview', 'design-philosophy', 'awards', 'consultation-cta'] 
      },
      { 
        name: 'Projects', 
        slug: 'projects', 
        sections: ['projects-hero', 'project-categories', 'project-grid', 'project-filters', 'awards-recognition'] 
      },
      { 
        name: 'Project Detail', 
        slug: 'project-detail', 
        sections: ['project-hero-image', 'project-overview', 'design-process', 'image-gallery', 'technical-details', 'team-credits', 'next-project'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'architectural-design', 'interior-design', 'urban-planning', 'consultation', 'project-management', 'sustainability'] 
      },
      { 
        name: 'Studio', 
        slug: 'studio', 
        sections: ['studio-story', 'design-philosophy', 'team-architects', 'studio-space', 'sustainability-commitment', 'careers'] 
      },
      { 
        name: 'Insights', 
        slug: 'insights', 
        sections: ['blog-hero', 'articles', 'design-trends', 'case-studies', 'publications', 'newsletter'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'consultation-form', 'studio-location', 'office-hours', 'social-media'] 
      }
    ],
    color_scheme: {
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#64748b',
      background: '#ffffff',
      text: '#334155'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter'
    },
    features: ['Project Portfolio', 'Image Galleries', 'Design Process', 'Service Pages', 'Team Profiles', 'Blog', 'Awards Display', 'Consultation Booking'],
    tags: ['architecture', 'design', 'professional', 'portfolio'],
    is_premium: true
  },

  // Photography Studio Template
  {
    name: 'Photography Studio Pro',
    description: 'Stunning photography portfolio with galleries, booking system, and client proofing',
    category: 'photography',
    preview_url: '/previews/templates/photography-studio-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/photography-studio-pro.jpg',
    demo_url: '/demos/photography-studio-pro',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-fullscreen-image', 'portfolio-preview', 'services-intro', 'testimonials', 'instagram-feed', 'booking-cta'] 
      },
      { 
        name: 'Portfolio', 
        slug: 'portfolio', 
        sections: ['portfolio-hero', 'category-filters', 'masonry-gallery', 'lightbox-view', 'load-more'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'wedding-photography', 'portrait-sessions', 'commercial', 'events', 'packages-pricing', 'booking-form'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['photographer-bio', 'photography-style', 'equipment', 'awards', 'featured-work', 'contact-cta'] 
      },
      { 
        name: 'Pricing', 
        slug: 'pricing', 
        sections: ['pricing-hero', 'package-options', 'add-ons', 'payment-plans', 'faq', 'book-consultation'] 
      },
      { 
        name: 'Blog', 
        slug: 'blog', 
        sections: ['blog-hero', 'recent-posts', 'photography-tips', 'behind-scenes', 'client-features'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'booking-form', 'availability-calendar', 'studio-location', 'social-links'] 
      }
    ],
    color_scheme: {
      primary: '#000000',
      secondary: '#1f2937',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#374151'
    },
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Lato'
    },
    features: ['Portfolio Gallery', 'Lightbox', 'Category Filtering', 'Booking System', 'Pricing Packages', 'Client Proofing', 'Blog', 'Instagram Integration'],
    tags: ['photography', 'portfolio', 'creative', 'visual'],
    is_premium: false
  },

  // Consulting Firm Template
  {
    name: 'Consulting Firm Elite',
    description: 'Professional consulting firm website with expertise showcase and client portal',
    category: 'consulting',
    preview_url: '/previews/templates/consulting-firm-elite.jpg',
    thumbnail_url: '/previews/templates/thumbs/consulting-firm-elite.jpg',
    demo_url: '/demos/consulting-firm-elite',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-consulting', 'services-overview', 'industries-served', 'case-studies-preview', 'client-logos', 'consultation-cta'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'strategy-consulting', 'operations', 'technology', 'change-management', 'methodology', 'engagement-process'] 
      },
      { 
        name: 'Industries', 
        slug: 'industries', 
        sections: ['industries-hero', 'industry-expertise', 'sector-insights', 'case-studies', 'thought-leadership'] 
      },
      { 
        name: 'Case Studies', 
        slug: 'case-studies', 
        sections: ['case-studies-hero', 'featured-cases', 'results-metrics', 'client-testimonials', 'consultation-cta'] 
      },
      { 
        name: 'Insights', 
        slug: 'insights', 
        sections: ['insights-hero', 'research-reports', 'whitepapers', 'webinars', 'blog-articles', 'newsletter-signup'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['firm-overview', 'leadership-team', 'consultants', 'values', 'global-presence', 'careers'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'consultation-request', 'office-locations', 'expertise-areas', 'partnership-inquiry'] 
      }
    ],
    color_scheme: {
      primary: '#1e40af',
      secondary: '#1e3a8a',
      accent: '#3b82f6',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    features: ['Service Pages', 'Case Studies', 'Industry Expertise', 'Thought Leadership', 'Team Profiles', 'Client Portal', 'Resource Library', 'Global Offices'],
    tags: ['consulting', 'business', 'professional', 'advisory'],
    is_premium: true
  },

  // Travel Agency Template
  {
    name: 'Travel Agency Pro',
    description: 'Inspiring travel agency website with destinations, packages, and booking system',
    category: 'travel',
    preview_url: '/previews/templates/travel-agency-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/travel-agency-pro.jpg',
    demo_url: '/demos/travel-agency-pro',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-travel', 'featured-destinations', 'popular-packages', 'travel-styles', 'testimonials', 'search-trips'] 
      },
      { 
        name: 'Destinations', 
        slug: 'destinations', 
        sections: ['destinations-hero', 'destination-grid', 'continent-filters', 'destination-guides', 'travel-tips'] 
      },
      { 
        name: 'Packages', 
        slug: 'packages', 
        sections: ['packages-hero', 'package-categories', 'package-grid', 'filters', 'custom-packages', 'booking-cta'] 
      },
      { 
        name: 'Package Detail', 
        slug: 'package-detail', 
        sections: ['package-hero', 'itinerary', 'inclusions', 'pricing', 'dates-availability', 'gallery', 'reviews', 'book-now'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['agency-story', 'team', 'why-choose-us', 'partnerships', 'awards', 'sustainability'] 
      },
      { 
        name: 'Travel Resources', 
        slug: 'resources', 
        sections: ['travel-guides', 'visa-info', 'travel-insurance', 'packing-tips', 'faq', 'blog'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'inquiry-form', 'office-locations', 'travel-advisors', 'emergency-contact'] 
      }
    ],
    color_scheme: {
      primary: '#0891b2',
      secondary: '#0e7490',
      accent: '#06b6d4',
      background: '#ffffff',
      text: '#0f172a'
    },
    fonts: {
      heading: 'Poppins',
      body: 'Open Sans'
    },
    features: ['Destination Guides', 'Package Booking', 'Itinerary Builder', 'Travel Resources', 'Reviews', 'Custom Packages', 'Travel Blog', 'Multi-currency'],
    tags: ['travel', 'tourism', 'vacation', 'adventure'],
    is_premium: false
  },

  // Event Planning Template
  {
    name: 'Event Planner Pro',
    description: 'Professional event planning website with portfolio, services, and inquiry system',
    category: 'events',
    preview_url: '/previews/templates/event-planner-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/event-planner-pro.jpg',
    demo_url: '/demos/event-planner-pro',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-events', 'services-preview', 'featured-events', 'testimonials', 'planning-process', 'consultation-cta'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'weddings', 'corporate-events', 'social-events', 'destination-events', 'packages', 'add-ons'] 
      },
      { 
        name: 'Portfolio', 
        slug: 'portfolio', 
        sections: ['portfolio-hero', 'event-categories', 'event-gallery', 'event-details', 'client-reviews'] 
      },
      { 
        name: 'Vendors', 
        slug: 'vendors', 
        sections: ['vendor-network', 'preferred-vendors', 'venues', 'catering', 'entertainment', 'photography'] 
      },
      { 
        name: 'Planning Tools', 
        slug: 'planning-tools', 
        sections: ['budget-calculator', 'guest-list-manager', 'timeline-planner', 'checklist', 'inspiration-board'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['planner-story', 'team', 'planning-philosophy', 'awards', 'press-features', 'join-team'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'consultation-form', 'availability-calendar', 'office-location', 'faq'] 
      }
    ],
    color_scheme: {
      primary: '#ec4899',
      secondary: '#db2777',
      accent: '#f472b6',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lato'
    },
    features: ['Event Portfolio', 'Service Packages', 'Vendor Directory', 'Planning Tools', 'Budget Calculator', 'Consultation Booking', 'Client Reviews', 'Inspiration Gallery'],
    tags: ['events', 'wedding', 'planning', 'celebration'],
    is_premium: false
  },

  // Interior Design Template
  {
    name: 'Interior Design Studio',
    description: 'Sophisticated interior design website with project showcase and design services',
    category: 'interior-design',
    preview_url: '/previews/templates/interior-design-studio.jpg',
    thumbnail_url: '/previews/templates/thumbs/interior-design-studio.jpg',
    demo_url: '/demos/interior-design-studio',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-interior', 'featured-projects', 'services-intro', 'design-style', 'testimonials', 'consultation-cta'] 
      },
      { 
        name: 'Portfolio', 
        slug: 'portfolio', 
        sections: ['portfolio-hero', 'project-categories', 'project-grid', 'style-filters', 'before-after'] 
      },
      { 
        name: 'Project Detail', 
        slug: 'project-detail', 
        sections: ['project-hero', 'project-story', 'image-gallery', 'design-details', 'products-used', 'next-project'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'residential-design', 'commercial-design', 'consultation', 'space-planning', 'styling', 'process'] 
      },
      { 
        name: 'Shop', 
        slug: 'shop', 
        sections: ['shop-hero', 'furniture', 'decor', 'lighting', 'textiles', 'curated-collections'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['designer-bio', 'design-philosophy', 'team', 'studio-space', 'awards', 'press'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'consultation-form', 'studio-location', 'design-questionnaire', 'social-media'] 
      }
    ],
    color_scheme: {
      primary: '#78350f',
      secondary: '#92400e',
      accent: '#d97706',
      background: '#fffbeb',
      text: '#1c1917'
    },
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Lato'
    },
    features: ['Project Portfolio', 'Before/After Gallery', 'Service Pages', 'Product Shop', 'Design Quiz', 'Consultation Booking', 'Style Guide', 'Mood Boards'],
    tags: ['interior-design', 'design', 'home', 'decor'],
    is_premium: true
  },

  // Manufacturing Template
  {
    name: 'Manufacturing Solutions',
    description: 'Industrial manufacturing website with capabilities, products, and quality certifications',
    category: 'manufacturing',
    preview_url: '/previews/templates/manufacturing-solutions.jpg',
    thumbnail_url: '/previews/templates/thumbs/manufacturing-solutions.jpg',
    demo_url: '/demos/manufacturing-solutions',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-industrial', 'capabilities-overview', 'industries-served', 'quality-certifications', 'client-logos', 'quote-cta'] 
      },
      { 
        name: 'Capabilities', 
        slug: 'capabilities', 
        sections: ['capabilities-hero', 'manufacturing-processes', 'equipment', 'materials', 'quality-control', 'capacity'] 
      },
      { 
        name: 'Industries', 
        slug: 'industries', 
        sections: ['industries-hero', 'aerospace', 'automotive', 'medical', 'electronics', 'case-studies'] 
      },
      { 
        name: 'Products', 
        slug: 'products', 
        sections: ['products-hero', 'product-categories', 'custom-manufacturing', 'specifications', 'catalog-download'] 
      },
      { 
        name: 'Quality', 
        slug: 'quality', 
        sections: ['quality-hero', 'certifications', 'testing-procedures', 'compliance', 'continuous-improvement'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['company-history', 'facilities', 'team', 'sustainability', 'careers', 'news'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'quote-request', 'facility-locations', 'sales-team', 'support'] 
      }
    ],
    color_scheme: {
      primary: '#475569',
      secondary: '#334155',
      accent: '#0891b2',
      background: '#ffffff',
      text: '#1e293b'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    features: ['Capabilities Showcase', 'Product Catalog', 'Quality Certifications', 'Case Studies', 'Quote System', 'Facility Tours', 'Technical Specs', 'Industry Solutions'],
    tags: ['manufacturing', 'industrial', 'production', 'b2b'],
    is_premium: false
  }
];

async function seedIndustryTemplatesBatch2() {
  const client = await pool.connect();
  
  try {
    console.log('Starting Industry Templates Batch 2 seeding...');
    console.log(`Total templates to seed: ${industryTemplatesBatch2.length}\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const template of industryTemplatesBatch2) {
      try {
        const result = await client.query(
          `INSERT INTO site_templates 
           (name, description, category, preview_url, thumbnail_url, demo_url, pages, color_scheme, fonts, features, tags, is_premium, rating, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
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
            template.is_premium,
            4.5 // Default rating
          ]
        );
        
        successCount++;
        console.log(`✓ Created template: ${result.rows[0].name} (ID: ${result.rows[0].id}) - ${template.category}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error creating template "${template.name}":`, error.message);
      }
    }
    
    console.log('\n=== Industry Templates Batch 2 Seeding Complete ===');
    console.log(`✓ Successfully created: ${successCount} templates`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`📊 New templates added: ${successCount}`);
    console.log('\n=== Categories Added ===');
    const categories = [...new Set(industryTemplatesBatch2.map(t => t.category))];
    categories.forEach(cat => {
      const count = industryTemplatesBatch2.filter(t => t.category === cat).length;
      console.log(`  • ${cat}: ${count} template(s)`);
    });
    
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedIndustryTemplatesBatch2().catch(console.error);
