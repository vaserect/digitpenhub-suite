'use client';

import { useState } from 'react';
import {
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function BuilderCanvas({
  blocks,
  selectedBlock,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  viewMode,
  showGrid
}) {
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

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

  const handleDragStart = (e, blockId) => {
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, blockId) => {
    e.preventDefault();
    if (draggedBlock !== blockId) {
      setDropTarget(blockId);
    }
  };

  const handleDrop = (e, targetBlockId) => {
    e.preventDefault();
    
    if (draggedBlock && draggedBlock !== targetBlockId) {
      const draggedIndex = blocks.findIndex(b => b.id === draggedBlock);
      const targetIndex = blocks.findIndex(b => b.id === targetBlockId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Reorder blocks
        const newBlocks = [...blocks];
        const [removed] = newBlocks.splice(draggedIndex, 1);
        newBlocks.splice(targetIndex, 0, removed);
        
        // Update parent component
        onUpdateBlock(draggedBlock, { order: targetIndex });
      }
    }
    
    setDraggedBlock(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
    setDropTarget(null);
  };

  return (
    <div className={`min-h-full bg-gray-100 p-8 ${showGrid ? 'bg-grid-pattern' : ''}`}>
      <div className={`mx-auto bg-white shadow-lg ${getCanvasWidth()} transition-all duration-300`}>
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <Cog6ToothIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Building Your Page
              </h3>
              <p className="text-gray-600">
                Add components from the sidebar to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {blocks.map((block, index) => (
              <BlockRenderer
                key={block.id}
                block={block}
                isSelected={selectedBlock?.id === block.id}
                isDragging={draggedBlock === block.id}
                isDropTarget={dropTarget === block.id}
                onSelect={() => onSelectBlock(block)}
                onDelete={() => onDeleteBlock(block.id)}
                onDuplicate={() => onDuplicateBlock(block.id)}
                onMoveUp={() => onMoveBlock(block.id, 'up')}
                onMoveDown={() => onMoveBlock(block.id, 'down')}
                onDragStart={(e) => handleDragStart(e, block.id)}
                onDragOver={(e) => handleDragOver(e, block.id)}
                onDrop={(e) => handleDrop(e, block.id)}
                onDragEnd={handleDragEnd}
                canMoveUp={index > 0}
                canMoveDown={index < blocks.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockRenderer({
  block,
  isSelected,
  isDragging,
  isDropTarget,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  canMoveUp,
  canMoveDown
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getBlockContent = () => {
    // Render different block types
    switch (block.type) {
      case 'hero':
        return (
          <div className="relative h-96 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white">
            <div className="text-center px-4">
              <h1 className="text-5xl font-bold mb-4">
                {block.props?.title || 'Hero Title'}
              </h1>
              <p className="text-xl mb-8">
                {block.props?.subtitle || 'Hero subtitle goes here'}
              </p>
              <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100">
                {block.props?.ctaText || 'Get Started'}
              </button>
            </div>
          </div>
        );
      
      case 'features':
        return (
          <div className="py-16 px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              {block.props?.title || 'Features'}
            </h2>
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
            <h2 className="text-3xl font-bold mb-4">
              {block.props?.title || 'Ready to get started?'}
            </h2>
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
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      className={`relative group cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isDragging ? 'opacity-50' : ''} ${
        isDropTarget ? 'ring-2 ring-green-500' : ''
      }`}
    >
      {/* Block Content */}
      {getBlockContent()}

      {/* Hover Overlay */}
      {(isHovered || isSelected) && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-5 pointer-events-none" />
      )}

      {/* Block Controls */}
      {(isHovered || isSelected) && (
        <div className="absolute top-2 right-2 flex gap-1 bg-white rounded-lg shadow-lg p-1">
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
      {(isHovered || isSelected) && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
          {block.type}
        </div>
      )}
    </div>
  );
}
