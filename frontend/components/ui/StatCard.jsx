import React from 'react';

export default function StatCard({ label, value, icon, trend, variant = 'default' }) {
  return (
    <div className={['stat-card', variant === 'compact' ? 'stat-card-compact' : ''].filter(Boolean).join(' ')}>
      {icon ? <div className="stat-card-icon" aria-hidden="true">{icon}</div> : null}
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {trend ? (
          <span className={['stat-trend', trend.direction === 'up' ? 'up' : 'down'].join(' ')}>
            {trend.direction === 'up' ? '▲' : '▼'} {trend.value}
          </span>
        ) : null}
      </div>
    </div>
  );
}
