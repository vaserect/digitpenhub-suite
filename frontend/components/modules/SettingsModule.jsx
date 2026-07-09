'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';

const SETTINGS_GROUPS = [
  {
    title: 'Brand & Identity',
    icon: '🎨',
    modules: ['brand-kit'],
    desc: 'Brand colors, logo, fonts, and company identity.',
  },
  {
    title: 'Security & Access',
    icon: '🔐',
    modules: ['password-manager', 'enterprise-sso-saml', 'byok-encryption-key-management', 'identity-verification-kyc'],
    desc: 'SSO, encryption keys, password management, KYC.',
  },
  {
    title: 'Data & Privacy',
    icon: '🛡️',
    modules: ['backup-disaster-recovery-console', 'data-export-portability-suite', 'data-residency-selector', 'customer-facing-audit-trail-export', 'soc2-iso27001-compliance-evidence-dashboard'],
    desc: 'Backup, data residency, export, compliance evidence.',
  },
  {
    title: 'Legal & Compliance',
    icon: '⚖️',
    modules: ['consent-cookie-management', 'terms-policy-version-tracking', 'regional-tax-compliance-packs', 'regulatory-change-monitoring', 'gdpr-ccpa-data-request-center', 'compliance-document-expiry-tracker'],
    desc: 'Cookie consent, terms tracking, tax packs, GDPR.',
  },
  {
    title: 'Localization',
    icon: '🌐',
    modules: ['multi-language-workspace-ui', 'localization-translation-management', 'rtl-language-layout-support', 'localized-payment-methods'],
    desc: 'Multi-language UI, RTL support, payment localization.',
  },
  {
    title: 'Infrastructure',
    icon: '⚙️',
    modules: ['public-status-page'],
    desc: 'Public status page for your workspace.',
  },
];

export default function SettingsModule({ goHome, openModule }) {
  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>⚙️ Settings</h1>
        <p className="module-sub">Configure your workspace — brand, security, localization, compliance, and infrastructure.</p>
      </div>
      <div style={{ display: 'grid', gap: 20 }}>
        {SETTINGS_GROUPS.map((group) => (
          <div key={group.title} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: '1.5rem' }}>{group.icon}</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{group.title}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{group.desc}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {group.modules.map((slug) => (
                <button key={slug}
                  onClick={() => openModule(slug)}
                  style={{
                    padding: '6px 14px', borderRadius: 999, border: '1px solid var(--border)',
                    background: 'var(--surface-muted)', cursor: 'pointer', fontSize: '0.8rem',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {slug.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
