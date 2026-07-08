'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MarketingNav from '../../components/marketing/MarketingNav';
import MarketingFooter from '../../components/marketing/MarketingFooter';

// Falls back to this copy if the CMS fetch fails or a key was never set —
// so a network hiccup (or a not-yet-applied migration) degrades to "the
// previous good copy," never a blank or broken-looking hero. These strings
// match what's seeded as the CMS defaults in
// backend/db/081_features_pricing_content.sql.
const DEFAULTS = {
  'features.hero.eyebrow': 'Features',
  'features.hero.title': 'Everything a growing business needs, under one roof.',
  'features.hero.subtitle': "97 modules, grouped by what you're actually trying to do — market, sell, manage, and analyze — not by which team built them.",
};

const GROUPS = [
  {
    name: 'Marketing & Sales',
    items: ['CRM with pipeline stages', 'Website & landing page builder with a 36-template starter library', 'Funnel builder', 'Email, SMS & WhatsApp marketing', 'Marketing automation workflows', 'Forms, popups, surveys & quizzes', 'Appointment booking', 'Affiliate & referral programs', 'Link-in-bio & digital business cards'],
  },
  {
    name: 'AI Tools',
    items: ['AI Writer', 'AI Chatbot Builder', 'AI Email Assistant', 'AI Proposal Generator', 'AI Translator', 'AI Meeting Notes', 'AI Knowledge Base & Customer Support'],
  },
  {
    name: 'Business Operations',
    items: ['Accounting & double-entry ledger', 'Invoicing & quotations', 'Expenses & payroll', 'Inventory & point-of-sale', 'HR, recruitment & asset management', 'Help desk & client portal'],
  },
  {
    name: 'Commerce',
    items: ['Online store builder', 'Multi-vendor marketplace', 'Order management, coupons & subscriptions', 'Digital products & delivery tracking'],
  },
  {
    name: 'Education',
    items: ['Learning management system', 'School management & CBT platform', 'Student, teacher & parent portals', 'Certificate generator'],
  },
  {
    name: 'Analytics & SEO',
    items: ['Business, marketing & sales dashboards', 'Custom reports', 'Keyword research & rank tracking', 'SEO audits & backlink monitoring'],
  },
  {
    name: 'Security & Team',
    items: ['Two-factor authentication', 'Session management & audit log', 'Role-based team invites (owner/admin/member)', 'Password manager'],
  },
];

export default function FeaturesPage() {
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

      <section className="mkt-hero mkt-hero-sm">
        <div className="mkt-hero-inner">
          <span className="mkt-eyebrow">{content['features.hero.eyebrow']}</span>
          <h1>{content['features.hero.title']}</h1>
          <p className="mkt-hero-sub">{content['features.hero.subtitle']}</p>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-feature-groups">
          {GROUPS.map((g) => (
            <div className="mkt-feature-group" key={g.name}>
              <h3>{g.name}</h3>
              <ul>
                {g.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mkt-cta-band">
        <h2>See it running with your own data.</h2>
        <p>Every module above is ready the moment you sign up — no waitlist, no setup call.</p>
        <Link href="/signup" className="btn btn-primary btn-lg">Create your free workspace</Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
