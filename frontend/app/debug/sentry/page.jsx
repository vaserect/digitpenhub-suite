'use client';
import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryDebugPage() {
  const [result, setResult] = useState(null);

  const testBackendError = async () => {
    try {
      const res = await fetch('/api/v1/health/sentry-debug', { credentials: 'include' });
      const data = await res.json();
      setResult({ type: 'backend', data });
    } catch (err) {
      setResult({ type: 'error', data: err.message });
    }
  };

  const testClientError = () => {
    try {
      throw new Error('Sentry client debug test — intentional error');
    } catch (err) {
      Sentry.captureException(err, {
        contexts: { source: 'sentry-debug-page', action: 'manual-client-test' },
      });
      setResult({ type: 'client', data: { message: 'Exception captured and sent to Sentry.' } });
    }
  };

  const testCrash = () => {
    throw new Error('Sentry client debug test — intentional uncaught error');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Sentry Debug</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Use these buttons to send test errors to Sentry.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
        <button onClick={testBackendError}
          style={{ padding: '12px', background: '#364153', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Send Backend Error (captured)
        </button>
        <button onClick={testClientError}
          style={{ padding: '12px', background: '#553c7b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Send Client Error (captured)
        </button>
        <button onClick={testCrash}
          style={{ padding: '12px', background: '#7b3c3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Trigger Uncaught Exception (page crash)
        </button>
      </div>

      {result && (
        <div style={{
          background: '#f5f5f5', padding: '16px', borderRadius: '6px',
          whiteSpace: 'pre-wrap', fontSize: '0.8rem'
        }}>
          <strong>{result.type === 'backend' ? 'Backend Response:' : result.type === 'client' ? 'Client Response:' : 'Error:'}</strong>
          {'\n'}
          {JSON.stringify(result.data, null, 2)}
        </div>
      )}

      <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#999' }}>
        Sentry DSN configured: {typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Yes' : 'No'}
      </p>
    </div>
  );
}
