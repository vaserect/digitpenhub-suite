'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MarketingNav from '../../components/marketing/MarketingNav';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import MarketingCTA from '../../components/marketing/MarketingCTA';

function formatNaira(amount) {
  if (!amount) return '₦0';
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

const DEFAULTS = {
  'pricing.hero.title': "Start on CRM and invoicing for free. Unlock the rest when you're ready.",
  'pricing.hero.subtitle': 'Free gets you a real CRM and invoicing, no card required. Starter and up unlock all modules — the difference between plans is seats and usage limits, not which tools you get.',
};

const FAQS = [
  { q: 'Can I switch plans later?', a: 'Yes. You can upgrade or downgrade at any time. When you upgrade, you get immediate access to the new limits. When you downgrade, changes apply at the next billing cycle.' },
  { q: 'What payment methods do you accept?', a: 'We accept bank transfers, debit/credit cards (Visa, Mastercard), and USSD for Nigerian banks. International payments are processed through our payment partners.' },
  { q: 'Is there a free trial for paid plans?', a: 'The Free plan has no trial and no time limit. You can use it indefinitely. When you upgrade to Starter or above, you get full access immediately.' },
  { q: 'What happens if I exceed my plan limits?', a: "You'll receive notifications as you approach your limits. If you exceed them, features may be restricted until you upgrade or reduce usage." },
];

const PLAN_FALLBACKS = [
  { slug: 'free', name: 'Free', price_ngn: 0, max_users: 1, features: ['1 user', '50 contacts', '5 invoices/month', 'Lead forms', 'Basic CRM', 'Community support'], highlighted_feature: 'Real CRM & invoicing' },
  { slug: 'starter', name: 'Starter', price_ngn: 9900, max_users: 5, features: ['Up to 5 users', '500 contacts', 'Unlimited invoices', 'Email marketing', 'All modules', 'Email support'], highlighted_feature: 'All modules unlocked' },
  { slug: 'growth', name: 'Growth', price_ngn: 29900, max_users: 15, features: ['Up to 15 users', '5,000 contacts', 'Unlimited invoices', 'Priority chat support', 'Analytics dashboard', 'Marketing automation'], highlighted_feature: 'Priority support' },
  { slug: 'business', name: 'Business', price_ngn: 79900, max_users: 999, features: ['Unlimited users', 'Unlimited contacts', 'API access', 'White-label', 'Dedicated manager', 'Phone support'], highlighted_feature: 'Unlimited everything' },
];

export default function PricingPage() {
  const [plans, setPlans] = useState(null);
  const [content, setContent] = useState(DEFAULTS);
  const [totalModules, setTotalModules] = useState(302);
  const [yearly, setYearly] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    fetch('/api/v1/billing/plans').then(r => r.json()).then(d => setPlans(d.plans || [])).catch(() => {});
    fetch('/api/v1/content/public').then(r => r.json()).then(d => { if (d.content) setContent(p => ({...p, ...d.content})); }).catch(() => {});
    fetch('/api/v1/modules/stats').then(r => r.json()).then(d => { if (d.totalModules) setTotalModules(d.totalModules); }).catch(() => {});
  }, []);

  const displayPlans = plans || PLAN_FALLBACKS;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      <MarketingNav />

      {/* Hero */}
      <section style={{
        padding: 'var(--space-8) var(--space-6) 0', textAlign: 'center',
        background: `
          radial-gradient(ellipse 60% 50% at 50% 20%, rgba(37,99,235,0.06), transparent),
          radial-gradient(ellipse 40% 40% at 80% 80%, rgba(56,189,248,0.04), transparent),
          var(--bg)
        `,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700,
          color: 'var(--text)', maxWidth: 700, margin: '0 auto var(--space-2)', lineHeight: 1.15,
        }}>
          {content['pricing.hero.title']}
        </h1>
        <p style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1rem)', color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto var(--space-5)', lineHeight: 1.5 }}>
          {content['pricing.hero.subtitle']}
        </p>

        {/* Yearly toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 'var(--space-6)' }}>
          <span style={{ fontSize: 13, fontWeight: yearly ? 400 : 600, color: yearly ? 'var(--text-muted)' : 'var(--text)' }}>Monthly</span>
          <button onClick={() => setYearly(!yearly)} style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
            background: yearly ? 'var(--primary)' : 'var(--border-strong)', transition: 'background .2s ease',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3,
              transition: 'left .2s ease', left: yearly ? 23 : 3,
            }} />
          </button>
          <span style={{ fontSize: 13, fontWeight: yearly ? 600 : 400, color: yearly ? 'var(--text)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Annual
            <span style={{ fontSize: 10, background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              Save 20%
            </span>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: '0 var(--space-6) var(--space-8)', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {displayPlans.map((plan, idx) => {
            const price = yearly ? Math.round(plan.price_ngn * 0.8) : plan.price_ngn;
            return (
              <div key={plan.slug} style={{
                background: 'var(--surface)', borderRadius: 16, border: idx === 2 ? '2px solid var(--primary)' : '1px solid var(--border)',
                padding: 'var(--space-6)', position: 'relative', display: 'flex', flexDirection: 'column',
                boxShadow: idx === 2 ? '0 8px 32px rgba(37,99,235,0.12)' : 'var(--shadow-sm)',
                transition: 'transform .14s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
                {idx === 2 && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, var(--primary), #1d4ed8)', color: 'white', fontSize: 10, fontWeight: 700, padding: '4px 14px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    Most popular
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{plan.name}</div>
                <div style={{ marginBottom: 'var(--space-1)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: 'var(--text)' }}>
                    {formatNaira(price)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{yearly ? '/mo, billed annually' : '/mo'}</span>
                </div>
                {yearly && plan.price_ngn > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                    <span style={{ textDecoration: 'line-through', marginRight: 4 }}>{formatNaira(plan.price_ngn)}/mo</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>Save {formatNaira(plan.price_ngn - price)}/mo</span>
                  </div>
                )}
                {plan.price_ngn === 0 ? (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Free forever, no credit card</div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                    Up to {plan.max_users === 999 ? 'unlimited' : plan.max_users} users
                  </div>
                )}
                <div style={{ fontSize: 11, background: 'var(--accent-bg)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 6, marginBottom: 'var(--space-3)', fontWeight: 600, alignSelf: 'flex-start' }}>
                  {plan.highlighted_feature || 'All modules'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 'var(--space-5)', flex: 1 }}>
                  {(plan.features || []).map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/signup" style={{
                  display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 10, fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
                  background: idx === 2 ? 'var(--primary)' : idx === 0 ? 'transparent' : 'var(--surface-muted)',
                  color: idx === 2 ? 'white' : 'var(--text)',
                  border: idx === 0 ? '1px solid var(--border)' : idx === 2 ? 'none' : '1px solid transparent',
                  transition: 'opacity .14s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                  {plan.price_ngn === 0 ? 'Start free' : 'Get started'}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Callout */}
      <section style={{ padding: '0 var(--space-6) var(--space-6)', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-sm)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ margin: '0 auto 12px', display: 'block' }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
          </svg>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 var(--space-2)' }}>
            {totalModules}+ modules across 22 categories — every single one available on paid plans
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 var(--space-4)', lineHeight: 1.5 }}>
            Unlike other platforms that gate features by tier, every module on Digitpen Hub is accessible to every paid plan. Plan differences are about seats, contacts, and volume — not which tools you can use.
          </p>
          <Link href="/features" style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            View all features →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '0 var(--space-6) var(--space-6)', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', textAlign: 'center', margin: '0 0 var(--space-5)' }}>Plan details</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map(faq => (
            <div key={faq.q} style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <button onClick={() => setExpandedFaq(expandedFaq === faq.q ? null : faq.q)}
                style={{ width: '100%', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: 'var(--text)', textAlign: 'left' }}>
                {faq.q}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: expandedFaq === faq.q ? 'rotate(180deg)' : '', transition: 'transform .2s ease', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {expandedFaq === faq.q && (
                <div style={{ padding: '0 18px 16px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <MarketingCTA
        heading="Not sure which plan fits?"
        subtext="Start on the Free plan — it includes a real CRM and invoicing. Upgrade when you outgrow it."
        primaryLabel="Start free"
        primaryHref="/signup"
        secondaryLabel="Talk to sales"
        secondaryHref="#"
      />

      <MarketingFooter />
    </div>
  );
}
