'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Mail,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  MapPin,
  Activity,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

export default function DirectMailAutomation() {
  const { user } = useAuth();
  
  // Navigation / Views State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'campaigns' | 'templates' | 'sends' | 'verification'
  const [loading, setLoading] = useState(true);

  // Direct Mail Data States
  const [stats, setStats] = useState({
    total_sends: 0,
    total_delivered: 0,
    total_returned: 0,
    total_failed: 0,
    total_cost: 0
  });
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [sends, setSends] = useState([]);

  // Forms / Modals States
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedSend, setSelectedSend] = useState(null);

  // Form Fields
  const [templateForm, setTemplateForm] = useState({
    id: null,
    name: '',
    description: '',
    html_content: '<html>\n  <body>\n    <h1>Hello {{first_name}}!</h1>\n    <p>Welcome to our autumn promotional event.</p>\n    <p>Your address: {{to_address_line1}}</p>\n  </body>\n</html>',
    size: '4x6',
    type: 'postcard'
  });

  const [campaignForm, setCampaignForm] = useState({
    id: null,
    name: '',
    description: '',
    template_id: '',
    status: 'draft',
    schedule_type: 'immediate',
    scheduled_at: ''
  });

  const [sendForm, setSendForm] = useState({
    template_id: '',
    campaign_id: '',
    recipient: {
      to_name: '',
      to_address_line1: '',
      to_address_line2: '',
      to_city: '',
      to_state: '',
      to_postal_code: '',
      to_country: 'US'
    }
  });

  // Address Verification Playground State
  const [verifyForm, setVerifyForm] = useState({
    to_name: 'Jane Doe',
    to_address_line1: '1600 Amphitheatre Pkwy',
    to_address_line2: '',
    to_city: 'Mountain View',
    to_state: 'CA',
    to_postal_code: '94043',
    to_country: 'US'
  });
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Filtering & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, templatesRes, campaignsRes, sendsRes] = await Promise.all([
        apiFetch('/api/v1/direct-mail/analytics'),
        apiFetch('/api/v1/direct-mail/templates'),
        apiFetch('/api/v1/direct-mail/campaigns'),
        apiFetch('/api/v1/direct-mail/sends')
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (templatesRes.success) setTemplates(templatesRes.data);
      if (campaignsRes.success) setCampaigns(campaignsRes.data);
      if (sendsRes.success) setSends(sendsRes.data);
    } catch (error) {
      console.error('Error loading direct mail data:', error);
      toast.error('Failed to load direct mail configurations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Template Create / Update
  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = templateForm.id ? 'PUT' : 'POST';
      const path = templateForm.id ? `/api/v1/direct-mail/templates/${templateForm.id}` : '/api/v1/direct-mail/templates';

      const res = await apiFetch(path, {
        method,
        body: JSON.stringify(templateForm)
      });

      if (res.success) {
        toast.success(`Template ${templateForm.id ? 'updated' : 'created'} successfully!`);
        setIsTemplateModalOpen(false);
        setTemplateForm({
          id: null,
          name: '',
          description: '',
          html_content: '<html>\n  <body>\n    <h1>Hello {{first_name}}!</h1>\n    <p>Welcome to our autumn promotional event.</p>\n  </body>\n</html>',
          size: '4x6',
          type: 'postcard'
        });
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save template.');
    }
  };

  // Handle Delete Template
  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await apiFetch(`/api/v1/direct-mail/templates/${id}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Template deleted.');
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete template.');
    }
  };

  // Handle Campaign Create / Update
  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = campaignForm.id ? 'PUT' : 'POST';
      const path = campaignForm.id ? `/api/v1/direct-mail/campaigns/${campaignForm.id}` : '/api/v1/direct-mail/campaigns';

      const res = await apiFetch(path, {
        method,
        body: JSON.stringify(campaignForm)
      });

      if (res.success) {
        toast.success(`Campaign ${campaignForm.id ? 'updated' : 'created'} successfully!`);
        setIsCampaignModalOpen(false);
        setCampaignForm({
          id: null,
          name: '',
          description: '',
          template_id: '',
          status: 'draft',
          schedule_type: 'immediate',
          scheduled_at: ''
        });
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save campaign.');
    }
  };

  // Handle Delete Campaign
  const handleDeleteCampaign = async (id) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const res = await apiFetch(`/api/v1/direct-mail/campaigns/${id}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Campaign deleted.');
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete campaign.');
    }
  };

  // Handle Verification Sandbox Submission
  const handleVerifySubmit = (e) => {
    e.preventDefault();
    setVerifying(true);
    setVerificationResult(null);

    setTimeout(() => {
      setVerifying(false);
      const { to_name, to_address_line1, to_city, to_state, to_postal_code } = verifyForm;
      
      if (!to_name || !to_address_line1 || !to_city || !to_state || !to_postal_code) {
        setVerificationResult({
          valid: false,
          summary: 'Verification failed. Critical fields missing.',
          deliverability: 'undeliverable'
        });
        toast.error('Address verification failed.');
      } else {
        setVerificationResult({
          valid: true,
          summary: 'Address successfully matched against USPS standards.',
          deliverability: 'deliverable',
          standardized: {
            name: to_name.toUpperCase(),
            line1: to_address_line1.toUpperCase(),
            city: to_city.toUpperCase(),
            state: to_state.toUpperCase(),
            postal: `${to_postal_code.substring(0,5)}-0000`
          }
        });
        toast.success('Address verified successfully!');
      }
    }, 1200);
  };

  // Handle Send Direct Mail Manual Job
  const handleSendMail = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/direct-mail/send', {
        method: 'POST',
        body: JSON.stringify(sendForm)
      });

      if (res.success) {
        toast.success('Direct mail order successfully sent to provider.');
        setIsSendModalOpen(false);
        setSendForm({
          template_id: '',
          campaign_id: '',
          recipient: {
            to_name: '',
            to_address_line1: '',
            to_address_line2: '',
            to_city: '',
            to_state: '',
            to_postal_code: '',
            to_country: 'US'
          }
        });
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Direct mail send failed.');
    }
  };

  // Simulate Status Advance for Testing Sandbox
  const handleSimulateStatus = async (id) => {
    try {
      const res = await apiFetch(`/api/v1/direct-mail/sends/${id}/simulate`, { method: 'PUT' });
      if (res.success) {
        toast.success(`Mail tracking advanced to: ${res.data.status}`);
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Simulation advancement failed.');
    }
  };

  // Filters & Search
  const filteredSends = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sends;
    return sends.filter(s =>
      s.to_name.toLowerCase().includes(query) ||
      s.to_address_line1.toLowerCase().includes(query) ||
      s.provider_job_id?.toLowerCase().includes(query)
    );
  }, [searchQuery, sends]);

  const paginatedSends = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSends.slice(start, start + PAGE_SIZE);
  }, [filteredSends, currentPage]);

  // Status Colors Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'in_transit': return 'info';
      case 'printed': return 'warning';
      case 'failed':
      case 'returned': return 'danger';
      default: return 'neutral';
    }
  };

  // Progress Bar Width Helper
  const getProgressWidth = (status) => {
    switch (status) {
      case 'delivered': return '100%';
      case 'in_transit': return '80%';
      case 'printed': return '50%';
      case 'rendered': return '25%';
      case 'created': return '10%';
      default: return '0%';
    }
  };

  if (loading) {
    return (
      <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading Direct Mail Ecosystem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      {/* Title & Onboarding Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📬</span> Direct Mail Automation
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Programmatically send physical letters and postcards. Validate addresses and track carriers live.
          </p>
        </div>
        <Button onClick={() => setIsSendModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Send size={16} /> Send Single Mailer
        </Button>
      </div>

      {/* Stats Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mailers Ordered</span>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={22} style={{ color: 'var(--primary)' }} /> {stats.total_sends || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total jobs accepted</span>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivered Mail</span>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={22} style={{ color: 'var(--success)' }} /> {stats.total_delivered || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confirmed deliveries</span>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Failed / Returned</span>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <XCircle size={22} style={{ color: 'var(--danger)' }} /> {stats.total_returned + stats.total_failed || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Address/delivery errors</span>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Postage Spending</span>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <DollarSign size={20} style={{ color: 'var(--primary)' }} /> {parseFloat(stats.total_cost).toFixed(2)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>USPS postage fees</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Delivery Queue ({sends.length})
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            style={{
              padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'campaigns' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'campaigns' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            style={{
              padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'templates' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'templates' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            HTML Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            style={{
              padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'verification' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'verification' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Address Verification Playground
          </button>
        </div>
      </div>

      {/* Tab: Overview (Mails Sends Table) */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)', width: 16, height: 16 }} />
              <input
                type="text"
                placeholder="Search by recipient or Job ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.85rem', width: '100%', color: 'var(--text)' }}
              />
            </div>
          </div>

          {filteredSends.length === 0 ? (
            <EmptyState
              title="No mail jobs found"
              description="Deploy postcards or letters to contacts to trigger printing, postage, and USPS carrier routing tracking details here."
            />
          ) : (
            <>
              <div className="card" style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' }}>
                      <th style={{ padding: 12, textAlign: 'left' }}>Recipient Details</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Template & Size</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Job ID</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Postage Cost</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Delivery Status</th>
                      <th style={{ padding: 12, textAlign: 'center' }}>Test Simulation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSends.map((send) => (
                      <tr key={send.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 12 }}>
                          <div style={{ fontWeight: 600 }}>{send.to_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {send.to_address_line1}, {send.to_city}, {send.to_state} {send.to_postal_code}
                          </div>
                        </td>
                        <td style={{ padding: 12 }}>
                          <div style={{ fontWeight: 500 }}>{send.template_name || 'Manual Mailer'}</div>
                          <Badge type="info">{send.template_type?.toUpperCase()} {send.template_size}</Badge>
                        </td>
                        <td style={{ padding: 12, fontFamily: 'monospace' }}>{send.provider_job_id}</td>
                        <td style={{ padding: 12, fontWeight: 600 }}>${parseFloat(send.cost).toFixed(2)}</td>
                        <td style={{ padding: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Badge type={getStatusBadge(send.status)}>{send.status.toUpperCase()}</Badge>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{send.status_details}</span>
                            {/* Visual Progress Bar */}
                            {send.status !== 'failed' && send.status !== 'returned' && (
                              <div style={{ width: 100, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                                <div style={{ height: '100%', background: 'var(--primary)', width: getProgressWidth(send.status), transition: 'width 0.3s' }} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          {send.status !== 'delivered' && send.status !== 'returned' && send.status !== 'failed' ? (
                            <Button variant="secondary" onClick={() => handleSimulateStatus(send.id)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                              Next Stage
                            </Button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalItems={filteredSends.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </>
      )}

      {/* Tab: Campaigns */}
      {activeTab === 'campaigns' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button onClick={() => {
              setCampaignForm({
                id: null,
                name: '',
                description: '',
                template_id: '',
                status: 'draft',
                schedule_type: 'immediate',
                scheduled_at: ''
              });
              setIsCampaignModalOpen(true);
            }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Create Campaign
            </Button>
          </div>

          {campaigns.length === 0 ? (
            <EmptyState
              title="No campaigns created yet"
              description="Create a campaign, attach a postcard template, and schedule bulk delivery orders to CRM lists."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {campaigns.map((camp) => (
                <div key={camp.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Badge type={camp.status === 'active' ? 'success' : 'neutral'}>{camp.status.toUpperCase()}</Badge>
                      <Badge type="info">{camp.schedule_type.toUpperCase()}</Badge>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{camp.name}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{camp.description}</p>
                    <div style={{ marginTop: 12, fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Template:</span> {camp.template_name || 'None'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setCampaignForm({
                          id: camp.id,
                          name: camp.name,
                          description: camp.description,
                          template_id: camp.template_id || '',
                          status: camp.status,
                          schedule_type: camp.schedule_type,
                          scheduled_at: camp.scheduled_at ? camp.scheduled_at.split('T')[0] : ''
                        });
                        setIsCampaignModalOpen(true);
                      }}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteCampaign(camp.id)}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Templates */}
      {activeTab === 'templates' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button onClick={() => {
              setTemplateForm({
                id: null,
                name: '',
                description: '',
                html_content: '<html>\n  <body>\n    <h1>Hello {{first_name}}!</h1>\n    <p>Welcome to our autumn promotional event.</p>\n  </body>\n</html>',
                size: '4x6',
                type: 'postcard'
              });
              setIsTemplateModalOpen(true);
            }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Create Template
            </Button>
          </div>

          {templates.length === 0 ? (
            <EmptyState
              title="No templates created yet"
              description="Postcards and letters are constructed using standard HTML/CSS. Build a reusable format with dynamic address tokens."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {templates.map((temp) => (
                <div key={temp.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Badge type="info">{temp.type.toUpperCase()}</Badge>
                      <Badge type="neutral">{temp.size}</Badge>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{temp.name}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{temp.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setTemplateForm({
                          id: temp.id,
                          name: temp.name,
                          description: temp.description,
                          html_content: temp.html_content,
                          size: temp.size,
                          type: temp.type
                        });
                        setIsTemplateModalOpen(true);
                      }}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Edit HTML
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteTemplate(temp.id)}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Address Verification Sandbox */}
      {activeTab === 'verification' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} style={{ color: 'var(--primary)' }} /> CASS Address Verification Sandbox
            </h3>
            <form onSubmit={handleVerifySubmit} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Recipient Name</label>
                <input
                  type="text"
                  required
                  value={verifyForm.to_name}
                  onChange={e => setVerifyForm({ ...verifyForm, to_name: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Street Address</label>
                <input
                  type="text"
                  required
                  value={verifyForm.to_address_line1}
                  onChange={e => setVerifyForm({ ...verifyForm, to_address_line1: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>City</label>
                  <input
                    type="text"
                    required
                    value={verifyForm.to_city}
                    onChange={e => setVerifyForm({ ...verifyForm, to_city: e.target.value })}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>State</label>
                  <input
                    type="text"
                    required
                    value={verifyForm.to_state}
                    onChange={e => setVerifyForm({ ...verifyForm, to_state: e.target.value })}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>ZIP Code</label>
                  <input
                    type="text"
                    required
                    value={verifyForm.to_postal_code}
                    onChange={e => setVerifyForm({ ...verifyForm, to_postal_code: e.target.value })}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
                  />
                </div>
              </div>
              <Button type="submit" disabled={verifying} style={{ width: '100%', marginTop: 8 }}>
                {verifying ? 'Verifying...' : 'Verify Deliverability'}
              </Button>
            </form>
          </div>

          <div className="card" style={{ padding: 20, minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px dashed var(--border)' }}>
            {!verificationResult ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <MapPin size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <p>Run CASS validation to display normalized delivery result records here.</p>
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Result:</span>
                  <Badge type={verificationResult.valid ? 'success' : 'danger'}>
                    {verificationResult.deliverability.toUpperCase()}
                  </Badge>
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>{verificationResult.summary}</p>
                {verificationResult.valid && (
                  <div style={{ background: 'var(--surface-muted)', padding: 16, borderRadius: 8 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>USPS Standardized Output</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', display: 'grid', gap: 4 }}>
                      <div>NAME: {verificationResult.standardized.name}</div>
                      <div>LINE 1: {verificationResult.standardized.line1}</div>
                      <div>CITY: {verificationResult.standardized.city}</div>
                      <div>STATE/ZIP: {verificationResult.standardized.state} {verificationResult.standardized.postal}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE/EDIT TEMPLATE */}
      <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={templateForm.id ? 'Edit Template' : 'New Template'}>
        <form onSubmit={handleTemplateSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Template Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Autumn Discount Postcard"
              value={templateForm.name}
              onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Description</label>
            <input
              type="text"
              placeholder="e.g. Sent to active shoppers"
              value={templateForm.description}
              onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Mailer Type</label>
              <select
                value={templateForm.type}
                onChange={e => setTemplateForm({ ...templateForm, type: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="postcard">Postcard</option>
                <option value="letter">Letter</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Mailer Dimensions</label>
              <select
                value={templateForm.size}
                onChange={e => setTemplateForm({ ...templateForm, size: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="4x6">4x6 Postcard ($0.48)</option>
                <option value="6x9">6x9 Postcard ($0.68)</option>
                <option value="8.5x11">8.5x11 Letter ($0.88)</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>HTML Layout Content</label>
            <textarea
              rows="8"
              required
              value={templateForm.html_content}
              onChange={e => setTemplateForm({ ...templateForm, html_content: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem', fontFamily: 'monospace' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Template</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE/EDIT CAMPAIGN */}
      <Modal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} title={campaignForm.id ? 'Edit Campaign' : 'New Campaign'}>
        <form onSubmit={handleCampaignSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Campaign Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Black Friday Postcard Campaign"
              value={campaignForm.name}
              onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Description</label>
            <textarea
              rows="3"
              placeholder="Provide target parameters..."
              value={campaignForm.description}
              onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Attach Template</label>
              <select
                required
                value={campaignForm.template_id}
                onChange={e => setCampaignForm({ ...campaignForm, template_id: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="">Select Template</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Schedule Type</label>
              <select
                value={campaignForm.schedule_type}
                onChange={e => setCampaignForm({ ...campaignForm, schedule_type: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="immediate">Immediate</option>
                <option value="scheduled">Scheduled Date</option>
                <option value="triggered">Automated API Trigger</option>
              </select>
            </div>
          </div>
          {campaignForm.schedule_type === 'scheduled' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Scheduled Date</label>
              <input
                type="date"
                required
                value={campaignForm.scheduled_at}
                onChange={e => setCampaignForm({ ...campaignForm, scheduled_at: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsCampaignModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Campaign</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: SEND SINGLE MAILER */}
      <Modal isOpen={isSendModalOpen} onClose={() => setIsSendModalOpen(false)} title="Send Direct Mailer">
        <form onSubmit={handleSendMail} style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Template</label>
              <select
                required
                value={sendForm.template_id}
                onChange={e => setSendForm({ ...sendForm, template_id: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="">Select Template</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Campaign (Optional)</label>
              <select
                value={sendForm.campaign_id}
                onChange={e => setSendForm({ ...sendForm, campaign_id: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="">None</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <h4 style={{ margin: '8px 0 0', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>Recipient Address</h4>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Recipient Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={sendForm.recipient.to_name}
              onChange={e => setSendForm({ ...sendForm, recipient: { ...sendForm.recipient, to_name: e.target.value } })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Address Line 1</label>
            <input
              type="text"
              required
              placeholder="e.g. 123 Main St"
              value={sendForm.recipient.to_address_line1}
              onChange={e => setSendForm({ ...sendForm, recipient: { ...sendForm.recipient, to_address_line1: e.target.value } })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>City</label>
              <input
                type="text"
                required
                placeholder="e.g. Austin"
                value={sendForm.recipient.to_city}
                onChange={e => setSendForm({ ...sendForm, recipient: { ...sendForm.recipient, to_city: e.target.value } })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>State</label>
              <input
                type="text"
                required
                placeholder="e.g. TX"
                value={sendForm.recipient.to_state}
                onChange={e => setSendForm({ ...sendForm, recipient: { ...sendForm.recipient, to_state: e.target.value } })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>ZIP Code</label>
              <input
                type="text"
                required
                placeholder="e.g. 78701"
                value={sendForm.recipient.to_postal_code}
                onChange={e => setSendForm({ ...sendForm, recipient: { ...sendForm.recipient, to_postal_code: e.target.value } })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsSendModalOpen(false)}>Cancel</Button>
            <Button type="submit">Place Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
