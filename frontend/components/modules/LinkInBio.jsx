'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Link2, Eye, MousePointerClick, ExternalLink, 
  Trash2, Edit2, GripVertical, QrCode, Copy, Check,
  BarChart3, Calendar, TrendingUp, Globe, Settings,
  Image as ImageIcon, Palette, Save, X
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import QRCode from 'qrcode';

export default function LinkInBio() {
  const [activeTab, setActiveTab] = useState('pages');
  const [stats, setStats] = useState({ pages: 0, total_views: 0, total_clicks: 0, total_links: 0 });
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [links, setLinks] = useState([]);
  const [showPageForm, setShowPageForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('7d');
  const [pageAnalytics, setPageAnalytics] = useState(null);

  // Form states
  const [pageForm, setPageForm] = useState({
    title: '',
    bio: '',
    avatarUrl: '',
    slug: '',
    bgColor: '#ffffff',
    accentColor: '#2563eb',
    status: 'active'
  });

  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    icon: '🔗',
    sortOrder: 0,
    isActive: true
  });

  useEffect(() => {
    fetchStats();
    fetchPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      fetchLinks(selectedPage.id);
      if (activeTab === 'analytics') {
        fetchPageAnalytics(selectedPage.id);
      }
    }
  }, [selectedPage, activeTab, analyticsPeriod]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/link-in-bio/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/link-in-bio/pages', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setPages(data.pages);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinks = async (pageId) => {
    try {
      const res = await fetch(`/api/link-in-bio/pages/${pageId}/links`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setLinks(data.links);
    } catch (error) {
      console.error('Failed to fetch links:', error);
    }
  };

  const fetchPageAnalytics = async (pageId) => {
    try {
      const res = await fetch(`/api/link-in-bio/pages/${pageId}/analytics?period=${analyticsPeriod}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setPageAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleCreatePage = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/link-in-bio/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(pageForm)
      });
      
      if (res.ok) {
        const data = await res.json();
        setPages([data.page, ...pages]);
        setShowPageForm(false);
        resetPageForm();
        fetchStats();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create page');
      }
    } catch (error) {
      console.error('Failed to create page:', error);
      alert('Failed to create page');
    }
  };

  const handleUpdatePage = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/link-in-bio/pages/${editingPage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(pageForm)
      });
      
      if (res.ok) {
        const data = await res.json();
        setPages(pages.map(p => p.id === data.page.id ? data.page : p));
        if (selectedPage?.id === data.page.id) {
          setSelectedPage(data.page);
        }
        setEditingPage(null);
        resetPageForm();
      }
    } catch (error) {
      console.error('Failed to update page:', error);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!confirm('Are you sure you want to delete this page? All links will be removed.')) return;
    
    try {
      await fetch(`/api/link-in-bio/pages/${pageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      setPages(pages.filter(p => p.id !== pageId));
      if (selectedPage?.id === pageId) {
        setSelectedPage(null);
        setLinks([]);
      }
      fetchStats();
    } catch (error) {
      console.error('Failed to delete page:', error);
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/link-in-bio/pages/${selectedPage.id}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(linkForm)
      });
      
      if (res.ok) {
        const data = await res.json();
        setLinks([...links, data.link]);
        setShowLinkForm(false);
        resetLinkForm();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to create link:', error);
    }
  };

  const handleUpdateLink = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/link-in-bio/links/${editingLink.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(linkForm)
      });
      
      if (res.ok) {
        const data = await res.json();
        setLinks(links.map(l => l.id === data.link.id ? data.link : l));
        setEditingLink(null);
        resetLinkForm();
      }
    } catch (error) {
      console.error('Failed to update link:', error);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!confirm('Delete this link?')) return;
    
    try {
      await fetch(`/api/link-in-bio/links/${linkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      setLinks(links.filter(l => l.id !== linkId));
      fetchStats();
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedLinks = items.map((link, index) => ({
      ...link,
      sort_order: index
    }));

    setLinks(updatedLinks);

    try {
      await Promise.all(
        updatedLinks.map(link =>
          fetch(`/api/link-in-bio/links/${link.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ sortOrder: link.sort_order })
          })
        )
      );
    } catch (error) {
      console.error('Failed to update link order:', error);
    }
  };

  const generateQRCode = async (slug) => {
    try {
      const url = `${window.location.origin}/bio/${slug}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const resetPageForm = () => {
    setPageForm({
      title: '',
      bio: '',
      avatarUrl: '',
      slug: '',
      bgColor: '#ffffff',
      accentColor: '#2563eb',
      status: 'active'
    });
  };

  const resetLinkForm = () => {
    setLinkForm({
      title: '',
      url: '',
      icon: '🔗',
      sortOrder: 0,
      isActive: true
    });
  };

  const startEditPage = (page) => {
    setEditingPage(page);
    setPageForm({
      title: page.title,
      bio: page.bio || '',
      avatarUrl: page.avatar_url || '',
      slug: page.slug,
      bgColor: page.bg_color,
      accentColor: page.accent_color,
      status: page.status
    });
  };

  const startEditLink = (link) => {
    setEditingLink(link);
    setLinkForm({
      title: link.title,
      url: link.url,
      icon: link.icon,
      sortOrder: link.sort_order,
      isActive: link.is_active
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Link-in-Bio</h1>
          <p className="text-gray-600 mt-1">Create beautiful landing pages for your social media</p>
        </div>
        <button
          onClick={() => setShowPageForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Page
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pages</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pages}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_views}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_clicks}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MousePointerClick className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Links</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_links}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Link2 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pages List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Pages</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {pages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Globe className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No pages yet</p>
                <p className="text-sm mt-1">Create your first link-in-bio page</p>
              </div>
            ) : (
              pages.map(page => (
                <div
                  key={page.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedPage?.id === page.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                  onClick={() => setSelectedPage(page)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{page.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">/bio/{page.slug}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {page.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          {page.link_count || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditPage(page);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(page.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Page Details */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          {selectedPage ? (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex gap-4 px-6">
                  <button
                    onClick={() => setActiveTab('links')}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'links'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Link2 className="w-4 h-4 inline mr-2" />
                    Links
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'analytics'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Analytics
                  </button>
                  <button
                    onClick={() => setActiveTab('appearance')}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'appearance'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Palette className="w-4 h-4 inline mr-2" />
                    Appearance
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('qr');
                      generateQRCode(selectedPage.slug);
                    }}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'qr'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4 inline mr-2" />
                    QR Code
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Links Tab */}
                {activeTab === 'links' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Links</h3>
                      <button
                        onClick={() => setShowLinkForm(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Link
                      </button>
                    </div>

                    {links.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Link2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No links yet</p>
                        <p className="text-sm mt-1">Add your first link to get started</p>
                      </div>
                    ) : (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="links">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-2"
                            >
                              {links.map((link, index) => (
                                <Draggable
                                  key={link.id}
                                  draggableId={link.id.toString()}
                                  index={index}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className="w-5 h-5 text-gray-400" />
                                      </div>
                                      <span className="text-2xl">{link.icon}</span>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 truncate">
                                          {link.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 truncate">{link.url}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                          <span className="flex items-center gap-1">
                                            <MousePointerClick className="w-3 h-3" />
                                            {link.clicks || 0} clicks
                                          </span>
                                          <span className={`px-2 py-0.5 rounded-full ${
                                            link.is_active
                                              ? 'bg-green-100 text-green-700'
                                              : 'bg-gray-100 text-gray-700'
                                          }`}>
                                            {link.is_active ? 'Active' : 'Inactive'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => startEditLink(link)}
                                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteLink(link.id)}
                                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                      <select
                        value={analyticsPeriod}
                        onChange={(e) => setAnalyticsPeriod(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="24h">Last 24 hours</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                          <Eye className="w-5 h-5" />
                          <span className="text-sm font-medium">Page Views</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-900">
                          {selectedPage.views || 0}
                        </p>
                        <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          +12% from last period
                        </p>
                      </div>

                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                          <MousePointerClick className="w-5 h-5" />
                          <span className="text-sm font-medium">Total Clicks</span>
                        </div>
                        <p className="text-3xl font-bold text-purple-900">
                          {links.reduce((sum, link) => sum + (link.clicks || 0), 0)}
                        </p>
                        <p className="text-sm text-purple-600 mt-1 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          +8% from last period
                        </p>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Top Performing Links</h4>
                      <div className="space-y-3">
                        {links
                          .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
                          .slice(0, 5)
                          .map((link) => (
                            <div key={link.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-xl">{link.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{link.title}</p>
                                  <p className="text-sm text-gray-600 truncate">{link.url}</p>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-semibold text-gray-900">{link.clicks || 0}</p>
                                <p className="text-xs text-gray-500">clicks</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Customize Appearance</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Avatar URL
                        </label>
                        <input
                          type="url"
                          value={pageForm.avatarUrl}
                          onChange={(e) => setPageForm({ ...pageForm, avatarUrl: e.target.value })}
                          placeholder="https://example.com/avatar.jpg"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Background Color
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={pageForm.bgColor}
                              onChange={(e) => setPageForm({ ...pageForm, bgColor: e.target.value })}
                              className="h-10 w-20 rounded border border-gray-300"
                            />
                            <input
                              type="text"
                              value={pageForm.bgColor}
                              onChange={(e) => setPageForm({ ...pageForm, bgColor: e.target.value })}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Accent Color
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={pageForm.accentColor}
                              onChange={(e) => setPageForm({ ...pageForm, accentColor: e.target.value })}
                              className="h-10 w-20 rounded border border-gray-300"
                            />
                            <input
                              type="text"
                              value={pageForm.accentColor}
                              onChange={(e) => setPageForm({ ...pageForm, accentColor: e.target.value })}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleUpdatePage}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>

                    {/* Preview */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Preview</h4>
                      <div
                        className="max-w-sm mx-auto rounded-lg p-6 shadow-lg"
                        style={{ backgroundColor: pageForm.bgColor }}
                      >
                        {pageForm.avatarUrl && (
                          <img
                            src={pageForm.avatarUrl}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                          />
                        )}
                        <h3 className="text-xl font-bold text-center mb-2">{selectedPage.title}</h3>
                        {selectedPage.bio && (
                          <p className="text-center text-sm mb-4">{selectedPage.bio}</p>
                        )}
                        <div className="space-y-2">
                          {links.slice(0, 3).map((link) => (
                            <div
                              key={link.id}
                              className="p-3 rounded-lg text-center font-medium"
                              style={{
                                backgroundColor: pageForm.accentColor,
                                color: '#ffffff'
                              }}
                            >
                              {link.icon} {link.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code Tab */}
                {activeTab === 'qr' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
                    
                    <div className="text-center">
                      {qrCodeUrl ? (
                        <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-lg">
                          <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                        </div>
                      ) : (
                        <div className="inline-block p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                          <QrCode className="w-64 h-64 text-gray-400 mx-auto" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        <span>{window.location.origin}/bio/{selectedPage.slug}</span>
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/bio/${selectedPage.slug}`)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          {copiedSlug ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <a
                          href={qrCodeUrl}
                          download={`${selectedPage.slug}-qr-code.png`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Download QR Code
                        </a>
                        <a
                          href={`/bio/${selectedPage.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Public Page
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Globe className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">Select a page to manage</p>
              <p className="text-sm mt-2">Choose a page from the list or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Page Modal */}
      {(showPageForm || editingPage) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPage ? 'Edit Page' : 'Create New Page'}
              </h2>
              <button
                onClick={() => {
                  setShowPageForm(false);
                  setEditingPage(null);
                  resetPageForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={editingPage ? handleUpdatePage : handleCreatePage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Title *
                </label>
                <input
                  type="text"
                  required
                  value={pageForm.title}
                  onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                  placeholder="My Awesome Page"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={pageForm.bio}
                  onChange={(e) => setPageForm({ ...pageForm, bio: e.target.value })}
                  placeholder="Tell your visitors about yourself..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={pageForm.avatarUrl}
                  onChange={(e) => setPageForm({ ...pageForm, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">/bio/</span>
                  <input
                    type="text"
                    required
                    value={pageForm.slug}
                    onChange={(e) => setPageForm({ 
                      ...pageForm, 
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                    })}
                    placeholder="my-page"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={pageForm.bgColor}
                    onChange={(e) => setPageForm({ ...pageForm, bgColor: e.target.value })}
                    className="w-full h-10 rounded border border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={pageForm.accentColor}
                    onChange={(e) => setPageForm({ ...pageForm, accentColor: e.target.value })}
                    className="w-full h-10 rounded border border-gray-300"
                  />
                </div>
              </div>

              {editingPage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={pageForm.status}
                    onChange={(e) => setPageForm({ ...pageForm, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPageForm(false);
                    setEditingPage(null);
                    resetPageForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPage ? 'Update Page' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Link Modal */}
      {(showLinkForm || editingLink) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingLink ? 'Edit Link' : 'Add New Link'}
              </h2>
              <button
                onClick={() => {
                  setShowLinkForm(false);
                  setEditingLink(null);
                  resetLinkForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={editingLink ? handleUpdateLink : handleCreateLink} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Title *
                </label>
                <input
                  type="text"
                  required
                  value={linkForm.title}
                  onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                  placeholder="My Website"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  required
                  value={linkForm.url}
                  onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={linkForm.icon}
                  onChange={(e) => setLinkForm({ ...linkForm, icon: e.target.value })}
                  placeholder="🔗"
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {editingLink && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={linkForm.isActive}
                    onChange={(e) => setLinkForm({ ...linkForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkForm(false);
                    setEditingLink(null);
                    resetLinkForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingLink ? 'Update Link' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
