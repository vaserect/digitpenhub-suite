'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { 
  GitBranch, Plus, Trash2, Edit2, Layers, DollarSign, Calendar, 
  ArrowRight, RefreshCw, BarChart3, TrendingUp, UserPlus
} from 'lucide-react';

export default function PipelineDealsPage() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [stages, setStages] = useState([]);
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedDealId, setDraggedDealId] = useState(null);

  // Modals & Forms
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [deletingDealId, setDeletingDealId] = useState(null);

  const [dealDraft, setDealDraft] = useState({
    name: '',
    amount: 0,
    probability: 50,
    expectedCloseDate: '',
    description: '',
    contactId: '',
    stageId: ''
  });

  useEffect(() => {
    loadPipelines();
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedPipeline) {
      loadPipelineData(selectedPipeline.id);
    }
  }, [selectedPipeline]);

  const loadPipelines = async () => {
    try {
      const res = await apiFetch('/api/v1/crm/pipelines');
      if (res.success && res.data) {
        setPipelines(res.data);
        const def = res.data.find((p) => p.is_default) || res.data[0];
        setSelectedPipeline(def || null);
      }
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      toast.error('Failed to load pipelines');
    }
  };

  const loadContacts = async () => {
    try {
      const res = await apiFetch('/api/v1/crm'); // Lists CRM contacts
      if (res.success && res.data) {
        setContacts(res.data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const loadPipelineData = async (pipelineId) => {
    setLoading(true);
    try {
      // 1. Get stages
      const stagesRes = await apiFetch(`/api/v1/crm/pipelines/${pipelineId}/stages`);
      const fetchedStages = stagesRes.success ? stagesRes.data : [];
      setStages(fetchedStages);

      // 2. Get deals
      const dealsRes = await apiFetch(`/api/v1/crm/deals?pipelineId=${pipelineId}&limit=100`);
      setDeals(dealsRes.success ? dealsRes.data : []);
    } catch (error) {
      console.error('Error fetching pipeline details:', error);
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateDeal = async (e) => {
    e.preventDefault();
    try {
      if (editingDeal) {
        // Update deal
        const res = await apiFetch(`/api/v1/crm/deals/${editingDeal.id}`, {
          method: 'PUT',
          body: JSON.stringify(dealDraft)
        });
        if (res.success) {
          toast.success('Deal updated successfully!');
          setShowDealModal(false);
          setEditingDeal(null);
          loadPipelineData(selectedPipeline.id);
        }
      } else {
        // Create deal
        const res = await apiFetch('/api/v1/crm/deals', {
          method: 'POST',
          body: JSON.stringify({
            ...dealDraft,
            pipelineId: selectedPipeline.id
          })
        });
        if (res.success) {
          toast.success('Deal created successfully!');
          setShowDealModal(false);
          loadPipelineData(selectedPipeline.id);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save deal');
    }
  };

  const handleUpdateStage = async (dealId, stageId) => {
    try {
      const res = await apiFetch(`/api/v1/crm/deals/${dealId}/stage`, {
        method: 'PUT',
        body: JSON.stringify({ stageId })
      });
      if (res.success) {
        toast.success('Deal stage updated!');
        // Optimistic UI updates
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage_id: stageId } : d));
      }
    } catch (error) {
      toast.error('Failed to update deal stage');
      loadPipelineData(selectedPipeline.id);
    }
  };

  const handleDeleteDeal = async () => {
    if (!deletingDealId) return;
    try {
      const res = await apiFetch(`/api/v1/crm/deals/${deletingDealId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        toast.success('Deal deleted.');
        setDeletingDealId(null);
        loadPipelineData(selectedPipeline.id);
      }
    } catch (error) {
      toast.error('Failed to delete deal');
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e, dealId) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, stageId) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (dealId) {
      await handleUpdateStage(dealId, stageId);
    }
    setDraggedDealId(null);
  };

  // KPI calculations
  const calculateKPIs = () => {
    const activeDeals = deals.filter(d => !d.is_archived);
    const totalValue = activeDeals.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const avgSize = activeDeals.length > 0 ? totalValue / activeDeals.length : 0;
    
    // Win rate = Won deals / Closed deals
    const wonCount = deals.filter(d => {
      const stage = stages.find(s => s.id === d.stage_id);
      return stage?.is_closed_won;
    }).length;
    const closedCount = deals.filter(d => {
      const stage = stages.find(s => s.id === d.stage_id);
      return stage?.is_closed_won || stage?.is_closed_lost;
    }).length;
    const winRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0;

    const forecast = activeDeals.reduce((sum, d) => {
      const stage = stages.find(s => s.id === d.stage_id);
      const prob = d.probability != null ? d.probability : (stage?.probability || 0);
      return sum + (parseFloat(d.amount || 0) * prob) / 100;
    }, 0);

    return { totalValue, avgSize, winRate, forecast, count: activeDeals.length };
  };

  const kpis = calculateKPIs();

  return (
    <div className="module-wrap">
      <div className="module-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="back-link" onClick={() => window.location.href = '/'}>← Back</button>
          <GitBranch className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold">Pipeline & Deals</h2>
        </div>
        
        {pipelines.length > 1 && (
          <select 
            className="form-input" 
            value={selectedPipeline?.id || ''} 
            onChange={(e) => {
              const p = pipelines.find(pl => pl.id === e.target.value);
              setSelectedPipeline(p);
            }}
            style={{ width: '200px' }}
          >
            {pipelines.map(pl => (
              <option key={pl.id} value={pl.id}>{pl.name}</option>
            ))}
          </select>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="ghost" size="sm" onClick={() => selectedPipeline && loadPipelineData(selectedPipeline.id)}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="primary" onClick={() => {
            if (stages.length === 0) {
              toast.error('Add stages to the pipeline first!');
              return;
            }
            setDealDraft({
              name: '',
              amount: 0,
              probability: 50,
              expectedCloseDate: '',
              description: '',
              contactId: '',
              stageId: stages[0].id
            });
            setEditingDeal(null);
            setShowDealModal(true);
          }}>
            <Plus className="w-4 h-4 mr-1" /> Add Deal
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
        <StatCard label="Pipeline Value" value={`₦${kpis.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
        <StatCard label="Forecasted Value" value={`₦${kpis.forecast.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
        <StatCard label="Avg Deal Size" value={`₦${kpis.avgSize.toLocaleString(undefined, {minimumFractionDigits: 0})}`} />
        <StatCard label="Deal Win Rate" value={`${kpis.winRate.toFixed(1)}%`} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted">Retrieving pipelines and forecast boards...</p>
        </div>
      ) : stages.length === 0 ? (
        <EmptyState title="No stages configured for this pipeline." />
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${stages.length}, minmax(280px, 1fr))`, 
          gap: '1rem', 
          overflowX: 'auto', 
          paddingBottom: '1rem',
          alignItems: 'flex-start'
        }}>
          {stages.map(stage => {
            const stageDeals = deals.filter(d => d.stage_id === stage.id && !d.is_archived);
            const stageTotalAmount = stageDeals.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

            return (
              <div 
                key={stage.id} 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '70vh'
                }}
              >
                {/* Column header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: stage.color || '#3b82f6' }}></span>
                      {stage.name}
                    </h3>
                    <span className="text-xs text-muted">{stageDeals.length} Deal{stageDeals.length === 1 ? '' : 's'}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    ₦{stageTotalAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </span>
                </div>

                {/* Cards container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, padding: '0.1rem' }}>
                  {stageDeals.length === 0 ? (
                    <div style={{ border: '2px dashed var(--border)', borderRadius: '6px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Drag deals here
                    </div>
                  ) : (
                    stageDeals.map(deal => (
                      <div 
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        style={{ 
                          background: 'var(--bg)', 
                          border: '1px solid var(--border)', 
                          borderRadius: '6px', 
                          padding: '0.75rem', 
                          cursor: 'grab',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                        className="hover:shadow-md transition-shadow"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h4 className="font-bold text-sm" style={{ margin: 0 }}>{deal.name}</h4>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className="btn-ghost btn-sm" style={{ padding: '0.1rem' }} onClick={() => {
                              setDealDraft({
                                name: deal.name,
                                amount: parseFloat(deal.amount || 0),
                                probability: deal.probability || stage.probability || 50,
                                expectedCloseDate: deal.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
                                description: deal.description || '',
                                contactId: deal.contact_id || '',
                                stageId: deal.stage_id
                              });
                              setEditingDeal(deal);
                              setShowDealModal(true);
                            }}>
                              <Edit2 className="w-3 h-3 text-muted" />
                            </button>
                            <button className="btn-ghost btn-sm text-danger" style={{ padding: '0.1rem' }} onClick={() => setDeletingDealId(deal.id)}>
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
                            ₦{parseFloat(deal.amount || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
                          </span>
                          <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                            {deal.probability || stage.probability}%
                          </span>
                        </div>

                        {deal.expected_close_date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Close: {new Date(deal.expected_close_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT DEAL MODAL */}
      <Modal isOpen={showDealModal} onClose={() => setShowDealModal(false)} title={editingDeal ? 'Modify Deal Info' : 'Log New Deal'}>
        <form onSubmit={handleCreateOrUpdateDeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Deal Name / Opportunity</label>
            <input 
              type="text" 
              className="form-input w-full" 
              placeholder="e.g. Acme Corp Enterprise License" 
              value={dealDraft.name}
              onChange={(e) => setDealDraft(prev => ({ ...prev, name: e.target.value }))}
              required 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Deal Amount (₦)</label>
              <input 
                type="number" 
                className="form-input w-full" 
                value={dealDraft.amount}
                onChange={(e) => setDealDraft(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                required 
              />
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Stage</label>
              <select 
                className="form-input w-full"
                value={dealDraft.stageId}
                onChange={(e) => setDealDraft(prev => ({ ...prev, stageId: e.target.value }))}
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Win Probability (%)</label>
              <input 
                type="number" 
                className="form-input w-full" 
                min="0"
                max="100"
                value={dealDraft.probability}
                onChange={(e) => setDealDraft(prev => ({ ...prev, probability: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Expected Close Date</label>
              <input 
                type="date" 
                className="form-input w-full" 
                value={dealDraft.expectedCloseDate}
                onChange={(e) => setDealDraft(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
              />
            </div>
          </div>

          {contacts.length > 0 && (
            <div>
              <label className="text-xs text-muted font-bold uppercase mb-1 block">Associated CRM Contact</label>
              <select 
                className="form-input w-full"
                value={dealDraft.contactId}
                onChange={(e) => setDealDraft(prev => ({ ...prev, contactId: e.target.value }))}
              >
                <option value="">None / External Prospect</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.company || 'Individual'})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-muted font-bold uppercase mb-1 block">Notes / Description</label>
            <textarea 
              className="form-input w-full" 
              placeholder="Provide background, customer pain points, or conversation summaries..."
              value={dealDraft.description}
              onChange={(e) => setDealDraft(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', justifyEnd: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setShowDealModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Opportunity</Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingDealId}
        onClose={() => setDeletingDealId(null)}
        onConfirm={handleDeleteDeal}
        title="Delete Opportunity"
        message="Are you sure you want to permanently delete this deal? This action is irreversible."
      />
    </div>
  );
}
