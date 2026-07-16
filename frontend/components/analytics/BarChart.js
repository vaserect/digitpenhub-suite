'use client';

import { useMemo } from 'react';

export default function BarChart({ 
  data, 
  xKey, 
  yKey, 
  title, 
  color = '#3B82F6',
  height = 300,
  showValues = true,
  horizontal = false
}) {
  const { bars, maxValue, labels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { bars: [], maxValue: 0, labels: [] };
    }

    const values = data.map(d => parseFloat(d[yKey]) || 0);
    const max = Math.max(...values, 1);
    
    const bars = data.map((d, i) => ({
      label: d[xKey],
      value: parseFloat(d[yKey]) || 0,
      percentage: (parseFloat(d[yKey]) || 0) / max * 100,
      index: i
    }));

    const labels = data.map(d => d[xKey]);

    return { bars, maxValue: max, labels };
  }, [data, xKey, yKey]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div className="flex items-center justify-center h-64 text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  if (horizontal) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        
        <div className="space-y-3">
          {bars.map((bar, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium truncate max-w-[200px]">
                  {bar.label}
                </span>
                {showValues && (
                  <span className="text-gray-600 ml-2">
                    {bar.value.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                  style={{
                    width: `${bar.percentage}%`,
                    backgroundColor: color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vertical bar chart
  const barWidth = 100 / bars.length;
  const chartHeight = height - 80;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Chart area */}
        <div className="relative" style={{ height: `${chartHeight}px` }}>
          <div className="absolute inset-0 flex items-end justify-around gap-2">
            {bars.map((bar, i) => (
              <div
                key={i}
                className="relative flex-1 group cursor-pointer"
                style={{ maxWidth: '80px' }}
              >
                {/* Bar */}
                <div
                  className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                  style={{
                    height: `${bar.percentage}%`,
                    backgroundColor: color
                  }}
                >
                  {/* Value label on hover */}
                  {showValues && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {bar.value.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            {[0, 25, 50, 75, 100].map(percent => (
              <div
                key={percent}
                className="absolute w-full border-t border-gray-200"
                style={{ bottom: `${percent}%` }}
              />
            ))}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex items-start justify-around gap-2 mt-4" style={{ height: '60px' }}>
          {bars.map((bar, i) => (
            <div
              key={i}
              className="flex-1 text-center"
              style={{ maxWidth: '80px' }}
            >
              <div className="text-xs text-gray-600 truncate" title={bar.label}>
                {bar.label.length > 10 ? `${bar.label.substring(0, 10)}...` : bar.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Y-axis labels */}
      <div className="flex justify-between text-xs text-gray-600 mt-2">
        <span>0</span>
        <span>{maxValue.toLocaleString()}</span>
      </div>
    </div>
  );
}
