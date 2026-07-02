// Seeds the starter email campaign template library. Idempotent — skips any
// template name that already exists.
require('dotenv').config();
const { Pool } = require('pg');

function html(strings, ...values) {
  return strings.reduce((acc, s, i) => acc + s + (values[i] !== undefined ? values[i] : ''), '').trim();
}

const TEMPLATES = [
  {
    category: 'Newsletter',
    name: 'Monthly Newsletter',
    description: 'A clean roundup format for a regular monthly update.',
    subject: 'Your {{month}} update from {{company}}',
    previewText: "Here's what's new this month.",
    bodyHtml: html`
<h1>This Month at {{company}}</h1>
<p>Hi {{name}},</p>
<p>Here's a quick roundup of what's been happening.</p>
<h2>What's new</h2>
<ul>
  <li>Update one — a short description of the update.</li>
  <li>Update two — a short description of the update.</li>
  <li>Update three — a short description of the update.</li>
</ul>
<h2>Worth a read</h2>
<p>A short highlight of a blog post, case study, or resource worth sharing.</p>
<p>Thanks for being part of our community.</p>
<p>— The {{company}} team</p>`,
  },
  {
    category: 'Newsletter',
    name: 'Weekly Digest',
    description: 'A shorter, scannable weekly update format.',
    subject: '{{company}} weekly: {{topic}}',
    previewText: 'A quick 2-minute read to keep you in the loop.',
    bodyHtml: html`
<h1>This Week</h1>
<p>Hi {{name}}, here's your 2-minute weekly digest.</p>
<p><strong>Top story:</strong> A one-line summary of the week's most important update.</p>
<p><strong>Also worth knowing:</strong></p>
<ul>
  <li>Quick item one</li>
  <li>Quick item two</li>
</ul>
<p>See you next week.</p>`,
  },
  {
    category: 'Promotional & Sales',
    name: 'Seasonal Sale Announcement',
    description: 'A high-urgency promo email for a limited-time sale.',
    subject: '{{discount}}% off everything — this week only',
    previewText: "Don't miss out — sale ends {{endDate}}.",
    bodyHtml: html`
<h1 style="color:#dc2626;">{{discount}}% OFF Everything</h1>
<p>Hi {{name}},</p>
<p>For a limited time, take <strong>{{discount}}% off</strong> your entire order — no code needed, discount applied at checkout.</p>
<p style="text-align:center;"><a href="{{shopUrl}}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">Shop the Sale</a></p>
<p>Offer ends {{endDate}}. Don't wait.</p>`,
  },
  {
    category: 'Promotional & Sales',
    name: 'Abandoned Cart Reminder',
    description: 'A friendly nudge to recover an abandoned checkout.',
    subject: 'You left something in your cart',
    previewText: 'Your items are still waiting for you.',
    bodyHtml: html`
<h1>Still thinking it over?</h1>
<p>Hi {{name}},</p>
<p>We noticed you left some items in your cart. They're still available, but they won't wait forever.</p>
<p style="text-align:center;"><a href="{{cartUrl}}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">Complete Your Order</a></p>
<p>Questions? Just reply to this email — we're happy to help.</p>`,
  },
  {
    category: 'Welcome & Onboarding',
    name: 'Welcome Email',
    description: 'The first email a new subscriber or customer receives.',
    subject: 'Welcome to {{company}}, {{name}}!',
    previewText: "Here's how to get started.",
    bodyHtml: html`
<h1>Welcome, {{name}}!</h1>
<p>We're thrilled to have you. Here's how to get the most out of {{company}}:</p>
<ol>
  <li>Complete your profile</li>
  <li>Explore your dashboard</li>
  <li>Invite your team</li>
</ol>
<p style="text-align:center;"><a href="{{dashboardUrl}}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">Get Started</a></p>
<p>If you have any questions, just reply — a real person will get back to you.</p>`,
  },
  {
    category: 'Welcome & Onboarding',
    name: 'Getting Started Checklist',
    description: 'A follow-up onboarding email with a setup checklist.',
    subject: "You're 3 steps away from getting the most out of {{company}}",
    previewText: 'Finish setting up your account in under 5 minutes.',
    bodyHtml: html`
<h1>Let's finish setting up your account</h1>
<p>Hi {{name}}, you're almost there. Here's what's left:</p>
<p>✅ Step 1: Create your account<br/>
⬜ Step 2: {{stepTwo}}<br/>
⬜ Step 3: {{stepThree}}</p>
<p style="text-align:center;"><a href="{{setupUrl}}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">Finish Setup</a></p>`,
  },
  {
    category: 'Re-engagement',
    name: 'We Miss You',
    description: 'A win-back email for inactive subscribers or customers.',
    subject: 'We miss you, {{name}}',
    previewText: "It's been a while — here's something to bring you back.",
    bodyHtml: html`
<h1>It's been a while, {{name}}</h1>
<p>We noticed you haven't been around lately. As a welcome back, here's {{offer}} on us.</p>
<p style="text-align:center;"><a href="{{ctaUrl}}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">Come Back</a></p>
<p>Not interested anymore? No hard feelings — you can unsubscribe below.</p>`,
  },
  {
    category: 'Re-engagement',
    name: 'Feedback Request',
    description: 'A survey/feedback request to re-engage and learn from quiet users.',
    subject: 'Got 2 minutes, {{name}}?',
    previewText: 'Your feedback shapes what we build next.',
    bodyHtml: html`
<h1>We'd love your feedback</h1>
<p>Hi {{name}}, you've been with us a while and we'd love to know how it's going.</p>
<p>Could you spare 2 minutes to answer a few quick questions?</p>
<p style="text-align:center;"><a href="{{surveyUrl}}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">Share Feedback</a></p>
<p>Thank you — it genuinely helps.</p>`,
  },
  {
    category: 'Product Announcement',
    name: 'New Feature Launch',
    description: 'An announcement email for a new product feature.',
    subject: 'New: {{featureName}} is here',
    previewText: "Here's what it does and how to try it.",
    bodyHtml: html`
<h1>Introducing {{featureName}}</h1>
<p>Hi {{name}},</p>
<p>We just shipped something we think you'll love: <strong>{{featureName}}</strong>.</p>
<p>{{featureDescription}}</p>
<p style="text-align:center;"><a href="{{tryUrl}}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">Try It Now</a></p>`,
  },
  {
    category: 'Product Announcement',
    name: 'Product Update Roundup',
    description: 'A summary email for a batch of smaller updates/fixes.',
    subject: "What's new this release",
    previewText: 'Improvements, fixes, and small delights.',
    bodyHtml: html`
<h1>What's new</h1>
<p>Hi {{name}}, here's what shipped recently:</p>
<ul>
  <li><strong>Improved:</strong> {{improvement1}}</li>
  <li><strong>Added:</strong> {{addition1}}</li>
  <li><strong>Fixed:</strong> {{fix1}}</li>
</ul>
<p>As always, thanks for the feedback that shapes these updates.</p>`,
  },
  {
    category: 'Event Invitation',
    name: 'Webinar Invitation',
    description: 'An invite email for an upcoming webinar or live event.',
    subject: "You're invited: {{eventName}}",
    previewText: 'Save your seat — {{eventDate}}.',
    bodyHtml: html`
<h1>You're invited to {{eventName}}</h1>
<p>Hi {{name}},</p>
<p>Join us on <strong>{{eventDate}}</strong> for a live session on {{eventTopic}}.</p>
<p style="text-align:center;"><a href="{{registerUrl}}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">Save My Seat</a></p>
<p>Can't make it live? Register anyway and we'll send you the recording.</p>`,
  },
  {
    category: 'Event Invitation',
    name: 'Event Reminder',
    description: 'A follow-up reminder for registrants close to the event date.',
    subject: 'Reminder: {{eventName}} starts {{timeUntil}}',
    previewText: "Don't forget — here's the link.",
    bodyHtml: html`
<h1>See you soon!</h1>
<p>Hi {{name}}, just a reminder that <strong>{{eventName}}</strong> starts {{timeUntil}}.</p>
<p style="text-align:center;"><a href="{{joinUrl}}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">Join the Event</a></p>
<p>Add it to your calendar so you don't miss it.</p>`,
  },
];

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let inserted = 0;
  let skipped = 0;
  for (const [i, t] of TEMPLATES.entries()) {
    const { rows: existing } = await pool.query(`SELECT 1 FROM email_templates WHERE name = $1`, [t.name]);
    if (existing.length) { console.log(`Skipping "${t.name}" (already seeded)`); skipped += 1; continue; }
    await pool.query(
      `INSERT INTO email_templates (category, name, description, subject, preview_text, body_html, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [t.category, t.name, t.description, t.subject, t.previewText, t.bodyHtml, i]
    );
    console.log(`✓ Inserted "${t.name}"`);
    inserted += 1;
  }
  console.log(`\nDone. Inserted ${inserted}, skipped ${skipped}.`);
  await pool.end();
})().catch((err) => { console.error(err); process.exit(1); });
