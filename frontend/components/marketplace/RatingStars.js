'use client';

import { Star } from 'lucide-react';

export default function RatingStars({ 
  rating, 
  maxRating = 5, 
  size = 20, 
  interactive = false,
  onChange = null,
  showCount = false,
  count = 0
}) {
  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;
        const isHalfFilled = starValue - 0.5 === rating;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(starValue)}
            disabled={!interactive}
            className={`${
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
            } focus:outline-none`}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            {isHalfFilled ? (
              <div className="relative" style={{ width: size, height: size }}>
                <Star
                  size={size}
                  className="absolute text-gray-300"
                  fill="currentColor"
                />
                <div className="absolute overflow-hidden" style={{ width: size / 2 }}>
                  <Star
                    size={size}
                    className="text-yellow-400"
                    fill="currentColor"
                  />
                </div>
              </div>
            ) : (
              <Star
                size={size}
                className={isFilled ? 'text-yellow-400' : 'text-gray-300'}
                fill="currentColor"
              />
            )}
          </button>
        );
      })}
      {showCount && count > 0 && (
        <span className="ml-2 text-sm text-gray-600">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}
