'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function QuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/quiz-builder/public/${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else { setQuiz(d.quiz); setQuestions(d.questions || []); } })
      .catch(() => setError('Could not load quiz.'));
  }, [id]);

  async function handleSubmit() {
    try {
      const r = await fetch(`/api/v1/quiz-builder/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const d = await r.json();
      setSubmitted(true);
      setScore(d.score || d);
    } catch { setError('Failed to submit.'); }
  }

  if (error) {
    return (
      <div className="state-viewport">
        <div className="state-panel is-danger">
          <div className="state-icon">⚠️</div>
          <div className="state-title">Quiz not found</div>
          <p className="state-description">{error}</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="state-viewport">
        <div className="state-panel">
          <div className="state-spinner" />
          <div className="state-title">Loading quiz…</div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="state-viewport">
        <div className="state-panel is-success">
          <div className="state-icon">🎉</div>
          <div className="state-title">Quiz complete!</div>
          {score && <p className="state-description">You scored {score.correct || 0}/{score.total || questions.length}</p>}
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="state-viewport">
      <div className="state-panel" style={{maxWidth:520,textAlign:'left'}}>
        <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:12}}>
          Question {current + 1} of {questions.length}
        </div>
        <div className="state-title" style={{fontSize:'1.05rem',marginBottom:16}}>{q?.title || q?.question || 'Question'}</div>
        {(q?.options || []).map((opt, i) => (
          <label key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',margin:'4px 0',background:'var(--surface-muted)',borderRadius:10,cursor:'pointer',fontSize:'0.9rem',border: answers[q.id] === opt ? '2px solid var(--primary)' : '2px solid transparent'}}>
            <input type="radio" name="answer" checked={answers[q.id] === opt} onChange={() => setAnswers({...answers, [q.id]: opt})} style={{accentColor:'var(--primary)'}} />
            {opt}
          </label>
        ))}
        <div style={{display:'flex',justifyContent:'space-between',marginTop:20}}>
          <button className="back-link" style={{margin:0}} disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>← Previous</button>
          {current < questions.length - 1
            ? <button className="ctag" style={{padding:'8px 16px'}} onClick={() => setCurrent(c => c + 1)}>Next →</button>
            : <button className="primary-btn" onClick={handleSubmit} disabled={!answers[q?.id]}>Submit</button>
          }
        </div>
      </div>
    </div>
  );
}
