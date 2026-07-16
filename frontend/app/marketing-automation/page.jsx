'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import TabBar from '../../components/ui/TabBar';

const TABS = [
  { key: 'workflows', label: 'Workflows' },
  { key: 'enrollments', label: 'Enrollments' },
];

const STEP_TYPES = [
  { value: 'send_email', label: 'Send Email', icon: '📧', description: 'Send an email to the contact' },
  { value: 'add_tag', label: 'Add Tag', icon: '🏷️', description: 'Add a tag to the contact' },
  { value: 'remove_tag', label: 'Remove Tag', icon: '🗑️', description: 'Remove a tag from the contact' },
  { value: 'add_to_list', label: 'Add to List', icon: '📋', description: 'Add contact to an email list' },
  { value: 'webhook', label: 'Webhook', icon: '🔗', description: 'Send data to an external URL' },
  { value: 'wait_days', label: 'Wait', icon: '⏰', description: 'Wait for a specified number of days' },
];

const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manual', description: 'Manually enroll contacts' },
  { value: 'new_subscriber', label: 'New Subscriber', description: 'When someone subscribes to a list' },
  { value: 'tag_added', label: 'Tag Added', description: 'When a specific tag is added' },
  { value: 'form_submitted', label: 'Form Submitted', description: 'When a form is submitted' },
];

export default function MarketingAutomationPage() {
  const router = useRouter();
  const [tab, setTab] = useState('workflows');
  const [workflows, setWorkflows] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [emailLists, setEmailLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  // Workflow management
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [workflowForm, setWorkflowForm] = useState({ name: '', triggerType: 'manual', triggerConfig: {}, status: 'draft' });
  const [deleteWorkflowId, setDeleteWorkflowId] = useState(null);

  // Workflow builder
  const [builderWorkflow, setBuilderWorkflow] = useState(null);
  const [builderSteps, setBuilderSteps] = useState([]);
  const [showStepForm, setShowStepForm] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [stepForm, setStepForm] = useState({ stepType: 'send_email', config: {} });
  const [deleteStepId, setDeleteStepId] = useState(null);

  // Enrollment management
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState({ workflowId: '', contactEmail: '', contactName: '' });
  const [viewEnrollment, setViewEnrollment] = useState(null);
  const [enrollmentRuns, setEnrollmentRuns] = useState([]);
  const [deleteEnrollmentId, setDeleteEnrollmentId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [w, e, s, lists] = await Promise.all([
        apiFetch('/api/v1/automation/workflows').catch(() => ({ workflows: [] })),
        apiFetch('/api/v1/automation/enrollments').catch(() => ({ enrollments: [] })),
        apiFetch('/api/v1/automation/stats').catch(() => ({ workflows: {}, enrollments: {} })),
        apiFetch('/api/v1/email-marketing/lists').catch(() => ({ lists: [] })),
      ]);
      setWorkflows(w.workflows || []);
      setEnrollments(e.enrollments || []);
      setStats(s || {});
      setEmailLists(lists.lists || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Workflow Management ──────────────────────────────────────────────────

  function openWorkflowForm(workflow = null) {
    if (workflow) {
      setEditingWorkflow(workflow);
      setWorkflowForm({
        name: workflow.name || '',
        triggerType: workflow.trigger_type || 'manual',
        triggerConfig: workflow.trigger_config || {},
        status: workflow.status || 'draft',
      });
    } else {
      setEditingWorkflow(null);
      setWorkflowForm({ name: '', triggerType: 'manual', triggerConfig: {}, status: 'draft' });
    }
    setShowWorkflowForm(true);
  }

  async function handleSaveWorkflow(e) {
    e.preventDefault();
    if (!workflowForm.name.trim()) {
      toast.error('Workflow name is required');
      return;
    }

    try {
      const method = editingWorkflow ? 'PUT' : 'POST';
      const url = editingWorkflow ? `/api/v1/automation/workflows/${editingWorkflow.id}` : '/api/v1/automation/workflows';
      await apiFetch(url, { method, body: JSON.stringify(workflowForm) });
      toast.success(editingWorkflow ? 'Workflow updated!' : 'Workflow created!');
      setShowWorkflowForm(false);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to save workflow');
    }
  }

  async function handleDeleteWorkflow() {
    if (!deleteWorkflowId) return;
    try {
      await apiFetch(`/api/v1/automation/workflows/${deleteWorkflowId}`, { method: 'DELETE' });
      toast.success('Workflow deleted');
      setDeleteWorkflowId(null);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete workflow');
    }
  }

  async function toggleWorkflowStatus(workflow) {
    const newStatus = workflow.status === 'active' ? 'draft' : 'active';
    try {
      await apiFetch(`/api/v1/automation/workflows/${workflow.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Workflow ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to update workflow status');
    }
  }

  // ── Workflow Builder ─────────────────────────────────────────────────────

  async function openBuilder(workflow) {
    try {
      const data = await apiFetch(`/api/v1/automation/workflows/${workflow.id}/steps`);
      setBuilderWorkflow(workflow);
      setBuilderSteps(data.steps || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load workflow steps');
    }
  }

  function closeBuilder() {
    setBuilderWorkflow(null);
    setBuilderSteps([]);
  }

  function openStepForm(step = null) {
    if (step) {
      setEditingStep(step);
      setStepForm({
        stepType: step.step_type || 'send_email',
        config: step.config || {},
      });
    } else {
      setEditingStep(null);
      setStepForm({ stepType: 'send_email', config: {} });
    }
    setShowStepForm(true);
  }

  async function handleSaveStep(e) {
    e.preventDefault();
    if (!builderWorkflow) return;

    try {
      const method = editingStep ? 'PUT' : 'POST';
      const url = editingStep
        ? `/api/v1/automation/steps/${editingStep.id}`
        : `/api/v1/automation/workflows/${builderWorkflow.id}/steps`;
      
      await apiFetch(url, { method, body: JSON.stringify(stepForm) });
      toast.success(editingStep ? 'Step updated!' : 'Step added!');
      setShowStepForm(false);
      
      // Reload steps
      const data = await apiFetch(`/api/v1/automation/workflows/${builderWorkflow.id}/steps`);
      setBuilderSteps(data.steps || []);
    } catch (err) {
      toast.error(err.message || 'Failed to save step');
    }
  }

  async function handleDeleteStep() {
    if (!deleteStepId) return;
    try {
      await apiFetch(`/api/v1/automation/steps/${deleteStepId}`, { method: 'DELETE' });
      toast.success('Step deleted');
      setDeleteStepId(null);
      
      // Reload steps
      if (builderWorkflow) {
        const data = await apiFetch(`/api/v1/automation/workflows/${builderWorkflow.id}/steps`);
        setBuilderSteps(data.steps || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete step');
    }
  }

  async function moveStep(step, direction) {
    const currentIndex = builderSteps.findIndex(s => s.id === step.id);
    if (currentIndex === -1) return;
    
    const newOrder = direction === 'up' ? step.step_order - 1 : step.step_order + 1;
    if (newOrder < 1 || newOrder > builderSteps.length) return;

    try {
      await apiFetch(`/api/v1/automation/steps/${step.id}`, {
        method: 'PUT',
        body: JSON.stringify({ stepOrder: newOrder }),
      });
      
      // Reload steps
      const data = await apiFetch(`/api/v1/automation/workflows/${builderWorkflow.id}/steps`);
      setBuilderSteps(data.steps || []);
    } catch (err) {
      toast.error(err.message || 'Failed to reorder step');
    }
  }

  // ── Enrollment Management ────────────────────────────────────────────────

  function openEnrollmentForm() {
    setEnrollmentForm({
      workflowId: workflows.find(w => w.status === 'active')?.id || '',
      contactEmail: '',
      contactName: '',
    });
    setShowEnrollmentForm(true);
  }

  async function handleSaveEnrollment(e) {
    e.preventDefault();
    if (!enrollmentForm.workflowId || !enrollmentForm.contactEmail.trim()) {
      toast.error('Workflow and contact email are required');
      return;
    }

    try {
      await apiFetch('/api/v1/automation/enrollments', {
        method: 'POST',
        body: JSON.stringify(enrollmentForm),
      });
      toast.success('Contact enrolled!');
      setShowEnrollmentForm(false);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to enroll contact');
    }
  }

  async function viewEnrollmentDetails(enrollment) {
    try {
      const data = await apiFetch(`/api/v1/automation/enrollments/${enrollment.id}/runs`);
      setViewEnrollment(enrollment);
      setEnrollmentRuns(data.runs || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load enrollment details');
    }
  }

  async function updateEnrollmentStatus(enrollmentId, status) {
    try {
      await apiFetch(`/api/v1/automation/enrollments/${enrollmentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      toast.success(`Enrollment ${status}`);
      await load();
      if (viewEnrollment?.id === enrollmentId) {
        setViewEnrollment(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update enrollment');
    }
  }

  async function handleDeleteEnrollment() {
    if (!deleteEnrollmentId) return;
    try {
      await apiFetch(`/api/v1/automation/enrollments/${deleteEnrollmentId}`, { method: 'DELETE' });
      toast.success('Enrollment deleted');
      setDeleteEnrollmentId(null);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete enrollment');
    }
  }

  // ── Step Configuration Helpers ───────────────────────────────────────────

  function renderStepConfigForm() {
    const { stepType, config } = stepForm;

    switch (stepType) {
      case 'send_email':
        return (
          <>
            <div className="field">
              <label className="field-label">Subject *</label>
              <input
                className="field-input"
                value={config.subject || ''}
                onChange={e => setStepForm({ ...stepForm, config: { ...config, subject: e.target.value } })}
                placeholder="Email subject"
                required
              />
            </div>
            <div className="field">
              <label className="field-label">Body *</label>
              <textarea
                className="field-textarea"
                rows={6}
                value={config.body || ''}
                onChange={e => setStepForm({ ...stepForm, config: { ...config, body: e.target.value } })}
                placeholder="Email body (HTML supported)"
                required
              />
            </div>
            <div className="field">
              <label className="field-label">From Name</label>
              <input
                className="field-input"
                value={config.fromName || ''}
                onChange={e => setStepForm({ ...stepForm, config: { ...config, fromName: e.target.value } })}
                placeholder="Sender name (optional)"
              />
            </div>
          </>
        );

      case 'add_tag':
      case 'remove_tag':
        return (
          <div className="field">
            <label className="field-label">Tag Name *</label>
            <input
              className="field-input"
              value={config.tag || ''}
              onChange={e => setStepForm({ ...stepForm, config: { ...config, tag: e.target.value } })}
              placeholder="Enter tag name"
              required
            />
          </div>
        );

      case 'add_to_list':
        return (
          <div className="field">
            <label className="field-label">Email List *</label>
            <select
              className="field-select"
              value={config.listId || ''}
              onChange={e => setStepForm({ ...stepForm, config: { ...config, listId: e.target.value } })}
              required
            >
              <option value="">Select a list</option>
              {emailLists.map(list => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>
          </div>
        );

      case 'webhook':
        return (
          <>
            <div className="field">
              <label className="field-label">Webhook URL *</label>
              <input
                className="field-input"
                type="url"
                value={config.url || ''}
                onChange={e => setStepForm({ ...stepForm, config: { ...config, url: e.target.value } })}
                placeholder="https://example.com/webhook"
                required
              />
            </div>
            <div className="field">
              <label className="field-label">Method</label>
              <select
                className="field-select"
                value={config.method || 'POST'}
                onChange={e => setStepForm({ ...stepForm, config: { ...config, method: e.target.value } })}
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
          </>
        );

      case 'wait_days':
        return (
          <div className="field">
            <label className="field-label">Wait Days *</label>
            <input
              className="field-input"
              type="number"
              min="1"
              max="365"
              value={config.days || 1}
              onChange={e => setStepForm({ ...stepForm, config: { ...config, days: parseInt(e.target.value) || 1 } })}
              required
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Number of days to wait before proceeding to the next step
            </p>
          </div>
        );

      default:
        return null;
    }
  }

  function getStepIcon(stepType) {
    return STEP_TYPES.find(t => t.value === stepType)?.icon || '📌';
  }

  function getStepLabel(stepType) {
    return STEP_TYPES.find(t => t.value === stepType)?.label || stepType;
  }

  function getStepSummary(step) {
    const { step_type, config } = step;
    switch (step_type) {
      case 'send_email':
        return config?.subject || 'No subject';
      case 'add_tag':
        return `Add: ${config?.tag || 'No tag'}`;
      case 'remove_tag':
        return `Remove: ${config?.tag || 'No tag'}`;
      case 'add_to_list': {
        const list = emailLists.find(l => l.id === config?.listId);
        return list?.name || 'No list selected';
      }
      case 'webhook':
        return config?.url || 'No URL';
      case 'wait_days':
        return `${config?.days || 1} day(s)`;
      default:
        return '';
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/')}>← Back</button>
      
      <div className="module-head">
        <h1>Marketing Automation</h1>
        <p className="module-sub">Automate emails, tags, and actions based on triggers.</p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <span className="stat-pill">
          Workflows: <strong>{workflows.length}</strong>
        </span>
        <span className="stat-pill">
          Active: <strong>{workflows.filter(w => w.status === 'active').length}</strong>
        </span>
        <span className="stat-pill">
          Enrollments: <strong>{enrollments.length}</strong>
        </span>
        <span className="stat-pill">
          Active Enrollments: <strong>{enrollments.filter(e => e.status === 'active').length}</strong>
        </span>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {loading ? (
        <SkeletonRows rows={3} />
      ) : tab === 'workflows' ? (
        <div>
          <Button onClick={() => openWorkflowForm()} style={{ margin: '16px 0' }}>
            + New Workflow
          </Button>

          {workflows.length === 0 ? (
            <EmptyState
              icon="⚡"
              title="No workflows yet"
              description="Create your first automation workflow to get started"
              action={<Button onClick={() => openWorkflowForm()}>+ New Workflow</Button>}
            />
          ) : (
            <div className="card-shell">
              {workflows.map(w => (
                <div key={w.id} className="card" style={{ padding: '16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{w.name}</h3>
                        <Badge variant={w.status === 'active' ? 'success' : 'neutral'}>
                          {w.status || 'draft'}
                        </Badge>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                        Trigger: {TRIGGER_TYPES.find(t => t.value === w.trigger_type)?.label || w.trigger_type}
                        {' · '}
                        {w.enrollment_count || 0} enrollment(s)
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openBuilder(w)}
                        title="Edit workflow steps"
                      >
                        🔧 Build
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWorkflowStatus(w)}
                        title={w.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {w.status === 'active' ? '⏸️' : '▶️'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openWorkflowForm(w)}
                        title="Edit workflow"
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteWorkflowId(w.id)}
                        title="Delete workflow"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <Button onClick={openEnrollmentForm} style={{ margin: '16px 0' }}>
            + Enroll Contact
          </Button>

          {enrollments.length === 0 ? (
            <EmptyState
              icon="👤"
              title="No enrollments yet"
              description="Enroll contacts into active workflows"
              action={<Button onClick={openEnrollmentForm}>+ Enroll Contact</Button>}
            />
          ) : (
            <div className="card-shell">
              {enrollments.map(e => (
                <div key={e.id} className="card" style={{ padding: '16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{e.contact_email}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {e.workflow_name || 'Unknown workflow'}
                        {' · '}
                        Step {e.current_step || 0}
                        {' · '}
                        <Badge variant={e.status === 'active' ? 'success' : 'neutral'}>
                          {e.status}
                        </Badge>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewEnrollmentDetails(e)}
                        title="View details"
                      >
                        👁️
                      </Button>
                      {e.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateEnrollmentStatus(e.id, 'paused')}
                          title="Pause"
                        >
                          ⏸️
                        </Button>
                      )}
                      {e.status === 'paused' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateEnrollmentStatus(e.id, 'active')}
                          title="Resume"
                        >
                          ▶️
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteEnrollmentId(e.id)}
                        title="Delete"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workflow Form Modal */}
      {showWorkflowForm && (
        <Modal
          isOpen
          title={editingWorkflow ? 'Edit Workflow' : 'New Workflow'}
          onClose={() => setShowWorkflowForm(false)}
        >
          <form onSubmit={handleSaveWorkflow} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label className="field-label">Workflow Name *</label>
              <input
                className="field-input"
                value={workflowForm.name}
                onChange={e => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                placeholder="e.g., Welcome Series"
                required
              />
            </div>

            <div className="field">
              <label className="field-label">Trigger Type *</label>
              <select
                className="field-select"
                value={workflowForm.triggerType}
                onChange={e => setWorkflowForm({ ...workflowForm, triggerType: e.target.value })}
              >
                {TRIGGER_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {TRIGGER_TYPES.find(t => t.value === workflowForm.triggerType)?.description}
              </p>
            </div>

            <div className="field">
              <label className="field-label">Status</label>
              <select
                className="field-select"
                value={workflowForm.status}
                onChange={e => setWorkflowForm({ ...workflowForm, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button onClick={() => setShowWorkflowForm(false)} variant="ghost">
                Cancel
              </Button>
              <Button type="submit">
                {editingWorkflow ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Workflow Builder Modal */}
      {builderWorkflow && (
        <Modal
          isOpen
          title={`Build: ${builderWorkflow.name}`}
          onClose={closeBuilder}
          wide
        >
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Trigger: {TRIGGER_TYPES.find(t => t.value === builderWorkflow.trigger_type)?.label}
              {' · '}
              {builderSteps.length} step(s)
            </p>
            <Button onClick={() => openStepForm()} size="sm">
              + Add Step
            </Button>
          </div>

          {builderSteps.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No steps yet"
              description="Add steps to build your automation workflow"
              action={<Button onClick={() => openStepForm()}>+ Add Step</Button>}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {builderSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="card"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 20 }}>{getStepIcon(step.step_type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      #{step.step_order} {getStepLabel(step.step_type)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {getStepSummary(step)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(step, 'up')}
                        title="Move up"
                      >
                        ↑
                      </Button>
                    )}
                    {index < builderSteps.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(step, 'down')}
                        title="Move down"
                      >
                        ↓
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openStepForm(step)}
                      title="Edit"
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteStepId(step.id)}
                      title="Delete"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <Button onClick={closeBuilder} variant="ghost">
              Close Builder
            </Button>
          </div>
        </Modal>
      )}

      {/* Step Form Modal */}
      {showStepForm && (
        <Modal
          isOpen
          title={editingStep ? 'Edit Step' : 'Add Step'}
          onClose={() => setShowStepForm(false)}
        >
          <form onSubmit={handleSaveStep} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label className="field-label">Step Type *</label>
              <select
                className="field-select"
                value={stepForm.stepType}
                onChange={e => setStepForm({ stepType: e.target.value, config: {} })}
                disabled={!!editingStep}
              >
                {STEP_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {STEP_TYPES.find(t => t.value === stepForm.stepType)?.description}
              </p>
            </div>

            {renderStepConfigForm()}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button onClick={() => setShowStepForm(false)} variant="ghost">
                Cancel
              </Button>
              <Button type="submit">
                {editingStep ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Enrollment Form Modal */}
      {showEnrollmentForm && (
        <Modal
          isOpen
          title="Enroll Contact"
          onClose={() => setShowEnrollmentForm(false)}
        >
          <form onSubmit={handleSaveEnrollment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label className="field-label">Workflow *</label>
              <select
                className="field-select"
                value={enrollmentForm.workflowId}
                onChange={e => setEnrollmentForm({ ...enrollmentForm, workflowId: e.target.value })}
                required
              >
                <option value="">Select a workflow</option>
                {workflows.filter(w => w.status === 'active').map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label">Contact Email *</label>
              <input
                className="field-input"
                type="email"
                value={enrollmentForm.contactEmail}
                onChange={e => setEnrollmentForm({ ...enrollmentForm, contactEmail: e.target.value })}
                placeholder="contact@example.com"
                required
              />
            </div>

            <div className="field">
              <label className="field-label">Contact Name</label>
              <input
                className="field-input"
                value={enrollmentForm.contactName}
                onChange={e => setEnrollmentForm({ ...enrollmentForm, contactName: e.target.value })}
                placeholder="John Doe (optional)"
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button onClick={() => setShowEnrollmentForm(false)} variant="ghost">
                Cancel
              </Button>
              <Button type="submit">
                Enroll
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Enrollment Details Modal */}
      {viewEnrollment && (
        <Modal
          isOpen
          title={`Enrollment: ${viewEnrollment.contact_email}`}
          onClose={() => setViewEnrollment(null)}
          wide
        >
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              Workflow: {viewEnrollment.workflow_name}
              {' · '}
              Current Step: {viewEnrollment.current_step || 0}
              {' · '}
              Status: <Badge variant={viewEnrollment.status === 'active' ? 'success' : 'neutral'}>
                {viewEnrollment.status}
              </Badge>
            </p>
          </div>

          <h4 style={{ marginBottom: 12 }}>Execution History</h4>
          {enrollmentRuns.length === 0 ? (
            <EmptyState icon="📋" title="No execution history yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {enrollmentRuns.map(run => (
                <div
                  key={run.id}
                  className="card"
                  style={{ padding: '12px 16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 20 }}>{getStepIcon(run.step_type)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        {getStepLabel(run.step_type)}
                        {' '}
                        <Badge variant={run.ok ? 'success' : 'danger'}>
                          {run.ok ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {run.note || 'No details'}
                        {' · '}
                        {new Date(run.ran_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <Button onClick={() => setViewEnrollment(null)} variant="ghost">
              Close
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Workflow Confirmation */}
      {deleteWorkflowId && (
        <Modal
          isOpen
          title="Delete Workflow"
          onClose={() => setDeleteWorkflowId(null)}
        >
          <p style={{ marginBottom: 16 }}>
            Are you sure you want to delete this workflow? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button onClick={() => setDeleteWorkflowId(null)} variant="ghost">
              Cancel
            </Button>
            <Button onClick={handleDeleteWorkflow} variant="danger">
              Delete
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Step Confirmation */}
      {deleteStepId && (
        <Modal
          isOpen
          title="Delete Step"
          onClose={() => setDeleteStepId(null)}
        >
          <p style={{ marginBottom: 16 }}>
            Are you sure you want to delete this step?
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button onClick={() => setDeleteStepId(null)} variant="ghost">
              Cancel
            </Button>
            <Button onClick={handleDeleteStep} variant="danger">
              Delete
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Enrollment Confirmation */}
      {deleteEnrollmentId && (
        <Modal
          isOpen
          title="Delete Enrollment"
          onClose={() => setDeleteEnrollmentId(null)}
        >
          <p style={{ marginBottom: 16 }}>
            Are you sure you want to delete this enrollment?
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button onClick={() => setDeleteEnrollmentId(null)} variant="ghost">
              Cancel
            </Button>
            <Button onClick={handleDeleteEnrollment} variant="danger">
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}