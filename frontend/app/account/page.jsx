'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { useWorkspace } from '../../components/ui/WorkspaceLayout';
import { toast } from 'sonner';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function AccountPage() {
  const router = useRouter();
  const workspace = useWorkspace();
  const [tab, setTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile
  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Security
  const [sessions, setSessions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [changePw, setChangePw] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  // 2FA
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMsg, setMfaMsg] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState([]);

  useEffect(() => {
    apiFetch('/api/v1/auth/me')
      .then((d) => {
        setUser(d.user);
        setNameDraft(d.user.fullName);
        const currentSession = (d.sessions || []).find((s) => s.is_current);
        if (currentSession) setSessions([currentSession, ...(d.sessions || []).filter((s) => !s.is_current)]);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
    apiFetch('/api/v1/auth/sessions')
      .then((d) => setSessions(d.sessions || []))
      .catch(() => { console.error('Failed to load sessions'); });
    apiFetch('/api/v1/auth/audit-log')
      .then((d) => setAuditLog(d.log || []))
      .catch(() => { console.error('Failed to load audit log'); });
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const data = await apiFetch('/api/v1/auth/me', { method: 'PATCH', body: JSON.stringify({ fullName: nameDraft }) });
      setMsg('Profile updated.');
      if (workspace && data.user) {
        workspace.setUser(data.user);
      }
    } catch (err) { setMsg(err.message); }
    setSaving(false);
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setSaving(true);
    setMsg('');
    try {
      const data = await apiFetch('/api/v1/auth/me/avatar', {
        method: 'POST',
        body: formData,
        headers: {},
      });
      setUser(prev => ({ ...prev, avatarUrl: data.user.avatarUrl }));
      if (workspace && data.user) {
        workspace.setUser(data.user);
      }
      setMsg('Profile picture updated.');
      toast.success('Avatar updated successfully');
    } catch (err) {
      setMsg(err.message);
      toast.error('Failed to update avatar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg('');
    if (changePw.newPw !== changePw.confirm) { setPwMsg('Passwords do not match.'); return; }
    if (changePw.newPw.length < 8) { setPwMsg('Password must be at least 8 characters.'); return; }
    try {
      await apiFetch('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: changePw.current, newPassword: changePw.newPw }),
      });
      setPwMsg('Password changed successfully.');
      setChangePw({ current: '', newPw: '', confirm: '' });
    } catch (err) { setPwMsg(err.message); }
  }

  async function revokeSession(id) {
    try { await apiFetch(`/api/v1/auth/sessions/${id}`, { method: 'DELETE' }); setSessions((s) => s.filter((x) => x.id !== id)); } catch {}
  }

  async function revokeAllOthers() {
    try {
      await apiFetch('/api/v1/auth/sessions/revoke-all-others', { method: 'POST' });
      setSessions((s) => s.filter((x) => x.is_current));
    } catch {}
  }

  async function setup2fa() {
    try {
      const d = await apiFetch('/api/v1/auth/2fa/setup');
      setMfaSetup(d);
      setMfaMsg('');
    } catch (err) { setMfaMsg(err.message); }
  }

  async function confirm2fa(e) {
    e.preventDefault();
    try {
      const d = await apiFetch('/api/v1/auth/2fa/confirm', { method: 'POST', body: JSON.stringify({ code: mfaCode }) });
      setMfaBackupCodes(d.backupCodes || []);
      setMfaMsg('2FA enabled. Save your backup codes.');
    } catch (err) { setMfaMsg(err.message); }
  }

  async function disable2fa() {
    try {
      await apiFetch('/api/v1/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ code: mfaCode }) });
      setMfaSetup(null);
      setMfaMsg('2FA disabled.');
    } catch (err) { setMfaMsg(err.message); }
  }

  if (loading) return <div className="panel"><div className="empty-note">Loading account…</div></div>;

  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/')}>← Back to workspace</button>
      <div className="module-head">
        <h1>Account &amp; Security</h1>
        <p className="module-sub">Manage your profile, password, active sessions, and security settings.</p>
      </div>

      <div className="invoice-tabs" style={{ marginBottom: 24 }}>
        {['profile','security','activity'].map((t) => (
          <button key={t} className={`invoice-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={saveProfile}>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><div className="card-title">Profile</div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '0 4px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-muted)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user?.avatarUrl ? (
                  <img
                    src={`/api/v1/auth/avatar/${user.avatarUrl}`}
                    alt="Profile Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {initials(user?.fullName)}
                  </span>
                )}
              </div>
              <div>
                <label className="primary-btn" style={{ cursor: 'pointer', display: 'inline-block', fontSize: '0.85rem', padding: '6px 12px' }}>
                  Upload Avatar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  PNG, JPG, GIF or WEBP. Max 2MB.
                </p>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Full name</label>
              <input className="field-input" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} required />
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <input className="field-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
              <p className="field-helper">Email changes require password verification through the security tab.</p>
            </div>
            {msg && <div className={`form-banner-error`} style={{ color: msg.includes('Error') ? 'var(--danger)' : 'var(--success)', background: msg.includes('Error') ? 'var(--danger-bg)' : 'var(--success-bg)' }}>{msg}</div>}
            <button className="primary-btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      )}

      {tab === 'security' && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><div className="card-title">Change password</div></div>
            <form onSubmit={changePassword}>
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <input className="field-input" type="password" placeholder="Current password" value={changePw.current} onChange={(e) => setChangePw({ ...changePw, current: e.target.value })} required />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <input className="field-input" type="password" placeholder="New password" value={changePw.newPw} onChange={(e) => setChangePw({ ...changePw, newPw: e.target.value })} required />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <input className="field-input" type="password" placeholder="Confirm new password" value={changePw.confirm} onChange={(e) => setChangePw({ ...changePw, confirm: e.target.value })} required />
                </div>
              </div>
              {pwMsg && <div className="form-banner-error" style={{ color: pwMsg.includes('Error') ? 'var(--danger)' : 'var(--success)', background: pwMsg.includes('Error') ? 'var(--danger-bg)' : 'var(--success-bg)' }}>{pwMsg}</div>}
              <button className="primary-btn" type="submit">Change password</button>
            </form>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Two-factor authentication</div>
              {!user?.totpEnabled && !mfaSetup && <button className="primary-btn" onClick={setup2fa}>Enable 2FA</button>}
            </div>
            {mfaSetup && !user?.totpEnabled && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code below to confirm.</p>
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <img src={mfaSetup.qrDataUri} alt="2FA QR code" style={{ width: 180, height: 180 }} />
                </div>
                <form onSubmit={confirm2fa} style={{ display: 'flex', gap: 10 }}>
                  <input className="field-input" style={{ maxWidth: 200 }} value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="000000" required />
                  <button className="primary-btn" type="submit">Confirm</button>
                </form>
              </div>
            )}
            {mfaBackupCodes.length > 0 && (
              <div style={{ marginTop: 14, background: 'var(--surface-muted)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--danger)' }}>Save these backup codes — they will not be shown again.</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
                  {mfaBackupCodes.map((c, i) => <code key={i} style={{ padding: '4px 6px', background: 'var(--surface)', borderRadius: 4 }}>{c}</code>)}
                </div>
              </div>
            )}
            {user?.totpEnabled && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>● 2FA is enabled.</p>
                <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                  <input className="field-input" style={{ maxWidth: 200 }} value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="Enter code to disable" />
                  <button className="btn-danger" onClick={disable2fa} style={{ padding: '0.6rem 1rem', fontSize: 13 }}>Disable</button>
                </div>
              </div>
            )}
            {mfaMsg && <div className="form-banner-error" style={{ marginTop: 10, color: mfaMsg.includes('Error') ? 'var(--danger)' : 'var(--success)', background: mfaMsg.includes('Error') ? 'var(--danger-bg)' : 'var(--success-bg)' }}>{mfaMsg}</div>}
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Active sessions</div>
              <button className="btn-ghost" onClick={revokeAllOthers} style={{ fontSize: 12 }}>Revoke all other sessions</button>
            </div>
            {sessions.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No active sessions.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {sessions.map((s) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface-muted)', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {s.user_agent ? s.user_agent.substring(0, 60) : 'Unknown device'}
                        {s.is_current ? <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>(current)</span> : null}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {s.ip_address} · {new Date(s.created_at).toLocaleString()} · Expires {new Date(s.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    {!s.is_current && <button className="ctag" style={{ color: 'var(--danger)' }} onClick={() => revokeSession(s.id)}>Revoke</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'activity' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Recent activity</div></div>
          {auditLog.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No activity recorded yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Action</th>
                    <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>IP</th>
                    <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Details</th>
                    <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>When</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((a) => (
                    <tr key={a.id}>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>{a.action.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{a.ip_address || '—'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.meta ? JSON.stringify(a.meta) : '—'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
