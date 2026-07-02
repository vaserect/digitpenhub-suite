'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import AuthShell from '../../../components/ui/AuthShell';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

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
    if (newPassword !== confirmPassword) { setError('Passwords don’t match.'); return; }
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
    <AuthShell
      title="Choose a new password"
      footer={<p className="login-foot"><Link href="/login">← Back to sign in</Link></p>}
    >
        {done ? (
          <p className="form-success-note">Password updated. Taking you to sign in…</p>
        ) : (
          <>
            <p className="login-sub">Your other sessions will be signed out once this completes.</p>
            <form onSubmit={handleSubmit}>
              <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} helper="At least 8 characters." required autoFocus />
              <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              {error && <p className="error-note">{error}</p>}
              <Button className="w-full" type="submit" loading={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </>
        )}
    </AuthShell>
  );
}
