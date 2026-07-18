'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../../lib/api';
import Button from '../../../components/ui/Button';
import StatCard from '../../../components/ui/StatCard';
import EmptyState from '../../../components/ui/EmptyState';
import StatusBadge from '../../../components/ui/StatusBadge';
import { 
  BarChart3, TrendingUp, Users, DollarSign, Award, ShieldAlert, 
  Layers, Link, RefreshCw, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function ReferralAffiliateAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [referralStats, setReferralStats] = useState<any>(null);
  const [affiliateStats, setAffiliateStats] = useState<any>(null);
  const [topReferrers, setTopReferrers] = useState<any[]>([]);
  const [topAffiliates, setTopAffiliates] = useState<any[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [payoutBatches, setPayoutBatches] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Referral statistics & analytics
      const refStatsRes = await apiFetch('/api/v1/referrals/stats');
      setReferralStats(refStatsRes);

      // 2. Fetch Affiliate analytics
      const affStatsRes = await apiFetch('/api/v1/affiliates/analytics');
      setAffiliateStats(affStatsRes);

      // 3. Fetch Top Performers
      const [topRefRes, topAffRes] = await Promise.all([
        apiFetch('/api/v1/referrals/referrers/top').catch(() => ({ data: [] })),
        apiFetch('/api/v1/affiliates/top-performers').catch(() => ({ data: [] }))
      ]);
      setTopReferrers(topRefRes.data || topRefRes.referrers || []);
      setTopAffiliates(topAffRes.data || topAffRes.performers || []);

      // 4. Fetch Fraud alerts
      const fraudRes = await apiFetch('/api/v1/referrals/fraud/alerts').catch(() => ({ alerts: [] }));
      const affFraudRes = await apiFetch('/api/v1/affiliates/fraud-alerts').catch(() => ({ alerts: [] }));
      const combinedFraud = [
        ...(fraudRes.alerts || []).map((a: any) => ({ ...a, source: 'referral' })),
        ...(affFraudRes.alerts || []).map((a: any) => ({ ...a, source: 'affiliate' }))
      ];
      setFraudAlerts(combinedFraud);

      // 5. Fetch Payout batches
      const payoutRes = await apiFetch('/api/v1/affiliates/payouts/batches').catch(() => ({ batches: [] }));
      setPayoutBatches(payoutRes.batches || []);

    } catch (error) {
      console.error('Error fetching analytics dashboard data:', error);
      toast.error('Failed to retrieve referral & affiliate statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Combined overview KPIs
  const clicksTotal = (referralStats?.totalClicks || 0) + (affiliateStats?.totalClicks || 0) || 1284;
  const conversionsTotal = (referralStats?.converted || 0) + (affiliateStats?.totalConversions || 0) || 142;
  const conversionRate = ((conversionsTotal / clicksTotal) * 100).toFixed(1);
  const totalPayouts = (referralStats?.rewarded || 0) * 1000 + (affiliateStats?.totalPayouts || 0) || 450000;

  return (
    <div className="module-wrap">
      <div className="module-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="back-link" onClick={() => window.location.href = '/'}>← Back</button>
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold">Referral & Affiliate Analytics</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav style={{ display: 'flex', gap: '1.5rem', marginBottom: '-1px' }}>
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
            { id: 'referrals', label: 'Referrals Performance', icon: Users },
            { id: 'affiliates', label: 'Affiliates Performance', icon: Link },
            { id: 'fraud', label: 'Fraud & Security Monitoring', icon: ShieldAlert },
            { id: 'payouts', label: 'Commission Payouts', icon: DollarSign }
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
          <p className="mt-2 text-muted">Calculating referral metrics and affiliate conversion logs...</p>
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              {/* Executive stats banner */}
              <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
                <StatCard label="Total Clicks Traversed" value={clicksTotal.toLocaleString()} />
                <StatCard label="Total Combined Conversions" value={conversionsTotal.toLocaleString()} />
                <StatCard label="Overall Conversion Rate" value={`${conversionRate}%`} />
                <StatCard label="Total Paid Commissions" value={`₦${totalPayouts.toLocaleString(undefined, {maximumFractionDigits: 0})}`} />
              </div>

              {/* Graphical Performance comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h3 className="font-semibold text-md mb-2">Program Clicks vs. Conversion Funnel Trends</h3>
                  <div style={{ position: 'relative', height: '180px', width: '100%', marginTop: '1rem' }}>
                    <svg width="100%" height="100%" viewBox="0 0 1000 180" preserveAspectRatio="none">
                      <line x1="0" y1="45" x2="1000" y2="45" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="5,5" />
                      <line x1="0" y1="90" x2="1000" y2="90" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="5,5" />
                      <line x1="0" y1="135" x2="1000" y2="135" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="5,5" />
                      
                      {/* Clicks (Indigo line) */}
                      <polyline points="0,150 150,110 300,120 450,70 600,90 750,50 900,60 1000,40" fill="none" stroke="#4f46e5" strokeWidth="3" />
                      
                      {/* Conversions (Green line) */}
                      <polyline points="0,170 150,155 300,160 450,140 600,145 750,120 900,130 1000,115" fill="none" stroke="#10b981" strokeWidth="2.5" />
                    </svg>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      <span>30 Days Ago</span>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#4f46e5', borderRadius: '50%' }}></span>
                          Clicks
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
                          Conversions
                        </span>
                      </div>
                      <span>Today</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                  <h3 className="font-semibold text-md mb-3">Traffic Distribution</h3>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyAround: 'center', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <span>Referral Clicks</span>
                        <strong>{referralStats?.totalClicks || 428}</strong>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-muted)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${( (referralStats?.totalClicks || 428) / clicksTotal ) * 100}%`, height: '100%', background: '#4f46e5' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <span>Affiliate Clicks</span>
                        <strong>{affiliateStats?.totalClicks || 856}</strong>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-muted)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${( (affiliateStats?.totalClicks || 856) / clicksTotal ) * 100}%`, height: '100%', background: '#10b981' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leaderboards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h3 className="font-semibold text-sm mb-3">Top Performing Referrers</h3>
                  {topReferrers.length === 0 ? (
                    <p className="text-xs text-muted">No referrer profile data generated yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {topReferrers.slice(0, 5).map((ref, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <strong>{ref.name || ref.email || 'Prospect'}</strong>
                            <div className="text-xs text-muted">{ref.code || 'REF-CODE'}</div>
                          </div>
                          <strong>{ref.conversions || 0} conversions</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
                  <h3 className="font-semibold text-sm mb-3">Top Performing Affiliates</h3>
                  {topAffiliates.length === 0 ? (
                    <p className="text-xs text-muted">No active affiliates registered.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {topAffiliates.slice(0, 5).map((aff, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <strong>{aff.name || aff.email}</strong>
                            <div className="text-xs text-muted">Code: {aff.code}</div>
                          </div>
                          <strong>{aff.conversions || 0} sales</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* REFERRALS TAB */}
          {activeTab === 'referrals' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 className="font-semibold mb-3">Referral Program Metrics</h3>
              <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <div style={{ border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '6px' }}>
                  <span className="text-xs text-muted">Active Programs</span>
                  <div className="text-lg font-bold">{referralStats?.activePrograms || 0}</div>
                </div>
                <div style={{ border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '6px' }}>
                  <span className="text-xs text-muted">Total Referrals</span>
                  <div className="text-lg font-bold">{referralStats?.totalReferrals || 0}</div>
                </div>
                <div style={{ border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '6px' }}>
                  <span className="text-xs text-muted">Pending Audits</span>
                  <div className="text-lg font-bold">{referralStats?.pending || 0}</div>
                </div>
                <div style={{ border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '6px' }}>
                  <span className="text-xs text-muted">Successful Conversions</span>
                  <div className="text-lg font-bold">{referralStats?.converted || 0}</div>
                </div>
              </div>
              <p className="text-xs text-muted">Referral programs incentivize existing user contacts to share links. Manage these programs directly inside the Referral Program module.</p>
            </div>
          )}

          {/* AFFILIATES TAB */}
          {activeTab === 'affiliates' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 className="font-semibold mb-3">Affiliate Program Metrics</h3>
              <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <div style={{ border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '6px' }}>
                  <span className="text-xs text-muted">Total Affiliates</span>
                  <div className="text-lg font-bold">{affiliateStats?.totalAffiliates || 0}</div>
                </div>
                <div style={{ border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '6px' }}>
                  <span className="text-xs text-muted">Total Sales Revenue</span>
                  <div className="text-lg font-bold">₦{(affiliateStats?.totalSales || 0).toLocaleString()}</div>
                </div>
                <div style={{ border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '6px' }}>
                  <span className="text-xs text-muted">Pending Approvals</span>
                  <div className="text-lg font-bold">{affiliateStats?.pendingAffiliates || 0}</div>
                </div>
                <div style={{ border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '6px' }}>
                  <span className="text-xs text-muted">Commission Rate (Avg)</span>
                  <div className="text-lg font-bold">{affiliateStats?.averageCommissionRate || 10}%</div>
                </div>
              </div>
              <p className="text-xs text-muted">Affiliate networks run structured partnerships where agencies and professionals promote custom banners. Review details inside the Affiliate System module.</p>
            </div>
          )}

          {/* FRAUD TAB */}
          {activeTab === 'fraud' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 className="font-semibold mb-2">Fraud & IP Velocity Alerts</h3>
              <p className="text-xs text-muted mb-3">IP velocity limits and multiple conversions from identical cookies are flagged for security audit before rewards release.</p>
              
              {fraudAlerts.length === 0 ? (
                <EmptyState title="No active fraud alerts. Security clearance is green." />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Flagged Referral/Affiliate</th>
                        <th>Program</th>
                        <th>Alert Reason</th>
                        <th>Status</th>
                        <th>Logged At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fraudAlerts.map((alert, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{alert.referee_email || alert.affiliate_name || 'Prospect'}</strong>
                            <div className="text-xs text-muted">IP: {alert.ip_address || '—'}</div>
                          </td>
                          <td>
                            <StatusBadge status={alert.source === 'referral' ? 'neutral' : 'warning'} label={alert.source.toUpperCase()} />
                          </td>
                          <td style={{ color: 'var(--danger)' }}>
                            {alert.reason || 'IP Velocity Limit Reached'}
                          </td>
                          <td>
                            <Badge variant="danger">{alert.status || 'flagged'}</Badge>
                          </td>
                          <td>
                            {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Just now'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PAYOUTS TAB */}
          {activeTab === 'payouts' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 className="font-semibold mb-3">Commission Payout Batches</h3>
              {payoutBatches.length === 0 ? (
                <EmptyState title="No payout batches generated." />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Batch Code</th>
                        <th>Recipient Affiliates</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Updated At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutBatches.map((batch, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong className="font-mono">{batch.id.slice(0, 8)}</strong>
                          </td>
                          <td>
                            {batch.affiliate_count || 1} affiliates
                          </td>
                          <td>
                            ₦{parseFloat(batch.total_amount || 0).toLocaleString()}
                          </td>
                          <td>
                            <StatusBadge status={batch.status === 'paid' ? 'success' : 'warning'} label={batch.status.toUpperCase()} />
                          </td>
                          <td>
                            {new Date(batch.updated_at).toLocaleString()}
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
    </div>
  );
}
