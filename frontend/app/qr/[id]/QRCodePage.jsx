'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function QRCodePage() {
  const { id } = useParams();
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/qr-codes/r/${id}`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        if (d.redirectUrl) {
          window.location.href = d.redirectUrl;
        } else {
          setQr(d);
        }
      })
      .catch(() => setError('Could not load QR code.'));
  }, [id]);

  const handleCopy = () => {
    if (!qr) return;
    navigator.clipboard.writeText(qr.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="state-viewport" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-muted)' }}>
        <div className="state-panel is-danger" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'2.5rem', maxWidth:420, textAlign:'center', boxShadow:'0 10px 30px rgba(0,0,0,0.05)' }}>
          <div className="state-icon" style={{ fontSize:'3rem', marginBottom:12 }}>⚠️</div>
          <div className="state-title" style={{ fontSize:'1.4rem', fontWeight:700, marginBottom:8 }}>QR Code not found</div>
          <p className="state-description" style={{ color:'var(--muted)', fontSize:'0.9rem' }}>This QR code link is invalid, has been deleted, or has been deactivated.</p>
        </div>
      </div>
    );
  }

  if (!qr) {
    return (
      <div className="state-viewport" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-muted)' }}>
        <div className="state-panel" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'2.5rem', maxWidth:420, textAlign:'center', boxShadow:'0 10px 30px rgba(0,0,0,0.05)' }}>
          <div className="state-spinner" style={{ border:'4px solid var(--border)', borderTop:'4px solid var(--primary)', borderRadius:'50%', width:36, height:36, margin:'0 auto 12px', animation:'spin 1s linear infinite' }} />
          <div className="state-title" style={{ fontSize:'1.1rem', fontWeight:600 }}>Resolving QR Code…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="state-viewport" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-muted)', padding:'1rem' }}>
      <div className="state-panel" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'2.5rem', maxWidth:480, width:'100%', boxShadow:'0 20px 40px rgba(0,0,0,0.08)', textAlign:'center' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg, var(--primary), var(--accent))', display:'flex', alignItems:'center', justifyContext:'center', justifyContent:'center', fontSize:'1.8rem', color:'#fff', margin:'0 auto 16px' }}>
          ▦
        </div>
        <h2 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:4 }}>{qr.title}</h2>
        <div style={{ fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--muted)', marginBottom:16 }}>
          Type: <span className="ctag" style={{ background:'var(--primary-light)', color:'var(--primary)', fontWeight:600, padding:'2px 8px', borderRadius:4 }}>{qr.type}</span>
        </div>

        <div style={{ background:'var(--bg-muted)', border:'1px solid var(--border)', borderRadius:10, padding:'1.2rem', textAlign:'left', wordBreak:'break-all', fontFamily:'monospace', fontSize:'0.9rem', color:'var(--text)', marginBottom:20, minHeight:60 }}>
          {qr.content}
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          {qr.type === 'phone' && (
            <a href={`tel:${qr.content}`} className="btn-primary" style={{ textDecoration:'none', display:'inline-block', padding:'10px 20px', borderRadius:8, fontWeight:600, fontSize:'0.9rem' }}>
              📞 Call Number
            </a>
          )}
          {qr.type === 'email' && (
            <a href={`mailto:${qr.content}`} className="btn-primary" style={{ textDecoration:'none', display:'inline-block', padding:'10px 20px', borderRadius:8, fontWeight:600, fontSize:'0.9rem' }}>
              ✉️ Send Email
            </a>
          )}
          {qr.type === 'sms' && (
            <a href={`sms:${qr.content}`} className="btn-primary" style={{ textDecoration:'none', display:'inline-block', padding:'10px 20px', borderRadius:8, fontWeight:600, fontSize:'0.9rem' }}>
              💬 Send SMS
            </a>
          )}
          <button onClick={handleCopy} className="btn-ghost" style={{ padding:'10px 20px', borderRadius:8, fontWeight:600, fontSize:'0.9rem', border:'1px solid var(--border)' }}>
            {copied ? '✓ Copied' : '📋 Copy Content'}
          </button>
        </div>

        <div style={{ marginTop:24, fontSize:'0.75rem', color:'var(--muted)' }}>
          Powered by Digitpen Hub Suite
        </div>
      </div>
    </div>
  );
}
