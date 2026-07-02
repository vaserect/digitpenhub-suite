'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const [inv, setInv] = useState(null);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/team/invite/${token}`)
      .then(r => r.json())
      .then(d => { if (d.email) setInv(d); else setError(d.error); })
      .catch(() => setError('Could not load invitation.'));
  }, [token]);

  async function accept(e) {
    e.preventDefault(); setError('');
    const res = await fetch(`/api/v1/team/invite/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, password }),
    });
    const d = await res.json();
    if (res.ok) setDone(true);
    else setError(d.error);
  }

  if (error) return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        <h2 style={{ color: '#dc2626' }}>Invalid Invitation</h2>
        <p style={{ color: '#6b7280' }}>{error}</p>
        <a href="/login" style={{ color: '#2563eb' }}>Go to login</a>
      </div>
    </div>
  );

  if (done) return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        <h2 style={{ color: '#16a34a' }}>Account Created!</h2>
        <p>You can now sign in with your email and password.</p>
        <button onClick={() => router.push('/login')} style={btnStyle}>Go to Login</button>
      </div>
    </div>
  );

  if (!inv) return <div style={centerStyle}><p>Loading...</p></div>;

  return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 4px' }}>You're invited!</h2>
        <p style={{ color: '#6b7280', marginTop: 4 }}>
          Join <strong>{inv.org_name}</strong> as <strong>{inv.role}</strong>
        </p>
        <p style={{ color: '#6b7280', fontSize: 13 }}>Signing up as: {inv.email}</p>
        <form onSubmit={accept} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
          {error && <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>}
          <label style={labelStyle}>
            Your Name
            <input value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Choose Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
          </label>
          <button type="submit" style={btnStyle}>Create Account</button>
        </form>
      </div>
    </div>
  );
}

const centerStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' };
const cardStyle = { background: '#fff', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' };
const btnStyle = { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 15, width: '100%' };
const inputStyle = { padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, width: '100%', boxSizing: 'border-box' };
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 };
