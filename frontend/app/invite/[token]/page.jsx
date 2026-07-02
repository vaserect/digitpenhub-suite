'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '../../../components/ui/AuthShell';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import PageState from '../../../components/ui/PageState';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const [inv, setInv] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/team/invite/${token}`)
      .then(r => r.json())
      .then(d => { if (d.email) setInv(d); else setLoadError(d.error); })
      .catch(() => setLoadError('Could not load invitation.'));
  }, [token]);

  async function accept(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const res = await fetch(`/api/v1/team/invite/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, password }),
    });
    const d = await res.json();
    if (res.ok) setDone(true);
    else setFormError(d.error);
    setSubmitting(false);
  }

  if (loadError) {
    return (
      <AuthShell
        title="Invitation unavailable"
        description="This invite link may be expired, revoked, or already used."
        footer={<p className="login-foot"><Link href="/login">Go to login</Link></p>}
      >
        <PageState compact tone="danger" icon="!" title="We couldn’t load this invitation" description={loadError} />
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Account created" description="You can now sign in with your email and password.">
        <PageState
          compact
          tone="success"
          icon="✓"
          title="You're all set"
          description="Your team access is ready."
          action={<Button className="w-full" onClick={() => router.push('/login')}>Go to login</Button>}
        />
      </AuthShell>
    );
  }

  if (!inv) {
    return (
      <AuthShell title="Loading invitation" description="Confirming your invite link and workspace details.">
        <PageState compact loading title="Loading invitation" description="Checking the invitation token and preparing your access." />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="You're invited"
      description={`Join ${inv.org_name} as ${inv.role}.`}
      footer={<p className="login-foot">Signing up as: {inv.email}</p>}
    >
      <form onSubmit={accept}>
        {formError && <p className="error-note">{formError}</p>}
        <Input label="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
        <Input label="Choose password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} helper="At least 8 characters." />
        <Button className="w-full" type="submit" loading={submitting}>{submitting ? 'Creating account…' : 'Create account'}</Button>
      </form>
    </AuthShell>
  );
}
