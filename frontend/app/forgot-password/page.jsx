'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import AuthShell from '../../components/ui/AuthShell';
import Button from '../../components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Reset your password"
      description={success ? 'Check your inbox.' : 'Enter your email and we will send you a reset link.'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <div style={{ fontSize: 12.5, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '10px 12px', borderRadius: 8 }}>
            {error}
          </div>
        )}
        {success ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ margin: '0 auto 12px', display: 'block' }}>
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
              If an account exists with that email, a reset link has been sent. It expires in 1 hour.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Email
              </label>
              <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required style={{ fontSize: 13.5, padding: '10px 12px' }} />
            </div>
            <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>Send reset link</Button>
          </>
        )}
        <div style={{ textAlign: 'center' }}>
          <Link href="/login" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>
            ← Back to sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
