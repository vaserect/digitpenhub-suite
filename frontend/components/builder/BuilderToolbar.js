'use client';

import { useState } from 'react';
import {
  ComputerDesktopIcon,
  DeviceTabletIcon,
  DevicePhoneMobileIcon,
  Square3Stack3DIcon,
  CloudArrowUpIcon,
  RocketLaunchIcon,
  EyeIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon
} from '@heroicons/react/24/outline';
import ResponsiveControls from './ResponsiveControls';

export default function BuilderToolbar({
  currentPage,
  currentSite,
  viewMode,
  onViewModeChange,
  showGrid,
  onToggleGrid,
  onSave,
  onPublish,
  isSaving,
  onLoadPage,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedBlock,
  onUpdateBlock
}) {
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [pages, setPages] = useState([]);

  const loadPages = async () => {
    if (!currentSite) return;
    
    try {
      const res = await fetch(`/api/v1/builder/sites/${currentSite.id}/pages`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch (err) {
      console.error('Error loading pages:', err);
    }
  };

  const handlePageSelectorToggle = () => {
    if (!showPageSelector) {
      loadPages();
    }
    setShowPageSelector(!showPageSelector);
  };

  const viewModes = [
    { id: 'desktop', icon: ComputerDesktopIcon, label: 'Desktop' },
    { id: 'tablet', icon: DeviceTabletIcon, label: 'Tablet' },
    { id: 'mobile', icon: DevicePhoneMobileIcon, label: 'Mobile' }
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section - Page Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={handlePageSelectorToggle}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Square3Stack3DIcon className="w-5 h-5" />
              <span>{currentPage?.title || 'Select Page'}</span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            {/* Page Selector Dropdown */}
            {showPageSelector && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-500 px-2 py-1">
                    Pages in {currentSite?.name}
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {pages.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No pages found
                    </div>
                  ) : (
                    pages.map(page => (
                      <button
                        key={page.id}
                        onClick={() => {
                          onLoadPage(page.id);
                          setShowPageSelector(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          currentPage?.id === page.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{page.title}</div>
                        <div className="text-xs text-gray-500">/{page.slug}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Site Status */}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              currentSite?.status === 'published'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {currentSite?.status || 'draft'}
            </span>
          </div>
        </div>

        {/* Center Section - Responsive Controls */}
        <ResponsiveControls
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          block={selectedBlock}
          onUpdateBlock={onUpdateBlock}
        />

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100 disabled:hover:bg-transparent"
              title="Undo (Ctrl+Z)"
            >
              <ArrowUturnLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100 disabled:hover:bg-transparent"
              title="Redo (Ctrl+Y)"
            >
              <ArrowUturnRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            onClick={onToggleGrid}
            className={`p-2 rounded-lg transition-colors ${
              showGrid
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={showGrid ? 'Hide Grid' : 'Show Grid'}
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>

          {/* Preview */}
          <button
            onClick={() => {
              if (currentPage) {
                window.open(`/p/${currentPage.slug}`, '_blank');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={!currentPage}
          >
            <EyeIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Save */}
          <button
            onClick={onSave}
            disabled={isSaving || !currentPage}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CloudArrowUpIcon className="w-5 h-5" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>

          {/* Publish */}
          <button
            onClick={onPublish}
            disabled={!currentSite}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RocketLaunchIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Publish</span>
          </button>
        </div>
      </div>

      {/* Click outside to close page selector */}
      {showPageSelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPageSelector(false)}
        />
      )}
    </div>
  );
}
