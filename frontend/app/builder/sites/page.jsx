'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../../lib/api';
import Button from '../../../components/ui/Button';
import { SkeletonRows } from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';
import SearchInput from '../../../components/ui/SearchInput';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import Pagination from '../../../components/ui/Pagination';
import {
  GlobeAltIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  RocketLaunchIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const PAGE_SIZE = 12;

export default function SitesPage() {
  const router = useRouter();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    themeId: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    siteTitle: '',
    siteDescription: '',
    faviconUrl: '',
    customDomain: ''
  });

  const loadSites = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', PAGE_SIZE);
      params.append('offset', (page - 1) * PAGE_SIZE);

      const data = await apiFetch(`/api/v1/builder/sites?${params}`);
      setSites(data.sites || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load sites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const handleCreateSite = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error('Site name is required');
      return;
    }

    try {
      const data = await apiFetch('/api/v1/builder/sites', {
        method: 'POST',
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || null,
          themeId: createForm.themeId || null
        })
      });

      toast.success('Site created successfully!');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', themeId: '' });
      await loadSites();
      
      // Navigate to site editor
      router.push(`/builder/sites/${data.site.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create site');
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!selectedSite) return;

    try {
      await apiFetch(`/api/v1/builder/sites/${selectedSite.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: settingsForm.name.trim(),
          description: settingsForm.description.trim() || null,
          seoSettings: {
            siteTitle: settingsForm.siteTitle.trim() || null,
            siteDescription: settingsForm.siteDescription.trim() || null
          },
          favicon: settingsForm.faviconUrl.trim() || null
        })
      });

      // Update custom domain separately if changed
      if (settingsForm.customDomain !== selectedSite.custom_domain) {
        await apiFetch(`/api/v1/builder/sites/${selectedSite.id}/custom-domain`, {
          method: 'PUT',
          body: JSON.stringify({
            customDomain: settingsForm.customDomain.trim() || null
          })
        });
      }

      toast.success('Site settings updated!');
      setShowSettingsModal(false);
      setSelectedSite(null);
      await loadSites();
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    }
  };

  const handlePublishSite = async (site) => {
    try {
      await apiFetch(`/api/v1/builder/sites/${site.id}/publish`, {
        method: 'POST'
      });
      toast.success(`Site "${site.name}" published!`);
      await loadSites();
    } catch (err) {
      toast.error(err.message || 'Failed to publish site');
    }
  };

  const handleUnpublishSite = async (site) => {
    try {
      await apiFetch(`/api/v1/builder/sites/${site.id}/unpublish`, {
        method: 'POST'
      });
      toast.success(`Site "${site.name}" unpublished`);
      await loadSites();
    } catch (err) {
      toast.error(err.message || 'Failed to unpublish site');
    }
  };

  const handleDuplicateSite = async (site) => {
    const newName = prompt(`Enter a name for the duplicated site:`, `${site.name} (Copy)`);
    if (!newName) return;

    try {
      await apiFetch(`/api/v1/builder/sites/${site.id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ newName: newName.trim() })
      });
      toast.success('Site duplicated successfully!');
      await loadSites();
    } catch (err) {
      toast.error(err.message || 'Failed to duplicate site');
    }
  };

  const handleDeleteSite = async (siteId) => {
    try {
      await apiFetch(`/api/v1/builder/sites/${siteId}`, {
        method: 'DELETE'
      });
      toast.success('Site deleted');
      setConfirmDelete(null);
      await loadSites();
    } catch (err) {
      toast.error(err.message || 'Failed to delete site');
    }
  };

  const handleExportSite = async (site) => {
    try {
      const data = await apiFetch(`/api/v1/builder/sites/${site.id}/export`);
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${site.name.toLowerCase().replace(/\s+/g, '-')}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Site exported successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to export site');
    }
  };

  const openSettings = (site) => {
    setSelectedSite(site);
    setSettingsForm({
      name: site.name,
      description: site.description || '',
      siteTitle: site.site_title || '',
      siteDescription: site.site_description || '',
      faviconUrl: site.favicon_url || '',
      customDomain: site.custom_domain || ''
    });
    setShowSettingsModal(true);
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/builder')}>
        ← Back to Builder
      </button>

      <div className="module-head">
        <div>
          <h1>Website Sites</h1>
          <p className="module-sub">
            Create and manage multi-page websites with global navigation and themes
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon style={{ width: 18, height: 18 }} />
          New Site
        </Button>
      </div>

      {/* Stats */}
      {total > 0 && (
        <div className="stats-row" style={{ marginBottom: 20 }}>
          <span className="stat-pill">
            Total: <strong>{total}</strong>
          </span>
          <span className="stat-pill" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            Published: <strong>{sites.filter(s => s.status === 'published').length}</strong>
          </span>
          <span className="stat-pill" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            Draft: <strong>{sites.filter(s => s.status === 'draft').length}</strong>
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search sites..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 14
          }}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Sites Grid */}
      {loading ? (
        <SkeletonRows rows={4} />
      ) : sites.length === 0 ? (
        <EmptyState
          icon={<GlobeAltIcon style={{ width: 64, height: 64 }} />}
          title="No sites yet"
          description="Create your first multi-page website to get started"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon style={{ width: 18, height: 18 }} />
              Create Site
            </Button>
          }
        />
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
            marginBottom: 20
          }}>
            {sites.map((site) => (
              <div
                key={site.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => router.push(`/builder/sites/${site.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Header */}
                <div style={{
                  padding: 20,
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                  color: 'white',
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: 8, fontSize: 18 }}>
                      {site.name}
                    </h3>
                    {site.description && (
                      <p style={{
                        fontSize: 13,
                        opacity: 0.9,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {site.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge variant={site.status === 'published' ? 'success' : 'neutral'}>
                      {site.status}
                    </Badge>
                    {site.theme_name && (
                      <span style={{
                        fontSize: 12,
                        opacity: 0.8,
                        background: 'rgba(255,255,255,0.2)',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}>
                        {site.theme_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: 'var(--text-muted)'
                }}>
                  <div>
                    <strong style={{ color: 'var(--text)' }}>{site.page_count || 0}</strong> pages
                  </div>
                  <div>
                    Updated {new Date(site.updated_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  padding: '12px 20px',
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap'
                }}>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/builder/sites/${site.id}`);
                    }}
                  >
                    <PencilIcon style={{ width: 16, height: 16 }} />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/builder/sites/${site.id}/pages`);
                    }}
                  >
                    <GlobeAltIcon style={{ width: 16, height: 16 }} />
                    Pages
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSettings(site);
                    }}
                  >
                    <Cog6ToothIcon style={{ width: 16, height: 16 }} />
                  </Button>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {site.status === 'published' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnpublishSite(site);
                        }}
                      >
                        Unpublish
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublishSite(site);
                        }}
                      >
                        <RocketLaunchIcon style={{ width: 16, height: 16 }} />
                        Publish
                      </Button>
                    )}
                  </div>
                </div>

                {/* More Actions */}
                <div style={{
                  padding: '8px 20px 12px',
                  display: 'flex',
                  gap: 12,
                  fontSize: 13,
                  borderTop: '1px solid var(--border)'
                }}>
                  <button
                    className="ctag"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/builder/sites/${site.id}/analytics`);
                    }}
                  >
                    <ChartBarIcon style={{ width: 14, height: 14 }} />
                    Analytics
                  </button>
                  <button
                    className="ctag"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateSite(site);
                    }}
                  >
                    <DocumentDuplicateIcon style={{ width: 14, height: 14 }} />
                    Duplicate
                  </button>
                  <button
                    className="ctag"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportSite(site);
                    }}
                  >
                    <ArrowUpTrayIcon style={{ width: 14, height: 14 }} />
                    Export
                  </button>
                  <button
                    className="ctag"
                    style={{ color: 'var(--danger)', marginLeft: 'auto' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(site);
                    }}
                  >
                    <TrashIcon style={{ width: 14, height: 14 }} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Create Site Modal */}
      {showCreateModal && (
        <Modal
          isOpen
          title="Create New Site"
          description="Start building a multi-page website"
          onClose={() => setShowCreateModal(false)}
        >
          <form onSubmit={handleCreateSite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label className="field-label">Site Name *</label>
              <input
                className="field-input"
                placeholder="My Business Website"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                autoFocus
                required
              />
            </div>

            <div className="field">
              <label className="field-label">Description</label>
              <textarea
                className="field-input"
                placeholder="Brief description of your website"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button onClick={() => setShowCreateModal(false)} variant="ghost">
                Cancel
              </Button>
              <Button type="submit">Create Site</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedSite && (
        <Modal
          isOpen
          title="Site Settings"
          description={`Configure settings for ${selectedSite.name}`}
          onClose={() => {
            setShowSettingsModal(false);
            setSelectedSite(null);
          }}
        >
          <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label className="field-label">Site Name *</label>
              <input
                className="field-input"
                value={settingsForm.name}
                onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label className="field-label">Description</label>
              <textarea
                className="field-input"
                value={settingsForm.description}
                onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="field">
              <label className="field-label">Site Title (SEO)</label>
              <input
                className="field-input"
                placeholder="Appears in browser tab and search results"
                value={settingsForm.siteTitle}
                onChange={(e) => setSettingsForm({ ...settingsForm, siteTitle: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="field-label">Site Description (SEO)</label>
              <textarea
                className="field-input"
                placeholder="Brief description for search engines"
                value={settingsForm.siteDescription}
                onChange={(e) => setSettingsForm({ ...settingsForm, siteDescription: e.target.value })}
                rows={2}
              />
            </div>

            <div className="field">
              <label className="field-label">Favicon URL</label>
              <input
                className="field-input"
                placeholder="https://example.com/favicon.ico"
                value={settingsForm.faviconUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, faviconUrl: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="field-label">Custom Domain</label>
              <input
                className="field-input"
                placeholder="www.yourdomain.com"
                value={settingsForm.customDomain}
                onChange={(e) => setSettingsForm({ ...settingsForm, customDomain: e.target.value.toLowerCase() })}
              />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Point a CNAME record to your app's host to connect this domain
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button
                onClick={() => {
                  setShowSettingsModal(false);
                  setSelectedSite(null);
                }}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button type="submit">Save Settings</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDeleteSite(confirmDelete.id)}
        title="Delete Site?"
        description={`This will permanently delete "${confirmDelete?.name}" and all its pages. This action cannot be undone.`}
        confirmLabel="Delete Site"
        cancelLabel="Cancel"
        danger
      />
    </div>
  );
}
