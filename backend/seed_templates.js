const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PAGES = {
  'SaaS': [
    { name: 'Home', slug: 'home', is_home: true, blocks: [
      {type:'nav',props:{logoText:'SaaSFlow',links:[{label:'Features'},{label:'Pricing'},{label:'About'}],ctaText:'Start Free Trial'}},
      {type:'hero',props:{heading:'Automate Your Workflow, Scale Your Business',subheading:'The all-in-one platform for modern teams.',ctaText:'Start Free Trial',bgColor:'#7c3aed'}},
      {type:'features',props:{heading:'Why Choose Us',items:[{icon:'⚡',title:'Lightning Fast',desc:'Sub-second response times.'},{icon:'🔗',title:'200+ Integrations',desc:'Connect your favorite tools.'},{icon:'📈',title:'Analytics',desc:'Real-time team insights.'}]}},
      {type:'pricing',props:{heading:'Simple Pricing'}},
      {type:'testimonials',props:{heading:'What Users Say',items:[{quote:'Transformed our workflow.',author:'Alex R.'},{quote:'The best tool we\'ve used.',author:'Priya S.'}]}},
      {type:'cta',props:{heading:'Start Your Free Trial',buttonText:'Get Started',bgColor:'#7c3aed'}},
      {type:'footer',props:{logoText:'SaaSFlow',copyright:'© 2026 SaaSFlow'}}
    ]},
    { name: 'Features', slug: 'features', blocks: [
      {type:'nav',props:{logoText:'SaaSFlow',links:[{label:'Features'},{label:'Pricing'}]}},
      {type:'hero',props:{heading:'Powerful Features',bgColor:'#6d28d9'}},
      {type:'features',props:{heading:'Core Capabilities',items:[{icon:'📋',title:'Task Management'},{icon:'🤝',title:'Collaboration'},{icon:'📊',title:'Reporting'},{icon:'🔄',title:'Automation'}]}},
      {type:'comparison',props:{heading:'Compare Plans',features:['Tasks','Collaboration','Reports','API'],plans:[{name:'Starter',included:[true,true,false,false]},{name:'Pro',included:[true,true,true,false]},{name:'Enterprise',included:[true,true,true,true]}]}},
      {type:'footer',props:{logoText:'SaaSFlow'}}
    ]},
    { name: 'Pricing', slug: 'pricing', blocks: [
      {type:'nav',props:{logoText:'SaaSFlow'}},
      {type:'hero',props:{heading:'Pricing',subheading:'Start free, upgrade when you grow.',bgColor:'#7c3aed'}},
      {type:'pricing',props:{heading:'Choose Your Plan'}},
      {type:'faq',props:{heading:'FAQs',items:[{question:'Can I cancel anytime?',answer:'Yes.'},{question:'Free trial available?',answer:'14-day free trial.'}]}},
      {type:'footer',props:{logoText:'SaaSFlow'}}
    ]}
  ],
  'Real Estate': [
    { name: 'Home', slug: 'home', is_home: true, blocks: [
      {type:'nav',props:{logoText:'PrimeHomes',links:[{label:'Home'},{label:'Listings'},{label:'About'},{label:'Contact'}],ctaText:'Search Properties'}},
      {type:'hero',props:{heading:'Find Your Dream Home',subheading:'Explore premium properties.',ctaText:'Browse Listings',bgColor:'#0f766e'}},
      {type:'features',props:{heading:'Why Choose Us',items:[{icon:'🏠',title:'Premium Properties'},{icon:'📍',title:'Prime Locations'},{icon:'🤝',title:'Expert Agents'}]}},
      {type:'stats',props:{items:[{value:'1000+',label:'Properties'},{value:'500+',label:'Happy Clients'},{value:'50+',label:'Locations'},{value:'10+',label:'Years'}]}},
      {type:'testimonials',props:{heading:'What Clients Say',items:[{quote:'Found our perfect home.',author:'Robert K.'}]}},
      {type:'cta',props:{heading:'Start Your Search',buttonText:'View Properties',bgColor:'#0f766e'}},
      {type:'footer',props:{logoText:'PrimeHomes'}}
    ]},
    { name: 'Listings', slug: 'listings', blocks: [
      {type:'nav',props:{logoText:'PrimeHomes'}},
      {type:'hero',props:{heading:'Featured Properties',bgColor:'#115e59'}},
      {type:'portfolio',props:{heading:'Our Listings',items:[{title:'Modern Villa',category:'Luxury'},{title:'City Apartment',category:'Urban'},{title:'Suburban Home',category:'Family'}]}},
      {type:'footer',props:{logoText:'PrimeHomes'}}
    ]},
    { name: 'About', slug: 'about', blocks: [
      {type:'nav',props:{logoText:'PrimeHomes'}},
      {type:'hero',props:{heading:'About PrimeHomes',bgColor:'#0f766e'}},
      {type:'team',props:{heading:'Our Agents',members:[{name:'Sarah Johnson',role:'Lead Agent'},{name:'Mike Peters',role:'Senior Agent'}]}},
      {type:'footer',props:{logoText:'PrimeHomes'}}
    ]}
  ],
  'Restaurant': [
    { name: 'Home', slug: 'home', is_home: true, blocks: [
      {type:'nav',props:{logoText:'La Maison',links:[{label:'Menu'},{label:'About'},{label:'Reservations'},{label:'Contact'}],ctaText:'Reserve a Table'}},
      {type:'hero',props:{heading:'An Exquisite Dining Experience',subheading:'Fine cuisine crafted with passion.',ctaText:'View Menu',bgColor:'#b91c1c'}},
      {type:'features',props:{heading:'Our Offerings',items:[{icon:'🍽️',title:'Fine Dining'},{icon:'🍷',title:'Curated Wines'},{icon:'🎉',title:'Private Events'}]}},
      {type:'gallery',props:{heading:'Gallery',images:[{},{},{},{}]}},
      {type:'testimonials',props:{heading:'Guest Reviews',items:[{quote:'An unforgettable experience!',author:'Food Critic'}]}},
      {type:'cta',props:{heading:'Book Your Table',buttonText:'Make a Reservation',bgColor:'#b91c1c'}},
      {type:'footer',props:{logoText:'La Maison'}}
    ]},
    { name: 'Menu', slug: 'menu', blocks: [
      {type:'nav',props:{logoText:'La Maison'}},
      {type:'hero',props:{heading:'Our Menu',bgColor:'#991b1b'}},
      {type:'features',props:{heading:'Appetizers',items:[{icon:'🥗',title:'Fresh Salads'},{icon:'🦐',title:'Seafood Starters'},{icon:'🧀',title:'Cheese Board'}]}},
      {type:'features',props:{heading:'Main Courses',items:[{icon:'🥩',title:'Steak'},{icon:'🐟',title:'Fish'},{icon:'🌿',title:'Vegetarian'}]}},
      {type:'footer',props:{logoText:'La Maison'}}
    ]},
    { name: 'Contact', slug: 'contact', blocks: [
      {type:'nav',props:{logoText:'La Maison'}},
      {type:'hero',props:{heading:'Contact & Hours',bgColor:'#b91c1c'}},
      {type:'contact',props:{heading:'Get In Touch',contactInfo:[{type:'Address',value:'123 Gourmet Street'},{type:'Phone',value:'+1 (555) 456-7890'},{type:'Hours',value:'Mon-Sat: 5pm-11pm'}]}},
      {type:'footer',props:{logoText:'La Maison'}}
    ]}
  ],
  'Healthcare': [
    { name: 'Home', slug: 'home', is_home: true, blocks: [
      {type:'nav',props:{logoText:'MediCare+',links:[{label:'Home'},{label:'Services'},{label:'Doctors'},{label:'Contact'}],ctaText:'Book Appointment'}},
      {type:'hero',props:{heading:'Your Health Is Our Priority',subheading:'Comprehensive healthcare services.',ctaText:'Book Now',bgColor:'#0369a1'}},
      {type:'features',props:{heading:'Our Services',items:[{icon:'🩺',title:'General Medicine'},{icon:'🦷',title:'Dental Care'},{icon:'👁️',title:'Eye Care'}]}},
      {type:'stats',props:{items:[{value:'50K+',label:'Patients'},{value:'100+',label:'Doctors'},{value:'20+',label:'Years'},{value:'98%',label:'Satisfaction'}]}},
      {type:'cta',props:{heading:'Schedule Your Visit',buttonText:'Book Appointment',bgColor:'#0369a1'}},
      {type:'footer',props:{logoText:'MediCare+'}}
    ]},
    { name: 'Services', slug: 'services', blocks: [
      {type:'nav',props:{logoText:'MediCare+'}},
      {type:'hero',props:{heading:'Medical Services',bgColor:'#0284c7'}},
      {type:'features',props:{heading:'What We Offer',items:[{icon:'🏥',title:'Primary Care'},{icon:'🚑',title:'Emergency'},{icon:'💊',title:'Pharmacy'},{icon:'🔬',title:'Lab Tests'}]}},
      {type:'footer',props:{logoText:'MediCare+'}}
    ]},
    { name: 'Doctors', slug: 'doctors', blocks: [
      {type:'nav',props:{logoText:'MediCare+'}},
      {type:'hero',props:{heading:'Meet Our Doctors',bgColor:'#0369a1'}},
      {type:'team',props:{heading:'Medical Team',members:[{name:'Dr. Sarah Chen',role:'Cardiologist'},{name:'Dr. James Wilson',role:'Pediatrician'},{name:'Dr. Maria Rodriguez',role:'Dermatologist'}]}},
      {type:'footer',props:{logoText:'MediCare+'}}
    ]}
  ],
  'Fitness': [
    { name: 'Home', slug: 'home', is_home: true, blocks: [
      {type:'nav',props:{logoText:'IronFit Gym',links:[{label:'Home'},{label:'Programs'},{label:'Pricing'},{label:'Contact'}],ctaText:'Start Free Trial'}},
      {type:'hero',props:{heading:'Transform Your Body',subheading:'Expert trainers, premium equipment.',ctaText:'Join Now',bgColor:'#dc2626'}},
      {type:'features',props:{heading:'Why IronFit?',items:[{icon:'💪',title:'Expert Trainers'},{icon:'🏋️',title:'Premium Equipment'},{icon:'📋',title:'Custom Plans'}]}},
      {type:'pricing',props:{heading:'Membership Plans'}},
      {type:'testimonials',props:{heading:'Success Stories',items:[{quote:'Lost 30 lbs in 3 months!',author:'Tom S.'}]}},
      {type:'cta',props:{heading:'Start Your Journey',buttonText:'Get 7 Days Free',bgColor:'#dc2626'}},
      {type:'footer',props:{logoText:'IronFit Gym'}}
    ]},
    { name: 'Pricing', slug: 'pricing', blocks: [
      {type:'nav',props:{logoText:'IronFit Gym'}},
      {type:'hero',props:{heading:'Membership Plans',bgColor:'#b91c1c'}},
      {type:'pricing',props:{heading:'Choose Your Plan'}},
      {type:'footer',props:{logoText:'IronFit Gym'}}
    ]}
  ]
};

async function seed() {
  let total = 0;
  for (const [industry, pages] of Object.entries(PAGES)) {
    const { rows: templates } = await pool.query(
      'SELECT id, name FROM builder_templates WHERE industry = $1 AND is_global = true', [industry]
    );
    if (templates.length === 0) { console.log(`${industry}: no templates`); continue; }
    for (const t of templates) {
      const { rows: existing } = await pool.query('SELECT COUNT(*)::int as cnt FROM builder_template_pages WHERE template_id = $1', [t.id]);
      if (existing[0].cnt > 0) { console.log(`${industry}/${t.name}: skip (${existing[0].cnt} pages exist)`); continue; }
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        await pool.query(
          `INSERT INTO builder_template_pages (template_id, name, slug, page_type, blocks, is_home, show_in_nav, nav_order)
           VALUES ($1, $2, $3, 'page', $4::jsonb, $5, true, $6)`,
          [t.id, p.name, p.slug, JSON.stringify(p.blocks), p.is_home || false, i]
        );
        total++;
      }
      console.log(`${industry}/${t.name}: ${pages.length} pages`);
    }
  }
  const { rows } = await pool.query('SELECT COUNT(*)::int as cnt FROM builder_template_pages');
  console.log(`\nTotal: ${rows[0].cnt} pages`);
  pool.end();
}
seed().catch(e => { console.error(e.message); pool.end(); });
