'use client';

import { useState, useEffect } from 'react';
import {
  Squares2X2Icon,
  DocumentTextIcon,
  SparklesIcon,
  PhotoIcon,
  ChevronDownIcon,
  PlusIcon,
  EyeIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

/**
 * UnifiedSidebar - Context-aware sidebar for the unified builder
 * Shows blocks, pages, templates, or assets based on active tab
 */
export default function UnifiedSidebar({
  project,
  projects,
  pages,
  currentPage,
  activeTab,
  onTabChange,
  onProjectChange,
  onPageChange,
  onAddBlock,
  onAddPage,
  onShowConfirm,
  onShowToast
}) {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Load templates when Templates tab is active
  useEffect(() => {
    if (activeTab === 'templates' && templates.length === 0) {
      loadTemplates();
    }
  }, [activeTab]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/v1/builder/templates?limit=20', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleApplyTemplate = async (template) => {
    if (onShowConfirm && !onShowConfirm(`Apply "${template.name}" template? This will replace your current content.`)) {
      return;
    }
    
    try {
      // Get template pages
      const pagesRes = await fetch(`/api/v1/builder/templates/${template.id}/pages`, {
        credentials: 'include'
      });

      if (!pagesRes.ok) {
        throw new Error('Failed to load template pages');
      }

      const pagesData = await pagesRes.json();
      const templatePages = pagesData.pages || [];

      if (templatePages.length === 0) {
        if (onShowToast) onShowToast('This template has no pages to apply.', 'error');
        return;
      }

      // Apply template based on project type
      if (project.projectType === 'page') {
        // For single page projects, apply first template page
        const firstPage = templatePages[0];
        
        const res = await fetch(`/api/v1/pages/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: firstPage.name,
            blocks: firstPage.blocks || [],
            meta_description: firstPage.meta_description,
            og_image: firstPage.og_image
          })
        });

        if (res.ok) {
          if (onShowToast) onShowToast(`Template applied! Page updated with "${firstPage.name}" content.`, 'success');
          window.location.reload();
        } else {
          throw new Error('Failed to update page');
        }
      } else if (project.projectType === 'site') {
        // For multi-page sites, create pages from template
        const res = await fetch(`/api/v1/builder/templates/${template.id}/use`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            siteName: project?.displayName || project?.name,
            customizeName: false 
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (onShowToast) onShowToast(`Template applied! Created ${data.pages.length} pages.`, 'success');
          window.location.reload();
        } else {
          throw new Error('Failed to apply template');
        }
      } else {
        if (onShowToast) onShowToast('Template application not supported for this project type yet.', 'error');
      }
    } catch (err) {
      console.error('Error applying template:', err);
      if (onShowToast) onShowToast('Failed to apply template. Please try again.', 'error');
    }
  };

  // Block types organized by category
  const blockCategories = {
    'Layout': [
      { type: 'hero', icon: '🎯', label: 'Hero' },
      { type: 'columns', icon: '📊', label: 'Columns' },
      { type: 'spacer', icon: '↕️', label: 'Spacer' },
      { type: 'divider', icon: '➖', label: 'Divider' }
    ],
    'Content': [
      { type: 'text', icon: '📝', label: 'Text' },
      { type: 'image', icon: '🖼️', label: 'Image' },
      { type: 'video', icon: '🎥', label: 'Video' },
      { type: 'gallery', icon: '🎨', label: 'Gallery' }
    ],
    'Interactive': [
      { type: 'form', icon: '📋', label: 'Form' },
      { type: 'cta', icon: '🎯', label: 'Call to Action' },
      { type: 'countdown', icon: '⏱️', label: 'Countdown' },
      { type: 'tabs', icon: '📑', label: 'Tabs' },
      { type: 'accordion', icon: '📂', label: 'Accordion' }
    ],
    'Social Proof': [
      { type: 'testimonials', icon: '💬', label: 'Testimonials' },
      { type: 'stats', icon: '📈', label: 'Stats' },
      { type: 'team', icon: '👥', label: 'Team' },
      { type: 'logo-cloud', icon: '🏢', label: 'Logo Cloud' }
    ],
    'Features': [
      { type: 'features', icon: '✨', label: 'Features' },
      { type: 'pricing', icon: '💰', label: 'Pricing' },
      { type: 'faq', icon: '❓', label: 'FAQ' },
      { type: 'comparison', icon: '⚖️', label: 'Comparison' }
    ],
    'Portfolio': [
      { type: 'portfolio', icon: '🎨', label: 'Portfolio' },
      { type: 'blog', icon: '📰', label: 'Blog' },
      { type: 'timeline', icon: '📅', label: 'Timeline' },
      { type: 'process', icon: '🔄', label: 'Process' }
    ],
    'Navigation': [
      { type: 'nav', icon: '🧭', label: 'Navigation' },
      { type: 'footer', icon: '⬇️', label: 'Footer' }
    ],
    'Marketing': [
      { type: 'newsletter', icon: '📧', label: 'Newsletter' },
      { type: 'social', icon: '🔗', label: 'Social Links' },
      { type: 'contact', icon: '📞', label: 'Contact' },
      { type: 'map', icon: '🗺️', label: 'Map' }
    ],
    'Advanced': [
      { type: 'embed', icon: '🔌', label: 'Embed Code' }
    ]
  };

  const tabs = [
    { id: 'blocks', icon: Squares2X2Icon, label: 'Blocks' },
    { id: 'pages', icon: DocumentTextIcon, label: 'Pages' },
    { id: 'templates', icon: SparklesIcon, label: 'Templates' },
    { id: 'assets', icon: PhotoIcon, label: 'Assets' }
  ];

  const getProjectTypeIcon = (type) => {
    switch (type) {
      case 'page': return '📄';
      case 'site': return '🌐';
      case 'funnel': return '🔗';
      default: return '📄';
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{ width: '320px', backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        {/* Project Selector */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontSize: '20px' }}>{getProjectTypeIcon(project?.projectType)}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project?.displayName || project?.name || project?.title || 'Untitled'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>
                    {project?.projectType || 'page'}
                  </div>
                </div>
              </div>
              <ChevronDownIcon style={{ width: '16px', height: '16px', color: '#9ca3af', flexShrink: 0 }} />
            </button>

            {/* Project Dropdown */}
            {showProjectDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 50, maxHeight: '384px', overflowY: 'auto' }}>
                {['page', 'site', 'funnel'].map(type => {
                  const projectsOfType = projects.filter(p => p.projectType === type);
                  if (projectsOfType.length === 0) return null;

                  return (
                    <div key={type} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f9fafb' }}>
                        {type}s
                      </div>
                      {projectsOfType.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            onProjectChange(p.id, p.projectType);
                            setShowProjectDropdown(false);
                          }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: p.id === project?.id ? '#eff6ff' : 'transparent', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = p.id === project?.id ? '#eff6ff' : 'transparent'}
                        >
                          <span style={{ fontSize: '18px' }}>{getProjectTypeIcon(p.projectType)}</span>
                          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.displayName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>
                              {p.displayStatus}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '12px', fontSize: '14px', fontWeight: 500, color: activeTab === tab.id ? '#2563eb' : '#6b7280', borderBottom: activeTab === tab.id ? '2px solid #2563eb' : 'none', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = '#111827'; }}
              onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = '#6b7280'; }}
            >
              <tab.icon style={{ width: '16px', height: '16px' }} />
              <span style={{ display: window.innerWidth >= 640 ? 'inline' : 'none' }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Blocks Tab */}
          {activeTab === 'blocks' && (
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Add Blocks
                </h3>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                  Drag or click to add blocks to your {project?.projectType || 'page'}
                </p>
              </div>

              {Object.entries(blockCategories).map(([category, blocks]) => (
                <div key={category} style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>{category}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {blocks.map(block => (
                      <button
                        key={block.type}
                        onClick={() => onAddBlock(block.type)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s, transform 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.querySelector('span').style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.querySelector('span').style.transform = 'scale(1)'; }}
                      >
                        <span style={{ fontSize: '24px', transition: 'transform 0.2s' }}>
                          {block.icon}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#374151', textAlign: 'center' }}>
                          {block.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {project?.projectType === 'funnel' ? 'Funnel Steps' : 'Pages'}
                </h3>
                <button 
                  onClick={onAddPage}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  <PlusIcon style={{ width: '16px', height: '16px' }} />
                  Add {project?.projectType === 'funnel' ? 'Step' : 'Page'}
                </button>
              </div>

              {pages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    No {project?.projectType === 'funnel' ? 'steps' : 'pages'} yet
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pages.map((page, index) => (
                    <button
                      key={page.id}
                      onClick={() => onPageChange(page.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', backgroundColor: currentPage?.id === page.id ? '#eff6ff' : '#f9fafb', border: currentPage?.id === page.id ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => { if (currentPage?.id !== page.id) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                      onMouseLeave={(e) => { if (currentPage?.id !== page.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    >
                      <div style={{ flexShrink: 0, width: '32px', height: '32px', backgroundColor: '#ffffff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {page.title || page.name || `Page ${index + 1}`}
                        </div>
                        {page.stepType && (
                          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>
                            {page.stepType}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Templates
                </h3>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                  Browse and apply professional templates
                </p>
                <button 
                  onClick={loadTemplates}
                  disabled={loadingTemplates}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', fontWeight: 500, color: '#2563eb', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: loadingTemplates ? 'not-allowed' : 'pointer', opacity: loadingTemplates ? 0.6 : 1 }}
                >
                  {loadingTemplates ? 'Loading...' : 'Refresh Templates'}
                </button>
              </div>

              {loadingTemplates ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <SparklesIcon style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <SparklesIcon style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>No templates available</p>
                  <button 
                    onClick={loadTemplates}
                    style={{ padding: '6px 12px', fontSize: '13px', color: '#2563eb', backgroundColor: 'transparent', border: '1px solid #2563eb', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', transition: 'box-shadow 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                    >
                      {/* Template Thumbnail */}
                      {template.thumbnail_url && (
                        <div style={{ position: 'relative', width: '100%', height: '120px', backgroundColor: '#f3f4f6' }}>
                          <img 
                            src={template.thumbnail_url} 
                            alt={template.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {template.is_featured && (
                            <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: 'rgba(251, 191, 36, 0.9)', borderRadius: '4px' }}>
                              <StarIconSolid style={{ width: '12px', height: '12px', color: '#ffffff' }} />
                              <span style={{ fontSize: '10px', fontWeight: 600, color: '#ffffff' }}>Featured</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Template Info */}
                      <div style={{ padding: '12px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                          {template.name}
                        </h4>
                        {template.description && (
                          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {template.description}
                          </p>
                        )}

                        {/* Template Meta */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', fontSize: '11px', color: '#6b7280' }}>
                          {template.category && (
                            <span style={{ padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px', textTransform: 'capitalize' }}>
                              {template.category}
                            </span>
                          )}
                          {template.rating && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <StarIconSolid style={{ width: '12px', height: '12px', color: '#fbbf24' }} />
                              <span>{template.rating}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              // Open preview in new tab using existing route
                              const previewUrl = `/templates/preview/${template.id}`;
                              window.open(previewUrl, '_blank');
                            }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, color: '#6b7280', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#111827'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.color = '#6b7280'; }}
                          >
                            <EyeIcon style={{ width: '14px', height: '14px' }} />
                            Preview
                          </button>
                          <button
                            onClick={() => handleApplyTemplate(template)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, color: '#ffffff', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                          >
                            <RocketLaunchIcon style={{ width: '14px', height: '14px' }} />
                            Use
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Assets
                </h3>
                <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  <PlusIcon style={{ width: '16px', height: '16px' }} />
                  Upload Asset
                </button>
              </div>
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <PhotoIcon style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '14px', color: '#6b7280' }}>Asset manager coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
