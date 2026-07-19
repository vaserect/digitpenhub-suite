'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import MarketingNav from './MarketingNav';
import MarketingFooter from './MarketingFooter';

const TRUST_LOGOS = [
  { name: 'Acme Corp', logo: '🏢 AcmeCorp' },
  { name: 'Globex', logo: '🌐 Globex' },
  { name: 'Initech', logo: '⚙️ Initech' },
  { name: 'Umbrella', logo: '☂️ Umbrella' },
  { name: 'Hooli', logo: '🧪 Hooli' }
];

const TESTIMONIALS = [
  {
    quote: "Digitpen Hub saved us over $1,200/month in SaaS subscriptions. But the real win is alignment. When a lead fills out a form, my CRM, email sequence, and invoicing are already in sync. No more CSV exports.",
    author: "Adewale Okoye",
    role: "Founder, Okoye & Co.",
    avatar: "AO"
  },
  {
    quote: "Running a business with 15 staff meant managing payroll, client databases, and marketing separately. Digitpen Hub unified everything. The learning curve was fast, and the dashboard is incredibly clean.",
    author: "Amina Yusuf",
    role: "Operations Director, Zenith Retail",
    avatar: "AY"
  }
];

const SHOWCASE_TABS = [
  {
    key: 'marketing',
    title: '📣 Marketing & CRM',
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
    title: '💼 Billing & Commerce',
    desc: 'Invoice clients, manage recurring subscriptions, collect localized payments, and run your store.',
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
    title: '👥 HR & Payroll',
    desc: 'Manage your organization, run payroll compliance packs, track time, and handle leaves.',
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
    title: '✨ AI & Productivity',
    desc: 'Deploy chatbots, automate task management, and write copy with integrated AI tools.',
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
    q: "Is it really one single login and database?",
    a: "Yes. Unlike integrations that pass data back and forth via APIs, Digitpen Hub Suite was built from the ground up as a single application sharing a unified database. A contact is the exact same record whether they are opening a ticket, paying an invoice, or receiving a marketing text."
  },
  {
    q: "Can I invite my team members?",
    a: "Yes. Every plan (including Free) supports inviting team members, with role-based access control (RBAC). You can specify exactly which modules and categories each member is allowed to access."
  },
  {
    q: "Are my clients forced to see the Digitpen Hub brand?",
    a: "No. On the Business plan, you can fully white-label the workspace, sidebar, emails, and portals under your own custom domain (e.g. portal.yourbrand.com) and styling."
  }
];

const STATS = [
  { value: '97', label: 'Integrated modules' },
  { value: '280', label: 'Active features' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '₦0', label: 'To get started' },
];

const DEFAULTS = {
  'homepage.hero.eyebrow': 'One login. Every part of your business.',
  'homepage.hero.title': "Stop paying for eleven tools that don't talk to each other.",
  'homepage.hero.subtitle': "Digitpen Hub replaces your CRM, website builder, email/SMS marketing, invoicing, HR, and analytics stack with one connected suite — so a contact who fills out a form, gets invoiced, and books a call shows up as one person with one history, not three disconnected records in three different apps.",
  'homepage.hero.cta_primary': 'Start free — no card required',
  'homepage.value.title': '97 modules. One dataset. Zero busywork stitching them together.',
  'homepage.value.body': "Every module shares the same contacts, the same billing, and the same login — so automations, reports, and your team's day-to-day work span the whole business instead of stopping at the edge of one app.",
};

const PLAN_FALLBACKS = [
  { slug: 'free', name: 'Free', price_ngn: 0, max_users: 1, features: ['1 user', '50 contacts', '5 invoices', 'Lead forms', 'Basic CRM'] },
  { slug: 'starter', name: 'Starter', price_ngn: 9900, max_users: 5, features: ['Up to 5 users', '500 contacts', 'Unlimited invoices', 'Email marketing', 'All modules'] },
  { slug: 'growth', name: 'Growth', price_ngn: 29900, max_users: 15, features: ['Up to 15 users', '5,000 contacts', 'Unlimited everything', 'Priority support', 'Analytics'] },
  { slug: 'business', name: 'Business', price_ngn: 79900, max_users: 999, features: ['Unlimited users', 'Unlimited contacts', 'All modules', 'API access', 'Dedicated support'] }
];

export default function MarketingHome() {
  const [content, setContent] = useState(DEFAULTS);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState('marketing');
  const [plans, setPlans] = useState(PLAN_FALLBACKS);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [stats, setStats] = useState({ totalCategories: 21, totalModules: 302, activeModules: 302 });
  const featuredRef = useRef(null);

  useEffect(() => {
    fetch('/api/v1/content/public')
      .then((r) => r.json())
      .then((d) => { if (d.content) setContent((prev) => ({ ...prev, ...d.content })); })
      .catch(() => {});

    // Fetch live plans if available
    fetch('/api/v1/billing/plans')
      .then((r) => r.json())
      .then((d) => { if (d.plans?.length) setPlans(d.plans); })
      .catch(() => {});

    // Fetch dynamic modules stats
    fetch('/api/v1/modules/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.totalModules) {
          setStats(d);
          setContent(prev => ({
            ...prev,
            'homepage.value.title': `${d.totalModules} modules. One dataset. Zero busywork stitching them together.`
          }));
        }
      })
      .catch(() => {});
  }, []);

  function scrollToFeatured() {
    featuredRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function formatNaira(amount) {
    if (amount === 0) return '₦0';
    return `₦${Number(amount).toLocaleString('en-NG')}`;
  }

  const activeTabDetails = SHOWCASE_TABS.find(t => t.key === activeShowcaseTab);

  const statsList = [
    { value: stats.totalModules.toString(), label: 'Integrated modules' },
    { value: stats.activeModules.toString(), label: 'Active modules' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '₦0', label: 'To get started' },
  ];

  return (
    <div className="mkt-page">
      <MarketingNav />

      {/* ── Split Hero Layout ── */}
      <section className="mkt-hero-split">
        <div className="mkt-hero-left">
          <span className="mkt-eyebrow">{content['homepage.hero.eyebrow']}</span>
          <h1>{content['homepage.hero.title']}</h1>
          <p className="mkt-hero-sub">{content['homepage.hero.subtitle']}</p>
          <div className="mkt-hero-actions">
            <Link href="/signup" className="btn btn-primary btn-lg">{content['homepage.hero.cta_primary']}</Link>
            <button className="btn btn-secondary btn-lg" onClick={scrollToFeatured}>See how it works</button>
          </div>
          <div className="mkt-hero-stats-row">
            {statsList.map((s) => (
              <div key={s.label} className="mkt-hero-stat-item">
                <span className="mkt-hero-stat-val">{s.value}</span>
                <span className="mkt-hero-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mkt-hero-right">
          <div className="mkt-hero-dashboard-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="mockup-title">Digitpen Hub Suite — Workspace</div>
              <div className="mockup-search-sim">🔍 Search modules...</div>
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar">
                <div className="mockup-sidebar-group-title">Core Workspace</div>
                <div className="mockup-sidebar-item active">🏠 Workspace Home</div>
                <div className="mockup-sidebar-item">📊 Performance</div>
                <div className="mockup-sidebar-group-title">Departments</div>
                <div className="mockup-sidebar-item">📣 Marketing &amp; CRM</div>
                <div className="mockup-sidebar-item">💳 Invoicing &amp; POS</div>
                <div className="mockup-sidebar-item">💼 HR &amp; Payroll</div>
                <div className="mockup-sidebar-item">🤖 AI Productivity</div>
                <div className="mockup-sidebar-item">⚙️ Settings</div>
              </div>
              <div className="mockup-content">
                <div className="mockup-welcome">
                  <h4>Welcome back, Sarah</h4>
                  <p>Your business dashboard is fully connected.</p>
                </div>
                <div className="mockup-grid">
                  <div className="mockup-card">
                    <span className="card-lbl">Monthly MRR</span>
                    <span className="card-val">₦4,250,000</span>
                    <span className="card-trend green">↑ 18.2%</span>
                  </div>
                  <div className="mockup-card">
                    <span className="card-lbl">New Clients</span>
                    <span className="card-val">348</span>
                    <span className="card-trend green">↑ 12.4%</span>
                  </div>
                  <div className="mockup-card" style={{ gridColumn: 'span 2' }}>
                    <span className="card-lbl">Unified Contacts Directory</span>
                    <div className="mockup-table">
                      <div className="table-row head">
                        <span>Name</span><span>Status</span><span>Value</span>
                      </div>
                      <div className="table-row">
                        <span>Grace Johnson</span><span className="badge active">Lead</span><span>₦450,000</span>
                      </div>
                      <div className="table-row">
                        <span>Tunde Alao</span><span className="badge active">Customer</span><span>₦1,200,000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof / Logo Gutter ── */}
      <section className="mkt-trust-bar">
        <div className="mkt-trust-inner">
          <span className="mkt-trust-title">TRUSTED BY GROWING TEAMS AT</span>
          <div className="mkt-trust-logos">
            {TRUST_LOGOS.map(tl => (
              <div key={tl.name} className="mkt-trust-logo" title={tl.name}>{tl.logo}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value Proposition / Overview ── */}
      <section className="mkt-section" ref={featuredRef}>
        <div className="mkt-section-header">
          <h2>{content['homepage.value.title']}</h2>
          <p className="mkt-section-sub">{content['homepage.value.body']}</p>
        </div>
      </section>

      {/* ── Interactive Feature Showcase ── */}
      <section className="mkt-section mkt-section-alt" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
        <div className="mkt-showcase-container">
          <div className="mkt-showcase-tabs">
            {SHOWCASE_TABS.map(tab => (
              <button
                key={tab.key}
                className={`mkt-showcase-tab-btn ${activeShowcaseTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveShowcaseTab(tab.key)}
              >
                {tab.title}
              </button>
            ))}
          </div>
          {activeTabDetails && (
            <div className="mkt-showcase-view">
              <div className="mkt-showcase-info">
                <h3>{activeTabDetails.title.substring(3)}</h3>
                <p className="mkt-showcase-desc">{activeTabDetails.desc}</p>
                <div className="mkt-showcase-modules-list">
                  {activeTabDetails.modules.map(mod => (
                    <div key={mod} className="mkt-showcase-module-badge">
                      <span className="bullet">✓</span> {mod}
                    </div>
                  ))}
                </div>
                <Link href="/signup" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>Get Started Free</Link>
              </div>
              <div className="mkt-showcase-mockup">
                <div className="mkt-mockup-header">
                  <div className="dots"><span className="red"/><span className="yellow"/><span className="green"/></div>
                  <span className="title">{activeTabDetails.mockup.title}</span>
                </div>
                <div className="mkt-mockup-body">
                  <div className="mockup-stats-row">
                    {activeTabDetails.mockup.stats.map(s => (
                      <div key={s.label} className="mockup-stat-card">
                        <div className="val">{s.value}</div>
                        <div className="lbl">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Rich representative visual previews for each tab */}
                  <div className="mockup-visual-preview">
                    {activeShowcaseTab === 'marketing' && (
                      <div className="showcase-visual-pipeline">
                        <div className="pipeline-col">
                          <div className="col-hdr">Leads (3)</div>
                          <div className="col-card">John D. (Form)</div>
                          <div className="col-card">Amara K. (Chat)</div>
                        </div>
                        <div className="pipeline-col">
                          <div className="col-hdr">Enrolled (2)</div>
                          <div className="col-card active">Sarah B. (Email)</div>
                          <div className="col-card">David O. (SMS)</div>
                        </div>
                        <div className="pipeline-col">
                          <div className="col-hdr">Won (1)</div>
                          <div className="col-card won">Tunde A. (Paid)</div>
                        </div>
                      </div>
                    )}
                    {activeShowcaseTab === 'billing' && (
                      <div className="showcase-visual-revenue">
                        <div className="rev-graph-sim">
                          <div className="bar" style={{ height: '30%' }} />
                          <div className="bar" style={{ height: '45%' }} />
                          <div className="bar" style={{ height: '60%' }} />
                          <div className="bar" style={{ height: '85%' }} />
                          <div className="bar active" style={{ height: '95%' }} />
                        </div>
                        <div className="rev-activity">
                          <div className="act-row">💳 Invoice #1024 paid by Hooli — ₦450,000</div>
                          <div className="act-row">🔄 Subscription renewed for Amina — ₦29,900</div>
                        </div>
                      </div>
                    )}
                    {activeShowcaseTab === 'hr' && (
                      <div className="showcase-visual-hr">
                        <div className="employee-status">
                          <div className="emp-row">
                            <span className="emp-name">Ayo Balogun</span>
                            <span className="emp-badge present">Present</span>
                            <span className="emp-time">08:58 AM</span>
                          </div>
                          <div className="emp-row">
                            <span className="emp-name">Fatima Bello</span>
                            <span className="emp-badge leave">On Leave</span>
                            <span className="emp-time">Until Jul 22</span>
                          </div>
                          <div className="emp-row">
                            <span className="emp-name">Chidi Ike</span>
                            <span className="emp-badge present">Present</span>
                            <span className="emp-time">09:02 AM</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeShowcaseTab === 'ai' && (
                      <div className="showcase-visual-ai">
                        <div className="chat-messages">
                          <div className="msg bot">Hello! How can I help you today?</div>
                          <div className="msg user">I want to book a demo of the software.</div>
                          <div className="msg bot highlighted">Perfect! Enrolled you in our demo workflow. Booking link sent via SMS.</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mockup-detail-text" style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    {activeTabDetails.mockup.detail}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="mkt-section">
        <div className="mkt-section-header" style={{ marginBottom: '3rem' }}>
          <h2>Designed for builders and business owners</h2>
          <p className="mkt-section-sub">Here is what founders say about moving their whole operation onto the suite.</p>
        </div>
        <div className="mkt-testimonials-grid">
          {TESTIMONIALS.map((t, idx) => (
            <div className="mkt-testimonial-card" key={idx}>
              <div className="quote-mark">“</div>
              <p className="quote-body">{t.quote}</p>
              <div className="quote-author">
                <div className="author-avatar">{t.avatar}</div>
                <div>
                  <div className="author-name">{t.author}</div>
                  <div className="author-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing Grid ── */}
      <section className="mkt-section mkt-section-alt" id="pricing">
        <div className="mkt-section-header">
          <h2>Clear, simple pricing</h2>
          <p className="mkt-section-sub">Start for free. Upgrade when your team grows or your send volumes increase. All tools included on paid tiers.</p>
        </div>
        <div className="mkt-pricing-grid">
          {plans.map((p) => {
            const features = Array.isArray(p.features) ? p.features : [];
            return (
              <div className={`mkt-price-card ${p.slug === 'growth' ? 'mkt-price-featured' : ''}`} key={p.slug}>
                {p.slug === 'growth' && <div className="mkt-price-badge">Most popular</div>}
                <div className="mkt-price-name">{p.name}</div>
                <div className="mkt-price-amount">{formatNaira(p.price_ngn)}<span>/month</span></div>
                <div className="mkt-price-users">{p.max_users >= 999 ? 'Unlimited users' : `Up to ${p.max_users} user${p.max_users === 1 ? '' : 's'}`}</div>
                <ul className="mkt-price-features">
                  {features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
                <Link href="/signup" className="btn btn-primary w-full" style={{ marginTop: 'auto' }}>
                  {p.price_ngn === 0 ? 'Start Free' : 'Get Started'}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="mkt-section">
        <div className="mkt-section-header" style={{ marginBottom: '2.5rem' }}>
          <h2>Frequently Asked Questions</h2>
          <p className="mkt-section-sub">Everything you need to know about plans, integrations, and domains.</p>
        </div>
        <div className="mkt-faq-container">
          {FAQS.map((faq, idx) => (
            <div className={`mkt-faq-item ${expandedFaq === idx ? 'expanded' : ''}`} key={idx}>
              <button className="mkt-faq-question" onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}>
                <span>{faq.q}</span>
                <span className="arrow">{expandedFaq === idx ? '−' : '+'}</span>
              </button>
              {expandedFaq === idx && (
                <div className="mkt-faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
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
