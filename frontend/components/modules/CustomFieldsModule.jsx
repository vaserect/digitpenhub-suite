'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';
import ValidationRuleBuilder from './ValidationRuleBuilder';
import FieldDependencyBuilder from './FieldDependencyBuilder';
import ImportExportModal from './ImportExportModal';
import DraggableFieldRow from './DraggableFieldRow';

const RECORD_TYPES = [
  { value: 'contact', label: 'CRM Contacts', aliases: ['crm_contact'] },
  { value: 'invoice', label: 'Invoices' },
  { value: 'quotation', label: 'Quotations' },
  { value: 'project', label: 'Projects' },
  { value: 'task', label: 'Tasks' },
  { value: 'lead', label: 'Leads' },
  { value: 'product', label: 'Products' },
  { value: 'inventory_item', label: 'Inventory Items' },
  { value: 'hr_employee', label: 'HR Employees' },
  { value: 'student', label: 'Students' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file', label: 'File' },
  { value: 'relation', label: 'Relation' },
  { value: 'currency', label: 'Currency' },
  { value: 'percent', label: 'Percent' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'rating', label: 'Rating' },
  { value: 'progress', label: 'Progress' },
  { value: 'location', label: 'Location' },
];

const TABS = [
  { id: 'definitions', label: 'Field Definitions' },
  { id: 'templates', label: 'Templates' },
  { id: 'analytics', label: 'Analytics' },
];

function emptyDraft() {
  return {
    key: '',
    label: '',
    fieldType: 'text',
    description: '',
    required: false,
    options: [],
    relationRecordType: '',
    sortOrder: 0,
    currencyCode: 'USD',
    minValue: '',
    maxValue: '',
    formatPattern: '',
    security: {
      visibility: ['owner', 'admin', 'member'],
      editable: ['owner', 'admin'],
      sensitive: false,
      mask_value: false
    },
    validation_rules: [],
    dependencies: [],
  };
}
}

function parseTemplateFields(fields) {
  if (Array.isArray(fields)) return fields;
  if (typeof fields === 'string') {
    try {
      return JSON.parse(fields);
    } catch {
      return [];
    }
  }
  return [];
}

export default function CustomFieldsModule({ goHome }) {
  const [tab, setTab] = useState('definitions');
  const [recordType, setRecordType] = useState('contact');
  const [fields, setFields] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [optionInput, setOptionInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(null);
  const [templateCategory, setTemplateCategory] = useState('all');
  const [showImportExport, setShowImportExport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const recordTypeMeta = useMemo(
  // Filter and search fields
  const filteredFields = useMemo(() => {
    let result = fields;

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(f => f.field_type === filterType);
    }

    // Search by key or label
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.key.toLowerCase().includes(query) ||
        f.label.toLowerCase().includes(query) ||
        (f.description && f.description.toLowerCase().includes(query))
      );
    }

    return result;
  }, [fields, filterType, searchQuery]);
    () => RECORD_TYPES.find((r) => r.value === recordType) || RECORD_TYPES[0],
    [recordType]
  );

  const loadDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/v1/custom-fields/${recordType}`);
      setFields(data.fields || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load custom fields');
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, [recordType]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/v1/custom-fields/templates');
      const all = data.templates || [];
      const aliases = new Set([recordType, ...(recordTypeMeta.aliases || [])]);
      setTemplates(all.filter((t) => aliases.has(t.record_type)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [recordType, recordTypeMeta]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/v1/custom-fields/analytics/summary');
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'definitions') loadDefinitions();
    else if (tab === 'templates') loadTemplates();
    else if (tab === 'analytics') loadAnalytics();
  }, [tab, loadDefinitions, loadTemplates, loadAnalytics]);

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft());
    setOptionInput('');
    setShowForm(true);
  }

  function openEdit(field) {
    setEditing(field);
    setDraft({
      key: field.key || '',
      label: field.label || '',
      fieldType: field.field_type || 'text',
      description: field.description || '',
      required: !!field.required,
      options: Array.isArray(field.options) ? field.options : [],
      relationRecordType: field.relation_record_type || '',
      sortOrder: field.sort_order || 0,
      currencyCode: field.currency_code || 'USD',
      minValue: field.min_value ?? '',
      maxValue: field.max_value ?? '',
      formatPattern: field.format_pattern || '',
    });
    setOptionInput('');
    setShowForm(true);
  }
  function cloneField(field) {
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index) => {
    setDragOverIndex(index);
  };

  const handleDrop = async (dropIndex) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reorderedFields = [...filteredFields];
    const [draggedField] = reorderedFields.splice(draggedIndex, 1);
    reorderedFields.splice(dropIndex, 0, draggedField);

    // Update sort_order for all affected fields
    const updates = reorderedFields.map((field, idx) => ({
      id: field.id,
      sort_order: idx,
    }));

    try {
      const response = await fetch(`/api/custom-fields/${recordType}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) throw new Error('Reorder failed');

      // Reload to get updated order
      await loadDefinitions();
    } catch (error) {
      console.error('Reorder error:', error);
      alert('Failed to reorder fields');
    } finally {
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  };
    const clonedKey = `${field.key}_copy_${Date.now()}`;
    setEditing(null); // Not editing existing, creating new
    setDraft({
      key: clonedKey,
      label: `${field.label} (Copy)`,
      fieldType: field.field_type || 'text',
      description: field.description || '',
      required: !!field.required,
      options: Array.isArray(field.options) ? [...field.options] : [],
      relationRecordType: field.relation_record_type || '',
      sortOrder: (field.sort_order || 0) + 1,
      currencyCode: field.currency_code || 'USD',
      minValue: field.min_value ?? '',
      maxValue: field.max_value ?? '',
      formatPattern: field.format_pattern || '',
      security: field.security ? { ...field.security } : {
        visibility: ['owner', 'admin', 'member'],
        editable: ['owner', 'admin'],
        sensitive: false,
        mask_value: false
      },
      validation_rules: field.validation_rules ? [...field.validation_rules] : [],
      dependencies: field.dependencies ? [...field.dependencies] : [],
    });
    setOptionInput('');
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      key: draft.key.trim(),
      label: draft.label.trim(),
      fieldType: draft.fieldType,
      description: draft.description || null,
      required: !!draft.required,
      options: ['select', 'multiselect'].includes(draft.fieldType) ? draft.options : [],
      relationRecordType: draft.fieldType === 'relation' ? draft.relationRecordType : null,
      sortOrder: Number(draft.sortOrder) || 0,
      currencyCode: draft.fieldType === 'currency' ? draft.currencyCode || 'USD' : undefined,
      minValue:
        draft.minValue === '' || draft.minValue === null || draft.minValue === undefined
          ? undefined
          : Number(draft.minValue),
      maxValue:
        draft.maxValue === '' || draft.maxValue === null || draft.maxValue === undefined
          ? undefined
          : Number(draft.maxValue),
      formatPattern: draft.formatPattern || undefined,
      security: draft.security || {
      validation_rules: draft.validation_rules || [],
      dependencies: draft.dependencies || [],
        visibility: ['owner', 'admin', 'member'],
        editable: ['owner', 'admin'],
        sensitive: false,
        mask_value: false
      },
    };

    try {
      if (editing) {
        await apiFetch(`/api/v1/custom-fields/${recordType}/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Field updated');
      } else {
        await apiFetch(`/api/v1/custom-fields/${recordType}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Field created');
      }
      setShowForm(false);
      setEditing(null);
      loadDefinitions();
    } catch (err) {
      toast.error(err.message || 'Failed to save field');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(field) {
    if (!confirm(`Delete field "${field.label}"? Existing values stay but the field becomes inactive.`)) {
      return;
    }
    try {
      await apiFetch(`/api/v1/custom-fields/${recordType}/${field.id}`, { method: 'DELETE' });
      toast.success('Field deleted');
      loadDefinitions();
    } catch (err) {
      toast.error(err.message || 'Failed to delete field');
    }
  }

  async function handleApplyTemplate(templateId) {
    setApplyingTemplate(templateId);
    try {
      const data = await apiFetch(`/api/v1/custom-fields/templates/${templateId}/apply`, {
        method: 'POST',
        body: JSON.stringify({ recordType }),
      });
      toast.success(data.message || 'Template applied');
      setTab('definitions');
      loadDefinitions();
    } catch (err) {
      toast.error(err.message || 'Failed to apply template');
    } finally {
      setApplyingTemplate(null);
    }
  }

  function addOption() {
    const value = optionInput.trim();
    if (!value) return;
    setDraft((prev) => ({ ...prev, options: [...prev.options, value] }));
    setOptionInput('');
  }

  const categories = useMemo(() => {
    const set = new Set(templates.map((t) => t.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (templateCategory === 'all') return templates;
    return templates.filter((t) => t.category === templateCategory);
  }, [templates, templateCategory]);

  const stats = analytics?.stats || {
    totalFields: 0,
    activeFields: 0,
    recordTypes: 0,
    fieldsWithData: 0,
  };

  return (
    <div className="panel">
      <button className="back-link" type="button" onClick={goHome}>
        ← Workspace
      </button>

      <div className="module-head">
        <div>
          <h1>Custom Fields Engine</h1>
          <p className="module-sub">
            Define reusable fields for contacts, invoices, projects, and other records — the same
            foundation used by Salesforce and ClickUp. Fields you create here appear on records across
            the suite.
          </p>
        </div>
        {tab === 'definitions' && (
          <Button onClick={openCreate}>+ New Field</Button>
        )}
        {tab === 'definitions' && (
          <Button variant="secondary" onClick={() => setShowImportExport(true)}>Import/Export</Button>
        )}
      </div>

      <div className="invoice-tabs" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`invoice-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'definitions' || tab === 'templates') && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Record type</label>
          <select
            className="field-input"
            style={{ maxWidth: 240 }}
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
          >
            {RECORD_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>
                {rt.label}
              </option>
            ))}
          </select>
        </div>
          {tab === 'definitions' && (
            <>
              <input
                type="text"
                className="field-input"
                placeholder="Search fields by key, label, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ maxWidth: 300 }}
              />
              <select
                className="field-input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ maxWidth: 200 }}
              >
                <option value="all">All Types</option>
                {FIELD_TYPES.map(ft => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
              {(searchQuery || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Clear Filters
                </button>
              )}
            </>
          )}
      )}

      {loading ? (
        <SkeletonRows rows={6} />
      ) : (
        <>
          {tab === 'definitions' && (
            fields.length === 0 ? (
              <EmptyState
                icon="🏷️"
                title="No custom fields yet"
                description={`Add fields for ${recordTypeMeta.label} to capture data that standard columns don't cover — e.g. renewal date, industry, or risk score. Start from scratch or apply a template.`}
                action={
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button onClick={openCreate}>+ Create Field</Button>
                    <Button variant="secondary" onClick={() => setTab('templates')}>
                      Browse Templates
                    </Button>
                  </div>
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Label</th>
                      <th>Key</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th>Options</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFields.map((field, index) => (
                      <DraggableFieldRow
                        key={field.id}
                        field={field}
                        index={index}
                        onEdit={openEdit}
                        onClone={cloneField}
                        onDelete={handleDelete}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        isDragging={draggedIndex === index}
                        dragOverIndex={dragOverIndex}
                      />
                </table>
              </div>
            )
          )}

          {tab === 'templates' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Pre-built field packs for common industries. Applying a template creates fields on{' '}
                  <strong>{recordTypeMeta.label}</strong> (skips keys that already exist).
                </p>
                <select
                  className="field-input"
                  style={{ maxWidth: 200 }}
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All categories' : cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {filteredTemplates.length === 0 ? (
                <EmptyState
                  icon="📋"
                  title="No templates for this record type"
                  description="Try another record type, or create fields manually under Field Definitions."
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {filteredTemplates.map((template) => {
                    const tFields = parseTemplateFields(template.fields);
                    return (
                      <div key={template.id} className="card" style={{ padding: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{template.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                          {template.description}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                          <Badge variant="neutral">{(template.category || '').replace(/_/g, ' ')}</Badge>
                          <Badge variant="neutral">{tFields.length} fields</Badge>
                          {template.usage_count > 0 && (
                            <Badge variant="neutral">Used {template.usage_count}×</Badge>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                          {tFields.slice(0, 5).map((f) => f.label).join(' · ')}
                          {tFields.length > 5 ? '…' : ''}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleApplyTemplate(template.id)}
                          disabled={applyingTemplate === template.id}
                        >
                          {applyingTemplate === template.id ? 'Applying…' : 'Apply Template'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'analytics' && (
            <>
              <div className="stats-row" style={{ marginBottom: 16 }}>
                <div className="stat-card">
                  <div className="stat-value">{stats.totalFields}</div>
                  <div className="stat-label">Total Fields</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.activeFields}</div>
                  <div className="stat-label">Active</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats.recordTypes}</div>
                  <div className="stat-label">Record Types</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.fieldsWithData}</div>
                  <div className="stat-label">Fields with Data</div>
                </div>
              </div>

              <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>Usage by record type</h3>
                {(analytics?.byRecordType || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>No field definitions yet.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Record type</th>
                          <th>Fields</th>
                          <th>Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.byRecordType.map((row) => (
                          <tr key={row.record_type}>
                            <td>{row.record_type}</td>
                            <td>{row.field_count}</td>
                            <td>{row.active_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Most used fields</h3>
                {(analytics?.topFields || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                    Values will appear here once records store custom field data.
                  </p>
                ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Label</th>
                          <th>Key</th>
                          <th>Record type</th>
                          <th>Type</th>
                          <th>Values</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topFields.map((row) => (
                          <tr key={`${row.record_type}-${row.key}`}>
                            <td style={{ fontWeight: 600 }}>{row.label}</td>
                            <td><code>{row.key}</code></td>
                            <td>{row.record_type}</td>
                            <td>{row.field_type}</td>
                            <td>{row.value_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      <Modal
        isOpen={showForm}
        title={editing ? 'Edit Custom Field' : 'Create Custom Field'}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
      >
        <form onSubmit={handleSave}>
          <div className="field">
            <label className="field-label">Field key *</label>
            <input
              className="field-input"
              value={draft.key}
              onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
              placeholder="renewal_date"
              required
              disabled={!!editing}
              pattern="[a-z][a-z0-9_]*"
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Lowercase snake_case. Cannot be changed after creation.
            </div>
          </div>

          <div className="field">
            <label className="field-label">Label *</label>
            <input
              className="field-input"
              value={draft.label}
              onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
              placeholder="Renewal Date"
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Type *</label>
            <select
              className="field-input"
              value={draft.fieldType}
              onChange={(e) => setDraft((d) => ({ ...d, fieldType: e.target.value }))}
              disabled={!!editing}
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label">Description</label>
            <textarea
              className="field-input"
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Help text shown next to this field"
            />
          </div>

          {['select', 'multiselect'].includes(draft.fieldType) && (
            <div className="field">
              <label className="field-label">Options *</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  className="field-input"
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                  placeholder="Add option"
                />
                <Button type="button" variant="secondary" onClick={addOption}>
                  Add
                </Button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {draft.options.map((opt, idx) => (
                  <span key={`${opt}-${idx}`} className="badge" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    {opt}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, options: d.options.filter((_, i) => i !== idx) }))
                      }
                      style={{ border: 0, background: 'transparent', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {draft.fieldType === 'relation' && (
            <div className="field">
              <label className="field-label">Related record type *</label>
              <select
                className="field-input"
                value={draft.relationRecordType}
                onChange={(e) => setDraft((d) => ({ ...d, relationRecordType: e.target.value }))}
                required
              >
                <option value="">Select…</option>
                {RECORD_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>
                    {rt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {draft.fieldType === 'currency' && (
            <div className="field">
              <label className="field-label">Currency</label>
              <select
                className="field-input"
                value={draft.currencyCode}
                onChange={(e) => setDraft((d) => ({ ...d, currencyCode: e.target.value }))}
              >
                {['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'JPY'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {['rating', 'progress'].includes(draft.fieldType) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label className="field-label">Min</label>
                <input
                  type="number"
                  className="field-input"
                  value={draft.minValue}
                  onChange={(e) => setDraft((d) => ({ ...d, minValue: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="field-label">Max</label>
                <input
                  type="number"
                  className="field-input"
                  value={draft.maxValue}
                  onChange={(e) => setDraft((d) => ({ ...d, maxValue: e.target.value }))}
                />
              </div>
            </div>
          )}

          {draft.fieldType === 'phone' && (
            <div className="field">
              <label className="field-label">Format pattern (optional regex)</label>
              <input
                className="field-input"
                value={draft.formatPattern}
                onChange={(e) => setDraft((d) => ({ ...d, formatPattern: e.target.value }))}
                placeholder="^\\+?[0-9\\s\\-]{7,20}$"
              />
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={draft.required}
              onChange={(e) => setDraft((d) => ({ ...d, required: e.target.checked }))}
            />
            Required field
          </label>

          {/* Field-Level Security Section */}
          <div style={{ marginTop: 24, marginBottom: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: 12, fontSize: '0.875rem', fontWeight: 600 }}>Field-Level Security</h4>
            
            <div className="field">
              <label className="field-label">Visibility (who can see this field)</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {['owner', 'admin', 'member', 'guest'].map(role => (
                  <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={(draft.security?.visibility || ['owner', 'admin', 'member']).includes(role)}
                      onChange={(e) => {
                        const current = draft.security?.visibility || ['owner', 'admin', 'member'];
                        const updated = e.target.checked
                          ? [...current, role]
                          : current.filter(r => r !== role);
                        setDraft(d => ({
                          ...d,
                          security: { ...(d.security || {}), visibility: updated }
                        }));
                      }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">Editable by (who can modify this field)</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {['owner', 'admin', 'member'].map(role => (
                  <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={(draft.security?.editable || ['owner', 'admin']).includes(role)}
                      onChange={(e) => {
                        const current = draft.security?.editable || ['owner', 'admin'];
                        const updated = e.target.checked
                          ? [...current, role]
                          : current.filter(r => r !== role);
                        setDraft(d => ({
                          ...d,
                          security: { ...(d.security || {}), editable: updated }
                        }));
                      }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={draft.security?.sensitive || false}
                  onChange={(e) => setDraft(d => ({
                    ...d,
                    security: { ...(d.security || {}), sensitive: e.target.checked }
                  }))}
                />
                Sensitive field
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={draft.security?.mask_value || false}
                  disabled={!draft.security?.sensitive}
                  onChange={(e) => setDraft(d => ({
                    ...d,
                    security: { ...(d.security || {}), mask_value: e.target.checked }
                  }))}
                />
                Mask value (****1234)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update Field' : 'Create Field'}
            </Button>
          </div>

          <ValidationRuleBuilder
            fieldType={draft.fieldType}
            rules={draft.validation_rules || []}
            onRulesChange={(rules) => setDraft(d => ({ ...d, validation_rules: rules }))}
          />

          <FieldDependencyBuilder
            dependencies={draft.dependencies || []}
            onDependenciesChange={(deps) => setDraft(d => ({ ...d, dependencies: deps }))}
            availableFields={fields}
            currentFieldKey={editing?.key}
          />
        </form>
      </Modal>
    </div>
      <ImportExportModal
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        recordType={recordType}
        onImportComplete={() => {
          setShowImportExport(false);
          loadDefinitions();
        }}
      />

  );
}
