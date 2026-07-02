import React from 'react';

export default function TabBar({ tabs, activeKey, onChange, size = 'md' }) {
  return (
    <div className={['tab-bar', size === 'sm' ? 'tab-bar-sm' : ''].filter(Boolean).join(' ')}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={['tab-btn', activeKey === tab.key ? 'active' : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(tab.key)}
        >
          {tab.icon ? <span aria-hidden="true">{tab.icon}</span> : null}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
