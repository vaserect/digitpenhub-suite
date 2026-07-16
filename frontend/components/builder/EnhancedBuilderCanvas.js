'use client';

import { useState, useCallback } from 'react';
import {
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import DropZone from './DropZone';
import { useScrollAnimation, getAnimationClasses, getAnimationStyles } from '@/lib/hooks/useScrollAnimation';

/**
 * Enhanced Builder Canvas with Drag & Drop Support
 * Supports dragging components from sidebar and reordering blocks
 */
export default function EnhancedBuilderCanvas({
  blocks,
  selectedBlock,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onAddBlock,
  viewMode,
  showGrid
}) {
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);

  const getCanvasWidth = () => {
    switch (viewMode) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      default:
        return 'max-w-full';
    }
  };

  // Handle drop from sidebar or reorder
  const handleDrop = useCallback((dropData, position) => {
    if (dropData.type === 'component') {
      // Adding new component from sidebar
      const newBlock = {
        id: `block_${Date.now()}`,
        type: dropData.componentType,
        props: dropData.componentData || {},
        children: []
      };
      
      // Insert at specific position
      onAddBlock(newBlock, position);
    } else if (dropData.type === 'block-reorder' && draggedBlockId) {
      // Reordering existing block
      const fromIndex = blocks.findIndex(b => b.id === draggedBlockId);
      if (fromIndex !== -1 && fromIndex !== position) {
        // Move block to new position
        const newBlocks = [...blocks];
        const [movedBlock] = newBlocks.splice(fromIndex, 1);
        newBlocks.splice(position, 0, movedBlock);
        
        // Update parent with new order
        onUpdateBlock(draggedBlockId, { order: position });
      }
    }
    
    setDraggedBlockId(null);
    setDropTargetIndex(null);
    setIsDraggingFromSidebar(false);
  }, [blocks, draggedBlockId, onAddBlock, onUpdateBlock]);

  // Handle drag over canvas
  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    setIsDraggingFromSidebar(true);
  };

  const handleCanvasDragLeave = () => {
    setIsDraggingFromSidebar(false);
  };

  return (
    <div 
      className={`min-h-full bg-gray-100 p-8 ${showGrid ? 'bg-grid-pattern' : ''}`}
      onDragOver={handleCanvasDragOver}
      onDragLeave={handleCanvasDragLeave}
    >
      <div className={`mx-auto bg-white shadow-lg ${getCanvasWidth()} transition-all duration-300`}>
        {blocks.length === 0 ? (
          <div className="p-8">
            <DropZone
              position={0}
              onDrop={handleDrop}
              isActive={isDraggingFromSidebar}
              showAlways={true}
            />
          </div>
        ) : (
          <div className="space-y-0">
            {/* Drop zone before first block */}
            <DropZone
              position={0}
              onDrop={handleDrop}
              isActive={isDraggingFromSidebar || draggedBlockId !== null}
            />

            {blocks.map((block, index) => (
              <div key={block.id}>
                <EditableBlockRenderer
                  block={block}
                  index={index}
                  isSelected={selectedBlock?.id === block.id}
                  isDragging={draggedBlockId === block.id}
                  onSelect={() => onSelectBlock(block)}
                  onDelete={() => onDeleteBlock(block.id)}
                  onDuplicate={() => onDuplicateBlock(block.id)}
                  onMoveUp={() => onMoveBlock(block.id, 'up')}
                  onMoveDown={() => onMoveBlock(block.id, 'down')}
                  onDragStart={(blockId) => setDraggedBlockId(blockId)}
                  onDragEnd={() => {
                    setDraggedBlockId(null);
                    setDropTargetIndex(null);
                  }}
                  onUpdateBlock={onUpdateBlock}
                  canMoveUp={index > 0}
                  canMoveDown={index < blocks.length - 1}
                />

                {/* Drop zone after each block */}
                <DropZone
                  position={index + 1}
                  onDrop={handleDrop}
                  isActive={isDraggingFromSidebar || draggedBlockId !== null}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Editable Block Renderer with Inline Editing
 */
function EditableBlockRenderer({
  block,
  index,
  isSelected,
  isDragging,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onUpdateBlock,
  canMoveUp,
  canMoveDown
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  
  // Scroll animation support
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: block.props?.animation?.trigger === 'onScroll'
  });

  // Get animation classes and styles
  const animation = block.props?.animation;
  const animationClasses = animation ? getAnimationClasses(animation, isVisible, isHovered) : '';
  const animationStyles = animation ? getAnimationStyles(animation) : {};

  const handleDragStart = (e) => {
    onDragStart(block.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'block-reorder',
      blockId: block.id
    }));
  };

  const handleInlineEdit = (field, value) => {
    onUpdateBlock(block.id, {
      props: {
        ...block.props,
        [field]: value
      }
    });
  };

  const startEditing = (field) => {
    setIsEditing(true);
    setEditingField(field);
  };

  const stopEditing = () => {
    setIsEditing(false);
    setEditingField(null);
  };

  const getBlockContent = () => {
    switch (block.type) {
      case 'hero':
        return (
          <div className="relative h-96 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white">
            <div className="text-center px-4 max-w-4xl">
              {isEditing && editingField === 'title' ? (
                <input
                  type="text"
                  value={block.props?.title || ''}
                  onChange={(e) => handleInlineEdit('title', e.target.value)}
                  onBlur={stopEditing}
                  autoFocus
                  className="text-5xl font-bold mb-4 bg-white/20 text-white px-4 py-2 rounded w-full text-center"
                />
              ) : (
                <h1 
                  className="text-5xl font-bold mb-4 cursor-text hover:bg-white/10 px-4 py-2 rounded transition-colors"
                  onClick={() => startEditing('title')}
                >
                  {block.props?.title || 'Hero Title'}
                </h1>
              )}

              {isEditing && editingField === 'subtitle' ? (
                <textarea
                  value={block.props?.subtitle || ''}
                  onChange={(e) => handleInlineEdit('subtitle', e.target.value)}
                  onBlur={stopEditing}
                  autoFocus
                  rows={2}
                  className="text-xl mb-8 bg-white/20 text-white px-4 py-2 rounded w-full text-center resize-none"
                />
              ) : (
                <p 
                  className="text-xl mb-8 cursor-text hover:bg-white/10 px-4 py-2 rounded transition-colors"
                  onClick={() => startEditing('subtitle')}
                >
                  {block.props?.subtitle || 'Hero subtitle goes here'}
                </p>
              )}

              <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100">
                {block.props?.ctaText || 'Get Started'}
              </button>
            </div>
          </div>
        );
      
      case 'features':
        return (
          <div className="py-16 px-8">
            {isEditing && editingField === 'title' ? (
              <input
                type="text"
                value={block.props?.title || ''}
                onChange={(e) => handleInlineEdit('title', e.target.value)}
                onBlur={stopEditing}
                autoFocus
                className="text-3xl font-bold text-center mb-12 w-full border-2 border-blue-500 px-4 py-2 rounded"
              />
            ) : (
              <h2 
                className="text-3xl font-bold text-center mb-12 cursor-text hover:bg-gray-100 px-4 py-2 rounded transition-colors"
                onClick={() => startEditing('title')}
              >
                {block.props?.title || 'Features'}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Feature {i}</h3>
                  <p className="text-gray-600">Feature description goes here</p>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'cta':
        return (
          <div className="py-16 px-8 bg-blue-600 text-white text-center">
            {isEditing && editingField === 'title' ? (
              <input
                type="text"
                value={block.props?.title || ''}
                onChange={(e) => handleInlineEdit('title', e.target.value)}
                onBlur={stopEditing}
                autoFocus
                className="text-3xl font-bold mb-4 bg-white/20 text-white px-4 py-2 rounded w-full text-center"
              />
            ) : (
              <h2 
                className="text-3xl font-bold mb-4 cursor-text hover:bg-white/10 px-4 py-2 rounded transition-colors"
                onClick={() => startEditing('title')}
              >
                {block.props?.title || 'Ready to get started?'}
              </h2>
            )}
            <p className="text-xl mb-8">
              {block.props?.subtitle || 'Join thousands of satisfied customers'}
            </p>
            <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100">
              {block.props?.ctaText || 'Sign Up Now'}
            </button>
          </div>
        );
      
      case 'testimonials':
        return (
          <div className="py-16 px-8 bg-gray-50">
            <h2 className="text-3xl font-bold text-center mb-12">
              {block.props?.title || 'What Our Customers Say'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[1, 2].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <p className="text-gray-600 mb-4">
                    "This is an amazing product! It has completely transformed our business."
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                    <div>
                      <p className="font-semibold">Customer Name</p>
                      <p className="text-sm text-gray-600">Company</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'pricing':
        return (
          <div className="py-16 px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              {block.props?.title || 'Pricing Plans'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {['Basic', 'Pro', 'Enterprise'].map((plan, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-8 text-center hover:shadow-lg transition-shadow">
                  <h3 className="text-2xl font-bold mb-4">{plan}</h3>
                  <p className="text-4xl font-bold mb-6">
                    ${(i + 1) * 29}<span className="text-lg text-gray-600">/mo</span>
                  </p>
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Feature 1
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Feature 2
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Feature 3
                    </li>
                  </ul>
                  <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Choose Plan
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="py-8 px-8 bg-gray-100 text-center">
            <p className="text-gray-600">
              Block Type: <span className="font-semibold">{block.type}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Configure this block in the properties panel
            </p>
          </div>
        );
    }
  };

  return (
    <div
      ref={elementRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      className={`relative group cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isDragging ? 'opacity-50' : ''} ${animationClasses}`}
      style={animationStyles}
    >
      {/* Block Content */}
      {getBlockContent()}

      {/* Hover Overlay */}
      {(isHovered || isSelected) && !isEditing && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-5 pointer-events-none" />
      )}

      {/* Block Controls */}
      {(isHovered || isSelected) && !isEditing && (
        <div className="absolute top-2 right-2 flex gap-1 bg-white rounded-lg shadow-lg p-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              startEditing('title');
            }}
            className="p-2 hover:bg-blue-100 rounded"
            title="Edit Inline"
          >
            <PencilIcon className="w-4 h-4 text-blue-600" />
          </button>
          {canMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="p-2 hover:bg-gray-100 rounded"
              title="Move Up"
            >
              <ArrowUpIcon className="w-4 h-4 text-gray-600" />
            </button>
          )}
          {canMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="p-2 hover:bg-gray-100 rounded"
              title="Move Down"
            >
              <ArrowDownIcon className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-2 hover:bg-gray-100 rounded"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 hover:bg-red-100 rounded"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {/* Block Label */}
      {(isHovered || isSelected) && !isEditing && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <span>{block.type}</span>
          {isEditing && <PencilIcon className="w-3 h-3" />}
        </div>
      )}
    </div>
  );
}
