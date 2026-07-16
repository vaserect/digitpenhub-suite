'use client';

import { useState } from 'react';
import {
  ComputerDesktopIcon,
  DeviceTabletIcon,
  DevicePhoneMobileIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

/**
 * Responsive Breakpoint Controls
 * Allows switching between different viewport sizes and managing responsive settings
 */
export default function ResponsiveControls({ 
  viewMode, 
  onViewModeChange,
  block,
  onUpdateBlock 
}) {
  const [showSettings, setShowSettings] = useState(false);

  const breakpoints = [
    { 
      id: 'desktop', 
      icon: ComputerDesktopIcon, 
      label: 'Desktop',
      width: '1920px',
      description: 'Large screens (1920px+)'
    },
    { 
      id: 'tablet', 
      icon: DeviceTabletIcon, 
      label: 'Tablet',
      width: '768px',
      description: 'Tablets (768px - 1024px)'
    },
    { 
      id: 'mobile', 
      icon: DevicePhoneMobileIcon, 
      label: 'Mobile',
      width: '375px',
      description: 'Mobile devices (375px - 767px)'
    }
  ];

  const handleBreakpointChange = (breakpointId) => {
    onViewModeChange(breakpointId);
  };

  const handleResponsiveSetting = (setting, value) => {
    if (!block || !onUpdateBlock) return;

    const responsiveSettings = block.props?.responsive || {};
    
    onUpdateBlock(block.id, {
      props: {
        ...block.props,
        responsive: {
          ...responsiveSettings,
          [viewMode]: {
            ...responsiveSettings[viewMode],
            [setting]: value
          }
        }
      }
    });
  };

  const currentBreakpoint = breakpoints.find(b => b.id === viewMode) || breakpoints[0];
  const Icon = currentBreakpoint.icon;

  return (
    <div className="relative">
      {/* Breakpoint Selector */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {breakpoints.map(breakpoint => {
          const BreakpointIcon = breakpoint.icon;
          return (
            <button
              key={breakpoint.id}
              onClick={() => handleBreakpointChange(breakpoint.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === breakpoint.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={`${breakpoint.label} (${breakpoint.width})`}
            >
              <BreakpointIcon className="w-5 h-5" />
              <span className="text-sm font-medium hidden lg:inline">
                {breakpoint.label}
              </span>
            </button>
          );
        })}

        {/* Settings Button */}
        {block && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-md transition-colors ml-1 ${
              showSettings
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Responsive Settings"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Current Viewport Info */}
      <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs text-gray-600 whitespace-nowrap z-50">
        <Icon className="w-4 h-4 inline mr-1" />
        {currentBreakpoint.description}
      </div>

      {/* Responsive Settings Panel */}
      {showSettings && block && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-1">
              Responsive Settings
            </h3>
            <p className="text-xs text-gray-600">
              Configure how this block appears on {currentBreakpoint.label.toLowerCase()}
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* Visibility Toggle */}
            <div>
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Hide on {currentBreakpoint.label}
                </span>
                <input
                  type="checkbox"
                  checked={block.props?.responsive?.[viewMode]?.hidden || false}
                  onChange={(e) => handleResponsiveSetting('hidden', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>

            {/* Padding */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Padding
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Top"
                  value={block.props?.responsive?.[viewMode]?.paddingTop || ''}
                  onChange={(e) => handleResponsiveSetting('paddingTop', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Bottom"
                  value={block.props?.responsive?.[viewMode]?.paddingBottom || ''}
                  onChange={(e) => handleResponsiveSetting('paddingBottom', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <select
                value={block.props?.responsive?.[viewMode]?.fontSize || ''}
                onChange={(e) => handleResponsiveSetting('fontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Default</option>
                <option value="xs">Extra Small</option>
                <option value="sm">Small</option>
                <option value="base">Base</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
                <option value="2xl">2X Large</option>
              </select>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Alignment
              </label>
              <div className="flex gap-2">
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => handleResponsiveSetting('textAlign', align)}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm capitalize transition-colors ${
                      block.props?.responsive?.[viewMode]?.textAlign === align
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            {/* Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display
              </label>
              <select
                value={block.props?.responsive?.[viewMode]?.display || ''}
                onChange={(e) => handleResponsiveSetting('display', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Default</option>
                <option value="block">Block</option>
                <option value="flex">Flex</option>
                <option value="grid">Grid</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <button
              onClick={() => setShowSettings(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showSettings && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
