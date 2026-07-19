'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../../lib/api';
import Button from '../../../components/ui/Button';
import StatCard from '../../../components/ui/StatCard';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import { 
  Users, Award, Gift, DollarSign, Calendar, Plus, RefreshCw, 
  CheckCircle, XCircle, Clock, Link as LinkIcon, Instagram, 
  Twitter, Youtube, Settings, AlertCircle
} from 'lucide-react';

export default function InfluencerCRMPage() {
  const [activeTab, setActiveTab] = useState('influencers');
  const [loading, setLoading] = useState(true);

  // Data States
  const [influencers, setInfluencers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [contentItems, setContentItems] = useState([]);
  const [payments, setPayments] = useState([]);

  // Modals & Drafts
  const [showInfluencerModal, setShowInfluencerModal] = useState(false);
  const [influencerDraft, setInfluencerDraft] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignDraft, setCampaignDraft] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: 0,
    goals: {}
  });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [assignDraft, setAssignDraft] = useState({
    influencerId: '',
    compensationAmount: 0,
    compensationType: 'flat_fee',
    notes: ''
  });

  const [showContentModal, setShowContentModal] = useState(false);
  const [contentDraft, setContentDraft] = useState({
    influencerId: '',
    campaignId: '',
    deliverableId: '', // optional or dummy UUID
    contentType: 'post', // post | story | video
    platform: 'instagram',
    postUrl: '',
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    notes: ''
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState({
    influencerId: '',
    campaignId: '',
    assignmentId: '', // optional
    amount: 0,
    dueDate: '',
    notes: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [infRes, campRes, contentRes, payRes] = await Promise.all([
        apiFetch('/api/v1/influencer-crm/influencers'),
        apiFetch('/api/v1/influencer-crm/campaigns'),
        apiFetch('/api/v1/influencer-crm/content'),
        apiFetch('/api/v1/influencer-crm/payments')
      ]);

      setInfluencers(infRes.data || []);
      setCampaigns(campRes.data || []);
      setContentItems(contentRes.data || []);
      setPayments(payRes.data || []);
    } catch (error) {
      console.error('Error loading Influencer CRM data:', error);
      toast.error('Failed to load Influencer CRM data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Form Handlers
  const handleCreateInfluencer = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/influencer-crm/influencers', {
        method: 'POST',
        body: JSON.stringify(influencerDraft)
      });
      if (res.success) {
        toast.success('Influencer added successfully!');
        setShowInfluencerModal(false);
        setInfluencerDraft({ name: '', email: '', phone: '', address: '', notes: '' });
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add influencer');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/influencer-crm/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignDraft)
      });
      if (res.success) {
        toast.success('Campaign created successfully!');
        setShowCampaignModal(false);
        setCampaignDraft({ name: '', description: '', startDate: '', endDate: '', budget: 0, goals: {} });
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create campaign');
    }
  };

  const handleAssignInfluencer = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/v1/influencer-crm/campaigns/${selectedCampaign.id}/assign`, {
        method: 'POST',
        body: JSON.stringify(assignDraft)
      });
      if (res.success) {
        toast.success('Influencer assigned to campaign!');
        setShowAssignModal(false);
        setAssignDraft({ influencerId: '', compensationAmount: 0, compensationType: 'flat_fee', notes: '' });
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to assign influencer');
    }
  };

  const handleCreateContent = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/influencer-crm/content', {
        method: 'POST',
        body: JSON.stringify(contentDraft)
      });
      if (res.success) {
        toast.success('Content entry logged successfully!');
        setShowContentModal(false);
        setContentDraft({
          influencerId: '',
          campaignId: '',
          deliverableId: '',
          contentType: 'post',
          platform: 'instagram',
          postUrl: '',
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          notes: ''
        });
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to log content');
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/influencer-crm/payments', {
        method: 'POST',
        body: JSON.stringify(paymentDraft)
      });
      if (res.success) {
        toast.success('Influencer payment schedule logged.');
        setShowPaymentModal(false);
        setPaymentDraft({ influencerId: '', campaignId: '', assignmentId: '', amount: 0, dueDate: '', notes: '' });
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create payment schedule');
    }
  };

  const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const res = await apiFetch(`/api/v1/influencer-crm/payments/${paymentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success) {
        toast.success(`Payment marked as ${newStatus}!`);
        loadData();
      }
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  // KPIs
  const totalBudget = campaigns.reduce((sum, c) => sum + parseFloat(c.budget || 0), 0);
  const pendingPayouts = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <div className="module-wrap">
      <div className="module-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="back-link" onClick={() => window.location.href = '/'}>← Back</button>
          <Users className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold">Influencer/Partner CRM</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          {activeTab === 'influencers' && (
            <Button variant="primary" onClick={() => setShowInfluencerModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Influencer
            </Button>
          )}
          {activeTab === 'campaigns' && (
            <Button variant="primary" onClick={() => setShowCampaignModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create Campaign
            </Button>
          )}
          {activeTab === 'content' && (
            <Button variant="primary" onClick={() => {
              if (influencers.length === 0 || campaigns.length === 0) {
                toast.error('Add influencers and campaigns first!');
                return;
              }
              setContentDraft(prev => ({
                ...prev,
                influencerId: influencers[0].id,
                campaignId: campaigns[0].id
              }));
              setShowContentModal(true);
            }}>
              <Plus className="w-4 h-4 mr-1" /> Track Content
            </Button>
          )}
          {activeTab === 'payments' && (
            <Button variant="primary" onClick={() => {
              if (influencers.length === 0 || campaigns.length === 0) {
                toast.error('Add influencers and campaigns first!');
                return;
              }
              setPaymentDraft(prev => ({
                ...prev,
                influencerId: influencers[0].id,
                campaignId: campaigns[0].id
              }));
              setShowPaymentModal(true);
            }}>
              <Plus className="w-4 h-4 mr-1" /> Log Payment
            </Button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
        <StatCard label="Total Influencers" value={influencers.length} />
        <StatCard label="Campaigns Configured" value={campaigns.length} />
        <StatCard label="Allocated Campaign Budgets" value={`₦${totalBudget.toLocaleString()}`} />
        <StatCard label="Pending Payments" value={`₦${pendingPayouts.toLocaleString()}`} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav style={{ display: 'flex', gap: '1.5rem', marginBottom: '-1px' }}>
          {[
            { id: 'influencers', label: 'Partners & Influencers', icon: Users },
            { id: 'campaigns', label: 'Campaigns & Compensation', icon: Gift },
            { id: 'content', label: 'Content Tracking', icon: LinkIcon },
            { id: 'payments', label: 'Payments Ledger', icon: DollarSign }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 0.25rem',
                  borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: active ? '600' : '500',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none'
                }}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted">Retrieving influencer rosters and campaign parameters...</p>
        </div>
      ) : (
        <>
          {/* TAB: INFLUENCERS */}
          {activeTab === 'influencers' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
              {influencers.length === 0 ? (
                <EmptyState title="No influencers registered yet" action={<Button onClick={() => setShowInfluencerModal(true)}>+ Add Influencer</Button>} />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Influencer Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Registered On</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {influencers.map(inf => (
                        <tr key={inf.id}>
                          <td>
                            <strong>{inf.name}</strong>
                          </td>
                          <td>{inf.email}</td>
                          <td>{inf.phone || '—'}</td>
                          <td>{new Date(inf.created_at).toLocaleDateString()}</td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{inf.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: CAMPAIGNS */}
          {activeTab === 'campaigns' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
              {campaigns.length === 0 ? (
                <EmptyState title="No campaigns created yet" action={<Button onClick={() => setShowCampaignModal(true)}>+ Create Campaign</Button>} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {campaigns.map(camp => (
                    <div key={camp.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', background: 'var(--bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <h4 className="font-bold text-md">{camp.name}</h4>
                          <p className="text-xs text-muted mt-1">{camp.description || 'No description provided.'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="text-sm font-semibold text-indigo-600">Budget: ₦{parseFloat(camp.budget || 0).toLocaleString()}</span>
                          <div className="text-xs text-muted mt-1">
                            {camp.start_date ? new Date(camp.start_date).toLocaleDateString() : 'TBD'} - {camp.end_date ? new Date(camp.end_date).toLocaleDateString() : 'TBD'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                        <span className="text-xs text-muted">
                          {camp.influencer_count || 0} Influencer{camp.influencer_count === 1 ? '' : 's'} assigned
                        </span>
                        <Button size="sm" onClick={() => {
                          setSelectedCampaign(camp);
                          setAssignDraft(prev => ({
                            ...prev,
                            influencerId: influencers[0]?.id || ''
                          }));
                          setShowAssignModal(true);
                        }}>
                          Assign Partner
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CONTENT */}
          {activeTab === 'content' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
              {contentItems.length === 0 ? (
                <EmptyState title="No deliverables logged yet." />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Partner</th>
                        <th>Platform / Link</th>
                        <th>Type</th>
                        <th>Engagement KPIs</th>
                        <th>Log Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contentItems.map(item => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.influencer_name || 'Prospect'}</strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span className="capitalize">{item.platform}</span>
                              {item.post_url && (
                                <a href={item.post_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600">
                                  <LinkIcon className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="text-xs uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                              {item.content_type || 'post'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>
                            Views: {item.views || 0} | Likes: {item.likes || 0} | Comments: {item.comments || 0}
                          </td>
                          <td>
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: PAYMENTS */}
          {activeTab === 'payments' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
              {payments.length === 0 ? (
                <EmptyState title="No payment records registered." />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Recipient</th>
                        <th>Campaign</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(pay => (
                        <tr key={pay.id}>
                          <td>
                            <strong>{pay.influencer_name || 'Prospect'}</strong>
                          </td>
                          <td>{pay.campaign_name || '—'}</td>
                          <td>
                            <strong>₦{parseFloat(pay.amount || 0).toLocaleString()}</strong>
                          </td>
                          <td>
                            {pay.due_date ? new Date(pay.due_date).toLocaleDateString() : 'Immediate'}
                          </td>
                          <td>
                            <Badge variant={pay.status === 'paid' ? 'success' : 'warning'}>
                              {pay.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td>
                            {pay.status === 'pending' ? (
                              <Button size="sm" onClick={() => handleUpdatePaymentStatus(pay.id, 'paid')}>
                                Release Payout
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => handleUpdatePaymentStatus(pay.id, 'pending')}>
                                Mark Unpaid
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL: ADD INFLUENCER */}
      <Modal isOpen={showInfluencerModal} onClose={() => setShowInfluencerModal(false)} title="Register Influencer Roster">
        <form onSubmit={handleCreateInfluencer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Full Name</label>
            <input 
              type="text" 
              className="form-input w-full" 
              value={influencerDraft.name}
              onChange={e => setInfluencerDraft(p => ({ ...p, name: e.target.value }))}
              required 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Email</label>
              <input 
                type="email" 
                className="form-input w-full" 
                value={influencerDraft.email}
                onChange={e => setInfluencerDraft(p => ({ ...p, email: e.target.value }))}
                required 
              />
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Phone</label>
              <input 
                type="text" 
                className="form-input w-full" 
                value={influencerDraft.phone}
                onChange={e => setInfluencerDraft(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Address</label>
            <input 
              type="text" 
              className="form-input w-full" 
              value={influencerDraft.address}
              onChange={e => setInfluencerDraft(p => ({ ...p, address: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Roster Notes</label>
            <textarea 
              className="form-input w-full" 
              value={influencerDraft.notes}
              onChange={e => setInfluencerDraft(p => ({ ...p, notes: e.target.value }))}
              rows={3}
            />
          </div>
          <div style={{ display: 'flex', justifyEnd: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setShowInfluencerModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Partner</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE CAMPAIGN */}
      <Modal isOpen={showCampaignModal} onClose={() => setShowCampaignModal(false)} title="Create Influencer Campaign">
        <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Campaign Name</label>
            <input 
              type="text" 
              className="form-input w-full" 
              value={campaignDraft.name}
              onChange={e => setCampaignDraft(p => ({ ...p, name: e.target.value }))}
              required 
            />
          </div>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Campaign Goals / Description</label>
            <textarea 
              className="form-input w-full" 
              value={campaignDraft.description}
              onChange={e => setCampaignDraft(p => ({ ...p, description: e.target.value }))}
              rows={2}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Start Date</label>
              <input 
                type="date" 
                className="form-input w-full" 
                value={campaignDraft.startDate}
                onChange={e => setCampaignDraft(p => ({ ...p, startDate: e.target.value }))}
                required 
              />
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">End Date</label>
              <input 
                type="date" 
                className="form-input w-full" 
                value={campaignDraft.endDate}
                onChange={e => setCampaignDraft(p => ({ ...p, endDate: e.target.value }))}
                required 
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Budget (₦)</label>
            <input 
              type="number" 
              className="form-input w-full" 
              value={campaignDraft.budget}
              onChange={e => setCampaignDraft(p => ({ ...p, budget: parseFloat(e.target.value) }))}
              required 
            />
          </div>
          <div style={{ display: 'flex', justifyEnd: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setShowCampaignModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Campaign</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ASSIGN INFLUENCER */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Assign Partner to: ${selectedCampaign?.name}`}>
        <form onSubmit={handleAssignInfluencer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {influencers.length > 0 && (
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Select Partner</label>
              <select 
                className="form-input w-full"
                value={assignDraft.influencerId}
                onChange={e => setAssignDraft(p => ({ ...p, influencerId: e.target.value }))}
                required
              >
                {influencers.map(inf => (
                  <option key={inf.id} value={inf.id}>{inf.name} ({inf.email})</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Compensation Amount (₦)</label>
              <input 
                type="number" 
                className="form-input w-full" 
                value={assignDraft.compensationAmount}
                onChange={e => setAssignDraft(p => ({ ...p, compensationAmount: parseFloat(e.target.value) }))}
                required 
              />
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Type</label>
              <select 
                className="form-input w-full"
                value={assignDraft.compensationType}
                onChange={e => setAssignDraft(p => ({ ...p, compensationType: e.target.value }))}
              >
                <option value="flat_fee">Flat Fee</option>
                <option value="barter">Barter / Gift</option>
                <option value="commission">Commission</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Compensation Notes</label>
            <input 
              type="text" 
              className="form-input w-full" 
              value={assignDraft.notes}
              onChange={e => setAssignDraft(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', justifyEnd: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Assign</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: TRACK CONTENT */}
      <Modal isOpen={showContentModal} onClose={() => setShowContentModal(false)} title="Log Influencer Deliverable">
        <form onSubmit={handleCreateContent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {influencers.length > 0 && (
              <div>
                <label className="text-xs text-muted font-bold uppercase mb-1 block">Partner</label>
                <select 
                  className="form-input w-full"
                  value={contentDraft.influencerId}
                  onChange={e => setContentDraft(p => ({ ...p, influencerId: e.target.value }))}
                >
                  {influencers.map(inf => (
                    <option key={inf.id} value={inf.id}>{inf.name}</option>
                  ))}
                </select>
              </div>
            )}
            {campaigns.length > 0 && (
              <div>
                <label className="text-xs text-muted font-bold uppercase mb-1 block">Campaign</label>
                <select 
                  className="form-input w-full"
                  value={contentDraft.campaignId}
                  onChange={e => setContentDraft(p => ({ ...p, campaignId: e.target.value }))}
                >
                  {campaigns.map(camp => (
                    <option key={camp.id} value={camp.id}>{camp.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Platform</label>
              <select 
                className="form-input w-full"
                value={contentDraft.platform}
                onChange={e => setContentDraft(p => ({ ...p, platform: e.target.value }))}
              >
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Content Type</label>
              <select 
                className="form-input w-full"
                value={contentDraft.contentType}
                onChange={e => setContentDraft(p => ({ ...p, contentType: e.target.value }))}
              >
                <option value="post">Post</option>
                <option value="story">Story</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Content Post URL</label>
            <input 
              type="text" 
              className="form-input w-full" 
              placeholder="e.g. https://instagram.com/p/..."
              value={contentDraft.postUrl}
              onChange={e => setContentDraft(p => ({ ...p, postUrl: e.target.value }))}
              required 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Views</label>
              <input 
                type="number" 
                className="form-input w-full" 
                value={contentDraft.views}
                onChange={e => setContentDraft(p => ({ ...p, views: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Likes</label>
              <input 
                type="number" 
                className="form-input w-full" 
                value={contentDraft.likes}
                onChange={e => setContentDraft(p => ({ ...p, likes: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Comments</label>
              <input 
                type="number" 
                className="form-input w-full" 
                value={contentDraft.comments}
                onChange={e => setContentDraft(p => ({ ...p, comments: parseInt(e.target.value) }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyEnd: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setShowContentModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Log Deliverable</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: LOG PAYMENT */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Schedule Partner Payment">
        <form onSubmit={handleCreatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {influencers.length > 0 && (
              <div>
                <label className="text-xs text-muted font-bold uppercase mb-1 block">Select Partner</label>
                <select 
                  className="form-input w-full"
                  value={paymentDraft.influencerId}
                  onChange={e => setPaymentDraft(p => ({ ...p, influencerId: e.target.value }))}
                >
                  {influencers.map(inf => (
                    <option key={inf.id} value={inf.id}>{inf.name}</option>
                  ))}
                </select>
              </div>
            )}
            {campaigns.length > 0 && (
              <div>
                <label className="text-xs text-muted font-bold uppercase mb-1 block">Campaign Context</label>
                <select 
                  className="form-input w-full"
                  value={paymentDraft.campaignId}
                  onChange={e => setPaymentDraft(p => ({ ...p, campaignId: e.target.value }))}
                >
                  {campaigns.map(camp => (
                    <option key={camp.id} value={camp.id}>{camp.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Payment Amount (₦)</label>
              <input 
                type="number" 
                className="form-input w-full" 
                value={paymentDraft.amount}
                onChange={e => setPaymentDraft(p => ({ ...p, amount: parseFloat(e.target.value) }))}
                required 
              />
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Due Date</label>
              <input 
                type="date" 
                className="form-input w-full" 
                value={paymentDraft.dueDate}
                onChange={e => setPaymentDraft(p => ({ ...p, dueDate: e.target.value }))}
                required 
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Notes</label>
            <input 
              type="text" 
              className="form-input w-full" 
              value={paymentDraft.notes}
              onChange={e => setPaymentDraft(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', justifyEnd: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Log Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
