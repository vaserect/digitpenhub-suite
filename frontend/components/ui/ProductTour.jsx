'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';

/**
 * Interactive product tour component.
 * Usage: <ProductTour moduleSlug="crm" />
 * Renders a floating modal with step-by-step guidance.
 */
export default function ProductTour({ moduleSlug, onComplete }) {
  const [tour, setTour] = useState(null);
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!moduleSlug || dismissed) return;
    apiFetch(`/api/v1/onboarding/tours/${moduleSlug}`)
      .then(d => { if (d.tour) setTour(d.tour); })
      .catch(() => {});
  }, [moduleSlug, dismissed]);

  if (!tour || !tour.steps?.length || dismissed) return null;

  const current = tour.steps[step] || {};
  const isLast = step >= tour.steps.length - 1;

  const handleNext = async () => {
    if (isLast) {
      await apiFetch(`/api/v1/onboarding/tours/${tour.id}/complete`, { method: 'POST' }).catch(() => {});
      setDismissed(true);
      onComplete?.();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = async () => {
    await apiFetch(`/api/v1/onboarding/tours/${tour.id}/dismiss`, { method: 'POST' }).catch(() => {});
    setDismissed(true);
  };

  return (
    <div className="tour-overlay" style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      padding: 20, width: 340, animation: 'animate-fade-in-up .25s ease',
    }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {tour.steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= step ? 'var(--primary)' : 'var(--border)',
            transition: 'background .2s ease',
          }} />
        ))}
      </div>

      {/* Step content */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{current.title}</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{current.content}</p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={handleSkip} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, color: 'var(--text-muted)', padding: 0,
        }}>Skip tour</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
            {step + 1} of {tour.steps.length}
          </span>
          <button onClick={handleNext} className="btn btn-primary btn-sm">
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
