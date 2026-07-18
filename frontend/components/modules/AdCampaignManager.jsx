'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import StatCard from '../ui/StatCard';
import EmptyState from '../ui/EmptyState';
import StatusBadge from '../ui/StatusBadge';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';
import { 
  Megaphone, Plus, Trash2, RefreshCw, BarChart2, Globe, Play, Pause, 
  Settings, Users, ShieldAlert, Award, Calendar, CheckCircle2, ChevronRight, Zap, Target
} from 'lucide-react';

export default function AdCampaignManager({ goHome }) {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [rules, setRules] = useState([]);
  const [performance, setPerformance] = useState(null);
  
  // Modals & forms
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  
  const [accountDraft, setAccountDraft] = useState({
    platform: 'facebook',
    account_name: '',
    platform_account_id: ''
  });

  const [campaignDraft, setCampaignDraft] = useState({
    ad_account_id: '',
    platform: 'facebook',
    name: '',
    budget: 50.00,
    budget_type: 'daily',
    objective: 'leads',
    bid_strategy: 'lowest_cost',
    target_audience: {
      locations: ['United States'],
      age_min: 18,
      age_max: 65,
      genders: ['all']
    },
    creative_data: {
      headline: 'Grow Your Sales Today',
      description: 'Discover the most powerful suite for modern CRM, automations, and billing.',
      image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      destination_url: 'https://digitpenhub.com/'
    }
  });

  const [audienceDraft, setAudienceDraft] = useState({
    name: '',
    description: '',
    platform: 'facebook',
    segment_id: ''
  });

  const [ruleDraft, setRuleDraft] = useState({
    name: '',
    target_type: 'campaign',
    target_ids: [],
    condition_metric: 'cpa',
    condition_operator: 'greater_than',
    condition_value: 20.00,
    action_type: 'pause',
    action_value: 0
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingType, setDeletingType] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'campaigns') {
        const accountsData = await apiFetch('/api/v1/ad-campaigns/accounts');
        setAccounts(accountsData.data || []);
        
        const campaignsData = await apiFetch('/api/v1/ad-campaigns/campaigns');
        setCampaigns(campaignsData.data || []);
        
        // Fetch performance summary
        const perfData = await apiFetch(`/api/v1/ad-campaigns/performance?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`);
        setPerformance(perfData.data || null);
      } else if (activeTab === 'audiences') {
        const audData = await apiFetch('/api/v1/ad-campaigns/audiences');
        setAudiences(audData.data || []);
      } else if (activeTab === 'rules') {
        const campaignsData = await apiFetch('/api/v1/ad-campaigns/campaigns');
        setCampaigns(campaignsData.data || []);
        
        const rulesData = await apiFetch('/api/v1/ad-campaigns/rules');
        setRules(rulesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching ad-campaign manager data:', error);
      toast.error('Failed to load ad campaign data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/ad-campaigns/accounts', {
        method: 'POST',
        body: JSON.stringify(accountDraft)
      });
      if (res.success) {
        toast.success('Ad Account integrated successfully!');
        setShowConnectModal(false);
        setAccountDraft({ platform: 'facebook', account_name: '', platform_account_id: '' });
        loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to integrate ad account');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/ad-campaigns/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignDraft)
      });
      if (res.success) {
        toast.success('Ad Campaign created successfully!');
        setShowCampaignModal(false);
        loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create ad campaign');
    }
  };

  const handleCreateAudience = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/ad-campaigns/audiences', {
        method: 'POST',
        body: JSON.stringify(audienceDraft)
      });
      if (res.success) {
        toast.success('Custom Audience registered & platform sync initialized.');
        setShowAudienceModal(false);
        setAudienceDraft({ name: '', description: '', platform: 'facebook', segment_id: '' });
        loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create audience');
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: ruleDraft.name,
        target_type: ruleDraft.target_type,
        target_ids: ruleDraft.target_ids,
        conditions: [{
          metric: ruleDraft.condition_metric,
          operator: ruleDraft.condition_operator,
          value: parseFloat(ruleDraft.condition_value)
        }],
        actions: [{
          type: ruleDraft.action_type,
          value: parseFloat(ruleDraft.action_value)
        }]
      };

      const res = await apiFetch('/api/v1/ad-campaigns/rules', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        toast.success('Optimization rule registered successfully.');
        setShowRuleModal(false);
        setRuleDraft({
          name: '',
          target_type: 'campaign',
          target_ids: [],
          condition_metric: 'cpa',
          condition_operator: 'greater_than',
          condition_value: 20.00,
          action_type: 'pause',
          action_value: 0
        });
        loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create rule');
    }
  };

  const handleToggleStatus = async (campaign) => {
    const nextStatus = campaign.status === 'active' ? 'paused' : 'active';
    try {
      const res = await apiFetch(`/api/v1/ad-campaigns/campaigns/${campaign.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.success) {
        toast.success(`Campaign ${nextStatus === 'active' ? 'activated' : 'paused'}!`);
        loadData();
      }
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  const handleRunRules = async () => {
    try {
      const res = await apiFetch('/api/v1/ad-campaigns/rules/run', { method: 'POST' });
      if (res.success) {
        toast.success(`Processed rules! Triggered actions: ${res.data.rulesTriggered}`);
        loadData();
      }
    } catch (error) {
      toast.error('Failed to run optimization rules');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const endpoint = {
        campaign: `/api/v1/ad-campaigns/campaigns/${deletingId}`,
        audience: `/api/v1/ad-campaigns/audiences/${deletingId}`,
        rule: `/api/v1/ad-campaigns/rules/${deletingId}`
      }[deletingType];

      const res = await apiFetch(endpoint, { method: 'DELETE' });
      if (res.success) {
        toast.success('Item deleted successfully.');
        setDeletingId(null);
        setDeletingType(null);
        loadData();
      }
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const getPlatformName = (platform) => {
    return {
      facebook: 'Facebook Ads',
      google: 'Google Ads',
      linkedin: 'LinkedIn Ads'
    }[platform] || platform;
  };

  const getPlatformColor = (platform) => {
    return {
      facebook: '#1877F2',
      google: '#EA4335',
      linkedin: '#0A66C2'
    }[platform] || '#3b82f6';
  };

  return (
    <div className="module-wrap">
      <div className="module-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="back-link" onClick={goHome}>← Back</button>
          <Megaphone className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold">Ad Campaign Manager</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            <input 
              type="date" 
              className="form-input" 
              value={dateRange.startDate} 
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              style={{ border: 'none', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} 
            />
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.25rem', background: 'var(--bg-muted)' }}>to</span>
            <input 
              type="date" 
              className="form-input" 
              value={dateRange.endDate} 
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              style={{ border: 'none', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} 
            />
          </div>
          <button className="btn-ghost btn-sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-gray-200 mb-6">
        <nav style={{ display: 'flex', gap: '1.5rem', marginBottom: '-1px' }}>
          {[
            { id: 'campaigns', label: 'Campaigns & Accounts', icon: Megaphone },
            { id: 'audiences', label: 'Custom Audiences Sync', icon: Users },
            { id: 'rules', label: 'Optimization & Automation', icon: Zap }
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
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted">Analyzing networks and stats...</p>
        </div>
      ) : (
        <>
          {/* CAMPAIGNS TAB */}
          {activeTab === 'campaigns' && (
            <div>
              {/* Connected Accounts banner */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="font-semibold text-md">Connected Ad Accounts</h3>
                    <Button variant="secondary" size="sm" onClick={() => setShowConnectModal(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Integrate Ad Account
                    </Button>
                  </div>
                  {accounts.length === 0 ? (
                    <p className="text-sm text-muted">No external ad accounts connected. Integrate Facebook, Google, or LinkedIn Ads to track budgets.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      {accounts.map(acc => (
                        <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.5rem 0.75rem', background: 'var(--bg)' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.3rem', borderRadius: '4px', background: getPlatformColor(acc.platform), color: 'white', fontWeight: 'bold' }}>
                                {acc.platform.toUpperCase()}
                              </span>
                              <strong className="text-sm">{acc.account_name}</strong>
                            </div>
                            <span className="text-xs text-muted font-mono">{acc.platform_account_id}</span>
                          </div>
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: acc.status === 'active' ? 'var(--success)' : 'var(--muted)' }}>
                            ● {acc.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyBetween: 'center' }}>
                  <div className="text-xs text-muted uppercase font-bold tracking-wider">Plan Access & Gating</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <h4 className="font-semibold text-sm">Enterprise Gated</h4>
                      <p className="text-xs text-muted">All platforms activated.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              {performance && (
                <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
                  <StatCard label="Total Ad Spend" value={`₦${parseFloat(performance.summary.spend).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} />
                  <StatCard label="Impressions" value={performance.summary.impressions.toLocaleString()} />
                  <StatCard label="Clicks" value={performance.summary.clicks.toLocaleString()} />
                  <StatCard label="Conversions" value={performance.summary.conversions.toLocaleString()} />
                  <StatCard label="ROAS" value={`${parseFloat(performance.summary.roas).toFixed(2)}x`} />
                  <StatCard label="Avg CPA" value={`₦${parseFloat(performance.summary.cpa).toFixed(2)}`} />
                </div>
              )}

              {/* Chart and Performance Table */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h3 className="font-semibold mb-3">Daily Ad Spend & Conversion Performance Trends</h3>
                  {performance && performance.daily && performance.daily.length > 0 ? (
                    <div style={{ position: 'relative', height: '160px', width: '100%', marginTop: '1rem' }}>
                      <svg width="100%" height="100%" viewBox="0 0 1000 160" preserveAspectRatio="none">
                        {/* Gradients */}
                        <defs>
                          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <line x1="0" y1="40" x2="1000" y2="40" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="5,5" />
                        <line x1="0" y1="80" x2="1000" y2="80" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="5,5" />
                        <line x1="0" y1="120" x2="1000" y2="120" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="5,5" />
                        
                        {/* Plot Spend */}
                        {(() => {
                          const maxSpend = Math.max(...performance.daily.map(d => parseFloat(d.spend))) || 1;
                          const points = performance.daily.map((d, index) => {
                            const x = (index / (performance.daily.length - 1)) * 1000;
                            const y = 140 - (parseFloat(d.spend) / maxSpend) * 110;
                            return `${x},${y}`;
                          }).join(' ');

                          const fillPoints = `0,140 ${points} 1000,140`;

                          return (
                            <>
                              <polygon points={fillPoints} fill="url(#spendGrad)" />
                              <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="2.5" />
                            </>
                          );
                        })()}

                        {/* Plot Conversions Line */}
                        {(() => {
                          const maxConvs = Math.max(...performance.daily.map(d => d.conversions)) || 1;
                          const points = performance.daily.map((d, index) => {
                            const x = (index / (performance.daily.length - 1)) * 1000;
                            const y = 140 - (d.conversions / maxConvs) * 110;
                            return `${x},${y}`;
                          }).join(' ');

                          return (
                            <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3,3" />
                          );
                        })()}
                      </svg>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        <span>{new Date(dateRange.startDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#4f46e5', borderRadius: '50%' }}></span>
                            Spend (NGN)
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
                            Conversions
                          </span>
                        </div>
                        <span>{new Date(dateRange.endDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center py-6 text-muted">No historical data in date range.</p>
                  )}
                </div>
              </div>

              {/* Campaigns list */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="font-semibold">Ad Campaigns</h3>
                  <Button variant="primary" onClick={() => {
                    if (accounts.length === 0) {
                      toast.error('Connect an ad account first!');
                      return;
                    }
                    setCampaignDraft(prev => ({ ...prev, ad_account_id: accounts[0].id, platform: accounts[0].platform }));
                    setShowCampaignModal(true);
                  }}>
                    <Plus className="w-4 h-4 mr-1" /> Create Campaign
                  </Button>
                </div>

                {campaigns.length === 0 ? (
                  <EmptyState title="No campaigns active." />
                ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Campaign Name</th>
                          <th>Platform</th>
                          <th>Status</th>
                          <th>Objective</th>
                          <th>Daily Budget</th>
                          <th>Bid Strategy</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map(camp => (
                          <tr key={camp.id}>
                            <td>
                              <div style={{ fontWeight: '600' }}>{camp.name}</div>
                              <span className="text-xs text-muted font-mono">{camp.platform_campaign_id}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: getPlatformColor(camp.platform), color: 'white', fontWeight: 'bold' }}>
                                {camp.platform.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: camp.status === 'active' ? 'var(--success)' : 'var(--muted)' }}></span>
                                {camp.status.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span style={{ textTransform: 'capitalize' }}>{camp.objective}</span>
                            </td>
                            <td>
                              ₦{parseFloat(camp.budget).toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </td>
                            <td>
                              <span className="text-sm font-mono">{camp.bid_strategy.replace(/_/g, ' ')}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                <button className="btn-ghost btn-sm" onClick={() => handleToggleStatus(camp)}>
                                  {camp.status === 'active' ? <Pause className="w-4 h-4 text-warning" /> : <Play className="w-4 h-4 text-success" />}
                                </button>
                                <button className="btn-ghost btn-sm text-danger" onClick={() => { setDeletingId(camp.id); setDeletingType('campaign'); }}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CUSTOM AUDIENCES TAB */}
          {activeTab === 'audiences' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 className="font-semibold text-md">Custom Audiences & CRM Targeting</h3>
                  <p className="text-xs text-muted">Sync CRM Contact segments automatically to Facebook custom audiences or Google Customer Match lists.</p>
                </div>
                <Button variant="primary" onClick={() => setShowAudienceModal(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Create Sync Audience
                </Button>
              </div>

              {audiences.length === 0 ? (
                <EmptyState title="No synced custom audiences yet." />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Audience Name</th>
                        <th>Target Network</th>
                        <th>Status</th>
                        <th>Synced Contacts</th>
                        <th>Last Sync</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audiences.map(aud => (
                        <tr key={aud.id}>
                          <td>
                            <div style={{ fontWeight: '600' }}>{aud.name}</div>
                            <p className="text-xs text-muted">{aud.description || 'No description'}</p>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: getPlatformColor(aud.platform), color: 'white', fontWeight: 'bold' }}>
                              {aud.platform.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <StatusBadge status={aud.status === 'ready' ? 'success' : 'warning'} label={aud.status.toUpperCase()} />
                          </td>
                          <td>
                            <strong className="text-md">{aud.member_count.toLocaleString()}</strong> contacts
                          </td>
                          <td>
                            {new Date(aud.updated_at).toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn-ghost btn-sm text-danger" onClick={() => { setDeletingId(aud.id); setDeletingType('audience'); }}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* RULES & AUTOMATION TAB */}
          {activeTab === 'rules' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 className="font-semibold text-md">Bid & Budget Optimization Rules</h3>
                  <p className="text-xs text-muted">Define automated rules (like AdEspresso/Madgicx) to monitor and adjust bids/budgets based on CPA metrics.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" onClick={handleRunRules}>
                    <RefreshCw className="w-4 h-4 mr-1 animate-hover" /> Run Rules Engine Now
                  </Button>
                  <Button variant="primary" onClick={() => setShowRuleModal(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Add Rule
                  </Button>
                </div>
              </div>

              {rules.length === 0 ? (
                <EmptyState title="No optimization rules configured." />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rule Name</th>
                        <th>Monitor Targets</th>
                        <th>CPA Trigger Conditions</th>
                        <th>Automated Action</th>
                        <th>Last Checked</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map(rule => (
                        <tr key={rule.id}>
                          <td>
                            <div style={{ fontWeight: '600' }}>{rule.name}</div>
                            <span className="text-xs text-muted">Status: {rule.status.toUpperCase()}</span>
                          </td>
                          <td>
                            {rule.target_ids.length} {rule.target_type}(s)
                          </td>
                          <td>
                            {rule.conditions.map((c, i) => (
                              <div key={i} className="text-sm font-mono text-indigo-600">
                                {c.metric.toUpperCase()} {c.operator.replace(/_/g, ' ')} ₦{parseFloat(c.value).toFixed(2)}
                              </div>
                            ))}
                          </td>
                          <td>
                            <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                              {rule.actions[0].type.replace(/_/g, ' ')}
                            </span>
                            {rule.actions[0].value > 0 ? ` (${rule.actions[0].value}%)` : ''}
                          </td>
                          <td>
                            {rule.last_run_at ? new Date(rule.last_run_at).toLocaleString() : 'Never'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn-ghost btn-sm text-danger" onClick={() => { setDeletingId(rule.id); setDeletingType('rule'); }}>
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* CONNECT AD ACCOUNT MODAL */}
      <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Integrate Ad Platform">
        <form onSubmit={handleConnectAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Network / Provider</label>
            <select 
              className="form-input w-full" 
              value={accountDraft.platform} 
              onChange={(e) => setAccountDraft(prev => ({ ...prev, platform: e.target.value }))}
            >
              <option value="facebook">Facebook Ads Integration</option>
              <option value="google">Google Ads (AdWords)</option>
              <option value="linkedin">LinkedIn Campaign Manager</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Account Name / Label</label>
            <input 
              type="text" 
              className="form-input w-full" 
              placeholder="e.g. Digitpen Hub Core Account" 
              value={accountDraft.account_name}
              onChange={(e) => setAccountDraft(prev => ({ ...prev, account_name: e.target.value }))}
              required 
            />
          </div>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">External Account ID (Optional)</label>
            <input 
              type="text" 
              className="form-input w-full" 
              placeholder="e.g. act_128919022" 
              value={accountDraft.platform_account_id}
              onChange={(e) => setAccountDraft(prev => ({ ...prev, platform_account_id: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', justifyEnd: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setShowConnectModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Establish Connection</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE CAMPAIGN MODAL */}
      <Modal isOpen={showCampaignModal} onClose={() => setShowCampaignModal(false)} title="Launch Ad Campaign">
        <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '75vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Campaign Title</label>
            <input 
              type="text" 
              className="form-input w-full" 
              placeholder="e.g. Prospecting - Q3 Promo" 
              value={campaignDraft.name}
              onChange={(e) => setCampaignDraft(prev => ({ ...prev, name: e.target.value }))}
              required 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Daily Budget (₦)</label>
              <input 
                type="number" 
                className="form-input w-full" 
                value={campaignDraft.budget}
                onChange={(e) => setCampaignDraft(prev => ({ ...prev, budget: parseFloat(e.target.value) }))}
                required 
              />
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Campaign Objective</label>
              <select 
                className="form-input w-full" 
                value={campaignDraft.objective}
                onChange={(e) => setCampaignDraft(prev => ({ ...prev, objective: e.target.value }))}
              >
                <option value="leads">Leads Capture (MQL)</option>
                <option value="conversions">Direct Sales Conversions</option>
                <option value="clicks">Website Clicks Traffic</option>
                <option value="awareness">Brand Reach / Awareness</option>
              </select>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
            <h4 className="font-semibold text-sm mb-2 text-indigo-600">A/B Testing Creative Variant</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input w-full" 
                placeholder="Variant A Headline" 
                value={campaignDraft.creative_data.headline}
                onChange={(e) => setCampaignDraft(prev => ({ ...prev, creative_data: { ...prev.creative_data, headline: e.target.value } }))}
              />
              <textarea 
                className="form-input w-full" 
                placeholder="Body text..."
                value={campaignDraft.creative_data.description}
                onChange={(e) => setCampaignDraft(prev => ({ ...prev, creative_data: { ...prev.creative_data, description: e.target.value } }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyEnd: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setShowCampaignModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Deploy to Platform</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE AUDIENCE MODAL */}
      <Modal isOpen={showAudienceModal} onClose={() => setShowAudienceModal(false)} title="New Segment Sync Audience">
        <form onSubmit={handleCreateAudience} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Audience Label</label>
            <input 
              type="text" 
              className="form-input w-full" 
              placeholder="e.g. High Value Leads Sync" 
              value={audienceDraft.name}
              onChange={(e) => setAudienceDraft(prev => ({ ...prev, name: e.target.value }))}
              required 
            />
          </div>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Platform Destination</label>
            <select 
              className="form-input w-full" 
              value={audienceDraft.platform}
              onChange={(e) => setAudienceDraft(prev => ({ ...prev, platform: e.target.value }))}
            >
              <option value="facebook">Facebook Custom Audiences</option>
              <option value="google">Google Customer Match List</option>
              <option value="linkedin">LinkedIn Matched Audiences</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyEnd: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setShowAudienceModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Start Sync Channel</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE RULE MODAL */}
      <Modal isOpen={showRuleModal} onClose={() => setShowRuleModal(false)} title="Define Optimization Rule">
        <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Rule Label</label>
            <input 
              type="text" 
              className="form-input w-full" 
              placeholder="e.g. Pause High CPA Campaigns" 
              value={ruleDraft.name}
              onChange={(e) => setRuleDraft(prev => ({ ...prev, name: e.target.value }))}
              required 
            />
          </div>

          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Select Campaigns to Target</label>
            <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.5rem' }}>
              {campaigns.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <input 
                    type="checkbox" 
                    checked={ruleDraft.target_ids.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRuleDraft(prev => ({ ...prev, target_ids: [...prev.target_ids, c.id] }));
                      } else {
                        setRuleDraft(prev => ({ ...prev, target_ids: prev.target_ids.filter(id => id !== c.id) }));
                      }
                    }} 
                  />
                  {c.name} ({c.platform.toUpperCase()})
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">CPA Metric</label>
              <select className="form-input w-full" value={ruleDraft.condition_metric} disabled>
                <option value="cpa">CPA (Cost/Conv)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Condition</label>
              <select 
                className="form-input w-full"
                value={ruleDraft.condition_operator}
                onChange={(e) => setRuleDraft(prev => ({ ...prev, condition_operator: e.target.value }))}
              >
                <option value="greater_than">Is Greater Than</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Value (₦)</label>
              <input 
                type="number" 
                className="form-input w-full" 
                value={ruleDraft.condition_value}
                onChange={(e) => setRuleDraft(prev => ({ ...prev, condition_value: parseFloat(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Automated Action</label>
            <select 
              className="form-input w-full"
              value={ruleDraft.action_type}
              onChange={(e) => setRuleDraft(prev => ({ ...prev, action_type: e.target.value }))}
            >
              <option value="pause">Pause Campaign / Asset</option>
              <option value="budget_decrease">Decrease Daily Budget by 20%</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyEnd: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setShowRuleModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Activate Rule</Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => { setDeletingId(null); setDeletingType(null); }}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${deletingType}? This operation is permanent.`}
      />
    </div>
  );
}
