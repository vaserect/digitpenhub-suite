'use client';

import { useEffect, useState, useRef } from 'react';
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

const STATS = [
  { value: '97', label: 'Integrated modules' },
  { value: '280', label: 'Active features' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '$0', label: 'To get started' },
];

const DEFAULTS = {
  'homepage.hero.eyebrow': 'One login. Every part of your business.',
  'homepage.hero.title': "Stop paying for eleven tools that don't talk to each other.",
  'homepage.hero.subtitle': "Digitpen Hub replaces your CRM, website builder, email/SMS marketing, invoicing, HR, and analytics stack with one connected suite — so a contact who fills out a form, gets invoiced, and books a call shows up as one person with one history, not three disconnected records in three different apps.",
  'homepage.hero.cta_primary': 'Start free — no card required',
  'homepage.value.title': '97 modules. One dataset. Zero busywork stitching them together.',
  'homepage.value.body': "Every module shares the same contacts, the same billing, and the same login — so automations, reports, and your team's day-to-day work span the whole business instead of stopping at the edge of one app.",
};

const SCENARIOS = [
  {
    title: 'From first touch to paid invoice',
    subtitle: 'One pipeline, not five apps',
    items: [
      'A lead submits a form on your landing page → appears in your CRM with their full history.',
      'They book a call through your scheduling page → the meeting is logged against their contact record automatically.',
      'You send a proposal → they sign it digitally → an invoice generates → payment is tracked — all inside the same platform.',
    ],
  },
  {
    title: 'Marketing campaigns that close the loop',
    subtitle: 'Attribution you can actually trace',
    items: [
      'Build an email sequence in the Email Marketing module → tag recipients by behaviour → score leads in CRM.',
      'Launch a WhatsApp broadcast → replies land in the Unified Inbox alongside email and chat messages.',
      'See which channel drove the most revenue — not just clicks — in the Marketing Dashboard.',
    ],
  },
  {
    title: 'Your team, your data, your rules',
    subtitle: 'Built for real organisations',
    items: [
      'Invite your team with role-based permissions — owner, admin, member — each scoped to the modules they actually use.',
      'Every action is logged to the audit trail. Session management, 2FA, and password policies are included on every plan.',
      'White-label the entire experience under your own brand and custom domain on the Business plan — your clients never see "Digitpen Hub."',
    ],
  },
];

export default function MarketingHome() {
  const [content, setContent] = useState(DEFAULTS);
  const [heroImg, setHeroImg] = useState(null);
  const [scenarioImgs, setScenarioImgs] = useState({});
  const featuredRef = useRef(null);

  useEffect(() => {
    fetch('/api/v1/content/public')
      .then((r) => r.json())
      .then((d) => { if (d.content) setContent((prev) => ({ ...prev, ...d.content })); })
      .catch(() => {});

    // Fetch hero image
    fetch('/api/v1/images/public/search?q=modern office workspace team collaboration&orientation=landscape&perPage=5')
      .then((r) => r.json())
      .then((d) => { if (d.images?.length) setHeroImg(d.images[Math.floor(Math.random() * Math.min(d.images.length, 3))]); })
      .catch(() => {});
  }, []);

  function scrollToFeatured() {
    featuredRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="mkt-page">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="mkt-hero">
        <div className="mkt-hero-bg">
          {heroImg && (
            <img
              src={heroImg.url}
              alt=""
              className="mkt-hero-image"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          )}
          <div className="mkt-hero-overlay" />
        </div>
        <div className="mkt-hero-inner">
          <span className="mkt-eyebrow">{content['homepage.hero.eyebrow']}</span>
          <h1>{content['homepage.hero.title']}</h1>
          <p className="mkt-hero-sub">{content['homepage.hero.subtitle']}</p>
          <div className="mkt-hero-actions">
            <Link href="/signup" className="btn btn-primary btn-lg">{content['homepage.hero.cta_primary']}</Link>
            <button className="btn btn-secondary btn-lg" onClick={scrollToFeatured}>See how it works</button>
          </div>
          <div className="mkt-hero-stats">
            {STATS.map((s) => (
              <div key={s.label} className="mkt-hero-stat">
                <span className="mkt-hero-stat-value">{s.value}</span>
                <span className="mkt-hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category grid ── */}
      <section className="mkt-section">
        <div className="mkt-section-header">
          <h2>{content['homepage.value.title']}</h2>
          <p className="mkt-section-sub">{content['homepage.value.body']}</p>
        </div>
        <div className="mkt-cat-grid">
          {CATEGORIES.map((c) => (
            <Link href="/features" className="mkt-cat-card" key={c.name}>
              <div className="mkt-cat-icon">{c.icon}</div>
              <div className="mkt-cat-name">{c.name}</div>
              <div className="mkt-cat-desc">{c.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Real-world scenarios ── */}
      <section className="mkt-section mkt-section-alt" ref={featuredRef}>
        <div className="mkt-section-header">
          <h2>How teams actually use it</h2>
          <p className="mkt-section-sub">Three workflows that would each need a separate subscription in any other stack.</p>
        </div>
        <div className="mkt-scenario-grid">
          {SCENARIOS.map((s, i) => (
            <div className="mkt-scenario-card" key={s.title}>
              <div className="mkt-scenario-number">{(i + 1).toString().padStart(2, '0')}</div>
              <div>
                <div className="mkt-scenario-title">{s.title}</div>
                <div className="mkt-scenario-subtitle">{s.subtitle}</div>
              </div>
              <ul className="mkt-scenario-list">
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Value props ── */}
      <section className="mkt-section">
        <h2>Built for teams that outgrew spreadsheets and disconnected tools</h2>
        <div className="mkt-value-grid">
          <div className="mkt-value-card">
            <div className="mkt-value-icon">🔗</div>
            <div className="mkt-value-title">One workspace, real roles</div>
            <p>Invite your team with owner/admin/member roles, a real audit log, and session management — not a shared login.</p>
          </div>
          <div className="mkt-value-card">
            <div className="mkt-value-icon">🔁</div>
            <div className="mkt-value-title">Your data stays connected</div>
            <p>A lead captured through a landing page shows up in your CRM, can trigger an email sequence, and becomes an invoice — without exporting a single CSV between tools.</p>
          </div>
          <div className="mkt-value-card">
            <div className="mkt-value-icon">🤖</div>
            <div className="mkt-value-title">AI where it actually helps</div>
            <p>Generate on-brand copy, translate content, and draft proposals from inside the tools you're already using, not a separate app.</p>
          </div>
          <div className="mkt-value-card">
            <div className="mkt-value-icon">🛡️</div>
            <div className="mkt-value-title">Security you can hand to IT</div>
            <p>Two-factor authentication, visible active-session management, and a full audit trail come standard on every plan.</p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mkt-cta-band">
        <h2>Bring your business online in one place, today.</h2>
        <p>Start on the free plan. Upgrade only when your team needs more seats or send volume.</p>
        <Link href="/signup" className="btn btn-primary btn-lg">Create your free workspace</Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
