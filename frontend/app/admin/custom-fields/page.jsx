'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../../lib/api';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { SkeletonRows } from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const FIELD_TYPES = ['text', 'number', 'date', 'select', 'multiselect', 'checkbox', 'file', 'relation'];

export default function CustomFieldsPage() {
  const router = useRouter();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordType, setRecordType] = useState('crm_contact');
  const [showForm, setShowForm] = useState(false);
  const [editField, setEditField] = useState(null);
  const [formData, setFormData] = useState({
    key: '', label: '', fieldType: 'text', description: '', required: false,
    defaultValue: '', validation: '', options: [], relationRecordType: '', sortOrder: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadFields();
  }, [recordType]);

  async function loadFields() {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/v1/custom-fields?recordType=${recordType}`);
      setFields(data.fields || []);
    } catch (err) {
      console.error('Failed to load custom fields:', err);
      toast.error('Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      key: '', label: '', fieldType: 'text', description: '', required: false,
      defaultValue: '', validation: '', options: [], relationRecordType: '', sortOrder: 0,
    });
    setEditField(null);
    setShowForm(false);
  }

  function openEdit(field) {
    setEditField(field);
    setFormData({
      key: field.key,
      label: field.label,
      fieldType: field.field_type,
      description: field.description || '',
      required: field.required || false,
      defaultValue: field.default_value !== null && field.default_value !== undefined ? JSON.stringify(field.default_value) : '',
      validation: field.validation !== null && field.validation !== undefined ? JSON.stringify(field.validation) : '',
      options: Array.isArray(field.options) ? field.options : [],
      relationRecordType: field.relation_record_type || '',
      sortOrder: field.sort_order || 0,
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      key: formData.key,
      label: formData.label,
      fieldType: formData.fieldType,
      description: formData.description || null,
      required: formData.required,
      defaultValue: formData.defaultValue ? JSON.parse(formData.defaultValue) : null,
      validation: formData.validation ? JSON.parse(formData.validation) : null,
      options: formData.fieldType === 'select' || formData.fieldType === 'multiselect' ? formData.options : [],
      relationRecordType: formData.relationRecordType || null,
      sortOrder: Number(formData.sortOrder) || 0,
    };

    try {
      if (editField) {
        const data = await apiFetch(`/api/v1/custom-fields/${recordType}/${editField.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (data.field) {
          toast.success('Field updated');
          resetForm();
          loadFields();
        }
      } else {
        const data = await apiFetch(`/api/v1/custom-fields/${recordType}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (data.field) {
          toast.success('Field created');
          resetForm();
          loadFields();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save field');
    }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`/api/v1/custom-fields/${recordType}/${id}`, { method: 'DELETE' });
      toast.success('Field deleted');
      setDeleteConfirm(null);
      loadFields();
    } catch (err) {
      toast.error(err.message || 'Failed to delete field');
    }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/crm')}>← Back to CRM</button>
      <div className="module-head">
        <div>
          <h1>Custom Fields</h1>
          <p className="module-sub">Manage custom field definitions for CRM contacts and other record types.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>+ Add Field</Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600, marginRight: 8 }}>Record Type:</label>
        <select className="field-select" value={recordType} onChange={(e) => setRecordType(e.target.value)}>
          <option value="crm_contact">CRM Contacts</option>
          <option value="crm_company">CRM Companies (coming soon)</option>
          <option value="crm_lead">CRM Leads (coming soon)</option>
        </select>
      </div>

      {loading ? (
        <Card><SkeletonRows rows={5} /></Card>
      ) : fields.length === 0 ? (
        <Card>
          <EmptyState
            icon="📋"
            title="No custom fields yet"
            description="Create your first custom field to extend contact records with additional data."
            action={<Button onClick={() => { resetForm(); setShowForm(true); }}>+ Add Field</Button>}
          />
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="contacts">
            <thead>
              <tr>
                <th>Key</th>
                <th>Label</th>
                <th>Type</th>
                <th>Required</th>
                <th>Options/Default</th>
                <th>Sort Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.id}>
                  <td><code>{f.key}</code></td>
                  <td>{f.label}</td>
                  <td><span className="ctag">{f.field_type}</span></td>
                  <td>{f.required ? '✅ Yes' : '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {f.field_type === 'select' || f.field_type === 'multiselect'
                      ? (Array.isArray(f.options) ? f.options.join(', ') : '—')
                      : (f.default_value !== null ? JSON.stringify(f.default_value) : '—')}
                  </td>
                  <td>{f.sort_order}</td>
                  <td>
                    <button className="ctag" onClick={() => openEdit(f)}>Edit</button>
                    <button className="ctag danger" onClick={() => setDeleteConfirm(f)} style={{ marginLeft: 8 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showForm} onClose={resetForm} title={editField ? 'Edit Custom Field' : 'New Custom Field'} description="Configure a custom field for CRM contacts">
        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label">Key (lowercase_snake_case) *</label>
            <input className="field-input" value={formData.key} onChange={(e) => setFormData({ ...formData, key: e.target.value })} placeholder="e.g. twitter_handle" required disabled={!!editField} />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label">Label *</label>
            <input className="field-input" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} placeholder="e.g. Twitter Handle" required />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label">Field Type *</label>
            <select className="field-select" value={formData.fieldType} onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}>
              {FIELD_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label">Description</label>
            <textarea className="field-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description shown to users" />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label">
              <input type="checkbox" checked={formData.required} onChange={(e) => setFormData({ ...formData, required: e.target.checked })} style={{ marginRight: 6 }} />
              Required
            </label>
          </div>
          {['select', 'multiselect'].includes(formData.fieldType) && (
            <div className="field" style={{ marginBottom: 14 }}>
              <label className="field-label">Options (comma-separated)</label>
              <input className="field-input" value={formData.options.join(', ')} onChange={(e) => setFormData({ ...formData, options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Option1, Option2, Option3" />
            </div>
          )}
          {formData.fieldType === 'relation' && (
            <div className="field" style={{ marginBottom: 14 }}>
              <label className="field-label">Related Record Type</label>
              <input className="field-input" value={formData.relationRecordType} onChange={(e) => setFormData({ ...formData, relationRecordType: e.target.value })} placeholder="e.g. crm_company" />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button type="submit">{editField ? 'Update' : 'Create'} Field</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        danger
        title="Delete custom field?"
        description={`Are you sure you want to delete "${deleteConfirm?.label}"? This will also delete all values for this field from all contacts.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
