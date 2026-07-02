// Seeds genuine multi-page site templates (Step 1b) — each template is a full
// linked site (home/about/services/etc), not a single page. Idempotent —
// skips any template name that already exists, so re-running only adds new
// ones. Pulls real imagery from Pexels per page, same pattern as
// seedPageTemplates.js.
require('dotenv').config();
const { Pool } = require('pg');
const { searchImages } = require('../src/utils/pexels');

function blk(type, fields) {
  return { id: `blk_${Math.random().toString(36).slice(2, 10)}`, type, ...fields };
}

async function img(query) {
  try {
    const results = await searchImages(query, { perPage: 1, orientation: 'landscape' });
    return results[0]?.url || '';
  } catch (err) {
    console.warn(`  ! image search failed for "${query}": ${err.message}`);
    return '';
  }
}

// Each SITE has: category, name, description, and an ordered list of pages.
// Each page: role, slugSuffix, title, navLabel, metaDescription, imageQuery
// (optional — fetched once and passed into build()), build(heroImg) -> blocks.
const SITES = [
  {
    category: 'Real Estate',
    name: 'Harborview Realty — Full Agency Site',
    description: 'A 6-page real estate agency site: home, about, services, featured listings, testimonials, and contact.',
    pages: [
      {
        role: 'home', slugSuffix: '', title: 'Harborview Realty', navLabel: 'Home',
        metaDescription: 'Harborview Realty — buy, sell, and manage property with a local team that knows the market.',
        imageQuery: 'modern home exterior real estate',
        build: (heroImg) => [
          blk('hero', { heading: 'Find a home that actually fits your life', subheading: 'Harborview Realty has helped local families buy, sell, and rent property for over 15 years.', ctaText: 'View featured listings', ctaUrl: '__LINK:portfolio__', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' }),
          blk('image', { url: heroImg, alt: 'Modern home exterior', caption: '' }),
          blk('features', { heading: 'Why sellers and buyers choose Harborview', items: [
            { icon: '🏡', title: 'Local market knowledge', desc: 'Our agents live in the neighborhoods they sell — not just numbers on a spreadsheet.' },
            { icon: '🤝', title: 'No pressure, ever', desc: 'We walk you through every option honestly, even if it means a slower sale.' },
            { icon: '📈', title: 'Pricing that sells', desc: 'Data-backed pricing gets your property sold faster, without leaving money on the table.' },
          ] }),
          blk('cta', { heading: 'Ready to talk about your next move?', body: 'Whether you\'re buying your first home or listing your fifth property, we\'ll give it to you straight.', buttonText: 'Contact our team', buttonUrl: '__LINK:contact__', bgColor: '#f8fafc' }),
        ],
      },
      {
        role: 'about', slugSuffix: 'about', title: 'About Harborview Realty', navLabel: 'About',
        metaDescription: 'The story, mission, and team behind Harborview Realty.',
        imageQuery: 'real estate agents team office',
        build: (heroImg) => [
          blk('hero', { heading: 'Built by agents who got tired of the hard sell', subheading: 'Our story, our mission, and the team behind it.', bgColor: '#1e3a8a', textColor: '#ffffff', align: 'center' }),
          blk('text', { heading: 'Our story', body: 'Harborview Realty started in 2009 when our founder, tired of watching clients get pushed into homes that didn\'t fit their budget or their life, decided to build an agency around a simpler idea: tell people the truth, even when it costs you a commission. Fifteen years later, we\'ve grown from a two-desk office above a bakery to a team of twelve agents — but the rule hasn\'t changed.' }),
          blk('text', { heading: 'Our mission', body: 'We believe buying or selling a home should feel like getting advice from a friend who happens to know the market cold — not being sold to. Every listing we take, every offer we write, and every negotiation we run is judged against one question: is this actually in our client\'s best interest?' }),
          blk('image', { url: heroImg, alt: 'Harborview Realty team', caption: 'Part of the Harborview team at our downtown office.' }),
          blk('features', { heading: 'The people behind Harborview', items: [
            { icon: '👩', title: 'Amara Chen, Founder & Principal Broker', desc: '15+ years in residential real estate; leads our pricing strategy and top-tier negotiations.' },
            { icon: '👨', title: 'Daniel Osei, Head of Buyer Services', desc: 'Specializes in first-time buyers — has walked over 300 families through their first purchase.' },
            { icon: '👩', title: 'Priya Nair, Listings & Marketing Lead', desc: 'Runs staging, photography, and pricing analysis for every listing we take on.' },
          ] }),
        ],
      },
      {
        role: 'services', slugSuffix: 'services', title: 'Our Services', navLabel: 'Services',
        metaDescription: 'Buying, selling, rental management, and property investment services from Harborview Realty.',
        imageQuery: 'real estate contract handshake',
        build: (heroImg) => [
          blk('hero', { heading: 'Whatever stage you\'re at, we\'ve done it before', subheading: 'Four core services, one accountable team.', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' }),
          blk('features', { heading: 'What we do', items: [
            { icon: '🔑', title: 'Buying a home', desc: 'From pre-approval to closing day, we handle scheduling, negotiation, and paperwork so you can focus on finding the right place.' },
            { icon: '🏷️', title: 'Selling your property', desc: 'Professional staging advice, photography, and a pricing strategy built on real comparable sales — not guesswork.' },
            { icon: '🏢', title: 'Rental & property management', desc: 'Tenant screening, rent collection, and maintenance coordination for landlords who want a hands-off portfolio.' },
            { icon: '📊', title: 'Investment consulting', desc: 'Cash-flow analysis and market forecasts for buyers building a rental property portfolio.' },
          ] }),
          blk('image', { url: heroImg, alt: 'Real estate agreement being signed', caption: '' }),
          blk('cta', { heading: 'Not sure which service you need?', body: 'Tell us what you\'re trying to do and we\'ll point you in the right direction — no obligation.', buttonText: 'Get in touch', buttonUrl: '__LINK:contact__', bgColor: '#f8fafc' }),
        ],
      },
      {
        role: 'portfolio', slugSuffix: 'listings', title: 'Featured Listings', navLabel: 'Listings',
        metaDescription: 'Featured property listings currently available through Harborview Realty.',
        imageQuery: 'luxury house interior living room',
        build: (heroImg) => [
          blk('hero', { heading: 'Featured listings', subheading: 'A sample of what\'s currently on the market with us.', bgColor: '#1e3a8a', textColor: '#ffffff', align: 'center' }),
          blk('image', { url: heroImg, alt: 'Living room interior', caption: '4-Bed Craftsman, Maple Street — $612,000' }),
          blk('text', { heading: '4-Bed Craftsman, Maple Street — $612,000', body: 'A fully renovated 1920s craftsman with the original woodwork intact, an updated kitchen, and a south-facing garden. Three blocks from the elementary school.' }),
          blk('text', { heading: '2-Bed Condo, Riverside Tower — $349,000', body: 'A top-floor unit with river views, in-unit laundry, and secure parking. Building amenities include a gym and rooftop terrace.' }),
          blk('text', { heading: 'Downtown Retail + Loft, 5th Ave — $780,000', body: 'Ground-floor commercial space with a two-bedroom loft above — ideal for an owner-operator or investor seeking mixed-use income.' }),
          blk('cta', { heading: 'Want to see the full listing sheet?', body: 'Ask about any property above, or tell us what you\'re looking for and we\'ll send matches directly.', buttonText: 'Ask about a listing', buttonUrl: '__LINK:contact__', bgColor: '#f8fafc' }),
        ],
      },
      {
        role: 'testimonials', slugSuffix: 'testimonials', title: 'Client Stories', navLabel: 'Testimonials',
        metaDescription: 'What Harborview Realty clients say after buying, selling, or renting with us.',
        build: () => [
          blk('hero', { heading: 'What our clients say', subheading: 'Real feedback from recent buyers, sellers, and landlords.', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' }),
          blk('testimonials', { heading: '', items: [
            { quote: 'Daniel walked us through our first purchase like he had all the time in the world, even when we changed our minds twice. We closed on a house we actually love.', author: 'Grace M.', role: 'First-time buyer' },
            { quote: 'Priya\'s pricing call was spot on — we had three offers within a week of listing, all above asking.', author: 'Tunde A.', role: 'Home seller' },
            { quote: 'I manage four rental units through Harborview now. Maintenance requests get handled before I even hear about them.', author: 'Sandra K.', role: 'Property investor' },
          ] }),
          blk('cta', { heading: 'Ready to write your own story?', body: '', buttonText: 'Start the conversation', buttonUrl: '__LINK:contact__', bgColor: '#f8fafc' }),
        ],
      },
      {
        role: 'contact', slugSuffix: 'contact', title: 'Contact Us', navLabel: 'Contact',
        metaDescription: 'Contact Harborview Realty — office address, phone, email, and hours.',
        build: () => [
          blk('hero', { heading: 'Let\'s talk about your next move', subheading: 'Reach out directly — a real agent will get back to you within one business day.', bgColor: '#1e3a8a', textColor: '#ffffff', align: 'center' }),
          blk('text', { heading: 'Office', body: 'Harborview Realty\n148 Maple Street, Suite 2\nRiverside, CA 92501' }),
          blk('text', { heading: 'Contact details', body: 'Phone: (555) 019-2244\nEmail: hello@harborviewrealty.example\nHours: Mon–Fri 9am–6pm, Sat 10am–2pm' }),
          blk('cta', { heading: 'Email us directly', body: 'We reply to every inquiry personally — no call centers.', buttonText: 'hello@harborviewrealty.example', buttonUrl: 'mailto:hello@harborviewrealty.example', bgColor: '#f8fafc' }),
        ],
      },
    ],
  },
  {
    category: 'SaaS & Tech Startups',
    name: 'Ledgerly — Full SaaS Product Site',
    description: 'A 6-page SaaS site: home, about, platform, testimonials, blog, and contact.',
    pages: [
      {
        role: 'home', slugSuffix: '', title: 'Ledgerly', navLabel: 'Home',
        metaDescription: 'Ledgerly — bookkeeping software built for small teams who don\'t have a finance department.',
        imageQuery: 'saas dashboard software screen',
        build: (heroImg) => [
          blk('hero', { heading: 'Bookkeeping software for teams without a finance department', subheading: 'Ledgerly reconciles your accounts, flags what needs attention, and gets out of your way.', ctaText: 'Start free trial', ctaUrl: '#', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' }),
          blk('image', { url: heroImg, alt: 'Ledgerly dashboard', caption: '' }),
          blk('features', { heading: 'Why teams switch to Ledgerly', items: [
            { icon: '⚡', title: 'Auto-reconciliation', desc: 'Bank feeds match against invoices automatically — most months need zero manual review.' },
            { icon: '📊', title: 'Reports that make sense', desc: 'Cash flow, P&L, and runway — in plain language, not accountant jargon.' },
            { icon: '🔌', title: 'Connects to what you use', desc: 'Stripe, bank feeds, and payroll sync natively, no CSV exports required.' },
          ] }),
          blk('cta', { heading: 'See your real numbers in 10 minutes', body: 'Connect your bank account and get your first reconciled report today.', buttonText: 'Start free trial', buttonUrl: '#', bgColor: '#f8fafc' }),
        ],
      },
      {
        role: 'about', slugSuffix: 'about', title: 'About Ledgerly', navLabel: 'About',
        metaDescription: 'The story, mission, and team behind Ledgerly.',
        imageQuery: 'startup team working office',
        build: (heroImg) => [
          blk('hero', { heading: 'We built the tool we couldn\'t find', subheading: 'Our story, our mission, and the team behind it.', bgColor: '#1e3a8a', textColor: '#ffffff', align: 'center' }),
          blk('text', { heading: 'Our story', body: 'Ledgerly started as a spreadsheet. Our founder was running finance for a 12-person startup and reconciling transactions by hand every Friday night, using tools built for accounting firms with dedicated staff. In 2021 we set out to build something different: bookkeeping software for the other 99% of small businesses that don\'t have a controller on staff.' }),
          blk('text', { heading: 'Our mission', body: 'Every small business deserves to know, in plain language, whether they made money last month — without hiring an accountant to find out. We measure our success by how rarely our customers need to open a spreadsheet.' }),
          blk('image', { url: heroImg, alt: 'Ledgerly team working', caption: 'The Ledgerly team, remote-first since day one.' }),
          blk('features', { heading: 'The people behind Ledgerly', items: [
            { icon: '👩', title: 'Fatima Al-Rashid, Founder & CEO', desc: 'Former startup finance lead; built the first version of Ledgerly for her own team.' },
            { icon: '👨', title: 'Marcus Webb, Head of Engineering', desc: 'Leads the bank-integration and reconciliation engine that powers every account.' },
            { icon: '👩', title: 'Jade Lin, Head of Customer Success', desc: 'Onboards every new team personally for their first 30 days.' },
          ] }),
        ],
      },
      {
        role: 'services', slugSuffix: 'platform', title: 'The Platform', navLabel: 'Platform',
        metaDescription: 'What\'s included in the Ledgerly platform — reconciliation, reporting, payroll sync, and integrations.',
        imageQuery: 'financial technology charts analytics',
        build: (heroImg) => [
          blk('hero', { heading: 'Everything your books need, nothing you have to babysit', subheading: '', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' }),
          blk('features', { heading: 'Core platform', items: [
            { icon: '🏦', title: 'Bank feed reconciliation', desc: 'Live feeds from over 9,000 banks, auto-matched against your invoices and expenses.' },
            { icon: '📄', title: 'Invoicing & expenses', desc: 'Send invoices and log expenses from the same place your books already live.' },
            { icon: '👥', title: 'Payroll sync', desc: 'Connects to major payroll providers so payroll runs post to your books automatically.' },
            { icon: '📈', title: 'Real-time reporting', desc: 'P&L, balance sheet, and cash flow, always current — never a month-end scramble.' },
          ] }),
          blk('image', { url: heroImg, alt: 'Analytics dashboard', caption: '' }),
          blk('cta', { heading: 'See the platform in action', body: 'Start a free trial — no credit card, no sales call required.', buttonText: 'Start free trial', buttonUrl: '#', bgColor: '#f8fafc' }),
        ],
      },
      {
        role: 'testimonials', slugSuffix: 'testimonials', title: 'Customer Stories', navLabel: 'Testimonials',
        metaDescription: 'What Ledgerly customers say about switching their bookkeeping over.',
        build: () => [
          blk('hero', { heading: 'What our customers say', subheading: '', bgColor: '#1e3a8a', textColor: '#ffffff', align: 'center' }),
          blk('testimonials', { heading: '', items: [
            { quote: 'We switched from a spreadsheet to Ledgerly in an afternoon. I finally know our runway without asking our accountant to run a report.', author: 'Owen Price', role: 'Founder, small e-commerce brand' },
            { quote: 'The payroll sync alone saved us four hours a month of manual journal entries.', author: 'Bianca Ross', role: 'Operations lead, 18-person agency' },
            { quote: 'Support actually answers — Jade walked our whole team through migration personally.', author: 'Kwame Boateng', role: 'CEO, early-stage startup' },
          ] }),
        ],
      },
      {
        role: 'blog', slugSuffix: 'blog', title: 'Blog', navLabel: 'Blog',
        metaDescription: 'Practical bookkeeping and small business finance guidance from the Ledgerly team.',
        imageQuery: 'business finance writing notebook',
        build: (heroImg) => [
          blk('hero', { heading: 'From the Ledgerly blog', subheading: 'Practical finance guidance for teams without a finance department.', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' }),
          blk('image', { url: heroImg, alt: 'Finance notes', caption: '' }),
          blk('text', { heading: 'Reading your P&L in five minutes a month', body: 'You don\'t need an accounting degree to know if your business made money — here\'s the three-line version every founder should check monthly.' }),
          blk('text', { heading: 'When to hire your first bookkeeper (and when not to)', body: 'Most teams under 15 people don\'t need a bookkeeper — they need better tools. Here\'s how to tell which stage you\'re at.' }),
          blk('text', { heading: 'Reconciliation, explained without the jargon', body: 'What "reconciling your books" actually means, why it matters for fundraising, and how to automate most of it.' }),
        ],
      },
      {
        role: 'contact', slugSuffix: 'contact', title: 'Contact Us', navLabel: 'Contact',
        metaDescription: 'Contact the Ledgerly team — sales, support, and general inquiries.',
        build: () => [
          blk('hero', { heading: 'Talk to the team', subheading: 'Sales questions, support requests, or just curious — we read every message.', bgColor: '#1e3a8a', textColor: '#ffffff', align: 'center' }),
          blk('text', { heading: 'Support', body: 'Email: support@ledgerly.example\nAverage first response time: under 4 business hours.' }),
          blk('text', { heading: 'Sales', body: 'Email: sales@ledgerly.example\nWant a live walkthrough first? Ask and we\'ll set one up.' }),
          blk('cta', { heading: 'Email us directly', body: '', buttonText: 'hello@ledgerly.example', buttonUrl: 'mailto:hello@ledgerly.example', bgColor: '#f8fafc' }),
        ],
      },
    ],
  },
  {
    category: 'Restaurants & Food Delivery',
    name: 'Basil & Ember — Full Restaurant Site',
    description: 'A 6-page restaurant site: home, about, menu, gallery, testimonials, and contact.',
    pages: [
      {
        role: 'home', slugSuffix: '', title: 'Basil & Ember', navLabel: 'Home',
        metaDescription: 'Basil & Ember — wood-fired, seasonal cooking in the heart of downtown.',
        imageQuery: 'restaurant interior cozy dining',
        build: (heroImg) => [
          blk('hero', { heading: 'Wood-fired cooking, seasonal ingredients, no shortcuts', subheading: 'Basil & Ember has been serving downtown since 2016 — reservations recommended on weekends.', ctaText: 'Reserve a table', ctaUrl: '__LINK:contact__', bgColor: '#3f1d0e', textColor: '#ffffff', align: 'center' }),
          blk('image', { url: heroImg, alt: 'Basil & Ember dining room', caption: '' }),
          blk('features', { heading: 'Why people keep coming back', items: [
            { icon: '🔥', title: 'Wood-fired everything', desc: 'Our oven runs at 900°F — it\'s not just for pizza, it\'s how we cook nearly everything on the menu.' },
            { icon: '🌿', title: 'Seasonal, local ingredients', desc: 'Our menu changes with what\'s actually good right now, sourced from three regional farms.' },
            { icon: '🍷', title: 'A wine list worth exploring', desc: 'Hand-picked by our sommelier, with a strong focus on small independent producers.' },
          ] }),
          blk('cta', { heading: 'Hungry yet?', body: 'See tonight\'s menu or book a table for this weekend.', buttonText: 'View the menu', buttonUrl: '__LINK:services__', bgColor: '#f8fafc' }),
        ],
      },
      {
        role: 'about', slugSuffix: 'about', title: 'Our Story', navLabel: 'About',
        metaDescription: 'The story, mission, and team behind Basil & Ember.',
        imageQuery: 'chef cooking kitchen restaurant',
        build: (heroImg) => [
          blk('hero', { heading: 'A kitchen built around one oven', subheading: 'Our story, our mission, and the people behind it.', bgColor: '#3f1d0e', textColor: '#ffffff', align: 'center' }),
          blk('text', { heading: 'Our story', body: 'Basil & Ember opened in 2016 in a converted auto shop downtown, built around a single wood-fired oven that chef-owner Elena Marchetti had shipped from Naples. What started as a 20-seat pizza spot has grown into a full kitchen, but the oven is still the heart of the restaurant — nearly everything that leaves the kitchen has touched its fire at some point.' }),
          blk('text', { heading: 'Our mission', body: 'We cook what\'s in season, from farms we actually visit, using techniques that don\'t cut corners. No microwaves in this kitchen, no shortcuts on the menu — if it takes three days to make the dough right, it takes three days.' }),
          blk('image', { url: heroImg, alt: 'Chef at the wood-fired oven', caption: 'Chef Elena Marchetti at the oven that started it all.' }),
          blk('features', { heading: 'The team', items: [
            { icon: '👩‍🍳', title: 'Elena Marchetti, Chef & Owner', desc: 'Trained in Naples; opened Basil & Ember around the oven she brought back with her.' },
            { icon: '👨‍🍳', title: 'Ravi Desai, Sous Chef', desc: 'Runs the seasonal menu changes and sources from our three partner farms.' },
            { icon: '🍷', title: 'Clara Dubois, Sommelier & Floor Manager', desc: 'Built our wine list from scratch around independent producers.' },
          ] }),
        ],
      },
      {
        role: 'services', slugSuffix: 'menu', title: 'Menu Highlights', navLabel: 'Menu',
        metaDescription: 'A look at what\'s currently on the menu at Basil & Ember.',
        imageQuery: 'wood fired pizza food plate',
        build: (heroImg) => [
          blk('hero', { heading: 'Tonight\'s menu, built around the season', subheading: 'A sample of what\'s currently on offer — the full menu changes monthly.', bgColor: '#3f1d0e', textColor: '#ffffff', align: 'center' }),
          blk('image', { url: heroImg, alt: 'Wood-fired pizza', caption: '' }),
          blk('features', { heading: 'Current highlights', items: [
            { icon: '🍕', title: 'Wood-fired margherita', desc: 'San Marzano tomato, fresh mozzarella, basil, 900°F for 90 seconds.' },
            { icon: '🍝', title: 'Handmade tagliatelle', desc: 'Wild mushroom ragù, made fresh daily — sells out most nights.' },
            { icon: '🥗', title: 'Charred autumn salad', desc: 'Roasted squash, radicchio, candied walnuts, sourced from Hollow Creek Farm.' },
            { icon: '🍮', title: 'Basque burnt cheesecake', desc: 'Our most-requested dessert since day one — not on the printed menu, always available.' },
          ] }),
          blk('cta', { heading: 'Ready to book?', body: 'Weekend tables go fast — reserve a few days ahead if you can.', buttonText: 'Reserve a table', buttonUrl: '__LINK:contact__', bgColor: '#f8fafc' }),
        ],
      },
      {
        role: 'portfolio', slugSuffix: 'gallery', title: 'Gallery', navLabel: 'Gallery',
        metaDescription: 'Photos from inside Basil & Ember — the dining room, the kitchen, and the food.',
        imageQuery: 'fine dining food plating',
        build: (heroImg) => [
          blk('hero', { heading: 'A look inside', subheading: 'The dining room, the kitchen, and what comes out of it.', bgColor: '#3f1d0e', textColor: '#ffffff', align: 'center' }),
          blk('image', { url: heroImg, alt: 'Plated dish', caption: 'One of our seasonal small plates.' }),
          blk('text', { heading: '', body: 'Follow us on social media for weekly menu updates and behind-the-scenes shots from the kitchen — our menu changes often enough that photos here go out of date fast.' }),
        ],
      },
      {
        role: 'testimonials', slugSuffix: 'reviews', title: 'Reviews', navLabel: 'Reviews',
        metaDescription: 'What guests say about dining at Basil & Ember.',
        build: () => [
          blk('hero', { heading: 'What our guests say', subheading: '', bgColor: '#3f1d0e', textColor: '#ffffff', align: 'center' }),
          blk('testimonials', { heading: '', items: [
            { quote: 'The tagliatelle alone is worth the drive downtown. We\'ve been back four times this year.', author: 'Renee T.', role: 'Regular guest' },
            { quote: 'Best pizza crust in the city, full stop. The char on that oven does something microwaved ovens just can\'t.', author: 'Marcus D.', role: 'Local food blogger' },
            { quote: 'Booked for an anniversary dinner and the staff made it feel genuinely special without being stuffy about it.', author: 'Aisha K.', role: 'Guest' },
          ] }),
          blk('cta', { heading: 'Come see for yourself', body: '', buttonText: 'Reserve a table', buttonUrl: '__LINK:contact__', bgColor: '#f8fafc' }),
        ],
      },
      {
        role: 'contact', slugSuffix: 'contact', title: 'Reservations & Contact', navLabel: 'Contact',
        metaDescription: 'Reserve a table or contact Basil & Ember directly — address, phone, and hours.',
        build: () => [
          blk('hero', { heading: 'Reserve a table', subheading: 'Call, email, or walk in — weekends fill up fast.', bgColor: '#3f1d0e', textColor: '#ffffff', align: 'center' }),
          blk('text', { heading: 'Location', body: 'Basil & Ember\n212 Foundry Lane\nDowntown' }),
          blk('text', { heading: 'Hours & contact', body: 'Tue–Sun, 5pm–11pm (closed Mondays)\nPhone: (555) 048-7731\nEmail: hello@basilandember.example' }),
          blk('cta', { heading: 'Email us to reserve', body: '', buttonText: 'hello@basilandember.example', buttonUrl: 'mailto:hello@basilandember.example', bgColor: '#f8fafc' }),
        ],
      },
    ],
  },
];

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let sitesInserted = 0, sitesSkipped = 0, pagesInserted = 0;

  for (const [siteIdx, site] of SITES.entries()) {
    const { rows: existing } = await pool.query(`SELECT id FROM site_templates WHERE name = $1`, [site.name]);
    if (existing.length) {
      console.log(`Skipping site "${site.name}" (already seeded)`);
      sitesSkipped += 1;
      continue;
    }

    // Resolve link placeholders (__LINK:role__) to nav_label-based hrefs once all
    // slug_suffixes are known, so cross-page CTAs point at the right page.
    const slugByRole = {};
    for (const p of site.pages) slugByRole[p.role] = p.slugSuffix;

    console.log(`\nBuilding site "${site.name}" (${site.pages.length} pages)...`);
    const { rows: siteRows } = await pool.query(
      `INSERT INTO site_templates (category, name, description, sort_order) VALUES ($1,$2,$3,$4) RETURNING id`,
      [site.category, site.name, site.description, siteIdx]
    );
    const siteTemplateId = siteRows[0].id;

    for (const [pageIdx, p] of site.pages.entries()) {
      let heroImg = '';
      if (p.imageQuery) {
        console.log(`  Fetching image for "${p.title}" ("${p.imageQuery}")...`);
        heroImg = await img(p.imageQuery);
      }
      let blocks = p.build(heroImg);
      // Resolve __LINK:role__ placeholders to relative page-role markers; the
      // real /p/<slug> href is filled in at use-time (useSiteTemplate), since
      // the final slug depends on the org's chosen site name. Store as a
      // simple {{role}} token the frontend/backend both understand: here we
      // just leave a same-site relative anchor the use-flow rewrites.
      blocks = JSON.parse(
        JSON.stringify(blocks).replace(/__LINK:([a-z]+)__/g, (_, role) => `{{page:${role}}}`)
      );
      await pool.query(
        `INSERT INTO site_template_pages (site_template_id, page_role, slug_suffix, title, nav_label, meta_description, blocks, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [siteTemplateId, p.role, p.slugSuffix, p.title, p.navLabel, p.metaDescription || null, JSON.stringify(blocks), pageIdx]
      );
      pagesInserted += 1;
      console.log(`  ✓ "${p.title}" (${p.role})`);
    }
    sitesInserted += 1;
  }

  console.log(`\nDone. Sites inserted: ${sitesInserted}, skipped: ${sitesSkipped}, pages inserted: ${pagesInserted}.`);
  await pool.end();
})().catch((err) => { console.error(err); process.exit(1); });
