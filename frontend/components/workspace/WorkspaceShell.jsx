'use client';

/**
 * WorkspaceShell — consolidated module workspace with tab navigation.
 *
 * Some modules were merged into combined workspaces (e.g. all HR sub-modules
 * live under one "HR" workspace with tabs). This component provides the
 * tabbed shell for those consolidated pages.
 */

import { useRouter, useSearchParams } from 'next/navigation';

// Map of old standalone module slugs → consolidated workspace slug.
// When a user visits an old direct link, they get redirected to the workspace.
export const OLD_SLUG_TO_WORKSPACE = {
  // HR consolidation
  'hr': 'hr',
  'payroll': 'hr',
  'recruitment': 'hr',
  'time-tracking': 'hr',
  // Marketing consolidation
  'email-marketing': 'marketing',
  'sms-marketing': 'marketing',
  'whatsapp-marketing': 'marketing',
  'social-media-scheduler': 'marketing',
  // CRM consolidation
  'crm': 'crm',
  'leads': 'crm',
  'lead-scoring': 'crm',
  // Finance consolidation
  'invoices': 'finance',
  'accounting': 'finance',
  'expenses': 'finance',
};

// Workspaces that have tab navigation and their tabs.
export const TAB_REGISTRY = {
  'hr': [
    { slug: 'hr', label: 'Employees' },
    { slug: 'payroll', label: 'Payroll' },
    { slug: 'recruitment', label: 'Recruitment' },
    { slug: 'time-tracking', label: 'Time' },
  ],
  'marketing': [
    { slug: 'email-marketing', label: 'Email' },
    { slug: 'sms-marketing', label: 'SMS' },
    { slug: 'whatsapp-marketing', label: 'WhatsApp' },
    { slug: 'social-media-scheduler', label: 'Social' },
  ],
  'crm': [
    { slug: 'crm', label: 'Contacts' },
    { slug: 'leads', label: 'Leads' },
    { slug: 'lead-scoring', label: 'Scoring' },
  ],
  'finance': [
    { slug: 'invoices', label: 'Invoices' },
    { slug: 'accounting', label: 'Accounting' },
    { slug: 'expenses', label: 'Expenses' },
  ],
};

/**
 * WorkspaceShell — renders tab navigation above children content.
 */
export default function WorkspaceShell({ slug, goHome, children }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || TAB_REGISTRY[slug]?.[0]?.slug || slug;
  const tabs = TAB_REGISTRY[slug] || [];

  const switchTab = (tabSlug) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', tabSlug);
    router.push(`/${slug}?${params.toString()}`);
  };

  return (
    <div className="workspace-shell">
      {tabs.length > 0 && (
        <div className="workspace-tabs" style={{
          display: 'flex', gap: 4, padding: '12px 16px 0',
          borderBottom: '1px solid var(--border)', overflowX: 'auto',
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.slug}
              onClick={() => switchTab(tab.slug)}
              style={{
                padding: '8px 16px', borderRadius: '8px 8px 0 0',
                fontSize: 13, fontWeight: activeTab === tab.slug ? 700 : 500,
                cursor: 'pointer', border: 'none',
                background: activeTab === tab.slug ? 'var(--accent-bg)' : 'transparent',
                color: activeTab === tab.slug ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.slug ? '2px solid var(--primary)' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      <div className="workspace-content" style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  );
}
