'use client';

import { useState, useEffect } from 'react';
import { 
  Squares2X2Icon, 
  RectangleStackIcon, 
  PhotoIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import DraggableComponent from './DraggableComponent';

export default function BuilderSidebar({ onAddBlock, currentSite, onSiteChange, sites }) {
  const [activeTab, setActiveTab] = useState('components'); // components, sections, assets
  const [components, setComponents] = useState([]);
  const [sections, setSections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'components') {
      loadComponents();
    } else if (activeTab === 'sections') {
      loadSections();
    }
  }, [activeTab, selectedCategory, searchQuery]);

  const loadComponents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/v1/builder/components?${params}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setComponents(data.components || []);
      }
    } catch (err) {
      console.error('Error loading components:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSections = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/v1/builder/sections?${params}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
      }
    } catch (err) {
      console.error('Error loading sections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const componentCategories = [
    { value: 'all', label: 'All Components' },
    { value: 'hero', label: 'Hero Sections' },
    { value: 'features', label: 'Features' },
    { value: 'cta', label: 'Call to Action' },
    { value: 'testimonials', label: 'Testimonials' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'team', label: 'Team' },
    { value: 'contact', label: 'Contact' },
    { value: 'footer', label: 'Footer' },
    { value: 'navigation', label: 'Navigation' }
  ];

  const tabs = [
    { id: 'components', label: 'Components', icon: Squares2X2Icon },
    { id: 'sections', label: 'Sections', icon: RectangleStackIcon },
    { id: 'assets', label: 'Assets', icon: PhotoIcon }
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Site Selector */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Site
        </label>
        <select
          value={currentSite?.id || ''}
          onChange={(e) => onSiteChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Filter */}
      {(activeTab === 'components' || activeTab === 'sections') && (
        <div className="p-4 border-b border-gray-200">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {componentCategories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === 'components' ? (
          <ComponentsList 
            components={components} 
            onAddBlock={onAddBlock}
          />
        ) : activeTab === 'sections' ? (
          <SectionsList 
            sections={sections}
            onAddBlock={onAddBlock}
          />
        ) : (
          <AssetsList />
        )}
      </div>
    </div>
  );
}

function ComponentsList({ components, onAddBlock }) {
  if (components.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>No components found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {components.map(component => (
        <DraggableComponent
          key={component.id}
          component={component}
          onAddBlock={onAddBlock}
        />
      ))}
    </div>
  );
}

function SectionsList({ sections, onAddBlock }) {
  if (sections.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <RectangleStackIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>No sections found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map(section => (
        <div
          key={section.id}
          className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
          onClick={() => {
            // Add all blocks from section
            if (section.blocks && Array.isArray(section.blocks)) {
              section.blocks.forEach(block => onAddBlock(block.type));
            }
          }}
        >
          {section.thumbnail_url && (
            <img
              src={section.thumbnail_url}
              alt={section.name}
              className="w-full h-40 object-cover rounded mb-2"
            />
          )}
          <h3 className="font-medium text-sm text-gray-900">{section.name}</h3>
          {section.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {section.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{section.category}</span>
            <span className="text-xs text-blue-600">Click to add</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AssetsList() {
  return (
    <div className="text-center py-8 text-gray-500">
      <PhotoIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
      <p>Asset manager coming soon</p>
    </div>
  );
}
