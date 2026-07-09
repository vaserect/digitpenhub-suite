'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CardPage() {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/biz-cards/public/${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setCard(d.card || d); })
      .catch(() => setError('Could not load card.'));
  }, [id]);

  if (error) {
    return (
      <div className="state-viewport">
        <div className="state-panel is-danger">
          <div className="state-icon">⚠️</div>
          <div className="state-title">Card not found</div>
          <p className="state-description">This business card link is invalid or has been deactivated.</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="state-viewport">
        <div className="state-panel">
          <div className="state-spinner" />
          <div className="state-title">Loading card…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="state-viewport">
      <div className="state-panel" style={{maxWidth:400}}>
        <div style={{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,var(--primary),var(--accent))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.6rem',fontWeight:700,color:'white',marginBottom:8}}>
          {card.full_name?.[0] || card.name?.[0] || '?'}
        </div>
        <div className="state-title" style={{fontSize:'1.2rem'}}>{card.full_name || card.name}</div>
        {card.title && <div style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>{card.title}</div>}
        {card.company && <div style={{color:'var(--text-muted)',fontSize:'0.85rem',marginTop:2}}>{card.company}</div>}
        <div style={{display:'flex',flexDirection:'column',gap:8,width:'100%',marginTop:16}}>
          {card.email && <a href={`mailto:${card.email}`} className="ctag" style={{justifyContent:'center',padding:'10px',fontSize:'0.85rem',width:'100%'}}>✉️ {card.email}</a>}
          {card.phone && <a href={`tel:${card.phone}`} className="ctag" style={{justifyContent:'center',padding:'10px',fontSize:'0.85rem',width:'100%'}}>📞 {card.phone}</a>}
          {card.website && <a href={card.website.startsWith('http')?card.website:`https://${card.website}`} target="_blank" className="ctag" style={{justifyContent:'center',padding:'10px',fontSize:'0.85rem',width:'100%'}}>🌐 {card.website}</a>}
        </div>
        <div style={{marginTop:20,fontSize:'0.75rem',color:'var(--text-muted)'}}>Digitpen Hub Suite</div>
      </div>
    </div>
  );
}
