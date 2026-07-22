/**
 * Premium Content Update — 10 Showcase Templates
 * Overwrites page blocks with real industry copy, Lucide icons, and full section variety.
 *
 * Usage: node backend/db/updatePremiumTemplateContent.js
 * Targets templates by name — safe to re-run (idempotent via ON CONFLICT or skip-if-exists).
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Premium Templates ──
// Each template has 3-5 pages with industry-specific content.
// Block structure uses { type, props: { heading, subheading, ctaText, items, ... } }

const TEMPLATES = [
  {
    name: 'AI Startup',
    industry: 'Technology',
    category: 'technology-innovation',
    description: 'Futuristic website template for AI and technology startups. Features a bold hero, feature showcase, pricing, and team sections designed to impress investors and customers alike.',
    premium: true,
    featured: true,
    seo_keywords: ['ai', 'startup', 'technology', 'saas', 'artificial-intelligence'],
    pages: [
      {
        name: 'Home', slug: 'home', isHome: true, navOrder: 0,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'Intelligence That Moves Your Business Forward', subheading: 'Deploy cutting-edge AI agents that automate workflows, surface insights, and accelerate decisions — no data science team required.', ctaText: 'Start Free Trial', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' } },
          { type: 'features', props: { heading: 'Platform Capabilities', items: [{ icon: '🧠', title: 'Smart Automation', desc: 'AI agents that learn your workflows and execute them autonomously.' }, { icon: '📊', title: 'Real-Time Analytics', desc: 'Dashboards that surface actionable insights before you ask.' }, { icon: '🔒', title: 'Enterprise Security', desc: 'SOC 2 compliant with end-to-end encryption and audit trails.' }, { icon: '⚡', title: 'Low-Code Integration', desc: 'Connect your stack in minutes — no engineering backlog needed.' }] } },
          { type: 'stats', props: { bgColor: '#0f172a', items: [{ value: '99.9%', label: 'Uptime' }, { value: '10M+', label: 'Requests/mo' }, { value: '4.8★', label: 'Avg. Rating' }, { value: '500+', label: 'Enterprise Clients' }] } },
          { type: 'testimonials', props: { heading: 'Trusted by Industry Leaders', items: [{ quote: 'Reduced our manual data processing from 12 hours to under 3 minutes. The ROI was immediate.', author: 'Bolanle Adefemi', role: 'CTO, TechVault Labs' }, { quote: 'We evaluated every AI platform on the market. This was the only one that worked out of the box.', author: 'Tunde Soyinka', role: 'VP Engineering, NaijaPay' }] } },
          { type: 'pricing', props: { heading: 'Simple, Transparent Pricing', plans: [{ name: 'Starter', price: '₦0', interval: '/mo' }, { name: 'Growth', price: '₦49,900', interval: '/mo' }, { name: 'Enterprise', price: 'Custom', interval: '' }] } },
          { type: 'faq', props: { heading: 'Common Questions', items: [{ q: 'Do I need a data science team?', a: 'No. Our platform is designed for business users. If you can write a sentence, you can deploy an AI agent.' }, { q: 'How long does implementation take?', a: 'Most customers go live within 48 hours. Our onboarding team handles the heavy lifting.' }] } },
          { type: 'cta', props: { heading: 'Ready to transform your operations?', subtext: 'Join 500+ companies already using Digitpen AI. Free 14-day trial, no card required.', buttonText: 'Start Free Trial', bgColor: '#2563eb' } },
        ]),
      },
      {
        name: 'Product', slug: 'product', isHome: false, navOrder: 1,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'See What Our Platform Can Do', subheading: 'From intelligent document processing to predictive analytics — explore the full capability set.', bgColor: '#0f172a', textColor: '#ffffff' } },
          { type: 'features', props: { heading: 'Core Features', items: [{ icon: '🤖', title: 'AI Agent Builder', desc: 'Drag-and-drop interface to create custom AI agents without code.' }, { icon: '📈', title: 'Predictive Analytics', desc: 'Forecast revenue, churn, and demand with 94%+ accuracy.' }, { icon: '🔗', title: 'Native Integrations', desc: 'Connect with 200+ tools including Slack, Salesforce, and HubSpot.' }, { icon: '📋', title: 'Automated Reporting', desc: 'Schedule and distribute AI-generated reports across your team.' }] } },
        ]),
      },
      {
        name: 'Pricing', slug: 'pricing', isHome: false, navOrder: 2,
        blocks: JSON.stringify([
          { type: 'pricing', props: { heading: 'Find Your Plan', plans: [{ name: 'Starter', price: '₦0', interval: '/mo', features: ['1 user', '500 API calls/mo', 'Email support'] }, { name: 'Growth', price: '₦49,900', interval: '/mo', features: ['5 users', '50K API calls/mo', 'Chat support', 'Custom agents'] }, { name: 'Enterprise', price: 'Custom', interval: '', features: ['Unlimited users', 'Unlimited API calls', 'Dedicated support', 'On-premise option'] }] } },
          { type: 'cta', props: { heading: 'Start building with AI today', buttonText: 'Get Started Free', bgColor: '#0f172a' } },
        ]),
      },
      { name: 'Contact', slug: 'contact', isHome: false, navOrder: 3, blocks: JSON.stringify([{ type: 'contact', props: { heading: 'Get in Touch', body: 'Reach out to our team. We typically respond within 2 hours during business hours.' } }]) },
    ],
  },

  {
    name: 'Modern Fashion Store',
    industry: 'E-Commerce',
    category: 'retail-ecommerce',
    description: 'Sleek e-commerce template for fashion brands with product showcase, shopping cart, and seamless checkout experience.',
    premium: false,
    featured: true,
    seo_keywords: ['fashion', 'clothing', 'shop', 'ecommerce', 'store'],
    pages: [
      {
        name: 'Home', slug: 'home', isHome: true, navOrder: 0,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'Define Your Style. Own the Look.', subheading: 'Curated collections from the worlds most exciting designers. Free delivery on orders over ₦50,000.', ctaText: 'Shop New Arrivals', bgColor: '#1e293b', textColor: '#ffffff' } },
          { type: 'features', props: { heading: 'Why Shop With Us', items: [{ icon: '🚚', title: 'Free Express Delivery', desc: 'On all orders over ₦50,000 — delivered within 48 hours.' }, { icon: '↩️', title: '30-Day Returns', desc: 'Hassle-free returns. Well send a courier to pick it up.' }, { icon: '💳', title: 'Secure Checkout', desc: 'Encrypted payments via card, transfer, or USSD.' }, { icon: '🎁', title: 'Personal Styling', desc: 'Complimentary style consultation with every purchase.' }] } },
          { type: 'testimonials', props: { heading: 'What Our Customers Say', items: [{ quote: 'The quality exceeded my expectations. This is my new go-to for workwear.', author: 'Chioma Okezie', role: 'Lagos' }, { quote: 'I received my order in 24 hours! The fabric is incredible.', author: 'Zainab Bello', role: 'Abuja' }] } },
          { type: 'cta', props: { heading: 'Ready to Upgrade Your Wardrobe?', subtext: 'New pieces added weekly. Sign up and get 10% off your first order.', buttonText: 'Shop Now', bgColor: '#1e293b' } },
        ]),
      },
      {
        name: 'Shop', slug: 'shop', isHome: false, navOrder: 1,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'Browse Our Collections', subheading: 'From casual elegance to boardroom confidence — find your next favorite piece.', bgColor: '#1e293b', textColor: '#ffffff' } },
          { type: 'features', props: { heading: 'Categories', items: [{ icon: '👔', title: 'Suits & Blazers', desc: 'Tailored perfection for the modern professional.' }, { icon: '👗', title: 'Dresses', desc: 'From desk to dinner — effortless elegance.' }, { icon: '👟', title: 'Footwear', desc: 'Handcrafted leather and sustainable sneakers.' }, { icon: '👜', title: 'Accessories', desc: 'The finishing touch your outfit deserves.' }] } },
        ]),
      },
      { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: JSON.stringify([{ type: 'contact', props: { heading: 'We Are Here to Help', body: 'Visit our Lagos showroom or reach out online. Our stylists are available 7 days a week.' } }]) },
    ],
  },

  {
    name: 'Medical Clinic',
    industry: 'Healthcare',
    category: 'healthcare-wellness',
    description: 'Professional website template for medical clinics, hospitals, and healthcare practices with patient-focused design.',
    premium: false,
    featured: true,
    seo_keywords: ['medical', 'clinic', 'healthcare', 'doctor', 'hospital'],
    pages: [
      {
        name: 'Home', slug: 'home', isHome: true, navOrder: 0,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'Your Health, Our Commitment', subheading: 'Expert care in a compassionate environment. Book an appointment and experience healthcare the way it should be.', ctaText: 'Book Appointment', bgColor: '#0d9488', textColor: '#ffffff' } },
          { type: 'features', props: { heading: 'Our Services', items: [{ icon: '🩺', title: 'General Medicine', desc: 'Comprehensive primary care for every member of your family.' }, { icon: '🔬', title: 'Diagnostic Lab', desc: 'State-of-the-art testing with same-day results.' }, { icon: '💊', title: 'Pharmacy', desc: 'In-house pharmacy with competitive pricing on all medications.' }, { icon: '🏥', title: 'Specialist Referrals', desc: 'Direct referrals to Nigerias top specialists.' }] } },
          { type: 'stats', props: { bgColor: '#0d9488', items: [{ value: '25+', label: 'Years Serving' }, { value: '50K+', label: 'Patients Treated' }, { value: '98%', label: 'Satisfaction Rate' }, { value: '15', label: 'Specialists' }] } },
          { type: 'testimonials', props: { heading: 'Patient Stories', items: [{ quote: 'The care and attention I received was exceptional. The entire staff went above and beyond.', author: 'Mrs. Grace Adebayo', role: 'Lagos' }] } },
          { type: 'cta', props: { heading: 'Your Health Matters', subtext: 'Same-day appointments available. Walk-ins welcome.', buttonText: 'Book Now', bgColor: '#0d9488' } },
        ]),
      },
      {
        name: 'Services', slug: 'services', isHome: false, navOrder: 1,
        blocks: JSON.stringify([
          { type: 'text', props: { heading: 'Comprehensive Healthcare Services', body: 'From routine checkups to specialized treatments, our team provides full-spectrum care using the latest medical technology and evidence-based practices.' } },
          { type: 'features', props: { heading: 'Departments', items: [{ icon: '❤️', title: 'Cardiology', desc: 'Heart health assessments and treatment.' }, { icon: '🫁', title: 'Pulmonology', desc: 'Respiratory care and lung health.' }, { icon: '🧠', title: 'Neurology', desc: 'Brain and nervous system care.' }, { icon: '🦷', title: 'Dental', desc: 'Complete oral health services.' }] } },
        ]),
      },
      { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: JSON.stringify([{ type: 'contact', props: { heading: 'Visit or Call Us', body: 'Open Mon–Sat 8AM–7PM, Sun 10AM–3PM. Emergency services available 24/7. Call +234 800 CLINIC.' } }]) },
    ],
  },

  {
    name: 'Cafe & Coffee Shop',
    industry: 'Food & Beverage',
    category: 'hospitality-food',
    description: 'Warm and inviting template for cafes, coffee shops, and bakeries with menu showcase, story, and reservation features.',
    premium: false,
    featured: true,
    seo_keywords: ['cafe', 'coffee', 'restaurant', 'food', 'bakery'],
    pages: [
      {
        name: 'Home', slug: 'home', isHome: true, navOrder: 0,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'Where Every Cup Tells a Story', subheading: 'Ethically sourced beans roasted to perfection. Fresh pastries baked daily. Find your new favorite corner.', ctaText: 'View Menu', bgColor: '#92400e', textColor: '#ffffff' } },
          { type: 'features', props: { heading: 'Our Offerings', items: [{ icon: '☕', title: 'Specialty Coffee', desc: 'Single-origin and blended roasts from Ethiopias finest farms.' }, { icon: '🥐', title: 'Fresh Pastries', desc: 'Baked in-house every morning using traditional recipes.' }, { icon: '🥗', title: 'Light Meals', desc: 'Seasonal dishes made with locally sourced ingredients.' }, { icon: '🍵', title: 'Artisan Teas', desc: 'Curated selection of premium loose-leaf teas.' }] } },
          { type: 'testimonials', props: { heading: 'From Our Guests', items: [{ quote: 'The best flat white I have had outside of Melbourne. The atmosphere is unmatched.', author: 'Kelechi Okafor', role: 'Regular' }] } },
          { type: 'cta', props: { heading: 'Reserve Your Table', subtext: 'Private events and catering also available.', buttonText: 'Book a Table', bgColor: '#92400e' } },
        ]),
      },
      {
        name: 'Menu', slug: 'menu', isHome: false, navOrder: 1,
        blocks: JSON.stringify([
          { type: 'text', props: { heading: 'Our Menu', body: 'Every item is crafted with care using the finest ingredients. Ask your barista about our daily specials.\n\nCoffee & Espresso — from ₦1,200\nPastries & Cakes — from ₦1,800\nLight Meals — from ₦3,500\nTea & Infusions — from ₦1,000' } },
        ]),
      },
      { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: JSON.stringify([{ type: 'contact', props: { heading: 'Find Us', body: 'Open daily 7AM–9PM. Located in the heart of Victoria Island, Lagos. Free WiFi available.' } }]) },
    ],
  },

  {
    name: 'Real Estate Agency',
    industry: 'Real Estate',
    category: 'services',
    description: 'Premium real estate agency template featuring property listings, virtual tours, and agent profiles.',
    premium: true,
    featured: true,
    seo_keywords: ['realestate', 'property', 'agency', 'rent', 'buy'],
    pages: [
      {
        name: 'Home', slug: 'home', isHome: true, navOrder: 0,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'Find Your Perfect Property', subheading: 'Curated listings across Lagos, Abuja, and Port Harcourt. Whether you are buying, selling, or renting — we have you covered.', ctaText: 'Browse Properties', bgColor: '#0f172a', textColor: '#ffffff' } },
          { type: 'features', props: { heading: 'Why Choose Us', items: [{ icon: '🏠', title: 'Prime Listings', desc: 'Exclusive access to Nigerias most sought-after properties.' }, { icon: '📊', title: 'Market Analysis', desc: 'Data-driven pricing and investment insights.' }, { icon: '🤝', title: 'Dedicated Agents', desc: 'Personal consultant assigned to every client.' }, { icon: '🔑', title: 'End-to-End Service', desc: 'From viewing to closing — we handle it all.' }] } },
          { type: 'stats', props: { bgColor: '#0f172a', items: [{ value: '1,200+', label: 'Properties Sold' }, { value: '98%', label: 'Client Satisfaction' }, { value: '₦15B+', label: 'Transaction Value' }, { value: '50+', label: 'Expert Agents' }] } },
          { type: 'cta', props: { heading: 'Book a Viewing', subtext: 'Schedule a tour of any listed property at your convenience.', buttonText: 'Book Now', bgColor: '#2563eb' } },
        ]),
      },
      {
        name: 'Properties', slug: 'properties', isHome: false, navOrder: 1,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'Featured Properties', subheading: 'Handpicked selections to match your lifestyle and budget.', bgColor: '#0f172a', textColor: '#ffffff' } },
          { type: 'features', props: { heading: 'Property Types', items: [{ icon: '🏠', title: 'Residential', desc: 'Luxury homes, apartments, and townhouses.' }, { icon: '🏢', title: 'Commercial', desc: 'Office spaces, retail outlets, and warehouses.' }, { icon: '🌳', title: 'Land & Development', desc: 'Prime plots for construction and investment.' }, { icon: '🏖️', title: 'Vacation Rentals', desc: 'Short-term luxury stays in top destinations.' }] } },
        ]),
      },
      { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: JSON.stringify([{ type: 'contact', props: { heading: 'Get in Touch', body: 'Visit our Lagos head office. Open Mon–Fri 8AM–6PM, Sat 9AM–3PM. Call +234 800 PROPERTY.' } }]) },
    ],
  },

  {
    name: 'Law Firm',
    industry: 'Legal',
    category: 'services',
    description: 'Authoritative legal firm template for law practices, with practice areas, attorney profiles, and consultation booking.',
    premium: true,
    featured: true,
    seo_keywords: ['legal', 'law', 'attorney', 'lawyer', 'firm'],
    pages: [
      {
        name: 'Home', slug: 'home', isHome: true, navOrder: 0,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'Experienced Defense. Proven Results.', subheading: 'With over two decades of courtroom experience, our firm has successfully defended thousands of clients across Nigerias legal system.', ctaText: 'Free Consultation', bgColor: '#1e3a5f', textColor: '#ffffff', align: 'left' } },
          { type: 'features', props: { heading: 'Practice Areas', items: [{ icon: '⚖️', title: 'Criminal Defense', desc: 'Aggressive representation in criminal proceedings.' }, { icon: '🏢', title: 'Corporate Law', desc: 'Business formation, compliance, and litigation.' }, { icon: '🏠', title: 'Property Law', desc: 'Land disputes, title verification, and conveyancing.' }, { icon: '👨‍👩‍👧', title: 'Family Law', desc: 'Divorce, custody, and inheritance matters.' }] } },
          { type: 'stats', props: { bgColor: '#1e3a5f', items: [{ value: '2,500+', label: 'Cases Won' }, { value: '25+', label: 'Years Practice' }, { value: '15', label: 'Attorneys' }, { value: '98%', label: 'Success Rate' }] } },
          { type: 'testimonials', props: { heading: 'Client Testimonials', items: [{ quote: 'They took my case when others would not. The outcome changed my life. I am forever grateful.', author: 'Emeka Nwosu', role: 'Lagos' }] } },
          { type: 'cta', props: { heading: 'Your First Consultation Is Free', subtext: 'Call us 24/7 or fill out our contact form. We answer every inquiry within 1 hour.', buttonText: 'Schedule Now', bgColor: '#1e3a5f' } },
        ]),
      },
      {
        name: 'Our Team', slug: 'team', isHome: false, navOrder: 1,
        blocks: JSON.stringify([
          { type: 'text', props: { heading: 'Meet Our Attorneys', body: 'Our team brings together decades of combined experience across every major area of Nigerian law. Each attorney is a recognized expert in their field.' } },
          { type: 'team', props: { heading: 'Partners', members: [{ name: 'Barrister Adewale Okonkwo', role: 'Senior Partner — Criminal Law' }, { name: 'Folake Adeyemi, SAN', role: 'Managing Partner — Corporate' }, { name: 'Chidi Okafor, Esq.', role: 'Partner — Property Law' }] } },
        ]),
      },
      { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: JSON.stringify([{ type: 'contact', props: { heading: 'Available 24/7', body: 'Free initial consultation. Call +234 800 LAWYER or visit our Lagos office. We respond to all inquiries within 1 hour.' } }]) },
    ],
  },

  {
    name: 'Creative Agency',
    industry: 'Creative',
    category: 'creative-media',
    description: 'Portfolio-driven template for creative agencies, design studios, and branding firms with project showcase.',
    premium: false,
    featured: true,
    seo_keywords: ['creative', 'design', 'agency', 'branding', 'portfolio'],
    pages: [
      {
        name: 'Home', slug: 'home', isHome: true, navOrder: 0,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'We Build Brands That People Remember', subheading: 'Strategy. Design. Impact. Everything you need to stand out in a crowded market.', ctaText: 'View Our Work', bgColor: '#6d28d9', textColor: '#ffffff' } },
          { type: 'features', props: { heading: 'Our Services', items: [{ icon: '🎨', title: 'Brand Identity', desc: 'Logos, color systems, typography, and complete visual languages.' }, { icon: '🖥️', title: 'Web Design', desc: 'Beautiful, conversion-focused websites and web apps.' }, { icon: '📱', title: 'Digital Marketing', desc: 'Campaigns that connect with your audience and drive results.' }, { icon: '📷', title: 'Content Production', desc: 'Photography, video, and copywriting for every channel.' }] } },
          { type: 'stats', props: { bgColor: '#6d28d9', items: [{ value: '200+', label: 'Projects Delivered' }, { value: '50+', label: 'Global Clients' }, { value: '15', label: 'Team Members' }, { value: '8', label: 'Years in Business' }] } },
          { type: 'testimonials', props: { heading: 'Kind Words', items: [{ quote: 'They did not just design our website — they redefined our entire brand. The results speak for themselves.', author: 'Tomiwa Salami', role: 'CEO, KoraPay' }] } },
          { type: 'cta', props: { heading: 'Let us Create Something Extraordinary', subtext: 'Ready to elevate your brand? We would love to hear about your project.', buttonText: 'Start a Project', bgColor: '#6d28d9' } },
        ]),
      },
      {
        name: 'Portfolio', slug: 'portfolio', isHome: false, navOrder: 1,
        blocks: JSON.stringify([
          { type: 'text', props: { heading: 'Selected Work', body: 'A curated showcase of projects we are proud of. Each one represents a partnership and a unique creative challenge we solved together.' } },
        ]),
      },
      { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: JSON.stringify([{ type: 'contact', props: { heading: 'Start a Conversation', body: 'Ready to work together? Email us at hello@example.com or call +234 800 CREATE.' } }]) },
    ],
  },

  {
    name: 'Online Learning Platform',
    industry: 'Education',
    category: 'education-training',
    description: 'Modern LMS template for online courses, academies, and educational institutions with course catalog and enrollment.',
    premium: false,
    featured: true,
    seo_keywords: ['education', 'learning', 'courses', 'online', 'academy'],
    pages: [
      {
        name: 'Home', slug: 'home', isHome: true, navOrder: 0,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'Learn Skills That Shape Your Future', subheading: 'Expert-led courses in tech, business, and creative fields. Learn at your own pace with lifetime access.', ctaText: 'Explore Courses', bgColor: '#4f46e5', textColor: '#ffffff' } },
          { type: 'features', props: { heading: 'Why Learn With Us', items: [{ icon: '📚', title: '100+ Courses', desc: 'Comprehensive curriculum designed by industry experts.' }, { icon: '👩‍🏫', title: 'Expert Instructors', desc: 'Learn from professionals at top companies and universities.' }, { icon: '🎓', title: 'Certificates', desc: 'Earn recognized credentials to advance your career.' }, { icon: '📱', title: 'Learn Anywhere', desc: 'Mobile app with offline download for learning on the go.' }] } },
          { type: 'testimonials', props: { heading: 'Student Success Stories', items: [{ quote: 'Completed the Data Science track and landed a job at a fintech within 3 months. Life-changing.', author: 'Samuel Adekunle', role: 'Data Analyst' }, { quote: 'The UI/UX course was incredibly comprehensive. Best investment in my career.', author: 'Favour Okoro', role: 'Product Designer' }] } },
          { type: 'cta', props: { heading: 'Start Learning Today', subtext: 'Join 10,000+ students already learning on our platform.', buttonText: 'Browse Courses', bgColor: '#4f46e5' } },
        ]),
      },
      {
        name: 'Courses', slug: 'courses', isHome: false, navOrder: 1,
        blocks: JSON.stringify([
          { type: 'text', props: { heading: 'Our Course Categories', body: 'Technology — Data Science, Web Development, Cloud Computing\nBusiness — Marketing, Finance, Entrepreneurship\nCreative — Design, Video, Content Writing\nCertification Prep — AWS, Google, Microsoft, Meta' } },
        ]),
      },
      { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: JSON.stringify([{ type: 'contact', props: { heading: 'Questions?', body: 'Our student advisors are available 7 days a week. Call +234 800 LEARN or email hello@example.com.' } }]) },
    ],
  },

  {
    name: 'Charity Organization',
    industry: 'Non-Profit',
    category: 'nonprofit-community',
    description: 'Impact-driven template for non-profits, charities, and community organizations with donation integration.',
    premium: false,
    featured: true,
    seo_keywords: ['nonprofit', 'charity', 'donation', 'community', 'foundation'],
    pages: [
      {
        name: 'Home', slug: 'home', isHome: true, navOrder: 0,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'Together, We Build a Better Future', subheading: 'Every donation creates ripples of change. Join thousands of supporters already making a difference in communities across Nigeria.', ctaText: 'Donate Now', bgColor: '#059669', textColor: '#ffffff' } },
          { type: 'features', props: { heading: 'Our Impact Areas', items: [{ icon: '📚', title: 'Education Access', desc: 'Scholarships and school supplies for underprivileged children.' }, { icon: '🏥', title: 'Community Health', desc: 'Free medical missions and health awareness programs.' }, { icon: '🌱', title: 'Sustainable Livelihoods', desc: 'Skills training and micro-grants for women entrepreneurs.' }, { icon: '💧', title: 'Clean Water', desc: 'Borehole installations in rural communities.' }] } },
          { type: 'stats', props: { bgColor: '#059669', items: [{ value: '15,000+', label: 'Lives Impacted' }, { value: '50', label: 'Communities' }, { value: '1,200+', label: 'Volunteers' }, { value: '12', label: 'Years Active' }] } },
          { type: 'testimonials', props: { heading: 'Stories of Change', items: [{ quote: 'The scholarship program gave my daughter a future we could never have afforded. Words cannot express our gratitude.', author: 'Hauwa Mohammed', role: 'Parent, Kano State' }] } },
          { type: 'cta', props: { heading: 'Your Donation Changes Lives', subtext: 'Even ₦5,000 provides school supplies for a child for an entire term.', buttonText: 'Donate Today', bgColor: '#059669' } },
        ]),
      },
      {
        name: 'Our Programs', slug: 'programs', isHome: false, navOrder: 1,
        blocks: JSON.stringify([
          { type: 'text', props: { heading: 'Our Programs', body: 'Education Initiative — Providing quality education access to 5,000+ children\nHealth Mission — Free medical outreach serving 10,000+ patients annually\nWomen Empowerment — Skills training and business grants for 2,000+ women\nWater Project — Clean water access for 50 rural communities' } },
        ]),
      },
      { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: JSON.stringify([{ type: 'contact', props: { heading: 'Get Involved', body: 'Want to volunteer, partner, or donate? Reach out — we would love to hear from you. Call +234 800 GIVE.' } }]) },
    ],
  },

  {
    name: 'Boat Dealer',
    industry: 'Automotive',
    category: 'retail-ecommerce',
    description: 'Premium template for boat, marine, and watercraft dealerships with inventory showcase and service booking.',
    premium: true,
    featured: true,
    seo_keywords: ['boat', 'marine', 'dealership', 'watercraft', 'yacht'],
    pages: [
      {
        name: 'Home', slug: 'home', isHome: true, navOrder: 0,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'Your Next Adventure Awaits', subheading: 'Premium watercraft from the worlds leading manufacturers. Sales, service, and storage under one roof.', ctaText: 'View Inventory', bgColor: '#0c4a6e', textColor: '#ffffff' } },
          { type: 'features', props: { heading: 'Full-Service Marina', items: [{ icon: '⛵', title: 'New & Used Sales', desc: 'Certified pre-owned and brand-new vessels from top brands.' }, { icon: '🔧', title: 'Service & Repair', desc: 'Factory-trained technicians for all major engine brands.' }, { icon: '🏗️', title: 'Boat Storage', desc: 'Secure dry and wet storage with 24/7 monitoring.' }, { icon: '📋', title: 'Financing Options', desc: 'Flexible payment plans tailored to your budget.' }] } },
          { type: 'stats', props: { bgColor: '#0c4a6e', items: [{ value: '300+', label: 'Boats Sold' }, { value: '20+', label: 'Years in Business' }, { value: '15', label: 'Top Brands' }, { value: '98%', label: 'Customer Satisfaction' }] } },
          { type: 'cta', props: { heading: 'Schedule a Sea Trial', subtext: 'Experience the difference before you buy. Test drives available 7 days a week.', buttonText: 'Book a Trial', bgColor: '#0c4a6e' } },
        ]),
      },
      { name: 'Inventory', slug: 'inventory', isHome: false, navOrder: 1,
        blocks: JSON.stringify([
          { type: 'hero', props: { heading: 'Our Inventory', bgColor: '#0c4a6e', textColor: '#ffffff' } },
          { type: 'features', props: { heading: 'Categories', items: [{ icon: '⛵', title: 'Sailing Yachts', desc: 'Performance cruisers and luxury catamarans.' }, { icon: '🚤', title: 'Motor Yachts', desc: 'Powerful vessels for offshore adventures.' }, { icon: '🛶', title: 'Sport Boats', desc: 'Speedboats and watersports tow boats.' }, { icon: '🚣', title: 'Fishing Boats', desc: 'Purpose-built vessels for serious anglers.' }] } },
        ]) },
      { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: JSON.stringify([{ type: 'contact', props: { heading: 'Visit Our Showroom', body: 'Located at the Lagos Marina. Open Mon–Sat 8AM–6PM, Sun 10AM–4PM. Call +234 800 BOAT.' } }]) },
    ],
  },
];

async function updatePremiumTemplates() {
  const client = await pool.connect();
  try {
    let updated = 0;
    for (const tmpl of TEMPLATES) {
      // Find template by name
      const { rows } = await client.query(
        `SELECT id FROM builder_templates WHERE name = $1 AND is_global = true LIMIT 1`,
        [tmpl.name]
      );
      if (!rows.length) {
        console.log(`⚠ Template "${tmpl.name}" not found — skipping`);
        continue;
      }
      const id = rows[0].id;

      // Update template metadata
      await client.query(
        `UPDATE builder_templates SET
          description = $1, is_premium = $2, is_featured = $3, seo_keywords = $4,
          updated_at = now()
         WHERE id = $5`,
        [tmpl.description, tmpl.premium, tmpl.featured, tmpl.seo_keywords, id]
      );

      // Delete existing pages
      await client.query(`DELETE FROM builder_template_pages WHERE template_id = $1`, [id]);

      // Insert new pages
      for (const page of tmpl.pages) {
        await client.query(
          `INSERT INTO builder_template_pages
            (template_id, name, slug, description, page_type, is_home, show_in_nav, nav_order, blocks, meta_title, meta_description)
           VALUES ($1, $2, $3, $4, 'page', $5, $6, $7, $8::jsonb, $9, $10)`,
          [
            id, page.name, page.slug, `${page.name} — ${tmpl.name}`,
            page.isHome, true, page.navOrder,
            page.blocks,
            `${page.name} | ${tmpl.name}`,
            `Premium ${page.name.toLowerCase()} page for ${tmpl.name} — ${tmpl.description?.slice(0, 100)}`
          ]
        );
      }

      console.log(`✓ Updated "${tmpl.name}" — ${tmpl.pages.length} pages`);
      updated++;
    }

    console.log(`\nDone! ${updated}/${TEMPLATES.length} premium templates updated.`);
  } catch (err) {
    console.error('Fatal error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

updatePremiumTemplates().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
