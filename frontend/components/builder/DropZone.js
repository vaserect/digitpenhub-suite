'use client';

import { useState } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

/**
 * Drop Zone Component
 * Visual indicator for where blocks can be dropped
 */
export default function DropZone({ 
  position, 
  onDrop, 
  isActive = false,
  showAlways = false 
}) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const dropData = JSON.parse(data);
        onDrop(dropData, position);
      }
    } catch (error) {
      console.error('Error parsing drop data:', error);
    }
  };

  // Only show when dragging or if showAlways is true
  if (!isActive && !showAlways && !isOver) {
    return null;
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative transition-all duration-200 ${
        isOver
          ? 'h-32 bg-blue-50 border-2 border-dashed border-blue-400'
          : showAlways
          ? 'h-16 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50'
          : 'h-24 bg-blue-50 border-2 border-dashed border-blue-300'
      }`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <PlusCircleIcon 
            className={`w-8 h-8 mx-auto mb-2 transition-colors ${
              isOver ? 'text-blue-600' : 'text-gray-400'
            }`} 
          />
          <p className={`text-sm font-medium transition-colors ${
            isOver ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {isOver ? 'Drop here' : 'Drop component here'}
          </p>
        </div>
      </div>

      {/* Animated pulse effect when hovering */}
      {isOver && (
        <div className="absolute inset-0 animate-pulse bg-blue-100 opacity-50 rounded" />
      )}
    </div>
  );
}
