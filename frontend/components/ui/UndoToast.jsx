'use client';

import { useEffect, useState, useCallback } from 'react';

let _undoHandler = null;

export function setUndoHandler(fn) {
  _undoHandler = fn;
}

export function showUndoToast(message, onUndo, duration = 5000) {
  if (_undoHandler) _undoHandler(message, onUndo, duration);
}

export default function UndoToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [undoFn, setUndoFn] = useState(null);
  const [progress, setProgress] = useState(100);
  const timerRef = useState(null);
  const progressRef = useState(null);

  useEffect(() => {
    _undoHandler = (msg, fn, dur) => {
      if (timerRef[0]) clearTimeout(timerRef[0]);
      if (progressRef[0]) clearInterval(progressRef[0]);
      setMessage(msg);
      setUndoFn(() => fn);
      setVisible(true);
      setProgress(100);

      const start = Date.now();
      progressRef[0] = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, 100 - (elapsed / dur) * 100);
        setProgress(remaining);
        if (remaining <= 0) clearInterval(progressRef[0]);
      }, 50);

      timerRef[0] = setTimeout(() => {
        setVisible(false);
        setUndoFn(null);
        clearInterval(progressRef[0]);
      }, dur);
    };
    return () => { _undoHandler = null; if (timerRef[0]) clearTimeout(timerRef[0]); if (progressRef[0]) clearInterval(progressRef[0]); };
  }, []);

  const handleUndo = useCallback(() => {
    if (undoFn) undoFn();
    setVisible(false);
    if (timerRef[0]) clearTimeout(timerRef[0]);
    if (progressRef[0]) clearInterval(progressRef[0]);
  }, [undoFn]);

  if (!visible) return null;

  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <span>{message}</span>
      <button className="undo-btn" onClick={handleUndo} type="button">Undo</button>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,.2)', borderRadius: 1 }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', borderRadius: 1, transition: 'width .1s linear' }} />
      </div>
    </div>
  );
}
