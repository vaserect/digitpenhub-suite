import React from 'react';
import StatCard from './StatCard';

// Shared module-page shell — the CRM module is the reference for this layout
// (breadcrumb → header+description → primary action → stat cards → toolbar
// → content). Every module should render through this instead of hand-rolling
// its own .module-head/back-link markup, so the structure can't drift again
// as new modules get added.
//
// `back`: { label, onClick } for the immediate parent level — "Workspace" for
// a module's top-level list view, or the module's own name when a sub-page
// (e.g. a single document/record view) renders its own nested ModulePage.
// Each nesting level supplies its own immediate parent, which is what CRM's
// "← Workspace" pattern does and what gives multi-level modules a real
// breadcrumb trail without a separate crumbs array to keep in sync.
export default function ModulePage({ back, title, description, primaryAction, stats, toolbar, children }) {
  return (
    <div className="panel">
      {back ? <button className="back-link" onClick={back.onClick}>← {back.label}</button> : null}
      <div className="module-head">
        <div>
          <h1>{title}</h1>
          {description ? <p className="module-sub">{description}</p> : null}
        </div>
        {primaryAction || null}
      </div>
      {stats && stats.length > 0 ? (
        <div className="stats-row">
          {stats.map((s, i) => (
            <StatCard key={i} label={s.label} value={s.value} icon={s.icon} trend={s.trend} />
          ))}
        </div>
      ) : null}
      {toolbar ? <div className="toolbar-row">{toolbar}</div> : null}
      {children}
    </div>
  );
}
