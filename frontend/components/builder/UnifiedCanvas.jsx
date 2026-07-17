'use client';

import { useState } from 'react';
import BlockRenderer from './BlockRenderer';
import ConfirmDialog from './ConfirmDialog';
import {
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

/**
 * UnifiedCanvas - Responsive canvas for rendering and editing blocks
 * Supports desktop, tablet, and mobile preview modes
 */
export default function UnifiedCanvas({
  blocks,
  selectedBlock,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onAddBlock,
  onReorderBlocks,
  viewMode,
  showGrid
}) {
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Canvas width based on view mode
  const canvasWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  const handleDragStart = (e, blockId, index) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedBlockId) {
      const dragIndex = blocks.findIndex(b => b.id === draggedBlockId);
      if (dragIndex !== -1 && dragIndex !== dropIndex) {
        // Reorder blocks
        const newBlocks = [...blocks];
        const [movedBlock] = newBlocks.splice(dragIndex, 1);
        newBlocks.splice(dropIndex, 0, movedBlock);
        
        // Call the reorder handler
        if (onReorderBlocks) {
          onReorderBlocks(newBlocks);
        }
      }
    }
    
    setDraggedBlockId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
    setDragOverIndex(null);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      padding: '32px', 
      minHeight: '100%',
      background: showGrid 
        ? 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)'
        : '#f9fafb',
      backgroundSize: showGrid ? '20px 20px' : 'auto'
    }}>
      <div 
        style={{ 
          width: canvasWidths[viewMode],
          maxWidth: '100%',
          minHeight: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s'
        }}
      >
        {/* Canvas Content */}
        {blocks.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <PlusIcon style={{ width: '32px', height: '32px', color: '#9ca3af' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                Start Building
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                Add blocks from the sidebar to create your {viewMode === 'mobile' ? 'mobile' : viewMode === 'tablet' ? 'tablet' : 'desktop'} layout
              </p>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {blocks.map((block, index) => (
              <div
                key={block.id}
                draggable
                onDragStart={(e) => handleDragStart(e, block.id, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                style={{ 
                  position: 'relative',
                  outline: selectedBlock?.id === block.id ? '2px solid #2563eb' : 'none',
                  borderTop: dragOverIndex === index ? '2px solid #2563eb' : 'none'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBlock(block);
                }}
              >
                {/* Block Controls Overlay */}
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  zIndex: 10, 
                  display: 'flex', 
                  gap: '4px', 
                  padding: '8px',
                  opacity: selectedBlock?.id === block.id ? 1 : 0,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => { if (selectedBlock?.id !== block.id) e.currentTarget.style.opacity = 0; }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveBlock(block.id, 'up');
                    }}
                    disabled={index === 0}
                    style={{ padding: '6px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.5 : 1 }}
                    onMouseEnter={(e) => { if (index !== 0) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    title="Move Up"
                  >
                    <ArrowUpIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveBlock(block.id, 'down');
                    }}
                    disabled={index === blocks.length - 1}
                    style={{ padding: '6px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: index === blocks.length - 1 ? 'not-allowed' : 'pointer', opacity: index === blocks.length - 1 ? 0.5 : 1 }}
                    onMouseEnter={(e) => { if (index !== blocks.length - 1) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    title="Move Down"
                  >
                    <ArrowDownIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateBlock(block.id);
                    }}
                    style={{ padding: '6px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    title="Duplicate"
                  >
                    <DocumentDuplicateIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(block.id);
                    }}
                    style={{ padding: '6px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    title="Delete"
                  >
                    <TrashIcon style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                  </button>
                </div>

                {/* Block Content */}
                <BlockRenderer
                  block={block}
                  isSelected={selectedBlock?.id === block.id}
                  viewMode={viewMode}
                  onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                />

                {/* Drop Zone Indicator */}
                {dragOverIndex === index && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#2563eb' }} />
                )}
              </div>
            ))}

            {/* Final drop zone */}
            <div
              onDragOver={(e) => handleDragOver(e, blocks.length)}
              onDrop={(e) => handleDrop(e, blocks.length)}
              style={{ 
                height: '32px',
                borderTop: dragOverIndex === blocks.length ? '2px solid #2563eb' : 'none'
              }}
            />
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Block"
        message="Are you sure you want to delete this block? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deleteConfirm) onDeleteBlock(deleteConfirm);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}