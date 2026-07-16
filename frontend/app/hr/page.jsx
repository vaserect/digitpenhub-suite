'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import TabBar from '../../components/ui/TabBar';
import Pagination from '../../components/ui/Pagination';

const PAGE_SIZES = { employees: 10, leave: 10, departments: 20 };

export default function HrPage() {
  const router = useRouter();
  const [tab, setTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [leaveReqs, setLeaveReqs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', department: '', employmentType: 'full_time', salaryNgn: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [page, setPage] = useState(1);

  const TABS = [
    { key: 'employees', label: 'Employees' },
    { key: 'leave', label: 'Leave' },
    { key: 'departments', label: 'Departments' },
  ];

  const load = useCallback(async () => {
    try {
      const [e, l, d] = await Promise.all([
        apiFetch('/api/v1/hr/employees').catch(() => ({ employees: [] })),
        apiFetch('/api/v1/hr/leave').catch(() => ({ requests: [] })),
        apiFetch('/api/v1/hr/departments').catch(() => ({ departments: [] })),
      ]);
      setEmployees(e.employees || []);
      setLeaveReqs(l.requests || []);
      setDepartments(d.departments || []);
    } catch { toast.error('Failed to load HR data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = (tab === 'employees' ? employees : tab === 'leave' ? leaveReqs : departments)
    .filter((x) => !search || (x.full_name || x.name || '').toLowerCase().includes(search.toLowerCase()));
  const ps = PAGE_SIZES[tab] || 10;
  const pc = Math.max(1, Math.ceil(filtered.length / ps));
  const rows = filtered.slice((page - 1) * ps, page * ps);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      if (tab === 'departments') {
        await apiFetch('/api/v1/hr/departments', { method: 'POST', body: JSON.stringify({ name: form.fullName }) });
      } else {
        await apiFetch('/api/v1/hr/employees', { method: 'POST', body: JSON.stringify(form) });
      }
      toast.success('Created!'); setShowForm(false); setForm({ fullName: '', email: '', phone: '', department: '', employmentType: 'full_time', salaryNgn: '' }); await load();
    } catch (err) { toast.error(err.message); }
  }

  async function handleDelete(id, type) {
    try {
      await apiFetch(`/api/v1/hr/${type}/${id}`, { method: 'DELETE' });
      toast.success('Deleted'); await load();
    } catch (err) { toast.error(err.message); } finally { setConfirmDelete(null); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/')}>← Back to workspace</button>
      <div className="module-head">
        <h1>HR &amp; People</h1>
        <p className="module-sub">Manage employees, leave requests, and departments.</p>
      </div>
      <TabBar tabs={TABS} active={tab} onChange={(t) => { setTab(t); setPage(1); setSearch(''); }} />
      <div style={{ display: 'flex', gap: 10, margin: '16px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}><SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={`Search ${tab}…`} /></div>
        <Button onClick={() => setShowForm(true)}>+ New {tab === 'departments' ? 'department' : tab === 'leave' ? 'leave request' : 'employee'}</Button>
      </div>
      {loading ? <SkeletonRows rows={4} /> : rows.length === 0 ? (
        <EmptyState icon="👥" title={`No ${tab} yet`} description={`Add your first ${tab.slice(0, -1)} to get started.`} action={<Button onClick={() => setShowForm(true)}>+ Add</Button>} />
      ) : (
        <div className="card-shell" style={{ overflow: 'hidden' }}>
          <table className="dft">
            <thead><tr>
              {['employees', 'leave'].includes(tab)
                ? ['Name', 'Email', tab === 'leave' ? 'Type' : 'Department', 'Status', 'Date', ''].map(h => <th key={h} style={{ textAlign:'left', padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)' }}>{h}</th>)
                : ['Name', 'Head', 'Employees', ''].map(h => <th key={h} style={{ textAlign:'left', padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.full_name || r.name}</td>
                  {tab === 'departments' ? (
                    <>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{r.head_name || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>{r.employee_count || 0}</td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '10px 14px' }}>{r.email}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>{tab === 'leave' ? r.leave_type : r.department || '—'}</td>
                      <td style={{ padding: '10px 14px' }}><Badge variant={r.status === 'active' || r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'neutral'}>{r.status}</Badge></td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    </>
                  )}
                  <td style={{ padding: '10px 14px' }}>
                    <Button size="sm" variant="danger" onClick={() => setConfirmDelete({ id: r.id, type: tab === 'leave' ? 'leave' : tab === 'departments' ? 'departments' : 'employees' })}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pageCount={pc} total={filtered.length} pageSize={ps} onPageChange={setPage} />
        </div>
      )}
      {showForm && (
        <Modal isOpen title={`New ${tab === 'departments' ? 'department' : tab === 'leave' ? 'leave request' : 'employee'}`} onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label className="field-label">{tab === 'departments' ? 'Name' : tab === 'leave' ? 'Employee name' : 'Full name'}</label>
              <input className="field-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            {tab !== 'departments' && (
              <><div className="field"><label className="field-label">Email</label><input className="field-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div></>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Modal>
      )}
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete.id, confirmDelete.type)} title="Delete?" description="This cannot be undone." confirmLabel="Delete" cancelLabel="Cancel" danger />
    </div>
  );
}
