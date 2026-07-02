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

  // MFA challenge step — set once login() responds with requiresMfa.
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
      // Hard navigation, not router.push+refresh: app/page.jsx is a Server
      // Component that reads the session cookie at request time — the
      // client-side Router Cache can otherwise serve the stale signed-out
      // (marketing) view for '/' right after login, making a successful
      // login look like it silently failed and bounced back to the public
      // page. A full navigation always re-evaluates the cookie server-side.
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
      // Hard navigation, not router.push+refresh: app/page.jsx is a Server
      // Component that reads the session cookie at request time — the
      // client-side Router Cache can otherwise serve the stale signed-out
      // (marketing) view for '/' right after login, making a successful
      // login look like it silently failed and bounced back to the public
      // page. A full navigation always re-evaluates the cookie server-side.
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (mfaToken) {
    return (
      <AuthShell
        title="Two-factor verification"
        description={
          useBackupCode
            ? 'Enter one of your saved backup codes.'
            : 'Enter the 6-digit code from your authenticator app.'
        }
        footer={(
          <>
            <p className="login-foot">
              <button type="button" className="link-btn" onClick={() => { setUseBackupCode((v) => !v); setMfaCode(''); setError(''); }}>
                {useBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead'}
              </button>
            </p>
            <p className="login-foot">
              <button type="button" className="link-btn" onClick={() => { setMfaToken(null); setMfaCode(''); setError(''); }}>
                ← Back to sign in
              </button>
            </p>
          </>
        )}
      >
          <form onSubmit={handleMfaSubmit}>
            <Input
              label={useBackupCode ? 'Backup code' : 'Authentication code'}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              required
              autoFocus
              autoComplete="one-time-code"
            />
            {error && <p className="error-note">{error}</p>}
            <Button className="w-full" type="submit" loading={loading}>
              {loading ? 'Verifying…' : 'Verify'}
            </Button>
          </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Sign in to your workspace"
      description="One secure login for every module, from CRM to billing and beyond."
      footer={(
        <>
          <p className="login-foot">
            New to Digitpen Hub? <Link href="/signup">Create a free account</Link>
          </p>
          <p className="login-foot">suite.digitpenhub.com</p>
        </>
      )}
    >
        <form onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div className="login-links-row">
            <Link href="/forgot-password" className="link-btn">Forgot password?</Link>
          </div>
          {error && <p className="error-note">{error}</p>}
          <Button className="w-full" type="submit" loading={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
    </AuthShell>
  );
}
