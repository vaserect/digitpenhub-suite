'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MarketingNav from '../../components/marketing/MarketingNav';
import MarketingFooter from '../../components/marketing/MarketingFooter';

function formatNaira(amount) {
  if (!amount) return '₦0';
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

// Falls back to this copy if the CMS fetch fails or a key was never set —
// so a network hiccup (or a not-yet-applied migration) degrades to "the
// previous good copy," never a blank or broken-looking hero. These strings
// match what's seeded as the CMS defaults in
// backend/db/081_features_pricing_content.sql.
const DEFAULTS = {
  'pricing.hero.eyebrow': 'Pricing',
  'pricing.hero.title': "Start on CRM and invoicing for free. Unlock the rest when you're ready.",
  'pricing.hero.subtitle': "Free gets you a real CRM and invoicing, no card required. Starter and up unlock all 302 modules — the difference between plans is seats and usage limits, not which tools you're allowed to touch.",
};

export default function PricingPage() {
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(false);
  const [content, setContent] = useState(DEFAULTS);
  const [totalModules, setTotalModules] = useState(302);

  useEffect(() => {
    fetch('/api/v1/billing/plans')
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    fetch('/api/v1/content/public')
      .then((r) => r.json())
      .then((d) => { if (d.content) setContent((prev) => ({ ...prev, ...d.content })); })
      .catch(() => { console.error('Failed to load content'); });
  }, []);

  useEffect(() => {
    fetch('/api/v1/modules/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.totalModules) {
          setTotalModules(d.totalModules);
          setContent(prev => ({
            ...prev,
            'pricing.hero.subtitle': prev['pricing.hero.subtitle'].replace('97 modules', `${d.totalModules} modules`).replace('302 modules', `${d.totalModules} modules`)
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mkt-page">
      <MarketingNav />

      <section className="mkt-hero mkt-hero-sm">
        <div className="mkt-hero-inner">
          <span className="mkt-eyebrow">{content['pricing.hero.eyebrow']}</span>
          <h1>{content['pricing.hero.title']}</h1>
          <p className="mkt-hero-sub">{content['pricing.hero.subtitle']}</p>
        </div>
      </section>

      <section className="mkt-section">
        {error && <p className="empty-note">Couldn't load live pricing right now — please try again shortly.</p>}
        {!plans && !error && <p className="empty-note">Loading plans…</p>}
        {plans && (
          <div className="mkt-pricing-grid">
            {plans.map((p) => {
              const features = Array.isArray(p.features) ? p.features : (typeof p.features === 'string' ? JSON.parse(p.features || '[]') : []);
              return (
                <div className={`mkt-price-card${p.slug === 'growth' ? ' mkt-price-featured' : ''}`} key={p.id}>
                  {p.slug === 'growth' && <div className="mkt-price-badge">Most popular</div>}
                  <div className="mkt-price-name">{p.name}</div>
                  <div className="mkt-price-amount">{formatNaira(p.price_ngn)}<span>/month</span></div>
                  <div className="mkt-price-users">{p.max_users >= 999 ? 'Unlimited users' : `Up to ${p.max_users} user${p.max_users === 1 ? '' : 's'}`}</div>
                  <ul className="mkt-price-features">
                    {features.length ? features.map((f, i) => <li key={i}>{f}</li>) : <li>All {totalModules} modules included</li>}
                  </ul>
                  <Link href="/signup" className="btn btn-primary w-full">
                    {p.price_ngn === 0 ? 'Start free' : 'Start free, upgrade anytime'}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mkt-cta-band">
        <h2>Not sure which plan fits?</h2>
        <p>Start free — every plan can be upgraded from inside the app in a few clicks, no sales call required.</p>
        <Link href="/signup" className="btn btn-primary btn-lg">Create your free workspace</Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
