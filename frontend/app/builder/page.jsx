'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import UnifiedBuilder from '@/components/builder/UnifiedBuilder';
import {
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function BuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [projectType, setProjectType] = useState('page'); // page | site | funnel

  useEffect(() => {
    // Check URL params for project type
    const type = searchParams.get('type');
    if (type && ['page', 'site', 'funnel'].includes(type)) {
      setProjectType(type);
    }
    loadProjects();
  }, [searchParams]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      // Load all project types
      const [pagesRes, sitesRes, funnelsRes] = await Promise.all([
        apiFetch('/api/v1/pages').catch(() => ({ pages: [] })),
        apiFetch('/api/v1/builder/sites').catch(() => ({ sites: [] })),
        apiFetch('/api/v1/funnels').catch(() => ({ funnels: [] }))
      ]);

      // Normalize all projects into unified format
      const allProjects = [
        ...(pagesRes.pages || []).map(p => ({
          ...p,
          projectType: 'page',
          displayName: p.title,
          displayStatus: p.status
        })),
        ...(sitesRes.sites || []).map(s => ({
          ...s,
          projectType: 'site',
          displayName: s.name,
          displayStatus: s.status
        })),
        ...(funnelsRes.funnels || []).map(f => ({
          ...f,
          projectType: 'funnel',
          displayName: f.name,
          displayStatus: f.status
        }))
      ];

      setProjects(allProjects);

      // If no projects, show template selection
      if (allProjects.length === 0) {
        setShowTemplateSelection(true);
        await loadPopularTemplates();
      } else {
        // Load first project of current type
        const firstOfType = allProjects.find(p => p.projectType === projectType);
        if (firstOfType) {
          await loadProject(firstOfType.id, firstOfType.projectType);
        } else {
          // No project of current type, show template selection
          setShowTemplateSelection(true);
          await loadPopularTemplates();
        }
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPopularTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const endpoint = projectType === 'funnel' 
        ? '/api/v1/funnel-templates?limit=12'
        : '/api/v1/builder/templates/popular?limit=12';
      
      const res = await apiFetch(endpoint);
      setTemplates(res.templates || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadProject = async (projectId, type) => {
    try {
      let endpoint;
      switch (type) {
        case 'page':
          endpoint = `/api/v1/pages/${projectId}`;
          break;
        case 'site':
          endpoint = `/api/v1/builder/sites/${projectId}`;
          break;
        case 'funnel':
          endpoint = `/api/v1/funnels/${projectId}`;
          break;
        default:
          throw new Error('Invalid project type');
      }

      const res = await apiFetch(endpoint);
      setCurrentProject({
        ...res.page || res.site || res.funnel,
        projectType: type
      });
    } catch (err) {
      console.error('Error loading project:', err);
      toast.error('Failed to load project');
    }
  };

  const handleUseTemplate = async (template) => {
    const projectName = prompt(`Enter a name for your new ${projectType}:`);
    if (!projectName) return;

    try {
      let endpoint, body;
      
      if (projectType === 'funnel') {
        endpoint = `/api/v1/funnel-templates/${template.id}/use`;
        body = { name: projectName };
      } else if (projectType === 'site') {
        endpoint = `/api/v1/builder/templates/${template.id}/use`;
        body = { siteName: projectName, customizeName: true };
      } else {
        endpoint = `/api/v1/builder/templates/${template.id}/use`;
        body = { title: projectName };
      }

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      toast.success(`${projectType.charAt(0).toUpperCase() + projectType.slice(1)} created successfully!`);
      setShowTemplateSelection(false);
      await loadProjects();
    } catch (err) {
      console.error('Error using template:', err);
      toast.error('Failed to create from template');
    }
  };

  const handleCreateBlank = async () => {
    const projectName = prompt(`Enter a name for your new ${projectType}:`);
    if (!projectName) return;

    try {
      let endpoint, body;
      
      switch (projectType) {
        case 'page':
          endpoint = '/api/v1/pages';
          body = { title: projectName, pageType: 'page' };
          break;
        case 'site':
          endpoint = '/api/v1/builder/sites';
          body = { name: projectName, description: 'A new website' };
          break;
        case 'funnel':
          endpoint = '/api/v1/funnels';
          body = { name: projectName, description: '' };
          break;
        default:
          throw new Error('Invalid project type');
      }

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      toast.success(`${projectType.charAt(0).toUpperCase() + projectType.slice(1)} created successfully!`);
      setShowTemplateSelection(false);
      await loadProjects();
    } catch (err) {
      console.error('Error creating project:', err);
      toast.error('Failed to create project');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading builder...</p>
        </div>
      </div>
    );
  }

  // Show template selection for new users
  if (showTemplateSelection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Welcome to Unified Builder
              </h1>
              <p className="text-lg text-gray-600">
                Create pages, websites, or funnels - all in one place
              </p>
            </div>

            {/* Project Type Selector */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => setProjectType('page')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  projectType === 'page'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500'
                }`}
              >
                📄 Single Page
              </button>
              <button
                onClick={() => setProjectType('site')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  projectType === 'site'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500'
                }`}
              >
                🌐 Website
              </button>
              <button
                onClick={() => setProjectType('funnel')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  projectType === 'funnel'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500'
                }`}
              >
                🔗 Funnel
              </button>
            </div>

            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={handleCreateBlank}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-600 font-medium flex items-center gap-2 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Start from Scratch
              </button>
              <button
                onClick={() => loadPopularTemplates()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Browse Templates
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-6">
            <SparklesIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Popular {projectType.charAt(0).toUpperCase() + projectType.slice(1)} Templates
            </h2>
          </div>

          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No templates available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
                  onClick={() => handleUseTemplate(template)}
                >
                  <div className="relative h-48 bg-gray-200 overflow-hidden group">
                    {template.thumbnail_url ? (
                      <img
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-5xl">
                        {projectType === 'funnel' ? '🔗' : projectType === 'site' ? '🌐' : '📄'}
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
                        <RocketLaunchIcon className="w-5 h-5" />
                        Use Template
                      </button>
                    </div>

                    {template.is_featured && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {template.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="capitalize">{template.industry || template.category || 'General'}</span>
                      <span>{template.usage_count || 0} uses</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main unified builder interface
  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Projects Found</h2>
          <p className="text-gray-600 mb-6">Create your first project to get started</p>
          <button
            onClick={() => setShowTemplateSelection(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <UnifiedBuilder
      project={currentProject}
      projects={projects}
      onProjectChange={(projectId, type) => loadProject(projectId, type)}
      onProjectsReload={loadProjects}
      onBack={() => router.push('/')}
    />
  );
}
