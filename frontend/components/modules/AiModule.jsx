'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import TabBar from '../ui/TabBar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { SkeletonRows } from '../ui/Skeleton';

const TABS = [
  { key: 'writer', label: 'AI Writer' },
  { key: 'chatbot', label: 'Chatbot' },
  { key: 'faq', label: 'FAQ' },
  { key: 'translate', label: 'Translator' },
];

export default function AiModule({ goHome }) {
  const [tab, setTab] = useState('writer');
  const [docs, setDocs] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [chatFlows, setChatFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null); // null | 'doc'
  const [editingDoc, setEditingDoc] = useState(null); // null | doc object
  const [confirmDelete, setConfirmDelete] = useState(null); // null | { id, title }
  const [draft, setDraft] = useState({ title: '', content: '' });
  const [prompt, setPrompt] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, faqsRes, transRes, chatRes] = await Promise.all([
        apiFetch('/api/v1/ai-documents').catch(() => ({ documents: [] })),
        apiFetch('/api/v1/ai-support').catch(() => ({ faqs: [] })),
        apiFetch('/api/v1/ai-translator/history').catch(() => ({ history: [] })),
        apiFetch('/api/v1/chatbot-builder').catch(() => ({ flows: [] })),
      ]);
      setDocs(docsRes.documents || []);
      setFaqs(faqsRes.faqs || []);
      setTranslations(transRes.history || []);
      setChatFlows(chatRes.flows || chatRes || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveDoc(e) {
    e.preventDefault();
    if (!draft.title.trim()) { toast.error('Title is required.'); return; }
    try {
      if (editingDoc) {
        await apiFetch(`/api/v1/ai-documents/${editingDoc.id}`, { method: 'PUT', body: JSON.stringify(draft) });
        toast.success('Document updated!');
      } else {
        await apiFetch('/api/v1/ai-documents', { method: 'POST', body: JSON.stringify(draft) });
        toast.success('Document created!');
      }
      setShowForm(null); setEditingDoc(null); setDraft({ title: '', content: '' }); load();
    } catch (err) { toast.error(err.message); }
  }

  async function deleteDoc() {
    if (!confirmDelete) return;
    try {
      await apiFetch(`/api/v1/ai-documents/${confirmDelete.id}`, { method: 'DELETE' });
      toast.success('Document deleted!'); setConfirmDelete(null); load();
    } catch (err) { toast.error(err.message); }
  }

  function openEdit(doc) {
    setDraft({ title: doc.title || '', content: doc.content || '' });
    setEditingDoc(doc);
    setShowForm('doc');
  }

  async function generateContent() {
    if (!prompt.trim()) return toast.error('Enter a prompt');
    try {
      const r = await apiFetch('/api/v1/ai-documents/generate', { method: 'POST', body: JSON.stringify({ prompt }) });
      setDraft({ title: prompt.slice(0, 50), content: r.content || r.text || '' });
      toast.success('Content generated!');
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head"><h1>AI Suite</h1><p className="module-sub">AI Writer, Chatbot, Translator, Customer Support, and more.</p></div>

      <TabBar tabs={TABS} activeKey={tab} onChange={setTab} />

      {loading ? <SkeletonRows rows={4} /> : (
        <>
          {tab === 'writer' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, marginTop: 16 }}>
                <input className="field-input" placeholder="Ask AI to write something…" value={prompt} onChange={e => setPrompt(e.target.value)} style={{ flex: 1 }} />
                <Button onClick={generateContent}>Generate</Button>
                <Button variant="secondary" onClick={() => { setEditingDoc(null); setDraft({ title: '', content: '' }); setShowForm('doc'); }}>+ New</Button>
              </div>

              <Modal isOpen={showForm === 'doc'} title={editingDoc ? 'Edit Document' : 'Create Document'} onClose={() => { setShowForm(null); setEditingDoc(null); }}>
                <form onSubmit={saveDoc}>
                  <div className="field"><label className="field-label">Title</label><input className="field-input" value={draft.title} onChange={e => setDraft({...draft, title: e.target.value})} required /></div>
                  <div className="field"><label className="field-label">Content</label><textarea className="field-input" value={draft.content} onChange={e => setDraft({...draft, content: e.target.value})} rows={8} /></div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                    <Button variant="secondary" type="button" onClick={() => { setShowForm(null); setEditingDoc(null); }}>Cancel</Button>
                    <Button type="submit">{editingDoc ? 'Update' : 'Create'}</Button>
                  </div>
                </form>
              </Modal>

              {docs.length === 0 ? (
                <EmptyState icon="✍️" title="No documents yet" action={<Button onClick={() => { setEditingDoc(null); setDraft({ title: '', content: '' }); setShowForm('doc'); }}>+ New Document</Button>} />
              ) : (
                <div className="table-wrap"><table className="data-table">
                  <thead><tr><th>Title</th><th>Updated</th><th style={{ width: 120 }}>Actions</th></tr></thead>
                  <tbody>{docs.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.title}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(d.updated_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Button size="sm" variant="secondary" onClick={() => openEdit(d)}>Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => setConfirmDelete({ id: d.id, title: d.title })}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </>
          )}

          {tab === 'chatbot' && (
            chatFlows.length === 0 ? <EmptyState icon="🤖" title="No chatbot flows yet" description="Build AI chatbot flows for your website." /> : (
              <div className="table-wrap"><table className="data-table">
                <thead><tr><th>Name</th><th>Status</th></tr></thead>
                <tbody>{chatFlows.map(f => (
                  <tr key={f.id}><td style={{ fontWeight: 600 }}>{f.name}</td><td><Badge variant={f.is_active ? 'success' : 'neutral'}>{f.is_active ? 'Active' : 'Inactive'}</Badge></td></tr>
                ))}</tbody>
              </table></div>
            )
          )}

          {tab === 'faq' && (
            faqs.length === 0 ? <EmptyState icon="❓" title="No FAQs yet" /> : (
              <div className="table-wrap"><table className="data-table">
                <thead><tr><th>Question</th><th>Category</th></tr></thead>
                <tbody>{faqs.map(f => (
                  <tr key={f.id}><td style={{ fontWeight: 600 }}>{f.question}</td><td>{f.category || '—'}</td></tr>
                ))}</tbody>
              </table></div>
            )
          )}

          {tab === 'translate' && (
            translations.length === 0 ? <EmptyState icon="🌐" title="No translations yet" /> : (
              <div className="table-wrap"><table className="data-table">
                <thead><tr><th>Source</th><th>Target</th><th>Text</th></tr></thead>
                <tbody>{translations.map((t, i) => (
                  <tr key={i}><td>{t.source_lang}</td><td>{t.target_lang}</td><td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{(t.input_text || '').slice(0, 60)}</td></tr>
                ))}</tbody>
              </table></div>
            )
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={deleteDoc}
        title="Delete document?"
        description={confirmDelete ? `Permanently delete "${confirmDelete.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
      />
    </div>
  );
}
