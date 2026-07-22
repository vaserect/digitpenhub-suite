'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import AuthShell from '../../components/ui/AuthShell';
import Button from '../../components/ui/Button';

export default function SignupPage() {
  const [form, setForm] = useState({ orgName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;

  return (
    <AuthShell
      title="Create your account"
      description="Start with CRM and invoicing for free. Unlock everything when you are ready."
      footer={<>Already have an account? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <div style={{ fontSize: 12.5, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}

        <div>
          <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Organization name
          </label>
          <input className="field-input" value={form.orgName} onChange={e => setForm({...form, orgName: e.target.value})} placeholder="Your company or brand" required style={{ fontSize: 13.5, padding: '10px 12px' }} />
        </div>
        <div>
          <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Your name
          </label>
          <input className="field-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full name" required style={{ fontSize: 13.5, padding: '10px 12px' }} />
        </div>
        <div>
          <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            Email
          </label>
          <input className="field-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@company.com" required style={{ fontSize: 13.5, padding: '10px 12px' }} />
        </div>
        <div>
          <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Password
          </label>
          <input className="field-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 8 characters" required minLength={8} style={{ fontSize: 13.5, padding: '10px 12px' }} />
          {form.password.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= strength ? (strength === 1 ? 'var(--danger)' : strength === 2 ? 'var(--warning)' : 'var(--success)') : 'var(--border)' }} />
              ))}
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>
                {strength === 1 ? 'Weak' : strength === 2 ? 'Good' : 'Strong'}
              </span>
            </div>
          )}
        </div>
        <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>Create account</Button>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4, margin: 4 }}>
          By creating an account, you agree to our <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Privacy Policy</a>.
        </p>
      </form>
    </AuthShell>
  );
}
