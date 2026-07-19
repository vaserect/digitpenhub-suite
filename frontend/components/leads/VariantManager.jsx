'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';

export default function VariantManager({ formId, onClose }) {
  const [variants, setVariants] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    variantName: '',
    fields: [],
    thankYouMessage: '',
    trafficSplit: 50,
    isActive: true
  });

  useEffect(() => {
    loadVariants();
  }, [formId]);

  async function loadVariants() {
    try {
      const [variantsRes, perfRes] = await Promise.all([
        apiFetch(`/api/v1/leads/forms/${formId}/variants`),
        apiFetch(`/api/v1/leads/forms/${formId}/variants/performance`)
      ]);
      setVariants(variantsRes.variants || []);
      setPerformance(perfRes.performance || []);
    } catch (err) {
      console.error('Failed to load variants:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateVariant(e) {
    e.preventDefault();
    try {
      await apiFetch(`/api/v1/leads/forms/${formId}/variants`, {
        method: 'POST',
        body: JSON.stringify(draft)
      });
      setShowCreate(false);
      setDraft({ variantName: '', fields: [], thankYouMessage: '', trafficSplit: 50, isActive: true });
      await loadVariants();
    } catch (err) {
      alert(err.message || 'Failed to create variant');
    }
  }

  async function handleDeleteVariant(id) {
    if (!confirm('Delete this variant? All its analytics data will be lost.')) return;
    try {
      await apiFetch(`/api/v1/leads/variants/${id}`, { method: 'DELETE' });
      await loadVariants();
    } catch (err) {
      alert(err.message || 'Failed to delete variant');
    }
  }

  async function handleToggleVariant(id, isActive) {
    try {
      await apiFetch(`/api/v1/leads/variants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !isActive })
      });
      await loadVariants();
    } catch (err) {
      alert(err.message || 'Failed to update variant');
    }
  }

  const totalTraffic = variants.reduce((sum, v) => sum + (v.traffic_split || 0), 0);
  const winner = performance.length > 0 
    ? performance.reduce((best, curr) => 
        parseFloat(curr.conversionRate) > parseFloat(best.conversionRate) ? curr : best
      )
    : null;

  if (loading) return <div className="empty-note">Loading variants...</div>;

  return (
    <div className="card" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>A/B Testing</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Test different versions to optimize conversion
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : '+ New Variant'}
          </Button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateVariant} className="card" style={{ background: 'var(--surface-muted)', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>Create Variant</h3>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '2fr 1fr', marginBottom: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Variant Name</label>
              <input
                value={draft.variantName}
                onChange={(e) => setDraft({ ...draft, variantName: e.target.value })}
                placeholder="e.g., Variant B"
                required
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Traffic Split (%)</label>
              <input
                type="number"
                value={draft.trafficSplit}
                onChange={(e) => setDraft({ ...draft, trafficSplit: parseInt(e.target.value) })}
                min="0"
                max="100"
                required
              />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Thank You Message</label>
            <input
              value={draft.thankYouMessage}
              onChange={(e) => setDraft({ ...draft, thankYouMessage: e.target.value })}
              placeholder="Custom thank you message for this variant"
            />
          </div>
          <Button type="submit">Create Variant</Button>
        </form>
      )}

      {totalTraffic !== 100 && variants.length > 0 && (
        <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          ⚠️ Traffic split totals {totalTraffic}% (should be 100%)
        </div>
      )}

      {winner && (
        <div style={{ padding: '12px 16px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <strong style={{ fontSize: 14 }}>Current Winner: {winner.variant_name}</strong>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {winner.conversionRate}% conversion rate ({winner.submits} conversions from {winner.views} views)
          </div>
        </div>
      )}

      {variants.length === 0 ? (
        <div className="empty-note">
          No variants yet. Create your first variant to start A/B testing.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {performance.map((perf) => {
            const variant = variants.find(v => v.id === perf.id);
            if (!variant) return null;
            
            return (
              <div key={variant.id} className="card" style={{ background: 'var(--surface-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 14 }}>{variant.variant_name}</strong>
                      {winner && winner.id === variant.id && <span style={{ fontSize: 16 }}>🏆</span>}
                      <span style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: variant.is_active ? 'rgba(22,163,74,0.1)' : 'rgba(100,116,139,0.1)',
                        color: variant.is_active ? 'var(--success)' : 'var(--text-muted)',
                        fontWeight: 600
                      }}>
                        {variant.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Traffic: {variant.traffic_split}%
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="ctag"
                      onClick={() => handleToggleVariant(variant.id, variant.is_active)}
                    >
                      {variant.is_active ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      className="ctag"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => handleDeleteVariant(variant.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Views</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{perf.views}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Conversions</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{perf.submits}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Conv. Rate</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{perf.conversionRate}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Unique Visitors</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{perf.uniqueVisitors}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
