// Extended Block Type Definitions for Website Builder
// Add these to BLOCK_DEFAULTS in PageEditor.jsx

export const EXPANDED_BLOCK_DEFAULTS = {
  // Existing blocks (keep these)
  hero:         { type: 'hero',         heading: 'Welcome', subheading: 'Your tagline goes here.', ctaText: 'Get started', ctaUrl: '', bgColor: '#2563eb', textColor: '#ffffff', align: 'center' },
  text:         { type: 'text',         heading: '',        body: '' },
  features:     { type: 'features',     heading: 'Why choose us?', items: [{ icon: '✓', title: 'Feature 1', desc: 'Describe this benefit.' }] },
  cta:          { type: 'cta',          heading: 'Ready to get started?', body: '', buttonText: 'Get started', buttonUrl: '', bgColor: '#f8fafc' },
  testimonials: { type: 'testimonials', heading: 'What our clients say', items: [{ quote: '', author: '', role: '' }] },
  image:        { type: 'image',        url: '',    alt: '',   caption: '' },
  columns:      { type: 'columns',      columns: 2, items: [{ heading: '', body: '', imageUrl: '' }, { heading: '', body: '', imageUrl: '' }] },
  video:        { type: 'video',        url: '',    heading: '' },
  spacer:       { type: 'spacer',       height: 40 },
  divider:      { type: 'divider' },
  nav:          { type: 'nav',          logoText: 'Your Business', homeHref: '/', links: [], ctaText: '', ctaHref: '' },
  footer:       { type: 'footer',       logoText: 'Your Business', copyright: '', links: [] },
  form:         { type: 'form',         formId: '', heading: 'Get in touch', subheading: 'Send us a message and we\'ll get back to you soon.' },
  
  // NEW BLOCKS
  pricing: {
    type: 'pricing',
    heading: 'Choose Your Plan',
    subheading: 'Select the perfect plan for your needs',
    plans: [
      {
        name: 'Starter',
        price: '29',
        currency: '$',
        period: 'month',
        description: 'Perfect for individuals',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        ctaText: 'Get Started',
        ctaUrl: '',
        highlighted: false,
        badge: ''
      },
      {
        name: 'Professional',
        price: '79',
        currency: '$',
        period: 'month',
        description: 'Best for growing teams',
        features: ['Everything in Starter', 'Feature 4', 'Feature 5', 'Feature 6'],
        ctaText: 'Get Started',
        ctaUrl: '',
        highlighted: true,
        badge: 'Popular'
      },
      {
        name: 'Enterprise',
        price: '199',
        currency: '$',
        period: 'month',
        description: 'For large organizations',
        features: ['Everything in Professional', 'Feature 7', 'Feature 8', 'Priority Support'],
        ctaText: 'Contact Sales',
        ctaUrl: '',
        highlighted: false,
        badge: ''
      }
    ]
  },
  
  faq: {
    type: 'faq',
    heading: 'Frequently Asked Questions',
    subheading: 'Find answers to common questions',
    items: [
      { question: 'What is your refund policy?', answer: 'We offer a 30-day money-back guarantee.' },
      { question: 'How do I get started?', answer: 'Simply sign up and follow our onboarding guide.' },
      { question: 'Do you offer support?', answer: 'Yes, we provide 24/7 customer support via email and chat.' }
    ]
  },
  
  team: {
    type: 'team',
    heading: 'Meet Our Team',
    subheading: 'The people behind our success',
    layout: 'grid', // grid or carousel
    members: [
      {
        name: 'John Doe',
        role: 'CEO & Founder',
        bio: 'Passionate about building great products',
        imageUrl: '',
        social: {
          linkedin: '',
          twitter: '',
          email: ''
        }
      },
      {
        name: 'Jane Smith',
        role: 'Head of Design',
        bio: 'Creating beautiful user experiences',
        imageUrl: '',
        social: {
          linkedin: '',
          twitter: '',
          email: ''
        }
      }
    ]
  },
  
  portfolio: {
    type: 'portfolio',
    heading: 'Our Work',
    subheading: 'Check out our latest projects',
    layout: 'masonry', // grid, masonry, or carousel
    columns: 3,
    items: [
      {
        title: 'Project Name',
        category: 'Web Design',
        description: 'Brief project description',
        imageUrl: '',
        link: '',
        tags: ['Design', 'Development']
      }
    ]
  },
  
  stats: {
    type: 'stats',
    heading: 'Our Impact',
    subheading: 'Numbers that matter',
    layout: 'horizontal', // horizontal or vertical
    items: [
      { value: '10K+', label: 'Happy Customers', icon: '👥' },
      { value: '50+', label: 'Countries', icon: '🌍' },
      { value: '99.9%', label: 'Uptime', icon: '⚡' },
      { value: '24/7', label: 'Support', icon: '💬' }
    ]
  },
  
  timeline: {
    type: 'timeline',
    heading: 'Our Journey',
    subheading: 'How we got here',
    items: [
      {
        year: '2020',
        title: 'Company Founded',
        description: 'Started with a vision to change the industry',
        imageUrl: ''
      },
      {
        year: '2021',
        title: 'First Product Launch',
        description: 'Released our flagship product to the market',
        imageUrl: ''
      },
      {
        year: '2022',
        title: 'Series A Funding',
        description: 'Raised $10M to accelerate growth',
        imageUrl: ''
      }
    ]
  },
  
  gallery: {
    type: 'gallery',
    heading: 'Photo Gallery',
    subheading: 'Explore our collection',
    layout: 'grid', // grid or masonry
    columns: 4,
    images: [
      { url: '', alt: '', caption: '' }
    ]
  },
  
  blog: {
    type: 'blog',
    heading: 'Latest Articles',
    subheading: 'Insights and updates from our team',
    layout: 'grid', // grid or list
    columns: 3,
    posts: [
      {
        title: 'Blog Post Title',
        excerpt: 'Brief description of the blog post...',
        imageUrl: '',
        author: 'Author Name',
        date: '2026-01-15',
        category: 'Category',
        readTime: '5 min read',
        link: ''
      }
    ]
  },
  
  newsletter: {
    type: 'newsletter',
    heading: 'Subscribe to Our Newsletter',
    subheading: 'Get the latest updates delivered to your inbox',
    placeholder: 'Enter your email',
    buttonText: 'Subscribe',
    formId: '',
    bgColor: '#f8fafc',
    showPrivacyNote: true,
    privacyNote: 'We respect your privacy. Unsubscribe at any time.'
  },
  
  social: {
    type: 'social',
    heading: 'Follow Us',
    subheading: 'Stay connected on social media',
    links: [
      { platform: 'facebook', url: '', icon: '📘' },
      { platform: 'twitter', url: '', icon: '🐦' },
      { platform: 'instagram', url: '', icon: '📷' },
      { platform: 'linkedin', url: '', icon: '💼' }
    ],
    style: 'icons' // icons, buttons, or cards
  },
  
  comparison: {
    type: 'comparison',
    heading: 'Compare Plans',
    subheading: 'Find the right fit for you',
    features: [
      'Feature 1',
      'Feature 2',
      'Feature 3',
      'Feature 4',
      'Feature 5'
    ],
    plans: [
      {
        name: 'Basic',
        included: [true, true, false, false, false]
      },
      {
        name: 'Pro',
        included: [true, true, true, true, false]
      },
      {
        name: 'Enterprise',
        included: [true, true, true, true, true]
      }
    ]
  },
  
  tabs: {
    type: 'tabs',
    heading: 'Product Features',
    tabs: [
      {
        label: 'Overview',
        content: 'Overview content goes here...',
        imageUrl: ''
      },
      {
        label: 'Features',
        content: 'Features content goes here...',
        imageUrl: ''
      },
      {
        label: 'Pricing',
        content: 'Pricing content goes here...',
        imageUrl: ''
      }
    ]
  },
  
  accordion: {
    type: 'accordion',
    heading: 'Learn More',
    items: [
      {
        title: 'Section 1',
        content: 'Content for section 1...',
        defaultOpen: true
      },
      {
        title: 'Section 2',
        content: 'Content for section 2...',
        defaultOpen: false
      }
    ]
  },
  
  iconbox: {
    type: 'iconbox',
    heading: 'Our Services',
    subheading: 'What we offer',
    layout: 'grid', // grid or horizontal
    columns: 3,
    items: [
      {
        icon: '🎨',
        title: 'Design',
        description: 'Beautiful, modern designs',
        link: ''
      },
      {
        icon: '💻',
        title: 'Development',
        description: 'Clean, efficient code',
        link: ''
      },
      {
        icon: '🚀',
        title: 'Launch',
        description: 'Deploy with confidence',
        link: ''
      }
    ]
  },
  
  progress: {
    type: 'progress',
    heading: 'Our Skills',
    items: [
      { label: 'Web Design', percentage: 95, color: '#3b82f6' },
      { label: 'Development', percentage: 90, color: '#10b981' },
      { label: 'Marketing', percentage: 85, color: '#f59e0b' },
      { label: 'SEO', percentage: 80, color: '#8b5cf6' }
    ]
  },
  
  countdown: {
    type: 'countdown',
    heading: 'Limited Time Offer',
    subheading: 'Hurry! Offer ends soon',
    targetDate: '2026-12-31T23:59:59',
    ctaText: 'Claim Offer',
    ctaUrl: '',
    showDays: true,
    showHours: true,
    showMinutes: true,
    showSeconds: true
  },
  
  map: {
    type: 'map',
    heading: 'Visit Us',
    address: '123 Main Street, City, State 12345',
    latitude: 40.7128,
    longitude: -74.0060,
    zoom: 15,
    showMarker: true,
    embedUrl: '' // Google Maps embed URL
  },
  
  contact: {
    type: 'contact',
    heading: 'Get In Touch',
    subheading: 'We\'d love to hear from you',
    showForm: true,
    formId: '',
    contactInfo: [
      { type: 'email', value: 'hello@example.com', icon: '📧' },
      { type: 'phone', value: '+1 (555) 123-4567', icon: '📞' },
      { type: 'address', value: '123 Main St, City, State 12345', icon: '📍' }
    ]
  }
};

// Block categories for better organization
export const BLOCK_CATEGORIES = {
  'Layout': ['hero', 'columns', 'spacer', 'divider'],
  'Content': ['text', 'image', 'video', 'gallery'],
  'Navigation': ['nav', 'footer', 'tabs', 'accordion'],
  'Marketing': ['cta', 'newsletter', 'countdown', 'social'],
  'Business': ['features', 'pricing', 'comparison', 'stats'],
  'Social Proof': ['testimonials', 'team', 'portfolio', 'blog'],
  'Interactive': ['form', 'contact', 'faq', 'iconbox'],
  'Advanced': ['timeline', 'progress', 'map']
};
