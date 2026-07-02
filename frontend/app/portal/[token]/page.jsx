'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const STATUS_COLOR = {
  paid:    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  pending: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  overdue: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  draft:   { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
  cancelled: { bg: '#f8fafc', text: '#94a3b8', border: '#e2e8f0' },
};

function fmt(amount) {
  return `₦${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] || STATUS_COLOR.draft;
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: s.bg, color: s.text, border: `1px solid ${s.border}`, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {status}
    </span>
  );
}

export default function ClientPortalPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/v1/portal/view/${token}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Unable to load your portal. Please check the link or contact the sender.'))
      .finally(() => setLoading(false));
  }, [token]);

  const totalDue = data?.invoices
    .filter((i) => i.status === 'pending' || i.status === 'overdue')
    .reduce((s, i) => s + i.total, 0) ?? 0;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <div>Loading your portal…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Portal Unavailable</div>
          <div style={{ color: '#64748b', lineHeight: 1.6 }}>{error}</div>
        </div>
      </div>
    );
  }

  const { client, org, invoices } = data;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif", color: '#0f172a' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2563eb', letterSpacing: '-0.01em' }}>
            {org.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Client Portal</div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 24px' }}>

        {/* Welcome card */}
        <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: 16, padding: '28px 32px', color: '#fff', marginBottom: '2rem', boxShadow: '0 8px 32px rgba(37,99,235,0.2)' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.75, marginBottom: 8 }}>Welcome back</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>{client.company || client.name}</div>
          {client.company && <div style={{ opacity: 0.8, fontSize: '0.95rem' }}>{client.name}</div>}
          {totalDue > 0 && (
            <div style={{ marginTop: 20, display: 'inline-block', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '10px 18px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: 2 }}>Outstanding balance</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{fmt(totalDue)}</span>
            </div>
          )}
        </div>

        {/* Invoices */}
        <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Invoices</h2>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
        </div>

        {invoices.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>📄</div>
            <div style={{ fontWeight: 600 }}>No invoices yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {invoices.map((inv) => (
              <div key={inv.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
                {/* Invoice row */}
                <div
                  style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: '1rem', alignItems: 'center', padding: '14px 20px', cursor: inv.items.length > 0 ? 'pointer' : 'default' }}
                  onClick={() => inv.items.length > 0 && setExpandedId(expandedId === inv.id ? null : inv.id)}
                >
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {inv.invoice_number}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: '#64748b' }}>
                      <span>Issued {fmtDate(inv.issue_date)}</span>
                      {inv.due_date && <span>Due {fmtDate(inv.due_date)}</span>}
                    </div>
                    {inv.notes && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.notes}</div>}
                  </div>
                  <div><StatusBadge status={inv.status} /></div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', textAlign: 'right' }}>{fmt(inv.total)}</div>
                  {inv.items.length > 0 && (
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', userSelect: 'none' }}>
                      {expandedId === inv.id ? '▲' : '▼'}
                    </div>
                  )}
                </div>

                {/* Expanded items */}
                {expandedId === inv.id && inv.items.length > 0 && (
                  <div style={{ borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '8px 20px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                      <div>Description</div><div style={{ textAlign: 'right' }}>Qty</div><div style={{ textAlign: 'right' }}>Unit Price</div><div style={{ textAlign: 'right' }}>Amount</div>
                    </div>
                    {inv.items.map((item, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '8px 20px', fontSize: '0.85rem', borderTop: '1px solid #e2e8f0' }}>
                        <div>{item.description}</div>
                        <div style={{ textAlign: 'right', color: '#64748b' }}>{item.quantity}</div>
                        <div style={{ textAlign: 'right', color: '#64748b', fontFamily: 'monospace' }}>{fmt(item.unit_price)}</div>
                        <div style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{fmt(item.amount)}</div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '12px 20px', gap: 4, borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', gap: 24 }}>
                        <span>Subtotal</span><span style={{ fontFamily: 'monospace' }}>{fmt(inv.subtotal)}</span>
                      </div>
                      {inv.tax_rate > 0 && (
                        <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', gap: 24 }}>
                          <span>Tax ({inv.tax_rate}%)</span><span style={{ fontFamily: 'monospace' }}>{fmt(inv.total - inv.subtotal)}</span>
                        </div>
                      )}
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', gap: 24, borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 4 }}>
                        <span>Total</span><span style={{ fontFamily: 'monospace' }}>{fmt(inv.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
          Powered by <strong style={{ color: '#64748b' }}>Digitpen Hub Suite</strong>
        </div>
      </div>
    </div>
  );
}
