'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function QRCodePage() {
  const { id } = useParams();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/qr-codes/r/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        if (d.redirectUrl) window.location.href = d.redirectUrl;
      })
      .catch(() => setError('Could not load QR code.'));
  }, [id]);

  if (error) {
    return (
      <div className="state-viewport">
        <div className="state-panel is-danger">
          <div className="state-icon">⚠️</div>
          <div className="state-title">Link not found</div>
          <p className="state-description">This QR code link is invalid or has been deactivated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="state-viewport">
      <div className="state-panel">
        <div className="state-spinner" />
        <div className="state-title">Redirecting…</div>
      </div>
    </div>
  );
}
