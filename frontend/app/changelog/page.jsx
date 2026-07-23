'use client';

import { useState, useEffect } from 'react';

// This changelog is derived from the SESSION_REPORT.md and git log.
// In production, this data would come from an API endpoint or a CMS.
const RELEASES = [
  {
    version: '0.1.0',
    date: 'July 22, 2026',
    tag: 'phase0-billing-upgrade',
    changes: [
      { category: 'Security', items: [
        'Security headers: HSTS, CSP, X-Frame-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy deployed',
        'CyberPanel admin port 7080 restricted to localhost',
        'Fail2Ban expanded to 4 jails (sshd, nginx-http-auth, postfix, dovecot)',
        'Logout now properly revokes server-side sessions',
        'Database passwords removed from PM2 config, .env files locked to 640',
        'Old backup placeholder secrets cleaned from project directory',
        'MariaDB bind-address configured for localhost-only (pending restart)',
      ]},
      { category: 'Infrastructure', items: [
        'PM2 memory limits increased: API 300M→512M, Web 500M→1G',
        '8 composite database indexes added for analytics query performance',
        '34 frontend modules converted to lazy-loaded code splitting',
        'Netdata v2.10.4 installed with 44 collectors and 2,958 charts',
        'Netdata claimed to Netdata Cloud for remote monitoring',
        'Sentry DSN configured and verified — backend + frontend error tracking live',
      ]},
      { category: 'Backups & DR', items: [
        'Automated daily database and application backups at 03:00 UTC',
        '30-day retention with automatic rotation',
        'Restore script supporting --all, --db-latest, --app, --uploads, --config',
        '5 disaster recovery scenarios documented',
        '3 database migrations applied (209-211)',
      ]},
      { category: 'Analytics & Dashboard', items: [
        'Executive command center rebuilt with 6 KPI cards',
        '4 new dashboard widgets: MoM growth, lead conversion, task completion, revenue sparkline',
        'New analytics endpoints: /growth, /leads/conversion, /tasks/completion, /revenue/sparkline',
        'Activity feed and module usage grid in command center',
      ]},
      { category: 'AI & Enterprise', items: [
        '6 AI workflow templates with variable interpolation (social, email, blog, product, PR, proposal)',
        'AI workflow generation endpoint routing through 5-provider fallback chain',
        'Enterprise integration directory: 15 providers across 9 categories',
        'Enterprise integration registry with connection status tracking',
      ]},
      { category: 'Platform', items: [
        'White-label module with staged 6-step onboarding UI and live CSS variable injection',
        'WorkspaceShell tab navigation for consolidated modules',
        '1-click onboarding template cards on workspace home',
        'Help overlay with 7 keyboard shortcuts activated via ? key',
        'Content management table migration (migration 209)',
        'Enhanced starter content seeding with brand kit and coupon',
      ]},
      { category: 'UX', items: [
        'Empty states redesigned with 7 SVG icons and hover animations',
        'Skeleton loaders: 3 variants (Rows, Card, Table)',
        'Premium button micro-interactions with radial gradient overlay',
        'Staggered list entry animations',
        'Stat cards with hover lift and primary border highlight',
        'Keyboard shortcuts: Cmd+K, Cmd+B, Cmd+,, ?, Esc',
      ]},
    ],
  },
  {
    version: '0.0.1',
    date: 'July 17, 2026',
    tag: 'initial',
    changes: [
      { category: 'Platform Launch', items: [
        'Initial Digitpen Hub Suite release',
        '302 business modules across 21 categories',
        'CRM, invoicing, email marketing, HR, project management, AI tools',
        'Flutterwave and Paystack payment gateway integration',
        'Free, Starter (₦9,900/mo), Growth (₦29,900/mo), Business (₦79,900/mo) plans',
      ]},
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Changelog</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>
        See what's new, fixed, and improved in each release of Digitpen Hub Suite.
      </p>

      {RELEASES.map((release, ri) => (
        <div key={ri} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{release.version}</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{release.date}</span>
            {release.tag && (
              <code style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--accent-bg)', color: 'var(--text-muted)' }}>
                {release.tag}
              </code>
            )}
          </div>

          {release.changes.map((section, si) => (
            <div key={si} style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 6 }}>
                {section.category}
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {section.items.map((item, ii) => (
                  <li key={ii} style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4, lineHeight: 1.5 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
