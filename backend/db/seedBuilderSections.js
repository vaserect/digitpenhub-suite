/**
 * Seed Builder Sections
 * Creates 50+ production-ready, pre-built page sections for the Website Builder
 * 
 * Sections are complete, ready-to-use page sections that combine multiple components
 * 
 * Section Categories:
 * - Hero sections (10 complete variants)
 * - Feature sections (10 complete variants)
 * - Pricing sections (5 complete variants)
 * - Testimonial sections (5 complete variants)
 * - Team sections (5 complete variants)
 * - Contact sections (5 complete variants)
 * - Footer sections (10 complete variants)
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to create section data
function createSection(name, description, category, blocks, styleVariant = 'modern', tags = []) {
  return {
    name,
    description,
    category,
    is_global: true,
    blocks,
    style_variant: styleVariant,
    tags,
    thumbnail_url: null,
    preview_html: null,
    responsive_settings: {},
    usage_count: 0,
    version: 1,
    is_active: true,
  };
}

// ============================================================================
// HERO SECTIONS (10 complete variants)
// ============================================================================
const heroSections = [
  createSection(
    'Hero - Modern SaaS',
    'Complete modern hero section for SaaS products',
    'hero',
    [
      {
        type: 'hero',
        layout: 'centered',
        background: {
          type: 'gradient',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        content: {
          badge: { text: 'New Release', color: '#10b981' },
          heading: 'Build Your Dream Website in Minutes',
          subheading: 'The most powerful no-code website builder for modern businesses. Create stunning, professional websites without writing a single line of code.',
          headingSize: '5xl',
          subheadingSize: 'xl',
          textColor: '#ffffff',
          maxWidth: '900px',
        },
        cta: {
          primary: { text: 'Start Free Trial', url: '#signup', style: 'solid', size: 'lg' },
          secondary: { text: 'Watch Demo', url: '#demo', style: 'outline', size: 'lg' },
        },
        features: [
          { icon: '✓', text: 'No credit card required' },
          { icon: '✓', text: '14-day free trial' },
          { icon: '✓', text: 'Cancel anytime' },
        ],
        spacing: { padding: '140px 24px' },
      },
    ],
    'modern',
    ['hero', 'saas', 'gradient', 'centered', 'cta']
  ),

  createSection(
    'Hero - Business Professional',
    'Professional hero section for corporate websites',
    'hero',
    [
      {
        type: 'hero',
        layout: 'split',
        background: { type: 'solid', color: '#ffffff' },
        content: {
          heading: 'Transform Your Business with Digital Excellence',
          subheading: 'Partner with industry leaders to accelerate growth, streamline operations, and achieve measurable results.',
          headingSize: '4xl',
          subheadingSize: 'xl',
          textColor: '#1f2937',
          alignment: 'left',
        },
        image: {
          url: 'https://images.unsplash.com/photo-1551434678-e076c223a692',
          alt: 'Professional business team',
          position: 'right',
        },
        stats: [
          { value: '500+', label: 'Enterprise Clients' },
          { value: '98%', label: 'Satisfaction Rate' },
          { value: '24/7', label: 'Support' },
        ],
        cta: {
          primary: { text: 'Schedule Consultation', url: '#contact', style: 'solid' },
          secondary: { text: 'View Case Studies', url: '#cases', style: 'text' },
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'professional',
    ['hero', 'business', 'corporate', 'split', 'stats']
  ),

  createSection(
    'Hero - E-commerce Product Launch',
    'Hero section optimized for product launches',
    'hero',
    [
      {
        type: 'hero',
        layout: 'split',
        background: { type: 'solid', color: '#f9fafb' },
        content: {
          badge: { text: 'New Collection 2026', color: '#ef4444' },
          heading: 'Elevate Your Style',
          subheading: 'Discover our latest collection of premium products designed for the modern lifestyle.',
          headingSize: '4xl',
          subheadingSize: 'lg',
          textColor: '#1f2937',
          alignment: 'left',
        },
        image: {
          url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
          alt: 'Product showcase',
          position: 'right',
        },
        cta: {
          primary: { text: 'Shop Now', url: '#shop', style: 'solid', size: 'lg' },
          secondary: { text: 'View Lookbook', url: '#lookbook', style: 'outline', size: 'lg' },
        },
        features: [
          { icon: '🚚', text: 'Free Shipping' },
          { icon: '↩️', text: '30-Day Returns' },
          { icon: '🔒', text: 'Secure Checkout' },
        ],
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['hero', 'ecommerce', 'product', 'launch', 'shopping']
  ),

  createSection(
    'Hero - Startup Launch',
    'Bold hero section for startup launches',
    'hero',
    [
      {
        type: 'hero',
        layout: 'centered',
        background: {
          type: 'gradient',
          gradient: 'linear-gradient(to right, #000000, #434343)',
        },
        content: {
          heading: 'THE FUTURE IS HERE',
          subheading: 'Join the revolution. Be part of something bigger. Transform the way the world works.',
          headingSize: '6xl',
          subheadingSize: '2xl',
          textColor: '#ffffff',
          headingWeight: 'bold',
          letterSpacing: 'tight',
        },
        cta: {
          primary: { text: 'Join Waitlist', url: '#waitlist', style: 'solid', size: 'xl' },
        },
        socialProof: {
          text: 'Join 50,000+ early adopters',
          logos: [
            { name: 'TechCrunch', url: 'https://via.placeholder.com/120x40' },
            { name: 'Forbes', url: 'https://via.placeholder.com/120x40' },
            { name: 'Wired', url: 'https://via.placeholder.com/120x40' },
          ],
        },
        spacing: { padding: '160px 24px' },
      },
    ],
    'bold',
    ['hero', 'startup', 'launch', 'bold', 'dramatic']
  ),

  createSection(
    'Hero - Agency Portfolio',
    'Creative hero section for agencies and portfolios',
    'hero',
    [
      {
        type: 'hero',
        layout: 'centered',
        background: { type: 'solid', color: '#ffffff' },
        content: {
          heading: 'We Create Digital Experiences',
          subheading: 'Award-winning design studio crafting beautiful brands and websites',
          headingSize: '4xl',
          subheadingSize: 'xl',
          textColor: '#1f2937',
        },
        cta: {
          primary: { text: 'View Our Work', url: '#portfolio', style: 'solid' },
          secondary: { text: 'Start a Project', url: '#contact', style: 'outline' },
        },
        awards: [
          { name: 'Awwwards', year: '2025' },
          { name: 'CSS Design Awards', year: '2025' },
          { name: 'FWA', year: '2026' },
        ],
        spacing: { padding: '120px 24px' },
      },
    ],
    'minimal',
    ['hero', 'agency', 'portfolio', 'creative', 'minimal']
  ),

  createSection(
    'Hero - Lead Generation',
    'Hero section with integrated lead capture form',
    'hero',
    [
      {
        type: 'hero',
        layout: 'form',
        background: {
          type: 'gradient',
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        },
        content: {
          heading: 'Get Your Free Marketing Audit',
          subheading: 'Discover how to 10x your marketing ROI. No credit card required.',
          headingSize: '4xl',
          subheadingSize: 'xl',
          textColor: '#ffffff',
        },
        form: {
          fields: [
            { type: 'text', name: 'name', placeholder: 'Full Name', required: true },
            { type: 'email', name: 'email', placeholder: 'Work Email', required: true },
            { type: 'text', name: 'company', placeholder: 'Company Name', required: true },
            { type: 'tel', name: 'phone', placeholder: 'Phone Number', required: false },
          ],
          submitText: 'Get Free Audit',
          submitStyle: 'solid',
        },
        trustSignals: [
          { icon: '🔒', text: 'Your data is secure' },
          { icon: '✓', text: 'No spam, ever' },
          { icon: '⚡', text: 'Instant access' },
        ],
        spacing: { padding: '120px 24px' },
      },
    ],
    'modern',
    ['hero', 'lead-gen', 'form', 'conversion', 'b2b']
  ),

  createSection(
    'Hero - App Download',
    'Hero section for mobile app downloads',
    'hero',
    [
      {
        type: 'hero',
        layout: 'split',
        background: {
          type: 'gradient',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        content: {
          heading: 'Your Life, Simplified',
          subheading: 'The all-in-one app that helps you stay organized, productive, and connected.',
          headingSize: '4xl',
          subheadingSize: 'xl',
          textColor: '#ffffff',
          alignment: 'left',
        },
        image: {
          url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
          alt: 'Mobile app interface',
          position: 'right',
          type: 'phone-mockup',
        },
        appStores: [
          { platform: 'ios', url: '#', badge: 'Download on App Store' },
          { platform: 'android', url: '#', badge: 'Get it on Google Play' },
        ],
        stats: [
          { value: '1M+', label: 'Downloads' },
          { value: '4.9', label: 'Rating' },
          { value: '50K+', label: 'Reviews' },
        ],
        spacing: { padding: '120px 24px' },
      },
    ],
    'modern',
    ['hero', 'app', 'mobile', 'download', 'tech']
  ),

  createSection(
    'Hero - Event Registration',
    'Hero section for event and webinar registration',
    'hero',
    [
      {
        type: 'hero',
        layout: 'centered',
        background: { type: 'solid', color: '#1f2937' },
        content: {
          badge: { text: 'Live Event - July 25, 2026', color: '#ef4444' },
          heading: 'The Future of Digital Marketing',
          subheading: 'Join 5,000+ marketers for the biggest digital marketing event of the year',
          headingSize: '4xl',
          subheadingSize: 'xl',
          textColor: '#ffffff',
        },
        countdown: {
          endDate: '2026-07-25T10:00:00Z',
          labels: { days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' },
        },
        cta: {
          primary: { text: 'Register Now - $99', url: '#register', style: 'solid', size: 'xl' },
          secondary: { text: 'View Agenda', url: '#agenda', style: 'outline', size: 'xl' },
        },
        speakers: [
          { name: 'John Doe', title: 'CEO, TechCorp', avatar: 'https://i.pravatar.cc/100?img=1' },
          { name: 'Jane Smith', title: 'CMO, StartupXYZ', avatar: 'https://i.pravatar.cc/100?img=2' },
          { name: 'Mike Johnson', title: 'VP Marketing, BigCo', avatar: 'https://i.pravatar.cc/100?img=3' },
        ],
        spacing: { padding: '120px 24px' },
      },
    ],
    'modern',
    ['hero', 'event', 'webinar', 'registration', 'countdown']
  ),

  createSection(
    'Hero - Real Estate',
    'Hero section for real estate websites',
    'hero',
    [
      {
        type: 'hero',
        layout: 'fullscreen',
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
          overlay: 'rgba(0, 0, 0, 0.4)',
        },
        content: {
          heading: 'Find Your Dream Home',
          subheading: 'Discover luxury properties in prime locations',
          headingSize: '5xl',
          subheadingSize: '2xl',
          textColor: '#ffffff',
        },
        searchBar: {
          placeholder: 'Enter location, property type, or keyword',
          filters: ['Buy', 'Rent', 'Sold'],
          buttonText: 'Search Properties',
        },
        stats: [
          { value: '10,000+', label: 'Properties' },
          { value: '50+', label: 'Cities' },
          { value: '5,000+', label: 'Happy Clients' },
        ],
        spacing: { padding: '160px 24px' },
      },
    ],
    'luxury',
    ['hero', 'real-estate', 'property', 'search', 'fullscreen']
  ),

  createSection(
    'Hero - Restaurant',
    'Hero section for restaurant websites',
    'hero',
    [
      {
        type: 'hero',
        layout: 'split',
        background: { type: 'solid', color: '#1f2937' },
        content: {
          heading: 'Experience Culinary Excellence',
          subheading: 'Award-winning cuisine in an unforgettable atmosphere',
          headingSize: '4xl',
          subheadingSize: 'xl',
          textColor: '#ffffff',
          alignment: 'left',
        },
        image: {
          url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
          alt: 'Restaurant interior',
          position: 'right',
        },
        cta: {
          primary: { text: 'Reserve a Table', url: '#booking', style: 'solid', size: 'lg' },
          secondary: { text: 'View Menu', url: '#menu', style: 'outline', size: 'lg' },
        },
        hours: {
          weekday: 'Mon-Fri: 11am - 10pm',
          weekend: 'Sat-Sun: 10am - 11pm',
        },
        contact: {
          phone: '(555) 123-4567',
          address: '123 Main St, City, State',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'elegant',
    ['hero', 'restaurant', 'food', 'booking', 'hospitality']
  ),
];

// ============================================================================
// FEATURE SECTIONS (10 complete variants)
// ============================================================================
const featureSections = [
  createSection(
    'Features - SaaS Platform',
    'Complete feature showcase for SaaS platforms',
    'features',
    [
      {
        type: 'features',
        layout: 'grid',
        columns: 3,
        heading: 'Everything You Need to Succeed',
        subheading: 'Powerful features designed to help you grow faster',
        features: [
          {
            icon: '⚡',
            title: 'Lightning Fast',
            description: 'Optimized for speed with sub-second load times and instant updates',
          },
          {
            icon: '🔒',
            title: 'Enterprise Security',
            description: 'Bank-level encryption and compliance with SOC 2, GDPR, and HIPAA',
          },
          {
            icon: '📊',
            title: 'Advanced Analytics',
            description: 'Real-time insights and custom reports to track your success',
          },
          {
            icon: '🔄',
            title: 'Seamless Integrations',
            description: 'Connect with 1000+ tools through our powerful API',
          },
          {
            icon: '👥',
            title: 'Team Collaboration',
            description: 'Work together in real-time with unlimited team members',
          },
          {
            icon: '🎯',
            title: 'Smart Automation',
            description: 'Automate repetitive tasks and focus on what matters',
          },
        ],
        style: {
          iconSize: '56px',
          iconColor: '#3b82f6',
          titleSize: 'xl',
          descriptionSize: 'base',
          spacing: '40px',
        },
        cta: {
          text: 'Explore All Features',
          url: '#features',
          style: 'outline',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['features', 'saas', 'grid', 'comprehensive']
  ),

  createSection(
    'Features - Product Showcase',
    'Alternating feature showcase with images',
    'features',
    [
      {
        type: 'features',
        layout: 'alternating',
        heading: 'Built for Modern Teams',
        features: [
          {
            title: 'Powerful Dashboard',
            description: 'Get a complete view of your business with our intuitive dashboard. Track metrics, manage teams, and make data-driven decisions all in one place.',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
            imagePosition: 'right',
            features: [
              { icon: '✓', text: 'Real-time updates' },
              { icon: '✓', text: 'Customizable widgets' },
              { icon: '✓', text: 'Export reports' },
            ],
            cta: { text: 'Try Dashboard', url: '#', style: 'solid' },
          },
          {
            title: 'Advanced Automation',
            description: 'Automate repetitive tasks and workflows to save time and reduce errors. Set up complex automation rules without writing code.',
            image: 'https://images.unsplash.com/photo-1551434678-e076c223a692',
            imagePosition: 'left',
            features: [
              { icon: '✓', text: 'Visual workflow builder' },
              { icon: '✓', text: 'Conditional logic' },
              { icon: '✓', text: 'Multi-step automation' },
            ],
            cta: { text: 'Learn More', url: '#', style: 'outline' },
          },
          {
            title: 'Seamless Integrations',
            description: 'Connect with all your favorite tools and services. Our powerful API makes integration simple and reliable.',
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
            imagePosition: 'right',
            features: [
              { icon: '✓', text: '1000+ integrations' },
              { icon: '✓', text: 'RESTful API' },
              { icon: '✓', text: 'Webhooks support' },
            ],
            cta: { text: 'View Integrations', url: '#', style: 'solid' },
          },
        ],
        style: {
          titleSize: '3xl',
          descriptionSize: 'lg',
          imageHeight: '500px',
          spacing: '80px',
        },
        spacing: { padding: '120px 24px' },
      },
    ],
    'modern',
    ['features', 'showcase', 'alternating', 'detailed']
  ),

  createSection(
    'Features - Process Timeline',
    'Step-by-step process timeline',
    'features',
    [
      {
        type: 'features',
        layout: 'timeline',
        heading: 'How It Works',
        subheading: 'Get started in three simple steps',
        features: [
          {
            step: '1',
            title: 'Sign Up',
            description: 'Create your account in seconds. No credit card required.',
            icon: '📝',
          },
          {
            step: '2',
            title: 'Customize',
            description: 'Choose your template and make it yours with our drag-and-drop editor.',
            icon: '🎨',
          },
          {
            step: '3',
            title: 'Launch',
            description: 'Publish your site and start growing your business.',
            icon: '🚀',
          },
        ],
        style: {
          lineColor: '#3b82f6',
          stepSize: '64px',
          stepColor: '#3b82f6',
          titleSize: '2xl',
          descriptionSize: 'lg',
        },
        cta: {
          text: 'Get Started Free',
          url: '#signup',
          style: 'solid',
          size: 'lg',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['features', 'timeline', 'process', 'steps']
  ),

  createSection(
    'Features - Benefits Grid',
    'Grid showcasing key benefits',
    'features',
    [
      {
        type: 'features',
        layout: 'grid',
        columns: 2,
        heading: 'Why Businesses Choose Us',
        subheading: 'The platform that helps you grow faster',
        features: [
          {
            icon: '💰',
            title: 'Save Money',
            description: 'Reduce operational costs by up to 50% with our efficient platform and automation tools',
          },
          {
            icon: '⏱️',
            title: 'Save Time',
            description: 'Automate repetitive tasks and focus on what matters most - growing your business',
          },
          {
            icon: '📈',
            title: 'Grow Faster',
            description: 'Scale your business with powerful growth tools and data-driven insights',
          },
          {
            icon: '🎯',
            title: 'Stay Focused',
            description: 'Keep your team aligned with clear objectives and real-time collaboration',
          },
        ],
        style: {
          iconSize: '64px',
          titleSize: '2xl',
          descriptionSize: 'lg',
          spacing: '48px',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['features', 'benefits', 'grid', 'value']
  ),

  createSection(
    'Features - Comparison Table',
    'Feature comparison table',
    'features',
    [
      {
        type: 'features',
        layout: 'comparison',
        heading: 'Choose the Right Plan',
        subheading: 'Compare features across all plans',
        plans: ['Starter', 'Professional', 'Enterprise'],
        features: [
          { name: 'Projects', starter: '10', pro: 'Unlimited', enterprise: 'Unlimited' },
          { name: 'Storage', starter: '5GB', pro: '100GB', enterprise: 'Unlimited' },
          { name: 'Team Members', starter: '1', pro: '10', enterprise: 'Unlimited' },
          { name: 'Support', starter: 'Email', pro: 'Priority', enterprise: '24/7 Phone' },
          { name: 'API Access', starter: false, pro: true, enterprise: true },
          { name: 'Custom Domain', starter: false, pro: true, enterprise: true },
          { name: 'White Label', starter: false, pro: false, enterprise: true },
          { name: 'Advanced Analytics', starter: false, pro: true, enterprise: true },
          { name: 'Custom Integrations', starter: false, pro: false, enterprise: true },
          { name: 'Dedicated Support', starter: false, pro: false, enterprise: true },
        ],
        style: {
          headerSize: 'lg',
          cellPadding: '16px',
          borderColor: '#e5e7eb',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['features', 'comparison', 'table', 'plans']
  ),

  createSection(
    'Features - Icon Grid',
    'Simple icon grid with features',
    'features',
    [
      {
        type: 'features',
        layout: 'grid',
        columns: 4,
        heading: 'Everything You Need',
        features: [
          { icon: '🎨', title: 'Design', description: 'Beautiful templates' },
          { icon: '⚙️', title: 'Customize', description: 'Make it yours' },
          { icon: '🚀', title: 'Launch', description: 'Go live instantly' },
          { icon: '📊', title: 'Analyze', description: 'Track performance' },
          { icon: '🔒', title: 'Secure', description: 'Bank-level security' },
          { icon: '⚡', title: 'Fast', description: 'Lightning speed' },
          { icon: '📱', title: 'Mobile', description: 'Responsive design' },
          { icon: '🌐', title: 'Global', description: 'Worldwide CDN' },
        ],
        style: {
          iconSize: '48px',
          iconColor: '#8b5cf6',
          titleSize: 'lg',
          descriptionSize: 'sm',
          spacing: '32px',
        },
        spacing: { padding: '80px 24px' },
      },
    ],
    'modern',
    ['features', 'grid', 'icons', 'compact']
  ),

  createSection(
    'Features - Cards with Images',
    'Feature cards with images',
    'features',
    [
      {
        type: 'features',
        layout: 'cards',
        columns: 3,
        heading: 'Our Services',
        subheading: 'Comprehensive solutions for your business',
        features: [
          {
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
            title: 'Marketing Automation',
            description: 'Streamline your marketing with powerful automation tools and workflows',
            cta: { text: 'Learn More', url: '#', style: 'text' },
          },
          {
            image: 'https://images.unsplash.com/photo-1551434678-e076c223a692',
            title: 'Team Collaboration',
            description: 'Work together seamlessly with real-time collaboration features',
            cta: { text: 'Learn More', url: '#', style: 'text' },
          },
          {
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
            title: 'Analytics & Insights',
            description: 'Make data-driven decisions with comprehensive analytics',
            cta: { text: 'Learn More', url: '#', style: 'text' },
          },
        ],
        style: {
          cardStyle: 'elevated',
          imageHeight: '240px',
          titleSize: 'xl',
          descriptionSize: 'base',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['features', 'cards', 'images', 'services']
  ),

  createSection(
    'Features - List with Details',
    'Detailed feature list',
    'features',
    [
      {
        type: 'features',
        layout: 'list',
        heading: 'Enterprise Features',
        subheading: 'Built for scale and security',
        features: [
          {
            icon: '🔐',
            title: 'Advanced Security',
            description: 'Enterprise-grade security with SOC 2 Type II compliance, SSO, and advanced access controls. Your data is encrypted at rest and in transit.',
            features: [
              'SOC 2 Type II certified',
              'SAML/SSO integration',
              'Role-based access control',
              'Audit logs',
            ],
          },
          {
            icon: '📊',
            title: 'Advanced Analytics',
            description: 'Get deep insights with custom dashboards, real-time reporting, and data export capabilities.',
            features: [
              'Custom dashboards',
              'Real-time reporting',
              'Data export (CSV, PDF)',
              'API access',
            ],
          },
          {
            icon: '🤝',
            title: 'Dedicated Support',
            description: '24/7 priority support with dedicated account manager and onboarding assistance.',
            features: [
              '24/7 phone support',
              'Dedicated account manager',
              'Priority bug fixes',
              'Custom training',
            ],
          },
        ],
        style: {
          iconSize: '48px',
          iconColor: '#3b82f6',
          titleSize: '2xl',
          descriptionSize: 'lg',
          spacing: '64px',
        },
        spacing: { padding: '120px 24px' },
      },
    ],
    'professional',
    ['features', 'list', 'detailed', 'enterprise']
  ),

  createSection(
    'Features - Stats Integration',
    'Features with integrated statistics',
    'features',
    [
      {
        type: 'features',
        layout: 'stats',
        heading: 'Proven Results',
        subheading: 'Join thousands of successful businesses',
        stats: [
          { value: '10,000+', label: 'Active Users' },
          { value: '50M+', label: 'Transactions' },
          { value: '99.9%', label: 'Uptime' },
          { value: '4.9/5', label: 'Rating' },
        ],
        features: [
          {
            icon: '⚡',
            title: 'Lightning Fast',
            description: 'Optimized for speed and performance',
          },
          {
            icon: '🔒',
            title: 'Secure & Safe',
            description: 'Enterprise-grade security',
          },
          {
            icon: '📈',
            title: 'Scalable',
            description: 'Grows with your business',
          },
        ],
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['features', 'stats', 'social-proof', 'results']
  ),

  createSection(
    'Features - Video Demo',
    'Features with video demonstration',
    'features',
    [
      {
        type: 'features',
        layout: 'video',
        heading: 'See It In Action',
        subheading: 'Watch how easy it is to get started',
        video: {
          url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
          aspectRatio: '16:9',
        },
        features: [
          { icon: '✓', text: 'No credit card required' },
          { icon: '✓', text: 'Setup in 5 minutes' },
          { icon: '✓', text: 'Free 14-day trial' },
        ],
        cta: {
          text: 'Start Free Trial',
          url: '#signup',
          style: 'solid',
          size: 'lg',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['features', 'video', 'demo', 'visual']
  ),
];

// ============================================================================
// PRICING SECTIONS (5 complete variants)
// ============================================================================
const pricingSections = [
  createSection(
    'Pricing - 3 Tier Standard',
    'Standard 3-tier pricing table',
    'pricing',
    [
      {
        type: 'pricing',
        layout: '3-tier',
        heading: 'Simple, Transparent Pricing',
        subheading: 'Choose the plan that fits your needs',
        billingToggle: {
          monthly: 'Monthly',
          yearly: 'Yearly',
          discount: 'Save 20%',
        },
        plans: [
          {
            name: 'Starter',
            description: 'Perfect for individuals and small projects',
            monthlyPrice: '$29',
            yearlyPrice: '$279',
            features: [
              'Up to 10 projects',
              '5GB storage',
              'Email support',
              'Basic analytics',
              'SSL certificate',
            ],
            cta: { text: 'Start Free Trial', url: '#', style: 'outline' },
            highlighted: false,
          },
          {
            name: 'Professional',
            description: 'For growing teams and businesses',
            monthlyPrice: '$79',
            yearlyPrice: '$759',
            badge: 'Most Popular',
            features: [
              'Unlimited projects',
              '100GB storage',
              'Priority support',
              'Advanced analytics',
              'Team collaboration',
              'Custom domain',
              'API access',
            ],
            cta: { text: 'Get Started', url: '#', style: 'solid' },
            highlighted: true,
          },
          {
            name: 'Enterprise',
            description: 'For large organizations',
            monthlyPrice: '$199',
            yearlyPrice: '$1,899',
            features: [
              'Everything in Pro',
              'Unlimited storage',
              '24/7 phone support',
              'Custom integrations',
              'Dedicated account manager',
              'SLA guarantee',
              'Advanced security',
            ],
            cta: { text: 'Contact Sales', url: '#', style: 'outline' },
            highlighted: false,
          },
        ],
        style: {
          cardStyle: 'elevated',
          priceSize: '4xl',
          featureSize: 'base',
        },
        faq: {
          heading: 'Frequently Asked Questions',
          questions: [
            { q: 'Can I change plans later?', a: 'Yes, you can upgrade or downgrade at any time.' },
            { q: 'What payment methods do you accept?', a: 'We accept all major credit cards and PayPal.' },
          ],
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['pricing', '3-tier', 'plans', 'subscription']
  ),

  createSection(
    'Pricing - Comparison Focus',
    'Detailed pricing comparison table',
    'pricing',
    [
      {
        type: 'pricing',
        layout: 'comparison',
        heading: 'Compare All Features',
        subheading: 'Find the perfect plan for your needs',
        plans: [
          { name: 'Starter', price: '$29/mo' },
          { name: 'Professional', price: '$79/mo', highlighted: true },
          { name: 'Enterprise', price: '$199/mo' },
        ],
        categories: [
          {
            name: 'Core Features',
            features: [
              { name: 'Projects', starter: '10', pro: 'Unlimited', enterprise: 'Unlimited' },
              { name: 'Storage', starter: '5GB', pro: '100GB', enterprise: 'Unlimited' },
              { name: 'Users', starter: '1', pro: '10', enterprise: 'Unlimited' },
            ],
          },
          {
            name: 'Support',
            features: [
              { name: 'Email Support', starter: true, pro: true, enterprise: true },
              { name: 'Priority Support', starter: false, pro: true, enterprise: true },
              { name: '24/7 Phone Support', starter: false, pro: false, enterprise: true },
            ],
          },
          {
            name: 'Advanced Features',
            features: [
              { name: 'API Access', starter: false, pro: true, enterprise: true },
              { name: 'Custom Domain', starter: false, pro: true, enterprise: true },
              { name: 'White Label', starter: false, pro: false, enterprise: true },
              { name: 'SSO/SAML', starter: false, pro: false, enterprise: true },
            ],
          },
        ],
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['pricing', 'comparison', 'detailed', 'table']
  ),

  createSection(
    'Pricing - Simple Single Price',
    'Simple single-price offering',
    'pricing',
    [
      {
        type: 'pricing',
        layout: 'simple',
        heading: 'One Simple Price',
        subheading: 'Everything you need, nothing you don\'t',
        price: '$49',
        period: '/month',
        description: 'All features included. No hidden fees. Cancel anytime.',
        features: [
          'Unlimited projects',
          'Unlimited storage',
          'Priority support',
          'Advanced analytics',
          'Team collaboration',
          'API access',
          'Custom domain',
          'SSL certificate',
        ],
        cta: {
          text: 'Start Free Trial',
          url: '#signup',
          style: 'solid',
          size: 'xl',
        },
        guarantee: {
          text: '30-day money-back guarantee',
          icon: '✓',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'minimal',
    ['pricing', 'simple', 'single', 'straightforward']
  ),

  createSection(
    'Pricing - Enterprise Focus',
    'Enterprise-focused pricing',
    'pricing',
    [
      {
        type: 'pricing',
        layout: 'enterprise',
        heading: 'Enterprise Solutions',
        subheading: 'Custom pricing for large organizations',
        description: 'Get a tailored solution that meets your specific needs with dedicated support and advanced features.',
        features: [
          {
            icon: '🏢',
            title: 'Dedicated Infrastructure',
            description: 'Your own dedicated servers and resources',
          },
          {
            icon: '🔒',
            title: 'Advanced Security',
            description: 'SOC 2, HIPAA, and GDPR compliance',
          },
          {
            icon: '🤝',
            title: 'Dedicated Support',
            description: '24/7 priority support with SLA',
          },
          {
            icon: '⚙️',
            title: 'Custom Integrations',
            description: 'Tailored integrations for your workflow',
          },
        ],
        cta: {
          text: 'Contact Sales',
          url: '#contact',
          style: 'solid',
          size: 'xl',
        },
        contact: {
          phone: '+1 (555) 123-4567',
          email: 'enterprise@example.com',
        },
        spacing: { padding: '120px 24px' },
      },
    ],
    'professional',
    ['pricing', 'enterprise', 'custom', 'b2b']
  ),

  createSection(
    'Pricing - Usage Based',
    'Usage-based pricing model',
    'pricing',
    [
      {
        type: 'pricing',
        layout: 'usage',
        heading: 'Pay As You Grow',
        subheading: 'Only pay for what you use',
        basePrice: {
          amount: '$19',
          period: '/month',
          description: 'Base platform access',
        },
        usage: [
          {
            name: 'API Calls',
            price: '$0.001',
            unit: 'per call',
            included: '10,000 free',
          },
          {
            name: 'Storage',
            price: '$0.10',
            unit: 'per GB',
            included: '10GB free',
          },
          {
            name: 'Team Members',
            price: '$5',
            unit: 'per user',
            included: '3 free',
          },
        ],
        calculator: {
          enabled: true,
          description: 'Estimate your monthly cost',
        },
        cta: {
          text: 'Start Free Trial',
          url: '#signup',
          style: 'solid',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['pricing', 'usage', 'flexible', 'pay-as-you-go']
  ),
];

// ============================================================================
// TESTIMONIAL SECTIONS (5 complete variants)
// ============================================================================
const testimonialSections = [
  createSection(
    'Testimonials - Grid with Ratings',
    'Testimonial grid with star ratings',
    'testimonials',
    [
      {
        type: 'testimonials',
        layout: 'grid',
        columns: 3,
        heading: 'Loved by Thousands',
        subheading: 'See what our customers have to say',
        testimonials: [
          {
            quote: 'This platform has completely transformed how we do business. The ROI was immediate and the support team is outstanding.',
            author: 'Sarah Johnson',
            role: 'CEO',
            company: 'TechStart Inc.',
            avatar: 'https://i.pravatar.cc/150?img=1',
            rating: 5,
          },
          {
            quote: 'Best investment we\'ve made this year. The features are powerful yet easy to use, and the results speak for themselves.',
            author: 'Michael Chen',
            role: 'Marketing Director',
            company: 'Growth Co.',
            avatar: 'https://i.pravatar.cc/150?img=2',
            rating: 5,
          },
          {
            quote: 'Outstanding product with world-class support. Our team productivity has increased by 40% since we started using it.',
            author: 'Emily Rodriguez',
            role: 'Operations Manager',
            company: 'Enterprise Corp',
            avatar: 'https://i.pravatar.cc/150?img=3',
            rating: 5,
          },
        ],
        style: {
          quoteSize: 'lg',
          authorSize: 'base',
          roleSize: 'sm',
          avatarSize: '64px',
          cardStyle: 'elevated',
        },
        stats: {
          averageRating: '4.9',
          totalReviews: '2,500+',
          satisfaction: '98%',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['testimonials', 'grid', 'ratings', 'reviews']
  ),

  createSection(
    'Testimonials - Featured with Logo',
    'Large featured testimonial with company logo',
    'testimonials',
    [
      {
        type: 'testimonials',
        layout: 'featured',
        testimonial: {
          quote: 'Working with this platform has been a game-changer for our business. The level of customization and the ease of use is unmatched. Our conversion rates have increased by 150% and our team couldn\'t be happier.',
          author: 'David Thompson',
          role: 'Founder & CEO',
          company: 'Innovation Labs',
          companyLogo: 'https://via.placeholder.com/150x50',
          avatar: 'https://i.pravatar.cc/200?img=4',
          image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
          rating: 5,
        },
        style: {
          quoteSize: '3xl',
          authorSize: 'xl',
          roleSize: 'lg',
          avatarSize: '120px',
          layout: 'split',
        },
        cta: {
          text: 'Read Full Case Study',
          url: '#case-study',
          style: 'outline',
        },
        spacing: { padding: '120px 24px' },
      },
    ],
    'professional',
    ['testimonials', 'featured', 'case-study', 'enterprise']
  ),

  createSection(
    'Testimonials - Video Testimonials',
    'Video testimonial showcase',
    'testimonials',
    [
      {
        type: 'testimonials',
        layout: 'video',
        heading: 'Hear From Our Customers',
        subheading: 'Real stories from real people',
        testimonials: [
          {
            videoUrl: 'https://www.youtube.com/embed/video1',
            thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
            author: 'Jennifer Martinez',
            role: 'Product Manager',
            company: 'Digital Solutions',
            duration: '2:30',
          },
          {
            videoUrl: 'https://www.youtube.com/embed/video2',
            thumbnail: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
            author: 'Robert Lee',
            role: 'Creative Director',
            company: 'Design Studio',
            duration: '3:15',
          },
        ],
        style: {
          thumbnailHeight: '400px',
          authorSize: 'lg',
          roleSize: 'base',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['testimonials', 'video', 'multimedia', 'stories']
  ),

  createSection(
    'Testimonials - Carousel with Stats',
    'Testimonial carousel with statistics',
    'testimonials',
    [
      {
        type: 'testimonials',
        layout: 'carousel',
        heading: 'Trusted by Industry Leaders',
        stats: [
          { value: '10,000+', label: 'Happy Customers' },
          { value: '4.9/5', label: 'Average Rating' },
          { value: '98%', label: 'Would Recommend' },
        ],
        testimonials: [
          {
            quote: 'The best platform we\'ve ever used. It\'s intuitive, powerful, and the support team is always there when we need them.',
            author: 'Amanda White',
            role: 'VP of Marketing',
            company: 'Growth Inc.',
            avatar: 'https://i.pravatar.cc/150?img=5',
            rating: 5,
          },
          {
            quote: 'Incredible value for money. We\'ve tried many solutions, but this one stands out in terms of features and ease of use.',
            author: 'James Wilson',
            role: 'CTO',
            company: 'Tech Ventures',
            avatar: 'https://i.pravatar.cc/150?img=6',
            rating: 5,
          },
        ],
        style: {
          quoteSize: '2xl',
          authorSize: 'lg',
          roleSize: 'base',
          avatarSize: '96px',
          autoplay: true,
          interval: 6000,
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['testimonials', 'carousel', 'stats', 'social-proof']
  ),

  createSection(
    'Testimonials - Wall of Love',
    'Dense grid of short testimonials',
    'testimonials',
    [
      {
        type: 'testimonials',
        layout: 'wall',
        heading: 'Wall of Love',
        subheading: 'What people are saying on social media',
        testimonials: [
          { quote: 'Game changer! 🚀', author: '@user1', platform: 'twitter' },
          { quote: 'Best tool ever!', author: '@user2', platform: 'twitter' },
          { quote: 'Highly recommend 👍', author: '@user3', platform: 'twitter' },
          { quote: 'Amazing support team', author: '@user4', platform: 'twitter' },
          { quote: 'Worth every penny', author: '@user5', platform: 'twitter' },
          { quote: 'Can\'t live without it', author: '@user6', platform: 'twitter' },
          { quote: 'Exceeded expectations', author: '@user7', platform: 'twitter' },
          { quote: 'Simply the best', author: '@user8', platform: 'twitter' },
          { quote: 'Love it! ❤️', author: '@user9', platform: 'twitter' },
        ],
        style: {
          columns: 3,
          cardStyle: 'minimal',
          quoteSize: 'base',
        },
        spacing: { padding: '80px 24px' },
      },
    ],
    'modern',
    ['testimonials', 'wall', 'social', 'twitter']
  ),
];

// ============================================================================
// TEAM SECTIONS (5 complete variants)
// ============================================================================
const teamSections = [
  createSection(
    'Team - Professional Grid',
    'Professional team grid with bios',
    'team',
    [
      {
        type: 'team',
        layout: 'grid',
        columns: 3,
        heading: 'Meet Our Team',
        subheading: 'The talented people behind our success',
        members: [
          {
            name: 'Sarah Johnson',
            role: 'CEO & Founder',
            image: 'https://i.pravatar.cc/400?img=1',
            bio: 'Visionary leader with 15+ years of experience in technology and business strategy',
            social: { linkedin: '#', twitter: '#', email: 'sarah@example.com' },
          },
          {
            name: 'Michael Chen',
            role: 'CTO',
            image: 'https://i.pravatar.cc/400?img=2',
            bio: 'Tech expert passionate about building scalable solutions and leading engineering teams',
            social: { linkedin: '#', twitter: '#', email: 'michael@example.com' },
          },
          {
            name: 'Emily Rodriguez',
            role: 'Head of Design',
            image: 'https://i.pravatar.cc/400?img=3',
            bio: 'Creative mind behind our beautiful products with a focus on user experience',
            social: { linkedin: '#', twitter: '#', email: 'emily@example.com' },
          },
        ],
        style: {
          imageSize: '280px',
          nameSize: 'xl',
          roleSize: 'base',
          bioSize: 'sm',
          cardStyle: 'elevated',
        },
        cta: {
          text: 'Join Our Team',
          url: '#careers',
          style: 'outline',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'professional',
    ['team', 'grid', 'bios', 'leadership']
  ),

  createSection(
    'Team - Minimal List',
    'Minimal team list layout',
    'team',
    [
      {
        type: 'team',
        layout: 'list',
        heading: 'Leadership Team',
        members: [
          { name: 'David Thompson', role: 'Chief Executive Officer', image: 'https://i.pravatar.cc/200?img=4' },
          { name: 'Jennifer Martinez', role: 'Chief Technology Officer', image: 'https://i.pravatar.cc/200?img=5' },
          { name: 'Robert Lee', role: 'Chief Marketing Officer', image: 'https://i.pravatar.cc/200?img=6' },
          { name: 'Amanda White', role: 'Chief Financial Officer', image: 'https://i.pravatar.cc/200?img=7' },
        ],
        style: {
          imageSize: '120px',
          nameSize: 'lg',
          roleSize: 'base',
          layout: 'horizontal',
        },
        spacing: { padding: '80px 24px' },
      },
    ],
    'minimal',
    ['team', 'list', 'minimal', 'executive']
  ),

  createSection(
    'Team - Cards with Hover',
    'Team cards with hover effects',
    'team',
    [
      {
        type: 'team',
        layout: 'cards',
        columns: 4,
        heading: 'Our Experts',
        members: [
          { name: 'Alex Turner', role: 'Senior Developer', image: 'https://i.pravatar.cc/300?img=8', email: 'alex@example.com' },
          { name: 'Lisa Wang', role: 'Product Manager', image: 'https://i.pravatar.cc/300?img=9', email: 'lisa@example.com' },
          { name: 'Tom Anderson', role: 'UX Designer', image: 'https://i.pravatar.cc/300?img=10', email: 'tom@example.com' },
          { name: 'Amy Taylor', role: 'Marketing Lead', image: 'https://i.pravatar.cc/300?img=11', email: 'amy@example.com' },
        ],
        style: {
          cardStyle: 'elevated',
          imageSize: '220px',
          hoverEffect: 'lift',
        },
        spacing: { padding: '80px 24px' },
      },
    ],
    'modern',
    ['team', 'cards', 'hover', 'grid']
  ),

  createSection(
    'Team - Detailed Profiles',
    'Detailed team member profiles',
    'team',
    [
      {
        type: 'team',
        layout: 'detailed',
        heading: 'Leadership',
        members: [
          {
            name: 'Jennifer Martinez',
            role: 'Chief Executive Officer',
            image: 'https://i.pravatar.cc/500?img=12',
            bio: 'Jennifer brings over 20 years of experience in technology and business leadership. She has successfully scaled multiple startups from seed to IPO and is passionate about innovation and team building.',
            achievements: ['Forbes 30 Under 30', 'Tech Leader of the Year 2025', 'Harvard MBA'],
            social: { linkedin: '#', twitter: '#', email: 'jennifer@example.com' },
          },
        ],
        style: {
          layout: 'split',
          imageSize: '400px',
          bioSize: 'lg',
        },
        spacing: { padding: '120px 24px' },
      },
    ],
    'professional',
    ['team', 'detailed', 'profiles', 'executive']
  ),

  createSection(
    'Team - Carousel',
    'Team member carousel',
    'team',
    [
      {
        type: 'team',
        layout: 'carousel',
        heading: 'Meet the Experts',
        members: [
          {
            name: 'Chris Brown',
            role: 'Senior Architect',
            image: 'https://i.pravatar.cc/400?img=13',
            quote: 'Building the future, one line of code at a time',
          },
          {
            name: 'Maria Garcia',
            role: 'Product Strategist',
            image: 'https://i.pravatar.cc/400?img=14',
            quote: 'Turning ideas into reality through strategic planning',
          },
        ],
        style: {
          imageSize: '320px',
          autoplay: true,
          interval: 5000,
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['team', 'carousel', 'slider', 'quotes']
  ),
];

// ============================================================================
// CONTACT SECTIONS (5 complete variants)
// ============================================================================
const contactSections = [
  createSection(
    'Contact - Form with Map',
    'Contact form with embedded map',
    'contact',
    [
      {
        type: 'contact',
        layout: 'form-map',
        heading: 'Get in Touch',
        subheading: 'We\'d love to hear from you',
        form: {
          fields: [
            { type: 'text', name: 'name', label: 'Full Name', required: true },
            { type: 'email', name: 'email', label: 'Email Address', required: true },
            { type: 'tel', name: 'phone', label: 'Phone Number', required: false },
            { type: 'text', name: 'subject', label: 'Subject', required: true },
            { type: 'textarea', name: 'message', label: 'Message', required: true, rows: 6 },
          ],
          submitText: 'Send Message',
        },
        map: {
          latitude: 40.7128,
          longitude: -74.0060,
          zoom: 14,
          markerTitle: 'Our Office',
        },
        info: {
          address: '123 Business Street, Suite 100\nNew York, NY 10001',
          phone: '+1 (555) 123-4567',
          email: 'hello@example.com',
          hours: 'Monday - Friday: 9am - 6pm EST',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['contact', 'form', 'map', 'location']
  ),

  createSection(
    'Contact - Split Layout',
    'Contact form with info sidebar',
    'contact',
    [
      {
        type: 'contact',
        layout: 'split',
        heading: 'Let\'s Talk',
        subheading: 'Have a project in mind? We\'re here to help.',
        form: {
          fields: [
            { type: 'text', name: 'name', label: 'Name', required: true },
            { type: 'email', name: 'email', label: 'Email', required: true },
            { type: 'text', name: 'company', label: 'Company', required: false },
            { type: 'select', name: 'service', label: 'Service Interested In', options: ['Web Design', 'Marketing', 'Consulting', 'Other'], required: true },
            { type: 'textarea', name: 'message', label: 'Tell us about your project', required: true, rows: 5 },
          ],
          submitText: 'Submit Inquiry',
        },
        sidebar: {
          info: [
            { icon: '📧', title: 'Email', content: 'hello@example.com', link: 'mailto:hello@example.com' },
            { icon: '📞', title: 'Phone', content: '+1 (555) 123-4567', link: 'tel:+15551234567' },
            { icon: '📍', title: 'Office', content: '123 Business St\nNew York, NY 10001', link: '#' },
            { icon: '⏰', title: 'Hours', content: 'Mon-Fri: 9am-6pm EST', link: null },
          ],
          social: [
            { platform: 'linkedin', url: '#' },
            { platform: 'twitter', url: '#' },
            { platform: 'facebook', url: '#' },
          ],
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['contact', 'split', 'sidebar', 'info']
  ),

  createSection(
    'Contact - Info Cards',
    'Contact information in card format',
    'contact',
    [
      {
        type: 'contact',
        layout: 'cards',
        heading: 'Ways to Reach Us',
        subheading: 'Choose the method that works best for you',
        cards: [
          {
            icon: '📧',
            title: 'Email Us',
            content: 'hello@example.com',
            description: 'Send us an email anytime',
            link: 'mailto:hello@example.com',
            linkText: 'Send Email',
          },
          {
            icon: '📞',
            title: 'Call Us',
            content: '+1 (555) 123-4567',
            description: 'Mon-Fri from 9am to 6pm EST',
            link: 'tel:+15551234567',
            linkText: 'Call Now',
          },
          {
            icon: '💬',
            title: 'Live Chat',
            content: 'Available 24/7',
            description: 'Get instant support',
            link: '#chat',
            linkText: 'Start Chat',
          },
        ],
        style: {
          cardStyle: 'elevated',
          iconSize: '64px',
          iconColor: '#3b82f6',
        },
        spacing: { padding: '100px 24px' },
      },
    ],
    'modern',
    ['contact', 'cards', 'methods', 'options']
  ),

  createSection(
    'Contact - Minimal Form',
    'Minimal contact form',
    'contact',
    [
      {
        type: 'contact',
        layout: 'minimal',
        heading: 'Send us a message',
        form: {
          fields: [
            { type: 'email', name: 'email', placeholder: 'Your email address', required: true },
            { type: 'textarea', name: 'message', placeholder: 'Your message', required: true, rows: 5 },
          ],
          submitText: 'Send',
        },
        style: {
          maxWidth: '600px',
          centered: true,
        },
        spacing: { padding: '80px 24px' },
      },
    ],
    'minimal',
    ['contact', 'minimal', 'simple', 'form']
  ),

  createSection(
    'Contact - Full Width CTA',
    'Full-width contact CTA with form',
    'contact',
    [
      {
        type: 'contact',
        layout: 'fullwidth',
        heading: 'Ready to Get Started?',
        subheading: 'Let\'s discuss your project and how we can help',
        background: {
          type: 'gradient',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        form: {
          fields: [
            { type: 'text', name: 'name', placeholder: 'Full Name', required: true },
            { type: 'email', name: 'email', placeholder: 'Email Address', required: true },
            { type: 'tel', name: 'phone', placeholder: 'Phone Number', required: false },
            { type: 'textarea', name: 'message', placeholder: 'Tell us about your project', required: true, rows: 4 },
          ],
          submitText: 'Get Started',
        },
        style: {
          textColor: '#ffffff',
          formBackground: 'rgba(255, 255, 255, 0.1)',
          formTextColor: '#ffffff',
        },
        spacing: { padding: '120px 24px' },
      },
    ],
    'modern',
    ['contact', 'fullwidth', 'cta', 'gradient']
  ),
];

// ============================================================================
// FOOTER SECTIONS (10 complete variants)
// ============================================================================
const footerSections = [
  createSection(
    'Footer - Comprehensive',
    'Comprehensive footer with all elements',
    'footer',
    [
      {
        type: 'footer',
        layout: 'comprehensive',
        logo: { text: 'Your Business', url: '/' },
        tagline: 'Building the future, together',
        description: 'The all-in-one platform for modern businesses',
        columns: [
          {
            title: 'Product',
            links: [
              { label: 'Features', url: '/features' },
              { label: 'Pricing', url: '/pricing' },
              { label: 'Security', url: '/security' },
              { label: 'Roadmap', url: '/roadmap' },
              { label: 'Changelog', url: '/changelog' },
            ],
          },
          {
            title: 'Company',
            links: [
              { label: 'About Us', url: '/about' },
              { label: 'Blog', url: '/blog' },
              { label: 'Careers', url: '/careers' },
              { label: 'Press Kit', url: '/press' },
              { label: 'Contact', url: '/contact' },
            ],
          },
          {
            title: 'Resources',
            links: [
              { label: 'Documentation', url: '/docs' },
              { label: 'Help Center', url: '/help' },
              { label: 'Community', url: '/community' },
              { label: 'API Reference', url: '/api' },
              { label: 'Status', url: '/status' },
            ],
          },
          {
            title: 'Legal',
            links: [
              { label: 'Privacy Policy', url: '/privacy' },
              { label: 'Terms of Service', url: '/terms' },
              { label: 'Cookie Policy', url: '/cookies' },
              { label: 'GDPR', url: '/gdpr' },
            ],
          },
        ],
        newsletter: {
          heading: 'Stay Updated',
          description: 'Get the latest news and updates',
          placeholder: 'Enter your email',
          buttonText: 'Subscribe',
        },
        social: [
          { platform: 'twitter', url: '#' },
          { platform: 'linkedin', url: '#' },
          { platform: 'github', url: '#' },
          { platform: 'facebook', url: '#' },
        ],
        copyright: '© 2026 Your Business. All rights reserved.',
        style: {
          background: '#111827',
          textColor: '#ffffff',
        },
        spacing: { padding: '100px 24px 40px' },
      },
    ],
    'modern',
    ['footer', 'comprehensive', 'complete', 'detailed']
  ),

  createSection(
    'Footer - Minimal',
    'Minimal footer with essentials',
    'footer',
    [
      {
        type: 'footer',
        layout: 'minimal',
        logo: { text: 'Your Business', url: '/' },
        links: [
          { label: 'About', url: '/about' },
          { label: 'Privacy', url: '/privacy' },
          { label: 'Terms', url: '/terms' },
          { label: 'Contact', url: '/contact' },
        ],
        social: [
          { platform: 'twitter', url: '#' },
          { platform: 'linkedin', url: '#' },
        ],
        copyright: '© 2026 Your Business. All rights reserved.',
        style: {
          background: '#1f2937',
          textColor: '#ffffff',
        },
        spacing: { padding: '60px 24px' },
      },
    ],
    'minimal',
    ['footer', 'minimal', 'simple', 'clean']
  ),

  createSection(
    'Footer - Newsletter Focus',
    'Footer with prominent newsletter signup',
    'footer',
    [
      {
        type: 'footer',
        layout: 'newsletter',
        logo: { text: 'Your Business', url: '/' },
        newsletter: {
          heading: 'Subscribe to Our Newsletter',
          description: 'Get weekly updates, tips, and exclusive offers',
          placeholder: 'Enter your email',
          buttonText: 'Subscribe',
          features: [
            { icon: '✓', text: 'Weekly insights' },
            { icon: '✓', text: 'Exclusive content' },
            { icon: '✓', text: 'No spam, ever' },
          ],
        },
        columns: [
          {
            title: 'Quick Links',
            links: [
              { label: 'About', url: '/about' },
              { label: 'Blog', url: '/blog' },
              { label: 'Contact', url: '/contact' },
            ],
          },
        ],
        social: [
          { platform: 'twitter', url: '#' },
          { platform: 'linkedin', url: '#' },
          { platform: 'instagram', url: '#' },
        ],
        copyright: '© 2026 Your Business. All rights reserved.',
        spacing: { padding: '100px 24px 40px' },
      },
    ],
    'modern',
    ['footer', 'newsletter', 'email', 'signup']
  ),

  createSection(
    'Footer - Social Focus',
    'Footer with prominent social media links',
    'footer',
    [
      {
        type: 'footer',
        layout: 'social',
        logo: { text: 'Your Business', url: '/' },
        tagline: 'Connect with us',
        social: [
          { platform: 'twitter', url: '#', followers: '10K' },
          { platform: 'linkedin', url: '#', followers: '5K' },
          { platform: 'instagram', url: '#', followers: '15K' },
          { platform: 'facebook', url: '#', followers: '8K' },
          { platform: 'youtube', url: '#', followers: '12K' },
          { platform: 'github', url: '#', followers: '3K' },
        ],
        columns: [
          {
            title: 'Company',
            links: [
              { label: 'About', url: '/about' },
              { label: 'Blog', url: '/blog' },
              { label: 'Careers', url: '/careers' },
            ],
          },
          {
            title: 'Legal',
            links: [
              { label: 'Privacy', url: '/privacy' },
              { label: 'Terms', url: '/terms' },
            ],
          },
        ],
        copyright: '© 2026 Your Business. All rights reserved.',
        style: {
          background: '#0f172a',
          textColor: '#ffffff',
        },
        spacing: { padding: '80px 24px 40px' },
      },
    ],
    'modern',
    ['footer', 'social', 'community', 'followers']
  ),

  createSection(
    'Footer - App Download',
    'Footer with app download CTAs',
    'footer',
    [
      {
        type: 'footer',
        layout: 'app',
        logo: { text: 'Your Business', url: '/' },
        tagline: 'Get our mobile app',
        description: 'Download our app for the best experience',
        appStores: [
          { platform: 'ios', url: '#', badge: 'Download on the App Store' },
          { platform: 'android', url: '#', badge: 'Get it on Google Play' },
        ],
        columns: [
          {
            title: 'Product',
            links: [
              { label: 'Features', url: '/features' },
              { label: 'Pricing', url: '/pricing' },
              { label: 'Updates', url: '/updates' },
            ],
          },
          {
            title: 'Support',
            links: [
              { label: 'Help Center', url: '/help' },
              { label: 'Contact', url: '/contact' },
              { label: 'FAQ', url: '/faq' },
            ],
          },
        ],
        social: [
          { platform: 'twitter', url: '#' },
          { platform: 'facebook', url: '#' },
          { platform: 'instagram', url: '#' },
        ],
        copyright: '© 2026 Your Business. All rights reserved.',
        style: {
          background: '#1e293b',
          textColor: '#ffffff',
        },
        spacing: { padding: '100px 24px 40px' },
      },
    ],
    'modern',
    ['footer', 'app', 'mobile', 'download']
  ),

  createSection(
    'Footer - Contact Info',
    'Footer with prominent contact information',
    'footer',
    [
      {
        type: 'footer',
        layout: 'contact',
        logo: { text: 'Your Business', url: '/' },
        contact: {
          heading: 'Get in Touch',
          address: {
            street: '123 Business Street',
            city: 'San Francisco, CA 94102',
            country: 'United States',
          },
          phone: '+1 (555) 123-4567',
          email: 'hello@yourbusiness.com',
          hours: 'Mon-Fri: 9AM-6PM PST',
        },
        columns: [
          {
            title: 'Company',
            links: [
              { label: 'About Us', url: '/about' },
              { label: 'Careers', url: '/careers' },
              { label: 'Press', url: '/press' },
            ],
          },
          {
            title: 'Resources',
            links: [
              { label: 'Blog', url: '/blog' },
              { label: 'Help Center', url: '/help' },
              { label: 'Community', url: '/community' },
            ],
          },
        ],
        social: [
          { platform: 'twitter', url: '#' },
          { platform: 'linkedin', url: '#' },
        ],
        copyright: '© 2026 Your Business. All rights reserved.',
        style: {
          background: '#18181b',
          textColor: '#ffffff',
        },
        spacing: { padding: '100px 24px 40px' },
      },
    ],
    'modern',
    ['footer', 'contact', 'address', 'info']
  ),

  createSection(
    'Footer - Multi-Brand',
    'Footer for multi-brand companies',
    'footer',
    [
      {
        type: 'footer',
        layout: 'multibrand',
        logo: { text: 'Parent Company', url: '/' },
        description: 'A family of brands serving millions worldwide',
        brands: [
          { name: 'Brand One', logo: 'B1', url: '#' },
          { name: 'Brand Two', logo: 'B2', url: '#' },
          { name: 'Brand Three', logo: 'B3', url: '#' },
          { name: 'Brand Four', logo: 'B4', url: '#' },
        ],
        columns: [
          {
            title: 'Company',
            links: [
              { label: 'About', url: '/about' },
              { label: 'Investors', url: '/investors' },
              { label: 'Careers', url: '/careers' },
            ],
          },
          {
            title: 'Legal',
            links: [
              { label: 'Privacy', url: '/privacy' },
              { label: 'Terms', url: '/terms' },
              { label: 'Compliance', url: '/compliance' },
            ],
          },
        ],
        social: [
          { platform: 'twitter', url: '#' },
          { platform: 'linkedin', url: '#' },
        ],
        copyright: '© 2026 Parent Company. All rights reserved.',
        style: {
          background: '#09090b',
          textColor: '#ffffff',
        },
        spacing: { padding: '100px 24px 40px' },
      },
    ],
    'modern',
    ['footer', 'multibrand', 'corporate', 'brands']
  ),

  createSection(
    'Footer - Language Selector',
    'Footer with language and region selector',
    'footer',
    [
      {
        type: 'footer',
        layout: 'international',
        logo: { text: 'Your Business', url: '/' },
        tagline: 'Available worldwide',
        languageSelector: {
          current: 'English (US)',
          options: [
            { label: 'English (US)', value: 'en-US' },
            { label: 'English (UK)', value: 'en-GB' },
            { label: 'Español', value: 'es' },
            { label: 'Français', value: 'fr' },
            { label: 'Deutsch', value: 'de' },
            { label: '日本語', value: 'ja' },
          ],
        },
        currencySelector: {
          current: 'USD ($)',
          options: [
            { label: 'USD ($)', value: 'USD' },
            { label: 'EUR (€)', value: 'EUR' },
            { label: 'GBP (£)', value: 'GBP' },
            { label: 'JPY (¥)', value: 'JPY' },
          ],
        },
        columns: [
          {
            title: 'Product',
            links: [
              { label: 'Features', url: '/features' },
              { label: 'Pricing', url: '/pricing' },
            ],
          },
          {
            title: 'Support',
            links: [
              { label: 'Help Center', url: '/help' },
              { label: 'Contact', url: '/contact' },
            ],
          },
        ],
        social: [
          { platform: 'twitter', url: '#' },
          { platform: 'linkedin', url: '#' },
        ],
        copyright: '© 2026 Your Business. All rights reserved.',
        style: {
          background: '#0a0a0a',
          textColor: '#ffffff',
        },
        spacing: { padding: '80px 24px 40px' },
      },
    ],
    'modern',
    ['footer', 'international', 'language', 'global']
  ),

  createSection(
    'Footer - Awards & Certifications',
    'Footer showcasing awards and certifications',
    'footer',
    [
      {
        type: 'footer',
        layout: 'awards',
        logo: { text: 'Your Business', url: '/' },
        tagline: 'Trusted by industry leaders',
        awards: [
          { name: 'Best Product 2026', organization: 'Tech Awards', badge: '🏆' },
          { name: 'ISO 27001 Certified', organization: 'ISO', badge: '✓' },
          { name: 'SOC 2 Type II', organization: 'AICPA', badge: '✓' },
          { name: 'GDPR Compliant', organization: 'EU', badge: '✓' },
        ],
        columns: [
          {
            title: 'Company',
            links: [
              { label: 'About', url: '/about' },
              { label: 'Security', url: '/security' },
              { label: 'Compliance', url: '/compliance' },
            ],
          },
          {
            title: 'Resources',
            links: [
              { label: 'Documentation', url: '/docs' },
              { label: 'API', url: '/api' },
              { label: 'Status', url: '/status' },
            ],
          },
        ],
        social: [
          { platform: 'twitter', url: '#' },
          { platform: 'linkedin', url: '#' },
        ],
        copyright: '© 2026 Your Business. All rights reserved.',
        style: {
          background: '#111827',
          textColor: '#ffffff',
        },
        spacing: { padding: '100px 24px 40px' },
      },
    ],
    'modern',
    ['footer', 'awards', 'certifications', 'trust']
  ),

  createSection(
    'Footer - Centered Simple',
    'Centered minimal footer',
    'footer',
    [
      {
        type: 'footer',
        layout: 'centered',
        logo: { text: 'Your Business', url: '/' },
        tagline: 'Building amazing products',
        links: [
          { label: 'About', url: '/about' },
          { label: 'Blog', url: '/blog' },
          { label: 'Careers', url: '/careers' },
          { label: 'Privacy', url: '/privacy' },
          { label: 'Terms', url: '/terms' },
          { label: 'Contact', url: '/contact' },
        ],
        social: [
          { platform: 'twitter', url: '#' },
          { platform: 'linkedin', url: '#' },
          { platform: 'github', url: '#' },
          { platform: 'instagram', url: '#' },
        ],
        copyright: '© 2026 Your Business. All rights reserved.',
        style: {
          background: '#1f2937',
          textColor: '#ffffff',
          centered: true,
        },
        spacing: { padding: '80px 24px' },
      },
    ],
    'minimal',
    ['footer', 'centered', 'simple', 'minimal']
  ),
];

async function seedSections() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting section seeding...\n');
    
    // Combine all section arrays
    const allSections = [
      ...heroSections,
      ...featureSections,
      ...pricingSections,
      ...testimonialSections,
      ...teamSections,
      ...contactSections,
      ...footerSections,
    ];
    
    let inserted = 0;
    let skipped = 0;
    
    for (const section of allSections) {
      try {
        const result = await client.query(
          `INSERT INTO builder_sections 
           (name, description, category, is_global, blocks, style_variant, tags, thumbnail_url, preview_html, responsive_settings, usage_count, version, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING id`,
          [
            section.name,
            section.description,
            section.category,
            section.is_global,
            JSON.stringify(section.blocks),
            section.style_variant,
            section.tags,
            section.thumbnail_url,
            section.preview_html,
            JSON.stringify(section.responsive_settings),
            section.usage_count,
            section.version,
            section.is_active,
          ]
        );
        
        if (result.rows.length > 0) {
          inserted++;
          console.log(`✓ ${section.name}`);
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`✗ Failed to insert ${section.name}:`, error.message);
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`\n✅ Section seeding complete!`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${allSections.length}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding sections:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedSections()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { seedSections };
