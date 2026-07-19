'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../../lib/api';
import { 
  Users, 
  Award, 
  Activity, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  FileText,
  UserCheck
} from 'lucide-react';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import BulkActionBar from '../ui/BulkActionBar';

export default function ReferralProgramModule({ goHome, showToast }) {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [stats, setStats] = useState({
    activePrograms: 0,
    totalReferrals: 0,
    converted: 0,
    pending: 0,
    rewarded: 0
  });
  const [programs, setPrograms] = useState([]);
  const [referrals, setReferrals] = useState([]);
  
  // Modals & Forms State
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form Drafts
  const [programDraft, setProgramDraft] = useState({
    name: '',
    rewardType: 'cash',
    rewardValue: '',
    description: '',
    terms: '',
    status: 'active'
  });
  const [referralDraft, setReferralDraft] = useState({
    programId: '',
    referrerName: '',
    referrerEmail: '',
    referrerCode: '',
    refereeName: '',
    refereeEmail: '',
    refereePhone: '',
    notes: ''
  });

  // Table Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  
  // Selection
  const [selectedReferrals, setSelectedReferrals] = useState([]);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [isDeletingProgram, setIsDeletingProgram] = useState(false);
  const [referralsToDelete, setReferralsToDelete] = useState(null);
  const [isDeletingReferrals, setIsDeletingReferrals] = useState(false);

  // Fetch Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, programsRes, referralsRes] = await Promise.all([
        apiFetch('/api/v1/referrals/stats'),
        apiFetch('/api/v1/referrals/programs'),
        apiFetch('/api/v1/referrals/referrals')
      ]);
      
      setStats(statsRes);
      setPrograms(programsRes.programs || []);
      setReferrals(referralsRes.referrals || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load referral data.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Program Handlers
  const handleSaveProgram = async (e) => {
    e.preventDefault();
    if (!programDraft.name.trim()) {
      showToast('Program name is required.');
      return;
    }
    
    try {
      setIsSaving(true);
      if (editingProgram) {
        await apiFetch(`/api/v1/referrals/programs/${editingProgram.id}`, {
          method: 'PUT',
          body: JSON.stringify(programDraft)
        });
        showToast('Referral program updated.');
      } else {
        await apiFetch('/api/v1/referrals/programs', {
          method: 'POST',
          body: JSON.stringify(programDraft)
        });
        showToast('Referral program created.');
      }
      setIsProgramModalOpen(false);
      setEditingProgram(null);
      setProgramDraft({
        name: '',
        rewardType: 'cash',
        rewardValue: '',
        description: '',
        terms: '',
        status: 'active'
      });
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save program.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProgram = (pgm) => {
    setEditingProgram(pgm);
    setProgramDraft({
      name: pgm.name,
      rewardType: pgm.reward_type,
      rewardValue: pgm.reward_value,
      description: pgm.description || '',
      terms: pgm.terms || '',
      status: pgm.status
    });
    setIsProgramModalOpen(true);
  };

  const confirmDeleteProgram = async () => {
    if (!programToDelete) return;
    try {
      setIsDeletingProgram(true);
      await apiFetch(`/api/v1/referrals/programs/${programToDelete}`, { method: 'DELETE' });
      showToast('Referral program deleted.');
      setProgramToDelete(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete program.');
    } finally {
      setIsDeletingProgram(false);
    }
  };

  // Referral Handlers
  const handleLogReferral = async (e) => {
    e.preventDefault();
    if (!referralDraft.referrerName.trim() || !referralDraft.refereeName.trim()) {
      showToast('Referrer Name and Referee Name are required.');
      return;
    }
    
    try {
      setIsSaving(true);
      await apiFetch('/api/v1/referrals/referrals', {
        method: 'POST',
        body: JSON.stringify(referralDraft)
      });
      showToast('Referral logged successfully.');
      setIsReferralModalOpen(false);
      setReferralDraft({
        programId: '',
        referrerName: '',
        referrerEmail: '',
        referrerCode: '',
        refereeName: '',
        refereeEmail: '',
        refereePhone: '',
        notes: ''
      });
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to log referral.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateReferralStatus = async (id, status) => {
    try {
      await apiFetch(`/api/v1/referrals/referrals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      showToast(`Referral status updated to ${status}.`);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update status.');
    }
  };

  const confirmDeleteReferrals = async () => {
    if (!referralsToDelete) return;
    try {
      setIsDeletingReferrals(true);
      if (Array.isArray(referralsToDelete)) {
        await apiFetch('/api/v1/referrals/referrals/bulk-delete', {
          method: 'POST',
          body: JSON.stringify({ ids: referralsToDelete })
        });
        showToast('Selected referrals deleted.');
        setSelectedReferrals([]);
      } else {
        await apiFetch(`/api/v1/referrals/referrals/${referralsToDelete}`, { method: 'DELETE' });
        showToast('Referral deleted.');
      }
      setReferralsToDelete(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete referral(s).');
    } finally {
      setIsDeletingReferrals(false);
    }
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    window.open('/api/v1/referrals/referrals/export', '_blank');
  };

  // Filtered Lists
  const filteredPrograms = useMemo(() => {
    return programs.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [programs, searchTerm]);

  const filteredReferrals = useMemo(() => {
    return referrals.filter(r => {
      const matchesSearch = 
        r.referrer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.referrer_code && r.referrer_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.referee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.referee_email && r.referee_email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesProgram = !programFilter || r.program_id === programFilter;
      const matchesStatus = !statusFilter || r.status === statusFilter;
      
      return matchesSearch && matchesProgram && matchesStatus;
    });
  }, [referrals, searchTerm, programFilter, statusFilter]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredReferrals.length / PAGE_SIZE));
  const paginatedReferrals = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReferrals.slice(start, start + PAGE_SIZE);
  }, [filteredReferrals, currentPage]);

  // Derived Metrics
  const conversionRate = useMemo(() => {
    if (stats.totalReferrals === 0) return 0;
    return ((stats.converted / stats.totalReferrals) * 100).toFixed(1);
  }, [stats]);

  const topReferrers = useMemo(() => {
    const counts = {};
    referrals.forEach(r => {
      if (!counts[r.referrer_name]) {
        counts[r.referrer_name] = { name: r.referrer_name, email: r.referrer_email, count: 0, converted: 0 };
      }
      counts[r.referrer_name].count += 1;
      if (r.status === 'converted' || r.status === 'rewarded') {
        counts[r.referrer_name].converted += 1;
      }
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [referrals]);

  // Render Status Icon Helper
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'converted':
      case 'rewarded':
        return { background: 'rgba(16, 185, 129, 0.1)', color: 'rgb(16, 185, 129)', border: '1px solid rgba(16, 185, 129, 0.2)' };
      case 'pending':
        return { background: 'rgba(245, 158, 11, 0.1)', color: 'rgb(245, 158, 11)', border: '1px solid rgba(245, 158, 11, 0.2)' };
      case 'contacted':
        return { background: 'rgba(59, 130, 246, 0.1)', color: 'rgb(59, 130, 246)', border: '1px solid rgba(59, 130, 246, 0.2)' };
      case 'rejected':
        return { background: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)', border: '1px solid rgba(239, 68, 68, 0.2)' };
      default:
        return { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' };
    }
  };

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      
      <div className="module-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Award className="primary-color" style={{ width: 28, height: 28 }} />
            Referral Program
          </h1>
          <p className="module-sub">Build word-of-mouth growth campaigns, track referrer codes, and reward loyal customers.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tab === 'programs' && (
            <Button onClick={() => {
              setEditingProgram(null);
              setProgramDraft({ name: '', rewardType: 'cash', rewardValue: '', description: '', terms: '', status: 'active' });
              setIsProgramModalOpen(true);
            }}>
              <Plus style={{ width: 16, height: 16, marginRight: 4 }} />
              Create Program
            </Button>
          )}
          {tab === 'referrals' && (
            <>
              <Button variant="secondary" onClick={handleExportCSV}>
                <Download style={{ width: 16, height: 16, marginRight: 4 }} />
                Export CSV
              </Button>
              <Button onClick={() => setIsReferralModalOpen(true)}>
                <Plus style={{ width: 16, height: 16, marginRight: 4 }} />
                Log Referral
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Summary Strip */}
      {stats && (
        <div className="stage-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="stage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="num">{stats.totalReferrals || 0}</div>
              <Users className="muted" style={{ width: 20, height: 20 }} />
            </div>
            <div className="lbl">Total Referrals</div>
          </div>
          <div className="stage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="num" style={{ color: 'var(--success)' }}>{stats.converted || 0}</div>
              <UserCheck style={{ color: 'var(--success)', width: 20, height: 20 }} />
            </div>
            <div className="lbl">Converted Leads</div>
          </div>
          <div className="stage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="num">{conversionRate}%</div>
              <TrendingUp className="primary-color" style={{ width: 20, height: 20 }} />
            </div>
            <div className="lbl">Conversion Rate</div>
          </div>
          <div className="stage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="num" style={{ color: 'var(--warning)' }}>{stats.rewarded || 0}</div>
              <DollarSign style={{ color: 'var(--warning)', width: 20, height: 20 }} />
            </div>
            <div className="lbl">Rewarded Payouts</div>
          </div>
          <div className="stage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="num">{stats.activePrograms || 0}</div>
              <Activity style={{ width: 20, height: 20 }} />
            </div>
            <div className="lbl">Active Programs</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="invoice-tabs" style={{ marginBottom: '1.5rem' }}>
        {[
          { id: 'overview', label: 'Dashboard Overview' },
          { id: 'programs', label: `Campaign Programs (${programs.length})` },
          { id: 'referrals', label: `Referrals Ledger (${referrals.length})` }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`invoice-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => {
              setTab(t.id);
              setSearchTerm('');
              setCurrentPage(1);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-note">Loading module data…</div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              {/* Analytics & Simulated Chart */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Referral Acquisition Trends</h3>
                
                {/* SVG Performance Chart */}
                <div style={{ height: 200, width: '100%', background: 'var(--surface-active)', borderRadius: 8, padding: '1rem 0.5rem', position: 'relative' }}>
                  <svg viewBox="0 0 500 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="var(--border)" strokeDasharray="3,3" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="var(--border)" strokeDasharray="3,3" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="var(--border)" strokeDasharray="3,3" />
                    
                    {/* Filled Area */}
                    <path
                      d="M 10 120 C 50 110, 100 80, 150 90 C 200 100, 250 50, 300 40 C 350 30, 400 60, 450 20 L 450 120 Z"
                      fill="url(#chartGrad)"
                    />
                    
                    {/* Trend Line */}
                    <path
                      d="M 10 120 C 50 110, 100 80, 150 90 C 200 100, 250 50, 300 40 C 350 30, 400 60, 450 20"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2.5"
                    />
                    
                    {/* Dots at pivots */}
                    <circle cx="10" cy="120" r="4" fill="var(--primary)" />
                    <circle cx="150" cy="90" r="4" fill="var(--primary)" />
                    <circle cx="300" cy="40" r="4" fill="var(--primary)" />
                    <circle cx="450" cy="20" r="5" fill="var(--primary)" stroke="white" strokeWidth="1.5" />
                  </svg>
                  
                  {/* Chart Labels */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px 0', fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul (Current)</span>
                  </div>
                </div>

                {/* Campaign Programs Summaries */}
                <div style={{ marginTop: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Campaigns Overview</h4>
                  {programs.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No campaign statistics available.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {programs.slice(0, 3).map(p => {
                        const rate = p.referral_count ? ((p.conversions / p.referral_count) * 100).toFixed(0) : 0;
                        return (
                          <div key={p.id} className="card-shell" style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Reward: {p.reward_type === 'cash' || p.reward_type === 'credit' ? `₦${Number(p.reward_value).toLocaleString()}` : p.reward_type === 'discount' ? `${p.reward_value}% off` : p.reward_type}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.conversions || 0} / {p.referral_count || 0} Conv.</div>
                              <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>{rate}% conversion</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Cards: Top Referrers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp className="success-color" style={{ width: 18, height: 18 }} />
                    Top Advocates
                  </h3>
                  
                  {topReferrers.length === 0 ? (
                    <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      No advocates logged yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {topReferrers.map((ref, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 999, background: idx === 0 ? 'rgba(245,158,11,0.2)' : 'var(--surface-active)', color: idx === 0 ? 'var(--warning)' : 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
                            {idx + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ref.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ref.email || 'No email'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{ref.count} refs</div>
                            <div style={{ fontSize: 9, color: 'var(--success)' }}>{ref.converted} conv.</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.05), rgba(var(--primary-rgb), 0.12))' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Quick Referral Link Tip</h3>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.4, color: 'var(--text-muted)' }}>
                    Referrers can share their unique codes directly. To track conversions programmatically, match incoming lead submissions with a registered `Referrer Code` in the leads scoring module.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAMPAIGN PROGRAMS */}
          {tab === 'programs' && (
            <div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2rem', width: '100%' }}
                    placeholder="Search programs by name or description…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {filteredPrograms.length === 0 ? (
                <EmptyState
                  icon="📋"
                  title="No programs match your search"
                  description="Try typing a different name or create a new referral program campaign."
                  action={
                    <Button onClick={() => {
                      setEditingProgram(null);
                      setProgramDraft({ name: '', rewardType: 'cash', rewardValue: '', description: '', terms: '', status: 'active' });
                      setIsProgramModalOpen(true);
                    }}>
                      Create Program
                    </Button>
                  }
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {filteredPrograms.map((p) => {
                    const convRate = p.referral_count ? ((p.conversions / p.referral_count) * 100).toFixed(0) : 0;
                    return (
                      <div key={p.id} className="card hover-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{p.name}</h3>
                            <span className="ctag" style={{ marginTop: 4, display: 'inline-block', background: p.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-active)', color: p.status === 'active' ? 'rgb(16, 185, 129)' : 'var(--text-muted)' }}>
                              {p.status}
                            </span>
                          </div>
                          
                          {/* Reward Value Badge */}
                          <div style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>
                            {p.reward_type === 'cash' || p.reward_type === 'credit' 
                              ? `₦${Number(p.reward_value).toLocaleString()}` 
                              : p.reward_type === 'discount' 
                                ? `${p.reward_value}% off` 
                                : p.reward_type}
                          </div>
                        </div>

                        {p.description && (
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {p.description}
                          </p>
                        )}

                        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '4px 0' }} />

                        {/* Metrics summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>{p.referral_count || 0}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Referrals</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)' }}>{p.conversions || 0}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Conversions</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>{convRate}%</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Conv. Rate</div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                          <button 
                            className="btn-ghost" 
                            style={{ flex: 1, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            onClick={() => handleEditProgram(p)}
                          >
                            <Edit style={{ width: 12, height: 12 }} />
                            Edit
                          </button>
                          <button 
                            className="btn-ghost" 
                            style={{ flex: 1, fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            onClick={() => setProgramToDelete(p.id)}
                          >
                            <Trash2 style={{ width: 12, height: 12 }} />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REFERRALS LEDGER */}
          {tab === 'referrals' && (
            <div>
              {/* Filter controls */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ flex: 2, minWidth: 200, position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2rem', width: '100%' }}
                    placeholder="Search by name, email, or code…"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                
                <select 
                  className="form-input" 
                  style={{ flex: 1, minWidth: 150 }} 
                  value={programFilter} 
                  onChange={(e) => {
                    setProgramFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Programs</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <select 
                  className="form-input" 
                  style={{ flex: 1, minWidth: 120 }} 
                  value={statusFilter} 
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="rewarded">Rewarded</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {filteredReferrals.length === 0 ? (
                <EmptyState
                  icon="🔗"
                  title="No referrals found"
                  description="Adjust your search filters or log a new word-of-mouth referral."
                  action={
                    <Button onClick={() => setIsReferralModalOpen(true)}>
                      Log Referral
                    </Button>
                  }
                />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>
                          <input 
                            type="checkbox"
                            checked={paginatedReferrals.length > 0 && paginatedReferrals.every(r => selectedReferrals.includes(r.id))}
                            onChange={(e) => {
                              const pageIds = paginatedReferrals.map(x => x.id);
                              if (e.target.checked) {
                                setSelectedReferrals(prev => Array.from(new Set([...prev, ...pageIds])));
                              } else {
                                setSelectedReferrals(prev => prev.filter(id => !pageIds.includes(id)));
                              }
                            }}
                          />
                        </th>
                        <th>Referrer</th>
                        <th>Advocate Code</th>
                        <th>Referee Name</th>
                        <th>Campaign Program</th>
                        <th>Status</th>
                        <th>Logged Date</th>
                        <th>Update Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedReferrals.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <input 
                              type="checkbox"
                              checked={selectedReferrals.includes(r.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedReferrals(prev => [...prev, r.id]);
                                } else {
                                  setSelectedReferrals(prev => prev.filter(id => id !== r.id));
                                }
                              }}
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.referrer_name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.referrer_email || '—'}</div>
                          </td>
                          <td>
                            {r.referrer_code ? (
                              <code style={{ fontSize: '0.72rem', background: 'var(--surface-active)', padding: '2px 6px', borderRadius: 4 }}>
                                {r.referrer_code}
                              </code>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.referee_name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {[r.referee_email, r.referee_phone].filter(Boolean).join(' · ')}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: 13 }}>{r.program_name || 'Generic Referral'}</span>
                          </td>
                          <td>
                            <span className="ctag" style={getStatusBadgeStyle(r.status)}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <select
                              className="form-input"
                              style={{ fontSize: '0.75rem', padding: '2px 4px', width: '100%', minWidth: 100 }}
                              value={r.status}
                              onChange={(e) => handleUpdateReferralStatus(r.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="contacted">Contacted</option>
                              <option value="converted">Converted</option>
                              <option value="rewarded">Rewarded</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td>
                            <button 
                              className="btn-ghost" 
                              style={{ padding: 4, color: 'var(--danger)' }} 
                              onClick={() => setReferralsToDelete(r.id)}
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Bulk Actions */}
                  {selectedReferrals.length > 0 && (
                    <BulkActionBar
                      selectedCount={selectedReferrals.length}
                      onClearSelection={() => setSelectedReferrals([])}
                      actions={[
                        {
                          label: 'Delete Selected',
                          variant: 'danger',
                          requiresConfirm: true,
                          confirmTitle: `Delete ${selectedReferrals.length} referrals?`,
                          confirmDescription: 'This action cannot be undone and will erase selected advocate logs.',
                          onClick: () => setReferralsToDelete(selectedReferrals)
                        }
                      ]}
                    />
                  )}

                  {/* Pagination */}
                  <Pagination 
                    page={currentPage} 
                    pageCount={totalPages} 
                    total={filteredReferrals.length} 
                    pageSize={PAGE_SIZE} 
                    onPageChange={setCurrentPage} 
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CREATE/EDIT PROGRAM MODAL */}
      {isProgramModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--panel)', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
              {editingProgram ? 'Edit Campaign Program' : 'New Campaign Program'}
            </h3>
            
            <form onSubmit={handleSaveProgram} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="field">
                <label className="field-label">Program Name *</label>
                <input
                  className="field-input"
                  required
                  placeholder="e.g. Friends & Family Double Bonus"
                  value={programDraft.name}
                  onChange={(e) => setProgramDraft(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="field">
                  <label className="field-label">Reward Type</label>
                  <select
                    className="field-select"
                    value={programDraft.rewardType}
                    onChange={(e) => setProgramDraft(prev => ({ ...prev, rewardType: e.target.value }))}
                  >
                    <option value="cash">Cash (₦)</option>
                    <option value="discount">Discount (%)</option>
                    <option value="credit">Account Credit (₦)</option>
                    <option value="gift">Gift Voucher / Box</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Reward Value</label>
                  <input
                    className="field-input"
                    type="number"
                    placeholder="e.g. 5000 or 15"
                    value={programDraft.rewardValue}
                    onChange={(e) => setProgramDraft(prev => ({ ...prev, rewardValue: e.target.value }))}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Description</label>
                <input
                  className="field-input"
                  placeholder="Provide a brief summary of the campaign criteria..."
                  value={programDraft.description}
                  onChange={(e) => setProgramDraft(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="field">
                <label className="field-label">Terms & Conditions</label>
                <textarea
                  className="field-input"
                  style={{ minHeight: 70, resize: 'vertical' }}
                  placeholder="e.g. Referee must spend a minimum of ₦10,000. Double checks apply."
                  value={programDraft.terms}
                  onChange={(e) => setProgramDraft(prev => ({ ...prev, terms: e.target.value }))}
                />
              </div>

              <div className="field">
                <label className="field-label">Campaign Status</label>
                <select
                  className="field-select"
                  value={programDraft.status}
                  onChange={(e) => setProgramDraft(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" type="button" onClick={() => setIsProgramModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save Program'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG REFERRAL MODAL */}
      {isReferralModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: 550, display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--panel)', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Log Referral Lead</h3>
            
            <form onSubmit={handleLogReferral} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="field">
                <label className="field-label">Campaign Program (Optional)</label>
                <select
                  className="field-select"
                  value={referralDraft.programId}
                  onChange={(e) => setReferralDraft(prev => ({ ...prev, programId: e.target.value }))}
                >
                  <option value="">Generic (No Program)</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Referrer info */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem', background: 'var(--surface-active)' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>Advocate / Referrer</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label className="field-label" style={{ fontSize: 10 }}>Referrer Name *</label>
                    <input
                      className="field-input"
                      required
                      placeholder="John Doe"
                      value={referralDraft.referrerName}
                      onChange={(e) => setReferralDraft(prev => ({ ...prev, referrerName: e.target.value }))}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label className="field-label" style={{ fontSize: 10 }}>Referrer Email</label>
                    <input
                      className="field-input"
                      type="email"
                      placeholder="john@example.com"
                      value={referralDraft.referrerEmail}
                      onChange={(e) => setReferralDraft(prev => ({ ...prev, referrerEmail: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="field-label" style={{ fontSize: 10 }}>Referral Code (Optional)</label>
                  <input
                    className="field-input"
                    placeholder="e.g. JOHNDOE50"
                    value={referralDraft.referrerCode}
                    onChange={(e) => setReferralDraft(prev => ({ ...prev, referrerCode: e.target.value }))}
                  />
                </div>
              </div>

              {/* Referee info */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem', background: 'var(--surface-active)' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)' }}>Referred Friend / Referee</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label className="field-label" style={{ fontSize: 10 }}>Referee Name *</label>
                    <input
                      className="field-input"
                      required
                      placeholder="Jane Smith"
                      value={referralDraft.refereeName}
                      onChange={(e) => setReferralDraft(prev => ({ ...prev, refereeName: e.target.value }))}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label className="field-label" style={{ fontSize: 10 }}>Referee Email</label>
                    <input
                      className="field-input"
                      type="email"
                      placeholder="jane@example.com"
                      value={referralDraft.refereeEmail}
                      onChange={(e) => setReferralDraft(prev => ({ ...prev, refereeEmail: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 0, marginTop: '0.5rem' }}>
                  <label className="field-label" style={{ fontSize: 10 }}>Referee Phone</label>
                  <input
                    className="field-input"
                    placeholder="+234..."
                    value={referralDraft.refereePhone}
                    onChange={(e) => setReferralDraft(prev => ({ ...prev, refereePhone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Internal Notes</label>
                <input
                  className="field-input"
                  placeholder="Additional context on the conversion timeline..."
                  value={referralDraft.notes}
                  onChange={(e) => setReferralDraft(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" type="button" onClick={() => setIsReferralModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Logging…' : 'Log Referral'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PROGRAM DIALOG */}
      <ConfirmDialog
        isOpen={!!programToDelete}
        onClose={() => setProgramToDelete(null)}
        onConfirm={confirmDeleteProgram}
        title="Delete Referral Program?"
        description="All metrics associated with this program campaign will be detached. This cannot be undone."
        confirmLabel="Delete Campaign"
        danger
        loading={isDeletingProgram}
      />

      {/* CONFIRM DELETE REFERRAL DIALOG */}
      <ConfirmDialog
        isOpen={!!referralsToDelete}
        onClose={() => setReferralsToDelete(null)}
        onConfirm={confirmDeleteReferrals}
        title="Delete Referral Log(s)?"
        description="This will permanently delete the referral records from the ledger. This cannot be undone."
        confirmLabel="Delete Log(s)"
        danger
        loading={isDeletingReferrals}
      />
    </div>
  );
}
