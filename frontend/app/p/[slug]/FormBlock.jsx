'use client';

import { useEffect, useState } from 'react';

// Embeds a real lead-capture form (from the Lead Generation module) directly
// into a published page — submissions go through the same public endpoint
// and land in the same Lead Generation inbox as a standalone form link.
export default function FormBlock({ block }) {
  const formId = block.formId;
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!formId) { setLoading(false); return; }
    fetch(`/api/v1/leads/forms/${formId}/public`)
      .then((r) => r.json())
      .then((d) => {
        if (d.form) {
          setForm(d.form);
          const initial = {};
          (d.form.fields_json || []).forEach((f) => { initial[f.id] = f.type === 'checkbox' ? false : ''; });
          setValues(initial);
        } else {
          setError(d.error || 'Form not found.');
        }
      })
      .catch(() => setError('Unable to load form.'))
      .finally(() => setLoading(false));
  }, [formId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/leads/forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed.'); return; }
      setSubmitted(true);
      if (form.redirect_url) window.location.href = form.redirect_url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!formId) return null;

  return (
    <section style={{ padding: '56px 24px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '32px 28px', boxShadow: '0 8px 32px rgba(15,23,42,.06)' }}>
        {block.heading && <h2 style={{ margin: '0 0 6px', fontFamily: "'Sora', sans-serif", fontSize: '1.3rem', color: '#0f172a' }}>{block.heading}</h2>}
        {block.subheading && <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.92rem' }}>{block.subheading}</p>}

        {loading ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading form…</p>
        ) : submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <p style={{ color: '#334155', margin: 0, lineHeight: 1.6 }}>{form?.thank_you_message}</p>
          </div>
        ) : error && !form ? (
          <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {(form?.fields_json || []).map((field) => (
              <div key={field.id} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  {field.label}{field.required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={values[field.id] || ''}
                    onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                    placeholder={field.placeholder || ''}
                    required={field.required}
                    rows={4}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #dfe7f1', borderRadius: 10, padding: '10px 12px', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={values[field.id] || ''}
                    onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                    required={field.required}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #dfe7f1', borderRadius: 10, padding: '10px 12px', fontSize: '0.95rem', fontFamily: 'inherit' }}
                  >
                    <option value="">Select an option…</option>
                    {(field.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!values[field.id]} onChange={(e) => setValues({ ...values, [field.id]: e.target.checked })} required={field.required} style={{ width: 18, height: 18 }} />
                    <span style={{ fontSize: '0.95rem', color: '#0f172a' }}>{field.placeholder || 'I agree'}</span>
                  </label>
                ) : (
                  <input
                    type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                    value={values[field.id] || ''}
                    onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                    placeholder={field.placeholder || ''}
                    required={field.required}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #dfe7f1', borderRadius: 10, padding: '10px 12px', fontSize: '0.95rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                )}
              </div>
            ))}
            {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              style={{ width: '100%', background: 'linear-gradient(135deg, #2563eb, #38bdf8)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: '0.95rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
