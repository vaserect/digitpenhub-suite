'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MarketingNav from '../../components/marketing/MarketingNav';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import MarketingCTA from '../../components/marketing/MarketingCTA';

const DEFAULTS = {
  'features.hero.title': 'Everything a growing business needs, under one roof.',
  'features.hero.subtitle': '302 modules, grouped by what you are actually trying to do — market, sell, manage, and analyze — not by which team built them.',
};

const GROUPS = [
  {
    name: 'Marketing & Sales', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    items: ['CRM with pipeline stages', 'Website builder (36 starter templates)', 'Funnel builder', 'Email, SMS & WhatsApp marketing', 'Marketing automation workflows', 'Forms, popups, surveys & quizzes', 'Appointment booking', 'Affiliate & referral programs', 'Link-in-bio & digital business cards'],
  },
  {
    name: 'AI Tools', icon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
    items: ['AI Writer', 'AI Chatbot Builder', 'AI Email Assistant', 'AI Proposal Generator', 'AI Translator', 'AI Meeting Notes', 'AI Knowledge Base & Support'],
  },
  {
    name: 'Business Operations', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    items: ['Accounting & double-entry ledger', 'Invoicing & quotations', 'Expenses & payroll', 'Inventory & POS', 'HR, recruitment & asset management', 'Help desk & client portal'],
  },
  {
    name: 'Commerce', icon: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z',
    items: ['Online store builder', 'Multi-vendor marketplace', 'Order management, coupons & subscriptions', 'Digital products & delivery tracking'],
  },
  {
    name: 'Education', icon: 'M22 10v6M2 10l10-5 10 5-10 5z',
    items: ['Learning management system', 'School management & CBT', 'Student, teacher & parent portals', 'Certificate generator'],
  },
  {
    name: 'Analytics & SEO', icon: 'M18 20V10M12 20V4M6 20v-6',
    items: ['Business dashboard & custom reports', 'SEO audits & keyword research', 'Rank tracking & backlink monitoring', 'Page speed & Core Web Vitals'],
  },
  {
    name: 'Security & Team', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    items: ['2FA & session management', 'RBAC team invites', 'Password manager', 'GDPR compliance & audit trail'],
  },
];

export default function FeaturesPage() {
  const [content, setContent] = useState(DEFAULTS);
  const [totalModules, setTotalModules] = useState(302);
  const [filter, setFilter] = useState('all');
  const [animateCount, setAnimateCount] = useState(false);

  useEffect(() => {
    fetch('/api/v1/content/public').then(r => r.json()).then(d => { if (d.content) setContent(p => ({...p, ...d.content})); }).catch(() => {});
    fetch('/api/v1/modules/stats').then(r => r.json()).then(d => { if (d.totalModules) setTotalModules(d.totalModules); setTimeout(() => setAnimateCount(true), 300); }).catch(() => {});
  }, []);

  const filtered = filter === 'all' ? GROUPS : GROUPS.filter(g => g.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      <MarketingNav />

      {/* Hero */}
      <section style={{
        padding: 'var(--space-8) var(--space-6)', textAlign: 'center',
        background: `
          radial-gradient(ellipse 60% 50% at 50% 20%, rgba(37,99,235,0.06), transparent),
          radial-gradient(ellipse 40% 40% at 80% 80%, rgba(56,189,248,0.04), transparent),
          var(--bg)
        `,
      }}>
        <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: 'var(--space-3)', padding: '4px 12px', borderRadius: 20, background: 'var(--accent-bg)' }}>
          {content['features.hero.eyebrow'] || 'Features'}
        </span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, color: 'var(--text)', maxWidth: 700, margin: '0 auto var(--space-2)', lineHeight: 1.15 }}>
          {content['features.hero.title']}
        </h1>
        <p style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1rem)', color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto var(--space-5)', lineHeight: 1.5 }}>
          {content['features.hero.subtitle']}
        </p>

        {/* Module count counter */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 'var(--space-5)', maxWidth: 500, margin: '0 auto', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
            {animateCount ? totalModules : '...'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>modules across 22 categories</div>
        </div>
      </section>

      {/* Filter tags */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '0 var(--space-6) var(--space-5)', flexWrap: 'wrap' }}>
        {['all', 'Marketing & Sales', 'AI Tools', 'Business', 'Commerce', 'Education', 'Security'].map(tag => (
          <button key={tag} onClick={() => setFilter(tag === 'all' ? 'all' : tag)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
              background: filter === tag || (tag !== 'all' && filter === tag) ? 'var(--accent-bg)' : 'transparent',
              color: filter === tag || (tag !== 'all' && filter === tag) ? 'var(--primary)' : 'var(--text)',
              border: filter === tag || (tag !== 'all' && filter === tag) ? '1px solid var(--primary)' : '1px solid var(--border)',
              transition: 'all .14s ease',
            }}>
            {tag === 'all' ? 'All features' : tag}
          </button>
        ))}
      </div>

      {/* Feature groups */}
      <section style={{ padding: '0 var(--space-6) var(--space-8)', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(group => (
            <div key={group.name} style={{
              background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 'var(--space-5)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-3)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <svg width="16" height="16" viewBox={`0 0 24 24`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d={group.icon} />
                  </svg>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{group.name}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {group.items.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--text)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" style={{ marginTop: 2, flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <MarketingCTA
        heading="Ready to explore all {totalModules} modules?"
        subtext="Sign up free — no credit card required. Start with CRM and invoicing, unlock everything when you are ready."
        primaryLabel={`Start free — see all ${totalModules} modules`}
        primaryHref="/signup"
        secondaryLabel="View pricing"
        secondaryHref="/pricing"
      />

      <MarketingFooter />
    </div>
  );
}
