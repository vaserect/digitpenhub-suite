'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import AuthShell from '../../components/ui/AuthShell';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaToken, setMfaToken] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.requiresMfa) {
        setMfaToken(data.mfaToken);
        return;
      }
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/v1/auth/verify-mfa', {
        method: 'POST',
        body: JSON.stringify(
          useBackupCode ? { mfaToken, backupCode: mfaCode } : { mfaToken, code: mfaCode }
        ),
      });
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={mfaToken ? 'Two-factor authentication' : 'Sign in to your account'}
      description={mfaToken ? 'Enter the code from your authenticator app.' : 'Welcome back — your workspace is waiting.'}
      footer={!mfaToken && (
        <>New to Digitpen Hub? <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Create a free account</Link></>
      )}
    >
      <form onSubmit={mfaToken ? handleMfaSubmit : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <div style={{ fontSize: 12.5, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}

        {!mfaToken ? (
          <>
            <div>
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Email
              </label>
              <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required style={{ fontSize: 13.5, padding: '10px 12px' }} />
            </div>
            <div>
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Password
              </label>
              <input className="field-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required style={{ fontSize: 13.5, padding: '10px 12px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link href="/forgot-password" style={{ fontSize: 12.5, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
            <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>Sign in</Button>
            <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              Secured with 256-bit encryption
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="field-label" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                {useBackupCode ? 'Backup code' : 'Authentication code'}
              </label>
              <input className="field-input" value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                placeholder={useBackupCode ? 'XXXXX-XXXXX' : '000000'} required style={{ fontSize: 16, padding: '10px 12px', textAlign: 'center', letterSpacing: 4, fontFamily: 'monospace' }} />
            </div>
            <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>Verify</Button>
            <button type="button" onClick={() => setUseBackupCode(!useBackupCode)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: 'var(--primary)', fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}>
              {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code'}
            </button>
          </>
        )}
      </form>
    </AuthShell>
  );
}
