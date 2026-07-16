'use client';

import {
  ArrowLeftIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  DevicePhoneMobileIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  CloudArrowUpIcon,
  RocketLaunchIcon,
  Squares2X2Icon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

/**
 * UnifiedToolbar - Top toolbar for the unified builder
 * Contains navigation, view controls, and action buttons
 */
export default function UnifiedToolbar({
  project,
  currentPage,
  viewMode,
  onViewModeChange,
  showGrid,
  onToggleGrid,
  onSave,
  onPublish,
  isSaving,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onBack
}) {
  const viewModes = [
    { id: 'desktop', icon: ComputerDesktopIcon, label: 'Desktop' },
    { id: 'tablet', icon: DeviceTabletIcon, label: 'Tablet' },
    { id: 'mobile', icon: DevicePhoneMobileIcon, label: 'Mobile' }
  ];

  const getProjectTypeLabel = (type) => {
    switch (type) {
      case 'page': return 'Page';
      case 'site': return 'Website';
      case 'funnel': return 'Funnel';
      default: return 'Project';
    }
  };

  const getStatusBadge = () => {
    const status = project?.displayStatus || project?.status || 'draft';
    const colors = {
      draft: { bg: '#f3f4f6', text: '#374151' },
      live: { bg: '#dcfce7', text: '#166534' },
      published: { bg: '#dcfce7', text: '#166534' }
    };
    const color = colors[status] || colors.draft;

    return (
      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, backgroundColor: color.bg, color: color.text }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left: Back button and breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '14px', fontWeight: 500, color: '#374151', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
            <span style={{ display: window.innerWidth >= 640 ? 'inline' : 'none' }}>Back</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {getProjectTypeLabel(project?.projectType)}
            </span>
            <span style={{ color: '#d1d5db' }}>/</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project?.displayName || project?.name || project?.title || 'Untitled'}
            </span>
            {currentPage && (
              <>
                <span style={{ color: '#d1d5db' }}>/</span>
                <span style={{ fontSize: '14px', color: '#4b5563', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentPage.title || currentPage.name || 'Untitled Page'}
                </span>
              </>
            )}
            {getStatusBadge()}
          </div>
        </div>

        {/* Center: View mode controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Undo/Redo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px' }}>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', color: canUndo ? '#374151' : '#d1d5db', cursor: canUndo ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => { if (canUndo) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Undo (Ctrl+Z)"
            >
              <ArrowUturnLeftIcon style={{ width: '20px', height: '20px' }} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', color: canRedo ? '#374151' : '#d1d5db', cursor: canRedo ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => { if (canRedo) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Redo (Ctrl+Y)"
            >
              <ArrowUturnRightIcon style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
            {viewModes.map(mode => (
              <button
                key={mode.id}
                onClick={() => onViewModeChange(mode.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', backgroundColor: viewMode === mode.id ? '#ffffff' : 'transparent', color: viewMode === mode.id ? '#2563eb' : '#6b7280', border: 'none', cursor: 'pointer', boxShadow: viewMode === mode.id ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { if (viewMode !== mode.id) e.currentTarget.style.color = '#111827'; }}
                onMouseLeave={(e) => { if (viewMode !== mode.id) e.currentTarget.style.color = '#6b7280'; }}
                title={mode.label}
              >
                <mode.icon style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '12px', fontWeight: 500, display: window.innerWidth >= 640 ? 'inline' : 'none' }}>{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Grid Toggle */}
          <button
            onClick={onToggleGrid}
            style={{ padding: '8px', borderRadius: '8px', backgroundColor: showGrid ? '#eff6ff' : 'transparent', color: showGrid ? '#2563eb' : '#6b7280', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseEnter={(e) => { if (!showGrid) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
            onMouseLeave={(e) => { if (!showGrid) e.currentTarget.style.backgroundColor = 'transparent'; }}
            title="Toggle Grid"
          >
            <Squares2X2Icon style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Right: Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onSave}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: '#374151', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.5 : 1, transition: 'background-color 0.2s' }}
            onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <CloudArrowUpIcon style={{ width: '16px', height: '16px' }} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={onPublish}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: '#ffffff', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            <RocketLaunchIcon style={{ width: '16px', height: '16px' }} />
            Publish
          </button>

          <button
            style={{ padding: '8px', color: '#6b7280', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Settings"
          >
            <Cog6ToothIcon style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}