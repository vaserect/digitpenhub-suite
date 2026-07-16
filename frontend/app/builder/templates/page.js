'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  EyeIcon,
  RocketLaunchIcon,
  XMarkIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadTemplates();
    loadCategories();
    loadIndustries();
  }, [searchQuery, selectedCategory, selectedIndustry, filterType]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedIndustry) params.append('industry', selectedIndustry);
      if (filterType === 'featured') params.append('featured', 'true');

      const endpoint = filterType === 'popular' 
        ? '/api/v1/builder/templates/popular?limit=20'
        : `/api/v1/builder/templates?${params}`;

      const res = await fetch(endpoint, { credentials: 'include' });
      
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/billing?upgrade=website-builder');
          return;
        }
        throw new Error('Failed to load templates');
      }

      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/v1/builder/templates/categories', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadIndustries = async () => {
    try {
      const res = await fetch('/api/v1/builder/templates/industries', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setIndustries(data.industries || []);
      }
    } catch (err) {
      console.error('Error loading industries:', err);
    }
  };

  const handleUseTemplate = async (template) => {
    const siteName = prompt(`Enter a name for your new site (based on "${template.name}"):`);
    if (!siteName) return;

    try {
      const res = await fetch(`/api/v1/builder/templates/${template.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ siteName, customizeName: true })
      });

      if (!res.ok) throw new Error('Failed to use template');

      const data = await res.json();
      alert(`Site "${data.site.name}" created successfully with ${data.pages.length} pages!`);
      router.push('/builder');
    } catch (err) {
      console.error('Error using template:', err);
      alert('Failed to create site from template. Please try again.');
    }
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  return (
    <>
      <style jsx global>{`
        .template-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .template-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }
        .template-thumbnail {
          position: relative;
        }
        .template-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .template-thumbnail:hover .template-overlay {
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Header */}
        <div style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                  Template Marketplace
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                  Choose from {templates.length}+ professional website templates
                </p>
              </div>
              <button
                onClick={() => router.push('/builder')}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text)',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                onMouseLeave={(e) => e.target.style.background = 'var(--card-bg)'}
              >
                ← Back to Builder
              </button>
            </div>

            {/* Search and Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ flex: '1 1 300px', position: 'relative' }}>
                  <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '40px',
                      paddingRight: '16px',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'var(--card-bg)',
                      color: 'var(--text)'
                    }}
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--card-bg)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    minWidth: '150px'
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                {/* Industry Filter */}
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--card-bg)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    minWidth: '150px'
                  }}
                >
                  <option value="">All Industries</option>
                  {industries.map(ind => (
                    <option key={ind.industry} value={ind.industry}>
                      {ind.industry} ({ind.template_count})
                    </option>
                  ))}
                </select>

                {/* View Mode Toggle */}
                <div style={{ display: 'flex', gap: '4px', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px', background: 'var(--card-bg)' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                      color: viewMode === 'grid' ? 'white' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Squares2X2Icon style={{ width: '18px', height: '18px' }} />
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                      color: viewMode === 'list' ? 'white' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    <ListBulletIcon style={{ width: '18px', height: '18px' }} />
                    List
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFilterType('all')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '8px',
                    border: 'none',
                    background: filterType === 'all' ? 'var(--primary)' : 'var(--card-bg)',
                    color: filterType === 'all' ? 'white' : 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  All Templates
                </button>
                <button
                  onClick={() => setFilterType('featured')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '8px',
                    border: 'none',
                    background: filterType === 'featured' ? 'var(--primary)' : 'var(--card-bg)',
                    color: filterType === 'featured' ? 'white' : 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ⭐ Featured
                </button>
                <button
                  onClick={() => setFilterType('popular')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '8px',
                    border: 'none',
                    background: filterType === 'popular' ? 'var(--primary)' : 'var(--card-bg)',
                    color: filterType === 'popular' ? 'white' : 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🔥 Popular
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Grid/List */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 16px' }}></div>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Loading templates...</p>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <FunnelIcon style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: 'var(--text-muted)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>
                No templates found
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Try adjusting your filters or search query
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {templates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onPreview={handlePreview}
                  onUse={handleUseTemplate}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {templates.map(template => (
                <TemplateListItem
                  key={template.id}
                  template={template}
                  onPreview={handlePreview}
                  onUse={handleUseTemplate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {showPreview && selectedTemplate && (
          <TemplatePreviewModal
            template={selectedTemplate}
            onClose={() => {
              setShowPreview(false);
              setSelectedTemplate(null);
            }}
            onUse={handleUseTemplate}
          />
        )}
      </div>
    </>
  );
}

function TemplateCard({ template, onPreview, onUse }) {
  return (
    <div 
      className="card template-card" 
      style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => onPreview(template)}
    >
      {/* Thumbnail */}
      <div className="template-thumbnail" style={{ height: '200px', background: 'var(--hover-bg)', overflow: 'hidden' }}>
        {template.thumbnail_url ? (
          <img
            src={template.thumbnail_url}
            alt={template.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '14px' }}>
            No Preview Available
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="template-overlay">
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(template); }}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#1f2937',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <EyeIcon style={{ width: '18px', height: '18px' }} />
            Preview
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onUse(template); }}
            style={{
              padding: '10px 20px',
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <RocketLaunchIcon style={{ width: '18px', height: '18px' }} />
            Use
          </button>
        </div>

        {/* Badges */}
        {template.is_featured && (
          <span style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            padding: '4px 12px',
            background: '#fbbf24',
            color: '#78350f',
            fontSize: '12px',
            fontWeight: '600',
            borderRadius: '6px',
            zIndex: 10
          }}>
            Featured
          </span>
        )}
        {template.is_premium && (
          <span style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 12px',
            background: '#9333ea',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
            borderRadius: '6px',
            zIndex: 10
          }}>
            Premium
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '8px', fontSize: '16px' }}>
          {template.name}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {template.description}
        </p>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <StarIconSolid style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
            <span style={{ fontWeight: '500', color: 'var(--text)' }}>{template.rating || '0.0'}</span>
            <span style={{ color: 'var(--text-muted)' }}>({template.rating_count || 0})</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>{template.usage_count || 0} uses</span>
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {template.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                style={{
                  padding: '4px 10px',
                  background: 'var(--hover-bg)',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  borderRadius: '6px'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateListItem({ template, onPreview, onUse }) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', gap: '20px', transition: 'all 0.2s' }}>
      {/* Thumbnail */}
      <div style={{ width: '240px', height: '160px', background: 'var(--hover-bg)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
        {template.thumbnail_url ? (
          <img
            src={template.thumbnail_url}
            alt={template.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '13px' }}>
            No Preview
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: '600', color: 'var(--text)', fontSize: '18px', marginBottom: '8px' }}>
              {template.name}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {template.description}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
            {template.is_featured && (
              <span style={{ padding: '4px 12px', background: '#fef3c7', color: '#78350f', fontSize: '12px', fontWeight: '600', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                Featured
              </span>
            )}
            {template.is_premium && (
              <span style={{ padding: '4px 12px', background: '#f3e8ff', color: '#6b21a8', fontSize: '12px', fontWeight: '600', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                Premium
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <StarIconSolid style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
            <span style={{ fontWeight: '500', color: 'var(--text)' }}>{template.rating || '0.0'}</span>
            <span>({template.rating_count || 0})</span>
          </div>
          <span>{template.usage_count || 0} uses</span>
          <span style={{ textTransform: 'capitalize' }}>{template.industry}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {template.tags.slice(0, 4).map((tag, i) => (
                <span
                  key={i}
                  style={{
                    padding: '4px 10px',
                    background: 'var(--hover-bg)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    borderRadius: '6px'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginLeft: '16px' }}>
            <button
              onClick={() => onPreview(template)}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text)',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <EyeIcon style={{ width: '16px', height: '16px' }} />
              Preview
            </button>
            <button
              onClick={() => onUse(template)}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                background: 'var(--primary)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <RocketLaunchIcon style={{ width: '16px', height: '16px' }} />
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatePreviewModal({ template, onClose, onUse }) {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPages();
  }, [template.id]);

  const loadPages = async () => {
    try {
      const res = await fetch(`/api/v1/builder/templates/${template.id}/pages`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch (err) {
      console.error('Error loading template pages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
              {template.name}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {template.description}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <XMarkIcon style={{ width: '24px', height: '24px', color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Preview Images */}
          {template.preview_images && template.preview_images.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '16px', fontSize: '16px' }}>
                Preview
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                {template.preview_images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Preview ${i + 1}`}
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pages */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '16px', fontSize: '16px' }}>
              Included Pages ({pages.length})
            </h3>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {pages.map(page => (
                  <div
                    key={page.id}
                    style={{
                      padding: '16px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: 'var(--hover-bg)'
                    }}
                  >
                    <p style={{ fontWeight: '500', color: 'var(--text)', marginBottom: '4px', fontSize: '14px' }}>
                      {page.name}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      /{page.slug}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Industry</p>
              <p style={{ fontWeight: '500', color: 'var(--text)', textTransform: 'capitalize' }}>
                {template.industry}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Category</p>
              <p style={{ fontWeight: '500', color: 'var(--text)', textTransform: 'capitalize' }}>
                {template.category}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Rating</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StarIconSolid style={{ width: '18px', height: '18px', color: '#fbbf24' }} />
                <span style={{ fontWeight: '500', color: 'var(--text)' }}>
                  {template.rating || '0.0'}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  ({template.rating_count || 0})
                </span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Usage</p>
              <p style={{ fontWeight: '500', color: 'var(--text)' }}>
                {template.usage_count || 0} times
              </p>
            </div>
          </div>

          {/* Demo Link */}
          {template.demo_url && (
            <div>
              <a
                href={template.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--primary)',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                View Live Demo
                <EyeIcon style={{ width: '18px', height: '18px' }} />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderTop: '1px solid var(--border)'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text)',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              onUse(template);
              onClose();
            }}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RocketLaunchIcon style={{ width: '18px', height: '18px' }} />
            Use This Template
          </button>
        </div>
      </div>
    </div>
  );
}
