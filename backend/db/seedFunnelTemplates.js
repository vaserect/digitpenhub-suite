// Funnel template seed — 12 templates composed from page_template names.
// Idempotent: skips existing names.
require('dotenv').config();
const { Pool } = require('pg');

const FUNNELS = [
  {
    category: 'Lead Generation',
    name: 'Free E-Book Download Funnel',
    description: 'A simple opt-in funnel: landing page → download page with upsell.',
    steps: [
      { type: 'page', template: 'Lead Magnet Opt-In Landing Page' },
      { type: 'optin', template: 'Thank You / Download Page' },
      { type: 'upsell', template: 'Product Launch Landing Page' },
    ],
  },
  {
    category: 'Lead Generation',
    name: 'Webinar Registration Funnel',
    description: 'Promote a webinar, capture registrations, and sell the replay.',
    steps: [
      { type: 'page', template: 'Event Registration Landing Page' },
      { type: 'optin', template: 'Thank You / Download Page' },
      { type: 'thankyou', template: 'Event Registration Landing Page' },
    ],
  },
  {
    category: 'Sales',
    name: 'Product Launch Tripwire',
    description: 'Low-ticket tripwire offer followed by a high-ticket upsell.',
    steps: [
      { type: 'page', template: 'Product Launch Landing Page' },
      { type: 'upsell', template: 'SaaS Pricing Page' },
      { type: 'downsell', template: 'SaaS Pricing Page' },
      { type: 'thankyou', template: 'Thank You / Download Page' },
    ],
  },
  {
    category: 'Sales',
    name: 'Free Consultation Booking Funnel',
    description: 'Capture leads through a free consultation offer with a call-booking upsell.',
    steps: [
      { type: 'page', template: 'Lead Magnet Opt-In Landing Page' },
      { type: 'optin', template: 'Thank You / Download Page' },
      { type: 'upsell', template: 'Coaching or Consulting Landing Page' },
    ],
  },
  {
    category: 'Sales',
    name: 'High-Ticket Application Funnel',
    description: 'Presell a high-ticket offer through an application and call-booking process.',
    steps: [
      { type: 'page', template: 'Coaching or Consulting Landing Page' },
      { type: 'page', template: 'Event Registration Landing Page' },
      { type: 'thankyou', template: 'Thank You / Download Page' },
    ],
  },
  {
    category: 'Webinar & Event',
    name: 'Live Workshop Registration Funnel',
    description: 'Register attendees for a live workshop with an early-bird upsell.',
    steps: [
      { type: 'page', template: 'Event Registration Landing Page' },
      { type: 'upsell', template: 'SaaS Pricing Page' },
      { type: 'thankyou', template: 'Event Registration Landing Page' },
    ],
  },
  {
    category: 'Webinar & Event',
    name: 'Summit / Multi-Speaker Event Funnel',
    description: 'Multi-day virtual summit registration with VIP upgrade path.',
    steps: [
      { type: 'page', template: 'Event Registration Landing Page' },
      { type: 'upsell', template: 'SaaS Pricing Page' },
      { type: 'thankyou', template: 'Event Registration Landing Page' },
    ],
  },
  {
    category: 'Course & Education',
    name: 'Free Mini-Course Launch Funnel',
    description: 'A free mini-course opt-in with a paid full-course upsell.',
    steps: [
      { type: 'page', template: 'Lead Magnet Opt-In Landing Page' },
      { type: 'optin', template: 'Thank You / Download Page' },
      { type: 'upsell', template: 'Online Course Landing Page' },
    ],
  },
  {
    category: 'Course & Education',
    name: 'Paid Course Enrollment Funnel',
    description: 'Full-course sales funnel with payment plan upsell.',
    steps: [
      { type: 'page', template: 'Online Course Landing Page' },
      { type: 'upsell', template: 'SaaS Pricing Page' },
      { type: 'thankyou', template: 'Thank You / Download Page' },
    ],
  },
  {
    category: 'Membership & Community',
    name: 'Free Trial → Paid Membership Funnel',
    description: 'Free trial signup with a paid membership upsell after opt-in.',
    steps: [
      { type: 'page', template: 'Lead Magnet Opt-In Landing Page' },
      { type: 'upsell', template: 'SaaS Pricing Page' },
      { type: 'thankyou', template: 'Thank You / Download Page' },
    ],
  },
  {
    category: 'Membership & Community',
    name: 'Community Waitlist → Launch Funnel',
    description: 'Build anticipation with a waitlist, then open doors with a launch promotion.',
    steps: [
      { type: 'page', template: 'Lead Magnet Opt-In Landing Page' },
      { type: 'page', template: 'Product Launch Landing Page' },
      { type: 'upsell', template: 'SaaS Pricing Page' },
    ],
  },
  {
    category: 'Real Estate & Local',
    name: 'Property Viewing Booking Funnel',
    description: 'Capture interest, showcase a property, and book a viewing appointment.',
    steps: [
      { type: 'page', template: 'Property Listing Landing Page' },
      { type: 'optin', template: 'Thank You / Download Page' },
      { type: 'thankyou', template: 'Property Listing Landing Page' },
    ],
  },
];

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let inserted = 0, skipped = 0;

  for (const f of FUNNELS) {
    const { rows: existing } = await pool.query('SELECT 1 FROM funnel_templates WHERE name = $1', [f.name]);
    if (existing.length) { skipped++; continue; }

    const { rows: template } = await pool.query(
      `INSERT INTO funnel_templates (category, name, description) VALUES ($1,$2,$3) RETURNING id`,
      [f.category, f.name, f.description]
    );
    const templateId = template[0].id;

    for (let i = 0; i < f.steps.length; i++) {
      const step = f.steps[i];
      await pool.query(
        `INSERT INTO funnel_template_steps (funnel_template_id, step_order, step_type, page_template_name)
         VALUES ($1,$2,$3,$4)`,
        [templateId, i, step.type, step.template]
      );
    }
    inserted++;
    console.log(`  ✓ "${f.name}" (${f.steps.length} steps)`);
  }

  console.log(`\nDone. Inserted ${inserted}, skipped ${skipped} (already existed).`);
  await pool.end();
})().catch((err) => { console.error(err); process.exit(1); });
