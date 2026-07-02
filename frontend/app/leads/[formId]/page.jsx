'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PublicLeadForm() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/v1/leads/forms/${formId}/public`)
      .then((r) => r.json())
      .then((d) => {
        if (d.form) {
          setForm(d.form);
          const initial = {};
          (d.form.fields_json || []).forEach((f) => {
            initial[f.id] = f.type === 'checkbox' ? false : '';
          });
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

  const containerStyle = {
    minHeight: '100vh',
    background: '#f4f7fb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', system-ui, sans-serif",
  };
  const cardStyle = {
    width: '100%',
    maxWidth: 560,
    background: '#fff',
    border: '1px solid #dfe7f1',
    borderRadius: 20,
    padding: '36px 32px',
    boxShadow: '0 18px 48px rgba(15,23,42,.1)',
  };

  if (loading) return <div style={containerStyle}><p style={{ color: '#64748b' }}>Loading…</p></div>;
  if (error && !form) return <div style={containerStyle}><div style={cardStyle}><p style={{ color: '#dc2626' }}>{error}</p></div></div>;

  if (submitted) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ margin: '0 0 10px', fontFamily: "'Sora', sans-serif", fontSize: '1.4rem' }}>Submitted!</h2>
          <p style={{ color: '#64748b', margin: 0, lineHeight: 1.6 }}>{form?.thank_you_message}</p>
        </div>
      </div>
    );
  }

  const fields = form?.fields_json || [];

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 6px', fontFamily: "'Sora', sans-serif", fontSize: '1.4rem' }}>{form.name}</h2>
        <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: '0.92rem' }}>Fill in the form below and we will get back to you.</p>

        {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 14 }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.id} style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
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
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>
                  <input
                    type="checkbox"
                    checked={!!values[field.id]}
                    onChange={(e) => setValues({ ...values, [field.id]: e.target.checked })}
                    required={field.required}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 400 }}>{field.placeholder || 'I agree'}</span>
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

          {fields.length === 0 && (
            <p style={{ color: '#64748b', fontSize: 13 }}>This form has no fields configured yet.</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ marginTop: 8, width: '100%', background: 'linear-gradient(135deg, #2563eb, #38bdf8)', color: 'white', border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: '0.95rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
