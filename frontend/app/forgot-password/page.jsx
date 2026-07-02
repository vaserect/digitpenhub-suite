'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import AuthShell from '../../components/ui/AuthShell';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email on your account and we'll send you a link to reset your password."
      footer={<p className="login-foot"><Link href="/login">← Back to sign in</Link></p>}
    >
        {sent ? (
          <p className="form-success-note">
            If an account exists for that email, a reset link has been sent. It expires in 1 hour.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            {error && <p className="error-note">{error}</p>}
            <Button className="w-full" type="submit" loading={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}
    </AuthShell>
  );
}
