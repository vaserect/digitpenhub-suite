import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const industryTemplates = [
  // Real Estate Template
  {
    name: 'Real Estate Pro',
    description: 'Professional real estate website with property listings, agent profiles, and advanced search',
    category: 'real-estate',
    preview_url: '/previews/templates/real-estate-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/real-estate-pro.jpg',
    demo_url: '/demos/real-estate-pro',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-property-search', 'featured-listings', 'property-types', 'agent-intro', 'testimonials', 'neighborhood-guide'] 
      },
      { 
        name: 'Properties', 
        slug: 'properties', 
        sections: ['search-filters', 'property-grid', 'map-view', 'saved-searches', 'pagination'] 
      },
      { 
        name: 'Property Detail', 
        slug: 'property', 
        sections: ['property-gallery', 'property-info', 'features-amenities', 'location-map', 'mortgage-calculator', 'contact-agent', 'similar-properties'] 
      },
      { 
        name: 'Agents', 
        slug: 'agents', 
        sections: ['agents-hero', 'agent-grid', 'top-performers', 'specializations', 'join-team'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['company-story', 'team-leadership', 'awards-recognition', 'service-areas', 'community-involvement'] 
      },
      { 
        name: 'Sell', 
        slug: 'sell', 
        sections: ['sell-hero', 'home-valuation', 'selling-process', 'marketing-plan', 'success-stories', 'list-property-cta'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'office-locations', 'contact-form', 'schedule-viewing', 'social-links'] 
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
      heading: 'Montserrat',
      body: 'Open Sans'
    },
    features: ['Property Search', 'Advanced Filters', 'Map Integration', 'Mortgage Calculator', 'Agent Profiles', 'Virtual Tours', 'Saved Searches', 'Property Alerts'],
    tags: ['real-estate', 'property', 'listings', 'agents'],
    is_premium: true
  },

  // Law Firm Template
  {
    name: 'Law Firm Elite',
    description: 'Professional law firm website with practice areas, attorney profiles, and case results',
    category: 'legal',
    preview_url: '/previews/templates/law-firm-elite.jpg',
    thumbnail_url: '/previews/templates/thumbs/law-firm-elite.jpg',
    demo_url: '/demos/law-firm-elite',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-trust', 'practice-areas-grid', 'case-results', 'attorney-intro', 'client-testimonials', 'consultation-cta'] 
      },
      { 
        name: 'Practice Areas', 
        slug: 'practice-areas', 
        sections: ['practice-hero', 'areas-grid', 'expertise-details', 'case-studies', 'faq', 'contact-cta'] 
      },
      { 
        name: 'Attorneys', 
        slug: 'attorneys', 
        sections: ['attorneys-hero', 'attorney-profiles', 'credentials', 'awards', 'publications', 'speaking-engagements'] 
      },
      { 
        name: 'Case Results', 
        slug: 'case-results', 
        sections: ['results-hero', 'notable-cases', 'settlements-verdicts', 'success-rate', 'client-stories', 'consultation-cta'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['firm-history', 'mission-values', 'leadership-team', 'community-service', 'awards-recognition', 'careers'] 
      },
      { 
        name: 'Resources', 
        slug: 'resources', 
        sections: ['legal-blog', 'faq', 'legal-guides', 'news-media', 'newsletter-signup'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'consultation-form', 'office-locations', 'hours', 'emergency-contact', 'directions'] 
      }
    ],
    color_scheme: {
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#b8860b',
      background: '#ffffff',
      text: '#334155'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lora'
    },
    features: ['Practice Area Pages', 'Attorney Bios', 'Case Results', 'Consultation Booking', 'Legal Blog', 'Client Portal', 'Secure Forms', 'Multi-location'],
    tags: ['legal', 'law-firm', 'attorney', 'professional'],
    is_premium: true
  },

  // Hospital/Medical Template
  {
    name: 'Medical Center Pro',
    description: 'Comprehensive healthcare website with services, doctors, appointments, and patient portal',
    category: 'healthcare',
    preview_url: '/previews/templates/medical-center-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/medical-center-pro.jpg',
    demo_url: '/demos/medical-center-pro',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-healthcare', 'services-overview', 'find-doctor', 'patient-portal-cta', 'testimonials', 'emergency-info'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'departments-grid', 'specialties', 'treatments', 'technology', 'insurance-accepted'] 
      },
      { 
        name: 'Find a Doctor', 
        slug: 'doctors', 
        sections: ['doctor-search', 'physician-directory', 'specialties-filter', 'doctor-profiles', 'book-appointment'] 
      },
      { 
        name: 'Appointments', 
        slug: 'appointments', 
        sections: ['appointment-hero', 'online-booking', 'new-patients', 'insurance-info', 'what-to-bring', 'faq'] 
      },
      { 
        name: 'Patients & Visitors', 
        slug: 'patients', 
        sections: ['patient-resources', 'visitor-info', 'hospital-map', 'parking', 'amenities', 'patient-rights'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['hospital-mission', 'leadership', 'accreditations', 'community-health', 'careers', 'volunteer'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'locations', 'departments-contact', 'emergency-numbers', 'feedback-form'] 
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
      heading: 'Inter',
      body: 'Inter'
    },
    features: ['Doctor Directory', 'Online Appointments', 'Patient Portal', 'Service Finder', 'Insurance Info', 'Emergency Info', 'Virtual Visits', 'Health Resources'],
    tags: ['healthcare', 'medical', 'hospital', 'clinic'],
    is_premium: true
  },

  // Hotel/Hospitality Template
  {
    name: 'Luxury Hotel',
    description: 'Elegant hotel website with room booking, amenities showcase, and guest services',
    category: 'hospitality',
    preview_url: '/previews/templates/luxury-hotel.jpg',
    thumbnail_url: '/previews/templates/thumbs/luxury-hotel.jpg',
    demo_url: '/demos/luxury-hotel',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-fullscreen-video', 'booking-widget', 'rooms-preview', 'amenities-highlight', 'guest-reviews', 'special-offers'] 
      },
      { 
        name: 'Rooms & Suites', 
        slug: 'rooms', 
        sections: ['rooms-hero', 'room-types-grid', 'room-features', 'virtual-tour', 'booking-cta'] 
      },
      { 
        name: 'Amenities', 
        slug: 'amenities', 
        sections: ['amenities-hero', 'spa-wellness', 'dining-options', 'pool-fitness', 'business-center', 'concierge-services'] 
      },
      { 
        name: 'Dining', 
        slug: 'dining', 
        sections: ['dining-hero', 'restaurants', 'bars-lounges', 'room-service', 'private-dining', 'menus'] 
      },
      { 
        name: 'Events', 
        slug: 'events', 
        sections: ['events-hero', 'wedding-venues', 'meeting-rooms', 'conference-facilities', 'catering', 'event-planning', 'inquiry-form'] 
      },
      { 
        name: 'Local Area', 
        slug: 'local-area', 
        sections: ['area-guide', 'attractions', 'restaurants-nearby', 'transportation', 'activities', 'map'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'reservation-form', 'location-map', 'directions', 'concierge-contact', 'faq'] 
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
      heading: 'Cormorant Garamond',
      body: 'Lato'
    },
    features: ['Online Booking', 'Room Gallery', 'Virtual Tours', 'Amenities Showcase', 'Event Spaces', 'Dining Menus', 'Guest Reviews', 'Special Offers', 'Concierge'],
    tags: ['hotel', 'hospitality', 'luxury', 'resort'],
    is_premium: true
  },

  // Construction Template
  {
    name: 'Construction Pro',
    description: 'Professional construction company website with project portfolio and service details',
    category: 'construction',
    preview_url: '/previews/templates/construction-pro.jpg',
    thumbnail_url: '/previews/templates/thumbs/construction-pro.jpg',
    demo_url: '/demos/construction-pro',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-construction', 'services-overview', 'featured-projects', 'why-choose-us', 'certifications', 'quote-cta'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'residential', 'commercial', 'industrial', 'renovation', 'project-management', 'consultation'] 
      },
      { 
        name: 'Projects', 
        slug: 'projects', 
        sections: ['projects-hero', 'project-gallery', 'case-studies', 'before-after', 'client-testimonials', 'quote-cta'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['company-history', 'team', 'certifications-licenses', 'safety-standards', 'sustainability', 'careers'] 
      },
      { 
        name: 'Process', 
        slug: 'process', 
        sections: ['process-hero', 'consultation', 'planning-design', 'construction-phase', 'quality-control', 'handover', 'warranty'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'quote-form', 'office-locations', 'service-areas', 'emergency-contact'] 
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
      heading: 'Bebas Neue',
      body: 'Roboto'
    },
    features: ['Project Portfolio', 'Service Pages', 'Quote Calculator', 'Before/After Gallery', 'Team Profiles', 'Certifications', 'Safety Info', 'Service Areas'],
    tags: ['construction', 'building', 'contractor', 'renovation'],
    is_premium: false
  },

  // Education/School Template
  {
    name: 'Academy Plus',
    description: 'Modern educational institution website with courses, admissions, and student portal',
    category: 'education',
    preview_url: '/previews/templates/academy-plus.jpg',
    thumbnail_url: '/previews/templates/thumbs/academy-plus.jpg',
    demo_url: '/demos/academy-plus',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-education', 'programs-overview', 'upcoming-events', 'student-success', 'news-updates', 'apply-cta'] 
      },
      { 
        name: 'Programs', 
        slug: 'programs', 
        sections: ['programs-hero', 'degree-programs', 'certificates', 'online-learning', 'continuing-education', 'program-finder'] 
      },
      { 
        name: 'Admissions', 
        slug: 'admissions', 
        sections: ['admissions-hero', 'application-process', 'requirements', 'tuition-fees', 'financial-aid', 'campus-tours', 'apply-now'] 
      },
      { 
        name: 'Campus Life', 
        slug: 'campus-life', 
        sections: ['campus-hero', 'student-organizations', 'housing', 'dining', 'athletics', 'events-calendar', 'facilities-tour'] 
      },
      { 
        name: 'Faculty', 
        slug: 'faculty', 
        sections: ['faculty-hero', 'faculty-directory', 'departments', 'research', 'publications', 'join-faculty'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['school-history', 'mission-vision', 'leadership', 'accreditation', 'achievements', 'alumni-network'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'departments-contact', 'campus-map', 'visit-us', 'inquiry-form'] 
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
      heading: 'Poppins',
      body: 'Inter'
    },
    features: ['Program Catalog', 'Online Applications', 'Student Portal', 'Event Calendar', 'Faculty Directory', 'Campus Tours', 'News & Updates', 'Alumni Network'],
    tags: ['education', 'school', 'university', 'learning'],
    is_premium: false
  },

  // NGO/Nonprofit Template
  {
    name: 'Nonprofit Impact',
    description: 'Inspiring nonprofit website with mission showcase, donation system, and volunteer portal',
    category: 'nonprofit',
    preview_url: '/previews/templates/nonprofit-impact.jpg',
    thumbnail_url: '/previews/templates/thumbs/nonprofit-impact.jpg',
    demo_url: '/demos/nonprofit-impact',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-mission', 'impact-stats', 'current-campaigns', 'success-stories', 'ways-to-help', 'donate-cta'] 
      },
      { 
        name: 'Our Work', 
        slug: 'our-work', 
        sections: ['work-hero', 'programs', 'projects', 'impact-areas', 'beneficiaries', 'annual-report'] 
      },
      { 
        name: 'Get Involved', 
        slug: 'get-involved', 
        sections: ['involvement-hero', 'volunteer', 'donate', 'fundraise', 'corporate-partnerships', 'events', 'advocacy'] 
      },
      { 
        name: 'Stories', 
        slug: 'stories', 
        sections: ['stories-hero', 'impact-stories', 'beneficiary-testimonials', 'volunteer-experiences', 'photo-gallery', 'video-stories'] 
      },
      { 
        name: 'About', 
        slug: 'about', 
        sections: ['organization-mission', 'history', 'team', 'board-directors', 'financials', 'transparency', 'partners'] 
      },
      { 
        name: 'News & Events', 
        slug: 'news', 
        sections: ['news-hero', 'latest-news', 'upcoming-events', 'press-releases', 'media-kit', 'newsletter-signup'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'contact-form', 'office-locations', 'volunteer-inquiry', 'partnership-inquiry', 'social-media'] 
      }
    ],
    color_scheme: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#10b981',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Open Sans'
    },
    features: ['Donation System', 'Volunteer Portal', 'Campaign Pages', 'Impact Metrics', 'Story Showcase', 'Event Calendar', 'Newsletter', 'Transparency Reports'],
    tags: ['nonprofit', 'ngo', 'charity', 'social-impact'],
    is_premium: false
  },

  // Dental Clinic Template
  {
    name: 'Dental Care Plus',
    description: 'Modern dental clinic website with services, online booking, and patient education',
    category: 'healthcare',
    preview_url: '/previews/templates/dental-care-plus.jpg',
    thumbnail_url: '/previews/templates/thumbs/dental-care-plus.jpg',
    demo_url: '/demos/dental-care-plus',
    pages: [
      { 
        name: 'Home', 
        slug: 'home', 
        sections: ['hero-dental', 'services-preview', 'meet-dentists', 'patient-reviews', 'insurance-accepted', 'book-appointment'] 
      },
      { 
        name: 'Services', 
        slug: 'services', 
        sections: ['services-hero', 'general-dentistry', 'cosmetic-dentistry', 'orthodontics', 'implants', 'emergency-care', 'pricing'] 
      },
      { 
        name: 'Our Team', 
        slug: 'team', 
        sections: ['team-hero', 'dentist-profiles', 'hygienists', 'support-staff', 'credentials', 'join-team'] 
      },
      { 
        name: 'Patient Info', 
        slug: 'patient-info', 
        sections: ['new-patients', 'what-to-expect', 'insurance-billing', 'payment-options', 'forms-download', 'faq'] 
      },
      { 
        name: 'Smile Gallery', 
        slug: 'smile-gallery', 
        sections: ['gallery-hero', 'before-after', 'patient-testimonials', 'treatment-results', 'consultation-cta'] 
      },
      { 
        name: 'Contact', 
        slug: 'contact', 
        sections: ['contact-hero', 'appointment-form', 'location-map', 'office-hours', 'emergency-contact', 'directions'] 
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
      body: 'Inter'
    },
    features: ['Online Booking', 'Service Pages', 'Before/After Gallery', 'Patient Forms', 'Insurance Info', 'Team Profiles', 'Emergency Info', 'Patient Education'],
    tags: ['dental', 'healthcare', 'clinic', 'dentist'],
    is_premium: false
  }
];

async function seedIndustryTemplates() {
  const client = await pool.connect();
  
  try {
    console.log('Starting Industry Templates seeding...');
    console.log(`Total templates to seed: ${industryTemplates.length}\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const template of industryTemplates) {
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
    
    console.log('\n=== Industry Templates Seeding Complete ===');
    console.log(`✓ Successfully created: ${successCount} templates`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`📊 New templates added: ${successCount}`);
    console.log('\n=== Categories Added ===');
    const categories = [...new Set(industryTemplates.map(t => t.category))];
    categories.forEach(cat => {
      const count = industryTemplates.filter(t => t.category === cat).length;
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

seedIndustryTemplates().catch(console.error);
