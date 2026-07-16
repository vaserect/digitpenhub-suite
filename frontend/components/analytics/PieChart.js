'use client';

import { useMemo } from 'react';

export default function PieChart({ data, labelKey, valueKey, title, colors = null }) {
  const defaultColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ];

  const chartColors = colors || defaultColors;

  const { segments, total, legend } = useMemo(() => {
    if (!data || data.length === 0) {
      return { segments: [], total: 0, legend: [] };
    }

    const total = data.reduce((sum, d) => sum + (parseFloat(d[valueKey]) || 0), 0);
    
    if (total === 0) {
      return { segments: [], total: 0, legend: [] };
    }

    let currentAngle = -90; // Start at top
    
    const segments = data.map((d, i) => {
      const value = parseFloat(d[valueKey]) || 0;
      const percentage = (value / total) * 100;
      const angle = (percentage / 100) * 360;
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      // Calculate path for pie slice
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const path = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
        `Z`
      ].join(' ');

      return {
        path,
        color: chartColors[i % chartColors.length],
        label: d[labelKey],
        value,
        percentage: percentage.toFixed(1)
      };
    });

    const legend = segments.map((s, i) => ({
      color: s.color,
      label: s.label,
      value: s.value,
      percentage: s.percentage
    }));

    return { segments, total, legend };
  }, [data, labelKey, valueKey, chartColors]);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div className="flex items-center justify-center h-64 text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Pie Chart */}
        <div className="flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-64 h-64">
            {segments.map((segment, i) => (
              <g key={i} className="group cursor-pointer">
                <path
                  d={segment.path}
                  fill={segment.color}
                  className="transition-opacity hover:opacity-80"
                >
                  <title>{`${segment.label}: ${segment.value.toLocaleString()} (${segment.percentage}%)`}</title>
                </path>
              </g>
            ))}
            
            {/* Center circle for donut effect (optional) */}
            <circle
              cx="50"
              cy="50"
              r="20"
              fill="white"
              className="pointer-events-none"
            />
            
            {/* Total in center */}
            <text
              x="50"
              y="48"
              textAnchor="middle"
              className="text-xs font-semibold fill-gray-900"
            >
              Total
            </text>
            <text
              x="50"
              y="56"
              textAnchor="middle"
              className="text-sm font-bold fill-gray-900"
            >
              {total.toLocaleString()}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 w-full">
          {legend.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-700 truncate" title={item.label}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-medium text-gray-900">
                  {item.value.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
