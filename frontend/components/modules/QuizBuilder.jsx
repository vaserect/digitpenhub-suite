'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';

export default function QuizBuilderModule({ goHome, showToast }) {
  const [loaded, setLoaded] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [qbViewQuiz, setQbViewQuiz] = useState(null);
  const [qbStats, setQbStats] = useState(null);
  const [qbTab, setQbTab] = useState('list');
  const [qbForm, setQbForm] = useState(false);
  const [qbConfirmDelete, setQbConfirmDelete] = useState(null);
  const [qbDeleting, setQbDeleting] = useState(false);
  const [qbResponses, setQbResponses] = useState([]);
  const [qbAnalytics, setQbAnalytics] = useState([]);
  const [qbTemplates, setQbTemplates] = useState([]);
  const [qbShowTemplates, setQbShowTemplates] = useState(false);
  const [qbOutcomes, setQbOutcomes] = useState([]);
  const [qbEditingOutcome, setQbEditingOutcome] = useState(null);

  // Draft State
  const [qbDraft, setQbDraft] = useState({
    title: '',
    description: '',
    quiz_type: 'scored',
    questions: [],
    published: false,
    settings: { showScore: true, shuffleQuestions: false, timeLimit: 0 },
    lead_capture_enabled: false,
    lead_capture_position: 'end',
    lead_capture_fields: ['name', 'email'],
    social_sharing_enabled: false,
    retake_allowed: true,
    show_progress_bar: true,
    randomize_questions: false,
    randomize_answers: false,
    pass_percentage: null,
    certificate_enabled: false
  });

  const loadQuizBuilder = useCallback(async () => {
    try {
      const [stats, qz, templates] = await Promise.all([
        apiFetch('/api/v1/quiz-builder/stats'),
        apiFetch('/api/v1/quiz-builder/'),
        apiFetch('/api/v1/quiz-builder/templates/list')
      ]);
      setQbStats(stats.stats);
      setQuizzes(qz.quizzes || []);
      setQbTemplates(templates.templates || []);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadQuizBuilder();
  }, [loadQuizBuilder]);

  async function handleSaveQuiz(e) {
    e.preventDefault();
    if (!qbDraft.title.trim()) {
      showToast('Quiz title is required.');
      return;
    }
    const method = editingQuiz ? 'PUT' : 'POST';
    const url = editingQuiz ? `/api/v1/quiz-builder/${editingQuiz.id}` : '/api/v1/quiz-builder/';
    const data = await apiFetch(url, { method, body: JSON.stringify(qbDraft) });
    if (data.error) {
      showToast(data.error);
      return;
    }
    setQbForm(false);
    setEditingQuiz(null);
    setQbTab('list');
    await loadQuizBuilder();
    showToast(editingQuiz ? 'Quiz updated.' : 'Quiz created.');
  }

  function handleDeleteQuiz(id) {
    setQbConfirmDelete({ id });
  }

  async function confirmQbDelete() {
    if (!qbConfirmDelete) return;
    setQbDeleting(true);
    try {
      await apiFetch(`/api/v1/quiz-builder/${qbConfirmDelete.id}`, { method: 'DELETE' });
      setQuizzes((q) => q.filter((x) => x.id !== qbConfirmDelete.id));
      showToast('Quiz deleted.');
    } catch (err) {
      showToast('Failed to delete quiz.');
    } finally {
      setQbDeleting(false);
      setQbConfirmDelete(null);
    }
  }

  async function loadQuizResponses(quizId) {
    const data = await apiFetch(`/api/v1/quiz-builder/${quizId}/responses`).catch(() => ({ responses: [] }));
    setQbResponses(data.responses || []);
  }

  async function loadQuizAnalytics(quizId) {
    const data = await apiFetch(`/api/v1/quiz-builder/${quizId}/analytics?days=30`).catch(() => ({ analytics: [] }));
    setQbAnalytics(data.analytics || []);
  }

  function addQuizQuestion(type) {
    const q = {
      id: Date.now(),
      type,
      text: '',
      options: type === 'multiple_choice' ? ['', '', '', ''] : type === 'true_false' ? ['True', 'False'] : [],
      correct_answer: type === 'true_false' ? 'True' : 0,
      points: 10
    };
    setQbDraft((d) => ({ ...d, questions: [...d.questions, q] }));
  }

  function removeQuizQuestion(idx) {
    setQbDraft((d) => ({ ...d, questions: d.questions.filter((_, i) => i !== idx) }));
  }

  async function handleCreateFromTemplate(templateId) {
    try {
      const data = await apiFetch('/api/v1/quiz-builder/templates/create-from', {
        method: 'POST',
        body: JSON.stringify({ templateId })
      });
      if (data.error) {
        showToast(data.error);
        return;
      }
      setQbShowTemplates(false);
      await loadQuizBuilder();
      showToast('Quiz created from template!');
    } catch (err) {
      showToast('Failed to create quiz from template.');
    }
  }

  async function handleSaveOutcome(e) {
    e.preventDefault();
    const method = qbEditingOutcome?.id ? 'PUT' : 'POST';
    const url = qbEditingOutcome?.id 
      ? `/api/v1/quiz-builder/outcomes/${qbEditingOutcome.id}`
      : `/api/v1/quiz-builder/${qbViewQuiz.id}/outcomes`;
    
    try {
      const data = await apiFetch(url, { method, body: JSON.stringify(qbEditingOutcome) });
      if (data.error) {
        showToast(data.error);
        return;
      }
      setQbEditingOutcome(null);
      // Reload quiz to get updated outcomes
      const quizData = await apiFetch(`/api/v1/quiz-builder/${qbViewQuiz.id}`);
      setQbViewQuiz(quizData.quiz);
      setQbOutcomes(quizData.quiz.outcomes || []);
      showToast(qbEditingOutcome?.id ? 'Outcome updated.' : 'Outcome created.');
    } catch (err) {
      showToast('Failed to save outcome.');
    }
  }

  async function handleDeleteOutcome(outcomeId) {
    if (!confirm('Delete this outcome?')) return;
    try {
      await apiFetch(`/api/v1/quiz-builder/outcomes/${outcomeId}`, { method: 'DELETE' });
      setQbOutcomes((o) => o.filter((x) => x.id !== outcomeId));
      showToast('Outcome deleted.');
    } catch (err) {
      showToast('Failed to delete outcome.');
    }
  }

  const quizTypeOptions = [
    { value: 'scored', label: 'Scored Quiz', desc: 'Traditional quiz with right/wrong answers' },
    { value: 'personality', label: 'Personality Assessment', desc: 'Determine personality type based on answers' },
    { value: 'outcome_based', label: 'Outcome-Based', desc: 'Recommend products/services based on answers' }
  ];

  return (
    <div className="panel" style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <button className="back-link" onClick={() => qbViewQuiz ? (setQbViewQuiz(null), setQbTab('list')) : goHome()} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontWeight: 500, fontSize: '0.875rem', padding: 0, marginBottom: '0.5rem' }}>
            ← {qbViewQuiz ? 'Back to Quizzes' : 'Back to Workspace'}
          </button>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>
            {qbViewQuiz ? qbViewQuiz.title : 'Quiz Builder'}
          </h1>
          {!qbViewQuiz && (
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
              Create scored quizzes, personality assessments, and outcome-based recommendations. Benchmark: Outgrow / Interact.
            </p>
          )}
        </div>
        {!qbViewQuiz && !qbForm && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setQbShowTemplates(true)}>
              📋 Templates
            </Button>
            <Button onClick={() => { setEditingQuiz(null); setQbDraft({ title: '', description: '', quiz_type: 'scored', questions: [], published: false, settings: { showScore: true, shuffleQuestions: false, timeLimit: 0 }, lead_capture_enabled: false, lead_capture_position: 'end', lead_capture_fields: ['name', 'email'], social_sharing_enabled: false, retake_allowed: true, show_progress_bar: true, randomize_questions: false, randomize_answers: false, pass_percentage: null, certificate_enabled: false }); setQbForm(true); setQbTab('build'); }}>
              + New Quiz
            </Button>
          </div>
        )}
        {qbViewQuiz && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {qbViewQuiz.published && (
              <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/quiz/${qbViewQuiz.id}`); showToast('Quiz link copied!'); }}>
                📋 Copy Link
              </Button>
            )}
            <Button variant="ghost" onClick={() => { setEditingQuiz(qbViewQuiz); setQbDraft({ title: qbViewQuiz.title, description: qbViewQuiz.description || '', quiz_type: qbViewQuiz.quiz_type || 'scored', questions: qbViewQuiz.questions || [], published: qbViewQuiz.published || false, settings: qbViewQuiz.settings || {}, lead_capture_enabled: qbViewQuiz.lead_capture_enabled || false, lead_capture_position: qbViewQuiz.lead_capture_position || 'end', lead_capture_fields: qbViewQuiz.lead_capture_fields || ['name', 'email'], social_sharing_enabled: qbViewQuiz.social_sharing_enabled || false, retake_allowed: qbViewQuiz.retake_allowed !== false, show_progress_bar: qbViewQuiz.show_progress_bar !== false, randomize_questions: qbViewQuiz.randomize_questions || false, randomize_answers: qbViewQuiz.randomize_answers || false, pass_percentage: qbViewQuiz.pass_percentage, certificate_enabled: qbViewQuiz.certificate_enabled || false }); setQbForm(true); setQbTab('build'); }}>
              ✏️ Edit
            </Button>
            <Button variant="ghost" style={{ color: 'var(--danger)' }} onClick={() => { handleDeleteQuiz(qbViewQuiz.id); setQbViewQuiz(null); }}>
              🗑️ Delete
            </Button>
          </div>
        )}
      </div>

      {qbStats && !qbViewQuiz && !qbForm && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Quizzes</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{qbStats.total || 0}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Published</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{qbStats.published || 0}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Views</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{qbStats.total_views || 0}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completions</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{qbStats.total_responses || 0}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Completion Rate</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{Math.round(qbStats.avg_completion_rate || 0)}%</span>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {qbShowTemplates && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '2rem', maxWidth: 900, width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Quiz Templates</h2>
              <button onClick={() => setQbShowTemplates(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--muted)' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {qbTemplates.map((t) => (
                <div key={t.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{t.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>{t.description}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span className="ctag">{t.category}</span>
                    <span className="ctag">{t.quiz_type}</span>
                  </div>
                  <Button onClick={() => handleCreateFromTemplate(t.id)} style={{ width: '100%', fontSize: '0.85rem' }}>
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!qbViewQuiz ? (
        <>
          {!qbForm && (
            <div className="tab-bar" style={{ marginBottom: '1rem' }}>
              <button className={`tab-btn${qbTab === 'list' ? ' active' : ''}`} onClick={() => setQbTab('list')}>
                All Quizzes
              </button>
            </div>
          )}

          {qbTab === 'list' && !qbForm && (
            !loaded ? <p className="muted">Loading quizzes…</p> :
            quizzes.length === 0 ? <EmptyState title="No quizzes yet. Build your first one or start from a template." /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                {quizzes.map((q) => (
                  <div key={q.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text)' }}>{q.title}</div>
                    {q.description && <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>{q.description}</div>}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <span className="ctag">{q.quiz_type?.replace('_', ' ')}</span>
                      <span className="ctag">{q.question_count} questions</span>
                      <span className="ctag">{q.responses_count} responses</span>
                      <span className="ctag" style={{ color: q.published ? 'var(--success)' : 'var(--muted)' }}>{q.published ? '● Published' : '○ Draft'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={async () => { const d = await apiFetch(`/api/v1/quiz-builder/${q.id}`); setQbViewQuiz(d.quiz); setQbOutcomes(d.quiz.outcomes || []); loadQuizResponses(q.id); loadQuizAnalytics(q.id); }}>View</button>
                      <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => { setEditingQuiz(q); setQbDraft({ title: q.title, description: q.description || '', quiz_type: q.quiz_type || 'scored', questions: q.questions || [], published: q.published || false, settings: q.settings || {}, lead_capture_enabled: q.lead_capture_enabled || false, lead_capture_position: q.lead_capture_position || 'end', lead_capture_fields: q.lead_capture_fields || ['name', 'email'], social_sharing_enabled: q.social_sharing_enabled || false, retake_allowed: q.retake_allowed !== false, show_progress_bar: q.show_progress_bar !== false, randomize_questions: q.randomize_questions || false, randomize_answers: q.randomize_answers || false, pass_percentage: q.pass_percentage, certificate_enabled: q.certificate_enabled || false }); setQbForm(true); setQbTab('build'); }}>Edit</button>
                      {q.published && <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/quiz/${q.id}`); showToast('Quiz link copied!'); }}>Copy link</button>}
                      <button className="btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--danger)' }} onClick={() => handleDeleteQuiz(q.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {qbTab === 'build' && qbForm && (
            <form onSubmit={handleSaveQuiz} style={{ flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="card" style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <input className="form-input" placeholder="Quiz title *" value={qbDraft.title} onChange={(e) => setQbDraft((d) => ({ ...d, title: e.target.value }))} required style={{ width: '100%' }} />
                      <textarea className="form-input" placeholder="Description (optional)" value={qbDraft.description} onChange={(e) => setQbDraft((d) => ({ ...d, description: e.target.value }))} style={{ width: '100%', minHeight: 60 }} />
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Quiz Type</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {quizTypeOptions.map((opt) => (
                            <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', background: qbDraft.quiz_type === opt.value ? 'var(--primary-light)' : 'var(--bg)', border: `1px solid ${qbDraft.quiz_type === opt.value ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer' }}>
                              <input type="radio" name="quiz_type" value={opt.value} checked={qbDraft.quiz_type === opt.value} onChange={(e) => setQbDraft((d) => ({ ...d, quiz_type: e.target.value }))} style={{ marginTop: 2 }} />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{opt.label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{opt.desc}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Questions</h3>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="btn-ghost" style={{ fontSize: '0.8rem', border: '1px solid var(--border)' }} onClick={() => addQuizQuestion('multiple_choice')}>+ Multiple Choice</button>
                        <button type="button" className="btn-ghost" style={{ fontSize: '0.8rem', border: '1px solid var(--border)' }} onClick={() => addQuizQuestion('true_false')}>+ True/False</button>
                        <button type="button" className="btn-ghost" style={{ fontSize: '0.8rem', border: '1px solid var(--border)' }} onClick={() => addQuizQuestion('short_answer')}>+ Short Answer</button>
                      </div>
                    </div>

                    {qbDraft.questions.length === 0 ? (
                      <div style={{ padding: '2rem', border: '2px dashed var(--border)', borderRadius: 8, textAlign: 'center', color: 'var(--muted)' }}>
                        Add questions using the buttons above.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {qbDraft.questions.map((q, qi) => (
                          <div key={q.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 10, minWidth: 20 }}>Q{qi + 1}</span>
                              <textarea className="form-input" style={{ flex: 1, minHeight: 44 }} placeholder="Question text *" value={q.text} onChange={(e) => { const qs = [...qbDraft.questions]; qs[qi] = { ...qs[qi], text: e.target.value }; setQbDraft((d) => ({ ...d, questions: qs })); }} required />
                              <button type="button" className="btn-ghost" style={{ color: 'var(--danger)', fontSize: '0.75rem' }} onClick={() => removeQuizQuestion(qi)}>✕</button>
                            </div>
                            {q.type === 'multiple_choice' && q.options.map((opt, oi) => (
                              <div key={oi} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem', marginLeft: '1.5rem' }}>
                                <input type="radio" name={`correct_${q.id}`} checked={q.correct_answer === oi} onChange={() => { const qs = [...qbDraft.questions]; qs[qi] = { ...qs[qi], correct_answer: oi }; setQbDraft((d) => ({ ...d, questions: qs })); }} title="Mark as correct" />
                                <input className="form-input" style={{ flex: 1, fontSize: '0.82rem' }} placeholder={`Option ${oi + 1}`} value={opt} onChange={(e) => { const qs = [...qbDraft.questions]; qs[qi].options = [...qs[qi].options]; qs[qi].options[oi] = e.target.value; setQbDraft((d) => ({ ...d, questions: qs })); }} required />
                              </div>
                            ))}
                            {q.type === 'true_false' && (
                              <div style={{ marginLeft: '1.5rem', fontSize: '0.82rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>Correct Answer:</span>
                                <select value={q.correct_answer} onChange={(e) => { const qs = [...qbDraft.questions]; qs[qi] = { ...qs[qi], correct_answer: e.target.value }; setQbDraft((d) => ({ ...d, questions: qs })); }} style={{ fontSize: '0.82rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }}>
                                  <option value="True">True</option>
                                  <option value="False">False</option>
                                </select>
                              </div>
                            )}
                            {q.type === 'short_answer' && <div style={{ marginLeft: '1.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>Open-ended — no auto-scoring</div>}
                            {qbDraft.quiz_type === 'scored' && (q.type === 'multiple_choice' || q.type === 'true_false') && (
                              <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>Points:</span>
                                <input type="number" min="1" value={q.points || 10} onChange={(e) => { const qs = [...qbDraft.questions]; qs[qi] = { ...qs[qi], points: parseInt(e.target.value) || 10 }; setQbDraft((d) => ({ ...d, questions: qs })); }} style={{ width: 60, fontSize: '0.82rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Settings</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qbDraft.published} onChange={(e) => setQbDraft((d) => ({ ...d, published: e.target.checked }))} />
                      Published (Public)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qbDraft.show_progress_bar} onChange={(e) => setQbDraft((d) => ({ ...d, show_progress_bar: e.target.checked }))} />
                      Show progress bar
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qbDraft.randomize_questions} onChange={(e) => setQbDraft((d) => ({ ...d, randomize_questions: e.target.checked }))} />
                      Randomize questions
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qbDraft.randomize_answers} onChange={(e) => setQbDraft((d) => ({ ...d, randomize_answers: e.target.checked }))} />
                      Randomize answers
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qbDraft.retake_allowed} onChange={(e) => setQbDraft((d) => ({ ...d, retake_allowed: e.target.checked }))} />
                      Allow retakes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qbDraft.social_sharing_enabled} onChange={(e) => setQbDraft((d) => ({ ...d, social_sharing_enabled: e.target.checked }))} />
                      Enable social sharing
                    </label>
                    {qbDraft.quiz_type === 'scored' && (
                      <>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={qbDraft.settings.showScore} onChange={(e) => setQbDraft((d) => ({ ...d, settings: { ...d.settings, showScore: e.target.checked } }))} />
                          Show score after submit
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={qbDraft.certificate_enabled} onChange={(e) => setQbDraft((d) => ({ ...d, certificate_enabled: e.target.checked }))} />
                          Issue certificate on pass
                        </label>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Pass percentage (%)</label>
                          <input type="number" className="form-input" min={0} max={100} value={qbDraft.pass_percentage || ''} onChange={(e) => setQbDraft((d) => ({ ...d, pass_percentage: e.target.value ? parseInt(e.target.value) : null }))} style={{ width: '100%' }} placeholder="e.g. 70" />
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Lead Capture</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={qbDraft.lead_capture_enabled} onChange={(e) => setQbDraft((d) => ({ ...d, lead_capture_enabled: e.target.checked }))} />
                      Enable lead capture
                    </label>
                    {qbDraft.lead_capture_enabled && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Capture position</label>
                          <select value={qbDraft.lead_capture_position} onChange={(e) => setQbDraft((d) => ({ ...d, lead_capture_position: e.target.value }))} style={{ width: '100%', fontSize: '0.85rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px' }}>
                            <option value="start">Before quiz</option>
                            <option value="end">After quiz</option>
                            <option value="both">Before & after</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Fields to capture</label>
                          {['name', 'email', 'phone', 'company'].map((field) => (
                            <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '0.25rem' }}>
                              <input type="checkbox" checked={qbDraft.lead_capture_fields.includes(field)} onChange={(e) => {
                                const fields = e.target.checked 
                                  ? [...qbDraft.lead_capture_fields, field]
                                  : qbDraft.lead_capture_fields.filter(f => f !== field);
                                setQbDraft((d) => ({ ...d, lead_capture_fields: fields }));
                              }} />
                              {field.charAt(0).toUpperCase() + field.slice(1)}
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Button type="submit">{editingQuiz ? 'Update' : 'Save'} Quiz</Button>
                    <Button variant="ghost" type="button" onClick={() => { setQbForm(false); setEditingQuiz(null); setQbTab('list'); }}>Cancel</Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </>
      ) : (
        <>
          <div className="tab-bar" style={{ marginBottom: '1rem' }}>
            <button className={`tab-btn${qbTab === 'list' || qbTab === 'view' ? ' active' : ''}`} onClick={() => setQbTab('list')}>
              Questions ({qbViewQuiz.questions?.length || 0})
            </button>
            <button className={`tab-btn${qbTab === 'outcomes' ? ' active' : ''}`} onClick={() => setQbTab('outcomes')}>
              Outcomes ({qbOutcomes.length})
            </button>
            <button className={`tab-btn${qbTab === 'responses' ? ' active' : ''}`} onClick={() => setQbTab('responses')}>
              Responses ({qbViewQuiz.responses_count || 0})
            </button>
            <button className={`tab-btn${qbTab === 'analytics' ? ' active' : ''}`} onClick={() => setQbTab('analytics')}>
              Analytics
            </button>
          </div>

          {qbTab === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(qbViewQuiz.questions || []).map((q, i) => (
                <div key={q.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Q{i + 1}: {q.text}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Type: {q.type?.replace(/_/g, ' ')}</div>
                  {q.options?.map((o, oi) => (
                    <div key={oi} style={{ fontSize: '0.85rem', padding: '3px 0', color: oi === Number(q.correct_answer) ? 'var(--success)' : 'var(--text)' }}>
                      {oi === Number(q.correct_answer) ? '✓ ' : '○ '}{o}
                    </div>
                  ))}
                  {q.type === 'true_false' && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 500 }}>
                      Correct Answer: {q.correct_answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {qbTab === 'outcomes' && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <Button onClick={() => setQbEditingOutcome({ title: '', description: '', min_score: 0, max_score: 100, cta_text: '', cta_url: '' })}>
                  + Add Outcome
                </Button>
              </div>
              
              {qbEditingOutcome && (
                <form onSubmit={handleSaveOutcome} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>
                    {qbEditingOutcome.id ? 'Edit Outcome' : 'New Outcome'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input className="form-input" placeholder="Outcome title *" value={qbEditingOutcome.title} onChange={(e) => setQbEditingOutcome((o) => ({ ...o, title: e.target.value }))} required />
                    <textarea className="form-input" placeholder="Description" value={qbEditingOutcome.description || ''} onChange={(e) => setQbEditingOutcome((o) => ({ ...o, description: e.target.value }))} style={{ minHeight: 80 }} />
                    
                    {qbViewQuiz.quiz_type === 'scored' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Min Score</label>
                          <input type="number" className="form-input" value={qbEditingOutcome.min_score || 0} onChange={(e) => setQbEditingOutcome((o) => ({ ...o, min_score: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Max Score</label>
                          <input type="number" className="form-input" value={qbEditingOutcome.max_score || 100} onChange={(e) => setQbEditingOutcome((o) => ({ ...o, max_score: parseInt(e.target.value) || 100 }))} />
                        </div>
                      </div>
                    )}
                    
                    {qbViewQuiz.quiz_type === 'personality' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Personality Type</label>
                        <input className="form-input" placeholder="e.g. analytical_leader" value={qbEditingOutcome.personality_type || ''} onChange={(e) => setQbEditingOutcome((o) => ({ ...o, personality_type: e.target.value }))} />
                      </div>
                    )}
                    
                    {qbViewQuiz.quiz_type === 'outcome_based' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Outcome Key</label>
                        <input className="form-input" placeholder="e.g. starter_plan" value={qbEditingOutcome.outcome_key || ''} onChange={(e) => setQbEditingOutcome((o) => ({ ...o, outcome_key: e.target.value }))} />
                      </div>
                    )}
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Call-to-Action Text</label>
                      <input className="form-input" placeholder="e.g. Get Started" value={qbEditingOutcome.cta_text || ''} onChange={(e) => setQbEditingOutcome((o) => ({ ...o, cta_text: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Call-to-Action URL</label>
                      <input className="form-input" placeholder="e.g. /pricing" value={qbEditingOutcome.cta_url || ''} onChange={(e) => setQbEditingOutcome((o) => ({ ...o, cta_url: e.target.value }))} />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Button type="submit">{qbEditingOutcome.id ? 'Update' : 'Create'} Outcome</Button>
                      <Button variant="ghost" type="button" onClick={() => setQbEditingOutcome(null)}>Cancel</Button>
                    </div>
                  </div>
                </form>
              )}
              
              {qbOutcomes.length === 0 ? (
                <EmptyState title="No outcomes defined yet. Add outcomes to show custom results based on quiz performance." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {qbOutcomes.map((outcome) => (
                    <div key={outcome.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{outcome.title}</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setQbEditingOutcome(outcome)}>Edit</button>
                          <button className="btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--danger)' }} onClick={() => handleDeleteOutcome(outcome.id)}>Delete</button>
                        </div>
                      </div>
                      {outcome.description && <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>{outcome.description}</div>}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {outcome.min_score !== null && outcome.max_score !== null && (
                          <span className="ctag">Score: {outcome.min_score}-{outcome.max_score}</span>
                        )}
                        {outcome.personality_type && <span className="ctag">Type: {outcome.personality_type}</span>}
                        {outcome.outcome_key && <span className="ctag">Key: {outcome.outcome_key}</span>}
                        {outcome.cta_text && <span className="ctag">CTA: {outcome.cta_text}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {qbTab === 'responses' && (
            qbResponses.length === 0 ? <EmptyState title="No responses yet." /> : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Respondent</th>
                      <th>Score</th>
                      {qbViewQuiz.quiz_type === 'personality' && <th>Personality</th>}
                      {qbViewQuiz.quiz_type !== 'scored' && <th>Outcome</th>}
                      <th>Time Spent</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qbResponses.map((r) => (
                      <tr key={r.id}>
                        <td>
                          {r.respondent_name || 'Anonymous'}
                          {r.respondent_email && <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{r.respondent_email}</div>}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {r.max_score > 0 ? `${r.score}/${r.max_score} (${Math.round((r.score / r.max_score) * 100)}%)` : 'N/A'}
                        </td>
                        {qbViewQuiz.quiz_type === 'personality' && (
                          <td><span className="ctag">{r.personality_type || 'N/A'}</span></td>
                        )}
                        {qbViewQuiz.quiz_type !== 'scored' && (
                          <td>{r.outcome_title || 'N/A'}</td>
                        )}
                        <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                          {r.time_spent ? `${Math.floor(r.time_spent / 60)}m ${r.time_spent % 60}s` : 'N/A'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                          {new Date(r.completed_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {qbTab === 'analytics' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Views</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{qbViewQuiz.views_count || 0}</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Starts</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{qbViewQuiz.starts_count || 0}</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Completions</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{qbViewQuiz.responses_count || 0}</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Completion Rate</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{Math.round(qbViewQuiz.completion_rate || 0)}%</div>
                </div>
              </div>

              {qbAnalytics.length > 0 && (
                <div className="card" style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Daily Performance (Last 30 Days)</h3>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Views</th>
                          <th>Starts</th>
                          <th>Completions</th>
                          <th>Avg Score</th>
                          <th>Avg Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qbAnalytics.map((a) => (
                          <tr key={a.date}>
                            <td>{new Date(a.date).toLocaleDateString()}</td>
                            <td>{a.views || 0}</td>
                            <td>{a.starts || 0}</td>
                            <td>{a.completions || 0}</td>
                            <td>{a.avg_score ? Math.round(a.avg_score) : 'N/A'}</td>
                            <td>{a.avg_completion_time ? `${Math.floor(a.avg_completion_time / 60)}m` : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!qbConfirmDelete}
        onClose={() => setQbConfirmDelete(null)}
        onConfirm={confirmQbDelete}
        title="Delete this quiz?"
        description="This can't be undone."
        confirmLabel="Delete"
        danger
        loading={qbDeleting}
      />
    </div>
  );
}