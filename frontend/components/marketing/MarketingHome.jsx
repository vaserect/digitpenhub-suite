'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MarketingNav from './MarketingNav';
import MarketingFooter from './MarketingFooter';

const CATEGORIES = [
  { name: 'Marketing', desc: 'CRM, funnels, websites, email/SMS/WhatsApp campaigns, forms, popups, booking.', icon: '📣' },
  { name: 'AI', desc: 'Writer, chatbot builder, translator, proposal generator, meeting notes, support assistant.', icon: '✨' },
  { name: 'SEO', desc: 'Keyword research, rank tracking, audits, backlink monitoring, schema & meta tools.', icon: '🔍' },
  { name: 'Creative', desc: 'Design editor, brand kit, logo maker, flyers, certificates, resumes, video editor.', icon: '🎨' },
  { name: 'Business', desc: 'Accounting, invoicing, payroll, inventory, POS, HR, recruitment, help desk.', icon: '💼' },
  { name: 'Commerce', desc: 'Online store, marketplace, orders, coupons, subscriptions, digital products.', icon: '🛒' },
  { name: 'Education', desc: 'LMS, school management, CBT platform, student/teacher/parent portals.', icon: '🎓' },
  { name: 'Productivity', desc: 'Calendar, notes, file manager, workflow automation, time tracking.', icon: '⚡' },
  { name: 'Analytics', desc: 'Business, marketing, and sales dashboards, website analytics, custom reports.', icon: '📊' },
  { name: 'Utilities', desc: 'PDF tools, converters, barcode/QR generators, password manager, and more.', icon: '🛠️' },
];

// Falls back to this copy if the CMS fetch fails or a key was never set —
// so a network hiccup degrades to "the previous good copy," never a blank
// or broken-looking hero. These strings match what's seeded as the CMS
// defaults in backend/db/067_admin_editorial_and_whitelabel.sql.
const DEFAULTS = {
  'homepage.hero.eyebrow': 'One login. Every part of your business.',
  'homepage.hero.title': "Stop paying for eleven tools that don't talk to each other.",
  'homepage.hero.subtitle': "Digitpen Hub replaces your CRM, website builder, email/SMS marketing, invoicing, HR, and analytics stack with one connected suite — so a contact who fills out a form, gets invoiced, and books a call shows up as one person with one history, not three disconnected records in three different apps.",
  'homepage.hero.cta_primary': 'Start free — no card required',
  'homepage.value.title': '97 modules. One dataset. Zero busywork stitching them together.',
  'homepage.value.body': "Every module shares the same contacts, the same billing, and the same login — so automations, reports, and your team's day-to-day work span the whole business instead of stopping at the edge of one app.",
};

export default function MarketingHome() {
  const [content, setContent] = useState(DEFAULTS);

  useEffect(() => {
    fetch('/api/v1/content/public')
      .then((r) => r.json())
      .then((d) => { if (d.content) setContent((prev) => ({ ...prev, ...d.content })); })
      .catch(() => {});
  }, []);

  return (
    <div className="mkt-page">
      <MarketingNav />

      <section className="mkt-hero">
        <div className="mkt-hero-inner">
          <span className="mkt-eyebrow">{content['homepage.hero.eyebrow']}</span>
          <h1>{content['homepage.hero.title']}</h1>
          <p className="mkt-hero-sub">{content['homepage.hero.subtitle']}</p>
          <div className="mkt-hero-actions">
            <Link href="/signup" className="btn btn-primary btn-lg">{content['homepage.hero.cta_primary']}</Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">See pricing</Link>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <h2>{content['homepage.value.title']}</h2>
        <p className="mkt-section-sub">{content['homepage.value.body']}</p>
        <div className="mkt-cat-grid">
          {CATEGORIES.map((c) => (
            <div className="mkt-cat-card" key={c.name}>
              <div className="mkt-cat-icon">{c.icon}</div>
              <div className="mkt-cat-name">{c.name}</div>
              <div className="mkt-cat-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mkt-section mkt-section-alt">
        <h2>Built for teams that outgrew spreadsheets and disconnected tools</h2>
        <div className="mkt-value-grid">
          <div className="mkt-value-card">
            <div className="mkt-value-title">One workspace, real roles</div>
            <p>Invite your team with owner/admin/member roles, a real audit log, and session management — not a shared login.</p>
          </div>
          <div className="mkt-value-card">
            <div className="mkt-value-title">Your data stays connected</div>
            <p>A lead captured through a landing page shows up in your CRM, can trigger an email sequence, and becomes an invoice — without exporting a single CSV between tools.</p>
          </div>
          <div className="mkt-value-card">
            <div className="mkt-value-title">AI where it actually helps</div>
            <p>Generate on-brand copy, translate content, and draft proposals from inside the tools you're already using, not a separate app.</p>
          </div>
          <div className="mkt-value-card">
            <div className="mkt-value-title">Security you can hand to IT</div>
            <p>Two-factor authentication, visible active-session management, and a full audit trail come standard on every plan.</p>
          </div>
        </div>
      </section>

      <section className="mkt-cta-band">
        <h2>Bring your business online in one place, today.</h2>
        <p>Start on the free plan. Upgrade only when your team needs more seats or send volume.</p>
        <Link href="/signup" className="btn btn-primary btn-lg">Create your free workspace</Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
