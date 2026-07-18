'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

export default function AnalyticsDashboard({ formId, onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [formId, dateRange]);

  async function loadAnalytics() {
    try {
      const [analyticsRes, funnelRes] = await Promise.all([
        apiFetch(`/api/v1/leads/forms/${formId}/analytics?range=${dateRange}`),
        apiFetch(`/api/v1/leads/forms/${formId}/funnel`)
      ]);
      setAnalytics(analyticsRes.analytics);
      setFunnel(funnelRes.funnel);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="empty-note">Loading analytics...</div>;
  if (!analytics) return <div className="empty-note">No analytics data available</div>;

  return (
    <div className="card" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Form Analytics</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ fontSize: 13, padding: '6px 10px' }}
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="back-link" onClick={onClose} style={{ margin: 0 }}>Close</button>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Views</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{analytics.views.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {analytics.uniqueSessions} unique sessions
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-muted)', padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Form Starts</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{analytics.starts.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {analytics.views > 0 ? ((analytics.starts / analytics.views) * 100).toFixed(1) : 0}% of views
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-muted)', padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Submissions</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>{analytics.submits.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {analytics.starts > 0 ? ((analytics.submits / analytics.starts) * 100).toFixed(1) : 0}% completion
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-muted)', padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Conversion Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{analytics.conversionRate}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {analytics.abandons} abandons ({analytics.abandonRate}%)
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      {funnel && (
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Conversion Funnel</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Viewed Form', count: funnel.viewed, rate: 100 },
              { label: 'Started Filling', count: funnel.started, rate: funnel.viewToStartRate },
              { label: 'Submitted', count: funnel.submitted, rate: funnel.startToSubmitRate }
            ].map((stage, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{stage.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {stage.count.toLocaleString()} ({stage.rate}%)
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${stage.rate}%`,
                      background: `linear-gradient(90deg, var(--primary), var(--success))`,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {funnel.abandoned > 0 && (
            <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 6, fontSize: 13 }}>
              <strong>{funnel.abandoned}</strong> visitors abandoned the form after starting
            </div>
          )}
        </div>
      )}

      {/* Performance Insights */}
      <div className="card" style={{ background: 'var(--surface-muted)', padding: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Performance Insights</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {analytics.conversionRate < 5 && (
            <div style={{ padding: '10px 12px', background: 'rgba(220,38,38,0.1)', borderRadius: 6, fontSize: 13 }}>
              ⚠️ Low conversion rate. Consider A/B testing different form layouts or reducing field count.
            </div>
          )}
          {analytics.abandonRate > 30 && (
            <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 6, fontSize: 13 }}>
              ⚠️ High abandon rate. Review form length and field requirements.
            </div>
          )}
          {analytics.conversionRate >= 10 && (
            <div style={{ padding: '10px 12px', background: 'rgba(22,163,74,0.1)', borderRadius: 6, fontSize: 13 }}>
              ✓ Great conversion rate! Your form is performing well.
            </div>
          )}
          {analytics.errors > 0 && (
            <div style={{ padding: '10px 12px', background: 'rgba(220,38,38,0.1)', borderRadius: 6, fontSize: 13 }}>
              {analytics.errors} form errors detected. Check validation rules.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
