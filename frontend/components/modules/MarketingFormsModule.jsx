'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';

export default function MarketingFormsModule({ goHome }) {
  const [tab, setTab] = useState('forms');
  const [forms, setForms] = useState([]);
  const [popups, setPopups] = useState([]);
  const [funnels, setFunnels] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null);
  const [draft, setDraft] = useState({ name: '', title: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, p, fn, q] = await Promise.all([
        apiFetch('/api/v1/leads/forms'),
        apiFetch('/api/v1/popup-builder'),
        apiFetch('/api/v1/funnels'),
        apiFetch('/api/v1/quiz-builder'),
      ]);
      setForms(f.forms || []);
      setPopups(p.popups || []);
      setFunnels(fn.funnels || []);
      setQuizzes(q.quizzes || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head"><h1>Marketing Tools</h1><p className="module-sub">Forms, popups, funnels, quizzes, and more.</p></div>
      <div className="invoice-tabs" style={{ marginBottom: 16 }}>
        {[{ k: 'forms', l: 'Forms' }, { k: 'popups', l: 'Popups' }, { k: 'funnels', l: 'Funnels' }, { k: 'quizzes', l: 'Quizzes' }].map(t => (
          <button key={t.k} className={`invoice-tab${tab===t.k?' active':''}`} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>
      {loading ? <SkeletonRows rows={4} /> : (
        <>
          {tab === 'forms' && (forms.length === 0 ? <EmptyState icon="📋" title="No forms yet" /> : (
            <div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Submissions</th></tr></thead>
              <tbody>{forms.map(f => <tr key={f.id}><td style={{ fontWeight: 600 }}>{f.name}</td><td>{f.submission_count || 0}</td></tr>)}</tbody>
            </table></div>
          ))}
          {tab === 'popups' && (popups.length === 0 ? <EmptyState icon="🪟" title="No popups yet" /> : (
            <div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Views</th><th>Conversions</th></tr></thead>
              <tbody>{popups.map(p => <tr key={p.id}><td style={{ fontWeight: 600 }}>{p.name}</td><td>{p.views || 0}</td><td style={{ color: 'var(--success)' }}>{p.conversions || 0}</td></tr>)}</tbody>
            </table></div>
          ))}
          {tab === 'funnels' && (funnels.length === 0 ? <EmptyState icon="🔻" title="No funnels yet" /> : (
            <div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Steps</th></tr></thead>
              <tbody>{funnels.map(f => <tr key={f.id}><td style={{ fontWeight: 600 }}>{f.name}</td><td>{f.step_count || f.steps?.length || 0}</td></tr>)}</tbody>
            </table></div>
          ))}
          {tab === 'quizzes' && (quizzes.length === 0 ? <EmptyState icon="❓" title="No quizzes yet" /> : (
            <div className="table-wrap"><table className="data-table"><thead><tr><th>Title</th><th>Responses</th></tr></thead>
              <tbody>{quizzes.map(q => <tr key={q.id}><td style={{ fontWeight: 600 }}>{q.title}</td><td>{q.response_count || 0}</td></tr>)}</tbody>
            </table></div>
          ))}
        </>
      )}
    </div>
  );
}
