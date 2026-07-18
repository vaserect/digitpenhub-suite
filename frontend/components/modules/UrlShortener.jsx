'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import StatCard from '../ui/StatCard';
import Table from '../ui/Table';
import EmptyState from '../ui/EmptyState';
import StatusBadge from '../ui/StatusBadge';
import Tooltip from '../ui/Tooltip';
import BulkActionBar from '../ui/BulkActionBar';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function UrlShortenerModule({ goHome }) {
  // State management
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('links');
  const [stats, setStats] = useState(null);
  const [links, setLinks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [domains, setDomains] = useState([]);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(null);
  const [linkDraft, setLinkDraft] = useState({
    target_url: '',
    title: '',
    description: '',
    custom_slug: '',
    folder_id: null,
    tags: [],
    expires_at: '',
    password: '',
    link_type: 'standard',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    og_title: '',
    og_description: '',
    og_image_url: ''
  });
  const [folderDraft, setFolderDraft] = useState({ name: '', description: '', color: '#3b82f6' });
  const [domainDraft, setDomainDraft] = useState({ domain: '' });
  const [qrConfig, setQrConfig] = useState({
    size: 300,
    format: 'png',
    foreground_color: '#000000',
    background_color: '#FFFFFF',
    error_correction: 'M'
  });
  const [copied, setCopied] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [filterFolder, setFilterFolder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [statsRes, linksRes, foldersRes, domainsRes] = await Promise.all([
        apiFetch('/api/v1/url-shortener/stats'),
        apiFetch('/api/v1/url-shortener/'),
        apiFetch('/api/v1/url-shortener/folders/list'),
        apiFetch('/api/v1/url-shortener/domains/list')
      ]);
      setStats(statsRes);
      setLinks(linksRes.links || []);
      setFolders(foldersRes.folders || []);
      setDomains(domainsRes.domains || []);
    } catch (err) {
      toast.error('Failed to load data');
      console.error(err);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Link CRUD operations
  async function handleCreateLink(e) {
    e.preventDefault();
    try {
      const payload = { ...linkDraft };
      if (!payload.target_url?.trim()) {
        toast.error('Target URL is required');
        return;
      }
      await apiFetch('/api/v1/url-shortener/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowLinkForm(false);
      resetLinkDraft();
      toast.success('Short link created!');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create link');
    }
  }

  async function handleUpdateLink(id, updates) {
    try {
      await apiFetch(`/api/v1/url-shortener/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      toast.success('Link updated');
      loadData();
    } catch (err) {
      toast.error('Failed to update link');
    }
  }

  async function handleDeleteLink(id) {
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/url-shortener/${id}`, { method: 'DELETE' });
      setLinks(links.filter(l => l.id !== id));
      toast.success('Link deleted');
    } catch (err) {
      toast.error('Failed to delete link');
    }
    setDeleting(false);
    setConfirmDelete(null);
  }

  async function handleBulkDelete() {
    try {
      await apiFetch('/api/v1/url-shortener/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selected })
      });
      setLinks(links.filter(l => !selected.includes(l.id)));
      setSelected([]);
      toast.success(`${selected.length} links deleted`);
    } catch (err) {
      toast.error('Bulk delete failed');
    }
  }

  // Folder operations
  async function handleCreateFolder(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/url-shortener/folders', {
        method: 'POST',
        body: JSON.stringify(folderDraft)
      });
      setShowFolderForm(false);
      setFolderDraft({ name: '', description: '', color: '#3b82f6' });
      toast.success('Folder created');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create folder');
    }
  }

  async function handleDeleteFolder(id) {
    try {
      await apiFetch(`/api/v1/url-shortener/folders/${id}`, { method: 'DELETE' });
      setFolders(folders.filter(f => f.id !== id));
      toast.success('Folder deleted');
    } catch (err) {
      toast.error('Failed to delete folder');
    }
  }

  // Domain operations
  async function handleCreateDomain(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/url-shortener/domains', {
        method: 'POST',
        body: JSON.stringify(domainDraft)
      });
      setShowDomainForm(false);
      setDomainDraft({ domain: '' });
      toast.success('Domain added - verify DNS records');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to add domain');
    }
  }

  async function handleVerifyDomain(id) {
    try {
      await apiFetch(`/api/v1/url-shortener/domains/${id}/verify`, { method: 'POST' });
      toast.success('Domain verified!');
      loadData();
    } catch (err) {
      toast.error('Verification failed - check DNS records');
    }
  }

  async function handleDeleteDomain(id) {
    try {
      await apiFetch(`/api/v1/url-shortener/domains/${id}`, { method: 'DELETE' });
      setDomains(domains.filter(d => d.id !== id));
      toast.success('Domain removed');
    } catch (err) {
      toast.error('Failed to remove domain');
    }
  }

  // QR Code generation
  async function handleGenerateQR(linkId) {
    try {
      const result = await apiFetch(`/api/v1/url-shortener/${linkId}/qr-code`, {
        method: 'POST',
        body: JSON.stringify(qrConfig)
      });
      toast.success('QR code generated!');
      window.open(result.qr_code.file_url, '_blank');
      setShowQRModal(null);
    } catch (err) {
      toast.error('Failed to generate QR code');
    }
  }

  // Analytics
  async function loadAnalytics(linkId) {
    try {
      const analytics = await apiFetch(`/api/v1/url-shortener/${linkId}/analytics?period=7d`);
      setShowAnalytics({ linkId, data: analytics });
    } catch (err) {
      toast.error('Failed to load analytics');
    }
  }

  // Utility functions
  function resetLinkDraft() {
    setLinkDraft({
      target_url: '',
      title: '',
      description: '',
      custom_slug: '',
      folder_id: null,
      tags: [],
      expires_at: '',
      password: '',
      link_type: 'standard',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      og_title: '',
      og_description: '',
      og_image_url: ''
    });
  }

  function handleCopy(slug, customDomain = null) {
    const baseUrl = customDomain || window.location.origin;
    const url = `${baseUrl}/s/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(slug);
        setTimeout(() => setCopied(null), 2000);
        toast.success('Copied to clipboard!');
      });
    }
  }

  function getShortUrl(link) {
    const domain = link.custom_domain || window.location.host;
    return `${domain}/s/${link.slug}`;
  }

  // Filter links
  const filteredLinks = links.filter(link => {
    if (filterFolder && link.folder_id !== filterFolder) return false;
    if (filterStatus && link.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        link.title?.toLowerCase().includes(query) ||
        link.slug?.toLowerCase().includes(query) ||
        link.target_url?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      
      <div className="module-head">
        <div>
          <h1>URL Shortener</h1>
          <p className="module-sub">Create, track, and manage branded short links</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => window.open('/api/v1/url-shortener/export/csv', '_blank')}>
            Export CSV
          </Button>
          <Button onClick={() => { resetLinkDraft(); setShowLinkForm(true); }}>
            + Create Short Link
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard label="Total Links" value={stats.total_links || 0} />
          <StatCard label="Active Links" value={stats.active_links || 0} />
          <StatCard label="Total Clicks" value={stats.total_clicks || 0} />
          <StatCard label="Unique Clicks" value={stats.unique_clicks || 0} />
          <StatCard label="Clicks (7d)" value={stats.clicks_7d || 0} />
          <StatCard label="Custom Domains" value={stats.total_domains || 0} />
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {['links', 'folders', 'domains', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 0',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--muted)',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Links Tab */}
      {activeTab === 'links' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            <select
              className="form-input"
              value={filterFolder || ''}
              onChange={(e) => setFilterFolder(e.target.value ? parseInt(e.target.value) : null)}
              style={{ minWidth: 150 }}
            >
              <option value="">All Folders</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <select
              className="form-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ minWidth: 120 }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Link Creation Form */}
          {showLinkForm && (
            <form onSubmit={handleCreateLink} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
              marginBottom: 20
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Create Short Link</h3>
              
              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Destination URL *</label>
                  <input
                    className="form-input"
                    type="url"
                    placeholder="https://example.com/your-long-url"
                    value={linkDraft.target_url}
                    onChange={(e) => setLinkDraft({ ...linkDraft, target_url: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Title</label>
                  <input
                    className="form-input"
                    placeholder="My Campaign Link"
                    value={linkDraft.title}
                    onChange={(e) => setLinkDraft({ ...linkDraft, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Custom Slug (optional)</label>
                  <input
                    className="form-input"
                    placeholder="my-custom-slug"
                    value={linkDraft.custom_slug}
                    onChange={(e) => setLinkDraft({ ...linkDraft, custom_slug: e.target.value })}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label className="form-label">Folder</label>
                  <select
                    className="form-input"
                    value={linkDraft.folder_id || ''}
                    onChange={(e) => setLinkDraft({ ...linkDraft, folder_id: e.target.value ? parseInt(e.target.value) : null })}
                  >
                    <option value="">No Folder</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Expires At (optional)</label>
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={linkDraft.expires_at}
                    onChange={(e) => setLinkDraft({ ...linkDraft, expires_at: e.target.value })}
                  />
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  padding: '8px 0',
                  marginBottom: 12,
                  fontSize: '0.9rem'
                }}
              >
                {showAdvancedOptions ? '▼' : '▶'} Advanced Options
              </button>

              {showAdvancedOptions && (
                <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 6, marginBottom: 12 }}>
                  {/* UTM Parameters */}
                  <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: '0.9rem' }}>UTM Parameters</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                    <input
                      className="form-input"
                      placeholder="utm_source"
                      value={linkDraft.utm_source}
                      onChange={(e) => setLinkDraft({ ...linkDraft, utm_source: e.target.value })}
                    />
                    <input
                      className="form-input"
                      placeholder="utm_medium"
                      value={linkDraft.utm_medium}
                      onChange={(e) => setLinkDraft({ ...linkDraft, utm_medium: e.target.value })}
                    />
                    <input
                      className="form-input"
                      placeholder="utm_campaign"
                      value={linkDraft.utm_campaign}
                      onChange={(e) => setLinkDraft({ ...linkDraft, utm_campaign: e.target.value })}
                    />
                  </div>

                  {/* Open Graph Preview */}
                  <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: '0.9rem' }}>Link Preview (Open Graph)</h4>
                  <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                    <input
                      className="form-input"
                      placeholder="OG Title"
                      value={linkDraft.og_title}
                      onChange={(e) => setLinkDraft({ ...linkDraft, og_title: e.target.value })}
                    />
                    <input
                      className="form-input"
                      placeholder="OG Description"
                      value={linkDraft.og_description}
                      onChange={(e) => setLinkDraft({ ...linkDraft, og_description: e.target.value })}
                    />
                    <input
                      className="form-input"
                      placeholder="OG Image URL"
                      value={linkDraft.og_image_url}
                      onChange={(e) => setLinkDraft({ ...linkDraft, og_image_url: e.target.value })}
                    />
                  </div>

                  {/* Password Protection */}
                  <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: '0.9rem' }}>Security</h4>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Password protect this link (optional)"
                    value={linkDraft.password}
                    onChange={(e) => setLinkDraft({ ...linkDraft, password: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="submit">Create Link</Button>
                <Button variant="ghost" type="button" onClick={() => setShowLinkForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Links Table */}
          <Table
            loading={!loaded}
            rows={filteredLinks}
            getRowKey={(l) => l.id}
            selectable
            selectedKeys={selected}
            onSelectionChange={setSelected}
            emptyState={
              <EmptyState
                icon="🔗"
                title="No short links yet"
                description="Create your first short link to start tracking clicks and engagement."
                action={<Button onClick={() => setShowLinkForm(true)}>+ Create Short Link</Button>}
              />
            }
            columns={[
              {
                key: 'title',
                header: 'Link',
                render: (l) => (
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
                      {l.title || 'Untitled Link'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ background: 'var(--surface)', padding: '2px 6px', borderRadius: 4 }}>
                        {getShortUrl(l)}
                      </code>
                      <button
                        onClick={() => handleCopy(l.slug, l.custom_domain)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        {copied === l.slug ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--muted)',
                      marginTop: 4,
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      → {l.target_url}
                    </div>
                  </div>
                )
              },
              {
                key: 'folder',
                header: 'Folder',
                render: (l) => {
                  const folder = folders.find(f => f.id === l.folder_id);
                  return folder ? (
                    <span style={{
                      fontSize: '0.8rem',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: folder.color + '20',
                      color: folder.color
                    }}>
                      {folder.name}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>—</span>
                  );
                }
              },
              {
                key: 'clicks',
                header: 'Clicks',
                render: (l) => (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                      {l.total_clicks || 0}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      {l.unique_clicks || 0} unique
                    </div>
                  </div>
                )
              },
              {
                key: 'status',
                header: 'Status',
                render: (l) => <StatusBadge status={l.status} />
              },
              {
                key: 'created',
                header: 'Created',
                render: (l) => (
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {new Date(l.created_at).toLocaleDateString()}
                  </span>
                )
              },
              {
                key: 'actions',
                header: '',
                render: (l) => (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Tooltip label="View Analytics">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadAnalytics(l.id)}
                      >
                        📊
                      </Button>
                    </Tooltip>
                    <Tooltip label="Generate QR Code">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQRModal(l)}
                      >
                        📱
                      </Button>
                    </Tooltip>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateLink(l.id, {
                        status: l.status === 'active' ? 'inactive' : 'active'
                      })}
                    >
                      {l.status === 'active' ? 'Pause' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => setConfirmDelete({ id: l.id })}
                    >
                      Delete
                    </Button>
                  </div>
                )
              }
            ]}
          />

          <BulkActionBar
            selectedCount={selected.length}
            onClearSelection={() => setSelected([])}
            actions={[
              {
                label: 'Delete',
                variant: 'danger',
                requiresConfirm: true,
                confirmTitle: `Delete ${selected.length} link(s)?`,
                confirmDescription: "This action cannot be undone.",
                onClick: handleBulkDelete
              }
            ]}
          />
        </>
      )}

      {/* Folders Tab */}
      {activeTab === 'folders' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button onClick={() => setShowFolderForm(true)}>+ Create Folder</Button>
          </div>

          {showFolderForm && (
            <form onSubmit={handleCreateFolder} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
              marginBottom: 20
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Create Folder</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginBottom: 12 }}>
                <input
                  className="form-input"
                  placeholder="Folder name *"
                  value={folderDraft.name}
                  onChange={(e) => setFolderDraft({ ...folderDraft, name: e.target.value })}
                  required
                />
                <input
                  className="form-input"
                  placeholder="Description (optional)"
                  value={folderDraft.description}
                  onChange={(e) => setFolderDraft({ ...folderDraft, description: e.target.value })}
                />
                <input
                  type="color"
                  value={folderDraft.color}
                  onChange={(e) => setFolderDraft({ ...folderDraft, color: e.target.value })}
                  style={{ width: 60, height: 40, border: '1px solid var(--border)', borderRadius: 4 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="submit">Create</Button>
                <Button variant="ghost" type="button" onClick={() => setShowFolderForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
            {folders.map(folder => (
              <div
                key={folder.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 16
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: folder.color
                    }}
                  />
                  <h4 style={{ margin: 0, flex: 1 }}>{folder.name}</h4>
                </div>
                {folder.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12 }}>
                    {folder.description}
                  </p>
                )}
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 12 }}>
                  {folder.link_count || 0} links
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => handleDeleteFolder(folder.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>

          {folders.length === 0 && (
            <EmptyState
              icon="📁"
              title="No folders yet"
              description="Create folders to organize your short links."
              action={<Button onClick={() => setShowFolderForm(true)}>+ Create Folder</Button>}
            />
          )}
        </>
      )}

      {/* Domains Tab */}
      {activeTab === 'domains' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button onClick={() => setShowDomainForm(true)}>+ Add Custom Domain</Button>
          </div>

          {showDomainForm && (
            <form onSubmit={handleCreateDomain} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
              marginBottom: 20
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Add Custom Domain</h3>
              <div style={{ marginBottom: 12 }}>
                <input
                  className="form-input"
                  placeholder="links.yourdomain.com"
                  value={domainDraft.domain}
                  onChange={(e) => setDomainDraft({ domain: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="submit">Add Domain</Button>
                <Button variant="ghost" type="button" onClick={() => setShowDomainForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <Table
            loading={!loaded}
            rows={domains}
            getRowKey={(d) => d.id}
            emptyState={
              <EmptyState
                icon="🌐"
                title="No custom domains"
                description="Add your own branded domain for short links."
                action={<Button onClick={() => setShowDomainForm(true)}>+ Add Domain</Button>}
              />
            }
            columns={[
              {
                key: 'domain',
                header: 'Domain',
                render: (d) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.domain}</div>
                    {!d.is_verified && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: 4 }}>
                        ⚠️ Verification pending
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: 'links',
                header: 'Links',
                render: (d) => <span>{d.link_count || 0}</span>
              },
              {
                key: 'status',
                header: 'Status',
                render: (d) => (
                  <StatusBadge status={d.is_verified ? 'active' : 'pending'} />
                )
              },
              {
                key: 'created',
                header: 'Added',
                render: (d) => (
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {new Date(d.created_at).toLocaleDateString()}
                  </span>
                )
              },
              {
                key: 'actions',
                header: '',
                render: (d) => (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!d.is_verified && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleVerifyDomain(d.id)}
                      >
                        Verify
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => handleDeleteDomain(d.id)}
                    >
                      Remove
                    </Button>
                  </div>
                )
              }
            ]}
          />
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <h3>Top Performing Links</h3>
          {stats?.top_links && stats.top_links.length > 0 ? (
            <Table
              rows={stats.top_links}
              getRowKey={(l) => l.id}
              columns={[
                {
                  key: 'title',
                  header: 'Link',
                  render: (l) => (
                    <div>
                      <div style={{ fontWeight: 600 }}>{l.title || 'Untitled'}</div>
                      <code style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        /s/{l.slug}
                      </code>
                    </div>
                  )
                },
                {
                  key: 'clicks',
                  header: 'Total Clicks',
                  render: (l) => (
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {l.total_clicks}
                    </span>
                  )
                },
                {
                  key: 'unique',
                  header: 'Unique Clicks',
                  render: (l) => <span>{l.unique_clicks}</span>
                },
                {
                  key: 'actions',
                  header: '',
                  render: (l) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadAnalytics(l.id)}
                    >
                      View Details
                    </Button>
                  )
                }
              ]}
            />
          ) : (
            <EmptyState
              icon="📊"
              title="No analytics data yet"
              description="Create and share links to see analytics."
            />
          )}
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg)',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0 }}>Generate QR Code</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: 16 }}>
              For: <strong>{showQRModal.title || showQRModal.slug}</strong>
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="form-label">Size (px)</label>
                <input
                  type="number"
                  className="form-input"
                  value={qrConfig.size}
                  onChange={(e) => setQrConfig({ ...qrConfig, size: parseInt(e.target.value) })}
                  min="100"
                  max="2000"
                />
              </div>
              <div>
                <label className="form-label">Format</label>
                <select
                  className="form-input"
                  value={qrConfig.format}
                  onChange={(e) => setQrConfig({ ...qrConfig, format: e.target.value })}
                >
                  <option value="png">PNG</option>
                  <option value="svg">SVG</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              <div>
                <label className="form-label">Foreground Color</label>
                <input
                  type="color"
                  value={qrConfig.foreground_color}
                  onChange={(e) => setQrConfig({ ...qrConfig, foreground_color: e.target.value })}
                  style={{ width: '100%', height: 40 }}
                />
              </div>
              <div>
                <label className="form-label">Background Color</label>
                <input
                  type="color"
                  value={qrConfig.background_color}
                  onChange={(e) => setQrConfig({ ...qrConfig, background_color: e.target.value })}
                  style={{ width: '100%', height: 40 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => handleGenerateQR(showQRModal.id)}>
                Generate & Download
              </Button>
              <Button variant="ghost" onClick={() => setShowQRModal(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'var(--bg)',
            borderRadius: 12,
            padding: 24,
            maxWidth: 900,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Link Analytics</h3>
              <Button variant="ghost" onClick={() => setShowAnalytics(null)}>✕</Button>
            </div>

            {showAnalytics.data && (
              <>
                {/* Overview Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                  <StatCard
                    label="Total Clicks"
                    value={showAnalytics.data.overview?.total_clicks || 0}
                  />
                  <StatCard
                    label="Unique Visitors"
                    value={showAnalytics.data.overview?.unique_visitors || 0}
                  />
                  <StatCard
                    label="Human Clicks"
                    value={showAnalytics.data.overview?.human_clicks || 0}
                  />
                  <StatCard
                    label="Bot Clicks"
                    value={showAnalytics.data.overview?.bot_clicks || 0}
                  />
                </div>

                {/* Timeline Chart */}
                {showAnalytics.data.timeline && showAnalytics.data.timeline.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h4>Clicks Over Time (Last 7 Days)</h4>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 150 }}>
                      {showAnalytics.data.timeline.map((day, i) => {
                        const maxClicks = Math.max(...showAnalytics.data.timeline.map(d => d.clicks));
                        const height = maxClicks > 0 ? (day.clicks / maxClicks) * 100 : 0;
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Tooltip label={`${day.clicks} clicks on ${new Date(day.date).toLocaleDateString()}`}>
                              <div
                                style={{
                                  width: '100%',
                                  height: `${height}%`,
                                  background: 'var(--primary)',
                                  borderRadius: '4px 4px 0 0',
                                  minHeight: day.clicks > 0 ? 4 : 0
                                }}
                              />
                            </Tooltip>
                            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Top Referrers */}
                {showAnalytics.data.referrers && showAnalytics.data.referrers.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h4>Top Referrers</h4>
                    <Table
                      rows={showAnalytics.data.referrers}
                      getRowKey={(r, i) => i}
                      columns={[
                        { key: 'domain', header: 'Domain', render: (r) => r.referrer_domain || 'Direct' },
                        { key: 'type', header: 'Type', render: (r) => <StatusBadge status={r.referrer_type} /> },
                        { key: 'clicks', header: 'Clicks', render: (r) => r.clicks }
                      ]}
                    />
                  </div>
                )}

                {/* Device Breakdown */}
                {showAnalytics.data.devices && showAnalytics.data.devices.length > 0 && (
                  <div>
                    <h4>Device Types</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {showAnalytics.data.devices.map((device, i) => (
                        <div key={i} style={{
                          background: 'var(--surface)',
                          padding: 12,
                          borderRadius: 6,
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>
                            {device.device_type === 'mobile' ? '📱' : device.device_type === 'tablet' ? '📱' : '💻'}
                          </div>
                          <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {device.device_type}
                          </div>
                          <div style={{ fontSize: '1.2rem', color: 'var(--primary)', marginTop: 4 }}>
                            {device.clicks}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Delet

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDeleteLink(confirmDelete.id)}
        title="Delete short link?"
        description="This link will stop redirecting immediately. This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
