'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function QuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  
  // Onboarding details
  const [started, setStarted] = useState(false);
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/quiz-builder/public/${id}`)
      .then(r => r.json())
      .then(d => { 
        if (d.error) {
          setError(d.error); 
        } else { 
          setQuiz(d.quiz); 
          setQuestions(d.quiz.questions || []); 
        } 
      })
      .catch(() => setError('Could not load quiz.'));
  }, [id]);

  async function handleSubmit() {
    try {
      const payloadAnswers = questions.map((q) => {
        return { answer: answers[q.id] !== undefined ? answers[q.id] : '' };
      });

      const r = await fetch(`/api/v1/quiz-builder/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers: payloadAnswers,
          respondentName: respondentName.trim() || null,
          respondentEmail: respondentEmail.trim() || null
        }),
      });
      const d = await r.json();
      if (d.error) {
        setError(d.error);
        return;
      }
      setSubmitted(true);
      setScore({ correct: d.score, total: d.maxScore || questions.length });
    } catch { 
      setError('Failed to submit.'); 
    }
  }

  if (error) {
    return (
      <div className="state-viewport" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-muted)' }}>
        <div className="state-panel is-danger" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'2.5rem', maxWidth:420, textAlign:'center', boxShadow:'0 10px 30px rgba(0,0,0,0.05)' }}>
          <div className="state-icon" style={{ fontSize:'3rem', marginBottom:12 }}>⚠️</div>
          <div className="state-title" style={{ fontSize:'1.4rem', fontWeight:700, marginBottom:8 }}>Quiz not found</div>
          <p className="state-description" style={{ color:'var(--muted)', fontSize:'0.9rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="state-viewport" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-muted)' }}>
        <div className="state-panel" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'2.5rem', maxWidth:420, textAlign:'center', boxShadow:'0 10px 30px rgba(0,0,0,0.05)' }}>
          <div className="state-spinner" style={{ border:'4px solid var(--border)', borderTop:'4px solid var(--primary)', borderRadius:'50%', width:36, height:36, margin:'0 auto 12px', animation:'spin 1s linear infinite' }} />
          <div className="state-title" style={{ fontSize:'1.1rem', fontWeight:600 }}>Loading quiz…</div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="state-viewport" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-muted)', padding:'1rem' }}>
        <div className="state-panel is-success" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'3rem', maxWidth:480, width:'100%', boxShadow:'0 20px 40px rgba(0,0,0,0.08)', textAlign:'center' }}>
          <div className="state-icon" style={{ fontSize:'3.5rem', marginBottom:16 }}>🎉</div>
          <h2 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:8 }}>Quiz complete!</h2>
          <p style={{ color:'var(--muted)', fontSize:'0.95rem', marginBottom:20 }}>Thank you for participating.</p>
          {score && (
            <div style={{ background:'var(--bg-muted)', border:'1px solid var(--border)', borderRadius:10, padding:'1rem 1.5rem', display:'inline-block', marginBottom:24 }}>
              <div style={{ fontSize:'0.8rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Your Score</div>
              <div style={{ fontSize:'2.2rem', fontWeight:800, color:'var(--primary)' }}>
                {score.correct} <span style={{ fontSize:'1.2rem', color:'var(--muted)', fontWeight:400 }}>/ {score.total}</span>
              </div>
              <div style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--success)', marginTop:4 }}>
                {score.total > 0 ? `${Math.round((score.correct / score.total) * 100)}%` : 'N/A'}
              </div>
            </div>
          )}
          <div style={{ fontSize:'0.75rem', color:'var(--muted)' }}>
            Powered by Digitpen Hub Suite
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="state-viewport" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-muted)', padding:'1rem' }}>
        <div className="state-panel" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'2.5rem', maxWidth:480, width:'100%', boxShadow:'0 20px 40px rgba(0,0,0,0.08)', textAlign:'center' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg, var(--primary), var(--accent))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', color:'#fff', margin:'0 auto 16px' }}>
            📝
          </div>
          <h2 style={{ fontSize:'1.4rem', fontWeight:700, marginBottom:8 }}>{quiz.title}</h2>
          {quiz.description && <p style={{ color:'var(--muted)', fontSize:'0.9rem', marginBottom:24, lineHeight:1.5 }}>{quiz.description}</p>}
          
          <div style={{ textAlign:'left', marginBottom:24 }}>
            <h4 style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--muted)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>Enter your details to begin:</h4>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <input 
                type="text" 
                placeholder="Full Name (optional)" 
                value={respondentName} 
                onChange={(e) => setRespondentName(e.target.value)} 
                className="form-input" 
                style={{ width:'100%' }}
              />
              <input 
                type="email" 
                placeholder="Email Address (optional)" 
                value={respondentEmail} 
                onChange={(e) => setRespondentEmail(e.target.value)} 
                className="form-input" 
                style={{ width:'100%' }}
              />
            </div>
          </div>

          <button onClick={() => setStarted(true)} className="btn-primary" style={{ width:'100%', padding:'12px', borderRadius:8, fontWeight:600, fontSize:'0.95rem' }}>
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="state-viewport" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-muted)', padding:'1rem' }}>
      <div className="state-panel" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'2.5rem', maxWidth:540, width:'100%', boxShadow:'0 20px 40px rgba(0,0,0,0.08)', textAlign:'left' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <span style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
            Question {current + 1} of {questions.length}
          </span>
          <span style={{ fontSize:'0.75rem', color:'var(--muted)' }}>
            {quiz.title}
          </span>
        </div>

        <div className="state-title" style={{ fontSize:'1.15rem', fontWeight:700, marginBottom:20, color:'var(--text)', lineHeight:1.4 }}>
          {q?.text || 'Question'}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
          {q?.type === 'multiple_choice' && (q.options || []).map((opt, oi) => (
            <label 
              key={oi} 
              style={{
                display:'flex',
                alignItems:'center',
                gap:12,
                padding:'12px 14px',
                background: answers[q.id] === oi ? 'var(--primary-light)' : 'var(--bg-muted)',
                borderRadius:10,
                cursor:'pointer',
                fontSize:'0.9rem',
                border: answers[q.id] === oi ? '1px solid var(--primary)' : '1px solid var(--border)',
                transition:'all 0.2s ease',
                fontWeight: answers[q.id] === oi ? 600 : 400
              }}
            >
              <input 
                type="radio" 
                name={`q-${q.id}`} 
                checked={answers[q.id] === oi} 
                onChange={() => setAnswers({...answers, [q.id]: oi})} 
                style={{ accentColor:'var(--primary)', width:16, height:16 }} 
              />
              {opt}
            </label>
          ))}

          {q?.type === 'true_false' && ['True', 'False'].map((opt) => (
            <label 
              key={opt} 
              style={{
                display:'flex',
                alignItems:'center',
                gap:12,
                padding:'12px 14px',
                background: answers[q.id] === opt ? 'var(--primary-light)' : 'var(--bg-muted)',
                borderRadius:10,
                cursor:'pointer',
                fontSize:'0.9rem',
                border: answers[q.id] === opt ? '1px solid var(--primary)' : '1px solid var(--border)',
                transition:'all 0.2s ease',
                fontWeight: answers[q.id] === opt ? 600 : 400
              }}
            >
              <input 
                type="radio" 
                name={`q-${q.id}`} 
                checked={answers[q.id] === opt} 
                onChange={() => setAnswers({...answers, [q.id]: opt})} 
                style={{ accentColor:'var(--primary)', width:16, height:16 }} 
              />
              {opt}
            </label>
          ))}

          {q?.type === 'short_answer' && (
            <textarea 
              placeholder="Type your answer here..." 
              value={answers[q.id] || ''} 
              onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})} 
              className="form-input" 
              style={{ width:'100%', minHeight:100, borderRadius:10, padding:12 }}
            />
          )}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--border)', paddingTop:20 }}>
          <button 
            className="btn-ghost" 
            disabled={current === 0} 
            onClick={() => setCurrent(c => c - 1)}
            style={{ padding:'8px 16px', borderRadius:8, fontSize:'0.85rem' }}
          >
            ← Previous
          </button>
          
          {current < questions.length - 1 ? (
            <button 
              className="btn-primary" 
              onClick={() => setCurrent(c => c + 1)}
              disabled={answers[q?.id] === undefined || (q?.type === 'short_answer' && !answers[q?.id]?.trim())}
              style={{ padding:'8px 20px', borderRadius:8, fontSize:'0.85rem', fontWeight:600 }}
            >
              Next →
            </button>
          ) : (
            <button 
              className="btn-primary" 
              onClick={handleSubmit} 
              disabled={answers[q?.id] === undefined || (q?.type === 'short_answer' && !answers[q?.id]?.trim())}
              style={{ padding:'8px 24px', borderRadius:8, fontSize:'0.85rem', fontWeight:700, background:'var(--success)', border:'none' }}
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
