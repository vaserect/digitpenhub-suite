'use client';

import { useState } from 'react';
import {
  SparklesIcon,
  PlayIcon,
  XMarkIcon,
  ClockIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

/**
 * Animation Builder Component
 * Allows users to add entrance, scroll, and hover animations to blocks
 */
export default function AnimationBuilder({ block, onUpdateBlock, onClose }) {
  const [selectedAnimation, setSelectedAnimation] = useState(
    block?.props?.animation?.type || 'none'
  );
  const [trigger, setTrigger] = useState(
    block?.props?.animation?.trigger || 'onLoad'
  );
  const [duration, setDuration] = useState(
    block?.props?.animation?.duration || 600
  );
  const [delay, setDelay] = useState(
    block?.props?.animation?.delay || 0
  );
  const [easing, setEasing] = useState(
    block?.props?.animation?.easing || 'ease-out'
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Animation presets
  const animations = [
    {
      id: 'none',
      name: 'None',
      description: 'No animation',
      category: 'basic'
    },
    {
      id: 'fade-in',
      name: 'Fade In',
      description: 'Gradually appear',
      category: 'entrance',
      keyframes: 'opacity: 0 → 1'
    },
    {
      id: 'fade-in-up',
      name: 'Fade In Up',
      description: 'Fade in from bottom',
      category: 'entrance',
      keyframes: 'opacity: 0, translateY(20px) → opacity: 1, translateY(0)'
    },
    {
      id: 'fade-in-down',
      name: 'Fade In Down',
      description: 'Fade in from top',
      category: 'entrance',
      keyframes: 'opacity: 0, translateY(-20px) → opacity: 1, translateY(0)'
    },
    {
      id: 'fade-in-left',
      name: 'Fade In Left',
      description: 'Fade in from left',
      category: 'entrance',
      keyframes: 'opacity: 0, translateX(-20px) → opacity: 1, translateX(0)'
    },
    {
      id: 'fade-in-right',
      name: 'Fade In Right',
      description: 'Fade in from right',
      category: 'entrance',
      keyframes: 'opacity: 0, translateX(20px) → opacity: 1, translateX(0)'
    },
    {
      id: 'slide-up',
      name: 'Slide Up',
      description: 'Slide from bottom',
      category: 'entrance',
      keyframes: 'translateY(30px) → translateY(0)'
    },
    {
      id: 'slide-down',
      name: 'Slide Down',
      description: 'Slide from top',
      category: 'entrance',
      keyframes: 'translateY(-30px) → translateY(0)'
    },
    {
      id: 'slide-left',
      name: 'Slide Left',
      description: 'Slide from right',
      category: 'entrance',
      keyframes: 'translateX(30px) → translateX(0)'
    },
    {
      id: 'slide-right',
      name: 'Slide Right',
      description: 'Slide from left',
      category: 'entrance',
      keyframes: 'translateX(-30px) → translateX(0)'
    },
    {
      id: 'zoom-in',
      name: 'Zoom In',
      description: 'Scale up from small',
      category: 'entrance',
      keyframes: 'scale(0.8) → scale(1)'
    },
    {
      id: 'zoom-out',
      name: 'Zoom Out',
      description: 'Scale down from large',
      category: 'entrance',
      keyframes: 'scale(1.2) → scale(1)'
    },
    {
      id: 'bounce-in',
      name: 'Bounce In',
      description: 'Bounce entrance',
      category: 'entrance',
      keyframes: 'scale(0) → scale(1.1) → scale(1)'
    },
    {
      id: 'flip-in-x',
      name: 'Flip In X',
      description: 'Flip horizontally',
      category: 'entrance',
      keyframes: 'rotateX(-90deg) → rotateX(0)'
    },
    {
      id: 'flip-in-y',
      name: 'Flip In Y',
      description: 'Flip vertically',
      category: 'entrance',
      keyframes: 'rotateY(-90deg) → rotateY(0)'
    },
    {
      id: 'rotate-in',
      name: 'Rotate In',
      description: 'Rotate entrance',
      category: 'entrance',
      keyframes: 'rotate(-180deg), scale(0) → rotate(0), scale(1)'
    },
    {
      id: 'blur-in',
      name: 'Blur In',
      description: 'Blur to focus',
      category: 'entrance',
      keyframes: 'filter: blur(10px) → blur(0)'
    },
    {
      id: 'scale-hover',
      name: 'Scale on Hover',
      description: 'Grow on hover',
      category: 'hover',
      keyframes: 'scale(1) → scale(1.05)'
    },
    {
      id: 'lift-hover',
      name: 'Lift on Hover',
      description: 'Lift up on hover',
      category: 'hover',
      keyframes: 'translateY(0) → translateY(-5px)'
    },
    {
      id: 'glow-hover',
      name: 'Glow on Hover',
      description: 'Add glow effect',
      category: 'hover',
      keyframes: 'box-shadow: none → 0 0 20px rgba(59, 130, 246, 0.5)'
    }
  ];

  const triggers = [
    { id: 'onLoad', name: 'On Page Load', icon: BoltIcon },
    { id: 'onScroll', name: 'On Scroll Into View', icon: SparklesIcon },
    { id: 'onHover', name: 'On Hover', icon: PlayIcon }
  ];

  const easingOptions = [
    { id: 'linear', name: 'Linear' },
    { id: 'ease', name: 'Ease' },
    { id: 'ease-in', name: 'Ease In' },
    { id: 'ease-out', name: 'Ease Out' },
    { id: 'ease-in-out', name: 'Ease In Out' },
    { id: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', name: 'Bounce' }
  ];

  const handleApply = () => {
    onUpdateBlock(block.id, {
      props: {
        ...block.props,
        animation: {
          type: selectedAnimation,
          trigger,
          duration,
          delay,
          easing
        }
      }
    });
    onClose();
  };

  const handlePreview = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), duration + delay);
  };

  const categories = [...new Set(animations.map(a => a.category))];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Animation Builder</h2>
              <p className="text-sm text-gray-600">Add life to your content</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Animation Selection */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choose Animation
              </h3>
              
              {categories.map(category => {
                const categoryAnimations = animations.filter(a => a.category === category);
                
                return (
                  <div key={category} className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                      {category} Animations
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {categoryAnimations.map(animation => (
                        <button
                          key={animation.id}
                          onClick={() => setSelectedAnimation(animation.id)}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            selectedAnimation === animation.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-sm text-gray-900 mb-1">
                            {animation.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {animation.description}
                          </div>
                          {animation.keyframes && (
                            <div className="text-xs text-gray-500 mt-2 font-mono">
                              {animation.keyframes}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              {/* Preview */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Preview</h4>
                  <button
                    onClick={handlePreview}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                  >
                    <PlayIcon className="w-3 h-3" />
                    Play
                  </button>
                </div>
                <div className="bg-white rounded-lg p-8 flex items-center justify-center min-h-[120px]">
                  <div
                    className={`w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg ${
                      isPlaying ? `animate-${selectedAnimation}` : ''
                    }`}
                    style={{
                      animationDuration: `${duration}ms`,
                      animationDelay: `${delay}ms`,
                      animationTimingFunction: easing
                    }}
                  />
                </div>
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger
                </label>
                <div className="space-y-2">
                  {triggers.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTrigger(t.id)}
                        className={`w-full flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                          trigger === t.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {t.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration: {duration}ms
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Fast (100ms)</span>
                  <span>Slow (2000ms)</span>
                </div>
              </div>

              {/* Delay */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delay: {delay}ms
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="100"
                  value={delay}
                  onChange={(e) => setDelay(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>No delay</span>
                  <span>2s delay</span>
                </div>
              </div>

              {/* Easing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Easing
                </label>
                <select
                  value={easing}
                  onChange={(e) => setEasing(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {easingOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Apply Animation
          </button>
        </div>
      </div>
    </div>
  );
}
