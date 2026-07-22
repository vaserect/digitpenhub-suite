'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import AuthShell from '../../../components/ui/AuthShell';
import Button from '../../../components/ui/Button';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords don\'t match.'); return; }
    setLoading(true);
    try {
      await apiFetch('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Choose a new password"
      description={done ? 'Password updated. Redirecting to sign in…' : 'Your other active sessions will be signed out once this completes.'}
      footer={<Link href="/login" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none', fontSize: 13 }}>← Back to sign in</Link>}
    >
      {done ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ margin: '0 auto 12px', display: 'block' }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <p style={{ fontSize: 13, color: 'var(--text)', margin: 0 }}>Password updated. Taking you to sign in…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ fontSize: 12.5, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}
          <div>
            <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              New password
            </label>
            <input className="field-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} autoFocus style={{ fontSize: 13.5, padding: '10px 12px' }} />
          </div>
          <div>
            <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Confirm new password
            </label>
            <input className="field-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required style={{ fontSize: 13.5, padding: '10px 12px' }} />
          </div>
          <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>Update password</Button>
        </form>
      )}
    </AuthShell>
  );
}
