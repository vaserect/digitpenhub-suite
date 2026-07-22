'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import MarketingNav from './MarketingNav';
import MarketingFooter from './MarketingFooter';
import MarketingSection from './MarketingSection';
import MarketingCTA from './MarketingCTA';

const SHOWCASE_TABS = [
  {
    key: 'marketing',
    title: 'Marketing & CRM',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ),
    desc: 'Capture leads, run automated campaigns, and close deals in a single unified pipeline.',
    modules: ['Landing Page Builder', 'Email Marketing', 'Unified Inbox', 'CRM & Deals Pipeline'],
    mockup: {
      title: 'Active Campaigns & Leads',
      stats: [
        { label: 'New Leads', value: '1,482' },
        { label: 'Conversion Rate', value: '4.8%' },
        { label: 'Email CTR', value: '12.4%' }
      ],
      detail: 'Lead pipeline: Form Captured → CRM Auto-Scored → Sequence Enrolled → Call Scheduled.'
    }
  },
  {
    key: 'billing',
    title: 'Billing & Commerce',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
    desc: 'Invoice clients, manage recurring subscriptions, collect payments, and run your store.',
    modules: ['Invoice Generator', 'Subscription Billing', 'Coupons & Discounts', 'Point of Sale (POS)'],
    mockup: {
      title: 'Revenue Analytics',
      stats: [
        { label: 'Gross Revenue', value: '₦4,850,000' },
        { label: 'Pending Invoices', value: '18' },
        { label: 'Active Subscriptions', value: '142' }
      ],
      detail: 'Automatically triggers dunning sequences and generates receipts on successful payments.'
    }
  },
  {
    key: 'hr',
    title: 'HR & Payroll',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
    desc: 'Manage your organization, run payroll, track time, and handle leaves in one place.',
    modules: ['Employee Database', 'Compliance Payroll', 'Leave Tracker', 'Time & Attendance'],
    mockup: {
      title: 'Current Payroll Cycle',
      stats: [
        { label: 'Employees Active', value: '34' },
        { label: 'Processed Value', value: '₦12,400,000' },
        { label: 'Pending Approvals', value: '2' }
      ],
      detail: 'Integrated with time sheets and leave requests to calculate deductions automatically.'
    }
  },
  {
    key: 'ai',
    title: 'AI & Productivity',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
    ),
    desc: 'Deploy chatbots, automate tasks, and write copy with integrated AI tools.',
    modules: ['AI Chatbot Builder', 'Task Workspace', 'Content Optimizer', 'Workflow Automation'],
    mockup: {
      title: 'AI Tasks Automated',
      stats: [
        { label: 'Chats Handled', value: '2,840' },
        { label: 'Self-Resolved', value: '78%' },
        { label: 'Drafts Created', value: '148' }
      ],
      detail: 'Chatbots run 24/7 on your landing pages, feeding qualified contacts directly into the CRM.'
    }
  }
];

const FAQS = [
  {
    q: 'Is it really one single login and database?',
    a: 'Yes. Unlike integrations that pass data via APIs, Digitpen Hub Suite was built from the ground up as a single application sharing a unified database. A contact is the exact same record whether they are opening a ticket, paying an invoice, or receiving a marketing text.'
  },
  {
    q: 'Can I invite my team members?',
    a: 'Yes. Every plan (including Free) supports inviting team members with role-based access control (RBAC). You can specify exactly which modules and categories each member can access.'
  },
  {
    q: 'Are my clients forced to see the Digitpen Hub brand?',
    a: 'No. On the Business plan, you can fully white-label the workspace, sidebar, emails, and portals under your own custom domain and styling.'
  },
  {
    q: 'What kind of support is included?',
    a: 'Free and Starter plans include email support with 24-hour response. Growth includes priority chat support. Business includes dedicated account management and phone support.'
  }
];

const PLAN_FALLBACKS = [
  { slug: 'free', name: 'Free', price_ngn: 0, max_users: 1, features: ['1 user', '50 contacts', '5 invoices/month', 'Lead forms', 'Basic CRM'] },
  { slug: 'starter', name: 'Starter', price_ngn: 9900, max_users: 5, features: ['Up to 5 users', '500 contacts', 'Unlimited invoices', 'Email marketing', 'All modules'] },
  { slug: 'growth', name: 'Growth', price_ngn: 29900, max_users: 15, features: ['Up to 15 users', '5,000 contacts', 'Unlimited everything', 'Priority support', 'Analytics dashboard'] },
  { slug: 'business', name: 'Business', price_ngn: 79900, max_users: 999, features: ['Unlimited users', 'Unlimited contacts', 'All modules + API', 'White-label', 'Dedicated support'] }
];

export default function MarketingHome() {
  const [content, setContent] = useState({
    'homepage.hero.eyebrow': 'One login. Every part of your business.',
    'homepage.hero.title': "Stop paying for eleven tools that don't talk to each other.",
    'homepage.hero.subtitle': 'Digitpen Hub replaces your CRM, website builder, email/SMS marketing, invoicing, HR, and analytics stack with one connected suite.',
    'homepage.hero.cta_primary': 'Start free — no card required',
  });
  const [activeShowcaseTab, setActiveShowcaseTab] = useState('marketing');
  const [plans, setPlans] = useState(PLAN_FALLBACKS);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [stats, setStats] = useState({ totalCategories: 21, totalModules: 302, activeModules: 302 });
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const featuredRef = useRef(null);

  useEffect(() => {
    fetch('/api/v1/content/public').then(r => r.json()).then(d => { if (d.content) setContent(p => ({...p, ...d.content})); }).catch(() => {});
    fetch('/api/v1/billing/plans').then(r => r.json()).then(d => { if (d.plans?.length) setPlans(d.plans); }).catch(() => {});
    fetch('/api/v1/modules/stats').then(r => r.json()).then(d => { if (d.totalModules) setStats(d); }).catch(() => {});
  }, []);

  function formatNaira(amount) {
    if (amount === 0) return '₦0';
    return `₦${Number(amount).toLocaleString('en-NG')}`;
  }

  const activeTabDetails = SHOWCASE_TABS.find(t => t.key === activeShowcaseTab);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      <MarketingNav />

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', overflow: 'hidden', padding: 'var(--space-8) var(--space-6)',
        background: `
          radial-gradient(ellipse 70% 60% at 20% 10%, rgba(37,99,235,0.08), transparent),
          radial-gradient(ellipse 50% 50% at 80% 90%, rgba(56,189,248,0.06), transparent),
          radial-gradient(ellipse 40% 40% at 50% 50%, rgba(99,102,241,0.04), transparent),
          var(--bg)
        `,
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 'var(--space-8)', alignItems: 'center' }}>
            {/* Hero Left */}
            <div>
              <span style={{
                display: 'inline-block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--primary)', marginBottom: 'var(--space-3)', padding: '4px 12px', borderRadius: 20, background: 'var(--accent-bg)',
              }}>
                {content['homepage.hero.eyebrow']}
              </span>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4.5vw, 3rem)', fontWeight: 700,
                lineHeight: 1.15, color: 'var(--text)', margin: '0 0 var(--space-3)',
              }}>
                {content['homepage.hero.title']}
              </h1>
              <p style={{ fontSize: 'clamp(0.9rem, 1.2vw, 1.05rem)', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 var(--space-5)' }}>
                {content['homepage.hero.subtitle']}
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
                <Link href="/signup" style={{
                  background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: 14,
                  padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                  transition: 'transform .14s ease, box-shadow .2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  {content['homepage.hero.cta_primary']} →
                </Link>
                <button onClick={() => featuredRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  style={{
                    background: 'transparent', color: 'var(--text)', fontWeight: 500, fontSize: 14,
                    padding: '14px 24px', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)',
                    transition: 'border-color .14s ease, background .14s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--surface-muted)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}>
                  See how it works
                </button>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[
                  { value: stats.totalModules.toString(), label: 'Integrated modules' },
                  { value: stats.activeModules.toString(), label: 'Active features' },
                  { value: '99.9%', label: 'Uptime SLA' },
                  { value: '₦0', label: 'To get started' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1.2 }}>{s.value}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Right — Dashboard Mockup */}
            <div style={{
              background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.08)', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-elevated)' }}>
                <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#ef4444"/></svg>
                <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#f59e0b"/></svg>
                <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#22c55e"/></svg>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>Workspace — Dashboard</span>
              </div>
              <div style={{ display: 'flex', height: 280 }}>
                <div style={{ width: '35%', padding: 12, borderRight: '1px solid var(--border)', background: 'var(--surface-elevated)', fontSize: 11 }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Workspace</div>
                  {['Home', 'Contacts', 'Deals', 'Invoices', 'Campaigns'].map((item, i) => (
                    <div key={item} style={{ padding: '6px 8px', borderRadius: 6, marginBottom: 2, background: i === 0 ? 'var(--accent-bg)' : '', color: i === 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === 0 ? 600 : 400 }}>
                      {item}
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, padding: 14, fontSize: 11 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                    {[
                      { val: '₦4.2M', lbl: 'MRR', up: true },
                      { val: '348', lbl: 'New Clients', up: true },
                      { val: '12.4%', lbl: 'Growth', up: true },
                    ].map(c => (
                      <div key={c.lbl} style={{ background: 'var(--surface-muted)', borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{c.val}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{c.lbl} <span style={{ color: 'var(--success)' }}>↑</span></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Recent Activity</div>
                  {[
                    { name: 'Grace J.', action: 'Lead captured via form', val: '₦450K' },
                    { name: 'Tunde A.', action: 'Invoice paid', val: '₦1.2M' },
                    { name: 'Sarah B.', action: 'Email campaign sent', val: '2,840 opens' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 2 ? '1px solid var(--border)' : '' }}>
                      <div><span style={{ fontWeight: 600, color: 'var(--text)' }}>{row.name}</span><span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{row.action}</span></div>
                      <div style={{ color: 'var(--text-muted)' }}>{row.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{ padding: 'var(--space-5) 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 var(--space-6)', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 'var(--space-3)', display: 'block' }}>
            Trusted by growing teams
          </span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', opacity: 0.7 }}>
            {['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Hooli'].map(name => (
              <div key={name} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE SHOWCASE ── */}
      <section ref={featuredRef} style={{ padding: 'var(--space-8) 0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 var(--space-6)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--text)', margin: '0 0 var(--space-2)' }}>
              Everything you need, deeply connected
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.85rem, 1.1vw, 1rem)', maxWidth: 600, margin: '0 auto' }}>
              {stats.totalModules} modules across {stats.totalCategories} categories. One login. One dataset. One team.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
            {SHOWCASE_TABS.map(tab => (
              <button key={tab.key} onClick={() => { setActiveShowcaseTab(tab.key); setMobileTabOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', border: activeShowcaseTab === tab.key ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: activeShowcaseTab === tab.key ? 'var(--accent-bg)' : 'transparent',
                  color: activeShowcaseTab === tab.key ? 'var(--primary)' : 'var(--text)',
                  transition: 'all .14s ease',
                }}>
                {tab.icon}
                {tab.title}
              </button>
            ))}
          </div>

          {activeTabDetails && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)',
              background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
                  {activeTabDetails.icon}
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{activeTabDetails.title}</h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 var(--space-4)' }}>{activeTabDetails.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeTabDetails.modules.map(mod => (
                    <div key={mod} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {mod}
                    </div>
                  ))}
                </div>
                <Link href="/signup" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 'var(--space-5)',
                  fontSize: 13, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none',
                }}>
                  Get started free →
                </Link>
              </div>
              <div style={{
                background: 'var(--surface-muted)', borderRadius: 12, padding: 'var(--space-4)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {activeTabDetails.mockup.title}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-3)' }}>
                  {activeTabDetails.mockup.stats.map(s => (
                    <div key={s.label} style={{ flex: 1, background: 'var(--surface)', borderRadius: 8, padding: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{activeTabDetails.mockup.detail}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: 'var(--space-6) 0', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
            {[
              {
                quote: "Digitpen Hub saved us over $1,200/month in SaaS subscriptions. But the real win is alignment. When a lead fills out a form, my CRM, email sequence, and invoicing are already in sync.",
                author: 'Adewale Okoye',
                role: 'Founder, Okoye & Co.',
              },
              {
                quote: "Running a business with 15 staff meant managing payroll, client databases, and marketing separately. Digitpen Hub unified everything. The learning curve was fast, and the dashboard is incredibly clean.",
                author: 'Amina Yusuf',
                role: 'Operations Director, Zenith Retail',
              },
            ].map(t => (
              <div key={t.author} style={{ padding: 'var(--space-5)', borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--primary)" opacity="0.15"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z"/></svg>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: 'var(--space-2) 0 var(--space-4)' }}>{t.quote}</p>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.author}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <MarketingSection eyebrow="Pricing" title="Start free. Scale as you grow."
        subtitle={`Free gets you a real CRM and invoicing, no card required. Starter and up unlock all ${stats.totalModules} modules.`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {plans.map((plan, idx) => (
            <div key={plan.slug} style={{
              background: 'var(--surface)', borderRadius: 14, border: idx === 2 ? '2px solid var(--primary)' : '1px solid var(--border)',
              padding: 'var(--space-5)', position: 'relative',
              boxShadow: idx === 2 ? '0 8px 24px rgba(37,99,235,0.12)' : 'var(--shadow-sm)',
              transition: 'transform .14s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
              {idx === 2 && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Most popular</div>}
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 2vw, 1.8rem)', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                {formatNaira(plan.price_ngn)}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>Up to {plan.max_users === 999 ? 'unlimited' : plan.max_users} users</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 'var(--space-4)' }}>
                {plan.features.slice(0, 4).map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/signup" style={{
                display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--primary)', color: 'white', textDecoration: 'none',
                transition: 'opacity .14s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                {plan.price_ngn === 0 ? 'Start free' : 'Get started'}
              </Link>
            </div>
          ))}
        </div>
      </MarketingSection>

      {/* ── FAQ ── */}
      <section style={{ padding: '0 0 var(--space-8)', maxWidth: 720, margin: '0 auto', padding: '0 var(--space-6) var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Frequently asked questions</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map(faq => (
            <div key={faq.q} style={{
              background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden',
              transition: 'box-shadow .14s ease',
            }}>
              <button onClick={() => setExpandedFaq(expandedFaq === faq.q ? null : faq.q)}
                style={{
                  width: '100%', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: 'var(--text)', textAlign: 'left',
                }}>
                {faq.q}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: expandedFaq === faq.q ? 'rotate(180deg)' : '', transition: 'transform .2s ease', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {expandedFaq === faq.q && (
                <div style={{ padding: '0 18px 16px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <MarketingCTA
        heading="Ready to bring your business under one roof?"
        subtext={`Join thousands of teams using Digitpen Hub to run their entire operation on one platform.`}
        primaryLabel="Start free — no card required"
        primaryHref="/signup"
        secondaryLabel="See plans and pricing"
        secondaryHref="/pricing"
      />

      <MarketingFooter />
    </div>
  );
}
