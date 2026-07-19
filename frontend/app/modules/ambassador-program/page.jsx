'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Users,
  Award,
  Activity,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Send,
  ExternalLink,
  Copy,
  ChevronRight,
  TrendingUp,
  Share2
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

export default function AmbassadorProgram() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  // Navigation / Views State
  const [viewMode, setViewMode] = useState('ambassador'); // 'ambassador' | 'admin'
  const [activeTab, setActiveTab] = useState('overview'); // ambassador tabs or admin tabs
  const [loading, setLoading] = useState(true);

  // Ambassador Data States
  const [ambassadorProfile, setAmbassadorProfile] = useState(null);
  const [availableMissions, setAvailableMissions] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [myPayouts, setMyPayouts] = useState([]);

  // Admin Data States
  const [adminStats, setAdminStats] = useState({
    total_ambassadors: 0,
    total_clicks: 0,
    total_conversions: 0,
    total_revenue: 0,
    total_commissions: 0,
    total_paid_out: 0
  });
  const [allAmbassadors, setAllAmbassadors] = useState([]);
  const [allMissions, setAllMissions] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [allPayouts, setAllPayouts] = useState([]);

  // Forms / Modals States
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Form Fields
  const [onboardForm, setOnboardForm] = useState({
    referral_code: '',
    social_handles: { instagram: '', tiktok: '', youtube: '', twitter: '' },
    notes: ''
  });

  const [missionForm, setMissionForm] = useState({
    id: null,
    title: '',
    description: '',
    mission_type: 'social_post',
    reward_type: 'points',
    reward_value: 0,
    points_reward: 0,
    status: 'draft',
    start_date: '',
    end_date: ''
  });

  const [selectedMission, setSelectedMission] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({
    submission_url: '',
    notes: ''
  });

  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    payout_method: 'bank_transfer'
  });

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    status: 'approved',
    admin_notes: ''
  });

  // Table Pagination / Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Load Initial View Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch personal ambassador profile
      const profileRes = await apiFetch('/api/v1/ambassadors/profile');
      if (profileRes.success && profileRes.data) {
        setAmbassadorProfile(profileRes.data);
      } else {
        setAmbassadorProfile(null);
      }

      if (viewMode === 'admin' && isAdmin) {
        // Load Admin dashboard lists
        const [statsRes, profilesRes, missionsRes, submissionsRes, payoutsRes] = await Promise.all([
          apiFetch('/api/v1/ambassadors/analytics'),
          apiFetch('/api/v1/ambassadors/profiles'),
          apiFetch('/api/v1/ambassadors/missions'),
          apiFetch('/api/v1/ambassadors/submissions'),
          apiFetch('/api/v1/ambassadors/payouts')
        ]);

        if (statsRes.success) setAdminStats(statsRes.data);
        if (profilesRes.success) setAllAmbassadors(profilesRes.data);
        if (missionsRes.success) setAllMissions(missionsRes.data);
        if (submissionsRes.success) setAllSubmissions(submissionsRes.data);
        if (payoutsRes.success) setAllPayouts(payoutsRes.data);
      } else {
        // Load Ambassador portal lists
        const missionsRes = await apiFetch('/api/v1/ambassadors/missions?status=active');
        if (missionsRes.success) setAvailableMissions(missionsRes.data);

        if (profileRes.data) {
          const [submissionsRes, payoutsRes] = await Promise.all([
            apiFetch(`/api/v1/ambassadors/submissions?ambassadorId=${profileRes.data.id}`),
            apiFetch(`/api/v1/ambassadors/payouts?ambassadorId=${profileRes.data.id}`)
          ]);
          if (submissionsRes.success) setMySubmissions(submissionsRes.data);
          if (payoutsRes.success) setMyPayouts(payoutsRes.data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load ambassador data.');
    } finally {
      setLoading(false);
    }
  }, [viewMode, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Copy Referral link to clipboard
  const handleCopyLink = (code) => {
    const link = `${window.location.origin}/api/v1/ambassadors/c/${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied to clipboard!');
  };

  // Submit Ambassador Onboarding Application
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/ambassadors/onboard', {
        method: 'POST',
        body: JSON.stringify(onboardForm)
      });
      if (res.success) {
        toast.success('Application submitted successfully!');
        setIsOnboardingModalOpen(false);
        setOnboardForm({
          referral_code: '',
          social_handles: { instagram: '', tiktok: '', youtube: '', twitter: '' },
          notes: ''
        });
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Onboarding failed.');
    }
  };

  // Create / Update Mission
  const handleMissionSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = missionForm.id ? 'PUT' : 'POST';
      const path = missionForm.id ? `/api/v1/ambassadors/missions/${missionForm.id}` : '/api/v1/ambassadors/missions';
      
      const res = await apiFetch(path, {
        method,
        body: JSON.stringify(missionForm)
      });
      if (res.success) {
        toast.success(`Mission ${missionForm.id ? 'updated' : 'created'} successfully!`);
        setIsMissionModalOpen(false);
        setMissionForm({
          id: null,
          title: '',
          description: '',
          mission_type: 'social_post',
          reward_type: 'points',
          reward_value: 0,
          points_reward: 0,
          status: 'draft',
          start_date: '',
          end_date: ''
        });
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save mission.');
    }
  };

  // Delete Mission
  const handleDeleteMission = async (id) => {
    if (!confirm('Are you sure you want to delete this mission?')) return;
    try {
      const res = await apiFetch(`/api/v1/ambassadors/missions/${id}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Mission deleted.');
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Delete failed.');
    }
  };

  // Submit Mission Proof (Ambassador)
  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();
    if (!submissionForm.submission_url.trim()) {
      toast.error('Submission link/URL is required.');
      return;
    }
    try {
      const res = await apiFetch('/api/v1/ambassadors/submissions', {
        method: 'POST',
        body: JSON.stringify({
          ambassador_id: ambassadorProfile.id,
          mission_id: selectedMission.id,
          ...submissionForm
        })
      });
      if (res.success) {
        toast.success('Mission proof submitted successfully!');
        setIsSubmissionModalOpen(false);
        setSubmissionForm({ submission_url: '', notes: '' });
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Submission failed.');
    }
  };

  // Review Submission (Admin)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/v1/ambassadors/submissions/${selectedSubmission.id}/review`, {
        method: 'PUT',
        body: JSON.stringify(reviewForm)
      });
      if (res.success) {
        toast.success('Submission reviewed and updated.');
        setIsReviewModalOpen(false);
        setReviewForm({ status: 'approved', admin_notes: '' });
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Review failed.');
    }
  };

  // Approve Payout Request (Admin)
  const handleApprovePayout = async (id) => {
    if (!confirm('Mark this payout as processed and paid?')) return;
    try {
      const res = await apiFetch(`/api/v1/ambassadors/payouts/${id}/approve`, { method: 'PUT' });
      if (res.success) {
        toast.success('Payout marked as paid.');
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Approval failed.');
    }
  };

  // Submit Payout Request (Ambassador)
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(payoutForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('Enter a valid payout amount.');
      return;
    }
    try {
      const res = await apiFetch('/api/v1/ambassadors/payouts', {
        method: 'POST',
        body: JSON.stringify({
          ambassador_id: ambassadorProfile.id,
          amount: amountVal,
          payout_method: payoutForm.payout_method
        })
      });
      if (res.success) {
        toast.success('Payout request submitted.');
        setIsPayoutModalOpen(false);
        setPayoutForm({ amount: '', payout_method: 'bank_transfer' });
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Payout request failed.');
    }
  };

  // Change Profile Status (Admin)
  const handleChangeStatus = async (id, status) => {
    const notes = prompt(`Enter notes for changing status to ${status}:`);
    if (notes === null) return;
    try {
      const res = await apiFetch(`/api/v1/ambassadors/profiles/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes })
      });
      if (res.success) {
        toast.success(`Status updated to ${status}.`);
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status.');
    }
  };

  // Filter lists based on Search Query
  const filteredMissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = viewMode === 'admin' ? allMissions : availableMissions;
    if (!query) return list;
    return list.filter(m => m.title.toLowerCase().includes(query) || m.description?.toLowerCase().includes(query));
  }, [searchQuery, allMissions, availableMissions, viewMode]);

  const filteredAmbassadors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query && !statusFilter) return allAmbassadors;
    return allAmbassadors.filter(a => {
      const matchQuery = !query || a.user_name?.toLowerCase().includes(query) || a.user_email?.toLowerCase().includes(query) || a.referral_code?.toLowerCase().includes(query);
      const matchStatus = !statusFilter || a.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [searchQuery, statusFilter, allAmbassadors]);

  const paginatedAmbassadors = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAmbassadors.slice(start, start + PAGE_SIZE);
  }, [filteredAmbassadors, currentPage]);

  if (loading) {
    return (
      <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading Ambassador Program...</p>
        </div>
      </div>
    );
  }

  // Tier Color Badges Helper
  const getTierBadgeColor = (tier) => {
    switch (tier) {
      case 'platinum': return 'danger';
      case 'gold': return 'warning';
      case 'silver': return 'info';
      default: return 'success';
    }
  };

  // Status Badge Helper
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="panel">
      {/* breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📣</span> Ambassador Program
          </h1>
          {ambassadorProfile && (
            <Badge type={getTierBadgeColor(ambassadorProfile.tier)}>
              {ambassadorProfile.tier.toUpperCase()} TIER
            </Badge>
          )}
        </div>

        {/* View Mode Switcher */}
        {isAdmin && (
          <div style={{ display: 'flex', background: 'var(--surface-muted)', borderRadius: 8, padding: 4, gap: 4 }}>
            <button
              onClick={() => { setViewMode('ambassador'); setActiveTab('overview'); }}
              style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                background: viewMode === 'ambassador' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'ambassador' ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: viewMode === 'ambassador' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              Ambassador Portal
            </button>
            <button
              onClick={() => { setViewMode('admin'); setActiveTab('overview'); }}
              style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                background: viewMode === 'admin' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'admin' ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: viewMode === 'admin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              Admin Dashboard
            </button>
          </div>
        )}
      </div>

      {/* AMBASSADOR PORTAL VIEW */}
      {viewMode === 'ambassador' && (
        <>
          {!ambassadorProfile ? (
            /* Onboarding Required Empty State */
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, textAlign: 'center', minHeight: 350 }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🤝</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8 }}>Become an Ambassador</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: 450, marginBottom: 24, fontSize: '0.95rem' }}>
                Join our exclusive program to earn cash commissions and rewards by promoting the platform to your audience. Complete social missions and get paid directly.
              </p>
              <Button onClick={() => setIsOnboardingModalOpen(true)}>Apply to Join Program</Button>
            </div>
          ) : ambassadorProfile.status === 'pending' ? (
            /* Application Pending State */
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, textAlign: 'center', minHeight: 350 }}>
              <Clock size={48} style={{ color: 'var(--warning)', marginBottom: 16 }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8 }}>Application Under Review</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: 450, marginBottom: 12 }}>
                Thank you for applying to the Ambassador Program! Our team is currently reviewing your application and verifying your social handles.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>We will notify you by email as soon as your account is activated.</p>
            </div>
          ) : ambassadorProfile.status === 'suspended' ? (
            /* Suspended Account State */
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, textAlign: 'center', minHeight: 350, border: '1px solid var(--danger-light)' }}>
              <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: 16 }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8 }}>Account Suspended</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: 450 }}>
                Your ambassador profile has been suspended. Please contact customer support if you believe this is an error.
              </p>
            </div>
          ) : (
            /* Active Ambassador Dashboard */
            <>
              {/* Profile Metrics cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div className="card" style={{ padding: 18, position: 'relative' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Points Balance</span>
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Award size={24} style={{ color: 'var(--primary)' }} /> {ambassadorProfile.points_balance || 0}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Level Up Progress</span>
                </div>
                <div className="card" style={{ padding: 18 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Commissions Earned</span>
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>NGN</span> {parseFloat(ambassadorProfile.rewards_earned).toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total earnings accumulative</span>
                </div>
                <div className="card" style={{ padding: 18 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Referred Sales</span>
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={24} style={{ color: 'var(--success)' }} /> {ambassadorProfile.total_referrals || 0}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conversions tracking</span>
                </div>
                <div className="card" style={{ padding: 18 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Link Clicks</span>
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={24} style={{ color: 'var(--info)' }} /> {ambassadorProfile.referred_visits_count || 0}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clicks traffic logs</span>
                </div>
              </div>

              {/* Referral sharing component */}
              <div className="card" style={{ padding: 24, marginBottom: 32, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-muted) 100%)' }}>
                <div style={{ flex: 1, minWidth: 250 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Share2 size={18} style={{ color: 'var(--primary)' }} /> Your Custom Referral link
                  </h3>
                  <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Share this link on your social profiles or website. Whenever users register and buy, you earn a 10% commission + 50 points!
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flex: 1.5, minWidth: 300 }}>
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/api/v1/ambassadors/c/${ambassadorProfile.referral_code}`}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-muted)', fontSize: '0.85rem', color: 'var(--text)' }}
                  />
                  <Button variant="secondary" onClick={() => handleCopyLink(ambassadorProfile.referral_code)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Copy size={16} /> Copy
                  </Button>
                </div>
              </div>

              {/* Tabs navigation */}
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
                    Active Missions ({availableMissions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('submissions')}
                    style={{
                      padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'submissions' ? '2px solid var(--primary)' : '2px solid transparent',
                      background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                      color: activeTab === 'submissions' ? 'var(--primary)' : 'var(--text-muted)'
                    }}
                  >
                    My Submissions ({mySubmissions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('payouts')}
                    style={{
                      padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'payouts' ? '2px solid var(--primary)' : '2px solid transparent',
                      background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                      color: activeTab === 'payouts' ? 'var(--primary)' : 'var(--text-muted)'
                    }}
                  >
                    Payouts & Earnings
                  </button>
                </div>
              </div>

              {/* Tab: Missions list */}
              {activeTab === 'overview' && (
                <>
                  {availableMissions.length === 0 ? (
                    <EmptyState title="No active missions" description="There are no missions currently available. Check back soon for new tasks!" />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                      {availableMissions.map((mission) => (
                        <div key={mission.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <Badge type="info">{mission.mission_type.replace('_', ' ').toUpperCase()}</Badge>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {mission.points_reward > 0 && <Badge type="success">+{mission.points_reward} PTS</Badge>}
                                {mission.reward_type === 'cash' && <Badge type="danger">NGN {parseFloat(mission.reward_value).toLocaleString()}</Badge>}
                              </div>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{mission.title}</h3>
                            <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineBreak: 'anywhere' }}>{mission.description}</p>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {mission.end_date ? `Ends: ${new Date(mission.end_date).toLocaleDateString()}` : 'No deadline'}
                            </span>
                            <Button
                              variant="secondary"
                              onClick={() => { setSelectedMission(mission); setIsSubmissionModalOpen(true); }}
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              Submit Work <ChevronRight size={14} style={{ marginLeft: 2 }} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Tab: Submissions history */}
              {activeTab === 'submissions' && (
                <>
                  {mySubmissions.length === 0 ? (
                    <EmptyState title="No submissions yet" description="You haven't submitted any mission proofs yet. Start earning by completing missions!" />
                  ) : (
                    <div className="card" style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' }}>
                            <th style={{ padding: 12, textAlign: 'left' }}>Mission</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Proof URL</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Submitted At</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Outcome Rewards</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mySubmissions.map((sub) => (
                            <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: 12, fontWeight: 500 }}>{sub.mission_title}</td>
                              <td style={{ padding: 12 }}>
                                <a href={sub.submission_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  Link <ExternalLink size={12} />
                                </a>
                              </td>
                              <td style={{ padding: 12 }}><Badge type={getStatusBadgeColor(sub.status)}>{sub.status.toUpperCase()}</Badge></td>
                              <td style={{ padding: 12 }}>{new Date(sub.created_at).toLocaleString()}</td>
                              <td style={{ padding: 12 }}>
                                {sub.status === 'approved' ? (
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    {sub.points_reward > 0 && <Badge type="success">+{sub.points_reward} PTS</Badge>}
                                    {sub.reward_type === 'cash' && <Badge type="danger">NGN {sub.reward_value}</Badge>}
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Tab: Payouts */}
              {activeTab === 'payouts' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
                  {/* request payout card */}
                  <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem', fontWeight: 600 }}>Request Cash Payout</h3>
                    <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Request withdrawal of your commission earnings. You must have available cash balance.
                    </p>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Balance</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4 }}>
                        NGN {parseFloat(ambassadorProfile.rewards_earned).toLocaleString()}
                      </div>
                    </div>
                    <Button onClick={() => setIsPayoutModalOpen(true)} style={{ width: '100%' }}>Request Payout</Button>
                  </div>

                  {/* payout history */}
                  <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem', fontWeight: 600 }}>Payout Request History</h3>
                    {myPayouts.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 24 }}>No payout logs found.</p>
                    ) : (
                      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' }}>
                            <th style={{ padding: 12, textAlign: 'left' }}>Amount (NGN)</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Method</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Date Requested</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myPayouts.map((pay) => (
                            <tr key={pay.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: 12, fontWeight: 600 }}>{parseFloat(pay.amount).toLocaleString()}</td>
                              <td style={{ padding: 12 }}>{pay.payout_method.replace('_', ' ').toUpperCase()}</td>
                              <td style={{ padding: 12 }}><Badge type={getStatusBadgeColor(pay.status)}>{pay.status.toUpperCase()}</Badge></td>
                              <td style={{ padding: 12 }}>{new Date(pay.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ADMIN DASHBOARD VIEW */}
      {viewMode === 'admin' && isAdmin && (
        <>
          {/* Admin Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Ambassadors</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '6px 0 2px' }}>{adminStats.total_ambassadors || 0}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active profiles</span>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Link Clicks (Global)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '6px 0 2px' }}>{adminStats.total_clicks || 0}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Traffic hits</span>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Referrals</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '6px 0 2px' }}>{adminStats.total_conversions || 0}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sales conversions</span>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Referred Revenue</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '6px 0 2px' }}>NGN {parseFloat(adminStats.total_revenue).toLocaleString()}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Referred value</span>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Commissions Owed</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '6px 0 2px' }}>NGN {parseFloat(adminStats.total_commissions).toLocaleString()}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Approved payouts queue</span>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Paid Out</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '6px 0 2px' }}>NGN {parseFloat(adminStats.total_paid_out).toLocaleString()}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Completed payouts</span>
            </div>
          </div>

          {/* Admin Tabs */}
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
                Ambassadors ({allAmbassadors.length})
              </button>
              <button
                onClick={() => setActiveTab('missions')}
                style={{
                  padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'missions' ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                  color: activeTab === 'missions' ? 'var(--primary)' : 'var(--text-muted)'
                }}
              >
                Campaign Missions ({allMissions.length})
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                style={{
                  padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'submissions' ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                  color: activeTab === 'submissions' ? 'var(--primary)' : 'var(--text-muted)'
                }}
              >
                Submissions ({allSubmissions.filter(s => s.status === 'pending').length} Pending)
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                style={{
                  padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'payouts' ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                  color: activeTab === 'payouts' ? 'var(--primary)' : 'var(--text-muted)'
                }}
              >
                Payout Queue ({allPayouts.filter(p => p.status === 'pending').length} Pending)
              </button>
            </div>
          </div>

          {/* Admin tab content filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)', width: 16, height: 16 }} />
              <input
                type="text"
                placeholder="Search by name, email, or code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.85rem', width: '100%', color: 'var(--text)' }}
              />
            </div>
            {activeTab === 'overview' && (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.85rem', color: 'var(--text)' }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            )}
            {activeTab === 'missions' && (
              <Button onClick={() => {
                setMissionForm({
                  id: null,
                  title: '',
                  description: '',
                  mission_type: 'social_post',
                  reward_type: 'points',
                  reward_value: 0,
                  points_reward: 0,
                  status: 'draft',
                  start_date: '',
                  end_date: ''
                });
                setIsMissionModalOpen(true);
              }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> New Mission
              </Button>
            )}
          </div>

          {/* Admin Tab: Ambassador Profiles table */}
          {activeTab === 'overview' && (
            <>
              {filteredAmbassadors.length === 0 ? (
                <EmptyState title="No ambassadors found" description="No ambassador profiles match your criteria." />
              ) : (
                <>
                  <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' }}>
                          <th style={{ padding: 12, textAlign: 'left' }}>Ambassador</th>
                          <th style={{ padding: 12, textAlign: 'left' }}>Referral Code</th>
                          <th style={{ padding: 12, textAlign: 'left' }}>Tier</th>
                          <th style={{ padding: 12, textAlign: 'left' }}>Points</th>
                          <th style={{ padding: 12, textAlign: 'left' }}>Conversions</th>
                          <th style={{ padding: 12, textAlign: 'left' }}>Earnings</th>
                          <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                          <th style={{ padding: 12, textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAmbassadors.map((amb) => (
                          <tr key={amb.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: 12 }}>
                              <div style={{ fontWeight: 600 }}>{amb.user_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{amb.user_email}</div>
                            </td>
                            <td style={{ padding: 12, fontFamily: 'monospace', fontWeight: 600 }}>{amb.referral_code}</td>
                            <td style={{ padding: 12 }}><Badge type={getTierBadgeColor(amb.tier)}>{amb.tier.toUpperCase()}</Badge></td>
                            <td style={{ padding: 12, fontWeight: 500 }}>{amb.points_balance}</td>
                            <td style={{ padding: 12 }}>{amb.total_referrals}</td>
                            <td style={{ padding: 12, fontWeight: 500 }}>NGN {parseFloat(amb.rewards_earned).toLocaleString()}</td>
                            <td style={{ padding: 12 }}><Badge type={getStatusBadgeColor(amb.status)}>{amb.status.toUpperCase()}</Badge></td>
                            <td style={{ padding: 12, display: 'flex', gap: 6, justifyContent: 'center' }}>
                              {amb.status === 'pending' && (
                                <Button variant="secondary" onClick={() => handleChangeStatus(amb.id, 'active')} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Approve</Button>
                              )}
                              {amb.status === 'active' && (
                                <Button variant="danger" onClick={() => handleChangeStatus(amb.id, 'suspended')} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Suspend</Button>
                              )}
                              {amb.status === 'suspended' && (
                                <Button variant="secondary" onClick={() => handleChangeStatus(amb.id, 'active')} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Reactivate</Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredAmbassadors.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </>
          )}

          {/* Admin Tab: Campaign Missions */}
          {activeTab === 'missions' && (
            <>
              {filteredMissions.length === 0 ? (
                <EmptyState title="No missions created yet" description="Create missions to give ambassadors tasks to complete." />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {filteredMissions.map((mission) => (
                    <div key={mission.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <Badge type="info">{mission.mission_type.replace('_', ' ').toUpperCase()}</Badge>
                          <Badge type={mission.status === 'active' ? 'success' : 'neutral'}>{mission.status.toUpperCase()}</Badge>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{mission.title}</h3>
                        <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineBreak: 'anywhere' }}>{mission.description}</p>
                        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Points: <strong style={{ color: 'var(--text)' }}>+{mission.points_reward}</strong>
                          </span>
                          {mission.reward_type === 'cash' && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Cash: <strong style={{ color: 'var(--text)' }}>NGN {mission.reward_value}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setMissionForm({
                              id: mission.id,
                              title: mission.title,
                              description: mission.description,
                              mission_type: mission.mission_type,
                              reward_type: mission.reward_type,
                              reward_value: parseFloat(mission.reward_value),
                              points_reward: mission.points_reward,
                              status: mission.status,
                              start_date: mission.start_date ? mission.start_date.split('T')[0] : '',
                              end_date: mission.end_date ? mission.end_date.split('T')[0] : ''
                            });
                            setIsMissionModalOpen(true);
                          }}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDeleteMission(mission.id)}
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

          {/* Admin Tab: Submissions review */}
          {activeTab === 'submissions' && (
            <>
              {allSubmissions.length === 0 ? (
                <EmptyState title="No submissions yet" description="Ambassador proof submissions will show up here." />
              ) : (
                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' }}>
                        <th style={{ padding: 12, textAlign: 'left' }}>Ambassador</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Mission</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Proof URL</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Submitted Date</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                        <th style={{ padding: 12, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSubmissions.map((sub) => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: 12 }}>
                            <div style={{ fontWeight: 600 }}>{sub.user_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.user_email}</div>
                          </td>
                          <td style={{ padding: 12, fontWeight: 500 }}>{sub.mission_title}</td>
                          <td style={{ padding: 12 }}>
                            <a href={sub.submission_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              View Proof <ExternalLink size={12} />
                            </a>
                          </td>
                          <td style={{ padding: 12 }}>{new Date(sub.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: 12 }}><Badge type={getStatusBadgeColor(sub.status)}>{sub.status.toUpperCase()}</Badge></td>
                          <td style={{ padding: 12, textAlign: 'center' }}>
                            {sub.status === 'pending' ? (
                              <Button
                                variant="secondary"
                                onClick={() => { setSelectedSubmission(sub); setIsReviewModalOpen(true); }}
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              >
                                Review
                              </Button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Reviewed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Admin Tab: Payout queue */}
          {activeTab === 'payouts' && (
            <>
              {allPayouts.length === 0 ? (
                <EmptyState title="No payouts logged" description="Commissions withdrawal payout logs will show up here." />
              ) : (
                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' }}>
                        <th style={{ padding: 12, textAlign: 'left' }}>Ambassador</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Amount (NGN)</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Payout Method</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Requested At</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                        <th style={{ padding: 12, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPayouts.map((pay) => (
                        <tr key={pay.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: 12 }}>
                            <div style={{ fontWeight: 600 }}>{pay.user_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pay.referral_code}</div>
                          </td>
                          <td style={{ padding: 12, fontWeight: 600 }}>{parseFloat(pay.amount).toLocaleString()}</td>
                          <td style={{ padding: 12 }}>{pay.payout_method.replace('_', ' ').toUpperCase()}</td>
                          <td style={{ padding: 12 }}>{new Date(pay.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: 12 }}><Badge type={getStatusBadgeColor(pay.status)}>{pay.status.toUpperCase()}</Badge></td>
                          <td style={{ padding: 12, textAlign: 'center' }}>
                            {pay.status === 'pending' ? (
                              <Button
                                variant="secondary"
                                onClick={() => handleApprovePayout(pay.id)}
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              >
                                Mark as Paid
                              </Button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* MODAL: ONBOARDING APPLICATION FORM */}
      <Modal isOpen={isOnboardingModalOpen} onClose={() => setIsOnboardingModalOpen(false)} title="Join the Ambassador Program">
        <form onSubmit={handleOnboardSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Custom Referral Code (Optional)</label>
            <input
              type="text"
              placeholder="e.g. MYBRAND"
              value={onboardForm.referral_code}
              onChange={e => setOnboardForm({ ...onboardForm, referral_code: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Custom code for links. Defaults to AMB-[RANDOM] if left blank.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Instagram Handle</label>
              <input
                type="text"
                placeholder="@username"
                value={onboardForm.social_handles.instagram}
                onChange={e => setOnboardForm({ ...onboardForm, social_handles: { ...onboardForm.social_handles, instagram: e.target.value } })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>TikTok Handle</label>
              <input
                type="text"
                placeholder="@username"
                value={onboardForm.social_handles.tiktok}
                onChange={e => setOnboardForm({ ...onboardForm, social_handles: { ...onboardForm.social_handles, tiktok: e.target.value } })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>YouTube Channel (Optional)</label>
              <input
                type="text"
                placeholder="Channel URL or @name"
                value={onboardForm.social_handles.youtube}
                onChange={e => setOnboardForm({ ...onboardForm, social_handles: { ...onboardForm.social_handles, youtube: e.target.value } })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Twitter/X Handle</label>
              <input
                type="text"
                placeholder="@username"
                value={onboardForm.social_handles.twitter}
                onChange={e => setOnboardForm({ ...onboardForm, social_handles: { ...onboardForm.social_handles, twitter: e.target.value } })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Why do you want to join our Ambassador Program?</label>
            <textarea
              rows="3"
              placeholder="Tell us briefly about your audience or promotion plans..."
              value={onboardForm.notes}
              onChange={e => setOnboardForm({ ...onboardForm, notes: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsOnboardingModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Application</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADMIN CREATES/EDITS MISSION */}
      <Modal isOpen={isMissionModalOpen} onClose={() => setIsMissionModalOpen(false)} title={missionForm.id ? 'Edit Mission' : 'New Campaign Mission'}>
        <form onSubmit={handleMissionSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Mission Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Review the CRM on Instagram"
              value={missionForm.title}
              onChange={e => setMissionForm({ ...missionForm, title: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Description & Instructions</label>
            <textarea
              rows="3"
              placeholder="Provide clear steps for the ambassador to complete this mission..."
              value={missionForm.description}
              onChange={e => setMissionForm({ ...missionForm, description: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Mission Type</label>
              <select
                value={missionForm.mission_type}
                onChange={e => setMissionForm({ ...missionForm, mission_type: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="social_post">Social Post</option>
                <option value="content_creation">Content Creation</option>
                <option value="referral">Referral Drive</option>
                <option value="feedback">Product Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Status</label>
              <select
                value={missionForm.status}
                onChange={e => setMissionForm({ ...missionForm, status: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="draft">Draft</option>
                <option value="active">Active (Visible)</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Reward Type</label>
              <select
                value={missionForm.reward_type}
                onChange={e => setMissionForm({ ...missionForm, reward_type: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="points">Points Only</option>
                <option value="cash">Points + Cash</option>
                <option value="discount_code">Discount Code</option>
                <option value="gift">Free Gift</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Points Awarded</label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={missionForm.points_reward}
                onChange={e => setMissionForm({ ...missionForm, points_reward: parseInt(e.target.value) || 0 })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          {missionForm.reward_type === 'cash' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Cash Reward Value (NGN)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={missionForm.reward_value}
                onChange={e => setMissionForm({ ...missionForm, reward_value: parseFloat(e.target.value) || 0 })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Start Date</label>
              <input
                type="date"
                value={missionForm.start_date}
                onChange={e => setMissionForm({ ...missionForm, start_date: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>End Date</label>
              <input
                type="date"
                value={missionForm.end_date}
                onChange={e => setMissionForm({ ...missionForm, end_date: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsMissionModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Mission</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: AMBASSADOR SUBMITS PROOF OF WORK */}
      <Modal isOpen={isSubmissionModalOpen} onClose={() => setIsSubmissionModalOpen(false)} title={`Submit Proof for: ${selectedMission?.title}`}>
        <form onSubmit={handleSubmissionSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Social Post URL / Link</label>
            <input
              type="url"
              required
              placeholder="e.g. https://tiktok.com/@user/video/12345"
              value={submissionForm.submission_url}
              onChange={e => setSubmissionForm({ ...submissionForm, submission_url: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Link to the Instagram post, TikTok video, blog post, or tweet.</span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Additional Notes (Optional)</label>
            <textarea
              rows="3"
              placeholder="Any details we should know (e.g. handles used, verification context)..."
              value={submissionForm.notes}
              onChange={e => setSubmissionForm({ ...submissionForm, notes: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsSubmissionModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Work</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: REQUEST PAYOUT */}
      <Modal isOpen={isPayoutModalOpen} onClose={() => setIsPayoutModalOpen(false)} title="Request Cash Payout">
        <form onSubmit={handlePayoutSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Payout Amount (NGN)</label>
            <input
              type="number"
              required
              placeholder="e.g. 10000"
              value={payoutForm.amount}
              onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Payment Method</label>
            <select
              value={payoutForm.payout_method}
              onChange={e => setPayoutForm({ ...payoutForm, payout_method: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            >
              <option value="bank_transfer">Bank Transfer (NGN)</option>
              <option value="paypal">PayPal</option>
              <option value="paystack">Paystack</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsPayoutModalOpen(false)}>Cancel</Button>
            <Button type="submit">Request</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADMIN REVIEWS SUBMISSION */}
      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Review Mission Submission">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ambassador Code</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 2 }}>{selectedSubmission?.referral_code}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mission</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 2 }}>{selectedSubmission?.mission_title}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Proof Link</div>
          <div style={{ fontSize: '0.9rem', marginTop: 2 }}>
            <a href={selectedSubmission?.submission_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Click to open proof <ExternalLink size={14} />
            </a>
          </div>
        </div>
        {selectedSubmission?.notes && (
          <div style={{ marginBottom: 20, padding: 10, background: 'var(--surface-muted)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Ambassador Notes</div>
            <div style={{ fontSize: '0.85rem' }}>{selectedSubmission?.notes}</div>
          </div>
        )}

        <form onSubmit={handleReviewSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Review Action</label>
            <select
              value={reviewForm.status}
              onChange={e => setReviewForm({ ...reviewForm, status: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            >
              <option value="approved">Approve & Grant Rewards</option>
              <option value="rejected">Reject / Decline</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Notes for Ambassador</label>
            <textarea
              rows="3"
              placeholder="e.g. Great job! Points credited. / Link was not accessible. Please re-submit..."
              value={reviewForm.admin_notes}
              onChange={e => setReviewForm({ ...reviewForm, admin_notes: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Review</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
