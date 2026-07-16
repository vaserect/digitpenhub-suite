'use client';

import { useMemo } from 'react';

export default function LineChart({ data, xKey, yKey, title, color = '#3B82F6', height = 300 }) {
  const { points, maxValue, minValue, xLabels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], maxValue: 0, minValue: 0, xLabels: [] };
    }

    const values = data.map(d => parseFloat(d[yKey]) || 0);
    const max = Math.max(...values, 0);
    const min = Math.min(...values, 0);
    
    // Add 10% padding to max for better visualization
    const paddedMax = max * 1.1;
    const range = paddedMax - min;

    const chartHeight = height - 60; // Leave space for labels
    const chartWidth = 100; // Percentage
    const pointSpacing = chartWidth / (data.length - 1 || 1);

    const points = data.map((d, i) => {
      const value = parseFloat(d[yKey]) || 0;
      const x = i * pointSpacing;
      const y = range > 0 ? ((paddedMax - value) / range) * chartHeight : chartHeight / 2;
      return { x, y, value, label: d[xKey] };
    });

    // Format x-axis labels (show every nth label to avoid crowding)
    const labelInterval = Math.ceil(data.length / 6);
    const xLabels = data.map((d, i) => {
      if (i % labelInterval === 0 || i === data.length - 1) {
        const date = new Date(d[xKey]);
        return {
          x: i * pointSpacing,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      }
      return null;
    }).filter(Boolean);

    return { points, maxValue: paddedMax, minValue: min, xLabels };
  }, [data, xKey, yKey, height]);

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

  // Create SVG path
  const pathD = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  // Create area fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - 60} L 0 ${height - 60} Z`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      
      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: `${height - 40}px` }}
        >
          {/* Grid lines */}
          <g className="text-gray-200">
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={y * (height - 60) / 100}
                x2="100"
                y2={y * (height - 60) / 100}
                stroke="currentColor"
                strokeWidth="0.2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>

          {/* Area fill */}
          <path
            d={areaD}
            fill={color}
            fillOpacity="0.1"
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r="0.8"
                fill="white"
                stroke={color}
                strokeWidth="0.4"
                vectorEffect="non-scaling-stroke"
              />
              <title>{`${point.label}: ${point.value.toLocaleString()}`}</title>
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="relative h-10 mt-2">
          {xLabels.map((label, i) => (
            <div
              key={i}
              className="absolute text-xs text-gray-600 transform -translate-x-1/2"
              style={{ left: `${label.x}%` }}
            >
              {label.label}
            </div>
          ))}
        </div>
      </div>

      {/* Y-axis labels */}
      <div className="flex justify-between text-xs text-gray-600 mt-2">
        <span>{minValue.toLocaleString()}</span>
        <span>{maxValue.toLocaleString()}</span>
      </div>
    </div>
  );
}
