'use client';

import React, { useRef, useEffect } from 'react';

function relTime(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Topbar({ title, subtitle, user, onSignOut, onAccountClick, children,
  notifCount = 0, notifOpen = false, notifList = [], onBellClick, onMarkRead, onMarkAllRead,
  onToggleSidebar, onToggleTheme, theme }) {

  const dropRef = useRef(null);

  useEffect(() => {
    if (!notifOpen) return;
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) onBellClick?.();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen, onBellClick]);

  return (
    <header className="topbar">
      <div className="topbar-start">
        {onToggleSidebar ? (
          <button className="sidebar-toggle" type="button" onClick={onToggleSidebar} aria-label="Toggle navigation">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        ) : null}
        <div className="topbar-copy">
          <div className="topbar-title">{title}</div>
          {subtitle ? <div className="topbar-subtitle">{subtitle}</div> : null}
        </div>
      </div>
      <div className="topbar-actions">
        {children}

        <button type="button" onClick={onToggleTheme} className="ghost-btn theme-toggle-icon" aria-label="Toggle dark mode" style={{ fontSize: '1rem' }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <div ref={dropRef} className="menu-wrap">
          <button type="button" onClick={onBellClick} className="bell-btn" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {notifCount > 0 && <span className="bell-dot">{notifCount > 99 ? '99+' : notifCount}</span>}
          </button>

          {notifOpen && (
            <div className="notif-panel" role="menu">
              <div className="notif-head">
                <span className="notif-head-title">Notifications</span>
                {notifCount > 0 && <button className="notif-mark-all" onClick={onMarkAllRead} type="button">Mark all read</button>}
              </div>

              {notifList.length === 0 ? (
                <div className="notif-empty">No notifications yet — you&apos;re all caught up.</div>
              ) : (
                notifList.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onMarkRead(n.id)}
                    className={["notif-item", n.is_read ? '' : 'unread'].filter(Boolean).join(' ')}
                  >
                    <span className="notif-dot" />
                    <div className="notif-body">
                      <div className="notif-title">{n.title}</div>
                      {n.body && <div className="notif-desc">{n.body}</div>}
                      <div className="notif-time">{relTime(n.created_at)}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button className="ghost-btn topbar-signout" onClick={onSignOut} type="button">Sign out</button>
        <button className="avatar-pill" type="button" onClick={onAccountClick} aria-label="Account & security" style={{ cursor: onAccountClick ? 'pointer' : 'default', border: 'none' }}>
          {user ? user.initials || 'D' : 'D'}
        </button>
      </div>
    </header>
  );
}
