'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../../lib/api';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Copy, 
  Eye, 
  Code, 
  Layers, 
  Settings, 
  Clock, 
  HelpCircle,
  TrendingUp,
  Grid
} from 'lucide-react';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { getSurveyFormStarterTemplates } from '../../lib/starterTemplates';

export default function FormBuilderModule({ slug, goHome, showToast }) {
  const isSurvey = slug === 'survey-builder';
  const [tab, setTab] = useState('list');
  const [loading, setLoading] = useState(true);

  // Forms State
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState({ activeForms: 0, totalResponses: 0 });
  const [responses, setResponses] = useState([]);
  const [viewingFormId, setViewingFormId] = useState(null);

  // Form Editor Drafts
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [formDraft, setFormDraft] = useState({
    name: '',
    description: '',
    submitMessage: 'Thank you for your submission!',
    status: 'active',
    fields: []
  });

  // New field constructor state
  const [newField, setNewField] = useState({
    label: '',
    type: 'text',
    required: false,
    options: '',
    showIfFieldId: '',
    showIfValue: ''
  });

  // Modal States
  const [isEmbedOpen, setIsEmbedOpen] = useState(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Reordering & Conditional logic draft state
  const [draggedFieldId, setDraggedFieldId] = useState(null);
  const [logicEditFieldId, setLogicEditFieldId] = useState(null);
  const [logicDraft, setLogicDraft] = useState({ showIfFieldId: '', showIfValue: '' });

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [formConfirmDelete, setFormConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const starterTemplates = useMemo(() => getSurveyFormStarterTemplates(), []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, listRes] = await Promise.all([
        apiFetch('/api/v1/forms/stats'),
        apiFetch('/api/v1/forms/')
      ]);
      setStats(statsRes);
      setForms(listRes.forms || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load form builder data.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Edit / Creation Setup
  const startNewForm = () => {
    setEditingForm(null);
    setFormDraft({
      name: '',
      description: '',
      submitMessage: 'Thank you for your submission!',
      status: 'active',
      fields: []
    });
    setNewField({ label: '', type: 'text', required: false, options: '', showIfFieldId: '', showIfValue: '' });
    setIsEditorOpen(true);
  };

  const applyTemplate = (template) => {
    setEditingForm(null);
    // Clone template fields
    const fieldsClone = JSON.parse(JSON.stringify(template.draft?.fields || []));
    setFormDraft({
      name: template.name,
      description: template.description || '',
      submitMessage: template.draft?.submitMessage || 'Thank you for your submission!',
      status: 'active',
      fields: fieldsClone
    });
    setIsTemplatesOpen(false);
    setIsEditorOpen(true);
    showToast('Starter template applied. Review the fields below before saving.');
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formDraft.name.trim()) {
      showToast('Form name is required.');
      return;
    }

    try {
      setIsSaving(true);
      const method = editingForm ? 'PUT' : 'POST';
      const url = editingForm ? `/api/v1/forms/${editingForm.id}` : '/api/v1/forms/';
      
      const payload = {
        name: formDraft.name.trim(),
        description: formDraft.description || '',
        submitMessage: formDraft.submitMessage || 'Thank you for your submission!',
        status: formDraft.status,
        fields: formDraft.fields
      };

      await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      showToast(editingForm ? 'Form updated.' : 'Form created.');
      setIsEditorOpen(false);
      setEditingForm(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save form.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditForm = (frm) => {
    setEditingForm(frm);
    setFormDraft({
      name: frm.name,
      description: frm.description || '',
      submitMessage: frm.submit_message || 'Thank you for your submission!',
      status: frm.status,
      fields: Array.isArray(frm.fields) ? frm.fields : []
    });
    setIsEditorOpen(true);
  };

  const confirmDeleteForm = async () => {
    if (!formConfirmDelete) return;
    try {
      setIsDeleting(true);
      await apiFetch(`/api/v1/forms/${formConfirmDelete}`, { method: 'DELETE' });
      showToast('Form deleted.');
      setFormConfirmDelete(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete form.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Response Ledger
  const loadResponses = async (formId) => {
    try {
      setViewingFormId(formId);
      const res = await apiFetch(`/api/v1/forms/${formId}/responses`);
      setResponses(res.responses || []);
      setTab('responses');
    } catch (err) {
      console.error(err);
      showToast('Failed to load form responses.');
    }
  };

  // Field manipulation helpers
  const addField = () => {
    if (!newField.label.trim()) {
      showToast('Field label is required.');
      return;
    }
    const field = {
      id: `field_${Date.now()}`,
      label: newField.label.trim(),
      type: newField.type,
      required: !!newField.required,
      options: ['select', 'radio'].includes(newField.type)
        ? newField.options.split(',').map(o => o.trim()).filter(Boolean)
        : [],
      showIf: newField.showIfFieldId
        ? { fieldId: newField.showIfFieldId, operator: 'equals', value: newField.showIfValue }
        : null
    };

    setFormDraft(prev => ({
      ...prev,
      fields: [...prev.fields, field]
    }));

    // Reset field constructor
    setNewField({
      label: '',
      type: 'text',
      required: false,
      options: '',
      showIfFieldId: '',
      showIfValue: ''
    });
  };

  const removeField = (fieldId) => {
    setFormDraft(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }));
  };

  const addPageBreak = () => {
    setFormDraft(prev => ({
      ...prev,
      fields: [...prev.fields, { id: `field_${Date.now()}`, type: 'pagebreak' }]
    }));
  };

  const startFieldLogicEdit = (field) => {
    setLogicEditFieldId(field.id);
    setLogicDraft({
      showIfFieldId: field.showIf ? String(field.showIf.fieldId) : '',
      showIfValue: field.showIf ? field.showIf.value : ''
    });
  };

  const saveFieldLogic = () => {
    const showIf = logicDraft.showIfFieldId
      ? { fieldId: logicDraft.showIfFieldId, operator: 'equals', value: logicDraft.showIfValue }
      : null;

    setFormDraft(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === logicEditFieldId ? { ...f, showIf } : f)
    }));

    setLogicEditFieldId(null);
  };

  // Drag Reorder implementation
  const handleDropField = (dropFieldId) => {
    if (!draggedFieldId || draggedFieldId === dropFieldId) return;
    setFormDraft(prev => {
      const fields = [...prev.fields];
      const fromIdx = fields.findIndex(f => f.id === draggedFieldId);
      const toIdx = fields.findIndex(f => f.id === dropFieldId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = fields.splice(fromIdx, 1);
      fields.splice(toIdx, 0, moved);
      return { ...prev, fields };
    });
    setDraggedFieldId(null);
  };

  const filteredForms = useMemo(() => {
    return forms.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [forms, searchTerm]);

  const viewingForm = useMemo(() => {
    return forms.find(f => f.id === viewingFormId);
  }, [forms, viewingFormId]);

  return (
    <div className="panel">
      {tab === 'responses' ? (
        <button className="back-link" onClick={() => { setTab('list'); setViewingFormId(null); }}>← Forms</button>
      ) : (
        <button className="back-link" onClick={goHome}>← Workspace</button>
      )}

      <div className="module-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <FileText className="primary-color" style={{ width: 28, height: 28 }} />
            {isSurvey ? 'Survey Builder' : 'Forms & Surveys'}
          </h1>
          <p className="module-sub">Build rich forms with page breaks, multi-step layouts, and custom logic rules to collect data without login requirements.</p>
        </div>

        {tab === 'list' && !isEditorOpen && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setIsTemplatesOpen(true)}>
              Choose a starter
            </Button>
            <Button onClick={startNewForm}>
              <Plus style={{ width: 16, height: 16, marginRight: 4 }} />
              Start blank
            </Button>
          </div>
        )}
      </div>

      {/* Stats Summary Panel */}
      {tab === 'list' && !isEditorOpen && stats && (
        <div className="stage-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="stage-card">
            <div className="num">{stats.activeForms || 0}</div>
            <div className="lbl">Active Forms</div>
          </div>
          <div className="stage-card">
            <div className="num" style={{ color: 'var(--primary)' }}>{stats.totalResponses || 0}</div>
            <div className="lbl">Total Responses Collected</div>
          </div>
        </div>
      )}

      {/* EDITOR WORKSPACE VIEW */}
      {isEditorOpen ? (
        <form onSubmit={handleSaveForm} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            {editingForm ? 'Modify Form Settings' : 'Create New intake Form'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="field">
              <label className="field-label">Form Title *</label>
              <input
                className="field-input"
                required
                placeholder="e.g. Client Feedback Form"
                value={formDraft.name}
                onChange={(e) => setFormDraft(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="field-label">Status</label>
              <select
                className="field-select"
                value={formDraft.status}
                onChange={(e) => setFormDraft(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="active">Active (publicly open)</option>
                <option value="draft">Draft (closed)</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Internal Description</label>
              <input
                className="field-input"
                placeholder="Write a private memo about this form..."
                value={formDraft.description}
                onChange={(e) => setFormDraft(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Success Message (Shown after submission)</label>
              <input
                className="field-input"
                placeholder="Thank you for your submission!"
                value={formDraft.submitMessage}
                onChange={(e) => setFormDraft(prev => ({ ...prev, submitMessage: e.target.value }))}
              />
            </div>
          </div>

          {/* Form Fields Canvas */}
          <div style={{ background: 'var(--panel)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 700 }}>Form Canvas Fields</h3>
            
            {formDraft.fields.length === 0 ? (
              <p style={{ margin: '1rem 0', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                Your form has no fields yet. Use the field constructor below to add questions.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                {(() => {
                  let currentPage = 1;
                  return formDraft.fields.map((f, i) => {
                    const gateField = f.showIf ? formDraft.fields.find(x => x.id === f.showIf.fieldId) : null;
                    
                    if (f.type === 'pagebreak') {
                      const pageTitle = `Page ${++currentPage} Starts Here`;
                      return (
                        <div
                          key={f.id}
                          draggable
                          onDragStart={() => setDraggedFieldId(f.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDropField(f.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 0.5rem',
                            borderTop: '2px dashed var(--primary)',
                            background: 'rgba(59, 130, 246, 0.05)',
                            cursor: 'grab',
                            borderRadius: 4
                          }}
                        >
                          <span style={{ cursor: 'grab', color: 'var(--text-muted)', fontSize: 14 }}>⠿</span>
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                            {pageTitle}
                          </span>
                          <button 
                            type="button" 
                            className="btn-ghost" 
                            style={{ color: 'var(--danger)', padding: '2px 6px', fontSize: 12 }}
                            onClick={() => removeField(f.id)}
                          >
                            ×
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={f.id} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div
                          draggable
                          onDragStart={() => setDraggedFieldId(f.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDropField(f.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            background: 'var(--bg)',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            cursor: 'grab'
                          }}
                        >
                          <span style={{ cursor: 'grab', color: 'var(--text-muted)', fontSize: 14 }}>⠿</span>
                          <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{f.label}</span>
                          <Badge variant="secondary">{f.type}</Badge>
                          {f.required && <span className="ctag danger" style={{ background: 'rgba(239,68,68,0.1)', color: 'rgb(239,68,68)' }}>required</span>}
                          {gateField && (
                            <span className="ctag primary" style={{ background: 'rgba(59,130,246,0.1)', color: 'rgb(59,130,246)' }}>
                              logic active
                            </span>
                          )}

                          <button 
                            type="button" 
                            className="btn-ghost" 
                            style={{ fontSize: 11 }}
                            onClick={() => logicEditFieldId === f.id ? setLogicEditFieldId(null) : startFieldLogicEdit(f)}
                          >
                            {logicEditFieldId === f.id ? 'Close logic' : 'Logic rules'}
                          </button>

                          <button 
                            type="button" 
                            className="btn-ghost" 
                            style={{ color: 'var(--danger)', padding: '2px 6px', fontSize: 12 }}
                            onClick={() => removeField(f.id)}
                          >
                            ×
                          </button>
                        </div>

                        {/* Inline Logic editor */}
                        {logicEditFieldId === f.id && (
                          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--surface-active)', border: '1px solid var(--border)', borderTop: 'none', borderBottomLeftRadius: 6, borderBottomRightRadius: 6, marginLeft: '1.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: 12 }}>
                            <span>Show this field only if</span>
                            <select 
                              className="form-input" 
                              style={{ width: 'auto', fontSize: 12, padding: '2px 6px' }}
                              value={logicDraft.showIfFieldId} 
                              onChange={(e) => setLogicDraft(prev => ({ ...prev, showIfFieldId: e.target.value }))}
                            >
                              <option value="">(Always show)</option>
                              {formDraft.fields
                                .filter(x => x.id !== f.id && x.type !== 'pagebreak')
                                .map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
                            </select>

                            {logicDraft.showIfFieldId && (
                              <>
                                <span>equals</span>
                                <input
                                  className="form-input"
                                  style={{ width: 'auto', fontSize: 12, padding: '2px 6px' }}
                                  placeholder="Match value"
                                  value={logicDraft.showIfValue}
                                  onChange={(e) => setLogicDraft(prev => ({ ...prev, showIfValue: e.target.value }))}
                                />
                              </>
                            )}
                            <button type="button" className="ctag success" style={{ cursor: 'pointer' }} onClick={saveFieldLogic}>
                              Save Logic
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* Field Constructor Interface */}
            <div style={{ background: 'var(--surface-active)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>Add New Field Constructor</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  className="form-input"
                  style={{ flex: 2, minWidth: 150 }}
                  placeholder="Ask a question..."
                  value={newField.label}
                  onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                />
                
                <select
                  className="form-input"
                  style={{ flex: 1, minWidth: 120 }}
                  value={newField.type}
                  onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="text">Single Line Text</option>
                  <option value="email">Email Address</option>
                  <option value="phone">Phone Number</option>
                  <option value="number">Numeric Input</option>
                  <option value="textarea">Paragraph Textarea</option>
                  <option value="select">Dropdown Choice</option>
                  <option value="radio">Radio Options</option>
                  <option value="checkbox">Multi-select Checkbox</option>
                  <option value="date">Date picker</option>
                </select>

                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                  />
                  Required
                </label>

                <Button type="button" variant="secondary" onClick={addField}>
                  + Add Question
                </Button>
              </div>

              {['select', 'radio'].includes(newField.type) && (
                <div className="field">
                  <label className="field-label">Option Choices (Comma-separated)</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Small, Medium, Large"
                    value={newField.options}
                    onChange={(e) => setNewField(prev => ({ ...prev, options: e.target.value }))}
                  />
                </div>
              )}

              {formDraft.fields.filter(x => x.type !== 'pagebreak').length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Only show this new question if</span>
                  <select
                    className="form-input"
                    style={{ width: 'auto', fontSize: 11, padding: '2px 4px' }}
                    value={newField.showIfFieldId}
                    onChange={(e) => setNewField(prev => ({ ...prev, showIfFieldId: e.target.value }))}
                  >
                    <option value="">(Always show)</option>
                    {formDraft.fields.filter(f => f.type !== 'pagebreak').map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                  {newField.showIfFieldId && (
                    <>
                      <span>equals</span>
                      <input
                        className="form-input"
                        style={{ width: 'auto', fontSize: 11, padding: '2px 4px' }}
                        placeholder="match value"
                        value={newField.showIfValue}
                        onChange={(e) => setNewField(prev => ({ ...prev, showIfValue: e.target.value }))}
                      />
                    </>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <button type="button" className="btn-ghost" style={{ fontSize: 11, color: 'var(--primary)' }} onClick={addPageBreak}>
                  + Split Form page (Add Page Break)
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" type="button" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : editingForm ? 'Update Form' : 'Publish Form'}
            </Button>
          </div>
        </form>
      ) : tab === 'responses' ? (
        /* RESPONSES SCREEN LISTING */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
              Form: {viewingForm?.name}
            </h3>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Total: {responses.length} Submissions
            </span>
          </div>

          {responses.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No responses collected yet"
              description="Share the public page URL of your form with your customers."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {viewingForm?.fields
                      ?.filter(f => f.type !== 'pagebreak')
                      ?.map(f => <th key={f.id}>{f.label}</th>)}
                    <th>Date Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r, idx) => (
                    <tr key={r.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                      {viewingForm?.fields
                        ?.filter(f => f.type !== 'pagebreak')
                        ?.map(f => (
                          <td key={f.id} style={{ fontSize: 12 }}>
                            {r.data?.[f.id] !== undefined ? String(r.data[f.id]) : '—'}
                          </td>
                        ))}
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(r.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD LEDGER VIEW */
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: '2rem', width: '100%' }}
                placeholder="Search forms by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredForms.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No forms found"
              description="Create a custom contact page, inquiry questionnaire, or satisfaction survey."
              action={
                <Button onClick={startNewForm}>
                  Create First Form
                </Button>
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Questions</th>
                    <th>Submissions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForms.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{f.name}</div>
                        {f.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.description}</div>}
                      </td>
                      <td>{(f.fields || []).length} questions</td>
                      <td>
                        <button className="btn-ghost" style={{ fontSize: 12, fontWeight: 600 }} onClick={() => loadResponses(f.id)}>
                          {f.response_count || 0} responses
                        </button>
                      </td>
                      <td>
                        <span className="ctag" style={{ background: f.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-active)', color: f.status === 'active' ? 'rgb(16, 185, 129)' : 'var(--text-muted)' }}>
                          {f.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            className="btn-ghost" 
                            style={{ fontSize: 12 }} 
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/forms/${f.id}`);
                              showToast('Public link copied to clipboard.');
                            }}
                          >
                            Copy Link
                          </button>
                          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setIsEmbedOpen(f)}>
                            Embed
                          </button>
                          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => handleEditForm(f)}>
                            Edit
                          </button>
                          <button className="btn-ghost" style={{ fontSize: 12, color: 'var(--danger)' }} onClick={() => setFormConfirmDelete(f.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* STARTER TEMPLATE MODAL */}
      {isTemplatesOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, background: 'var(--panel)', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Choose Form Starter Template</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 300, overflowY: 'auto', marginBottom: '1rem' }}>
              {starterTemplates.map((t, idx) => (
                <div key={idx} className="card hover-card" style={{ padding: '0.75rem', cursor: 'pointer', border: '1px solid var(--border)' }} onClick={() => applyTemplate(t)}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.description}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setIsTemplatesOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EMBED CODE MODAL */}
      {isEmbedOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: 450, background: 'var(--panel)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Embed: {isEmbedOpen.name}</h3>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Public form URL</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input 
                  className="form-input" 
                  readOnly 
                  style={{ flex: 1 }}
                  value={`${window.location.origin}/forms/${isEmbedOpen.id}`} 
                />
                <Button variant="secondary" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/forms/${isEmbedOpen.id}`);
                  showToast('Public link copied.');
                }}>
                  Copy
                </Button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>IFrame embed code</div>
              <textarea 
                className="form-input" 
                readOnly 
                rows={3} 
                style={{ width: '100%', fontFamily: 'monospace', fontSize: 11 }}
                value={`<iframe src="${window.location.origin}/forms/${isEmbedOpen.id}" width="100%" height="700" style="border:0;" title="${isEmbedOpen.name}"></iframe>`} 
              />
              <div style={{ marginTop: 4 }}>
                <Button variant="secondary" onClick={() => {
                  navigator.clipboard.writeText(`<iframe src="${window.location.origin}/forms/${isEmbedOpen.id}" width="100%" height="700" style="border:0;" title="${isEmbedOpen.name}"></iframe>`);
                  showToast('IFrame embed snippet copied.');
                }}>
                  Copy Code
                </Button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setIsEmbedOpen(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!formConfirmDelete}
        onClose={() => setFormConfirmDelete(null)}
        onConfirm={confirmDeleteForm}
        title="Delete Form?"
        description="This will permanently delete this form and all response history gathered for it."
        confirmLabel="Delete Form"
        danger
        loading={isDeleting}
      />
    </div>
  );
}
