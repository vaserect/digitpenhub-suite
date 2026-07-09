'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BarcodePage() {
  const { id } = useParams();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/barcodes/resolve/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        if (d.redirectUrl) window.location.href = d.redirectUrl;
        else if (d.data) setError(d.data);
      })
      .catch(() => setError('Could not load barcode.'));
  }, [id]);

  if (error) {
    return (
      <div className="state-viewport">
        <div className="state-panel is-danger">
          <div className="state-icon">⚠️</div>
          <div className="state-title">Barcode not found</div>
          <p className="state-description">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="state-viewport">
      <div className="state-panel">
        <div className="state-spinner" />
        <div className="state-title">Resolving barcode…</div>
      </div>
    </div>
  );
}
