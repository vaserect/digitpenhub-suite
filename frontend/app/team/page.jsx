'use client';
import { useState, useEffect } from 'react';

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('members');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteEmailSent, setInviteEmailSent] = useState(true);
  const [msg, setMsg] = useState('');
  const [orgName, setOrgName] = useState('');
  const [editOrg, setEditOrg] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [meRes, membersRes, invRes, orgRes] = await Promise.all([
      fetch('/api/v1/auth/me', { credentials: 'include' }),
      fetch('/api/v1/team/members', { credentials: 'include' }),
      fetch('/api/v1/team/invitations', { credentials: 'include' }),
      fetch('/api/v1/team/org', { credentials: 'include' }),
    ]);
    if (meRes.ok) setMe(await meRes.json());
    if (membersRes.ok) { const d = await membersRes.json(); setMembers(d.members); }
    if (invRes.ok) { const d = await invRes.json(); setInvitations(d.invitations); }
    if (orgRes.ok) { const d = await orgRes.json(); setOrgName(d.name); }
  }

  async function invite(e) {
    e.preventDefault();
    setMsg(''); setInviteLink('');
    const res = await fetch('/api/v1/team/invitations', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const d = await res.json();
    if (res.ok) { setInviteLink(d.inviteLink); setInviteEmailSent(d.emailSent !== false); setInviteEmail(''); load(); }
    else setMsg(d.error);
  }

  async function changeRole(id, role) {
    await fetch(`/api/v1/team/members/${id}/role`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    load();
  }

  async function removeMember(id, name) {
    if (!confirm(`Remove ${name} from the team?`)) return;
    await fetch(`/api/v1/team/members/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  }

  async function cancelInvite(id) {
    await fetch(`/api/v1/team/invitations/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  }

  async function saveOrg(e) {
    e.preventDefault();
    const res = await fetch('/api/v1/team/org', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: orgName }),
    });
    if (res.ok) { setEditOrg(false); setMsg('Organisation name updated.'); }
  }

  const canManage = me && (me.role === 'owner' || me.role === 'admin');

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          {editOrg ? (
            <form onSubmit={saveOrg} style={{ display: 'flex', gap: 8 }}>
              <input value={orgName} onChange={e => setOrgName(e.target.value)}
                style={{ fontSize: '1.5rem', fontWeight: 700, border: '1px solid #ccc', borderRadius: 6, padding: '2px 8px' }} />
              <button type="submit" style={btnStyle('#2563eb')}>Save</button>
              <button type="button" onClick={() => setEditOrg(false)} style={btnStyle('#6b7280')}>Cancel</button>
            </form>
          ) : (
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
              {orgName}
              {canManage && <button onClick={() => setEditOrg(true)} style={{ marginLeft: 10, fontSize: 12, background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>Edit</button>}
            </h1>
          )}
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Team Management</p>
        </div>
        <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}>
          You: <strong>{me?.role}</strong>
        </div>
      </div>

      {msg && <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#166534' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['members', 'invitations', 'settings'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500,
            background: tab === t ? '#2563eb' : '#f3f4f6', color: tab === t ? '#fff' : '#374151'
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'members' && (
        <div>
          {canManage && (
            <form onSubmit={invite} style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              <input type="email" placeholder="Email address" value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)} required
                style={{ flex: 1, minWidth: 220, padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" style={btnStyle('#2563eb')}>Send Invite</button>
            </form>
          )}
          {inviteLink && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13 }}>
                {inviteEmailSent ? 'Invitation sent by email — you can also share this link directly:' : 'Could not email this invite — please share this link directly:'}
              </p>
              <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{inviteLink}</code>
              <button onClick={() => { navigator.clipboard.writeText(inviteLink); setMsg('Link copied!'); }}
                style={{ ...btnStyle('#2563eb'), marginLeft: 12, fontSize: 12, padding: '4px 10px' }}>Copy</button>
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Name', 'Email', 'Role', 'Joined', canManage ? 'Actions' : ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}><strong>{m.full_name}</strong></td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{m.email}</td>
                  <td style={{ padding: '12px' }}>
                    {canManage && m.role !== 'owner' && m.id !== me?.id ? (
                      <select value={m.role} onChange={e => changeRole(m.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span style={{ background: m.role === 'owner' ? '#fef3c7' : m.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{m.role}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#6b7280', fontSize: 12 }}>{new Date(m.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    {canManage && m.role !== 'owner' && m.id !== me?.id && (
                      <button onClick={() => removeMember(m.id, m.full_name)}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'invitations' && (
        <div>
          {invitations.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No pending invitations.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  {['Email', 'Role', 'Invited By', 'Expires', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invitations.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>{inv.email}</td>
                    <td style={{ padding: '12px' }}>{inv.role}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{inv.invited_by_name}</td>
                    <td style={{ padding: '12px', color: '#6b7280', fontSize: 12 }}>{new Date(inv.expires_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>
                      <button onClick={() => cancelInvite(inv.id)}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ maxWidth: 480 }}>
          <h3 style={{ marginTop: 0 }}>Your Profile</h3>
          <ProfileForm me={me} onSaved={() => { setMsg('Profile updated.'); load(); }} />
        </div>
      )}
    </div>
  );
}

function ProfileForm({ me, onSaved }) {
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { if (me) setFullName(me.fullName || me.full_name || ''); }, [me]);

  async function save(e) {
    e.preventDefault(); setErr('');
    const body = { fullName };
    if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }
    const res = await fetch('/api/v1/team/profile', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (res.ok) { setCurrentPassword(''); setNewPassword(''); onSaved(); }
    else setErr(d.error);
  }

  return (
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {err && <div style={{ color: '#dc2626', fontSize: 13 }}>{err}</div>}
      <label style={labelStyle}>
        Full Name
        <input value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Current Password <span style={{ color: '#6b7280', fontWeight: 400 }}>(only if changing password)</span>
        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        New Password
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
      </label>
      <button type="submit" style={btnStyle('#2563eb')}>Save Changes</button>
    </form>
  );
}

const btnStyle = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 });
const inputStyle = { padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, width: '100%', boxSizing: 'border-box' };
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 };
