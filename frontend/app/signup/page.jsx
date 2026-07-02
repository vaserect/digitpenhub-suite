'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import AuthShell from '../../components/ui/AuthShell';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function SignupPage() {
  const [form, setForm] = useState({ orgName: '', fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      // Hard navigation — see the comment in app/login/page.jsx for why
      // router.push+refresh isn't reliable for the signed-out → signed-in
      // transition on this app's cookie-reading Server Component root page.
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Start your free workspace"
      description="No credit card required. Every module — CRM, sites, invoicing, marketing — from day one."
      footer={<p className="login-foot">Already have an account? <Link href="/login">Sign in</Link></p>}
    >
        <form onSubmit={handleSubmit}>
          <Input label="Organization name" value={form.orgName} onChange={update('orgName')} placeholder="e.g. Acme Studio" required autoFocus />
          <Input label="Your name" value={form.fullName} onChange={update('fullName')} required />
          <Input label="Email" type="email" value={form.email} onChange={update('email')} required />
          <Input label="Password" type="password" value={form.password} onChange={update('password')} helper="At least 8 characters." required />
          {error && <p className="error-note">{error}</p>}
          <Button className="w-full" type="submit" loading={loading}>
            {loading ? 'Creating your workspace…' : 'Create free account'}
          </Button>
        </form>
    </AuthShell>
  );
}
