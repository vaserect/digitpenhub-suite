'use client';
import { useState, useEffect } from 'react';

const API_SECTIONS = [
  {
    tag: 'Authentication',
    desc: 'User authentication and session management',
    endpoints: [
      { method: 'POST', path: '/api/v1/auth/register', auth: false, desc: 'Create a new account with organization' },
      { method: 'POST', path: '/api/v1/auth/login', auth: false, desc: 'Sign in with email and password' },
      { method: 'POST', path: '/api/v1/auth/logout', auth: true, desc: 'Sign out and revoke session' },
      { method: 'GET', path: '/api/v1/auth/me', auth: true, desc: 'Get current user profile and sessions' },
      { method: 'POST', path: '/api/v1/auth/forgot-password', auth: false, desc: 'Request password reset email' },
      { method: 'POST', path: '/api/v1/auth/reset-password', auth: false, desc: 'Reset password with token' },
      { method: 'POST', path: '/api/v1/auth/verify-mfa', auth: false, desc: 'Verify TOTP 2FA code' },
    ],
  },
  {
    tag: 'CRM',
    desc: 'Contacts, deals, pipelines, and lead management',
    endpoints: [
      { method: 'GET', path: '/api/v1/crm/contacts', auth: true, desc: 'List contacts (paginated)' },
      { method: 'POST', path: '/api/v1/crm/contacts', auth: true, desc: 'Create a new contact' },
      { method: 'GET', path: '/api/v1/crm/companies', auth: true, desc: 'List companies' },
      { method: 'GET', path: '/api/v1/crm/deals', auth: true, desc: 'List deals in pipeline' },
      { method: 'GET', path: '/api/v1/leads', auth: true, desc: 'List lead submissions' },
    ],
  },
  {
    tag: 'Invoicing',
    desc: 'Create, send, and manage invoices',
    endpoints: [
      { method: 'GET', path: '/api/v1/invoices', auth: true, desc: 'List invoices (paginated)' },
      { method: 'POST', path: '/api/v1/invoices', auth: true, desc: 'Create invoice' },
      { method: 'GET', path: '/api/v1/invoices/:id', auth: true, desc: 'Get invoice by ID' },
      { method: 'GET', path: '/api/v1/invoices/shared/:token', auth: false, desc: 'View shared invoice' },
    ],
  },
  {
    tag: 'Billing',
    desc: 'Subscriptions, plans, and payment history',
    endpoints: [
      { method: 'GET', path: '/api/v1/billing/plans', auth: false, desc: 'List available plans and pricing' },
      { method: 'GET', path: '/api/v1/billing/subscription', auth: true, desc: 'Get current subscription' },
      { method: 'GET', path: '/api/v1/billing/payments', auth: true, desc: 'List payment history' },
    ],
  },
  {
    tag: 'Analytics',
    desc: 'Business metrics, KPIs, and reporting',
    endpoints: [
      { method: 'GET', path: '/api/v1/analytics/executive', auth: true, desc: 'Executive command center KPIs' },
      { method: 'GET', path: '/api/v1/analytics/overview', auth: true, desc: 'Dashboard overview stats' },
      { method: 'GET', path: '/api/v1/analytics/activity', auth: true, desc: '30-day activity timeline' },
      { method: 'GET', path: '/api/v1/analytics/growth', auth: true, desc: 'Month-over-month growth rates' },
      { method: 'GET', path: '/api/v1/analytics/leads/conversion', auth: true, desc: 'Lead conversion analytics' },
      { method: 'GET', path: '/api/v1/analytics/tasks/completion', auth: true, desc: 'Task completion rates' },
    ],
  },
  {
    tag: 'AI',
    desc: 'AI Writer, workflows, and assistant',
    endpoints: [
      { method: 'POST', path: '/api/v1/ai-writer/generate', auth: true, desc: 'Generate content with AI' },
      { method: 'GET', path: '/api/v1/ai-workflows/templates', auth: true, desc: 'List AI workflow templates' },
      { method: 'POST', path: '/api/v1/ai-workflows/generate', auth: true, desc: 'Generate from template with variables' },
      { method: 'POST', path: '/api/v1/ai-assistant/ask', auth: true, desc: 'Ask per-module AI assistant' },
    ],
  },
  {
    tag: 'Health',
    desc: 'System health and monitoring',
    endpoints: [
      { method: 'GET', path: '/api/v1/health', auth: false, desc: 'Simple liveness check' },
      { method: 'GET', path: '/api/v1/health/readiness', auth: false, desc: 'Readiness check for load balancers' },
    ],
  },
];

export default function ApiDocsPage() {
  const [activeTag, setActiveTag] = useState('Authentication');

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>API Documentation</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>
        The Digitpen Hub Suite REST API. All authenticated endpoints require a valid <code>dph_session</code> cookie.
      </p>

      {/* Tag navigation */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
        {API_SECTIONS.map(s => (
          <button key={s.tag} onClick={() => setActiveTag(s.tag)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: activeTag === s.tag ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: activeTag === s.tag ? 'var(--accent-bg)' : 'transparent',
              color: activeTag === s.tag ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}>
            {s.tag}
          </button>
        ))}
      </div>

      {/* Active section */}
      {API_SECTIONS.filter(s => s.tag === activeTag).map(section => (
        <div key={section.tag}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{section.tag}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{section.desc}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {section.endpoints.map(ep => (
              <div key={ep.path} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className={`badge-${ep.method === 'GET' ? 'success' : ep.method === 'POST' ? 'info' : 'neutral'}`}
                    style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: ep.method === 'GET' ? 'var(--success-bg)' : ep.method === 'POST' ? 'var(--accent-bg)' : 'var(--surface-muted)',
                      color: ep.method === 'GET' ? 'var(--success)' : ep.method === 'POST' ? 'var(--primary)' : 'var(--text-muted)',
                    }}>
                    {ep.method}
                  </span>
                  <code style={{ fontSize: 13, fontWeight: 600 }}>{ep.path}</code>
                  {ep.auth ? (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>🔒 Auth required</span>
                  ) : (
                    <span style={{ fontSize: 10, color: 'var(--success)' }}>🌐 Public</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{ep.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
