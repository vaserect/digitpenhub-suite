'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';

export default function BillingPage() {
  const router = useRouter();
  const [sub, setSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/v1/billing/subscription').then(d => setSub(d.subscription)),
      apiFetch('/api/v1/billing/plans').then(d => setPlans(d.plans || [])),
      apiFetch('/api/v1/billing/payments').then(d => setPayments(d.payments || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="panel"><div className="empty-note">Loading billing info…</div></div>;

  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/')}>← Back to workspace</button>
      <div className="module-head">
        <h1>Billing &amp; Plans</h1>
        <p className="module-sub">Manage your subscription and view payment history.</p>
      </div>

      {sub && (
        <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 6 }}>Current plan</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>{sub.plan_name}</div>
            {sub.current_period_end && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Renews {new Date(sub.current_period_end).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {sub.price_ngn === 0 ? 'Free' : `₦${Number(sub.price_ngn).toLocaleString()}/mo`}
            </div>
            <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, marginTop: 4 }}>● {sub.status === 'active' ? 'Active' : sub.status}</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>Available plans</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {plans.map((plan) => {
            const isCurrent = sub?.plan_slug === plan.slug;
            const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]');
            return (
              <div key={plan.id} className="card" style={{ padding: '20px', border: isCurrent ? '2px solid var(--primary)' : undefined, position: 'relative' }}>
                {isCurrent && (
                  <div style={{ position: 'absolute', top: -1, right: 14, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: '0 0 6px 6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Current</div>
                )}
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 12, lineHeight: 1 }}>
                  {plan.price_ngn === 0 ? 'Free' : `₦${Number(plan.price_ngn).toLocaleString()}`}
                  {plan.price_ngn > 0 && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span>}
                </div>
                <ul style={{ margin: '0 0 16px', padding: '0 0 0 16px', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  {features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
                {!isCurrent && plan.price_ngn > 0 && (
                  <button className="primary-btn" style={{ width: '100%', opacity: working ? 0.6 : 1 }} disabled={working} onClick={() => {}}>
                    Upgrade to {plan.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 14 }}>Payment history</div>
        {payments.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No payments yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Plan','Amount','Status','Reference','Date'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>{pay.plan_name}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>₦{Number(pay.amount_ngn).toLocaleString()}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                    <span className={`badge-pill ${pay.status === 'successful' ? 'badge-success' : pay.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>{pay.status}</span>
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{pay.tx_ref}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>{new Date(pay.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
