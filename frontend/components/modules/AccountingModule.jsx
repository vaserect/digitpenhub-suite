'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';

export default function AccountingModule({ goHome }) {
  const [tab, setTab] = useState('stats');
  const [accounts, setAccounts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [pl, setPl] = useState(null);
  const [bs, setBs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null); // 'account' | 'entry'
  const [accDraft, setAccDraft] = useState({ name: '', type: 'asset', code: '' });
  const [entryDraft, setEntryDraft] = useState({ description: '', debitAccountId: '', creditAccountId: '', amount: 0, date: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a, e, p, b] = await Promise.all([
        apiFetch('/api/v1/accounting/stats'),
        apiFetch('/api/v1/accounting/accounts'),
        apiFetch('/api/v1/accounting/entries'),
        apiFetch('/api/v1/accounting/reports/pl'),
        apiFetch('/api/v1/accounting/reports/balance-sheet'),
      ]);
      setStats(s.stats || null);
      setAccounts(a.accounts || []);
      setEntries(e.entries || []);
      setPl(p.pl || null);
      setBs(b.balanceSheet || null);
    } catch { toast.error('Failed to load accounting data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createAccount(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/accounting/accounts', { method: 'POST', body: JSON.stringify(accDraft) });
      toast.success('Account created');
      setShowForm(null); setAccDraft({ name: '', type: 'asset', code: '' }); load();
    } catch (err) { toast.error(err.message); }
  }

  async function createEntry(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/accounting/entries', { method: 'POST', body: JSON.stringify(entryDraft) });
      toast.success('Journal entry posted');
      setShowForm(null); setEntryDraft({ description: '', debitAccountId: '', creditAccountId: '', amount: 0, date: '' }); load();
    } catch (err) { toast.error(err.message); }
  }

  const accountTypes = ['asset','liability','equity','income','expense'];

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>Accounting</h1>
        <p className="module-sub">Chart of accounts, journal entries, and financial reports.</p>
      </div>

      <div className="invoice-tabs" style={{ marginBottom: 16 }}>
        {[{ k: 'stats', l: 'Overview' }, { k: 'accounts', l: 'Accounts' }, { k: 'entries', l: 'Journal' }, { k: 'reports', l: 'Reports' }].map((t) => (
          <button key={t.k} className={`invoice-tab${tab === t.k ? ' active' : ''}`} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>

      {loading ? <SkeletonRows rows={5} /> : (
        <>
          {tab === 'stats' && stats && (
            <div className="stats-row">
              <div className="stat-card"><div className="stat-value">{stats.totalAccounts}</div><div className="stat-label">Accounts</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--success)' }}>{stats.totalEntries}</div><div className="stat-label">Journal Entries</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.totalDebits ? stats.totalDebits.toFixed(2) : '0'}</div><div className="stat-label">Total Debits</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.totalCredits ? stats.totalCredits.toFixed(2) : '0'}</div><div className="stat-label">Total Credits</div></div>
            </div>
          )}

          {tab === 'accounts' && (
            <>
              <Button onClick={() => setShowForm('account')}>+ New Account</Button>

              <Modal isOpen={showForm === 'account'} title="Create Account" onClose={() => setShowForm(null)}>
                <form onSubmit={createAccount}>
                  <div className="field"><label className="field-label">Name</label><input className="field-input" value={accDraft.name} onChange={(e) => setAccDraft({...accDraft,name:e.target.value})} required /></div>
                  <div className="field"><label className="field-label">Type</label>
                    <select className="field-input" value={accDraft.type} onChange={(e) => setAccDraft({...accDraft,type:e.target.value})}>
                      {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="field"><label className="field-label">Code</label><input className="field-input" value={accDraft.code} onChange={(e) => setAccDraft({...accDraft,code:e.target.value})} /></div>
                  <Button type="submit">Create</Button>
                </form>
              </Modal>

              {accounts.length === 0 ? <EmptyState icon="📒" title="No accounts yet" description="Create your chart of accounts." action={<Button onClick={() => setShowForm('account')}>+ New Account</Button>} /> : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Balance</th></tr></thead>
                    <tbody>
                      {accounts.map((a) => (
                        <tr key={a.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{a.code || '—'}</td>
                          <td style={{ fontWeight: 600 }}>{a.name}</td>
                          <td><Badge variant="neutral">{a.type}</Badge></td>
                          <td style={{ fontWeight: 600 }}>{Number(a.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'entries' && (
            <>
              <Button onClick={() => setShowForm('entry')}>+ New Journal Entry</Button>
              <Modal isOpen={showForm === 'entry'} title="Create Journal Entry" onClose={() => setShowForm(null)}>
                <form onSubmit={createEntry}>
                  <div className="field"><label className="field-label">Description</label><input className="field-input" value={entryDraft.description} onChange={(e) => setEntryDraft({...entryDraft,description:e.target.value})} required /></div>
                  <div className="field"><label className="field-label">Debit account</label>
                    <select className="field-input" value={entryDraft.debitAccountId} onChange={(e) => setEntryDraft({...entryDraft,debitAccountId:e.target.value})} required>
                      <option value="">Select</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                    </select>
                  </div>
                  <div className="field"><label className="field-label">Credit account</label>
                    <select className="field-input" value={entryDraft.creditAccountId} onChange={(e) => setEntryDraft({...entryDraft,creditAccountId:e.target.value})} required>
                      <option value="">Select</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                    </select>
                  </div>
                  <div className="field"><label className="field-label">Amount</label><input className="field-input" type="number" min="0.01" step="0.01" value={entryDraft.amount} onChange={(e) => setEntryDraft({...entryDraft,amount:parseFloat(e.target.value)})} required /></div>
                  <Button type="submit">Post Entry</Button>
                </form>
              </Modal>
              {entries.length === 0 ? <EmptyState icon="📝" title="No journal entries yet" /> : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Amount</th></tr></thead>
                    <tbody>
                      {entries.map((e) => (
                        <tr key={e.id}>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(e.date || e.created_at).toLocaleDateString()}</td>
                          <td>{e.description}</td>
                          <td style={{ fontSize: '0.8rem' }}>{e.debit_account_name || e.debit_account_id?.slice(0, 8)}</td>
                          <td style={{ fontSize: '0.8rem' }}>{e.credit_account_name || e.credit_account_id?.slice(0, 8)}</td>
                          <td style={{ fontWeight: 600 }}>{Number(e.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'reports' && (
            <div style={{ display: 'grid', gap: 24 }}>
              <div className="card" style={{ padding: 16 }}>
                <h3 style={{ marginBottom: 12 }}>Profit & Loss</h3>
                {pl ? (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {pl.income !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Income</span><span style={{ color: 'var(--success)', fontWeight: 600 }}>{Number(pl.income).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
                    {pl.expenses !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Expenses</span><span style={{ color: 'var(--danger)', fontWeight: 600 }}>{Number(pl.expenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
                    {pl.netIncome !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border)', paddingTop: 8, marginTop: 8, fontWeight: 700 }}><span>Net Income</span><span style={{ color: pl.netIncome >= 0 ? 'var(--success)' : 'var(--danger)' }}>{Number(pl.netIncome).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
                  </div>
                ) : <p className="muted">No data yet.</p>}
              </div>
              <div className="card" style={{ padding: 16 }}>
                <h3 style={{ marginBottom: 12 }}>Balance Sheet</h3>
                {bs ? (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {bs.totalAssets !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Assets</span><span style={{ fontWeight: 600 }}>{Number(bs.totalAssets).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
                    {bs.totalLiabilities !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Liabilities</span><span style={{ fontWeight: 600 }}>{Number(bs.totalLiabilities).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
                    {bs.totalEquity !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Equity</span><span style={{ fontWeight: 600 }}>{Number(bs.totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
                  </div>
                ) : <p className="muted">No data yet.</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
