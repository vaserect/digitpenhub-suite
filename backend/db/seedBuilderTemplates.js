/**
 * Seed Builder Templates
 * 
 * Creates 10 comprehensive multi-page website templates across different industries.
 * Each template includes 5-10 pages with complete content structure.
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a template object with all required fields
 */
function createTemplate(
  name,
  description,
  industry,
  category,
  styleVariant,
  templateConfig,
  tags,
  isPremium = false,
  isFeatured = false
) {
  return {
    name,
    description,
    industry,
    category,
    style_variant: styleVariant,
    is_global: true,
    is_premium: isPremium,
    is_featured: isFeatured,
    template_config: templateConfig,
    tags,
    thumbnail_url: null,
    preview_images: [],
    demo_url: null,
    theme_id: null,
    usage_count: 0,
    rating: 0.0,
    rating_count: 0,
    version: 1,
    seo_title: `${name} - Website Template`,
    seo_description: description,
    seo_keywords: tags,
    is_active: true,
  };
}

/**
 * Creates a template page object
 */
function createPage(
  name,
  slug,
  description,
  blocks,
  pageType = 'page',
  isHome = false,
  showInNav = true,
  navOrder = 0
) {
  return {
    name,
    slug,
    description,
    page_type: pageType,
    blocks,
    meta_title: `${name} - Page`,
    meta_description: description,
    og_image: null,
    is_home: isHome,
    show_in_nav: showInNav,
    nav_order: navOrder,
    parent_page_id: null,
    thumbnail_url: null,
  };
}

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

const templates = [
  // 1. Business/Corporate Template
  {
    template: createTemplate(
      'Professional Business',
      'Modern corporate website for professional services and consulting firms',
      'business',
      'business-professional',
      'modern',
      {
        colors: {
          primary: '#2563eb',
          secondary: '#1e40af',
          accent: '#3b82f6',
          background: '#ffffff',
          text: '#1f2937',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        spacing: 'comfortable',
        borderRadius: 'medium',
      },
      ['business', 'corporate', 'professional', 'consulting', 'services'],
      false,
      true
    ),
    pages: [
      createPage(
        'Home',
        'home',
        'Professional business homepage',
        [
          { type: 'hero', variant: 'business-professional' },
          { type: 'features', variant: 'icon-grid' },
          { type: 'stats', variant: 'simple' },
          { type: 'testimonials', variant: 'grid' },
          { type: 'cta', variant: 'centered' },
        ],
        'page',
        true,
        true,
        0
      ),
      createPage(
        'About Us',
        'about',
        'Company information and team',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'content', variant: 'two-column' },
          { type: 'team', variant: 'professional-grid' },
          { type: 'stats', variant: 'detailed' },
          { type: 'cta', variant: 'simple' },
        ],
        'page',
        false,
        true,
        1
      ),
      createPage(
        'Services',
        'services',
        'Our professional services',
        [
          { type: 'hero', variant: 'centered' },
          { type: 'features', variant: 'cards-with-images' },
          { type: 'process', variant: 'timeline' },
          { type: 'pricing', variant: '3-tier' },
          { type: 'cta', variant: 'split' },
        ],
        'page',
        false,
        true,
        2
      ),
      createPage(
        'Case Studies',
        'case-studies',
        'Client success stories',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'portfolio', variant: 'grid' },
          { type: 'testimonials', variant: 'featured' },
          { type: 'cta', variant: 'centered' },
        ],
        'page',
        false,
        true,
        3
      ),
      createPage(
        'Contact',
        'contact',
        'Get in touch with us',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'contact', variant: 'form-with-map' },
          { type: 'contact', variant: 'info-cards' },
        ],
        'page',
        false,
        true,
        4
      ),
    ],
  },

  // 2. SaaS/Startup Template
  {
    template: createTemplate(
      'SaaS Startup',
      'Modern SaaS landing page with product focus and conversion optimization',
      'technology',
      'technology-innovation',
      'modern',
      {
        colors: {
          primary: '#8b5cf6',
          secondary: '#7c3aed',
          accent: '#a78bfa',
          background: '#ffffff',
          text: '#111827',
        },
        fonts: {
          heading: 'Poppins',
          body: 'Inter',
        },
        spacing: 'spacious',
        borderRadius: 'large',
      },
      ['saas', 'startup', 'software', 'technology', 'product'],
      false,
      true
    ),
    pages: [
      createPage(
        'Home',
        'home',
        'SaaS product homepage',
        [
          { type: 'hero', variant: 'modern-saas' },
          { type: 'features', variant: 'saas-platform' },
          { type: 'demo', variant: 'video' },
          { type: 'testimonials', variant: 'wall-of-love' },
          { type: 'pricing', variant: '3-tier' },
          { type: 'cta', variant: 'gradient' },
        ],
        'page',
        true,
        true,
        0
      ),
      createPage(
        'Features',
        'features',
        'Product features and capabilities',
        [
          { type: 'hero', variant: 'centered' },
          { type: 'features', variant: 'detailed-list' },
          { type: 'features', variant: 'comparison-table' },
          { type: 'cta', variant: 'trial' },
        ],
        'page',
        false,
        true,
        1
      ),
      createPage(
        'Pricing',
        'pricing',
        'Transparent pricing plans',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'pricing', variant: 'comparison-focus' },
          { type: 'faq', variant: 'accordion' },
          { type: 'cta', variant: 'trial' },
        ],
        'page',
        false,
        true,
        2
      ),
      createPage(
        'Resources',
        'resources',
        'Documentation and guides',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'content', variant: 'resource-grid' },
          { type: 'blog', variant: 'featured' },
          { type: 'cta', variant: 'newsletter' },
        ],
        'page',
        false,
        true,
        3
      ),
      createPage(
        'About',
        'about',
        'Our story and team',
        [
          { type: 'hero', variant: 'story' },
          { type: 'content', variant: 'timeline' },
          { type: 'team', variant: 'cards-with-hover' },
          { type: 'cta', variant: 'careers' },
        ],
        'page',
        false,
        true,
        4
      ),
      createPage(
        'Contact',
        'contact',
        'Get in touch',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'contact', variant: 'split-layout' },
        ],
        'page',
        false,
        true,
        5
      ),
    ],
  },

  // 3. Portfolio/Agency Template
  {
    template: createTemplate(
      'Creative Agency',
      'Bold portfolio website for creative agencies and design studios',
      'creative',
      'creative-media',
      'bold',
      {
        colors: {
          primary: '#ec4899',
          secondary: '#db2777',
          accent: '#f472b6',
          background: '#0f172a',
          text: '#f8fafc',
        },
        fonts: {
          heading: 'Montserrat',
          body: 'Open Sans',
        },
        spacing: 'spacious',
        borderRadius: 'minimal',
      },
      ['portfolio', 'agency', 'creative', 'design', 'studio'],
      true,
      true
    ),
    pages: [
      createPage(
        'Home',
        'home',
        'Creative agency homepage',
        [
          { type: 'hero', variant: 'agency-portfolio' },
          { type: 'portfolio', variant: 'masonry' },
          { type: 'services', variant: 'creative' },
          { type: 'testimonials', variant: 'carousel' },
          { type: 'cta', variant: 'bold' },
        ],
        'page',
        true,
        true,
        0
      ),
      createPage(
        'Work',
        'work',
        'Our portfolio',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'portfolio', variant: 'filterable-grid' },
          { type: 'cta', variant: 'project' },
        ],
        'page',
        false,
        true,
        1
      ),
      createPage(
        'Services',
        'services',
        'What we do',
        [
          { type: 'hero', variant: 'creative' },
          { type: 'services', variant: 'detailed-cards' },
          { type: 'process', variant: 'visual' },
          { type: 'cta', variant: 'consultation' },
        ],
        'page',
        false,
        true,
        2
      ),
      createPage(
        'About',
        'about',
        'Our story',
        [
          { type: 'hero', variant: 'story' },
          { type: 'content', variant: 'narrative' },
          { type: 'team', variant: 'creative-grid' },
          { type: 'awards', variant: 'showcase' },
        ],
        'page',
        false,
        true,
        3
      ),
      createPage(
        'Blog',
        'blog',
        'Insights and updates',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'blog', variant: 'grid' },
        ],
        'page',
        false,
        true,
        4
      ),
      createPage(
        'Contact',
        'contact',
        'Start a project',
        [
          { type: 'hero', variant: 'bold' },
          { type: 'contact', variant: 'fullwidth-cta' },
        ],
        'page',
        false,
        true,
        5
      ),
    ],
  },

  // 4. Restaurant Template
  {
    template: createTemplate(
      'Fine Dining Restaurant',
      'Elegant restaurant website with menu, reservations, and gallery',
      'restaurant',
      'hospitality-food',
      'elegant',
      {
        colors: {
          primary: '#92400e',
          secondary: '#78350f',
          accent: '#b45309',
          background: '#fef3c7',
          text: '#1c1917',
        },
        fonts: {
          heading: 'Playfair Display',
          body: 'Lato',
        },
        spacing: 'comfortable',
        borderRadius: 'minimal',
      },
      ['restaurant', 'dining', 'food', 'menu', 'hospitality'],
      false,
      false
    ),
    pages: [
      createPage(
        'Home',
        'home',
        'Restaurant homepage',
        [
          { type: 'hero', variant: 'restaurant' },
          { type: 'features', variant: 'highlights' },
          { type: 'gallery', variant: 'showcase' },
          { type: 'testimonials', variant: 'reviews' },
          { type: 'cta', variant: 'reservation' },
        ],
        'page',
        true,
        true,
        0
      ),
      createPage(
        'Menu',
        'menu',
        'Our menu',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'menu', variant: 'categorized' },
          { type: 'cta', variant: 'reservation' },
        ],
        'page',
        false,
        true,
        1
      ),
      createPage(
        'Reservations',
        'reservations',
        'Book a table',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'booking', variant: 'form' },
          { type: 'info', variant: 'hours-location' },
        ],
        'page',
        false,
        true,
        2
      ),
      createPage(
        'About',
        'about',
        'Our story',
        [
          { type: 'hero', variant: 'story' },
          { type: 'content', variant: 'narrative' },
          { type: 'team', variant: 'chef-profiles' },
        ],
        'page',
        false,
        true,
        3
      ),
      createPage(
        'Gallery',
        'gallery',
        'Photo gallery',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'gallery', variant: 'masonry' },
        ],
        'page',
        false,
        true,
        4
      ),
      createPage(
        'Contact',
        'contact',
        'Get in touch',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'contact', variant: 'form-with-map' },
        ],
        'page',
        false,
        true,
        5
      ),
    ],
  },

  // 5. Real Estate Template
  {
    template: createTemplate(
      'Real Estate Agency',
      'Professional real estate website with property listings and search',
      'real-estate',
      'services',
      'modern',
      {
        colors: {
          primary: '#059669',
          secondary: '#047857',
          accent: '#10b981',
          background: '#ffffff',
          text: '#111827',
        },
        fonts: {
          heading: 'Raleway',
          body: 'Roboto',
        },
        spacing: 'comfortable',
        borderRadius: 'medium',
      },
      ['real-estate', 'property', 'listings', 'agency', 'homes'],
      false,
      false
    ),
    pages: [
      createPage(
        'Home',
        'home',
        'Real estate homepage',
        [
          { type: 'hero', variant: 'real-estate' },
          { type: 'search', variant: 'property' },
          { type: 'listings', variant: 'featured' },
          { type: 'features', variant: 'services' },
          { type: 'testimonials', variant: 'client-reviews' },
          { type: 'cta', variant: 'consultation' },
        ],
        'page',
        true,
        true,
        0
      ),
      createPage(
        'Properties',
        'properties',
        'Browse properties',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'search', variant: 'advanced' },
          { type: 'listings', variant: 'grid' },
        ],
        'page',
        false,
        true,
        1
      ),
      createPage(
        'About',
        'about',
        'About our agency',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'content', variant: 'about' },
          { type: 'team', variant: 'agents' },
          { type: 'stats', variant: 'achievements' },
        ],
        'page',
        false,
        true,
        2
      ),
      createPage(
        'Services',
        'services',
        'Our services',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'services', variant: 'detailed' },
          { type: 'process', variant: 'steps' },
          { type: 'cta', variant: 'consultation' },
        ],
        'page',
        false,
        true,
        3
      ),
      createPage(
        'Blog',
        'blog',
        'Real estate insights',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'blog', variant: 'grid' },
        ],
        'page',
        false,
        true,
        4
      ),
      createPage(
        'Contact',
        'contact',
        'Contact us',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'contact', variant: 'split-layout' },
        ],
        'page',
        false,
        true,
        5
      ),
    ],
  },

  // 6. Law Firm Template
  {
    template: createTemplate(
      'Law Firm Professional',
      'Professional law firm website with practice areas and attorney profiles',
      'legal',
      'business-professional',
      'corporate',
      {
        colors: {
          primary: '#1e3a8a',
          secondary: '#1e40af',
          accent: '#3b82f6',
          background: '#ffffff',
          text: '#1f2937',
        },
        fonts: {
          heading: 'Merriweather',
          body: 'Source Sans Pro',
        },
        spacing: 'formal',
        borderRadius: 'minimal',
      },
      ['law', 'legal', 'attorney', 'lawyer', 'firm'],
      false,
      false
    ),
    pages: [
      createPage(
        'Home',
        'home',
        'Law firm homepage',
        [
          { type: 'hero', variant: 'professional' },
          { type: 'features', variant: 'practice-areas' },
          { type: 'stats', variant: 'achievements' },
          { type: 'testimonials', variant: 'client-success' },
          { type: 'cta', variant: 'consultation' },
        ],
        'page',
        true,
        true,
        0
      ),
      createPage(
        'Practice Areas',
        'practice-areas',
        'Our legal services',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'services', variant: 'legal-areas' },
          { type: 'cta', variant: 'consultation' },
        ],
        'page',
        false,
        true,
        1
      ),
      createPage(
        'Attorneys',
        'attorneys',
        'Our legal team',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'team', variant: 'attorney-profiles' },
        ],
        'page',
        false,
        true,
        2
      ),
      createPage(
        'About',
        'about',
        'About our firm',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'content', variant: 'history' },
          { type: 'values', variant: 'pillars' },
          { type: 'awards', variant: 'recognition' },
        ],
        'page',
        false,
        true,
        3
      ),
      createPage(
        'Case Results',
        'case-results',
        'Our track record',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'cases', variant: 'results' },
          { type: 'testimonials', variant: 'detailed' },
        ],
        'page',
        false,
        true,
        4
      ),
      createPage(
        'Contact',
        'contact',
        'Schedule consultation',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'contact', variant: 'consultation-form' },
          { type: 'info', variant: 'office-locations' },
        ],
        'page',
        false,
        true,
        5
      ),
    ],
  },

  // 7. Medical/Clinic Template
  {
    template: createTemplate(
      'Medical Clinic',
      'Healthcare website for medical clinics and practices',
      'healthcare',
      'healthcare-wellness',
      'modern',
      {
        colors: {
          primary: '#0891b2',
          secondary: '#0e7490',
          accent: '#06b6d4',
          background: '#ffffff',
          text: '#0f172a',
        },
        fonts: {
          heading: 'Nunito',
          body: 'Open Sans',
        },
        spacing: 'comfortable',
        borderRadius: 'medium',
      },
      ['medical', 'healthcare', 'clinic', 'doctor', 'health'],
      false,
      false
    ),
    pages: [
      createPage(
        'Home',
        'home',
        'Medical clinic homepage',
        [
          { type: 'hero', variant: 'healthcare' },
          { type: 'services', variant: 'medical' },
          { type: 'team', variant: 'doctors' },
          { type: 'testimonials', variant: 'patient-reviews' },
          { type: 'cta', variant: 'appointment' },
        ],
        'page',
        true,
        true,
        0
      ),
      createPage(
        'Services',
        'services',
        'Medical services',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'services', variant: 'detailed-medical' },
          { type: 'cta', variant: 'appointment' },
        ],
        'page',
        false,
        true,
        1
      ),
      createPage(
        'Our Doctors',
        'doctors',
        'Meet our medical team',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'team', variant: 'doctor-profiles' },
        ],
        'page',
        false,
        true,
        2
      ),
      createPage(
        'Appointments',
        'appointments',
        'Book an appointment',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'booking', variant: 'appointment-form' },
          { type: 'info', variant: 'insurance-accepted' },
        ],
        'page',
        false,
        true,
        3
      ),
      createPage(
        'Patient Resources',
        'resources',
        'Health information',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'resources', variant: 'health-library' },
          { type: 'faq', variant: 'medical' },
        ],
        'page',
        false,
        true,
        4
      ),
      createPage(
        'Contact',
        'contact',
        'Contact us',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'contact', variant: 'form-with-map' },
          { type: 'info', variant: 'hours-emergency' },
        ],
        'page',
        false,
        true,
        5
      ),
    ],
  },

  // 8. E-commerce Template
  {
    template: createTemplate(
      'Modern E-commerce Store',
      'Full-featured online store with product catalog and checkout',
      'ecommerce',
      'retail-ecommerce',
      'modern',
      {
        colors: {
          primary: '#dc2626',
          secondary: '#b91c1c',
          accent: '#ef4444',
          background: '#ffffff',
          text: '#111827',
        },
        fonts: {
          heading: 'Poppins',
          body: 'Inter',
        },
        spacing: 'comfortable',
        borderRadius: 'medium',
      },
      ['ecommerce', 'store', 'shop', 'retail', 'products'],
      true,
      true
    ),
    pages: [
      createPage(
        'Home',
        'home',
        'Store homepage',
        [
          { type: 'hero', variant: 'ecommerce' },
          { type: 'products', variant: 'featured' },
          { type: 'categories', variant: 'grid' },
          { type: 'testimonials', variant: 'customer-reviews' },
          { type: 'cta', variant: 'newsletter' },
        ],
        'page',
        true,
        true,
        0
      ),
      createPage(
        'Shop',
        'shop',
        'Browse products',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'products', variant: 'grid-with-filters' },
        ],
        'page',
        false,
        true,
        1
      ),
      createPage(
        'About',
        'about',
        'Our story',
        [
          { type: 'hero', variant: 'brand-story' },
          { type: 'content', variant: 'mission' },
          { type: 'values', variant: 'commitments' },
        ],
        'page',
        false,
        true,
        2
      ),
      createPage(
        'Blog',
        'blog',
        'Latest updates',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'blog', variant: 'grid' },
        ],
        'page',
        false,
        true,
        3
      ),
      createPage(
        'Contact',
        'contact',
        'Customer support',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'contact', variant: 'support-form' },
          { type: 'faq', variant: 'shopping' },
        ],
        'page',
        false,
        true,
        4
      ),
    ],
  },

  // 9. Education/Online Course Template
  {
    template: createTemplate(
      'Online Learning Platform',
      'Educational website for online courses and training programs',
      'education',
      'education-training',
      'modern',
      {
        colors: {
          primary: '#7c3aed',
          secondary: '#6d28d9',
          accent: '#8b5cf6',
          background: '#ffffff',
          text: '#1f2937',
        },
        fonts: {
          heading: 'Montserrat',
          body: 'Lato',
        },
        spacing: 'comfortable',
        borderRadius: 'large',
      },
      ['education', 'learning', 'courses', 'training', 'school'],
      false,
      false
    ),
    pages: [
      createPage(
        'Home',
        'home',
        'Learning platform homepage',
        [
          { type: 'hero', variant: 'education' },
          { type: 'courses', variant: 'featured' },
          { type: 'features', variant: 'learning-benefits' },
          { type: 'testimonials', variant: 'student-success' },
          { type: 'stats', variant: 'platform-stats' },
          { type: 'cta', variant: 'enrollment' },
        ],
        'page',
        true,
        true,
        0
      ),
      createPage(
        'Courses',
        'courses',
        'Browse courses',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'courses', variant: 'grid-with-filters' },
        ],
        'page',
        false,
        true,
        1
      ),
      createPage(
        'About',
        'about',
        'About our platform',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'content', variant: 'mission' },
          { type: 'team', variant: 'instructors' },
          { type: 'stats', variant: 'achievements' },
        ],
        'page',
        false,
        true,
        2
      ),
      createPage(
        'Instructors',
        'instructors',
        'Meet our instructors',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'team', variant: 'instructor-profiles' },
        ],
        'page',
        false,
        true,
        3
      ),
      createPage(
        'Blog',
        'blog',
        'Learning resources',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'blog', variant: 'educational' },
        ],
        'page',
        false,
        true,
        4
      ),
      createPage(
        'Contact',
        'contact',
        'Get in touch',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'contact', variant: 'support-form' },
          { type: 'faq', variant: 'enrollment' },
        ],
        'page',
        false,
        true,
        5
      ),
    ],
  },

  // 10. Non-Profit Template
  {
    template: createTemplate(
      'Non-Profit Organization',
      'Impactful website for non-profits, charities, and NGOs',
      'nonprofit',
      'nonprofit-community',
      'modern',
      {
        colors: {
          primary: '#059669',
          secondary: '#047857',
          accent: '#10b981',
          background: '#ffffff',
          text: '#111827',
        },
        fonts: {
          heading: 'Raleway',
          body: 'Open Sans',
        },
        spacing: 'comfortable',
        borderRadius: 'medium',
      },
      ['nonprofit', 'charity', 'ngo', 'donation', 'cause'],
      false,
      false
    ),
    pages: [
      createPage(
        'Home',
        'home',
        'Non-profit homepage',
        [
          { type: 'hero', variant: 'cause' },
          { type: 'impact', variant: 'stats' },
          { type: 'programs', variant: 'featured' },
          { type: 'testimonials', variant: 'beneficiary-stories' },
          { type: 'cta', variant: 'donation' },
        ],
        'page',
        true,
        true,
        0
      ),
      createPage(
        'Our Mission',
        'mission',
        'What we do',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'content', variant: 'mission-vision' },
          { type: 'impact', variant: 'achievements' },
        ],
        'page',
        false,
        true,
        1
      ),
      createPage(
        'Programs',
        'programs',
        'Our programs',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'programs', variant: 'detailed' },
          { type: 'cta', variant: 'get-involved' },
        ],
        'page',
        false,
        true,
        2
      ),
      createPage(
        'Get Involved',
        'get-involved',
        'Join our cause',
        [
          { type: 'hero', variant: 'volunteer' },
          { type: 'opportunities', variant: 'volunteer' },
          { type: 'cta', variant: 'donation' },
        ],
        'page',
        false,
        true,
        3
      ),
      createPage(
        'Stories',
        'stories',
        'Impact stories',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'stories', variant: 'grid' },
        ],
        'page',
        false,
        true,
        4
      ),
      createPage(
        'Donate',
        'donate',
        'Support our cause',
        [
          { type: 'hero', variant: 'donation' },
          { type: 'donation', variant: 'form' },
          { type: 'impact', variant: 'donation-impact' },
        ],
        'page',
        false,
        true,
        5
      ),
      createPage(
        'Contact',
        'contact',
        'Contact us',
        [
          { type: 'hero', variant: 'minimal' },
          { type: 'contact', variant: 'form-with-map' },
        ],
        'page',
        false,
        true,
        6
      ),
    ],
  },
];

// ============================================================================
// SEEDING FUNCTION
// ============================================================================

async function seedTemplates() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌱 Starting template seeding...\n');

    let insertedTemplates = 0;
    let insertedPages = 0;

    for (const { template, pages } of templates) {
      try {
        // Insert template
        const templateResult = await client.query(
          `INSERT INTO builder_templates 
           (name, description, industry, category, style_variant, is_global, is_premium, is_featured, 
            template_config, tags, thumbnail_url, preview_images, demo_url, theme_id, usage_count, 
            rating, rating_count, version, seo_title, seo_description, seo_keywords, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
           RETURNING id`,
          [
            template.name,
            template.description,
            template.industry,
            template.category,
            template.style_variant,
            template.is_global,
            template.is_premium,
            template.is_featured,
            JSON.stringify(template.template_config),
            template.tags,
            template.thumbnail_url,
            template.preview_images,
            template.demo_url,
            template.theme_id,
            template.usage_count,
            template.rating,
            template.rating_count,
            template.version,
            template.seo_title,
            template.seo_description,
            template.seo_keywords,
            template.is_active,
          ]
        );

        if (templateResult.rows.length > 0) {
          const templateId = templateResult.rows[0].id;
          insertedTemplates++;
          console.log(`✓ Template: ${template.name}`);

          // Insert pages for this template
          for (const page of pages) {
            try {
              await client.query(
                `INSERT INTO builder_template_pages 
                 (template_id, name, slug, description, page_type, blocks, meta_title, meta_description, 
                  og_image, is_home, show_in_nav, nav_order, parent_page_id, thumbnail_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [
                  templateId,
                  page.name,
                  page.slug,
                  page.description,
                  page.page_type,
                  JSON.stringify(page.blocks),
                  page.meta_title,
                  page.meta_description,
                  page.og_image,
                  page.is_home,
                  page.show_in_nav,
                  page.nav_order,
                  page.parent_page_id,
                  page.thumbnail_url,
                ]
              );
              insertedPages++;
              console.log(`  ✓ Page: ${page.name}`);
            } catch (error) {
              console.error(`  ✗ Failed to insert page ${page.name}:`, error.message);
            }
          }
        }
      } catch (error) {
        console.error(`✗ Failed to insert template ${template.name}:`, error.message);
      }
    }

    await client.query('COMMIT');

    console.log(`\n✅ Template seeding complete!`);
    console.log(`   Templates inserted: ${insertedTemplates}`);
    console.log(`   Pages inserted: ${insertedPages}`);
    console.log(`   Total templates: ${templates.length}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding templates:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedTemplates()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { seedTemplates };
