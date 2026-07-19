'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import UnifiedBuilder to avoid SSR issues
const UnifiedBuilder = dynamic(
  () => import('@/components/builder/UnifiedBuilder'),
  { ssr: false }
);

/**
 * Landing Page Editor Wrapper
 * Uses the UnifiedBuilder with landing-page-specific configuration
 */
function LandingPageEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  const pageId = searchParams.get('id');
  const templateId = searchParams.get('template');

  useEffect(() => {
    if (pageId) {
      loadExistingPage(pageId);
    } else if (templateId) {
      loadTemplate(templateId);
    } else {
      // Start with blank page
      setPageData({
        title: 'Untitled Landing Page',
        page_type: 'landing',
        content: {
          sections: [],
        },
        status: 'draft',
      });
      setLoading(false);
    }
  }, [pageId, templateId]);

  const loadExistingPage = async (id) => {
    try {
      const response = await fetch(`/api/v1/landing-pages/${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPageData(data.data);
      } else {
        console.error('Failed to load landing page');
        router.push('/modules/landing-page-builder');
      }
    } catch (error) {
      console.error('Error loading landing page:', error);
      router.push('/modules/landing-page-builder');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (id) => {
    try {
      const response = await fetch(`/api/v1/builder/templates/${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPageData({
          title: `${data.data.name} - Copy`,
          page_type: 'landing',
          content: data.data.content,
          template_id: id,
          status: 'draft',
        });
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedContent) => {
    try {
      const payload = {
        ...pageData,
        content: updatedContent,
      };

      let response;
      if (pageId) {
        // Update existing page
        response = await fetch(`/api/v1/landing-pages/${pageId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new page
        response = await fetch('/api/v1/landing-pages', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const data = await response.json();
        setPageData(data.data);
        
        // Update URL if this was a new page
        if (!pageId && data.data.id) {
          router.replace(`/modules/landing-page-builder/editor?id=${data.data.id}`);
        }
        
        return { success: true, data: data.data };
      } else {
        return { success: false, error: 'Failed to save' };
      }
    } catch (error) {
      console.error('Error saving landing page:', error);
      return { success: false, error: error.message };
    }
  };

  const handlePublish = async () => {
    if (!pageId) {
      alert('Please save your landing page first');
      return;
    }

    try {
      const response = await fetch(`/api/v1/landing-pages/${pageId}/publish`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPageData(data.data);
        alert('Landing page published successfully!');
      }
    } catch (error) {
      console.error('Error publishing landing page:', error);
      alert('Failed to publish landing page');
    }
  };

  const handleExit = () => {
    if (confirm('Are you sure you want to exit? Unsaved changes will be lost.')) {
      router.push('/modules/landing-page-builder');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-white">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedBuilder
      initialData={pageData}
      mode="landing"
      onSave={handleSave}
      onPublish={handlePublish}
      onExit={handleExit}
      conversionFocused={true}
      enableABTesting={true}
      enableAnalytics={true}
      enableSEO={true}
    />
  );
}

export default function LandingPageEditor() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="mt-4 text-white">Loading editor...</p>
          </div>
        </div>
      }
    >
      <LandingPageEditorContent />
    </Suspense>
  );
}
