'use client';

import { useState } from 'react';
import { Squares2X2Icon } from '@heroicons/react/24/outline';

/**
 * Draggable Component Card
 * Allows dragging components from sidebar to canvas
 */
export default function DraggableComponent({ component, onAddBlock }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'component',
      componentId: component.id,
      componentType: component.category,
      componentData: component.component_data
    }));

    // Create custom drag image
    const dragImage = e.currentTarget.cloneNode(true);
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(-2deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    // Fallback: click to add
    onAddBlock(component.category);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      {/* Thumbnail */}
      {component.thumbnail_url ? (
        <div className="relative w-full h-32 bg-gray-100 rounded mb-2 overflow-hidden">
          <img
            src={component.thumbnail_url}
            alt={component.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded mb-2 flex items-center justify-center">
          <Squares2X2Icon className="w-12 h-12 text-blue-300" />
        </div>
      )}

      {/* Info */}
      <div>
        <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">
          {component.name}
        </h3>
        {component.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {component.description}
          </p>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 capitalize">
            {component.category}
          </span>
          <span className="text-xs text-blue-600 font-medium">
            Drag or Click
          </span>
        </div>
      </div>

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}
