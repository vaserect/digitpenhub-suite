'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import Button from '../../ui/Button';

export default function AnalyticsDashboard({ forms, showToast }) {
  const [selectedFormId, setSelectedFormId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [topForms, setTopForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    loadTopForms();
  }, []);

  useEffect(() => {
    if (selectedFormId) {
      loadFormAnalytics();
      loadConversionFunnel();
    }
  }, [selectedFormId, dateRange]);

  async function loadTopForms() {
    try {
      const res = await apiFetch('/api/v1/leads/analytics/top-forms?limit=10');
      setTopForms(res.forms || []);
    } catch (err) {
      console.error('Failed to load top forms:', err);
    }
  }

  async function loadFormAnalytics() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const res = await apiFetch(`/api/v1/leads/forms/${selectedFormId}/analytics?${params}`);
      setAnalytics(res.analytics);
    } catch (err) {
      showToast('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  async function loadConversionFunnel() {
    try {
      const res = await apiFetch(`/api/v1/leads/forms/${selectedFormId}/analytics/funnel`);
      setFunnel(res.funnel);
    } catch (err) {
      console.error('Failed to load funnel:', err);
    }
  }

  function handleDateRangeChange(key, value) {
    setDateRange(prev => ({ ...prev, [key]: value }));
  }

  const selectedForm = forms.find(f => f.id === selectedFormId);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, marginBottom: 12 }}>Form Analytics</h2>
        
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr 1fr', marginBottom: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Select Form</label>
            <select
              value={selectedFormId}
              onChange={e => setSelectedFormId(e.target.value)}
            >
              <option value="">Choose a form...</option>
              {forms.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => handleDateRangeChange('startDate', e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => handleDateRangeChange('endDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {!selectedFormId ? (
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Top Performing Forms</h3>
          {topForms.length === 0 ? (
            <div className="empty-note">No form data yet. Create and publish forms to see analytics.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {topForms.map((form, idx) => (
                <div key={form.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: idx === 0 ? 'var(--warning)' : idx === 1 ? 'var(--text-muted)' : idx === 2 ? '#cd7f32' : 'var(--surface-muted)',
                          color: idx < 3 ? 'white' : 'var(--text-muted)',
                          fontSize: 12,
                          fontWeight: 700
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{form.name}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, fontSize: 12, marginTop: 8 }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Views</div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{form.views}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Submissions</div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{form.submits}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Conversion Rate</div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>
                            {form.conversionRate}%
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Total Leads</div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{form.totalSubmissions}</div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedFormId(form.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="empty-note">Loading analytics...</div>
      ) : analytics ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              Analytics: {selectedForm?.name}
            </h3>
            <button
              className="back-link"
              style={{ margin: 0 }}
              onClick={() => setSelectedFormId('')}
            >
              ← Back to overview
            </button>
          </div>

          {/* Key Metrics */}
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 20 }}>
            <div className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Views</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{analytics.views}</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Form Starts</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{analytics.starts}</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Submissions</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>{analytics.submits}</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Conversion Rate</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{analytics.conversionRate}%</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Abandons</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>{analytics.abandons}</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Abandon Rate</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>{analytics.abandonRate}%</div>
            </div>
          </div>

          {/* Conversion Funnel */}
          {funnel && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 15, marginBottom: 16 }}>Conversion Funnel</h4>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Viewed Form</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{funnel.viewed}</span>
                    </div>
                    <div style={{
                      height: 8,
                      background: 'var(--surface-muted)',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: '100%',
                        background: 'var(--primary)',
                        borderRadius: 4
                      }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Started Form</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        {funnel.started} ({funnel.viewToStartRate}%)
                      </span>
                    </div>
                    <div style={{
                      height: 8,
                      background: 'var(--surface-muted)',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${funnel.viewToStartRate}%`,
                        background: 'var(--primary)',
                        borderRadius: 4
                      }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Submitted</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        {funnel.submitted} ({funnel.startToSubmitRate}%)
                      </span>
                    </div>
                    <div style={{
                      height: 8,
                      background: 'var(--surface-muted)',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${funnel.startToSubmitRate}%`,
                        background: 'var(--success)',
                        borderRadius: 4
                      }} />
                    </div>
                  </div>
                </div>

                {funnel.abandoned > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Abandoned</span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{funnel.abandoned}</span>
                      </div>
                      <div style={{
                        height: 8,
                        background: 'var(--surface-muted)',
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(funnel.abandoned / funnel.viewed * 100).toFixed(0)}%`,
                          background: 'var(--danger)',
                          borderRadius: 4
                        }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="card">
            <h4 style={{ fontSize: 15, marginBottom: 12 }}>Insights & Recommendations</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              {parseFloat(analytics.conversionRate) < 5 && (
                <div style={{
                  padding: 12,
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 8,
                  fontSize: 13
                }}>
                  <strong style={{ color: 'var(--warning)' }}>⚠️ Low conversion rate</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
                    Consider A/B testing different form layouts, reducing required fields, or improving your value proposition.
                  </p>
                </div>
              )}
              
              {parseFloat(analytics.abandonRate) > 30 && (
                <div style={{
                  padding: 12,
                  background: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 8,
                  fontSize: 13
                }}>
                  <strong style={{ color: 'var(--danger)' }}>🚨 High abandon rate</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
                    Many visitors start but don't complete your form. Try reducing the number of fields or adding progress indicators.
                  </p>
                </div>
              )}

              {analytics.uniqueSessions > 0 && analytics.views / analytics.uniqueSessions > 2 && (
                <div style={{
                  padding: 12,
                  background: 'rgba(37,99,235,0.1)',
                  border: '1px solid rgba(37,99,235,0.2)',
                  borderRadius: 8,
                  fontSize: 13
                }}>
                  <strong style={{ color: 'var(--primary)' }}>💡 Multiple views per visitor</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
                    Visitors are viewing your form multiple times. Consider adding exit-intent popups or follow-up emails.
                  </p>
                </div>
              )}

              {parseFloat(analytics.conversionRate) > 15 && (
                <div style={{
                  padding: 12,
                  background: 'rgba(22,163,74,0.1)',
                  border: '1px solid rgba(22,163,74,0.2)',
                  borderRadius: 8,
                  fontSize: 13
                }}>
                  <strong style={{ color: 'var(--success)' }}>✅ Great conversion rate!</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
                    Your form is performing well. Consider using this as a template for other campaigns.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-note">No analytics data available for this form yet.</div>
      )}
    </div>
  );
}
