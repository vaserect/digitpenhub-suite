/**
 * Seed Builder Components
 * Creates 100+ production-ready, reusable UI components for the Website Builder
 * 
 * Component Categories:
 * - Hero sections (10 variants)
 * - Feature sections (10 variants)
 * - CTA sections (5 variants)
 * - Testimonial sections (5 variants)
 * - Pricing sections (5 variants)
 * - Team sections (5 variants)
 * - Contact sections (5 variants)
 * - Footer sections (5 variants)
 * - Navigation sections (10 variants)
 * - Stats/Metrics (5 variants)
 * - Logo grids (5 variants)
 * - Gallery sections (5 variants)
 * - Video sections (5 variants)
 * - Form sections (5 variants)
 * - Blog sections (5 variants)
 * - Buttons (5 variants)
 * - Cards (5 variants)
 * - Inputs (5 variants)
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to create component data
function createComponent(name, description, category, componentData, tags = []) {
  return {
    name,
    description,
    category,
    is_global: true,
    component_data: componentData,
    tags,
    thumbnail_url: null,
    preview_html: null,
    variants: [],
    usage_count: 0,
    version: 1,
    is_active: true,
  };
}

// ============================================================================
// HERO COMPONENTS (10 variants)
// ============================================================================
const heroComponents = [
  createComponent(
    'Hero - Modern Gradient',
    'Modern hero with gradient background and centered content',
    'hero',
    {
      type: 'hero',
      layout: 'centered',
      background: {
        type: 'gradient',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      content: {
        heading: 'Build Amazing Websites',
        subheading: 'Create stunning, professional websites in minutes with our powerful no-code platform',
        headingSize: '4xl',
        subheadingSize: 'xl',
        textColor: '#ffffff',
        maxWidth: '800px',
      },
      cta: {
        primary: { text: 'Get Started Free', url: '#', style: 'solid' },
        secondary: { text: 'Watch Demo', url: '#', style: 'outline' },
      },
      spacing: { padding: '120px 24px' },
    },
    ['hero', 'gradient', 'modern', 'centered']
  ),

  createComponent(
    'Hero - Split Layout',
    'Hero with split layout - content on left, image on right',
    'hero',
    {
      type: 'hero',
      layout: 'split',
      background: { type: 'solid', color: '#ffffff' },
      content: {
        heading: 'Transform Your Business',
        subheading: 'Powerful tools to help you grow faster and smarter',
        headingSize: '3xl',
        subheadingSize: 'lg',
        textColor: '#1f2937',
        alignment: 'left',
      },
      image: {
        url: 'https://images.unsplash.com/photo-1551434678-e076c223a692',
        alt: 'Business team collaboration',
        position: 'right',
      },
      cta: {
        primary: { text: 'Start Free Trial', url: '#', style: 'solid' },
      },
      spacing: { padding: '80px 24px' },
    },
    ['hero', 'split', 'image', 'business']
  ),

  createComponent(
    'Hero - Video Background',
    'Full-screen hero with video background',
    'hero',
    {
      type: 'hero',
      layout: 'fullscreen',
      background: {
        type: 'video',
        videoUrl: 'https://example.com/video.mp4',
        overlay: 'rgba(0, 0, 0, 0.5)',
      },
      content: {
        heading: 'Welcome to the Future',
        subheading: 'Experience innovation like never before',
        headingSize: '5xl',
        subheadingSize: '2xl',
        textColor: '#ffffff',
        alignment: 'center',
      },
      cta: {
        primary: { text: 'Explore Now', url: '#', style: 'solid' },
      },
      spacing: { padding: '160px 24px' },
    },
    ['hero', 'video', 'fullscreen', 'dramatic']
  ),

  createComponent(
    'Hero - Minimal Clean',
    'Minimal hero with clean typography and subtle background',
    'hero',
    {
      type: 'hero',
      layout: 'centered',
      background: { type: 'solid', color: '#f9fafb' },
      content: {
        heading: 'Simple. Powerful. Effective.',
        subheading: 'Everything you need, nothing you don\'t',
        headingSize: '3xl',
        subheadingSize: 'lg',
        textColor: '#111827',
        maxWidth: '700px',
      },
      cta: {
        primary: { text: 'Get Started', url: '#', style: 'solid' },
        secondary: { text: 'Learn More', url: '#', style: 'text' },
      },
      spacing: { padding: '100px 24px' },
    },
    ['hero', 'minimal', 'clean', 'simple']
  ),

  createComponent(
    'Hero - Bold Statement',
    'Bold hero with large typography and strong visual impact',
    'hero',
    {
      type: 'hero',
      layout: 'centered',
      background: {
        type: 'gradient',
        gradient: 'linear-gradient(to right, #000000, #434343)',
      },
      content: {
        heading: 'MAKE IT HAPPEN',
        subheading: 'Turn your vision into reality with the tools that matter',
        headingSize: '6xl',
        subheadingSize: 'xl',
        textColor: '#ffffff',
        headingWeight: 'bold',
        letterSpacing: 'tight',
      },
      cta: {
        primary: { text: 'Start Now', url: '#', style: 'solid' },
      },
      spacing: { padding: '140px 24px' },
    },
    ['hero', 'bold', 'statement', 'dramatic']
  ),

  createComponent(
    'Hero - With Form',
    'Hero section with integrated signup form',
    'hero',
    {
      type: 'hero',
      layout: 'centered',
      background: {
        type: 'gradient',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      },
      content: {
        heading: 'Start Your Free Trial',
        subheading: 'No credit card required. Get started in seconds.',
        headingSize: '3xl',
        subheadingSize: 'lg',
        textColor: '#ffffff',
      },
      form: {
        fields: [
          { type: 'email', placeholder: 'Enter your email', required: true },
        ],
        submitText: 'Get Started',
        submitStyle: 'solid',
      },
      spacing: { padding: '100px 24px' },
    },
    ['hero', 'form', 'signup', 'conversion']
  ),

  createComponent(
    'Hero - Left Aligned',
    'Hero with left-aligned content and accent color',
    'hero',
    {
      type: 'hero',
      layout: 'left-aligned',
      background: { type: 'solid', color: '#ffffff' },
      content: {
        heading: 'Grow Your Business Online',
        subheading: 'Join thousands of businesses already using our platform to scale',
        headingSize: '4xl',
        subheadingSize: 'xl',
        textColor: '#1f2937',
        alignment: 'left',
        maxWidth: '600px',
      },
      cta: {
        primary: { text: 'Get Started', url: '#', style: 'solid' },
        secondary: { text: 'View Pricing', url: '#', style: 'outline' },
      },
      accent: {
        type: 'line',
        color: '#3b82f6',
        position: 'left',
      },
      spacing: { padding: '100px 24px' },
    },
    ['hero', 'left-aligned', 'business', 'professional']
  ),

  createComponent(
    'Hero - With Stats',
    'Hero section with integrated statistics',
    'hero',
    {
      type: 'hero',
      layout: 'centered',
      background: { type: 'solid', color: '#f9fafb' },
      content: {
        heading: 'Trusted by Industry Leaders',
        subheading: 'Join the fastest-growing platform in the industry',
        headingSize: '3xl',
        subheadingSize: 'lg',
        textColor: '#111827',
      },
      stats: [
        { value: '10,000+', label: 'Active Users' },
        { value: '50M+', label: 'Transactions' },
        { value: '99.9%', label: 'Uptime' },
        { value: '24/7', label: 'Support' },
      ],
      cta: {
        primary: { text: 'Start Free Trial', url: '#', style: 'solid' },
      },
      spacing: { padding: '100px 24px' },
    },
    ['hero', 'stats', 'social-proof', 'trust']
  ),

  createComponent(
    'Hero - Animated',
    'Hero with animated elements and modern design',
    'hero',
    {
      type: 'hero',
      layout: 'centered',
      background: {
        type: 'gradient',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      content: {
        heading: 'The Future is Here',
        subheading: 'Experience next-generation technology today',
        headingSize: '4xl',
        subheadingSize: 'xl',
        textColor: '#ffffff',
      },
      animation: {
        type: 'fade-in-up',
        duration: '1s',
        delay: '0.2s',
      },
      cta: {
        primary: { text: 'Explore Features', url: '#', style: 'solid' },
      },
      spacing: { padding: '120px 24px' },
    },
    ['hero', 'animated', 'modern', 'tech']
  ),

  createComponent(
    'Hero - E-commerce',
    'Hero optimized for e-commerce with product showcase',
    'hero',
    {
      type: 'hero',
      layout: 'split',
      background: { type: 'solid', color: '#ffffff' },
      content: {
        heading: 'New Collection 2026',
        subheading: 'Discover our latest designs and exclusive offers',
        headingSize: '3xl',
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
        primary: { text: 'Shop Now', url: '#', style: 'solid' },
        secondary: { text: 'View Catalog', url: '#', style: 'outline' },
      },
      badge: {
        text: 'New Arrival',
        color: '#ef4444',
      },
      spacing: { padding: '80px 24px' },
    },
    ['hero', 'ecommerce', 'product', 'shopping']
  ),
];

// ============================================================================
// FEATURE COMPONENTS (10 variants)
// ============================================================================
const featureComponents = [
  createComponent(
    'Features - 3 Column Grid',
    'Three-column feature grid with icons',
    'features',
    {
      type: 'features',
      layout: 'grid',
      columns: 3,
      heading: 'Why Choose Us',
      subheading: 'Everything you need to succeed',
      features: [
        {
          icon: '⚡',
          title: 'Lightning Fast',
          description: 'Optimized for speed and performance',
        },
        {
          icon: '🔒',
          title: 'Secure & Safe',
          description: 'Enterprise-grade security built-in',
        },
        {
          icon: '📈',
          title: 'Scalable',
          description: 'Grows with your business needs',
        },
      ],
      style: {
        iconSize: '48px',
        iconColor: '#3b82f6',
        titleSize: 'xl',
        descriptionSize: 'base',
        spacing: '32px',
      },
      spacing: { padding: '80px 24px' },
    },
    ['features', 'grid', '3-column', 'icons']
  ),

  createComponent(
    'Features - 4 Column Grid',
    'Four-column feature grid for comprehensive showcases',
    'features',
    {
      type: 'features',
      layout: 'grid',
      columns: 4,
      heading: 'Complete Solution',
      subheading: 'All the tools you need in one place',
      features: [
        {
          icon: '🎨',
          title: 'Design',
          description: 'Beautiful templates',
        },
        {
          icon: '⚙️',
          title: 'Customize',
          description: 'Make it yours',
        },
        {
          icon: '🚀',
          title: 'Launch',
          description: 'Go live instantly',
        },
        {
          icon: '📊',
          title: 'Analyze',
          description: 'Track performance',
        },
      ],
      style: {
        iconSize: '40px',
        iconColor: '#8b5cf6',
        titleSize: 'lg',
        descriptionSize: 'sm',
        spacing: '24px',
      },
      spacing: { padding: '80px 24px' },
    },
    ['features', 'grid', '4-column', 'compact']
  ),

  createComponent(
    'Features - List with Icons',
    'Vertical list of features with large icons',
    'features',
    {
      type: 'features',
      layout: 'list',
      heading: 'Powerful Features',
      subheading: 'Built for modern businesses',
      features: [
        {
          icon: '✓',
          title: 'Advanced Analytics',
          description: 'Get deep insights into your business performance with real-time analytics and reporting.',
        },
        {
          icon: '✓',
          title: 'Team Collaboration',
          description: 'Work together seamlessly with built-in collaboration tools and real-time updates.',
        },
        {
          icon: '✓',
          title: 'API Integration',
          description: 'Connect with your favorite tools through our powerful API and webhooks.',
        },
      ],
      style: {
        iconSize: '32px',
        iconColor: '#10b981',
        titleSize: '2xl',
        descriptionSize: 'lg',
        spacing: '48px',
      },
      spacing: { padding: '80px 24px' },
    },
    ['features', 'list', 'detailed', 'vertical']
  ),

  createComponent(
    'Features - Cards with Images',
    'Feature cards with images and descriptions',
    'features',
    {
      type: 'features',
      layout: 'cards',
      columns: 3,
      heading: 'What We Offer',
      features: [
        {
          image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
          title: 'Marketing Tools',
          description: 'Comprehensive marketing suite to grow your audience',
        },
        {
          image: 'https://images.unsplash.com/photo-1551434678-e076c223a692',
          title: 'Team Management',
          description: 'Manage your team efficiently with powerful tools',
        },
        {
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
          title: 'Analytics Dashboard',
          description: 'Track and analyze your business metrics',
        },
      ],
      style: {
        cardStyle: 'elevated',
        imageHeight: '200px',
        titleSize: 'xl',
        descriptionSize: 'base',
      },
      spacing: { padding: '80px 24px' },
    },
    ['features', 'cards', 'images', 'visual']
  ),

  createComponent(
    'Features - Comparison Table',
    'Feature comparison table layout',
    'features',
    {
      type: 'features',
      layout: 'comparison',
      heading: 'Compare Plans',
      features: [
        {
          name: 'Custom Domain',
          basic: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'SSL Certificate',
          basic: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Advanced Analytics',
          basic: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Priority Support',
          basic: false,
          pro: false,
          enterprise: true,
        },
      ],
      style: {
        headerSize: 'lg',
        cellPadding: '16px',
        borderColor: '#e5e7eb',
      },
      spacing: { padding: '80px 24px' },
    },
    ['features', 'comparison', 'table', 'pricing']
  ),

  createComponent(
    'Features - Timeline',
    'Feature timeline showing process or journey',
    'features',
    {
      type: 'features',
      layout: 'timeline',
      heading: 'How It Works',
      subheading: 'Get started in three simple steps',
      features: [
        {
          step: '1',
          title: 'Sign Up',
          description: 'Create your account in seconds',
        },
        {
          step: '2',
          title: 'Customize',
          description: 'Choose your template and make it yours',
        },
        {
          step: '3',
          title: 'Launch',
          description: 'Go live and start growing',
        },
      ],
      style: {
        lineColor: '#3b82f6',
        stepSize: '48px',
        stepColor: '#3b82f6',
        titleSize: 'xl',
        descriptionSize: 'base',
      },
      spacing: { padding: '80px 24px' },
    },
    ['features', 'timeline', 'process', 'steps']
  ),

  createComponent(
    'Features - Process Steps',
    'Horizontal process steps with numbers',
    'features',
    {
      type: 'features',
      layout: 'steps',
      heading: 'Our Process',
      features: [
        {
          number: '01',
          title: 'Discovery',
          description: 'We learn about your needs',
        },
        {
          number: '02',
          title: 'Design',
          description: 'We create the perfect solution',
        },
        {
          number: '03',
          title: 'Develop',
          description: 'We build with precision',
        },
        {
          number: '04',
          title: 'Deliver',
          description: 'We launch your success',
        },
      ],
      style: {
        numberSize: '32px',
        numberColor: '#8b5cf6',
        titleSize: 'lg',
        descriptionSize: 'base',
        connector: true,
      },
      spacing: { padding: '80px 24px' },
    },
    ['features', 'process', 'steps', 'numbered']
  ),

  createComponent(
    'Features - Benefits Grid',
    'Grid showcasing key benefits',
    'features',
    {
      type: 'features',
      layout: 'grid',
      columns: 2,
      heading: 'Key Benefits',
      subheading: 'Why businesses choose us',
      features: [
        {
          icon: '💰',
          title: 'Save Money',
          description: 'Reduce costs by up to 50% with our efficient platform',
        },
        {
          icon: '⏱️',
          title: 'Save Time',
          description: 'Automate tasks and focus on what matters most',
        },
        {
          icon: '📈',
          title: 'Grow Faster',
          description: 'Scale your business with powerful growth tools',
        },
        {
          icon: '🎯',
          title: 'Stay Focused',
          description: 'Keep your team aligned with clear objectives',
        },
      ],
      style: {
        iconSize: '56px',
        titleSize: '2xl',
        descriptionSize: 'lg',
        spacing: '40px',
      },
      spacing: { padding: '80px 24px' },
    },
    ['features', 'benefits', 'grid', 'value']
  ),

  createComponent(
    'Features - Showcase',
    'Large feature showcase with image',
    'features',
    {
      type: 'features',
      layout: 'showcase',
      heading: 'Powerful Dashboard',
      description: 'Get a complete view of your business with our intuitive dashboard. Track metrics, manage teams, and make data-driven decisions all in one place.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
      features: [
        { icon: '✓', text: 'Real-time updates' },
        { icon: '✓', text: 'Customizable widgets' },
        { icon: '✓', text: 'Export reports' },
      ],
      cta: {
        text: 'Try Dashboard',
        url: '#',
        style: 'solid',
      },
      spacing: { padding: '80px 24px' },
    },
    ['features', 'showcase', 'dashboard', 'demo']
  ),

  createComponent(
    'Features - Alternating Layout',
    'Features with alternating image and text layout',
    'features',
    {
      type: 'features',
      layout: 'alternating',
      features: [
        {
          title: 'Advanced Automation',
          description: 'Automate repetitive tasks and workflows to save time and reduce errors.',
          image: 'https://images.unsplash.com/photo-1551434678-e076c223a692',
          imagePosition: 'left',
        },
        {
          title: 'Powerful Integrations',
          description: 'Connect with all your favorite tools and services seamlessly.',
          image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
          imagePosition: 'right',
        },
      ],
      style: {
        titleSize: '2xl',
        descriptionSize: 'lg',
        imageHeight: '400px',
        spacing: '64px',
      },
      spacing: { padding: '80px 24px' },
    },
    ['features', 'alternating', 'detailed', 'visual']
  ),
];

// ============================================================================
// CTA COMPONENTS (5 variants)
// ============================================================================
const ctaComponents = [
  createComponent(
    'CTA - Centered Banner',
    'Centered call-to-action banner',
    'cta',
    {
      type: 'cta',
      layout: 'centered',
      heading: 'Ready to Get Started?',
      subheading: 'Join thousands of satisfied customers today',
      background: {
        type: 'gradient',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      cta: {
        primary: { text: 'Start Free Trial', url: '#', style: 'solid' },
        secondary: { text: 'Contact Sales', url: '#', style: 'outline' },
      },
      style: {
        headingSize: '3xl',
        subheadingSize: 'xl',
        textColor: '#ffffff',
      },
      spacing: { padding: '80px 24px' },
    },
    ['cta', 'centered', 'banner', 'conversion']
  ),

  createComponent(
    'CTA - Split Layout',
    'CTA with split layout and image',
    'cta',
    {
      type: 'cta',
      layout: 'split',
      heading: 'Transform Your Business Today',
      description: 'Get started with our platform and see results in days, not months.',
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692',
      cta: {
        primary: { text: 'Get Started', url: '#', style: 'solid' },
      },
      style: {
        headingSize: '2xl',
        descriptionSize: 'lg',
        textColor: '#1f2937',
      },
      spacing: { padding: '80px 24px' },
    },
    ['cta', 'split', 'image', 'business']
  ),

  createComponent(
    'CTA - Minimal',
    'Minimal CTA with clean design',
    'cta',
    {
      type: 'cta',
      layout: 'minimal',
      heading: 'Start Your Free Trial',
      subheading: 'No credit card required',
      background: { type: 'solid', color: '#f9fafb' },
      cta: {
        primary: { text: 'Sign Up Free', url: '#', style: 'solid' },
      },
      style: {
        headingSize: '2xl',
        subheadingSize: 'base',
        textColor: '#111827',
      },
      spacing: { padding: '60px 24px' },
    },
    ['cta', 'minimal', 'simple', 'signup']
  ),

  createComponent(
    'CTA - With Form',
    'CTA with integrated email capture form',
    'cta',
    {
      type: 'cta',
      layout: 'form',
      heading: 'Get Early Access',
      subheading: 'Be the first to know when we launch',
      background: {
        type: 'gradient',
        gradient: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
      },
      form: {
        fields: [
          { type: 'email', placeholder: 'Enter your email', required: true },
        ],
        submitText: 'Notify Me',
        submitStyle: 'solid',
      },
      style: {
        headingSize: '2xl',
        subheadingSize: 'lg',
        textColor: '#ffffff',
      },
      spacing: { padding: '80px 24px' },
    },
    ['cta', 'form', 'email', 'lead-capture']
  ),

  createComponent(
    'CTA - Urgent',
    'Urgent CTA with countdown or limited offer',
    'cta',
    {
      type: 'cta',
      layout: 'urgent',
      badge: { text: 'Limited Time Offer', color: '#ef4444' },
      heading: 'Save 50% This Week Only',
      subheading: 'Don\'t miss out on this exclusive deal',
      background: { type: 'solid', color: '#1f2937' },
      cta: {
        primary: { text: 'Claim Offer Now', url: '#', style: 'solid' },
      },
      style: {
        headingSize: '3xl',
        subheadingSize: 'xl',
        textColor: '#ffffff',
      },
      spacing: { padding: '80px 24px' },
    },
    ['cta', 'urgent', 'offer', 'limited']
  ),
];

// ============================================================================
// TESTIMONIAL COMPONENTS (5 variants)
// ============================================================================
const testimonialComponents = [
  createComponent(
    'Testimonials - Grid',
    'Testimonial grid with customer quotes',
    'testimonials',
    {
      type: 'testimonials',
      layout: 'grid',
      columns: 3,
      heading: 'What Our Customers Say',
      testimonials: [
        {
          quote: 'This platform has transformed how we do business. Highly recommended!',
          author: 'John Smith',
          role: 'CEO, Tech Corp',
          avatar: 'https://i.pravatar.cc/150?img=1',
          rating: 5,
        },
        {
          quote: 'The best investment we\'ve made this year. ROI was immediate.',
          author: 'Sarah Johnson',
          role: 'Marketing Director',
          avatar: 'https://i.pravatar.cc/150?img=2',
          rating: 5,
        },
        {
          quote: 'Outstanding support and incredible features. Love it!',
          author: 'Mike Davis',
          role: 'Founder, StartupXYZ',
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
      spacing: { padding: '80px 24px' },
    },
    ['testimonials', 'grid', 'reviews', 'social-proof']
  ),

  createComponent(
    'Testimonials - Carousel',
    'Testimonial carousel/slider',
    'testimonials',
    {
      type: 'testimonials',
      layout: 'carousel',
      heading: 'Trusted by Thousands',
      testimonials: [
        {
          quote: 'Game-changing platform that delivered results beyond our expectations.',
          author: 'Emily Chen',
          role: 'VP of Operations',
          company: 'Global Industries',
          avatar: 'https://i.pravatar.cc/150?img=4',
          rating: 5,
        },
        {
          quote: 'Incredible value and exceptional customer service. A true partner.',
          author: 'David Brown',
          role: 'CTO',
          company: 'Innovation Labs',
          avatar: 'https://i.pravatar.cc/150?img=5',
          rating: 5,
        },
      ],
      style: {
        quoteSize: '2xl',
        authorSize: 'lg',
        roleSize: 'base',
        avatarSize: '80px',
        autoplay: true,
        interval: 5000,
      },
      spacing: { padding: '80px 24px' },
    },
    ['testimonials', 'carousel', 'slider', 'featured']
  ),

  createComponent(
    'Testimonials - Featured',
    'Large featured testimonial',
    'testimonials',
    {
      type: 'testimonials',
      layout: 'featured',
      testimonial: {
        quote: 'This is hands down the best solution we\'ve found. It\'s transformed our entire workflow and helped us scale faster than we ever thought possible.',
        author: 'Jennifer Martinez',
        role: 'CEO & Founder',
        company: 'TechStart Inc.',
        avatar: 'https://i.pravatar.cc/150?img=6',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
        rating: 5,
      },
      style: {
        quoteSize: '3xl',
        authorSize: 'xl',
        roleSize: 'lg',
        avatarSize: '96px',
        layout: 'split',
      },
      spacing: { padding: '100px 24px' },
    },
    ['testimonials', 'featured', 'hero', 'large']
  ),

  createComponent(
    'Testimonials - Video',
    'Video testimonials grid',
    'testimonials',
    {
      type: 'testimonials',
      layout: 'video',
      heading: 'See What Our Customers Say',
      testimonials: [
        {
          videoUrl: 'https://example.com/testimonial1.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
          author: 'Alex Thompson',
          role: 'Product Manager',
          company: 'Digital Solutions',
        },
        {
          videoUrl: 'https://example.com/testimonial2.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
          author: 'Lisa Wang',
          role: 'Creative Director',
          company: 'Design Studio',
        },
      ],
      style: {
        thumbnailHeight: '300px',
        authorSize: 'lg',
        roleSize: 'base',
      },
      spacing: { padding: '80px 24px' },
    },
    ['testimonials', 'video', 'multimedia', 'engaging']
  ),

  createComponent(
    'Testimonials - Cards',
    'Testimonial cards with company logos',
    'testimonials',
    {
      type: 'testimonials',
      layout: 'cards',
      columns: 2,
      heading: 'Loved by Industry Leaders',
      testimonials: [
        {
          quote: 'Exceptional platform with world-class support.',
          author: 'Robert Lee',
          role: 'Director of Engineering',
          company: 'Enterprise Corp',
          companyLogo: 'https://via.placeholder.com/120x40',
          rating: 5,
        },
        {
          quote: 'The ROI speaks for itself. Highly recommended.',
          author: 'Amanda White',
          role: 'Head of Marketing',
          company: 'Growth Inc',
          companyLogo: 'https://via.placeholder.com/120x40',
          rating: 5,
        },
      ],
      style: {
        quoteSize: 'lg',
        authorSize: 'base',
        roleSize: 'sm',
        cardStyle: 'bordered',
        logoHeight: '40px',
      },
      spacing: { padding: '80px 24px' },
    },
    ['testimonials', 'cards', 'logos', 'enterprise']
  ),
];

// ============================================================================
// PRICING COMPONENTS (5 variants)
// ============================================================================
const pricingComponents = [
  createComponent(
    'Pricing - 3 Tier',
    'Three-tier pricing table',
    'pricing',
    {
      type: 'pricing',
      layout: '3-tier',
      heading: 'Choose Your Plan',
      subheading: 'Simple, transparent pricing',
      plans: [
        {
          name: 'Starter',
          price: '$29',
          period: '/month',
          description: 'Perfect for individuals',
          features: [
            'Up to 10 projects',
            '5GB storage',
            'Email support',
            'Basic analytics',
          ],
          cta: { text: 'Start Free Trial', url: '#', style: 'outline' },
          highlighted: false,
        },
        {
          name: 'Professional',
          price: '$79',
          period: '/month',
          description: 'For growing teams',
          features: [
            'Unlimited projects',
            '100GB storage',
            'Priority support',
            'Advanced analytics',
            'Team collaboration',
          ],
          cta: { text: 'Get Started', url: '#', style: 'solid' },
          highlighted: true,
          badge: 'Most Popular',
        },
        {
          name: 'Enterprise',
          price: '$199',
          period: '/month',
          description: 'For large organizations',
          features: [
            'Everything in Pro',
            'Unlimited storage',
            '24/7 phone support',
            'Custom integrations',
            'Dedicated account manager',
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
      spacing: { padding: '80px 24px' },
    },
    ['pricing', '3-tier', 'plans', 'subscription']
  ),

  createComponent(
    'Pricing - Comparison Table',
    'Detailed pricing comparison table',
    'pricing',
    {
      type: 'pricing',
      layout: 'comparison',
      heading: 'Compare All Features',
      plans: ['Starter', 'Professional', 'Enterprise'],
      features: [
        { name: 'Projects', starter: '10', pro: 'Unlimited', enterprise: 'Unlimited' },
        { name: 'Storage', starter: '5GB', pro: '100GB', enterprise: 'Unlimited' },
        { name: 'Users', starter: '1', pro: '10', enterprise: 'Unlimited' },
        { name: 'Support', starter: 'Email', pro: 'Priority', enterprise: '24/7 Phone' },
        { name: 'API Access', starter: false, pro: true, enterprise: true },
        { name: 'Custom Domain', starter: false, pro: true, enterprise: true },
        { name: 'White Label', starter: false, pro: false, enterprise: true },
      ],
      spacing: { padding: '80px 24px' },
    },
    ['pricing', 'comparison', 'detailed', 'features']
  ),

  createComponent(
    'Pricing - Toggle Monthly/Yearly',
    'Pricing with monthly/yearly toggle',
    'pricing',
    {
      type: 'pricing',
      layout: 'toggle',
      heading: 'Flexible Pricing',
      subheading: 'Save 20% with annual billing',
      toggle: {
        monthly: 'Monthly',
        yearly: 'Yearly',
        discount: '20% off',
      },
      plans: [
        {
          name: 'Basic',
          monthlyPrice: '$29',
          yearlyPrice: '$279',
          features: ['Feature 1', 'Feature 2', 'Feature 3'],
        },
        {
          name: 'Pro',
          monthlyPrice: '$79',
          yearlyPrice: '$759',
          features: ['All Basic features', 'Feature 4', 'Feature 5'],
          highlighted: true,
        },
      ],
      spacing: { padding: '80px 24px' },
    },
    ['pricing', 'toggle', 'billing', 'flexible']
  ),

  createComponent(
    'Pricing - Enterprise Focus',
    'Enterprise-focused pricing layout',
    'pricing',
    {
      type: 'pricing',
      layout: 'enterprise',
      heading: 'Enterprise Solutions',
      description: 'Custom pricing for large organizations with specific needs',
      features: [
        'Dedicated infrastructure',
        'Custom SLA',
        'Advanced security',
        'Compliance support',
        'Training & onboarding',
      ],
      cta: {
        text: 'Contact Sales',
        url: '#',
        style: 'solid',
      },
      spacing: { padding: '80px 24px' },
    },
    ['pricing', 'enterprise', 'custom', 'b2b']
  ),

  createComponent(
    'Pricing - Simple',
    'Simple single-price layout',
    'pricing',
    {
      type: 'pricing',
      layout: 'simple',
      heading: 'One Simple Price',
      price: '$49',
      period: '/month',
      description: 'Everything you need, nothing you don\'t',
      features: [
        'All features included',
        'Unlimited usage',
        'Priority support',
        'Free updates',
      ],
      cta: {
        text: 'Get Started',
        url: '#',
        style: 'solid',
      },
      spacing: { padding: '80px 24px' },
    },
    ['pricing', 'simple', 'single', 'straightforward']
  ),
];

// ============================================================================
// TEAM COMPONENTS (5 variants)
// ============================================================================
const teamComponents = [
  createComponent(
    'Team - Grid',
    'Team member grid with photos',
    'team',
    {
      type: 'team',
      layout: 'grid',
      columns: 3,
      heading: 'Meet Our Team',
      subheading: 'The people behind our success',
      members: [
        {
          name: 'John Doe',
          role: 'CEO & Founder',
          image: 'https://i.pravatar.cc/300?img=1',
          bio: 'Visionary leader with 15 years of experience',
          social: {
            linkedin: '#',
            twitter: '#',
          },
        },
        {
          name: 'Jane Smith',
          role: 'CTO',
          image: 'https://i.pravatar.cc/300?img=2',
          bio: 'Tech expert passionate about innovation',
          social: {
            linkedin: '#',
            twitter: '#',
          },
        },
        {
          name: 'Mike Johnson',
          role: 'Head of Design',
          image: 'https://i.pravatar.cc/300?img=3',
          bio: 'Creative mind behind our beautiful products',
          social: {
            linkedin: '#',
            twitter: '#',
          },
        },
      ],
      style: {
        imageSize: '200px',
        nameSize: 'xl',
        roleSize: 'base',
        bioSize: 'sm',
      },
      spacing: { padding: '80px 24px' },
    },
    ['team', 'grid', 'members', 'about']
  ),

  createComponent(
    'Team - Cards',
    'Team member cards with hover effects',
    'team',
    {
      type: 'team',
      layout: 'cards',
      columns: 4,
      heading: 'Our Leadership',
      members: [
        {
          name: 'Sarah Williams',
          role: 'VP of Sales',
          image: 'https://i.pravatar.cc/300?img=4',
          email: 'sarah@example.com',
        },
        {
          name: 'David Brown',
          role: 'VP of Marketing',
          image: 'https://i.pravatar.cc/300?img=5',
          email: 'david@example.com',
        },
      ],
      style: {
        cardStyle: 'elevated',
        imageSize: '180px',
        hoverEffect: 'lift',
      },
      spacing: { padding: '80px 24px' },
    },
    ['team', 'cards', 'leadership', 'hover']
  ),

  createComponent(
    'Team - Carousel',
    'Team member carousel/slider',
    'team',
    {
      type: 'team',
      layout: 'carousel',
      heading: 'Meet the Experts',
      members: [
        {
          name: 'Emily Chen',
          role: 'Senior Developer',
          image: 'https://i.pravatar.cc/300?img=6',
          quote: 'Building the future, one line of code at a time',
        },
        {
          name: 'Alex Martinez',
          role: 'Product Manager',
          image: 'https://i.pravatar.cc/300?img=7',
          quote: 'Turning ideas into reality',
        },
      ],
      style: {
        imageSize: '250px',
        autoplay: true,
        interval: 5000,
      },
      spacing: { padding: '80px 24px' },
    },
    ['team', 'carousel', 'slider', 'featured']
  ),

  createComponent(
    'Team - Minimal',
    'Minimal team layout with names and roles',
    'team',
    {
      type: 'team',
      layout: 'minimal',
      heading: 'The Team',
      members: [
        { name: 'Robert Lee', role: 'Engineer' },
        { name: 'Lisa Wang', role: 'Designer' },
        { name: 'Tom Anderson', role: 'Marketer' },
        { name: 'Amy Taylor', role: 'Support' },
      ],
      style: {
        nameSize: 'lg',
        roleSize: 'base',
        layout: 'list',
      },
      spacing: { padding: '60px 24px' },
    },
    ['team', 'minimal', 'simple', 'list']
  ),

  createComponent(
    'Team - Detailed',
    'Detailed team profiles with full bios',
    'team',
    {
      type: 'team',
      layout: 'detailed',
      heading: 'Leadership Team',
      members: [
        {
          name: 'Jennifer Martinez',
          role: 'Chief Executive Officer',
          image: 'https://i.pravatar.cc/300?img=8',
          bio: 'Jennifer brings over 20 years of experience in technology and business leadership. She has successfully scaled multiple startups and is passionate about innovation.',
          achievements: [
            'Forbes 30 Under 30',
            'Tech Leader of the Year 2025',
          ],
          social: {
            linkedin: '#',
            twitter: '#',
            email: 'jennifer@example.com',
          },
        },
      ],
      style: {
        layout: 'split',
        imageSize: '300px',
        bioSize: 'lg',
      },
      spacing: { padding: '100px 24px' },
    },
    ['team', 'detailed', 'profiles', 'leadership']
  ),
];

// ============================================================================
// CONTACT COMPONENTS (5 variants)
// ============================================================================
const contactComponents = [
  createComponent(
    'Contact - Form + Map',
    'Contact form with embedded map',
    'contact',
    {
      type: 'contact',
      layout: 'form-map',
      heading: 'Get in Touch',
      subheading: 'We\'d love to hear from you',
      form: {
        fields: [
          { type: 'text', name: 'name', label: 'Name', required: true },
          { type: 'email', name: 'email', label: 'Email', required: true },
          { type: 'text', name: 'subject', label: 'Subject', required: true },
          { type: 'textarea', name: 'message', label: 'Message', required: true, rows: 5 },
        ],
        submitText: 'Send Message',
      },
      map: {
        latitude: 40.7128,
        longitude: -74.0060,
        zoom: 12,
      },
      spacing: { padding: '80px 24px' },
    },
    ['contact', 'form', 'map', 'location']
  ),

  createComponent(
    'Contact - Split Layout',
    'Contact form with info sidebar',
    'contact',
    {
      type: 'contact',
      layout: 'split',
      heading: 'Contact Us',
      form: {
        fields: [
          { type: 'text', name: 'name', label: 'Name', required: true },
          { type: 'email', name: 'email', label: 'Email', required: true },
          { type: 'textarea', name: 'message', label: 'Message', required: true },
        ],
        submitText: 'Submit',
      },
      info: {
        address: '123 Business St, Suite 100\nNew York, NY 10001',
        phone: '+1 (555) 123-4567',
        email: 'hello@example.com',
        hours: 'Mon-Fri: 9am-6pm EST',
      },
      spacing: { padding: '80px 24px' },
    },
    ['contact', 'split', 'info', 'sidebar']
  ),

  createComponent(
    'Contact - Info Cards',
    'Contact information in card format',
    'contact',
    {
      type: 'contact',
      layout: 'cards',
      heading: 'Ways to Reach Us',
      cards: [
        {
          icon: '📧',
          title: 'Email',
          content: 'hello@example.com',
          link: 'mailto:hello@example.com',
        },
        {
          icon: '📞',
          title: 'Phone',
          content: '+1 (555) 123-4567',
          link: 'tel:+15551234567',
        },
        {
          icon: '📍',
          title: 'Office',
          content: '123 Business St\nNew York, NY',
          link: '#',
        },
      ],
      spacing: { padding: '80px 24px' },
    },
    ['contact', 'cards', 'info', 'methods']
  ),

  createComponent(
    'Contact - Minimal',
    'Minimal contact form',
    'contact',
    {
      type: 'contact',
      layout: 'minimal',
      heading: 'Send us a message',
      form: {
        fields: [
          { type: 'email', name: 'email', placeholder: 'Your email', required: true },
          { type: 'textarea', name: 'message', placeholder: 'Your message', required: true, rows: 4 },
        ],
        submitText: 'Send',
      },
      spacing: { padding: '60px 24px' },
    },
    ['contact', 'minimal', 'simple', 'form']
  ),

  createComponent(
    'Contact - Full Width',
    'Full-width contact section with background',
    'contact',
    {
      type: 'contact',
      layout: 'fullwidth',
      heading: 'Let\'s Talk',
      subheading: 'Have a project in mind? We\'d love to help.',
      background: {
        type: 'gradient',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      form: {
        fields: [
          { type: 'text', name: 'name', placeholder: 'Name', required: true },
          { type: 'email', name: 'email', placeholder: 'Email', required: true },
          { type: 'text', name: 'company', placeholder: 'Company' },
          { type: 'textarea', name: 'message', placeholder: 'Tell us about your project', required: true },
        ],
        submitText: 'Get Started',
      },
      style: {
        textColor: '#ffffff',
        formBackground: 'rgba(255, 255, 255, 0.1)',
      },
      spacing: { padding: '100px 24px' },
    },
    ['contact', 'fullwidth', 'gradient', 'prominent']
  ),
];

// ============================================================================
// FOOTER COMPONENTS (5 variants)
// ============================================================================
const footerComponents = [
  createComponent(
    'Footer - Minimal',
    'Minimal footer with copyright',
    'footer',
    {
      type: 'footer',
      layout: 'minimal',
      logo: 'Your Business',
      copyright: '© 2026 Your Business. All rights reserved.',
      links: [
        { label: 'Privacy', url: '/privacy' },
        { label: 'Terms', url: '/terms' },
        { label: 'Contact', url: '/contact' },
      ],
      style: {
        background: '#1f2937',
        textColor: '#ffffff',
      },
      spacing: { padding: '40px 24px' },
    },
    ['footer', 'minimal', 'simple', 'copyright']
  ),

  createComponent(
    'Footer - Detailed',
    'Detailed footer with multiple columns',
    'footer',
    {
      type: 'footer',
      layout: 'detailed',
      logo: 'Your Business',
      tagline: 'Building the future, together',
      columns: [
        {
          title: 'Product',
          links: [
            { label: 'Features', url: '/features' },
            { label: 'Pricing', url: '/pricing' },
            { label: 'Security', url: '/security' },
            { label: 'Roadmap', url: '/roadmap' },
          ],
        },
        {
          title: 'Company',
          links: [
            { label: 'About', url: '/about' },
            { label: 'Blog', url: '/blog' },
            { label: 'Careers', url: '/careers' },
            { label: 'Press', url: '/press' },
          ],
        },
        {
          title: 'Resources',
          links: [
            { label: 'Documentation', url: '/docs' },
            { label: 'Help Center', url: '/help' },
            { label: 'Community', url: '/community' },
            { label: 'Contact', url: '/contact' },
          ],
        },
      ],
      social: [
        { platform: 'twitter', url: '#' },
        { platform: 'linkedin', url: '#' },
        { platform: 'github', url: '#' },
      ],
      copyright: '© 2026 Your Business. All rights reserved.',
      style: {
        background: '#111827',
        textColor: '#ffffff',
      },
      spacing: { padding: '80px 24px 40px' },
    },
    ['footer', 'detailed', 'columns', 'comprehensive']
  ),

  createComponent(
    'Footer - Mega',
    'Mega footer with extensive links',
    'footer',
    {
      type: 'footer',
      layout: 'mega',
      logo: 'Your Business',
      description: 'The all-in-one platform for modern businesses',
      columns: [
        {
          title: 'Solutions',
          links: [
            { label: 'Marketing', url: '#' },
            { label: 'Sales', url: '#' },
            { label: 'Service', url: '#' },
            { label: 'Operations', url: '#' },
          ],
        },
        {
          title: 'Industries',
          links: [
            { label: 'Technology', url: '#' },
            { label: 'Healthcare', url: '#' },
            { label: 'Finance', url: '#' },
            { label: 'Retail', url: '#' },
          ],
        },
        {
          title: 'Resources',
          links: [
            { label: 'Blog', url: '#' },
            { label: 'Guides', url: '#' },
            { label: 'Webinars', url: '#' },
            { label: 'Templates', url: '#' },
          ],
        },
        {
          title: 'Company',
          links: [
            { label: 'About', url: '#' },
            { label: 'Careers', url: '#' },
            { label: 'Partners', url: '#' },
            { label: 'Press', url: '#' },
          ],
        },
      ],
      social: [
        { platform: 'twitter', url: '#' },
        { platform: 'linkedin', url: '#' },
        { platform: 'facebook', url: '#' },
        { platform: 'instagram', url: '#' },
      ],
      legal: [
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Terms of Service', url: '/terms' },
        { label: 'Cookie Policy', url: '/cookies' },
      ],
      copyright: '© 2026 Your Business. All rights reserved.',
      spacing: { padding: '100px 24px 40px' },
    },
    ['footer', 'mega', 'extensive', 'enterprise']
  ),

  createComponent(
    'Footer - Newsletter',
    'Footer with newsletter signup',
    'footer',
    {
      type: 'footer',
      layout: 'newsletter',
      logo: 'Your Business',
      newsletter: {
        heading: 'Stay Updated',
        description: 'Get the latest news and updates',
        placeholder: 'Enter your email',
        buttonText: 'Subscribe',
      },
      links: [
        { label: 'About', url: '/about' },
        { label: 'Blog', url: '/blog' },
        { label: 'Contact', url: '/contact' },
        { label: 'Privacy', url: '/privacy' },
      ],
      social: [
        { platform: 'twitter', url: '#' },
        { platform: 'linkedin', url: '#' },
      ],
      copyright: '© 2026 Your Business. All rights reserved.',
      spacing: { padding: '80px 24px 40px' },
    },
    ['footer', 'newsletter', 'signup', 'email']
  ),

  createComponent(
    'Footer - Social Focused',
    'Footer emphasizing social media',
    'footer',
    {
      type: 'footer',
      layout: 'social',
      logo: 'Your Business',
      tagline: 'Follow us for updates',
      social: [
        { platform: 'twitter', url: '#', followers: '10K' },
        { platform: 'linkedin', url: '#', followers: '5K' },
        { platform: 'instagram', url: '#', followers: '15K' },
        { platform: 'youtube', url: '#', followers: '8K' },
      ],
      links: [
        { label: 'Privacy', url: '/privacy' },
        { label: 'Terms', url: '/terms' },
      ],
      copyright: '© 2026 Your Business. All rights reserved.',
      spacing: { padding: '60px 24px 40px' },
    },
    ['footer', 'social', 'community', 'followers']
  ),
];

// ============================================================================
// NAVIGATION COMPONENTS (10 variants)
// ============================================================================
const navigationComponents = [
  createComponent(
    'Navigation - Standard',
    'Standard horizontal navigation bar',
    'navigation',
    {
      type: 'navigation',
      layout: 'horizontal',
      logo: { text: 'Your Business', url: '/' },
      links: [
        { label: 'Features', url: '#features' },
        { label: 'Pricing', url: '#pricing' },
        { label: 'About', url: '#about' },
        { label: 'Contact', url: '#contact' },
      ],
      cta: { text: 'Get Started', url: '#signup', style: 'solid' },
      style: {
        background: '#ffffff',
        textColor: '#1f2937',
        sticky: true,
      },
      spacing: { padding: '16px 24px' },
    },
    ['navigation', 'header', 'menu', 'standard']
  ),

  createComponent(
    'Navigation - Transparent',
    'Transparent navigation for hero sections',
    'navigation',
    {
      type: 'navigation',
      layout: 'transparent',
      logo: { text: 'Your Business', url: '/', color: '#ffffff' },
      links: [
        { label: 'Home', url: '/' },
        { label: 'Services', url: '#services' },
        { label: 'Portfolio', url: '#portfolio' },
        { label: 'Contact', url: '#contact' },
      ],
      cta: { text: 'Get Started', url: '#', style: 'outline' },
      style: {
        background: 'transparent',
        textColor: '#ffffff',
        sticky: false,
      },
      spacing: { padding: '24px' },
    },
    ['navigation', 'transparent', 'overlay', 'hero']
  ),

  createComponent(
    'Navigation - Centered',
    'Centered logo with split navigation',
    'navigation',
    {
      type: 'navigation',
      layout: 'centered',
      logo: { text: 'Your Business', url: '/' },
      leftLinks: [
        { label: 'Features', url: '#features' },
        { label: 'Pricing', url: '#pricing' },
      ],
      rightLinks: [
        { label: 'About', url: '#about' },
        { label: 'Contact', url: '#contact' },
      ],
      style: {
        background: '#ffffff',
        textColor: '#1f2937',
      },
      spacing: { padding: '20px 24px' },
    },
    ['navigation', 'centered', 'split', 'balanced']
  ),

  createComponent(
    'Navigation - Mega Menu',
    'Navigation with dropdown mega menu',
    'navigation',
    {
      type: 'navigation',
      layout: 'mega',
      logo: { text: 'Your Business', url: '/' },
      links: [
        {
          label: 'Products',
          megaMenu: {
            columns: [
              {
                title: 'By Use Case',
                links: [
                  { label: 'Marketing', url: '#' },
                  { label: 'Sales', url: '#' },
                  { label: 'Service', url: '#' },
                ],
              },
              {
                title: 'By Industry',
                links: [
                  { label: 'Technology', url: '#' },
                  { label: 'Healthcare', url: '#' },
                  { label: 'Finance', url: '#' },
                ],
              },
            ],
          },
        },
        { label: 'Pricing', url: '#pricing' },
        { label: 'Resources', url: '#resources' },
      ],
      cta: { text: 'Sign Up', url: '#', style: 'solid' },
      spacing: { padding: '16px 24px' },
    },
    ['navigation', 'mega-menu', 'dropdown', 'enterprise']
  ),

  createComponent(
    'Navigation - Minimal',
    'Minimal navigation with text links only',
    'navigation',
    {
      type: 'navigation',
      layout: 'minimal',
      logo: { text: 'YB', url: '/' },
      links: [
        { label: 'Work', url: '#work' },
        { label: 'About', url: '#about' },
        { label: 'Contact', url: '#contact' },
      ],
      style: {
        background: 'transparent',
        textColor: '#1f2937',
        fontSize: 'sm',
      },
      spacing: { padding: '20px 24px' },
    },
    ['navigation', 'minimal', 'simple', 'clean']
  ),

  createComponent(
    'Navigation - Sidebar',
    'Vertical sidebar navigation',
    'navigation',
    {
      type: 'navigation',
      layout: 'sidebar',
      logo: { text: 'Your Business', url: '/' },
      links: [
        { label: 'Dashboard', url: '#', icon: '📊' },
        { label: 'Projects', url: '#', icon: '📁' },
        { label: 'Team', url: '#', icon: '👥' },
        { label: 'Settings', url: '#', icon: '⚙️' },
      ],
      style: {
        background: '#1f2937',
        textColor: '#ffffff',
        width: '240px',
      },
      spacing: { padding: '24px 16px' },
    },
    ['navigation', 'sidebar', 'vertical', 'app']
  ),

  createComponent(
    'Navigation - Mobile Optimized',
    'Mobile-first hamburger navigation',
    'navigation',
    {
      type: 'navigation',
      layout: 'mobile',
      logo: { text: 'Your Business', url: '/' },
      links: [
        { label: 'Home', url: '/' },
        { label: 'Features', url: '#features' },
        { label: 'Pricing', url: '#pricing' },
        { label: 'About', url: '#about' },
        { label: 'Contact', url: '#contact' },
      ],
      cta: { text: 'Sign Up', url: '#', style: 'solid' },
      hamburger: {
        position: 'right',
        animation: 'slide',
      },
      spacing: { padding: '16px 24px' },
    },
    ['navigation', 'mobile', 'hamburger', 'responsive']
  ),

  createComponent(
    'Navigation - With Search',
    'Navigation with integrated search',
    'navigation',
    {
      type: 'navigation',
      layout: 'search',
      logo: { text: 'Your Business', url: '/' },
      links: [
        { label: 'Products', url: '#products' },
        { label: 'Solutions', url: '#solutions' },
        { label: 'Resources', url: '#resources' },
      ],
      search: {
        placeholder: 'Search...',
        position: 'center',
      },
      cta: { text: 'Sign In', url: '#', style: 'text' },
      spacing: { padding: '16px 24px' },
    },
    ['navigation', 'search', 'searchbar', 'utility']
  ),

  createComponent(
    'Navigation - E-commerce',
    'E-commerce navigation with cart',
    'navigation',
    {
      type: 'navigation',
      layout: 'ecommerce',
      logo: { text: 'Store', url: '/' },
      links: [
        { label: 'Shop', url: '/shop' },
        { label: 'Collections', url: '/collections' },
        { label: 'About', url: '/about' },
      ],
      utilities: [
        { icon: '🔍', label: 'Search', url: '#search' },
        { icon: '👤', label: 'Account', url: '#account' },
        { icon: '🛒', label: 'Cart', url: '#cart', badge: '3' },
      ],
      spacing: { padding: '16px 24px' },
    },
    ['navigation', 'ecommerce', 'shop', 'cart']
  ),

  createComponent(
    'Navigation - Multi-level',
    'Navigation with nested dropdowns',
    'navigation',
    {
      type: 'navigation',
      layout: 'multilevel',
      logo: { text: 'Your Business', url: '/' },
      links: [
        {
          label: 'Products',
          submenu: [
            { label: 'Product A', url: '#' },
            { label: 'Product B', url: '#' },
            {
              label: 'More Products',
              submenu: [
                { label: 'Product C', url: '#' },
                { label: 'Product D', url: '#' },
              ],
            },
          ],
        },
        { label: 'Pricing', url: '#pricing' },
        { label: 'Contact', url: '#contact' },
      ],
      cta: { text: 'Get Started', url: '#', style: 'solid' },
      spacing: { padding: '16px 24px' },
    },
    ['navigation', 'multilevel', 'nested', 'dropdown']
  ),
];

// ============================================================================
// STATS COMPONENTS (5 variants)
// ============================================================================
const statsComponents = [
  createComponent(
    'Stats - 4 Column',
    'Four-column statistics display',
    'stats',
    {
      type: 'stats',
      layout: 'grid',
      columns: 4,
      heading: 'Our Impact',
      stats: [
        { value: '10,000+', label: 'Active Users', icon: '👥' },
        { value: '$50M+', label: 'Revenue Generated', icon: '💰' },
        { value: '99.9%', label: 'Uptime', icon: '⚡' },
        { value: '24/7', label: 'Support', icon: '🎧' },
      ],
      style: {
        valueSize: '4xl',
        labelSize: 'base',
        valueColor: '#3b82f6',
      },
      spacing: { padding: '80px 24px' },
    },
    ['stats', 'metrics', 'numbers', 'grid']
  ),

  createComponent(
    'Stats - Centered',
    'Centered statistics with background',
    'stats',
    {
      type: 'stats',
      layout: 'centered',
      background: {
        type: 'gradient',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      stats: [
        { value: '500K+', label: 'Downloads' },
        { value: '150+', label: 'Countries' },
        { value: '4.9/5', label: 'Rating' },
      ],
      style: {
        valueSize: '5xl',
        labelSize: 'lg',
        textColor: '#ffffff',
      },
      spacing: { padding: '100px 24px' },
    },
    ['stats', 'centered', 'gradient', 'prominent']
  ),

  createComponent(
    'Stats - Minimal',
    'Minimal statistics layout',
    'stats',
    {
      type: 'stats',
      layout: 'minimal',
      stats: [
        { value: '1M+', label: 'Users' },
        { value: '50K+', label: 'Companies' },
        { value: '100+', label: 'Countries' },
      ],
      style: {
        valueSize: '3xl',
        labelSize: 'sm',
        valueColor: '#1f2937',
        separator: true,
      },
      spacing: { padding: '60px 24px' },
    },
    ['stats', 'minimal', 'simple', 'inline']
  ),

  createComponent(
    'Stats - With Icons',
    'Statistics with large icons',
    'stats',
    {
      type: 'stats',
      layout: 'icons',
      heading: 'By the Numbers',
      stats: [
        { value: '98%', label: 'Customer Satisfaction', icon: '😊', iconSize: '48px' },
        { value: '2.5M', label: 'Transactions', icon: '💳', iconSize: '48px' },
        { value: '24h', label: 'Average Response', icon: '⏱️', iconSize: '48px' },
      ],
      style: {
        valueSize: '3xl',
        labelSize: 'base',
        iconColor: '#8b5cf6',
      },
      spacing: { padding: '80px 24px' },
    },
    ['stats', 'icons', 'visual', 'engaging']
  ),

  createComponent(
    'Stats - Animated Counter',
    'Statistics with animated counters',
    'stats',
    {
      type: 'stats',
      layout: 'animated',
      stats: [
        { value: '15000', label: 'Projects Completed', suffix: '+', duration: 2000 },
        { value: '98', label: 'Success Rate', suffix: '%', duration: 2000 },
        { value: '250', label: 'Team Members', suffix: '+', duration: 2000 },
      ],
      style: {
        valueSize: '4xl',
        labelSize: 'lg',
        valueColor: '#10b981',
        animation: 'count-up',
      },
      spacing: { padding: '80px 24px' },
    },
    ['stats', 'animated', 'counter', 'dynamic']
  ),
];

// ============================================================================
// LOGO COMPONENTS (5 variants)
// ============================================================================
const logoComponents = [
  createComponent(
    'Logo Grid - Standard',
    'Standard logo grid layout',
    'logos',
    {
      type: 'logos',
      layout: 'grid',
      heading: 'Trusted by Leading Companies',
      logos: [
        { name: 'Company 1', url: 'https://via.placeholder.com/120x40', link: '#' },
        { name: 'Company 2', url: 'https://via.placeholder.com/120x40', link: '#' },
        { name: 'Company 3', url: 'https://via.placeholder.com/120x40', link: '#' },
        { name: 'Company 4', url: 'https://via.placeholder.com/120x40', link: '#' },
        { name: 'Company 5', url: 'https://via.placeholder.com/120x40', link: '#' },
        { name: 'Company 6', url: 'https://via.placeholder.com/120x40', link: '#' },
      ],
      style: {
        logoHeight: '40px',
        grayscale: true,
        hoverEffect: 'color',
      },
      spacing: { padding: '60px 24px' },
    },
    ['logos', 'grid', 'clients', 'trust']
  ),

  createComponent(
    'Logo Carousel',
    'Scrolling logo carousel',
    'logos',
    {
      type: 'logos',
      layout: 'carousel',
      heading: 'Our Partners',
      logos: [
        { name: 'Partner 1', url: 'https://via.placeholder.com/120x40' },
        { name: 'Partner 2', url: 'https://via.placeholder.com/120x40' },
        { name: 'Partner 3', url: 'https://via.placeholder.com/120x40' },
        { name: 'Partner 4', url: 'https://via.placeholder.com/120x40' },
      ],
      style: {
        logoHeight: '40px',
        autoplay: true,
        speed: 'slow',
      },
      spacing: { padding: '60px 24px' },
    },
    ['logos', 'carousel', 'slider', 'animated']
  ),

  createComponent(
    'Logo Cloud - Minimal',
    'Minimal logo cloud',
    'logos',
    {
      type: 'logos',
      layout: 'cloud',
      subheading: 'Trusted by 1000+ companies worldwide',
      logos: [
        { name: 'Brand 1', url: 'https://via.placeholder.com/100x30' },
        { name: 'Brand 2', url: 'https://via.placeholder.com/100x30' },
        { name: 'Brand 3', url: 'https://via.placeholder.com/100x30' },
        { name: 'Brand 4', url: 'https://via.placeholder.com/100x30' },
      ],
      style: {
        logoHeight: '30px',
        opacity: 0.6,
        hoverOpacity: 1,
      },
      spacing: { padding: '40px 24px' },
    },
    ['logos', 'cloud', 'minimal', 'subtle']
  ),

  createComponent(
    'Logo Showcase',
    'Featured logo showcase with descriptions',
    'logos',
    {
      type: 'logos',
      layout: 'showcase',
      heading: 'Featured Clients',
      logos: [
        {
          name: 'Enterprise Corp',
          url: 'https://via.placeholder.com/150x50',
          description: 'Leading technology company',
          link: '#',
        },
        {
          name: 'Global Industries',
          url: 'https://via.placeholder.com/150x50',
          description: 'Fortune 500 manufacturer',
          link: '#',
        },
      ],
      style: {
        logoHeight: '50px',
        showDescription: true,
      },
      spacing: { padding: '80px 24px' },
    },
    ['logos', 'showcase', 'featured', 'detailed']
  ),

  createComponent(
    'Logo Wall',
    'Dense logo wall layout',
    'logos',
    {
      type: 'logos',
      layout: 'wall',
      heading: 'Join 10,000+ Companies',
      logos: Array(12).fill(null).map((_, i) => ({
        name: `Company ${i + 1}`,
        url: 'https://via.placeholder.com/100x30',
      })),
      style: {
        logoHeight: '30px',
        columns: 6,
        grayscale: true,
      },
      spacing: { padding: '60px 24px' },
    },
    ['logos', 'wall', 'dense', 'many']
  ),
];

// ============================================================================
// GALLERY COMPONENTS (5 variants)
// ============================================================================
const galleryComponents = [
  createComponent(
    'Gallery - Grid',
    'Standard image gallery grid',
    'gallery',
    {
      type: 'gallery',
      layout: 'grid',
      columns: 3,
      heading: 'Our Work',
      images: [
        { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', alt: 'Project 1', caption: 'Modern Design' },
        { url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead', alt: 'Project 2', caption: 'Creative Solution' },
        { url: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d', alt: 'Project 3', caption: 'Innovation' },
      ],
      style: {
        aspectRatio: '1:1',
        gap: '16px',
        hoverEffect: 'zoom',
      },
      spacing: { padding: '80px 24px' },
    },
    ['gallery', 'grid', 'images', 'portfolio']
  ),

  createComponent(
    'Gallery - Masonry',
    'Masonry layout gallery',
    'gallery',
    {
      type: 'gallery',
      layout: 'masonry',
      heading: 'Portfolio',
      images: Array(9).fill(null).map((_, i) => ({
        url: `https://images.unsplash.com/photo-${1618005182384 + i}`,
        alt: `Image ${i + 1}`,
      })),
      style: {
        columns: 3,
        gap: '16px',
        hoverEffect: 'overlay',
      },
      spacing: { padding: '80px 24px' },
    },
    ['gallery', 'masonry', 'pinterest', 'varied']
  ),

  createComponent(
    'Gallery - Carousel',
    'Image carousel/slider gallery',
    'gallery',
    {
      type: 'gallery',
      layout: 'carousel',
      heading: 'Featured Projects',
      images: [
        { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', alt: 'Featured 1' },
        { url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead', alt: 'Featured 2' },
        { url: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d', alt: 'Featured 3' },
      ],
      style: {
        autoplay: true,
        interval: 5000,
        showThumbnails: true,
        showArrows: true,
      },
      spacing: { padding: '80px 24px' },
    },
    ['gallery', 'carousel', 'slider', 'featured']
  ),

  createComponent(
    'Gallery - Lightbox',
    'Gallery with lightbox popup',
    'gallery',
    {
      type: 'gallery',
      layout: 'lightbox',
      columns: 4,
      images: Array(8).fill(null).map((_, i) => ({
        url: `https://images.unsplash.com/photo-${1618005182384 + i}`,
        thumbnail: `https://images.unsplash.com/photo-${1618005182384 + i}?w=400`,
        alt: `Gallery ${i + 1}`,
      })),
      style: {
        gap: '8px',
        aspectRatio: '4:3',
      },
      spacing: { padding: '80px 24px' },
    },
    ['gallery', 'lightbox', 'popup', 'fullscreen']
  ),

  createComponent(
    'Gallery - With Filters',
    'Filterable gallery by category',
    'gallery',
    {
      type: 'gallery',
      layout: 'filtered',
      heading: 'Our Projects',
      filters: ['All', 'Web Design', 'Branding', 'Photography'],
      images: [
        { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', category: 'Web Design', alt: 'Web 1' },
        { url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead', category: 'Branding', alt: 'Brand 1' },
        { url: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d', category: 'Photography', alt: 'Photo 1' },
      ],
      style: {
        columns: 3,
        gap: '16px',
      },
      spacing: { padding: '80px 24px' },
    },
    ['gallery', 'filtered', 'categories', 'sortable']
  ),
];

// ============================================================================
// VIDEO COMPONENTS (5 variants)
// ============================================================================
const videoComponents = [
  createComponent(
    'Video - Embedded',
    'Embedded video player',
    'video',
    {
      type: 'video',
      layout: 'embedded',
      heading: 'Watch Our Story',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      style: {
        aspectRatio: '16:9',
        maxWidth: '800px',
      },
      spacing: { padding: '80px 24px' },
    },
    ['video', 'embedded', 'youtube', 'player']
  ),

  createComponent(
    'Video - Background',
    'Full-width video background section',
    'video',
    {
      type: 'video',
      layout: 'background',
      videoUrl: 'https://example.com/video.mp4',
      overlay: 'rgba(0, 0, 0, 0.5)',
      content: {
        heading: 'Experience Innovation',
        subheading: 'See what we can do for you',
        cta: { text: 'Learn More', url: '#', style: 'solid' },
      },
      style: {
        textColor: '#ffffff',
        autoplay: true,
        loop: true,
        muted: true,
      },
      spacing: { padding: '120px 24px' },
    },
    ['video', 'background', 'hero', 'fullwidth']
  ),

  createComponent(
    'Video - With Thumbnail',
    'Video with custom thumbnail',
    'video',
    {
      type: 'video',
      layout: 'thumbnail',
      heading: 'Product Demo',
      description: 'See how our product works in action',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
      style: {
        aspectRatio: '16:9',
        playButtonStyle: 'large',
      },
      spacing: { padding: '80px 24px' },
    },
    ['video', 'thumbnail', 'preview', 'demo']
  ),

  createComponent(
    'Video - Grid',
    'Multiple videos in grid layout',
    'video',
    {
      type: 'video',
      layout: 'grid',
      columns: 2,
      heading: 'Video Library',
      videos: [
        {
          title: 'Tutorial 1',
          description: 'Getting started guide',
          videoUrl: 'https://www.youtube.com/embed/video1',
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
        },
        {
          title: 'Tutorial 2',
          description: 'Advanced features',
          videoUrl: 'https://www.youtube.com/embed/video2',
          thumbnail: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead',
        },
      ],
      spacing: { padding: '80px 24px' },
    },
    ['video', 'grid', 'library', 'multiple']
  ),

  createComponent(
    'Video - Testimonial',
    'Video testimonial section',
    'video',
    {
      type: 'video',
      layout: 'testimonial',
      heading: 'Customer Stories',
      video: {
        url: 'https://www.youtube.com/embed/testimonial',
        thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
      },
      testimonial: {
        quote: 'This product changed everything for us',
        author: 'John Smith',
        role: 'CEO, Company Inc',
      },
      spacing: { padding: '80px 24px' },
    },
    ['video', 'testimonial', 'customer', 'story']
  ),
];

// ============================================================================
// FORM COMPONENTS (5 variants)
// ============================================================================
const formComponents = [
  createComponent(
    'Form - Contact',
    'Standard contact form',
    'form',
    {
      type: 'form',
      layout: 'contact',
      heading: 'Contact Us',
      subheading: 'Fill out the form and we\'ll get back to you soon',
      fields: [
        { type: 'text', name: 'name', label: 'Name', required: true },
        { type: 'email', name: 'email', label: 'Email', required: true },
        { type: 'text', name: 'subject', label: 'Subject', required: true },
        { type: 'textarea', name: 'message', label: 'Message', required: true, rows: 5 },
      ],
      submitText: 'Send Message',
      spacing: { padding: '80px 24px' },
    },
    ['form', 'contact', 'message', 'inquiry']
  ),

  createComponent(
    'Form - Newsletter',
    'Newsletter signup form',
    'form',
    {
      type: 'form',
      layout: 'newsletter',
      heading: 'Stay Updated',
      subheading: 'Get the latest news and updates',
      fields: [
        { type: 'email', name: 'email', placeholder: 'Enter your email', required: true },
      ],
      submitText: 'Subscribe',
      style: {
        layout: 'inline',
        background: '#f9fafb',
      },
      spacing: { padding: '60px 24px' },
    },
    ['form', 'newsletter', 'subscribe', 'email']
  ),

  createComponent(
    'Form - Lead Generation',
    'Multi-step lead generation form',
    'form',
    {
      type: 'form',
      layout: 'lead-gen',
      heading: 'Get Your Free Quote',
      steps: [
        {
          title: 'Your Information',
          fields: [
            { type: 'text', name: 'name', label: 'Full Name', required: true },
            { type: 'email', name: 'email', label: 'Email', required: true },
            { type: 'tel', name: 'phone', label: 'Phone', required: true },
          ],
        },
        {
          title: 'Your Needs',
          fields: [
            { type: 'select', name: 'service', label: 'Service Interested In', options: ['Web Design', 'Marketing', 'Consulting'], required: true },
            { type: 'textarea', name: 'details', label: 'Project Details', rows: 4 },
          ],
        },
      ],
      submitText: 'Get Quote',
      spacing: { padding: '80px 24px' },
    },
    ['form', 'lead-gen', 'multi-step', 'quote']
  ),

  createComponent(
    'Form - Registration',
    'User registration form',
    'form',
    {
      type: 'form',
      layout: 'registration',
      heading: 'Create Account',
      fields: [
        { type: 'text', name: 'firstName', label: 'First Name', required: true },
        { type: 'text', name: 'lastName', label: 'Last Name', required: true },
        { type: 'email', name: 'email', label: 'Email', required: true },
        { type: 'password', name: 'password', label: 'Password', required: true },
        { type: 'password', name: 'confirmPassword', label: 'Confirm Password', required: true },
        { type: 'checkbox', name: 'terms', label: 'I agree to the Terms and Conditions', required: true },
      ],
      submitText: 'Sign Up',
      spacing: { padding: '80px 24px' },
    },
    ['form', 'registration', 'signup', 'account']
  ),

  createComponent(
    'Form - Booking',
    'Appointment booking form',
    'form',
    {
      type: 'form',
      layout: 'booking',
      heading: 'Book an Appointment',
      fields: [
        { type: 'text', name: 'name', label: 'Name', required: true },
        { type: 'email', name: 'email', label: 'Email', required: true },
        { type: 'tel', name: 'phone', label: 'Phone', required: true },
        { type: 'date', name: 'date', label: 'Preferred Date', required: true },
        { type: 'time', name: 'time', label: 'Preferred Time', required: true },
        { type: 'select', name: 'service', label: 'Service', options: ['Consultation', 'Treatment', 'Follow-up'], required: true },
        { type: 'textarea', name: 'notes', label: 'Additional Notes', rows: 3 },
      ],
      submitText: 'Book Now',
      spacing: { padding: '80px 24px' },
    },
    ['form', 'booking', 'appointment', 'scheduling']
  ),
];

// ============================================================================
// BLOG COMPONENTS (5 variants)
// ============================================================================
const blogComponents = [
  createComponent(
    'Blog - Grid',
    'Blog post grid layout',
    'blog',
    {
      type: 'blog',
      layout: 'grid',
      columns: 3,
      heading: 'Latest Articles',
      posts: [
        {
          title: 'Getting Started with Web Design',
          excerpt: 'Learn the fundamentals of modern web design',
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
          author: 'John Doe',
          date: '2026-07-10',
          category: 'Design',
          url: '/blog/getting-started',
        },
        {
          title: 'Marketing Strategies for 2026',
          excerpt: 'Top marketing trends you need to know',
          image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead',
          author: 'Jane Smith',
          date: '2026-07-08',
          category: 'Marketing',
          url: '/blog/marketing-2026',
        },
      ],
      style: {
        cardStyle: 'elevated',
        imageHeight: '200px',
      },
      spacing: { padding: '80px 24px' },
    },
    ['blog', 'grid', 'posts', 'articles']
  ),

  createComponent(
    'Blog - List',
    'Blog post list layout',
    'blog',
    {
      type: 'blog',
      layout: 'list',
      heading: 'Recent Posts',
      posts: [
        {
          title: 'How to Build a Successful Business',
          excerpt: 'Key strategies for entrepreneurial success in the modern era',
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
          author: 'Mike Johnson',
          date: '2026-07-12',
          readTime: '5 min read',
          url: '/blog/successful-business',
        },
      ],
      style: {
        layout: 'horizontal',
        imageWidth: '300px',
      },
      spacing: { padding: '80px 24px' },
    },
    ['blog', 'list', 'horizontal', 'detailed']
  ),

  createComponent(
    'Blog - Featured',
    'Featured blog post hero',
    'blog',
    {
      type: 'blog',
      layout: 'featured',
      post: {
        title: 'The Future of Technology',
        excerpt: 'Exploring emerging trends that will shape the next decade',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
        author: 'Sarah Williams',
        date: '2026-07-14',
        category: 'Technology',
        readTime: '10 min read',
        url: '/blog/future-of-tech',
      },
      style: {
        layout: 'overlay',
        textColor: '#ffffff',
        overlay: 'rgba(0, 0, 0, 0.5)',
      },
      spacing: { padding: '120px 24px' },
    },
    ['blog', 'featured', 'hero', 'highlight']
  ),

  createComponent(
    'Blog - Sidebar',
    'Blog layout with sidebar',
    'blog',
    {
      type: 'blog',
      layout: 'sidebar',
      mainPost: {
        title: 'Complete Guide to SEO',
        content: 'Full article content here...',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
        author: 'David Brown',
        date: '2026-07-13',
      },
      sidebar: {
        recentPosts: [
          { title: 'Post 1', url: '#' },
          { title: 'Post 2', url: '#' },
        ],
        categories: ['Design', 'Marketing', 'Technology'],
        tags: ['SEO', 'Content', 'Strategy'],
      },
      spacing: { padding: '80px 24px' },
    },
    ['blog', 'sidebar', 'article', 'single']
  ),

  createComponent(
    'Blog - Masonry',
    'Masonry blog layout',
    'blog',
    {
      type: 'blog',
      layout: 'masonry',
      heading: 'Explore Our Blog',
      posts: Array(6).fill(null).map((_, i) => ({
        title: `Article ${i + 1}`,
        excerpt: 'Brief description of the article',
        image: `https://images.unsplash.com/photo-${1618005182384 + i}`,
        author: 'Author Name',
        date: '2026-07-10',
        url: `/blog/article-${i + 1}`,
      })),
      style: {
        columns: 3,
        gap: '24px',
      },
      spacing: { padding: '80px 24px' },
    },
    ['blog', 'masonry', 'pinterest', 'varied']
  ),
];

// ============================================================================
// BUTTON COMPONENTS (5 variants)
// ============================================================================
const buttonComponents = [
  createComponent('Button - Primary', 'Primary action button', 'button', 
    { type: 'button', variant: 'primary', size: 'md', text: 'Get Started' },
    ['button', 'primary', 'cta']
  ),
  createComponent('Button - Secondary', 'Secondary action button', 'button',
    { type: 'button', variant: 'secondary', size: 'md', text: 'Learn More' },
    ['button', 'secondary', 'action']
  ),
  createComponent('Button - Outline', 'Outlined button', 'button',
    { type: 'button', variant: 'outline', size: 'md', text: 'Contact Us' },
    ['button', 'outline', 'ghost']
  ),
  createComponent('Button - Text', 'Text-only button', 'button',
    { type: 'button', variant: 'text', size: 'md', text: 'View Details' },
    ['button', 'text', 'link']
  ),
  createComponent('Button - Icon', 'Button with icon', 'button',
    { type: 'button', variant: 'primary', size: 'md', text: 'Download', icon: '⬇️', iconPosition: 'left' },
    ['button', 'icon', 'download']
  ),
];

// ============================================================================
// CARD COMPONENTS (5 variants)
// ============================================================================
const cardComponents = [
  createComponent('Card - Basic', 'Simple card container', 'card',
    { type: 'card', padding: 'md', shadow: 'md', radius: 'lg', border: true },
    ['card', 'container', 'basic']
  ),
  createComponent('Card - Feature', 'Feature card with icon', 'card',
    { type: 'card', hasIcon: true, hasTitle: true, hasDescription: true, iconSize: '48px' },
    ['card', 'feature', 'icon']
  ),
  createComponent('Card - Product', 'Product card with image', 'card',
    { type: 'card', hasImage: true, hasTitle: true, hasPrice: true, hasButton: true },
    ['card', 'product', 'ecommerce']
  ),
  createComponent('Card - Testimonial', 'Testimonial card', 'card',
    { type: 'card', hasQuote: true, hasAuthor: true, hasAvatar: true, hasRating: true },
    ['card', 'testimonial', 'review']
  ),
  createComponent('Card - Pricing', 'Pricing card', 'card',
    { type: 'card', hasTitle: true, hasPrice: true, hasFeatures: true, hasButton: true, highlighted: false },
    ['card', 'pricing', 'plan']
  ),
];

// ============================================================================
// INPUT COMPONENTS (5 variants)
// ============================================================================
const inputComponents = [
  createComponent('Input - Text', 'Standard text input', 'input',
    { type: 'input', inputType: 'text', size: 'md', placeholder: 'Enter text' },
    ['input', 'text', 'field']
  ),
  createComponent('Input - Email', 'Email input field', 'input',
    { type: 'input', inputType: 'email', size: 'md', placeholder: 'Enter email' },
    ['input', 'email', 'field']
  ),
  createComponent('Input - Textarea', 'Multi-line text input', 'input',
    { type: 'textarea', rows: 4, placeholder: 'Enter message' },
    ['input', 'textarea', 'multiline']
  ),
  createComponent('Input - Select', 'Dropdown select', 'input',
    { type: 'select', size: 'md', options: ['Option 1', 'Option 2', 'Option 3'] },
    ['input', 'select', 'dropdown']
  ),
  createComponent('Input - Checkbox', 'Checkbox input', 'input',
    { type: 'checkbox', label: 'I agree to the terms' },
    ['input', 'checkbox', 'toggle']
  ),
];

async function seedComponents() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting component seeding...\n');
    
    // Combine all component arrays
    const allComponents = [
      ...heroComponents,
      ...featureComponents,
      ...ctaComponents,
      ...testimonialComponents,
      ...pricingComponents,
      ...teamComponents,
      ...contactComponents,
      ...footerComponents,
      ...navigationComponents,
      ...statsComponents,
      ...logoComponents,
      ...galleryComponents,
      ...videoComponents,
      ...formComponents,
      ...blogComponents,
      ...buttonComponents,
      ...cardComponents,
      ...inputComponents,
    ];
    
    let inserted = 0;
    let skipped = 0;
    
    for (const component of allComponents) {
      try {
        const result = await client.query(
          `INSERT INTO builder_components 
           (name, description, category, is_global, component_data, tags, thumbnail_url, preview_html, variants, usage_count, version, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id`,
          [
            component.name,
            component.description,
            component.category,
            component.is_global,
            JSON.stringify(component.component_data),
            component.tags,
            component.thumbnail_url,
            component.preview_html,
            JSON.stringify(component.variants),
            component.usage_count,
            component.version,
            component.is_active,
          ]
        );
        
        if (result.rows.length > 0) {
          inserted++;
          console.log(`✓ ${component.name}`);
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`✗ Failed to insert ${component.name}:`, error.message);
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`\n✅ Component seeding complete!`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${allComponents.length}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding components:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedComponents()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { seedComponents };
