'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Layers,
  Activity,
  TrendingUp,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  XCircle,
  Plus,
  Search,
  Code,
  Sparkles,
  Share2,
  ExternalLink,
  ChevronRight,
  Trash2,
  Edit,
  Info
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

export default function ABTestingStudio() {
  const { user } = useAuth();
  
  // Navigation / Views State
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'detail'
  const [loading, setLoading] = useState(true);

  // A/B Testing Data States
  const [experiments, setExperiments] = useState([]);
  const [selectedExpId, setSelectedExpId] = useState(null);
  const [selectedExpDetail, setSelectedExpDetail] = useState(null);

  // Forms / Modals States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  
  // Form Fields
  const [experimentForm, setExperimentForm] = useState({
    name: '',
    description: '',
    target_type: 'landing_page',
    target_url: '/home',
    goal_type: 'click',
    traffic_split: 50,
    content_changes_a: '{"headline": "Welcome to our shop!"}',
    content_changes_b: '{"headline": "Get 20% discount today!"}'
  });

  // Traffic & Conversion Simulation State
  const [simCount, setSimCount] = useState(10);
  const [simulating, setSimulating] = useState(false);

  // Load All Experiments
  const loadExperiments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/v1/ab-testing/experiments');
      if (res.success) setExperiments(res.data);
    } catch (error) {
      console.error('Error loading A/B experiments:', error);
      toast.error('Failed to load A/B experiments catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]);

  // Load detailed analytics for selected experiment
  const loadExperimentDetail = async (id) => {
    try {
      const res = await apiFetch(`/api/v1/ab-testing/experiments/${id}/analytics`);
      if (res.success) {
        setSelectedExpDetail(res.data);
        setSelectedExpId(id);
        setActiveTab('detail');
      }
    } catch (error) {
      toast.error('Failed to load experiment stats.');
    }
  };

  // Create Experiment Submit
  const handleCreateExperiment = async (e) => {
    e.preventDefault();
    try {
      let parsedA = {};
      let parsedB = {};
      try {
        parsedA = JSON.parse(experimentForm.content_changes_a);
        parsedB = JSON.parse(experimentForm.content_changes_b);
      } catch (err) {
        toast.error('Invalid JSON structure inside content variations fields.');
        return;
      }

      const res = await apiFetch('/api/v1/ab-testing/experiments', {
        method: 'POST',
        body: JSON.stringify({
          name: experimentForm.name,
          description: experimentForm.description,
          target_type: experimentForm.target_type,
          target_url: experimentForm.target_url,
          goal_type: experimentForm.goal_type,
          traffic_split: parseInt(experimentForm.traffic_split),
          content_changes_a: parsedA,
          content_changes_b: parsedB
        })
      });

      if (res.success) {
        toast.success('A/B experiment created and variations seeded!');
        setIsCreateModalOpen(false);
        setExperimentForm({
          name: '',
          description: '',
          target_type: 'landing_page',
          target_url: '/home',
          goal_type: 'click',
          traffic_split: 50,
          content_changes_a: '{"headline": "Welcome to our shop!"}',
          content_changes_b: '{"headline": "Get 20% discount today!"}'
        });
        await loadExperiments();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create experiment.');
    }
  };

  // Change Experiment Status (running, paused, completed)
  const handleUpdateStatus = async (status) => {
    try {
      const res = await apiFetch(`/api/v1/ab-testing/experiments/${selectedExpId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.success) {
        toast.success(`Experiment status updated to: ${status}`);
        await loadExperimentDetail(selectedExpId);
        await loadExperiments();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update experiment status.');
    }
  };

  // Declare Champion Variation manually
  const handleDeclareWinner = async (variationId) => {
    try {
      const res = await apiFetch(`/api/v1/ab-testing/experiments/${selectedExpId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed', champion_variation_id: variationId })
      });
      if (res.success) {
        toast.success('Champion successfully declared! Experiment paused.');
        await loadExperimentDetail(selectedExpId);
        await loadExperiments();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to declare champion.');
    }
  };

  // Delete Experiment
  const handleDeleteExperiment = async (id) => {
    if (!confirm('Are you sure you want to delete this A/B experiment?')) return;
    try {
      const res = await apiFetch(`/api/v1/ab-testing/experiments/${id}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Experiment deleted successfully.');
        setActiveTab('list');
        await loadExperiments();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete experiment.');
    }
  };

  // Simulate traffic & conversions split routing (Sandbox tool)
  const handleSimulateTraffic = async (e) => {
    e.preventDefault();
    setSimulating(true);
    toast.info(`Simulating ${simCount} routing sessions...`);

    try {
      for (let i = 0; i < simCount; i++) {
        // Step 1: Call public routing endpoint to split traffic
        const routeRes = await apiFetch(`/api/v1/ab-testing/public/route/${selectedExpId}`);
        if (routeRes.success) {
          const { variation_id } = routeRes.data;
          
          // Step 2: Randomly trigger conversion based on mock weight probabilities (e.g. 5% A, 12% B)
          const isA = routeRes.data.name.includes('Variation A');
          const convThreshold = isA ? 5 : 12; // Simulate variant B outperforming control A
          const roll = Math.floor(Math.random() * 100);

          if (roll < convThreshold) {
            await apiFetch(`/api/v1/ab-testing/public/conversion/${selectedExpId}/${variation_id}`, { method: 'POST' });
          }
        }
      }
      toast.success('Simulation batch complete! Analytics recalculated.');
      setIsSimulateModalOpen(false);
      await loadExperimentDetail(selectedExpId);
    } catch (error) {
      console.error(error);
      toast.error('Simulation iteration encountered errors.');
    } finally {
      setSimulating(false);
    }
  };

  // Status Colors Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'running': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'info';
      default: return 'neutral';
    }
  };

  if (loading && activeTab === 'list') {
    return (
      <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading Creative A/B Testing Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🧪</span> Creative A/B Testing Studio
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Compare headline copywriting, colors, or page designs. Route users randomly and evaluate Z-Score significance.
          </p>
        </div>
        {activeTab === 'list' ? (
          <Button onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Create Experiment
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => { setActiveTab('list'); loadExperiments(); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={16} /> Back to Experiments
          </Button>
        )}
      </div>

      {/* VIEW: Experiments list */}
      {activeTab === 'list' && (
        <>
          {experiments.length === 0 ? (
            <EmptyState
              title="No A/B tests active"
              description="Deploy a headline or layout variation experiment on your pages to evaluate visitor click rates and sign-up conversions."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {experiments.map((exp) => (
                <div key={exp.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Badge type={getStatusBadge(exp.status)}>{exp.status.toUpperCase()}</Badge>
                      <Badge type="neutral">{exp.target_type.replace('_', ' ').toUpperCase()}</Badge>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{exp.name}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineBreak: 'anywhere' }}>{exp.description}</p>
                    
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Goal:</span> {exp.goal_type.toUpperCase()}
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Split Weight:</span> {exp.traffic_split}% B
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <Button variant="secondary" onClick={() => loadExperimentDetail(exp.id)} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                      View Realtime Stats
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteExperiment(exp.id)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* VIEW: Experiment Details & Live Stats */}
      {activeTab === 'detail' && selectedExpDetail && (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Status Box & Controls */}
          <div className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{selectedExpDetail.experiment.name}</h2>
                <Badge type={getStatusBadge(selectedExpDetail.experiment.status)}>{selectedExpDetail.experiment.status.toUpperCase()}</Badge>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedExpDetail.experiment.description}</p>
            </div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              {selectedExpDetail.experiment.status === 'running' ? (
                <Button variant="secondary" onClick={() => handleUpdateStatus('paused')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PauseCircle size={16} /> Pause Split Test
                </Button>
              ) : selectedExpDetail.experiment.status !== 'completed' ? (
                <Button onClick={() => handleUpdateStatus('running')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PlayCircle size={16} /> Resume Split Test
                </Button>
              ) : null}
              
              <Button variant="secondary" onClick={() => setIsSimulateModalOpen(true)}>
                🧪 Run Traffic Simulator
              </Button>
            </div>
          </div>

          {/* Statistical Significance Champion Banner */}
          {selectedExpDetail.stats.significant && (
            <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)', border: '1px solid var(--success)', borderRadius: 8, display: 'flex', gap: 16, alignItems: 'center' }}>
              <Sparkles size={36} style={{ color: 'var(--success)' }} />
              <div>
                <h3 style={{ margin: 0, color: 'var(--success)', fontWeight: 700 }}>Winner Detected with Statistical Significance!</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                  Variation B is outperforming Control A with <strong>{selectedExpDetail.stats.confidence}% confidence</strong> (p-value: {selectedExpDetail.stats.pValue}). You can declare the champion variant below to pause the split test.
                </p>
              </div>
            </div>
          )}

          {/* Core Analytics Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {selectedExpDetail.variations.map((v, idx) => {
              const isControl = idx === 0;
              const isWinner = selectedExpDetail.experiment.champion_variation_id === v.id;
              
              return (
                <div key={v.id} className="card" style={{ padding: 20, position: 'relative', border: isWinner ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                  {isWinner && (
                    <div style={{ position: 'absolute', top: -12, right: 16, background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600 }}>
                      DECLARED CHAMPION
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{v.name}</span>
                    <Badge type={isControl ? 'neutral' : 'info'}>{isControl ? 'CONTROL' : 'TREATMENT'}</Badge>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visitors (Views)</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4 }}>{v.views}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conversions ({selectedExpDetail.experiment.goal_type.toUpperCase()})</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4 }}>{v.conversions}</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conversion Rate</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>
                        {v.conversion_rate}%
                      </div>
                    </div>
                    
                    {!isControl && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Improvement</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: v.improvement >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: 2 }}>
                          {v.improvement >= 0 ? '+' : ''}{v.improvement}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Variation JSON Payload Preview */}
                  <div style={{ marginTop: 14, background: 'var(--surface-muted)', padding: 10, borderRadius: 6 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Code size={12} /> JSON Payload Patch
                    </div>
                    <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', overflowX: 'auto' }}>
                      {JSON.stringify(v.content_changes, null, 2)}
                    </pre>
                  </div>

                  {/* Winner Declaration Action button */}
                  {selectedExpDetail.experiment.status !== 'completed' && (
                    <Button variant="secondary" onClick={() => handleDeclareWinner(v.id)} style={{ width: '100%', marginTop: 14, padding: '6px 12px', fontSize: '0.8rem' }}>
                      Declare Winner & Conclude Test
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Public Integration Scripts & Snippets guidance */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Code size={18} style={{ color: 'var(--primary)' }} /> Developer integration instructions
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Embed our split testing routing endpoint in your client-side header script to dynamically load headlines, colors or images:
            </p>
            <div style={{ background: 'var(--surface-muted)', padding: 14, borderRadius: 8, fontFamily: 'monospace', fontSize: '0.8rem', display: 'grid', gap: 8 }}>
              <div>// Step 1: Fetch the A/B variation payload dynamically on page load</div>
              <div style={{ color: 'var(--primary)' }}>
                fetch('https://suite.digitpenhub.com/api/v1/ab-testing/public/route/{selectedExpId}')
              </div>
              <div style={{ paddingLeft: 12 }}>.then(res =&gt; res.json())</div>
              <div style={{ paddingLeft: 12 }}>.then(data =&gt; &#123;</div>
              <div style={{ paddingLeft: 24 }}>// Apply headline from variant patch</div>
              <div style={{ paddingLeft: 24 }}>document.getElementById('headline').innerText = data.data.content_changes.headline;</div>
              <div style={{ paddingLeft: 24 }}>// Save variation_id for conversions hook</div>
              <div style={{ paddingLeft: 24 }}>window.abVariantId = data.data.variation_id;</div>
              <div style={{ paddingLeft: 12 }}>&#125;);</div>
              
              <div style={{ marginTop: 12 }}>// Step 2: Trigger goal conversion endpoint on CTA click</div>
              <div style={{ color: 'var(--primary)' }}>
                fetch(`https://suite.digitpenhub.com/api/v1/ab-testing/public/conversion/{selectedExpId}/&#36;&#123;window.abVariantId&#125;`, &#123; method: 'POST' &#125;)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE EXPERIMENT */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New A/B Experiment">
        <form onSubmit={handleCreateExperiment} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Experiment Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Landing Page Headline Split"
              value={experimentForm.name}
              onChange={e => setExperimentForm({ ...experimentForm, name: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Description</label>
            <input
              type="text"
              placeholder="e.g. Evaluating if promotions drive more clicks"
              value={experimentForm.description}
              onChange={e => setExperimentForm({ ...experimentForm, description: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Target Element</label>
              <select
                value={experimentForm.target_type}
                onChange={e => setExperimentForm({ ...experimentForm, target_type: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="landing_page">Landing Page</option>
                <option value="email">Email Campaign</option>
                <option value="cta_button">CTA Button</option>
                <option value="custom">Custom Selector</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Target URL</label>
              <input
                type="text"
                required
                placeholder="e.g. /home"
                value={experimentForm.target_url}
                onChange={e => setExperimentForm({ ...experimentForm, target_url: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Goal Metric</label>
              <select
                value={experimentForm.goal_type}
                onChange={e => setExperimentForm({ ...experimentForm, goal_type: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="click">CTA Clicks</option>
                <option value="pageview">Page Views</option>
                <option value="form_submit">Form Submissions</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Traffic Split Ratio (B)</label>
              <select
                value={experimentForm.traffic_split}
                onChange={e => setExperimentForm({ ...experimentForm, traffic_split: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="10">10% Treatment / 90% Control</option>
                <option value="25">25% Treatment / 75% Control</option>
                <option value="50">50% Treatment / 50% Control</option>
                <option value="75">75% Treatment / 25% Control</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Control (A) Changes JSON</label>
            <textarea
              rows="3"
              required
              value={experimentForm.content_changes_a}
              onChange={e => setExperimentForm({ ...experimentForm, content_changes_a: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.85rem', fontFamily: 'monospace' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Treatment (B) Changes JSON</label>
            <textarea
              rows="3"
              required
              value={experimentForm.content_changes_b}
              onChange={e => setExperimentForm({ ...experimentForm, content_changes_b: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.85rem', fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Experiment</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: TRAFFIC SIMULATOR */}
      <Modal isOpen={isSimulateModalOpen} onClose={() => setIsSimulateModalOpen(false)} title="Sandbox Split Traffic Simulator">
        <form onSubmit={handleSimulateTraffic} style={{ display: 'grid', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Generates random sessions routing between variants. Control has a 5% baseline conversion rate; Treatment has a 12% conversion rate. Running multiple sessions will dynamically compute statistical significance.
            </p>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Traffic Sessions Count</label>
            <input
              type="number"
              required
              min="1"
              max="500"
              value={simCount}
              onChange={e => setSimCount(parseInt(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsSimulateModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={simulating}>
              {simulating ? 'Simulating...' : 'Run Simulation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
