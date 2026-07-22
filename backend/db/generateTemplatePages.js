/**
 * Generate template pages for batch templates that have none.
 * Reads all builder_templates without pages, infers industry-appropriate
 * page structure with real block content, and inserts into builder_template_pages.
 *
 * Usage: node backend/db/generateTemplatePages.js
 * Safe to re-run — skips templates that already have pages.
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Industry-specific page generators — each returns an array of page definitions
const PAGE_BUILDERS = {
  default: (t) => [
    { name: 'Home', slug: 'home', isHome: true, navOrder: 0, blocks: [
      { type: 'hero', props: { heading: `Welcome to ${t.name}`, subheading: 'Professional services tailored to your needs. Get in touch to learn more.', ctaText: 'Get Started', bgColor: '#2563eb', textColor: '#ffffff', align: 'center' } },
      { type: 'features', props: { heading: 'Why Choose Us', items: [{ icon: '✓', title: 'Expert Team', desc: 'Experienced professionals dedicated to your success.' }, { icon: '✓', title: 'Quality Service', desc: 'We deliver exceptional results every time.' }, { icon: '✓', title: 'Customer Focus', desc: 'Your satisfaction is our top priority.' }] } },
      { type: 'cta', props: { heading: 'Ready to get started?', buttonText: 'Contact Us', bgColor: '#f8fafc' } },
    ]},
    { name: 'About', slug: 'about', isHome: false, navOrder: 1, blocks: [
      { type: 'text', props: { heading: `About ${t.name}`, body: `We are a dedicated team passionate about delivering exceptional ${t.industry || 'professional'} services. With years of experience and a commitment to excellence, we help our clients achieve their goals through innovative solutions and personalized attention.` } },
      { type: 'stats', props: { bgColor: '#1e3a5f', items: [{ value: '50+', label: 'Team Members' }, { value: '500+', label: 'Clients Served' }, { value: '99%', label: 'Satisfaction' }, { value: '10+', label: 'Years Experience' }] } },
    ]},
    { name: 'Services', slug: 'services', isHome: false, navOrder: 2, blocks: [
      { type: 'features', props: { heading: 'Our Services', items: [{ icon: '★', title: 'Consultation', desc: 'Expert advice tailored to your unique situation.' }, { icon: '★', title: 'Planning', desc: 'Strategic planning to achieve your objectives.' }, { icon: '★', title: 'Execution', desc: 'Flawless execution of your projects.' }, { icon: '★', title: 'Support', desc: 'Ongoing support whenever you need it.' }] } },
    ]},
    { name: 'Contact', slug: 'contact', isHome: false, navOrder: 3, blocks: [
      { type: 'text', props: { heading: 'Get in Touch', body: `We would love to hear from you. Reach out to discuss how ${t.name} can help your business grow.` } },
    ]},
  ],

  'E-Commerce': (t) => [
    { name: 'Home', slug: 'home', isHome: true, navOrder: 0, blocks: [
      { type: 'hero', props: { heading: `Shop ${t.name}`, subheading: 'Discover our curated collection of premium products. Free shipping on orders over ₦50,000.', ctaText: 'Shop Now', bgColor: '#1e293b', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'Why Shop With Us', items: [{ icon: '🚚', title: 'Free Delivery', desc: 'Free shipping on orders over ₦50,000' }, { icon: '🛡️', title: 'Secure Payment', desc: '100% secure checkout' }, { icon: '↩️', title: 'Easy Returns', desc: '30-day return policy' }] } },
      { type: 'testimonials', props: { heading: 'What Our Customers Say', items: [{ quote: 'Amazing quality and fast delivery!', author: 'Chioma O.' }, { quote: 'Best shopping experience online.', author: 'Emeka N.' }] } },
      { type: 'cta', props: { heading: 'Start Shopping', buttonText: 'View Collection' } },
    ]},
    { name: 'Shop', slug: 'shop', isHome: false, navOrder: 1, blocks: [
      { type: 'hero', props: { heading: 'Our Products', subheading: 'Browse our collection', bgColor: '#1e293b', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'Featured Categories', items: [{ icon: '📱', title: 'New Arrivals', desc: 'Check out our latest products' }, { icon: '🏷️', title: 'Best Sellers', desc: 'Most popular items' }, { icon: '💰', title: 'Sale', desc: 'Amazing deals available now' }] } },
    ]},
    { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: [
      { type: 'hero', props: { heading: 'Contact Us', subheading: 'We are here to help', bgColor: '#1e293b', textColor: '#ffffff' } },
      { type: 'text', props: { heading: 'Get in Touch', body: 'Email us at support@example.com or call +234 800 000 0000. We aim to respond within 24 hours.' } },
    ]},
  ],

  Healthcare: (t) => [
    { name: 'Home', slug: 'home', isHome: true, navOrder: 0, blocks: [
      { type: 'hero', props: { heading: `Welcome to ${t.name}`, subheading: 'Your health is our priority. Expert care in a compassionate environment.', ctaText: 'Book Appointment', bgColor: '#0d9488', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'Our Services', items: [{ icon: '🩺', title: 'General Checkup', desc: 'Comprehensive health assessments' }, { icon: '🔬', title: 'Lab Services', desc: 'State-of-the-art diagnostic testing' }, { icon: '💊', title: 'Pharmacy', desc: 'Prescription and over-the-counter medications' }] } },
      { type: 'testimonials', props: { heading: 'Patient Stories', items: [{ quote: 'The care I received was exceptional. Highly recommended.', author: 'Mrs. Adebayo' }] } },
      { type: 'cta', props: { heading: 'Book Your Visit', buttonText: 'Schedule Now', bgColor: '#0d9488' } },
    ]},
    { name: 'About', slug: 'about', isHome: false, navOrder: 1, blocks: [
      { type: 'text', props: { heading: `About ${t.name}`, body: `We are committed to providing high-quality healthcare services to our community. Our team of experienced professionals uses the latest medical technology to ensure the best outcomes for our patients.` } },
      { type: 'stats', props: { bgColor: '#0d9488', items: [{ value: '20+', label: 'Years Experience' }, { value: '15', label: 'Specialists' }, { value: '10K+', label: 'Patients Treated' }] } },
    ]},
    { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: [
      { type: 'text', props: { heading: 'Contact & Location', body: 'Call us at +234 800 000 0000 or visit us during office hours. Emergency services available 24/7.' } },
    ]},
  ],

  'Food & Beverage': (t) => [
    { name: 'Home', slug: 'home', isHome: true, navOrder: 0, blocks: [
      { type: 'hero', props: { heading: `Welcome to ${t.name}`, subheading: 'Delicious food crafted with passion. Fresh ingredients, unforgettable flavors.', ctaText: 'View Menu', bgColor: '#dc2626', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'Our Specialties', items: [{ icon: '🍕', title: 'Signature Dishes', desc: 'Chef-curated specialties' }, { icon: '🥗', title: 'Fresh Ingredients', desc: 'Locally sourced produce' }, { icon: '🍷', title: 'Curated Drinks', desc: 'Premium beverage selection' }] } },
      { type: 'testimonials', props: { heading: 'What Our Guests Say', items: [{ quote: 'The best dining experience in town!', author: 'Ngozi E.' }] } },
      { type: 'cta', props: { heading: 'Reserve Your Table', buttonText: 'Book Now', bgColor: '#dc2626' } },
    ]},
    { name: 'Menu', slug: 'menu', isHome: false, navOrder: 1, blocks: [
      { type: 'hero', props: { heading: 'Our Menu', subheading: 'Discover our carefully crafted offerings', bgColor: '#dc2626', textColor: '#ffffff' } },
      { type: 'text', props: { heading: 'Categories', body: 'Starters | Main Course | Desserts | Beverages. Ask your server about today\'s specials.' } },
    ]},
    { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: [
      { type: 'text', props: { heading: 'Visit Us', body: 'Opening hours: Mon–Sat 8AM–10PM, Sun 10AM–8PM. Reservations: +234 800 000 0000.' } },
    ]},
  ],

  'Real Estate': (t) => [
    { name: 'Home', slug: 'home', isHome: true, navOrder: 0, blocks: [
      { type: 'hero', props: { heading: `Find Your Dream Property with ${t.name}`, subheading: 'Premium properties in prime locations. Let us help you find the perfect home or investment.', ctaText: 'Browse Properties', bgColor: '#0f172a', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'Why Choose Us', items: [{ icon: '🏠', title: 'Prime Listings', desc: 'Curated selection of premium properties' }, { icon: '📊', title: 'Market Expertise', desc: 'Deep knowledge of local markets' }, { icon: '🤝', title: 'Personal Service', desc: 'Dedicated agents for every client' }] } },
      { type: 'testimonials', props: { heading: 'Client Success Stories', items: [{ quote: 'Found our dream home through them. Exceptional service!', author: 'Mr. & Mrs. Okonkwo' }] } },
      { type: 'cta', props: { heading: 'Start Your Search', buttonText: 'View Listings', bgColor: '#0f172a' } },
    ]},
    { name: 'Properties', slug: 'properties', isHome: false, navOrder: 1, blocks: [
      { type: 'hero', props: { heading: 'Featured Properties', bgColor: '#0f172a', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'Property Types', items: [{ icon: '🏘️', title: 'Residential', desc: 'Homes, apartments, and condos' }, { icon: '🏢', title: 'Commercial', desc: 'Office spaces and retail' }, { icon: '🌳', title: 'Land', desc: 'Development plots and acreage' }] } },
    ]},
    { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: [
      { type: 'cta', props: { heading: 'Schedule a Viewing', buttonText: 'Contact Agent', bgColor: '#0f172a' } },
    ]},
  ],

  Education: (t) => [
    { name: 'Home', slug: 'home', isHome: true, navOrder: 0, blocks: [
      { type: 'hero', props: { heading: `Welcome to ${t.name}`, subheading: 'Empowering students with knowledge and skills for a brighter future.', ctaText: 'Enroll Now', bgColor: '#4f46e5', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'Programs', items: [{ icon: '📚', title: 'Courses', desc: 'Comprehensive curriculum' }, { icon: '👩‍🏫', title: 'Expert Faculty', desc: 'Qualified instructors' }, { icon: '🎓', title: 'Certification', desc: 'Recognized qualifications' }] } },
      { type: 'testimonials', props: { items: [{ quote: 'This institution transformed my career path.', author: 'Esther A.' }] } },
      { type: 'cta', props: { heading: 'Begin Your Journey', buttonText: 'Apply Now', bgColor: '#4f46e5' } },
    ]},
    { name: 'Courses', slug: 'courses', isHome: false, navOrder: 1, blocks: [
      { type: 'text', props: { heading: 'Our Programs', body: 'We offer a wide range of programs designed to prepare students for success in their chosen fields. From foundational courses to advanced certifications.' } },
    ]},
    { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: [
      { type: 'text', props: { heading: 'Get in Touch', body: 'Admissions office open Mon–Fri 8AM–5PM. Call +234 800 000 0000 or visit our campus.' } },
    ]},
  ],

  Legal: (t) => [
    { name: 'Home', slug: 'home', isHome: true, navOrder: 0, blocks: [
      { type: 'hero', props: { heading: `${t.name} — Trusted Legal Counsel`, subheading: 'Experienced attorneys dedicated to protecting your rights and interests. Serving individuals and businesses with integrity.', ctaText: 'Schedule Consultation', bgColor: '#1e3a5f', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'Practice Areas', items: [{ icon: '⚖️', title: 'Corporate Law', desc: 'Business formation and contracts' }, { icon: '🏠', title: 'Property Law', desc: 'Real estate transactions' }, { icon: '👨‍👩‍👧', title: 'Family Law', desc: 'Divorce, custody, and support' }] } },
      { type: 'testimonials', props: { heading: 'Client Testimonials', items: [{ quote: 'Professional, thorough, and compassionate. Highly recommend.', author: 'Chidi M.' }] } },
      { type: 'cta', props: { heading: 'Free Consultation', buttonText: 'Contact Us', bgColor: '#1e3a5f' } },
    ]},
    { name: 'About', slug: 'about', isHome: false, navOrder: 1, blocks: [
      { type: 'text', props: { heading: 'Our Firm', body: `With over 15 years of combined experience, our attorneys have successfully represented clients in a wide range of legal matters. We pride ourselves on providing personalized attention and strategic advocacy.` } },
    ]},
    { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: [
      { type: 'text', props: { heading: 'Contact Our Office', body: 'Call +234 800 000 0000 or email info@example.com. Office hours Mon–Fri 9AM–6PM.' } },
    ]},
  ],

  Technology: (t) => [
    { name: 'Home', slug: 'home', isHome: true, navOrder: 0, blocks: [
      { type: 'hero', props: { heading: `Innovate with ${t.name}`, subheading: 'Cutting-edge technology solutions for modern businesses. Built for scale, designed for impact.', ctaText: 'Get a Demo', bgColor: '#0891b2', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'Platform', items: [{ icon: '⚡', title: 'Fast & Scalable', desc: 'Built for performance at any scale' }, { icon: '🔒', title: 'Enterprise Security', desc: 'Bank-grade data protection' }, { icon: '☁️', title: 'Cloud Native', desc: 'Deploy anywhere, anytime' }] } },
      { type: 'cta', props: { heading: 'Book a Demo', buttonText: 'Get Started', bgColor: '#0891b2' } },
    ]},
    { name: 'Features', slug: 'features', isHome: false, navOrder: 1, blocks: [
      { type: 'text', props: { heading: 'Powerful Features', body: 'Discover how our platform can transform your business operations with intelligent automation, real-time analytics, and seamless integrations.' } },
    ]},
    { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: [
      { type: 'cta', props: { heading: 'Talk to Our Team', buttonText: 'Contact Sales', bgColor: '#0891b2' } },
    ]},
  ],

  Creative: (t) => [
    { name: 'Home', slug: 'home', isHome: true, navOrder: 0, blocks: [
      { type: 'hero', props: { heading: `${t.name} — Where Ideas Come to Life`, subheading: 'We create stunning designs that tell your story and captivate your audience.', ctaText: 'View Our Work', bgColor: '#6d28d9', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'What We Do', items: [{ icon: '🎨', title: 'Brand Identity', desc: 'Logos, colors, and visual systems' }, { icon: '🖥️', title: 'Web Design', desc: 'Beautiful, responsive websites' }, { icon: '📱', title: 'Digital Marketing', desc: 'Campaigns that get results' }] } },
      { type: 'testimonials', props: { heading: 'Kind Words', items: [{ quote: 'They transformed our brand. The results exceeded our expectations.', author: 'Aisha K.' }] } },
      { type: 'cta', props: { heading: 'Let\'s Create Together', buttonText: 'Start a Project', bgColor: '#6d28d9' } },
    ]},
    { name: 'Portfolio', slug: 'portfolio', isHome: false, navOrder: 1, blocks: [
      { type: 'hero', props: { heading: 'Our Portfolio', bgColor: '#6d28d9', textColor: '#ffffff' } },
      { type: 'text', props: { heading: 'Selected Work', body: 'A showcase of our favorite projects. Each one represents a partnership and a unique creative challenge.' } },
    ]},
    { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: [
      { type: 'text', props: { heading: 'Let\'s Talk', body: 'Ready to start your project? Email us at hello@example.com or call +234 800 000 0000.' } },
    ]},
  ],

  'Non-Profit': (t) => [
    { name: 'Home', slug: 'home', isHome: true, navOrder: 0, blocks: [
      { type: 'hero', props: { heading: `Support ${t.name}`, subheading: 'Together, we can make a difference. Join us in building a better future for our community.', ctaText: 'Donate Now', bgColor: '#059669', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'Our Impact', items: [{ icon: '🌍', title: 'Community Reach', desc: 'Serving thousands in need' }, { icon: '🤲', title: 'Volunteer Network', desc: 'Dedicated volunteers' }, { icon: '📈', title: 'Measurable Results', desc: 'Transparent impact tracking' }] } },
      { type: 'testimonials', props: { items: [{ quote: 'This organization changed my community for the better.', author: 'Fatima I.' }] } },
      { type: 'cta', props: { heading: 'Make a Difference', buttonText: 'Get Involved', bgColor: '#059669' } },
    ]},
    { name: 'About', slug: 'about', isHome: false, navOrder: 1, blocks: [
      { type: 'text', props: { heading: 'Our Mission', body: `We are dedicated to creating lasting positive change. Your support enables us to continue our vital work in education, healthcare, and community development.` } },
      { type: 'stats', props: { bgColor: '#059669', items: [{ value: '10K+', label: 'Lives Impacted' }, { value: '500+', label: 'Volunteers' }, { value: '15', label: 'Programs' }] } },
    ]},
    { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: [
      { type: 'text', props: { heading: 'Get in Touch', body: 'Want to volunteer, partner, or donate? Contact us at info@example.com.' } },
    ]},
  ],

  Fitness: (t) => [
    { name: 'Home', slug: 'home', isHome: true, navOrder: 0, blocks: [
      { type: 'hero', props: { heading: `Transform Your Body at ${t.name}`, subheading: 'Expert trainers, modern equipment, and a supportive community to help you reach your fitness goals.', ctaText: 'Start Free Trial', bgColor: '#dc2626', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'What We Offer', items: [{ icon: '💪', title: 'Personal Training', desc: 'One-on-one coaching' }, { icon: '🧘', title: 'Group Classes', desc: 'Yoga, HIIT, Zumba & more' }, { icon: '🏋️', title: 'Equipment', desc: 'State-of-the-art machines' }] } },
      { type: 'testimonials', props: { items: [{ quote: 'Lost 20kg in 3 months! The trainers are amazing.', author: 'Tunde A.' }] } },
      { type: 'cta', props: { heading: 'Join Today', buttonText: 'View Plans', bgColor: '#dc2626' } },
    ]},
    { name: 'Classes', slug: 'classes', isHome: false, navOrder: 1, blocks: [
      { type: 'text', props: { heading: 'Our Classes', body: 'From high-intensity interval training to calming yoga sessions, we have classes for every fitness level.' } },
    ]},
    { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: [
      { type: 'text', props: { heading: 'Visit Us', body: 'Open 6AM–10PM daily. Located in the city center. Call +234 800 000 0000.' } },
    ]},
  ],

  Automotive: (t) => [
    { name: 'Home', slug: 'home', isHome: true, navOrder: 0, blocks: [
      { type: 'hero', props: { heading: `${t.name} — Quality Vehicles, Trusted Service`, subheading: 'Browse our extensive inventory of premium vehicles. Expert service and unbeatable prices.', ctaText: 'View Inventory', bgColor: '#0f172a', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'Why Choose Us', items: [{ icon: '🚗', title: 'Wide Selection', desc: 'Hundreds of vehicles in stock' }, { icon: '🔧', title: 'Certified Service', desc: 'Factory-trained technicians' }, { icon: '💰', title: 'Best Prices', desc: 'Price match guarantee' }] } },
      { type: 'testimonials', props: { items: [{ quote: 'Found exactly what I was looking for. Great service!', author: 'Chuka O.' }] } },
      { type: 'cta', props: { heading: 'Find Your Vehicle', buttonText: 'Browse Inventory', bgColor: '#0f172a' } },
    ]},
    { name: 'Inventory', slug: 'inventory', isHome: false, navOrder: 1, blocks: [
      { type: 'hero', props: { heading: 'Our Inventory', bgColor: '#0f172a', textColor: '#ffffff' } },
      { type: 'features', props: { heading: 'Categories', items: [{ icon: '🚙', title: 'SUVs', desc: 'Explore our SUV collection' }, { icon: '🚗', title: 'Sedans', desc: 'Comfortable and efficient' }, { icon: '🚛', title: 'Trucks', desc: 'Heavy-duty vehicles' }] } },
    ]},
    { name: 'Contact', slug: 'contact', isHome: false, navOrder: 2, blocks: [
      { type: 'text', props: { heading: 'Visit Our Showroom', body: 'Open Mon–Sat 9AM–7PM. Test drives available. Call +234 800 000 0000.' } },
    ]},
  ],
};

// Industry mapping — batch SQL industries to our builder keys
function getBuilderKey(industry) {
  const industryLower = (industry || '').toLowerCase();
  if (industryLower.includes('e-comm') || industryLower.includes('retail') || industryLower.includes('fashion') || industryLower.includes('shop')) return 'E-Commerce';
  if (industryLower.includes('health') || industryLower.includes('medical') || industryLower.includes('clinic')) return 'Healthcare';
  if (industryLower.includes('food') || industryLower.includes('restaurant') || industryLower.includes('cafe') || industryLower.includes('bakery') || industryLower.includes('bar')) return 'Food & Beverage';
  if (industryLower.includes('real estate') || industryLower.includes('property')) return 'Real Estate';
  if (industryLower.includes('educ') || industryLower.includes('learn') || industryLower.includes('school') || industryLower.includes('training')) return 'Education';
  if (industryLower.includes('legal') || industryLower.includes('law') || industryLower.includes('attorney')) return 'Legal';
  if (industryLower.includes('tech') || industryLower.includes('saas') || industryLower.includes('softw') || industryLower.includes('ai') || industryLower.includes('startup')) return 'Technology';
  if (industryLower.includes('creative') || industryLower.includes('design') || industryLower.includes('photograph') || industryLower.includes('art') || industryLower.includes('music')) return 'Creative';
  if (industryLower.includes('nonprofit') || industryLower.includes('charity') || industryLower.includes('community') || industryLower.includes('religious') || industryLower.includes('fundraising')) return 'Non-Profit';
  if (industryLower.includes('fit') || industryLower.includes('gym') || industryLower.includes('wellness') || industryLower.includes('sport')) return 'Fitness';
  if (industryLower.includes('auto') || industryLower.includes('car') || industryLower.includes('marine') || industryLower.includes('boat') || industryLower.includes('aviation')) return 'Automotive';
  return 'default';
}

async function generatePages() {
  const client = await pool.connect();
  try {
    // Find templates without pages
    const { rows: templates } = await client.query(`
      SELECT bt.id, bt.name, bt.industry, bt.category, bt.description
      FROM builder_templates bt
      WHERE bt.is_global = true
      AND NOT EXISTS (
        SELECT 1 FROM builder_template_pages btp WHERE btp.template_id = bt.id
      )
      ORDER BY bt.name
    `);

    console.log(`Found ${templates.length} templates without pages`);

    let totalPages = 0;
    let totalInserted = 0;

    for (const t of templates) {
      const builderKey = getBuilderKey(t.industry);
      const builder = PAGE_BUILDERS[builderKey] || PAGE_BUILDERS.default;
      const pages = builder(t);

      for (const page of pages) {
        await client.query(
          `INSERT INTO builder_template_pages
            (template_id, name, slug, description, page_type, is_home, show_in_nav, nav_order, blocks, meta_title, meta_description)
           VALUES ($1, $2, $3, $4, 'page', $5, $6, $7, $8, $9, $10)`,
          [
            t.id,
            page.name,
            page.slug,
            `${page.name} page for ${t.name}`,
            page.isHome,
            true,
            page.navOrder,
            JSON.stringify(page.blocks),
            `${page.name} | ${t.name}`,
            `${page.name} page for ${t.name} — ${t.description || t.industry}`
          ]
        );
        totalPages++;
      }
      totalInserted++;
    }

    console.log(`✓ Generated ${totalPages} pages across ${totalInserted} templates`);
    console.log(`✓ All ${templates.length} templates now have usable pages`);

    // Also add pages to the JS-seeded templates if they somehow don't have pages
    const { rows: missingPages } = await client.query(`
      SELECT bt.id, bt.name FROM builder_templates bt
      WHERE bt.is_global = true
      AND NOT EXISTS (SELECT 1 FROM builder_template_pages btp WHERE btp.template_id = bt.id)
    `);
    if (missingPages.length > 0) {
      console.log(`⚠ ${missingPages.length} templates still have no pages (unexpected): ${missingPages.map(t => t.name).join(', ')}`);
    }

  } catch (err) {
    console.error('Fatal error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

generatePages().then(() => {
  console.log('Done! All templates now have pages.');
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
