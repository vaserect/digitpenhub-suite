'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { SkeletonRows } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import Tooltip from '../ui/Tooltip';

/**
 * CRM Email Integration Component
 * Manages email accounts, templates, and email sending
 */
export default function EmailIntegration({ contactId, companyId, dealId, onEmailSent }) {
  const [view, setView] = useState('inbox'); // inbox, compose, templates, accounts
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [emails, setEmails] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Compose form state
  const [composeForm, setComposeForm] = useState({
    accountId: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    bodyHtml: '',
    templateId: '',
    variables: {},
    scheduledAt: ''
  });

  // Account form state
  const [accountForm, setAccountForm] = useState({
    provider: 'gmail',
    emailAddress: '',
    displayName: '',
    accessToken: '',
    refreshToken: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    syncEnabled: true,
    autoCreateContacts: true,
    autoLogEmails: true,
    signature: ''
  });

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    subject: '',
    bodyHtml: '',
    variables: []
  });

  useEffect(() => {
    loadData();
  }, [view, contactId, companyId, dealId]);

  async function loadData() {
    setLoading(true);
    try {
      if (view === 'inbox') {
        await loadEmails();
      } else if (view === 'templates') {
        await loadTemplates();
      } else if (view === 'accounts') {
        await loadAccounts();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function loadAccounts() {
    const data = await apiFetch('/api/v1/crm/email/accounts');
    setAccounts(data.accounts || []);
  }

  async function loadEmails() {
    let endpoint = '/api/v1/crm/email';
    if (contactId) endpoint = `/api/v1/crm/email/contacts/${contactId}`;
    else if (companyId) endpoint = `/api/v1/crm/email/companies/${companyId}`;
    else if (dealId) endpoint = `/api/v1/crm/email/deals/${dealId}`;

    const data = await apiFetch(endpoint);
    setEmails(data.emails || []);
  }

  async function loadTemplates() {
    const data = await apiFetch('/api/v1/crm/email/templates');
    setTemplates(data.templates || []);
  }

  async function handleConnectAccount(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/crm/email/accounts', {
        method: 'POST',
        body: JSON.stringify(accountForm)
      });
      toast.success('Email account connected');
      setShowAccountModal(false);
      loadAccounts();
      resetAccountForm();
    } catch (error) {
      toast.error(error.message || 'Failed to connect account');
    }
  }

  async function handleDisconnectAccount(accountId) {
    if (!confirm('Disconnect this email account?')) return;
    try {
      await apiFetch(`/api/v1/crm/email/accounts/${accountId}`, { method: 'DELETE' });
      toast.success('Account disconnected');
      loadAccounts();
    } catch (error) {
      toast.error('Failed to disconnect account');
    }
  }

  async function handleSyncAccount(accountId) {
    try {
      await apiFetch(`/api/v1/crm/email/accounts/${accountId}/sync`, {
        method: 'POST',
        body: JSON.stringify({ syncType: 'incremental' })
      });
      toast.success('Email sync started');
    } catch (error) {
      toast.error('Failed to start sync');
    }
  }

  async function handleSendEmail(e) {
    e.preventDefault();
    try {
      const payload = {
        ...composeForm,
        contactId: contactId || null,
        companyId: companyId || null,
        dealId: dealId || null
      };

      await apiFetch('/api/v1/crm/email/send', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      toast.success(composeForm.scheduledAt ? 'Email scheduled' : 'Email sent');
      setShowComposeModal(false);
      resetComposeForm();
      loadEmails();
      if (onEmailSent) onEmailSent();
    } catch (error) {
      toast.error(error.message || 'Failed to send email');
    }
  }

  async function handleCreateTemplate(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/crm/email/templates', {
        method: 'POST',
        body: JSON.stringify(templateForm)
      });
      toast.success('Template created');
      setShowTemplateModal(false);
      loadTemplates();
      resetTemplateForm();
    } catch (error) {
      toast.error('Failed to create template');
    }
  }

  async function handleDeleteTemplate(templateId) {
    if (!confirm('Delete this template?')) return;
    try {
      await apiFetch(`/api/v1/crm/email/templates/${templateId}`, { method: 'DELETE' });
      toast.success('Template deleted');
      loadTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  }

  function handleUseTemplate(template) {
    setComposeForm({
      ...composeForm,
      templateId: template.id,
      subject: template.subject,
      bodyHtml: template.bodyHtml
    });
    setShowComposeModal(true);
  }

  function resetComposeForm() {
    setComposeForm({
      accountId: '',
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      bodyHtml: '',
      templateId: '',
      variables: {},
      scheduledAt: ''
    });
  }

  function resetAccountForm() {
    setAccountForm({
      provider: 'gmail',
      emailAddress: '',
      displayName: '',
      accessToken: '',
      refreshToken: '',
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      syncEnabled: true,
      autoCreateContacts: true,
      autoLogEmails: true,
      signature: ''
    });
  }

  function resetTemplateForm() {
    setTemplateForm({
      name: '',
      description: '',
      category: '',
      subject: '',
      bodyHtml: '',
      variables: []
    });
  }

  return (
    <div className="email-integration">
      {/* Navigation */}
      <div className="email-nav" style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        <button
          className={view === 'inbox' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setView('inbox')}
        >
          📧 Inbox
        </button>
        <button
          className={view === 'templates' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setView('templates')}
        >
          📝 Templates
        </button>
        <button
          className={view === 'accounts' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setView('accounts')}
        >
          ⚙️ Accounts
        </button>
        <div style={{ flex: 1 }} />
        <Button onClick={() => setShowComposeModal(true)}>✉️ Compose</Button>
      </div>

      {/* Inbox View */}
      {view === 'inbox' && (
        <Card>
          {loading ? (
            <SkeletonRows rows={5} />
          ) : emails.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No emails yet"
              description="Send your first email or connect an email account to sync your inbox."
              action={<Button onClick={() => setShowComposeModal(true)}>Compose Email</Button>}
            />
          ) : (
            <div className="email-list">
              {emails.map(email => (
                <div
                  key={email.id}
                  className="email-item"
                  style={{
                    padding: 12,
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: email.isRead ? 'transparent' : 'var(--surface)'
                  }}
                  onClick={() => setSelectedEmail(email)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong>{email.direction === 'inbound' ? email.fromAddress : email.toAddresses.join(', ')}</strong>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(email.sentAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontWeight: email.isRead ? 'normal' : 'bold', marginBottom: 4 }}>
                    {email.subject}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {email.snippet}
                  </div>
                  {email.openCount > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>
                      👁️ Opened {email.openCount} time{email.openCount > 1 ? 's' : ''}
                    </div>
                  )}
                  {email.clickCount > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 2 }}>
                      🖱️ Clicked {email.clickCount} time{email.clickCount > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Templates View */}
      {view === 'templates' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3>Email Templates</h3>
            <Button onClick={() => setShowTemplateModal(true)}>+ New Template</Button>
          </div>
          <Card>
            {loading ? (
              <SkeletonRows rows={5} />
            ) : templates.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No templates yet"
                description="Create reusable email templates to save time."
                action={<Button onClick={() => setShowTemplateModal(true)}>Create Template</Button>}
              />
            ) : (
              <div className="template-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {templates.map(template => (
                  <Card key={template.id} style={{ padding: 16 }}>
                    <h4 style={{ marginBottom: 8 }}>{template.name}</h4>
                    {template.description && (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                        {template.description}
                      </p>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                      Subject: {template.subject}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="sm" onClick={() => handleUseTemplate(template)}>Use</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(template.id)}>Delete</Button>
                    </div>
                    {template.usageCount > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                        Used {template.usageCount} time{template.usageCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Accounts View */}
      {view === 'accounts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3>Email Accounts</h3>
            <Button onClick={() => setShowAccountModal(true)}>+ Connect Account</Button>
          </div>
          <Card>
            {loading ? (
              <SkeletonRows rows={3} />
            ) : accounts.length === 0 ? (
              <EmptyState
                icon="📧"
                title="No email accounts connected"
                description="Connect Gmail, Outlook, or SMTP to send and sync emails."
                action={<Button onClick={() => setShowAccountModal(true)}>Connect Account</Button>}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {accounts.map(account => (
                  <div
                    key={account.id}
                    style={{
                      padding: 16,
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {account.emailAddress}
                        {account.isDefault && (
                          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--success)' }}>DEFAULT</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {account.provider.toUpperCase()} • 
                        {account.syncEnabled ? ' Sync enabled' : ' Sync disabled'} •
                        Last sync: {account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString() : 'Never'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Tooltip label="Sync emails now">
                        <Button size="sm" variant="secondary" onClick={() => handleSyncAccount(account.id)}>
                          🔄 Sync
                        </Button>
                      </Tooltip>
                      <Button size="sm" variant="danger" onClick={() => handleDisconnectAccount(account.id)}>
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Compose Email Modal */}
      <Modal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        title="Compose Email"
        wide
      >
        <form onSubmit={handleSendEmail}>
          <div className="field">
            <label className="field-label">To *</label>
            <input
              className="field-input"
              type="email"
              value={composeForm.to}
              onChange={e => setComposeForm({ ...composeForm, to: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Subject *</label>
            <input
              className="field-input"
              value={composeForm.subject}
              onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Message *</label>
            <textarea
              className="field-input"
              rows={10}
              value={composeForm.bodyHtml}
              onChange={e => setComposeForm({ ...composeForm, bodyHtml: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Schedule (optional)</label>
            <input
              className="field-input"
              type="datetime-local"
              value={composeForm.scheduledAt}
              onChange={e => setComposeForm({ ...composeForm, scheduledAt: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={() => setShowComposeModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {composeForm.scheduledAt ? 'Schedule' : 'Send'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Connect Account Modal */}
      <Modal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title="Connect Email Account"
      >
        <form onSubmit={handleConnectAccount}>
          <div className="field">
            <label className="field-label">Provider *</label>
            <select
              className="field-select"
              value={accountForm.provider}
              onChange={e => setAccountForm({ ...accountForm, provider: e.target.value })}
            >
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
              <option value="smtp">SMTP</option>
            </select>
          </div>

          <div className="field">
            <label className="field-label">Email Address *</label>
            <input
              className="field-input"
              type="email"
              value={accountForm.emailAddress}
              onChange={e => setAccountForm({ ...accountForm, emailAddress: e.target.value })}
              required
            />
          </div>

          {accountForm.provider === 'smtp' && (
            <>
              <div className="field">
                <label className="field-label">SMTP Host *</label>
                <input
                  className="field-input"
                  value={accountForm.smtpHost}
                  onChange={e => setAccountForm({ ...accountForm, smtpHost: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label">SMTP Port *</label>
                <input
                  className="field-input"
                  type="number"
                  value={accountForm.smtpPort}
                  onChange={e => setAccountForm({ ...accountForm, smtpPort: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label">Username *</label>
                <input
                  className="field-input"
                  value={accountForm.smtpUsername}
                  onChange={e => setAccountForm({ ...accountForm, smtpUsername: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field-label">Password *</label>
                <input
                  className="field-input"
                  type="password"
                  value={accountForm.smtpPassword}
                  onChange={e => setAccountForm({ ...accountForm, smtpPassword: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="button" variant="secondary" onClick={() => setShowAccountModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Connect</Button>
          </div>
        </form>
      </Modal>

      {/* Create Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Create Email Template"
        wide
      >
        <form onSubmit={handleCreateTemplate}>
          <div className="field">
            <label className="field-label">Template Name *</label>
            <input
              className="field-input"
              value={templateForm.name}
              onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Description</label>
            <input
              className="field-input"
              value={templateForm.description}
              onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })}
            />
          </div>

          <div className="field">
            <label className="field-label">Subject *</label>
            <input
              className="field-input"
              value={templateForm.subject}
              onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Body *</label>
            <textarea
              className="field-input"
              rows={10}
              value={templateForm.bodyHtml}
              onChange={e => setTemplateForm({ ...templateForm, bodyHtml: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={() => setShowTemplateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Template</Button>
          </div>
        </form>
      </Modal>

      <style jsx>{`
        .nav-btn {
          padding: 8px 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .nav-btn:hover {
          background: var(--surface);
        }
        .nav-btn.active {
          border-bottom-color: var(--primary);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
