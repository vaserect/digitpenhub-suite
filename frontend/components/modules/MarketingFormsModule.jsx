'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';
import Pagination from '../ui/Pagination';
import { useSearchHotkey } from '../../lib/hotkeys';

export default function MarketingFormsModule({ goHome }) {
  const [tab, setTab] = useState('forms');
  const [forms, setForms] = useState([]);
  const [popups, setPopups] = useState([]);
  const [funnels, setFunnels] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null);
  const [draft, setDraft] = useState({ name: '', title: '' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useSearchHotkey();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, p, fn, q] = await Promise.all([
        apiFetch('/api/v1/leads/forms').catch(() => { console.error('Failed to load Forms'); return { forms: [] } }),
        apiFetch('/api/v1/popup-builder').catch(() => { console.error('Failed to load Popups'); return { popups: [] } }),
        apiFetch('/api/v1/funnels').catch(() => { console.error('Failed to load Funnels'); return { funnels: [] } }),
        apiFetch('/api/v1/quiz-builder').catch(() => { console.error('Failed to load Quizzes'); return { quizzes: [] } }),
      ]);
      setForms(f.forms || []);
      setPopups(p.popups || []);
      setFunnels(fn.funnels || []);
      setQuizzes(q.quizzes || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createItem(e) {
    e.preventDefault();
    const slug = { forms: 'lead-generation', popups: 'popup-builder', funnels: 'funnel-builder', quizzes: 'quiz-builder' }[tab];
    const endpoint = { forms: '/api/v1/leads/forms', popups: '/api/v1/popup-builder', funnels: '/api/v1/funnels', quizzes: '/api/v1/quiz-builder' }[tab];
    try {
      await apiFetch(endpoint, { method: 'POST', body: JSON.stringify({ name: draft.name, title: draft.title || draft.name }) });
      toast.success(`${tab.slice(0, -1)} created`); setShowForm(null); setDraft({ name: '', title: '' }); load();
    } catch (err) { toast.error(err.message); }
  }

  const activeData = { forms, popups, funnels, quizzes }[tab] || [];
  const pageCount = Math.max(1, Math.ceil(activeData.length / PAGE_SIZE));
  const pageRows = activeData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [tab]);

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Marketing Tools</h1>
          <p className="module-sub">Forms, popups, funnels, quizzes, surveys, and more. <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘F search</kbd></p>
        </div>
      </div>
      <div className="invoice-tabs" style={{marginBottom:16,flexWrap:'wrap'}}>
        {[{k:'forms',l:'Forms'},{k:'popups',l:'Popups'},{k:'funnels',l:'Funnels'},{k:'quizzes',l:'Quizzes'}].map(t=>(
          <button key={t.k} className={`invoice-tab${tab===t.k?' active':''}`} onClick={()=>setTab(t.k)}>
            {t.l} <span className="invoice-tab-count">{activeData.length}</span>
          </button>
        ))}
      </div>

      <div style={{marginBottom:16,display:'flex',gap:8,flexWrap:'wrap'}}>
        <Button onClick={()=>{setShowForm(tab);setDraft({name:'',title:''});}}>+ New {tab.slice(0,-1)}</Button>
        {activeData.length > 0 && <Button variant="secondary" size="sm" onClick={() => {
          const csv = [['Name','Created'],...activeData.map(r => [r.name||r.title||'',r.created_at?new Date(r.created_at).toLocaleDateString():''])].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
          const blob = new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${tab}.csv`;a.click();URL.revokeObjectURL(blob);
          toast.success('CSV exported');
        }}>📥 CSV</Button>}
      </div>

      <Modal isOpen={showForm===tab} title={`New ${tab.slice(0,-1)}`} onClose={()=>setShowForm(null)}>
        <form onSubmit={createItem}>
          <div className="field"><label className="field-label">Name</label><input className="field-input" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} required autoFocus /></div>
          <div style={{display:'flex',gap:8}}><Button type="submit">Create</Button><Button variant="secondary" type="button" onClick={()=>setShowForm(null)}>Cancel</Button></div>
        </form>
      </Modal>

      {loading ? <SkeletonRows rows={4} /> : activeData.length === 0 ? (
        <EmptyState icon={tab==='forms'?'📋':tab==='popups'?'🪟':tab==='funnels'?'🔻':'❓'} title={`No ${tab} yet`}
          action={<Button onClick={()=>{setShowForm(tab);setDraft({name:'',title:''});}}>+ New {tab.slice(0,-1)}</Button>} />
      ) : (
        <div className="table-wrap"><table className="data-table"><thead><tr>
          <th>Name</th>
          {tab==='forms'&&<th>Submissions</th>}
          {tab==='popups'&&<><th>Views</th><th>Conversions</th></>}
          {tab==='funnels'&&<th>Steps</th>}
          {tab==='quizzes'&&<><th>Responses</th><th>Questions</th></>}
          <th>Created</th>
        </tr></thead>
        <tbody>{pageRows.map(item => (
          <tr key={item.id}>
            <td style={{fontWeight:600}}>{item.name||item.title}</td>
            {tab==='forms'&&<td>{item.submission_count||0}</td>}
            {tab==='popups'&&<><td>{item.views||0}</td><td style={{color:'var(--success)'}}>{item.conversions||0}</td></>}
            {tab==='funnels'&&<td>{item.step_count||item.steps?.length||0}</td>}
            {tab==='quizzes'&&<><td>{item.response_count||0}</td><td>{item.question_count||0}</td></>}
            <td style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{item.created_at?new Date(item.created_at).toLocaleDateString():'—'}</td>
          </tr>
        ))}</tbody></table></div>
      )}
      {pageCount>1&&<Pagination page={page} pageCount={pageCount} total={activeData.length} pageSize={PAGE_SIZE} onPageChange={setPage}/>}
    </div>
  );
}
