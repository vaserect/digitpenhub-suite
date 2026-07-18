'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../../lib/api';
import { getLeadFormStarterTemplates } from '../../lib/starterTemplates';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import ConfirmDialog from '../ui/ConfirmDialog';
import StarterTemplateModal from '../ui/StarterTemplateModal';
import PopupBuilder from './LeadGeneration/PopupBuilder';
import ABTestingManager from './LeadGeneration/ABTestingManager';
import AnalyticsDashboard from './LeadGeneration/AnalyticsDashboard';
import WebhooksManager from './LeadGeneration/WebhooksManager';
import ScoringRulesManager from './LeadGeneration/ScoringRulesManager';
import ConditionalLogicBuilder from './LeadGeneration/ConditionalLogicBuilder';
import MultiStepFormBuilder from './LeadGeneration/MultiStepFormBuilder';

function createBlankLeadFormDraft() {
  return { name: '', thankYouMessage: '', fields: [] };
}

function cloneTemplateDraft(value) {
  return JSON.parse(JSON.stringify(value));
}

export default function LeadGenerationModule({ goHome, showToast }) {
  const [leadForms, setLeadForms] = useState([]);
  const [leadSubmissions, setLeadSubmissions] = useState([]);
  const [leadStats, setLeadStats] = useState(null);
  const [leadsLoaded, setLeadsLoaded] = useState(false);
  const [leadConfirmAction, setLeadConfirmAction] = useState(null);
  const [leadConfirming, setLeadConfirming] = useState(false);
  const [leadsTab, setLeadsTab] = useState('forms');
  const [showLeadFormBuilder, setShowLeadFormBuilder] = useState(false);
  const [leadFormDraft, setLeadFormDraft] = useState(createBlankLeadFormDraft());
  const [editingLeadFormId, setEditingLeadFormId] = useState(null);
  const [viewEmbedFormId, setViewEmbedFormId] = useState(null);
  const [leadInboxFilter, setLeadInboxFilter] = useState('all');
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [editSubmissionDraft, setEditSubmissionDraft] = useState({ status: 'new', notes: '' });
  const [leadFormError, setLeadFormError] = useState('');
  const [leadTemplateOpen, setLeadTemplateOpen] = useState(false);
  const [selectedFormForABTest, setSelectedFormForABTest] = useState(null);
  const [selectedFormForLogic, setSelectedFormForLogic] = useState(null);

  const leadStarterTemplates = useMemo(() => getLeadFormStarterTemplates(), []);

  async function loadLeads() {
    try {
      const [formsRes, subsRes, statsRes] = await Promise.all([
        apiFetch('/api/v1/leads/forms'),
        apiFetch('/api/v1/leads/submissions'),
        apiFetch('/api/v1/leads/stats'),
      ]);
      setLeadForms(formsRes.forms || []);
      setLeadSubmissions(subsRes.submissions || []);
      setLeadStats(statsRes);
      setLeadsLoaded(true);
    } catch {
      setLeadsLoaded(true);
    }
  }

  useEffect(() => {
    loadLeads().catch(() => showToast('Failed to load leads.'));
  }, []);

  function startBlankLeadForm() {
    setEditingLeadFormId(null);
    setLeadFormDraft(createBlankLeadFormDraft());
    setLeadFormError('');
    setShowLeadFormBuilder(true);
  }

  function useLeadStarterTemplate(template) {
    setEditingLeadFormId(null);
    setLeadFormDraft(cloneTemplateDraft(template.draft));
    setLeadFormError('');
    setShowLeadFormBuilder(true);
    setLeadTemplateOpen(false);
    showToast('Template applied — adjust the copy or fields before publishing.');
  }

  function addLeadField(type) {
    const id = `field_${Date.now()}`;
    const defaults = {
      text: { label: 'Text field', placeholder: '' },
      email: { label: 'Email address', placeholder: 'your@email.com' },
      phone: { label: 'Phone number', placeholder: '+234...' },
      textarea: { label: 'Message', placeholder: 'Your message...' },
      select: { label: 'Select option', placeholder: '', options: ['Option 1', 'Option 2'] },
      checkbox: { label: 'Agreement', placeholder: 'I agree to be contacted' },
    };
    const d = defaults[type] || defaults.text;
    setLeadFormDraft((prev) => ({
      ...prev,
      fields: [...prev.fields, { id, type, label: d.label, placeholder: d.placeholder, required: true, options: d.options || [] }],
    }));
  }

  function updateLeadField(id, key, value) {
    setLeadFormDraft((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)),
    }));
  }

  function removeLeadField(id) {
    setLeadFormDraft((prev) => ({ ...prev, fields: prev.fields.filter((f) => f.id !== id) }));
  }

  function moveLeadField(id, dir) {
    setLeadFormDraft((prev) => {
      const idx = prev.fields.findIndex((f) => f.id === id);
      if (idx < 0) return prev;
      const next = [...prev.fields];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return { ...prev, fields: next };
    });
  }

  async function handleSaveLeadForm(e) {
    e.preventDefault();
    setLeadFormError('');
    if (!leadFormDraft.name.trim()) { setLeadFormError('Form name is required.'); return; }
    try {
      if (editingLeadFormId) {
        await apiFetch(`/api/v1/leads/forms/${editingLeadFormId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: leadFormDraft.name, fields: leadFormDraft.fields, thankYouMessage: leadFormDraft.thankYouMessage }),
        });
        setEditingLeadFormId(null);
      } else {
        await apiFetch('/api/v1/leads/forms', {
          method: 'POST',
          body: JSON.stringify({ name: leadFormDraft.name, fields: leadFormDraft.fields, thankYouMessage: leadFormDraft.thankYouMessage }),
        });
      }
      setLeadFormDraft(createBlankLeadFormDraft());
      setShowLeadFormBuilder(false);
      await loadLeads();
    } catch (err) {
      setLeadFormError(err.message || 'Unable to save form.');
    }
  }

  function startEditLeadForm(form) {
    setEditingLeadFormId(form.id);
    setLeadFormDraft({
      name: form.name,
      thankYouMessage: form.thank_you_message || '',
      fields: Array.isArray(form.fields_json) ? form.fields_json : [],
    });
    setShowLeadFormBuilder(true);
  }

  function handleDeleteLeadForm(id) { setLeadConfirmAction({ type: 'form', id }); }

  async function handleUpdateSubmission(e) {
    e.preventDefault();
    await apiFetch(`/api/v1/leads/submissions/${editingSubmissionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: editSubmissionDraft.status, notes: editSubmissionDraft.notes }),
    });
    setEditingSubmissionId(null);
    await loadLeads();
  }

  function handleDeleteSubmission(id) { setLeadConfirmAction({ type: 'submission', id }); }

  async function confirmLeadAction() {
    if (!leadConfirmAction) return;
    setLeadConfirming(true);
    try {
      if (leadConfirmAction.type === 'form') {
        await apiFetch(`/api/v1/leads/forms/${leadConfirmAction.id}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/v1/leads/submissions/${leadConfirmAction.id}`, { method: 'DELETE' });
      }
      await loadLeads();
    } finally { setLeadConfirming(false); setLeadConfirmAction(null); }
  }

  function copyEmbedCode(formId) {
    const url = `${window.location.origin}/leads/${formId}`;
    const code = `<iframe src="${url}" style="width:100%;height:600px;border:none;" title="Contact form"></iframe>`;
    if (navigator.clipboard) navigator.clipboard.writeText(code);
    showToast('Embed code copied to clipboard.');
  }

  // Render A/B Testing view for a specific form
  if (selectedFormForABTest) {
    const form = leadForms.find(f => f.id === selectedFormForABTest);
    return (
      <div className="panel">
        <button className="back-link" onClick={() => setSelectedFormForABTest(null)}>← Back to forms</button>
        <ABTestingManager
          formId={selectedFormForABTest}
          formName={form?.name || 'Form'}
          showToast={showToast}
        />
      </div>
    );
  }

  // Render Conditional Logic view for a specific form
  if (selectedFormForLogic) {
    const form = leadForms.find(f => f.id === selectedFormForLogic);
    return (
      <div className="panel">
        <button className="back-link" onClick={() => setSelectedFormForLogic(null)}>← Back to forms</button>
        <ConditionalLogicBuilder
          formId={selectedFormForLogic}
          formName={form?.name || 'Form'}
          fields={form?.fields_json || []}
          showToast={showToast}
        />
      </div>
    );
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Lead Generation</h1>
          <p className="module-sub">Build capture forms, collect leads, and manage them through a pipeline.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {leadsTab === 'forms' && (
            <>
              <Button variant="secondary" onClick={() => setLeadTemplateOpen(true)}>Choose a template</Button>
              <Button onClick={() => { if (showLeadFormBuilder) setShowLeadFormBuilder(false); else startBlankLeadForm(); }}>
                {showLeadFormBuilder ? 'Cancel' : 'Start from scratch'}
              </Button>
            </>
          )}
        </div>
      </div>

      {leadStats && (
        <div className="stage-strip">
          <div className="stage-card"><div className="num">{leadStats.forms}</div><div className="lbl">Forms</div></div>
          <div className="stage-card"><div className="num">{leadStats.total}</div><div className="lbl">Total leads</div></div>
          <div className="stage-card"><div className="num">{leadStats.new_count}</div><div className="lbl">New</div></div>
          <div className="stage-card"><div className="num">{leadStats.contacted_count}</div><div className="lbl">Contacted</div></div>
          <div className="stage-card"><div className="num">{leadStats.converted_count}</div><div className="lbl">Converted</div></div>
        </div>
      )}

      <div className="invoice-tabs" style={{ marginBottom: 20 }}>
        {[
          { key: 'forms', label: 'Forms' },
          { key: 'inbox', label: 'Leads inbox' },
          { key: 'pipeline', label: 'Pipeline' },
          { key: 'popups', label: 'Popups' },
          { key: 'analytics', label: 'Analytics' },
          { key: 'scoring', label: 'Scoring' },
          { key: 'webhooks', label: 'Webhooks' }
        ].map((t) => (
          <button key={t.key} type="button"
            className={`invoice-tab${leadsTab === t.key ? ' active' : ''}`}
            onClick={() => { setLeadsTab(t.key); setShowLeadFormBuilder(false); setViewEmbedFormId(null); setLeadFormError(''); }}>
            {t.label}
            {t.key === 'inbox' && leadStats && <span className="invoice-tab-count">{leadStats.total}</span>}
            {t.key === 'inbox' && leadStats?.new_count > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: 999, background: 'var(--danger)', color: 'white', fontSize: 10, fontWeight: 700, marginLeft: 2 }}>{leadStats.new_count}</span>}
          </button>
        ))}
      </div>

      {leadFormError && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(220,38,38,.1)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,.2)', marginBottom: 14, fontSize: 13 }}>{leadFormError}</div>
      )}

      {leadsTab === 'popups' && (
        <PopupBuilder forms={leadForms} onClose={() => setLeadsTab('forms')} showToast={showToast} />
      )}

      {leadsTab === 'analytics' && (
        <AnalyticsDashboard forms={leadForms} showToast={showToast} />
      )}

      {leadsTab === 'webhooks' && (
        <WebhooksManager showToast={showToast} />
      )}

      {leadsTab === 'scoring' && (
        <ScoringRulesManager showToast={showToast} />
      )}

      {leadsTab === 'forms' && (
        <>
          {showLeadFormBuilder && (
            <form onSubmit={handleSaveLeadForm} style={{ marginBottom: 24 }}>
              <div className="card" style={{ marginBottom: 14 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>{editingLeadFormId ? 'Edit form' : 'New form'}</h3>
                <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Form name</label>
                    <input value={leadFormDraft.name} onChange={(e) => setLeadFormDraft({ ...leadFormDraft, name: e.target.value })} required autoFocus />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Thank you message</label>
                    <input value={leadFormDraft.thankYouMessage} onChange={(e) => setLeadFormDraft({ ...leadFormDraft, thankYouMessage: e.target.value })} placeholder="Thank you! We will be in touch." />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Fields ({leadFormDraft.fields.length})</strong>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['text', 'email', 'phone', 'textarea', 'select', 'checkbox'].map((type) => (
                      <button key={type} type="button" className="ctag" onClick={() => addLeadField(type)}>+ {type}</button>
                    ))}
                  </div>
                </div>

                {leadFormDraft.fields.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Add at least one field using the buttons above.</p>
                )}

                <div style={{ display: 'grid', gap: 8 }}>
                  {leadFormDraft.fields.map((field, idx) => (
                    <div key={field.id} className="card" style={{ background: 'var(--surface-muted)', padding: 12 }}>
                      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr auto auto', alignItems: 'center', marginBottom: field.type === 'select' ? 8 : 0 }}>
                        <div className="field" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: 10 }}>Label</label>
                          <input value={field.label} onChange={(e) => updateLeadField(field.id, 'label', e.target.value)} style={{ fontSize: 12, padding: '5px 8px' }} />
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: 10 }}>{field.type === 'checkbox' ? 'Checkbox label' : 'Placeholder'}</label>
                          <input value={field.placeholder} onChange={(e) => updateLeadField(field.id, 'placeholder', e.target.value)} style={{ fontSize: 12, padding: '5px 8px' }} />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                          <input type="checkbox" checked={field.required} onChange={(e) => updateLeadField(field.id, 'required', e.target.checked)} />Required
                        </label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {idx > 0 && <button type="button" className="ctag" onClick={() => moveLeadField(field.id, -1)}>↑</button>}
                          {idx < leadFormDraft.fields.length - 1 && <button type="button" className="ctag" onClick={() => moveLeadField(field.id, 1)}>↓</button>}
                          <button type="button" className="ctag" style={{ color: 'var(--danger)' }} onClick={() => removeLeadField(field.id)}>✕</button>
                        </div>
                      </div>
                      {field.type === 'select' && (
                        <div className="field" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: 10 }}>Options (one per line)</label>
                          <textarea
                            value={(field.options || []).join('\n')}
                            onChange={(e) => updateLeadField(field.id, 'options', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                            rows={3}
                            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', fontSize: 12, resize: 'vertical', fontFamily: 'monospace' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <MultiStepFormBuilder
                draft={leadFormDraft}
                setDraft={setLeadFormDraft}
                fields={leadFormDraft.fields}
                showToast={showToast}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="primary-btn" type="submit">{editingLeadFormId ? 'Save changes' : 'Create form'}</button>
                {editingLeadFormId && <button type="button" className="back-link" style={{ margin: 0 }} onClick={() => { setEditingLeadFormId(null); setShowLeadFormBuilder(false); }}>Cancel</button>}
              </div>
            </form>
          )}

          {!leadsLoaded ? (
            <div className="empty-note">Loading forms…</div>
          ) : leadForms.length === 0 ? (
            <EmptyState
              icon="🧲"
              title="No lead forms yet"
              description="Start with a blank capture form or use a ready-made inquiry template."
              action={(
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button onClick={startBlankLeadForm}>Start from scratch</Button>
                  <Button variant="secondary" onClick={() => setLeadTemplateOpen(true)}>Choose a template</Button>
                </div>
              )}
            />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {leadForms.map((form) => (
                <div key={form.id} className="card">
                  {viewEmbedFormId === form.id ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <strong>Embed code — {form.name}</strong>
                        <button className="ctag" onClick={() => setViewEmbedFormId(null)}>Close</button>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                        Public URL: <a href={`/leads/${form.id}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{window.location.origin}/leads/{form.id}</a>
                      </p>
                      <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', wordBreak: 'break-all', marginBottom: 10 }}>
                        {`<iframe src="${window.location.origin}/leads/${form.id}" style="width:100%;height:600px;border:none;" title="${form.name}"></iframe>`}
                      </div>
                      <button className="primary-btn" onClick={() => copyEmbedCode(form.id)}>Copy embed code</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{form.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                          <strong style={{ color: 'var(--primary)' }}>{form.submission_count}</strong> submissions
                          {' · '}
                          {form.is_active ? <span style={{ color: 'var(--success)' }}>Active</span> : <span style={{ color: 'var(--text-muted)' }}>Inactive</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="ctag" onClick={() => apiFetch(`/api/v1/leads/forms/${form.id}`).then((d) => startEditLeadForm(d.form)).catch(() => showToast('Unable to load form.'))}>Edit</button>
                        <button className="ctag" onClick={() => setSelectedFormForABTest(form.id)}>A/B Test</button>
                        <button className="ctag" onClick={() => setSelectedFormForLogic(form.id)}>Logic</button>
                        <button className="ctag" onClick={() => setViewEmbedFormId(form.id)}>Embed</button>
                        <button className="ctag" onClick={() => { window.open(`/leads/${form.id}`, '_blank'); }}>Preview</button>
                        <button className="ctag" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteLeadForm(form.id)}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {leadsTab === 'inbox' && (() => {
        const filtered = leadInboxFilter === 'all'
          ? leadSubmissions
          : leadSubmissions.filter((s) => s.status === leadInboxFilter);
        return (
          <>
            <div className="invoice-tabs" style={{ marginTop: -8, marginBottom: 16 }}>
              {[
                { key: 'all', label: 'All', count: leadSubmissions.length },
                { key: 'new', label: 'New', count: leadSubmissions.filter((s) => s.status === 'new').length },
                { key: 'contacted', label: 'Contacted', count: leadSubmissions.filter((s) => s.status === 'contacted').length },
                { key: 'converted', label: 'Converted', count: leadSubmissions.filter((s) => s.status === 'converted').length },
                { key: 'lost', label: 'Lost', count: leadSubmissions.filter((s) => s.status === 'lost').length },
              ].map((tab) => (
                <button key={tab.key} type="button"
                  className={`invoice-tab${leadInboxFilter === tab.key ? ' active' : ''}`}
                  onClick={() => setLeadInboxFilter(tab.key)}>
                  {tab.label}<span className="invoice-tab-count">{tab.count}</span>
                </button>
              ))}
            </div>

            {!leadsLoaded ? (
              <div className="empty-note">Loading leads…</div>
            ) : filtered.length === 0 ? (
              <div className="empty-note">No leads in this category yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {filtered.map((sub) => (
                  <div key={sub.id} className="card">
                    {editingSubmissionId === sub.id ? (
                      <form onSubmit={handleUpdateSubmission} style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 2fr auto auto' }}>
                        <div className="field" style={{ marginBottom: 0 }}>
                          <label>Status</label>
                          <select value={editSubmissionDraft.status} onChange={(e) => setEditSubmissionDraft({ ...editSubmissionDraft, status: e.target.value })}>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}>
                          <label>Notes</label>
                          <input value={editSubmissionDraft.notes} onChange={(e) => setEditSubmissionDraft({ ...editSubmissionDraft, notes: e.target.value })} placeholder="Add notes…" />
                        </div>
                        <button className="primary-btn" type="submit" style={{ alignSelf: 'end' }}>Save</button>
                        <button type="button" className="back-link" style={{ margin: 0, alignSelf: 'end' }} onClick={() => setEditingSubmissionId(null)}>Cancel</button>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{sub.form_name}</span>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                              color: sub.status === 'new' ? 'var(--primary)' : sub.status === 'converted' ? 'var(--success)' : sub.status === 'lost' ? 'var(--danger)' : 'var(--warning)',
                              background: sub.status === 'new' ? 'rgba(37,99,235,.1)' : sub.status === 'converted' ? 'rgba(22,163,74,.1)' : sub.status === 'lost' ? 'rgba(220,38,38,.1)' : 'rgba(245,158,11,.1)',
                            }}>
                              {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12.5 }}>
                            {Object.entries(sub.data_json || {}).slice(0, 5).map(([k, v]) => (
                              <span key={k} style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text)' }}>{v === true ? '✓' : v === false ? '✗' : String(v)}</strong></span>
                            ))}
                          </div>
                          {sub.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5, fontStyle: 'italic' }}>"{sub.notes}"</div>}
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5 }}>{new Date(sub.submitted_at).toLocaleString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="ctag" onClick={() => { setEditingSubmissionId(sub.id); setEditSubmissionDraft({ status: sub.status, notes: sub.notes || '' }); }}>Edit</button>
                          <button className="ctag" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteSubmission(sub.id)}>Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        );
      })()}

      {leadsTab === 'pipeline' && (() => {
        const cols = [
          { key: 'new', label: 'New', color: 'var(--primary)' },
          { key: 'contacted', label: 'Contacted', color: 'var(--warning)' },
          { key: 'converted', label: 'Converted', color: 'var(--success)' },
          { key: 'lost', label: 'Lost', color: 'var(--danger)' },
        ];
        return (
          <div className="board" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {cols.map((col) => {
              const colLeads = leadSubmissions.filter((s) => s.status === col.key);
              return (
                <div key={col.key}>
                  <div className="col-head">
                    <span style={{ color: col.color }}>{col.label}</span>
                    <span>{colLeads.length}</span>
                  </div>
                  {colLeads.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No leads</div>}
                  {colLeads.map((sub) => {
                    const entries = Object.entries(sub.data_json || {});
                    const title = entries.length > 0 ? String(entries[0][1]).slice(0, 40) : 'Lead';
                    const secondary = entries.length > 1 ? String(entries[1][1]).slice(0, 40) : sub.form_name;
                    return (
                      <div key={sub.id} className="card" style={{ marginBottom: 8, padding: 10 }}>
                        <div className="ctitle" style={{ marginBottom: 4 }}>{title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8 }}>{secondary}</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {cols.filter((c) => c.key !== col.key).map((c) => (
                            <button key={c.key} type="button" className="ctag" style={{ fontSize: 10.5 }}
                              onClick={async () => { await apiFetch(`/api/v1/leads/submissions/${sub.id}`, { method: 'PATCH', body: JSON.stringify({ status: c.key }) }); await loadLeads(); }}>
                              → {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })()}

      <ConfirmDialog
        isOpen={!!leadConfirmAction}
        onClose={() => setLeadConfirmAction(null)}
        onConfirm={confirmLeadAction}
        title={leadConfirmAction?.type === 'form' ? 'Delete this form and all its submissions?' : 'Delete this lead?'}
        description="This can't be undone."
        confirmLabel="Delete"
        danger
        loading={leadConfirming}
      />
      <StarterTemplateModal
        isOpen={leadTemplateOpen}
        onClose={() => setLeadTemplateOpen(false)}
        title="Choose a lead form template"
        description="Start with a proven inquiry flow, then tailor the fields for your team."
        templates={leadStarterTemplates}
        onUse={useLeadStarterTemplate}
      />
    </div>
  );
}