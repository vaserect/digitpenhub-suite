'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

// A field with a `showIf` condition only renders (and is only required) once
// the referenced field's current answer matches — evaluated live as the
// visitor fills the form, and re-validated server-side on submit so a
// visitor can't bypass a required field by never triggering its condition.
function isFieldVisible(field, values) {
  if (!field.showIf || !field.showIf.fieldId) return true;
  const answer = values[field.showIf.fieldId];
  const target = field.showIf.value;
  if (field.showIf.operator === 'not_equals') return String(answer ?? '') !== String(target ?? '');
  return String(answer ?? '') === String(target ?? '');
}

export default function FormClient() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/v1/forms/${formId}/public`)
      .then((r) => r.json())
      .then((d) => {
        if (d.form) {
          setForm(d.form);
          const initial = {};
          (d.form.fields || []).forEach((f) => { initial[f.id] = f.type === 'checkbox' ? false : ''; });
          setValues(initial);
        } else {
          setError(d.error || 'Form not found.');
        }
      })
      .catch(() => setError('Unable to load form.'))
      .finally(() => setLoading(false));
  }, [formId]);

  const fields = form?.fields || [];
  // A 'pagebreak' pseudo-field (added in the builder) splits the flat fields
  // array into steps — no separate multi-page data model, just a marker.
  const pages = useMemo(() => {
    const result = [[]];
    fields.forEach((f) => {
      if (f.type === 'pagebreak') result.push([]);
      else result[result.length - 1].push(f);
    });
    return result;
  }, [fields]);
  const isMultiPage = pages.length > 1;
  const currentPageFields = pages[Math.min(pageIndex, pages.length - 1)] || [];
  const visiblePageFields = useMemo(() => currentPageFields.filter((f) => isFieldVisible(f, values)), [currentPageFields, values]);
  const visibleFields = useMemo(() => fields.filter((f) => f.type !== 'pagebreak' && isFieldVisible(f, values)), [fields, values]);
  const isLastPage = pageIndex >= pages.length - 1;

  function goNextPage(e) {
    e.preventDefault();
    setError('');
    for (const f of visiblePageFields) {
      if (f.required && (values[f.id] === undefined || values[f.id] === '' || values[f.id] === false)) {
        setError(`"${f.label}" is required.`);
        return;
      }
    }
    setPageIndex((p) => p + 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Only send answers for currently-visible fields, so a hidden field's
      // stale value never gets submitted as if the visitor answered it.
      const payload = {};
      visibleFields.forEach((f) => { payload[f.id] = values[f.id]; });
      const res = await fetch(`/api/v1/forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed.'); return; }
      setSubmitted(true);
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
          <p style={{ color: '#64748b', margin: 0, lineHeight: 1.6 }}>{form?.submit_message}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 6px', fontFamily: "'Sora', sans-serif", fontSize: '1.4rem' }}>{form.name}</h2>
        <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: '0.92rem' }}>{form.description || 'Fill in the form below.'}</p>

        {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 14 }}>{error}</p>}

        {isMultiPage && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {pages.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pageIndex ? '#2563eb' : '#e2e8f0' }} />
            ))}
          </div>
        )}

        <form onSubmit={isLastPage ? handleSubmit : goNextPage}>
          {visiblePageFields.map((field) => (
            <div key={field.id} style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                {field.label}{field.required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={values[field.id] || ''}
                  onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                  required={field.required}
                  rows={4}
                  style={{ width: '100%', background: '#f8fafc', border: '1px solid #dfe7f1', borderRadius: 10, padding: '10px 12px', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              ) : field.type === 'select' || field.type === 'radio' ? (
                field.type === 'radio' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(field.options || []).map((opt, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>
                        <input type="radio" name={field.id} value={opt} checked={values[field.id] === opt} onChange={(e) => setValues({ ...values, [field.id]: e.target.value })} required={field.required} />
                        <span style={{ fontSize: '0.9rem', color: '#0f172a' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <select
                    value={values[field.id] || ''}
                    onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                    required={field.required}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #dfe7f1', borderRadius: 10, padding: '10px 12px', fontSize: '0.95rem', fontFamily: 'inherit' }}
                  >
                    <option value="">Select an option…</option>
                    {(field.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                )
              ) : field.type === 'checkbox' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>
                  <input
                    type="checkbox"
                    checked={!!values[field.id]}
                    onChange={(e) => setValues({ ...values, [field.id]: e.target.checked })}
                    required={field.required}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 400 }}>I agree</span>
                </label>
              ) : (
                <input
                  type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  value={values[field.id] || ''}
                  onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                  required={field.required}
                  style={{ width: '100%', background: '#f8fafc', border: '1px solid #dfe7f1', borderRadius: 10, padding: '10px 12px', fontSize: '0.95rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              )}
            </div>
          ))}

          {visibleFields.length === 0 && (
            <p style={{ color: '#64748b', fontSize: 13 }}>This form has no fields configured yet.</p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {isMultiPage && pageIndex > 0 && (
              <button
                type="button"
                onClick={() => { setError(''); setPageIndex((p) => Math.max(0, p - 1)); }}
                style={{ flex: 1, background: '#fff', color: '#0f172a', border: '1px solid #dfe7f1', borderRadius: 10, padding: '13px 20px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{ flex: 2, background: 'linear-gradient(135deg, #2563eb, #38bdf8)', color: 'white', border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: '0.95rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Submitting…' : isLastPage ? 'Submit' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
