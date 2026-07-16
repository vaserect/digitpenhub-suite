'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error

  useEffect(() => {
    if (!token) return;
    fetch(`/api/v1/auth/verify-email/${token}`)
      .then((r) => r.json())
      .then((d) => setStatus(d.ok ? 'success' : 'error'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="auth-view">
      <div className="auth-shell">
        <div className="auth-card" style={{ maxWidth: 480, margin: '2rem auto', textAlign: 'center' }}>
          {status === 'verifying' && (
            <>
              <h2>Verifying your email…</h2>
              <p className="auth-card-subtitle">Please wait while we confirm your email address.</p>
            </>
          )}
          {status === 'success' && (
            <>
              <h2>Email verified ✓</h2>
              <p className="auth-card-subtitle" style={{ marginBottom: 16 }}>Your email has been verified. You can now access all features without the verification banner.</p>
              <Link href="/" className="btn btn-primary">Go to workspace</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <h2>Verification failed</h2>
              <p className="auth-card-subtitle" style={{ marginBottom: 16 }}>This link is invalid or has expired. Sign in and request a new verification email from your account settings.</p>
              <Link href="/login" className="btn btn-primary">Sign in</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
