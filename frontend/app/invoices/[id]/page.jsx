'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const data = await apiFetch(`/api/v1/invoices/${params.id}`);
        setInvoice(data.invoice);
      } catch (err) {
        setError(err.message || 'Unable to load invoice.');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) loadInvoice();
  }, [params?.id]);

  async function handleCopyLink() {
    if (typeof window === 'undefined') return;
    try {
      const data = await apiFetch(`/api/v1/invoices/${params.id}/share`, { method: 'POST' });
      const url = `${window.location.origin}/invoices/shared/${data.shareToken}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      setError(err.message || 'Unable to create share link.');
    }
  }

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--text)' }}>Loading invoice…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: 'var(--text)' }}>
        <button className="back-link" onClick={() => router.back()}>← Back</button>
        <div style={{ marginTop: 12 }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="back-link" onClick={() => router.back()}>← Back</button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="primary-btn" onClick={handleCopyLink}>{copied ? 'Link copied' : 'Copy link'}</button>
          <button className="primary-btn" onClick={() => window.print()}>Print invoice</button>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>Invoice</div>
            <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>{invoice?.invoice_number || '—'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700 }}>Digitpen Hub Suite</div>
            <div style={{ color: 'var(--text-muted)' }}>Billing & operations</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 24 }}>
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Bill to</div>
            <div style={{ fontWeight: 600, marginTop: 6 }}>{invoice?.client_name || invoice?.client_company || '—'}</div>
            <div style={{ color: 'var(--text-muted)' }}>{invoice?.client_company ? invoice.client_company : ''}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</div>
            <div style={{ fontWeight: 600, marginTop: 6 }}>{invoice?.status || 'draft'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Issued</div>
            <div style={{ fontWeight: 600, marginTop: 6 }}>{formatDate(invoice?.issue_date)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Due</div>
            <div style={{ fontWeight: 600, marginTop: 6 }}>{formatDate(invoice?.due_date)}</div>
          </div>
        </div>

        <div style={{ marginTop: 24, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 12px', background: 'var(--bg)', fontWeight: 700 }}>
            <div>Description</div>
            <div>Qty</div>
            <div>Unit price</div>
            <div>Amount</div>
          </div>
          {(invoice?.items || []).map((item, index) => (
            <div key={item.id || index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
              <div>{item.description}</div>
              <div>{item.quantity}</div>
              <div>₦{Number(item.unit_price || 0).toLocaleString()}</div>
              <div>₦{Number(item.amount || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 240 }}>
            <span>Subtotal</span>
            <strong>₦{Number(invoice?.subtotal || 0).toLocaleString()}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 240 }}>
            <span>Tax rate</span>
            <strong>{Number(invoice?.tax_rate || 0)}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 240 }}>
            <span>Total</span>
            <strong>₦{Number(invoice?.total || 0).toLocaleString()}</strong>
          </div>
        </div>

        {invoice?.notes ? <div style={{ marginTop: 20, color: 'var(--text-muted)' }}>Notes: {invoice.notes}</div> : null}
      </div>
    </div>
  );
}
