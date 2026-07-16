import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const industryTemplatesBatch3 = [
  // Insurance Agency Template
  {
    name: 'Insurance Agency Pro',
    description: 'Professional insurance agency website with policy information, quotes, and claims portal',
    category: 'insurance',
    preview_url: '/previews/templates/insurance-agency-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/insurance-agency-pro.jpg',
    demo_url: '/demos/insurance-agency-pro',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-insurance', 'coverage-types', 'why-choose-us', 'testimonials', 'quick-quote', 'contact-cta'] 
      },
      { 
        name: 'Personal Insurance', 
        slug: 'personal', 
        sections: ['personal-hero', 'auto-insurance', 'home-insurance', 'life-insurance', 'health-insurance', 'quote-form'] 
      },
      { 
        name: 'Business Insurance', 
        slug: 'business', 
        sections: ['business-hero', 'general-liability', 'property-insurance', 'workers-comp', 'professional-liability', 'consultation'] 
      },
      { 
        name: 'Claims', 
        slug: 'claims', 
        sections: ['claims-hero', 'file-claim', 'claims-process', 'faq', 'emergency-contact', 'claims-status'] 
      },
      { 
        name: 'Resources', 
        slug: 'resources', 
        sections: ['insurance-guides', 'coverage-calculator', 'faq', 'blog', 'glossary', 'forms-download'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['agency-story', 'team-agents', 'carriers', 'community-involvement', 'awards', 'careers'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'quote-request', 'office-locations', 'agent-finder', 'emergency-hotline'] 
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
    features: ['Quote Calculator', 'Policy Comparison', 'Claims Portal', 'Agent Directory', 'Coverage Guides', 'Online Forms', 'Client Portal', 'Emergency Contact'],
    tags: ['insurance', 'financial', 'protection', 'coverage'],
    is_premium: false
  },

  // Financial Services Template
  {
    name: 'Financial Advisors Elite',
    description: 'Premium financial advisory website with services, planning tools, and client portal',
    category: 'finance',
    preview_url: '/previews/templates/financial-advisors-elite.jpg',
    thumbnail_url: '/previews/templates/thumbs/financial-advisors-elite.jpg',
    demo_url: '/demos/financial-advisors-elite',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-finance', 'services-overview', 'planning-approach', 'client-success', 'credentials', 'consultation-cta'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'wealth-management', 'retirement-planning', 'investment-advisory', 'estate-planning', 'tax-planning', 'process'] 
      },
      { 
        name: 'Planning Tools', 
        slug: 'planning-tools', 
        sections: ['tools-hero', 'retirement-calculator', 'investment-analyzer', 'net-worth-tracker', 'goal-planner', 'risk-assessment'] 
      },
      { 
        name: 'Insights', 
        slug: 'insights', 
        sections: ['market-commentary', 'financial-planning-tips', 'investment-strategies', 'webinars', 'newsletter', 'economic-outlook'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['firm-philosophy', 'team-advisors', 'credentials-certifications', 'fiduciary-commitment', 'awards', 'careers'] 
      },
      { 
        name: 'Resources', 
        slug: 'resources', 
        sections: ['financial-guides', 'calculators', 'forms-documents', 'faq', 'glossary', 'client-portal-access'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'consultation-request', 'office-locations', 'advisor-matching', 'secure-message'] 
      }
    ],
    color_scheme: {
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#0891b2',
      background: '#ffffff',
      text: '#334155'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter'
    },
    features: ['Financial Calculators', 'Planning Tools', 'Client Portal', 'Advisor Profiles', 'Market Insights', 'Secure Messaging', 'Document Vault', 'Goal Tracking'],
    tags: ['finance', 'wealth', 'investment', 'advisory'],
    is_premium: true
  },

  // Logistics Company Template
  {
    name: 'Logistics Solutions Pro',
    description: 'Professional logistics and freight company website with tracking and quote system',
    category: 'logistics',
    preview_url: '/previews/templates/logistics-solutions-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/logistics-solutions-pro.jpg',
    demo_url: '/demos/logistics-solutions-pro',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-logistics', 'services-overview', 'tracking-widget', 'global-network', 'client-logos', 'quote-cta'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'freight-forwarding', 'warehousing', 'distribution', 'customs-brokerage', 'supply-chain', 'technology'] 
      },
      { 
        name: 'Industries', 
        slug: 'industries', 
        sections: ['industries-hero', 'automotive', 'retail', 'manufacturing', 'healthcare', 'ecommerce', 'case-studies'] 
      },
      { 
        name: 'Tracking', 
        slug: 'tracking', 
        sections: ['tracking-hero', 'shipment-tracking', 'real-time-updates', 'delivery-proof', 'notifications', 'history'] 
      },
      { 
        name: 'Network', 
        slug: 'network', 
        sections: ['network-hero', 'global-coverage', 'facilities', 'fleet', 'partners', 'capabilities'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['company-overview', 'leadership', 'sustainability', 'safety-standards', 'certifications', 'careers'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'quote-request', 'office-locations', 'customer-service', 'emergency-support'] 
      }
    ],
    color_scheme: {
      primary: '#ea580c',
      secondary: '#c2410c',
      accent: '#fb923c',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    features: ['Shipment Tracking', 'Quote System', 'Global Network Map', 'Service Pages', 'Industry Solutions', 'Customer Portal', 'Real-time Updates', 'Documentation'],
    tags: ['logistics', 'freight', 'shipping', 'supply-chain'],
    is_premium: false
  },

  // Spa & Wellness Template
  {
    name: 'Spa & Wellness Retreat',
    description: 'Luxurious spa and wellness center website with services, booking, and membership',
    category: 'wellness',
    preview_url: '/previews/templates/spa-wellness-retreat.jpg',
    thumbnail_url: '/previews/templates/thumbs/spa-wellness-retreat.jpg',
    demo_url: '/demos/spa-wellness-retreat',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-spa', 'services-preview', 'signature-treatments', 'testimonials', 'special-offers', 'book-now'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'massage-therapy', 'facials', 'body-treatments', 'wellness-programs', 'packages', 'pricing'] 
      },
      { 
        name: 'Practitioners', 
        slug: 'practitioners', 
        sections: ['practitioners-hero', 'therapist-profiles', 'specializations', 'certifications', 'book-with-therapist'] 
      },
      { 
        name: 'Membership', 
        slug: 'membership', 
        sections: ['membership-hero', 'membership-tiers', 'benefits', 'pricing', 'member-perks', 'join-now'] 
      },
      { 
        name: 'Wellness', 
        slug: 'wellness', 
        sections: ['wellness-hero', 'yoga-classes', 'meditation', 'nutrition', 'fitness', 'workshops', 'schedule'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['spa-philosophy', 'facilities-tour', 'products-used', 'sustainability', 'awards', 'gift-cards'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'booking-form', 'location-map', 'hours', 'policies', 'gift-certificates'] 
      }
    ],
    color_scheme: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#10b981',
      background: '#f0fdf4',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Lato'
    },
    features: ['Online Booking', 'Service Menu', 'Practitioner Profiles', 'Membership Plans', 'Class Schedule', 'Gift Cards', 'Package Deals', 'Wellness Blog'],
    tags: ['spa', 'wellness', 'massage', 'relaxation'],
    is_premium: true
  },

  // Accounting Firm Template
  {
    name: 'Accounting Firm Pro',
    description: 'Professional accounting and tax services website with client portal and resources',
    category: 'accounting',
    preview_url: '/previews/templates/accounting-firm-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/accounting-firm-pro.jpg',
    demo_url: '/demos/accounting-firm-pro',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-accounting', 'services-overview', 'industries-served', 'why-choose-us', 'client-testimonials', 'consultation-cta'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'tax-preparation', 'bookkeeping', 'payroll', 'audit-assurance', 'business-advisory', 'cfo-services'] 
      },
      { 
        name: 'Industries', 
        slug: 'industries', 
        sections: ['industries-hero', 'small-business', 'real-estate', 'healthcare', 'nonprofits', 'manufacturing', 'expertise'] 
      },
      { 
        name: 'Resources', 
        slug: 'resources', 
        sections: ['tax-calendar', 'calculators', 'financial-guides', 'blog', 'newsletter', 'forms-checklists'] 
      },
      { 
        name: 'Client Portal', 
        slug: 'client-portal', 
        sections: ['portal-login', 'secure-file-sharing', 'document-requests', 'payment-options', 'support'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['firm-history', 'team-cpas', 'credentials', 'professional-affiliations', 'community-service', 'careers'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'consultation-form', 'office-locations', 'tax-season-hours', 'emergency-contact'] 
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
    features: ['Client Portal', 'Secure File Sharing', 'Tax Calculators', 'Service Pages', 'Industry Expertise', 'Resource Library', 'Online Payments', 'Appointment Booking'],
    tags: ['accounting', 'tax', 'bookkeeping', 'financial'],
    is_premium: false
  },

  // Veterinary Clinic Template
  {
    name: 'Veterinary Care Center',
    description: 'Compassionate veterinary clinic website with services, pet care tips, and appointments',
    category: 'veterinary',
    preview_url: '/previews/templates/veterinary-care-center.jpg',
    thumbnail_url: '/previews/templates/thumbs/veterinary-care-center.jpg',
    demo_url: '/demos/veterinary-care-center',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-veterinary', 'services-preview', 'meet-vets', 'testimonials', 'emergency-info', 'book-appointment'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'wellness-exams', 'vaccinations', 'surgery', 'dental-care', 'emergency-care', 'grooming'] 
      },
      { 
        name: 'Our Team', 
        slug: 'team', 
        sections: ['team-hero', 'veterinarian-profiles', 'support-staff', 'specializations', 'join-team'] 
      },
      { 
        name: 'Pet Care', 
        slug: 'pet-care', 
        sections: ['care-tips', 'nutrition-advice', 'behavior-training', 'preventive-care', 'breed-info', 'faq'] 
      },
      { 
        name: 'New Patients', 
        slug: 'new-patients', 
        sections: ['welcome', 'what-to-bring', 'first-visit', 'forms-download', 'payment-options', 'insurance'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['clinic-story', 'facilities-tour', 'technology', 'community-involvement', 'awards'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'appointment-form', 'location-map', 'hours', 'emergency-contact', 'directions'] 
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
    features: ['Online Appointments', 'Service Pages', 'Pet Care Tips', 'Veterinarian Profiles', 'Emergency Info', 'Patient Forms', 'Pet Portal', 'Vaccination Reminders'],
    tags: ['veterinary', 'pet-care', 'animal-hospital', 'vet'],
    is_premium: false
  },

  // Coworking Space Template
  {
    name: 'Coworking Space Hub',
    description: 'Modern coworking space website with membership plans, amenities, and virtual tours',
    category: 'coworking',
    preview_url: '/previews/templates/coworking-space-hub.jpg',
    thumbnail_url: '/previews/templates/thumbs/coworking-space-hub.jpg',
    demo_url: '/demos/coworking-space-hub',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-coworking', 'workspace-options', 'amenities-preview', 'community-highlights', 'testimonials', 'tour-cta'] 
      },
      { 
        name: 'Workspaces', 
        slug: 'workspaces', 
        sections: ['workspaces-hero', 'hot-desks', 'dedicated-desks', 'private-offices', 'meeting-rooms', 'event-space', 'virtual-tour'] 
      },
      { 
        name: 'Membership', 
        slug: 'membership', 
        sections: ['membership-hero', 'plans-comparison', 'pricing', 'perks-benefits', 'day-pass', 'join-now'] 
      },
      { 
        name: 'Amenities', 
        slug: 'amenities', 
        sections: ['amenities-hero', 'high-speed-wifi', 'meeting-rooms', 'kitchen-cafe', 'printing', 'parking', 'events'] 
      },
      { 
        name: 'Community', 
        slug: 'community', 
        sections: ['community-hero', 'member-directory', 'events-calendar', 'workshops', 'networking', 'success-stories'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['space-story', 'team', 'locations', 'sustainability', 'partnerships', 'press'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'tour-booking', 'location-map', 'hours', 'inquiry-form', 'faq'] 
      }
    ],
    color_scheme: {
      primary: '#7c3aed',
      secondary: '#6d28d9',
      accent: '#a78bfa',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    features: ['Virtual Tours', 'Membership Plans', 'Space Booking', 'Event Calendar', 'Member Directory', 'Amenities Showcase', 'Community Features', 'Day Pass Options'],
    tags: ['coworking', 'workspace', 'office', 'community'],
    is_premium: true
  },

  // Bakery/Cafe Template
  {
    name: 'Artisan Bakery & Cafe',
    description: 'Delightful bakery and cafe website with menu, online ordering, and catering services',
    category: 'food-beverage',
    preview_url: '/previews/templates/artisan-bakery-cafe.jpg',
    thumbnail_url: '/previews/templates/thumbs/artisan-bakery-cafe.jpg',
    demo_url: '/demos/artisan-bakery-cafe',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-bakery', 'featured-items', 'daily-specials', 'testimonials', 'hours-location', 'order-online'] 
      },
      { 
        name: 'Menu', 
        slug: 'menu', 
        sections: ['menu-hero', 'breads', 'pastries', 'cakes', 'beverages', 'seasonal-items', 'allergen-info'] 
      },
      { 
        name: 'Order Online', 
        slug: 'order', 
        sections: ['order-hero', 'menu-selection', 'customization', 'pickup-delivery', 'cart', 'checkout'] 
      },
      { 
        name: 'Catering', 
        slug: 'catering', 
        sections: ['catering-hero', 'catering-menu', 'packages', 'custom-orders', 'gallery', 'inquiry-form'] 
      },
      { 
        name: 'Custom Cakes', 
        slug: 'custom-cakes', 
        sections: ['cakes-hero', 'cake-gallery', 'flavors-fillings', 'design-options', 'pricing', 'order-form'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['bakery-story', 'bakers-team', 'ingredients', 'baking-process', 'awards', 'community'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'location-map', 'hours', 'contact-form', 'wholesale-inquiry', 'directions'] 
      }
    ],
    color_scheme: {
      primary: '#92400e',
      secondary: '#78350f',
      accent: '#d97706',
      background: '#fffbeb',
      text: '#1c1917'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lato'
    },
    features: ['Online Ordering', 'Menu Display', 'Catering Services', 'Custom Cake Orders', 'Allergen Info', 'Pickup/Delivery', 'Gallery', 'Daily Specials'],
    tags: ['bakery', 'cafe', 'food', 'restaurant'],
    is_premium: false
  }
];

async function seedIndustryTemplatesBatch3() {
  const client = await pool.connect();
  
  try {
    console.log('Starting Industry Templates Batch 3 seeding...');
    console.log(`Total templates to seed: ${industryTemplatesBatch3.length}\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const template of industryTemplatesBatch3) {
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
    
    console.log('\n=== Industry Templates Batch 3 Seeding Complete ===');
    console.log(`✓ Successfully created: ${successCount} templates`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`📊 New templates added: ${successCount}`);
    console.log('\n=== Categories Added ===');
    const categories = [...new Set(industryTemplatesBatch3.map(t => t.category))];
    categories.forEach(cat => {
      const count = industryTemplatesBatch3.filter(t => t.category === cat).length;
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

seedIndustryTemplatesBatch3().catch(console.error);
