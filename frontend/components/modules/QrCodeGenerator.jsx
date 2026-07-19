'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';

const QR_TYPES = {
  url: { label: 'URL / Website', icon: '🔗', fields: ['url'] },
  text: { label: 'Plain Text', icon: '📝', fields: ['text'] },
  email: { label: 'Email Address', icon: '📧', fields: ['email', 'subject', 'body'] },
  phone: { label: 'Phone Number', icon: '📞', fields: ['phone'] },
  sms: { label: 'SMS Message', icon: '💬', fields: ['phone', 'message'] },
  whatsapp: { label: 'WhatsApp', icon: '💚', fields: ['phone', 'message'] },
  vcard: { label: 'vCard (Basic)', icon: '👤', fields: ['firstName', 'lastName', 'phone', 'email'] },
  vcard_plus: { label: 'vCard Plus (Business)', icon: '💼', fields: ['firstName', 'lastName', 'organization', 'title', 'phoneMobile', 'phoneWork', 'emailWork', 'website'] },
  wifi: { label: 'WiFi Network', icon: '📶', fields: ['ssid', 'password', 'securityType'] },
  event: { label: 'Calendar Event', icon: '📅', fields: ['eventTitle', 'location', 'startDate'] },
  location: { label: 'GPS Location', icon: '📍', fields: ['latitude', 'longitude'] },
  payment: { label: 'Payment', icon: '💳', fields: ['paymentType', 'amount', 'currency'] },
  social: { label: 'Social Media', icon: '🌐', fields: ['platform', 'profileUrl'] },
  app_store: { label: 'App Store Link', icon: '📱', fields: ['appStoreUrl'] },
  pdf: { label: 'PDF Document', icon: '📄', fields: ['pdfUrl'] },
  video: { label: 'Video Link', icon: '🎥', fields: ['videoUrl'] },
  menu: { label: 'Restaurant Menu', icon: '🍽️', fields: ['menuUrl'] },
  coupon: { label: 'Coupon/Discount', icon: '🎟️', fields: ['couponCode', 'discount'] },
  feedback: { label: 'Feedback Form', icon: '⭐', fields: ['feedbackUrl'] },
  multi_url: { label: 'Smart Multi-URL', icon: '🔀', fields: ['defaultUrl'] },
  dynamic: { label: 'Dynamic QR', icon: '🔄', fields: ['redirectUrl'] }
};

const PATTERN_STYLES = ['square', 'rounded', 'dots', 'classy', 'classy_rounded', 'extra_rounded'];
const EYE_STYLES = ['square', 'rounded', 'circle', 'leaf', 'diamond'];
const FRAME_STYLES = ['none', 'square', 'rounded', 'circle', 'banner', 'bottom_text', 'top_text'];

function getFieldLabel(field) {
  const labels = {
    url: 'URL', text: 'Text Content', email: 'Email', subject: 'Subject', body: 'Body',
    phone: 'Phone Number', message: 'Message', firstName: 'First Name', lastName: 'Last Name',
    organization: 'Organization', title: 'Job Title', phoneMobile: 'Mobile Phone',
    phoneWork: 'Work Phone', emailWork: 'Work Email', website: 'Website',
    ssid: 'Network Name (SSID)', password: 'Password', securityType: 'Security Type',
    eventTitle: 'Event Title', location: 'Location', startDate: 'Start Date/Time',
    latitude: 'Latitude', longitude: 'Longitude', paymentType: 'Payment Type',
    amount: 'Amount', currency: 'Currency', platform: 'Platform', profileUrl: 'Profile URL',
    appStoreUrl: 'App Store URL', pdfUrl: 'PDF URL', videoUrl: 'Video URL',
    menuUrl: 'Menu URL', couponCode: 'Coupon Code', discount: 'Discount',
    feedbackUrl: 'Feedback Form URL', defaultUrl: 'Default URL', redirectUrl: 'Redirect URL'
  };
  return labels[field] || field;
}

function getFieldType(field) {
  if (['url', 'website', 'profileUrl', 'appStoreUrl', 'pdfUrl', 'videoUrl', 'menuUrl', 'feedbackUrl', 'defaultUrl', 'redirectUrl'].includes(field)) return 'url';
  if (['email', 'emailWork'].includes(field)) return 'email';
  if (['phone', 'phoneMobile', 'phoneWork'].includes(field)) return 'tel';
  if (['latitude', 'longitude', 'amount'].includes(field)) return 'number';
  if (['startDate'].includes(field)) return 'datetime-local';
  if (['text', 'subject', 'body', 'message'].includes(field)) return 'textarea';
  if (['securityType', 'paymentType', 'platform'].includes(field)) return 'select';
  return 'text';
}

function getFieldOptions(field) {
  if (field === 'securityType') return [
    { value: 'WPA', label: 'WPA/WPA2' },
    { value: 'WEP', label: 'WEP' },
    { value: 'nopass', label: 'No Password' }
  ];
  if (field === 'paymentType') return [
    { value: 'paypal', label: 'PayPal' },
    { value: 'bitcoin', label: 'Bitcoin' },
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'upi', label: 'UPI (India)' }
  ];
  if (field === 'platform') return [
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' }
  ];
  return [];
}

export default function QrCodeGeneratorModule({ goHome, showToast }) {
  const [activeTab, setActiveTab] = useState('codes');
  const [loaded, setLoaded] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showAdvancedDesign, setShowAdvancedDesign] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', qr_type: 'url', content: {},
    folder_id: null, foreground_color: '#000000', background_color: '#FFFFFF',
    pattern_style: 'square', eye_style: 'square', size: 300, error_correction: 'M'
  });
  const [filters, setFilters] = useState({ search: '', qr_type: '', status: '', folder_id: '' });
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, codesRes, templatesRes, foldersRes] = await Promise.all([
        apiFetch('/api/v1/qr-codes/stats'),
        apiFetch('/api/v1/qr-codes/'),
        apiFetch('/api/v1/qr-codes/templates/list'),
        apiFetch('/api/v1/qr-codes/folders/list')
      ]);
      setStats(statsRes);
      setQrCodes(codesRes.qr_codes || codesRes.qrCodes || []);
      setTemplates(templatesRes.templates || []);
      setFolders(foldersRes.folders || []);
      setLoaded(true);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoaded(true);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleCreateQrCode(e) {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Title is required');
      return;
    }
    const typeConfig = QR_TYPES[formData.qr_type];
    const missingFields = typeConfig.fields.filter(f => !formData.content[f]);
    if (missingFields.length > 0) {
      showToast('Please fill all required fields: ' + missingFields.map(getFieldLabel).join(', '));
      return;
    }
    try {
      const response = await apiFetch('/api/v1/qr-codes/', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (response.error) {
        showToast(response.error);
        return;
      }
      showToast('QR code created successfully');
      setShowCreateModal(false);
      setFormData({ title: '', description: '', qr_type: 'url', content: {}, folder_id: null, foreground_color: '#000000', background_color: '#FFFFFF', pattern_style: 'square', eye_style: 'square', size: 300, error_correction: 'M' });
      await loadData();
    } catch (error) {
      showToast('Failed to create QR code');
    }
  }

  async function handleDeleteQrCode() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/qr-codes/${confirmDelete.id}`, { method: 'DELETE' });
      showToast('QR code deleted');
      setQrCodes(codes => codes.filter(c => c.id !== confirmDelete.id));
      await loadData();
    } catch (error) {
      showToast('Failed to delete QR code');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  async function handleBulkDelete() {
    if (selectedCodes.length === 0) return;
    try {
      await apiFetch('/api/v1/qr-codes/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedCodes })
      });
      showToast(`${selectedCodes.length} QR codes deleted`);
      setSelectedCodes([]);
      await loadData();
    } catch (error) {
      showToast('Failed to delete QR codes');
    }
  }

  async function loadAnalytics(qrCode) {
    setShowAnalyticsModal(qrCode);
    setLoadingAnalytics(true);
    try {
      const data = await apiFetch(`/api/v1/qr-codes/${qrCode.id}/analytics?period=30d`);
      setAnalytics(data);
    } catch (error) {
      showToast('Failed to load analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  }

  function updateContentField(field, value) {
    setFormData(prev => ({
      ...prev,
      content: { ...prev.content, [field]: value }
    }));
  }

  function toggleCodeSelection(id) {
    setSelectedCodes(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  }

  const filteredCodes = qrCodes.filter(code => {
    if (filters.search && !code.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.qr_type && code.qr_type !== filters.qr_type) return false;
    if (filters.status && code.status !== filters.status) return false;
    if (filters.folder_id && code.folder_id !== parseInt(filters.folder_id)) return false;
    return true;
  });
  return (
    <div className="panel" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="back-link" onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontWeight: 500, fontSize: '0.875rem', padding: 0, marginBottom: '0.5rem' }}>
          ← Back to Workspace
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>QR Code Generator</h1>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
              Create professional QR codes with 20+ types, advanced design, analytics, and batch generation
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {selectedCodes.length > 0 && (
              <Button variant="ghost" onClick={handleBulkDelete}>Delete {selectedCodes.length}</Button>
            )}
            <Button onClick={() => setShowCreateModal(true)}>+ New QR Code</Button>
          </div>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Total QR Codes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total_codes || 0}</div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Active</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{stats.active_codes || 0}</div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Total Scans</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total_scans?.toLocaleString() || 0}</div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Unique Scans</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.unique_scans?.toLocaleString() || 0}</div>
          </div>
        </div>
      )}

      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {['codes', 'templates', 'folders', 'analytics'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.75rem 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: activeTab === tab ? 'var(--primary)' : 'var(--muted)', borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', textTransform: 'capitalize' }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'codes' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <input type="text" placeholder="Search QR codes..." className="form-input" value={filters.search} onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))} />
            <select className="form-input" value={filters.qr_type} onChange={e => setFilters(prev => ({ ...prev, qr_type: e.target.value }))}>
              <option value="">All Types</option>
              {Object.entries(QR_TYPES).map(([key, config]) => (
                <option key={key} value={key}>{config.icon} {config.label}</option>
              ))}
            </select>
            <select className="form-input" value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
            <select className="form-input" value={filters.folder_id} onChange={e => setFilters(prev => ({ ...prev, folder_id: e.target.value }))}>
              <option value="">All Folders</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>

          {!loaded ? (
            <SkeletonRows count={5} />
          ) : filteredCodes.length === 0 ? (
            <EmptyState title="No QR codes yet" description="Create your first QR code with 20+ types including URL, vCard, WiFi, Events, Payments, and more" action={<Button onClick={() => setShowCreateModal(true)}>+ New QR Code</Button>} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {filteredCodes.map(code => (
                <div key={code.id} style={{ padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, position: 'relative' }}>
                  <input type="checkbox" checked={selectedCodes.includes(code.id)} onChange={() => toggleCodeSelection(code.id)} style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }} />
                  <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ width: 120, height: 120, margin: '0 auto', background: code.background_color || '#fff', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                      {QR_TYPES[code.qr_type]?.icon || '📱'}
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{code.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{QR_TYPES[code.qr_type]?.label || code.qr_type}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                    <div><div>Scans</div><div style={{ fontWeight: 600, color: 'var(--text)' }}>{code.total_scans || 0}</div></div>
                    <div><div>Unique</div><div style={{ fontWeight: 600, color: 'var(--text)' }}>{code.unique_scans || 0}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-sm" onClick={() => loadAnalytics(code)} style={{ flex: 1, fontSize: '0.75rem' }}>Analytics</button>
                    <button className="btn-sm btn-ghost" onClick={() => setConfirmDelete(code)} style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Delete</button>
                  </div>
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', padding: '0.25rem 0.5rem', background: code.status === 'active' ? 'var(--success-bg)' : 'var(--muted-bg)', color: code.status === 'active' ? 'var(--success)' : 'var(--muted)', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600 }}>{code.status}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'templates' && (
        <div>
          {templates.length === 0 ? (
            <EmptyState title="No templates yet" description="Design templates will be available soon for quick QR code styling" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {templates.map(template => (
                <div key={template.id} style={{ padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{template.name}</div>
                  {template.description && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{template.description}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'folders' && (
        <div>
          {folders.length === 0 ? (
            <EmptyState title="No folders yet" description="Organize your QR codes into folders for better management" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {folders.map(folder => (
                <div key={folder.id} style={{ padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, background: folder.color || 'var(--primary-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>📁</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{folder.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{folder.qr_count || 0} QR codes</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Top Performing QR Codes</h3>
          {stats?.top_codes && stats.top_codes.length > 0 ? (
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--muted-bg)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600 }}>Title</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600 }}>Type</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600 }}>Total Scans</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600 }}>Unique Scans</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_codes.map(code => (
                    <tr key={code.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>{code.title}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--muted)' }}>{QR_TYPES[code.qr_type]?.label || code.qr_type}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{code.total_scans || 0}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{code.unique_scans || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No analytics data yet" description="Analytics will appear once your QR codes start getting scanned" />
          )}
        </div>
      )}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--panel)', borderRadius: 12, maxWidth: 700, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem 0' }}>Create QR Code</h2>
            <form onSubmit={handleCreateQrCode}>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div><label className="form-label">Title *</label><input type="text" className="form-input" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} required /></div>
                <div><label className="form-label">Description</label><textarea className="form-input" value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={2} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><label className="form-label">QR Type *</label><select className="form-input" value={formData.qr_type} onChange={e => setFormData(prev => ({ ...prev, qr_type: e.target.value, content: {} }))}>
                    {Object.entries(QR_TYPES).map(([key, config]) => (<option key={key} value={key}>{config.icon} {config.label}</option>))}
                  </select></div>
                  <div><label className="form-label">Folder</label><select className="form-input" value={formData.folder_id || ''} onChange={e => setFormData(prev => ({ ...prev, folder_id: e.target.value || null }))}>
                    <option value="">No Folder</option>
                    {folders.map(folder => (<option key={folder.id} value={folder.id}>{folder.name}</option>))}
                  </select></div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--muted-bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600 }}>{QR_TYPES[formData.qr_type].icon} {QR_TYPES[formData.qr_type].label} Content</h4>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {QR_TYPES[formData.qr_type].fields.map(field => {
                      const fieldType = getFieldType(field);
                      const fieldLabel = getFieldLabel(field);
                      const fieldOptions = getFieldOptions(field);
                      return (
                        <div key={field}>
                          <label className="form-label">{fieldLabel} *</label>
                          {fieldType === 'textarea' ? (
                            <textarea className="form-input" value={formData.content[field] || ''} onChange={e => updateContentField(field, e.target.value)} required rows={3} />
                          ) : fieldType === 'select' ? (
                            <select className="form-input" value={formData.content[field] || ''} onChange={e => updateContentField(field, e.target.value)} required>
                              <option value="">Select...</option>
                              {fieldOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                          ) : (
                            <input type={fieldType} className="form-input" value={formData.content[field] || ''} onChange={e => updateContentField(field, e.target.value)} required step={fieldType === 'number' ? 'any' : undefined} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <button type="button" onClick={() => setShowAdvancedDesign(!showAdvancedDesign)} style={{ width: '100%', padding: '0.75rem', background: 'var(--muted-bg)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                    <span>🎨 Design & Customization</span>
                    <span>{showAdvancedDesign ? '▼' : '▶'}</span>
                  </button>
                  {showAdvancedDesign && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--muted-bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div><label className="form-label">Foreground Color</label><input type="color" className="form-input" value={formData.foreground_color} onChange={e => setFormData(prev => ({ ...prev, foreground_color: e.target.value }))} /></div>
                          <div><label className="form-label">Background Color</label><input type="color" className="form-input" value={formData.background_color} onChange={e => setFormData(prev => ({ ...prev, background_color: e.target.value }))} /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div><label className="form-label">Pattern Style</label><select className="form-input" value={formData.pattern_style} onChange={e => setFormData(prev => ({ ...prev, pattern_style: e.target.value }))}>
                            {PATTERN_STYLES.map(style => (<option key={style} value={style}>{style}</option>))}
                          </select></div>
                          <div><label className="form-label">Eye Style</label><select className="form-input" value={formData.eye_style} onChange={e => setFormData(prev => ({ ...prev, eye_style: e.target.value }))}>
                            {EYE_STYLES.map(style => (<option key={style} value={style}>{style}</option>))}
                          </select></div>
                        </div>
                        <div><label className="form-label">Size: {formData.size}px</label><input type="range" min={200} max={800} step={50} value={formData.size} onChange={e => setFormData(prev => ({ ...prev, size: parseInt(e.target.value) }))} style={{ width: '100%' }} /></div>
                        <div><label className="form-label">Error Correction</label><select className="form-input" value={formData.error_correction} onChange={e => setFormData(prev => ({ ...prev, error_correction: e.target.value }))}>
                          <option value="L">Low (7%)</option>
                          <option value="M">Medium (15%)</option>
                          <option value="Q">Quartile (25%)</option>
                          <option value="H">High (30%)</option>
                        </select></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button type="button" variant="ghost" onClick={() => { setShowCreateModal(false); setFormData({ title: '', description: '', qr_type: 'url', content: {}, folder_id: null, foreground_color: '#000000', background_color: '#FFFFFF', pattern_style: 'square', eye_style: 'square', size: 300, error_correction: 'M' }); }}>Cancel</Button>
                <Button type="submit">Create QR Code</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAnalyticsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--panel)', borderRadius: 12, maxWidth: 800, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Analytics: {showAnalyticsModal.title}</h2>
              <button onClick={() => { setShowAnalyticsModal(null); setAnalytics(null); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            {loadingAnalytics ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading analytics...</div>
            ) : analytics ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--muted-bg)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Total Scans</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{analytics.overview?.total_scans || 0}</div>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--muted-bg)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Unique Visitors</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{analytics.overview?.unique_visitors || 0}</div>
                  </div>
                </div>
                {analytics.devices && analytics.devices.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Devices</h3>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {analytics.devices.map((device, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--muted-bg)', borderRadius: 4 }}>
                          <span>{device.device_type}</span>
                          <span style={{ fontWeight: 600 }}>{device.scans}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analytics.countries && analytics.countries.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Top Countries</h3>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {analytics.countries.map((country, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--muted-bg)', borderRadius: 4 }}>
                          <span>{country.country || 'Unknown'}</span>
                          <span style={{ fontWeight: 600 }}>{country.scans}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No analytics data available</div>
            )}
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog title="Delete QR Code" message={`Are you sure you want to delete "${confirmDelete.title}"? This action cannot be undone.`} onConfirm={handleDeleteQrCode} onCancel={() => setConfirmDelete(null)} confirmText="Delete" isDestructive isLoading={deleting} />
      )}
    </div>
  );
}
