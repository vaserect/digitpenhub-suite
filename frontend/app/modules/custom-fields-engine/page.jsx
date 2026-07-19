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
import { 
  Settings, Database, BarChart3, FileText, Plus, 
  Edit2, Trash2, Copy, Download, Upload 
} from 'lucide-react';

const RECORD_TYPES = [
  { value: 'crm_contact', label: 'CRM Contacts' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'quotation', label: 'Quotations' },
  { value: 'project', label: 'Projects' },
  { value: 'task', label: 'Tasks' },
  { value: 'inventory_item', label: 'Inventory Items' },
  { value: 'hr_employee', label: 'HR Employees' },
  { value: 'student', label: 'Students' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'select', label: 'Select', icon: '📋' },
  { value: 'multiselect', label: 'Multi-Select', icon: '☑️' },
  { value: 'checkbox', label: 'Checkbox', icon: '✅' },
  { value: 'file', label: 'File', icon: '📎' },
  { value: 'relation', label: 'Relation', icon: '🔗' },
  { value: 'currency', label: 'Currency', icon: '💰' },
  { value: 'percent', label: 'Percent', icon: '📊' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone', icon: '📞' },
  { value: 'rating', label: 'Rating', icon: '⭐' },
  { value: 'progress', label: 'Progress', icon: '📈' },
  { value: 'location', label: 'Location', icon: '📍' },
]; // OLD: [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'select', label: 'Select', icon: '📋' },
  { value: 'multiselect', label: 'Multi-Select', icon: '☑️' },
  { value: 'checkbox', label: 'Checkbox', icon: '✅' },
  { value: 'file', label: 'File', icon: '📎' },
  { value: 'relation', label: 'Relation', icon: '🔗' },
];

export default function CustomFieldsEnginePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('definitions');
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [selectedRecordType, setSelectedRecordType] = useState('crm_contact');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [stats, setStats] = useState({
    totalFields: 0,
    activeFields: 0,
    recordTypes: 0,
    fieldsWithData: 0,
  });

  useEffect(() => {
    loadData();
  }, [selectedRecordType, activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'definitions') {
        const data = await apiFetch(`/api/v1/custom-fields?recordType=${selectedRecordType}`);
        setFields(data.fields || []);
      } else if (activeTab === 'analytics') {
        await loadAnalytics();
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    // TODO: Implement analytics endpoint
    setStats({
      totalFields: 42,
      activeFields: 38,
      recordTypes: 8,
      fieldsWithData: 35,
    });
  }

  function renderDefinitionsTab() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold">Field Definitions</h2>
              <p className="text-sm text-gray-600">
                Manage custom fields for {RECORD_TYPES.find(rt => rt.value === selectedRecordType)?.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedRecordType}
              onChange={(e) => setSelectedRecordType(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              {RECORD_TYPES.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Field
            </Button>
          </div>
        </div>

        {loading ? (
          <SkeletonRows count={5} />
        ) : fields.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No custom fields yet"
            description={`Create your first custom field for ${RECORD_TYPES.find(rt => rt.value === selectedRecordType)?.label}`}
            action={
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Field
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {fields.map(field => (
              <Card key={field.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {FIELD_TYPES.find(ft => ft.value === field.field_type)?.icon || '📝'}
                      </span>
                      <h3 className="font-semibold">{field.label}</h3>
                      {field.required && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          Required
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        {FIELD_TYPES.find(ft => ft.value === field.field_type)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Key: <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">{field.key}</code>
                    </p>
                    {field.description && (
                      <p className="text-sm text-gray-600">{field.description}</p>
                    )}
                    {(field.field_type === 'select' || field.field_type === 'multiselect') && field.options?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {field.options.map((opt, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingField(field);
                        setShowCreateModal(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteField(field.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderTemplatesTab() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <div>
              <h2 className="text-lg font-semibold">Field Templates</h2>
              <p className="text-sm text-gray-600">
                Pre-built field sets for common use cases
              </p>
            </div>
          </div>
        </div>

        <EmptyState
          icon={FileText}
          title="Field templates coming soon"
          description="Quick-start templates for common industries and use cases will be available here"
        />
      </div>
    );
  }

  function renderAnalyticsTab() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <div>
            <h2 className="text-lg font-semibold">Usage Analytics</h2>
            <p className="text-sm text-gray-600">
              Track custom field usage across your workspace
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Total Fields</div>
            <div className="text-2xl font-bold">{stats.totalFields}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Active Fields</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeFields}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Record Types</div>
            <div className="text-2xl font-bold text-blue-600">{stats.recordTypes}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Fields with Data</div>
            <div className="text-2xl font-bold text-purple-600">{stats.fieldsWithData}</div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Field Usage by Record Type</h3>
          <EmptyState
            icon={BarChart3}
            title="Analytics coming soon"
            description="Detailed usage statistics and insights will be available here"
          />
        </Card>
      </div>
    );
  }

  function renderSettingsTab() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-5 h-5 text-gray-600" />
          <div>
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="text-sm text-gray-600">
              Configure custom fields engine behavior
            </p>
          </div>
        </div>

        <Card className="p-6">
          <EmptyState
            icon={Settings}
            title="Settings coming soon"
            description="Global settings and preferences will be available here"
          />
        </Card>
      </div>
    );
  }

  async function handleDeleteField(fieldId) {
    if (!confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
      return;
    }

    try {
      await apiFetch(`/api/v1/custom-fields/${selectedRecordType}/${fieldId}`, {
        method: 'DELETE',
      });
      toast.success('Field deleted successfully');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete field');
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Custom Fields Engine</h1>
        <p className="text-gray-600">
          Create and manage custom fields for any record type across your workspace
        </p>
      </div>

      <div className="border-b mb-6">
        <div className="flex gap-6">
          {[
            { id: 'definitions', label: 'Field Definitions', icon: Database },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'definitions' && renderDefinitionsTab()}
      {activeTab === 'templates' && renderTemplatesTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
      {activeTab === 'settings' && renderSettingsTab()}

      {showCreateModal && (
        <CreateFieldModal
          recordType={selectedRecordType}
          editingField={editingField}
          onClose={() => {
            setShowCreateModal(false);
            setEditingField(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingField(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function CreateFieldModal({ recordType, editingField, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    key: editingField?.key || '',
    label: editingField?.label || '',
    fieldType: editingField?.field_type || 'text',
    description: editingField?.description || '',
    required: editingField?.required || false,
    defaultValue: editingField?.default_value ? JSON.stringify(editingField.default_value) : '',
    options: editingField?.options || [],
    relationRecordType: editingField?.relation_record_type || '',
    sortOrder: editingField?.sort_order || 0,
  });
  const [optionInput, setOptionInput] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      key: formData.key,
      label: formData.label,
      fieldType: formData.fieldType,
      description: formData.description || null,
      required: formData.required,
      defaultValue: formData.defaultValue ? JSON.parse(formData.defaultValue) : null,
      options: ['select', 'multiselect'].includes(formData.fieldType) ? formData.options : [],
      relationRecordType: formData.fieldType === 'relation' ? formData.relationRecordType : null,
      sortOrder: Number(formData.sortOrder) || 0,
    };

    try {
      if (editingField) {
        await apiFetch(`/api/v1/custom-fields/${recordType}/${editingField.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Field updated successfully');
      } else {
        await apiFetch(`/api/v1/custom-fields/${recordType}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Field created successfully');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to save field');
    } finally {
      setSaving(false);
    }
  }

  function addOption() {
    if (optionInput.trim()) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, optionInput.trim()],
      }));
      setOptionInput('');
    }
  }

  function removeOption(index) {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={editingField ? 'Edit Field' : 'Create New Field'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Field Key *</label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
              placeholder="e.g., renewal_date"
              className="w-full px-3 py-2 border rounded-lg"
              required
              disabled={!!editingField}
            />
            <p className="text-xs text-gray-500 mt-1">Lowercase, underscores only</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Field Label *</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="e.g., Renewal Date"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Field Type *</label>
          <select
            value={formData.fieldType}
            onChange={(e) => setFormData(prev => ({ ...prev, fieldType: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            {FIELD_TYPES.map(ft => (
              <option key={ft.value} value={ft.value}>
                {ft.icon} {ft.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Help text for users"
            className="w-full px-3 py-2 border rounded-lg"
            rows={2}
          />
        </div>

        {(['select', 'multiselect'].includes(formData.fieldType)) && (
          <div>
            <label className="block text-sm font-medium mb-1">Options *</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                placeholder="Add option"
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <Button type="button" onClick={addOption}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.options.map((opt, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2"
                >
                  {opt}
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="text-blue-900 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {formData.fieldType === 'relation' && (
          <div>
            <label className="block text-sm font-medium mb-1">Related Record Type *</label>
            <select
              value={formData.relationRecordType}
              onChange={(e) => setFormData(prev => ({ ...prev, relationRecordType: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Select record type</option>
              {RECORD_TYPES.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="required"
            checked={formData.required}
            onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="required" className="text-sm font-medium">
            Required field
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingField ? 'Update Field' : 'Create Field'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Enhanced field type form fields for CreateFieldModal
function EnhancedFieldTypeInputs({ fieldType, formData, setFormData }) {
  if (fieldType === 'currency') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">Currency Code</label>
        <select
          value={formData.currencyCode || 'USD'}
          onChange={(e) => setFormData(prev => ({ ...prev, currencyCode: e.target.value }))}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="JPY">JPY - Japanese Yen</option>
          <option value="CAD">CAD - Canadian Dollar</option>
          <option value="AUD">AUD - Australian Dollar</option>
        </select>
      </div>
    );
  }

  if (fieldType === 'rating') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Min Value</label>
          <input
            type="number"
            value={formData.minValue ?? 1}
            onChange={(e) => setFormData(prev => ({ ...prev, minValue: Number(e.target.value) }))}
            className="w-full px-3 py-2 border rounded-lg"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Value</label>
          <input
            type="number"
            value={formData.maxValue ?? 5}
            onChange={(e) => setFormData(prev => ({ ...prev, maxValue: Number(e.target.value) }))}
            className="w-full px-3 py-2 border rounded-lg"
            min="1"
          />
        </div>
      </div>
    );
  }

  if (fieldType === 'progress') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Min Value</label>
          <input
            type="number"
            value={formData.minValue ?? 0}
            onChange={(e) => setFormData(prev => ({ ...prev, minValue: Number(e.target.value) }))}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Value</label>
          <input
            type="number"
            value={formData.maxValue ?? 100}
            onChange={(e) => setFormData(prev => ({ ...prev, maxValue: Number(e.target.value) }))}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
    );
  }

  if (fieldType === 'phone') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">Format Pattern (Optional)</label>
        <input
          type="text"
          value={formData.formatPattern || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, formatPattern: e.target.value }))}
          placeholder="e.g., ^\+1\d{10}$ for US format"
          className="w-full px-3 py-2 border rounded-lg"
        />
        <p className="text-xs text-gray-500 mt-1">Regex pattern for validation</p>
      </div>
    );
  }

  return null;
}
