import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for scroll-triggered animations
 * Uses Intersection Observer API to detect when elements enter viewport
 */
export function useScrollAnimation(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true
  } = options;

  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Skip if already triggered and triggerOnce is true
    if (hasTriggered && triggerOnce) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasTriggered(true);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { elementRef, isVisible };
}

/**
 * Apply animation classes based on scroll position
 */
export function getAnimationClasses(animation, isVisible, isHovered = false) {
  if (!animation || animation.type === 'none') {
    return '';
  }

  const classes = [];

  // Handle different trigger types
  switch (animation.trigger) {
    case 'onLoad':
      // Animation plays immediately on page load
      classes.push(`animate-${animation.type}`);
      break;

    case 'onScroll':
      // Animation plays when element scrolls into view
      if (isVisible) {
        classes.push(`animate-${animation.type}`);
      }
      break;

    case 'onHover':
      // Animation plays on hover
      if (isHovered) {
        classes.push(`animate-${animation.type}`);
      } else {
        // Add hover class for CSS-based hover animations
        classes.push(`hover-${animation.type.replace('animate-', '')}`);
      }
      break;

    default:
      classes.push(`animate-${animation.type}`);
  }

  return classes.join(' ');
}

/**
 * Get inline styles for animation
 */
export function getAnimationStyles(animation) {
  if (!animation || animation.type === 'none') {
    return {};
  }

  return {
    animationDuration: `${animation.duration || 600}ms`,
    animationDelay: `${animation.delay || 0}ms`,
    animationTimingFunction: animation.easing || 'ease-out',
    animationFillMode: 'both'
  };
}
