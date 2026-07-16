'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function TemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPage, setSelectedPage] = useState(0);

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        
        // Fetch template details from new API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/site-templates/${params.id}`, {
          credentials: 'include',
        });
        
        if (!response.ok) throw new Error('Template not found');
        
        const data = await response.json();
        setTemplate(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading template:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    if (params.id) {
      loadTemplate();
    }
  }, [params.id]);

  const handleUseTemplate = async () => {
    try {
      // Track usage
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/site-templates/${params.id}/use`, {
        method: 'POST',
        credentials: 'include',
      });

      // Redirect to builder with template
      router.push(`/builder?template=${params.id}`);
    } catch (err) {
      console.error('Error using template:', err);
      alert('Failed to use template. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading template preview...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'Template does not exist'}</p>
          <button
            onClick={() => router.push('/templates')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Templates
          </button>
        </div>
      </div>
    );
  }

  const currentPage = template.pages?.[selectedPage];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back to Templates
              </button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-lg font-semibold text-gray-900">{template.name}</h1>
                <p className="text-sm text-gray-500 capitalize">{template.category}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Rating */}
              {template.rating > 0 && (
                <div className="text-sm text-gray-600">
                  ⭐ {template.rating.toFixed(1)}
                </div>
              )}

              {/* Premium Badge */}
              {template.is_premium ? (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                  👑 Premium
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  ✓ Free
                </span>
              )}

              <button
                onClick={handleUseTemplate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Preview Area */}
          <div className="lg:col-span-2">
            {/* Page Tabs */}
            {template.pages && template.pages.length > 0 && (
              <div className="bg-white rounded-t-lg border border-gray-200 border-b-0">
                <div className="flex overflow-x-auto">
                  {template.pages.map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPage(idx)}
                      className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        selectedPage === idx
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {page.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Content */}
            <div className="bg-white rounded-b-lg border border-gray-200 overflow-hidden">
              {/* Preview Image/Mockup */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                {template.preview_url ? (
                  <div className="relative aspect-video bg-white rounded-lg shadow-lg overflow-hidden">
                    <Image
                      src={template.preview_url}
                      alt={`${template.name} preview`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="text-6xl mb-4">🎨</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{template.name}</h3>
                        <p className="text-gray-600">{template.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Page Structure */}
              {currentPage && (
                <div className="p-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {currentPage.name} Page Structure
                  </h3>
                  
                  <div className="space-y-3">
                    {currentPage.sections && currentPage.sections.length > 0 ? (
                      currentPage.sections.map((sectionId, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                {idx + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">Section {idx + 1}</div>
                                <div className="text-sm text-gray-500">Component ID: {sectionId}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              Click "Use Template" to customize
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>This page structure will be available when you use the template</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Template Info */}
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">About This Template</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
            </div>

            {/* Features */}
            {template.features && template.features.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
                <ul className="space-y-2">
                  {template.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Color Scheme */}
            {template.color_scheme && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Color Scheme</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(template.color_scheme).map(([name, color]) => (
                    <div key={name} className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                      <div className="text-xs">
                        <div className="font-medium text-gray-900 capitalize">{name}</div>
                        <div className="text-gray-500">{color}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fonts */}
            {template.fonts && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Typography</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Heading:</span>
                    <span className="ml-2 font-medium text-gray-900">{template.fonts.heading}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Body:</span>
                    <span className="ml-2 font-medium text-gray-900">{template.fonts.body}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pages</span>
                  <span className="font-medium text-gray-900">{template.pages?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Times Used</span>
                  <span className="font-medium text-gray-900">{template.usage_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rating</span>
                  <span className="font-medium text-gray-900">
                    {template.rating > 0 ? `⭐ ${template.rating.toFixed(1)}` : 'Not rated yet'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Ready to get started?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use this template to create your website in minutes
              </p>
              <button
                onClick={handleUseTemplate}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}