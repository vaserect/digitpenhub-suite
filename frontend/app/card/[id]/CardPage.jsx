'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CardPage() {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [sections, setSections] = useState([]);
  const [links, setLinks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Lead capture form state
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorCompany, setVisitorCompany] = useState('');
  const [visitorNotes, setVisitorNotes] = useState('');
  const [exchangeSuccess, setExchangeSuccess] = useState(false);
  const [submittingExchange, setSubmittingExchange] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    // Check if ID is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const fetchUrl = isUuid ? `/api/v1/biz-cards/public/${id}` : `/api/v1/biz-cards/slug/${id}`;
    
    fetch(fetchUrl)
      .then(r => {
        if (!r.ok) throw new Error('Card not found');
        return r.json();
      })
      .then(d => {
        if (d.error) {
          setError(d.error);
        } else {
          setCard(d.card);
          setSections(d.sections || []);
          setLinks(d.links || []);
          
          // Track card view
          fetch(`/api/v1/biz-cards/${d.card.id}/track-view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visitor_id: localStorage.getItem('dbc_visitor_id') || `v_${Math.random().toString(36).substr(2, 9)}`,
              view_source: 'public_web'
            })
          }).catch(() => {});
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Card not found');
        setLoading(false);
      });
  }, [id]);

  function handleLinkClick(linkId, url) {
    // Track click on link
    fetch(`/api/v1/biz-cards/links/${linkId}/click`, {
      method: 'POST'
    }).catch(() => {});
  }

  function downloadVCard() {
    if (!card) return;

    // Increment vcard download counter via legacy endpoint or custom log if needed
    fetch(`/api/v1/biz-cards/${card.id}/view`, { method: 'POST' }).catch(() => {});

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${card.name}`,
      card.title ? `TITLE:${card.title}` : '',
      card.company ? `ORG:${card.company}${card.department ? ';' + card.department : ''}` : '',
      card.email ? `EMAIL:${card.email}` : '',
      card.phone ? `TEL;TYPE=CELL:${card.phone}` : '',
      card.mobile ? `TEL;TYPE=WORK,VOICE:${card.mobile}` : '',
      card.website ? `URL:${card.website}` : '',
      card.address ? `ADR;TYPE=WORK:;;${card.address};${card.city || ''};${card.state || ''};${card.postal_code || ''};${card.country || ''}` : '',
      card.bio ? `NOTE:${card.bio.replace(/\n/g, '\\n')}` : '',
      'END:VCARD'
    ].filter(Boolean).join('\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.setAttribute('download', `${card.name.replace(/\s+/g, '_')}.vcf`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleExchangeSubmit(e) {
    e.preventDefault();
    if (!visitorName.trim()) return;
    setSubmittingExchange(true);

    try {
      const res = await fetch('/api/v1/biz-cards/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card.id,
          name: visitorName.trim(),
          email: visitorEmail.trim() || null,
          phone: visitorPhone.trim() || null,
          company: visitorCompany.trim() || null,
          notes: visitorNotes.trim() || null,
          source: 'card_landing_page'
        })
      });

      if (res.ok) {
        setExchangeSuccess(true);
        setTimeout(() => {
          setShowExchangeModal(false);
          setExchangeSuccess(false);
          setVisitorName('');
          setVisitorEmail('');
          setVisitorPhone('');
          setVisitorCompany('');
          setVisitorNotes('');
        }, 2000);
      } else {
        alert('Failed to send contact info. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmittingExchange(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading digital card...</p>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' }} />
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Card Not Found</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>This digital business card does not exist, is set to private, or has been archived.</p>
          <a href="https://suite.digitpenhub.com" style={{ display: 'inline-block', background: '#2563eb', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>Go to Digitpen Hub</a>
        </div>
      </div>
    );
  }

  const primaryColor = card.primary_color || '#2563eb';
  const layout = card.layout_style || 'standard';

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: 480, background: card.background_color || '#ffffff', color: card.text_color || '#1f2937', minHeight: '100vh', position: 'relative', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontFamily: card.font_family ? `${card.font_family}, sans-serif` : 'Inter, sans-serif' }}>
        
        {/* Cover Image / Banner */}
        <div style={{ height: 160, position: 'relative', background: card.cover_image_url ? `url(${card.cover_image_url}) center/cover no-repeat` : `linear-gradient(135deg, ${primaryColor}, ${card.secondary_color || '#1e40af'})` }}>
          {card.logo_url && (
            <img src={card.logo_url} alt="Logo" style={{ position: 'absolute', top: 16, left: 16, height: 32, objectFit: 'contain', background: 'rgba(255, 255, 255, 0.8)', padding: '4px 8px', borderRadius: 6 }} />
          )}
        </div>

        {/* Profile Info Header */}
        <div style={{ padding: '0 1.5rem', marginTop: -50, textAlign: layout === 'minimal' ? 'left' : 'center', position: 'relative', zIndex: 2 }}>
          {card.avatar_url ? (
            <img src={card.avatar_url} alt={card.name} style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: `4px solid ${card.background_color || '#ffffff'}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', margin: layout === 'minimal' ? '0' : '0 auto' }} />
          ) : (
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: primaryColor, color: '#fff', fontSize: '2.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `4px solid ${card.background_color || '#ffffff'}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', margin: layout === 'minimal' ? '0' : '0 auto' }}>
              {card.name[0]}
            </div>
          )}

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '1rem', marginBottom: '0.25rem' }}>{card.name}</h1>
          {card.tagline && <p style={{ fontSize: '0.875rem', fontWeight: 500, opacity: 0.8, marginBottom: '0.5rem' }}>{card.tagline}</p>}
          
          <div style={{ fontSize: '0.875rem', opacity: 0.75, display: 'flex', flexDirection: 'column', gap: '2px', alignItems: layout === 'minimal' ? 'flex-start' : 'center', marginTop: '0.5rem' }}>
            {card.title && <span style={{ fontWeight: 600 }}>{card.title}</span>}
            {(card.company || card.department) && (
              <span>{card.company}{card.department ? ` - ${card.department}` : ''}</span>
            )}
          </div>

          {card.bio && (
            <p style={{ fontSize: '0.875rem', lineHeight: 1.5, margin: '1rem 0', opacity: 0.9 }}>
              {card.bio}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ padding: '0 1.5rem', display: 'flex', gap: '0.75rem', margin: '1.5rem 0' }}>
          <button onClick={downloadVCard} style={{ flex: 1, background: primaryColor, color: '#ffffff', border: 'none', padding: '0.875rem 1rem', borderRadius: 12, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            📥 Save Contact
          </button>
          <button onClick={() => setShowExchangeModal(true)} style={{ flex: 1, background: 'transparent', color: primaryColor, border: `2px solid ${primaryColor}`, padding: '0.875rem 1rem', borderRadius: 12, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            🤝 Exchange
          </button>
        </div>

        {/* Contact Links & Sections */}
        <div style={{ padding: '0 1.5rem 3rem' }}>
          {/* Quick Contact Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: 16 }}>
            {card.email && (
              <a href={`mailto:${card.email}`} style={{ textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✉️</div>
                <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Email</span>
              </a>
            )}
            {card.phone && (
              <a href={`tel:${card.phone}`} style={{ textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📞</div>
                <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Call</span>
              </a>
            )}
            {card.website && (
              <a href={card.website.startsWith('http') ? card.website : `https://${card.website}`} target="_blank" rel="noopener noreferrer" style={{ textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🌐</div>
                <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Web</span>
              </a>
            )}
            {card.address && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(card.address)}`} target="_blank" rel="noopener noreferrer" style={{ textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📍</div>
                <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Map</span>
              </a>
            )}
          </div>

          {/* Custom Links mapped under Sections */}
          {sections.map(section => {
            const sectionLinks = links.filter(l => l.section_id === section.id);
            if (sectionLinks.length === 0) return null;

            return (
              <div key={section.id} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {section.icon && <span>{section.icon}</span>}
                  {section.title}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {sectionLinks.map(link => (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" onClick={() => handleLinkClick(link.id, link.url)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, textDecoration: 'none', color: 'inherit', fontWeight: 600, fontSize: '0.9rem', transition: 'transform 0.15s' }}>
                      <span style={{ fontSize: '1.25rem' }}>{link.icon || '🔗'}</span>
                      <div style={{ flex: 1 }}>
                        <div>{link.title}</div>
                        {link.description && <div style={{ fontSize: '0.75rem', color: 'gray', fontWeight: 400, marginTop: 2 }}>{link.description}</div>}
                      </div>
                      <span style={{ opacity: 0.4 }}>→</span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Social Profiles Grid */}
          {(card.linkedin || card.twitter || card.instagram || card.facebook) && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem', opacity: 0.8 }}>Social Connect</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {card.linkedin && (
                  <a href={card.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'inherit', padding: '0.75rem 0', background: 'rgba(0,0,0,0.03)', borderRadius: 12 }}>
                    <span style={{ fontSize: '1.5rem', marginBottom: 4 }}>👔</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>LinkedIn</span>
                  </a>
                )}
                {card.twitter && (
                  <a href={card.twitter} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'inherit', padding: '0.75rem 0', background: 'rgba(0,0,0,0.03)', borderRadius: 12 }}>
                    <span style={{ fontSize: '1.5rem', marginBottom: 4 }}>🐦</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Twitter</span>
                  </a>
                )}
                {card.instagram && (
                  <a href={card.instagram} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'inherit', padding: '0.75rem 0', background: 'rgba(0,0,0,0.03)', borderRadius: 12 }}>
                    <span style={{ fontSize: '1.5rem', marginBottom: 4 }}>📸</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Instagram</span>
                  </a>
                )}
                {card.facebook && (
                  <a href={card.facebook} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'inherit', padding: '0.75rem 0', background: 'rgba(0,0,0,0.03)', borderRadius: 12 }}>
                    <span style={{ fontSize: '1.5rem', marginBottom: 4 }}>👤</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Facebook</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Branding */}
        <div style={{ textAlign: 'center', padding: '2rem 1.5rem 3rem', borderTop: '1px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.01)' }}>
          <a href="https://suite.digitpenhub.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', opacity: 0.5, fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚡ Powered by</span>
            <span style={{ fontWeight: 700 }}>Digitpen Hub</span>
          </a>
        </div>

        {/* Exchange Contact Modal */}
        {showExchangeModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', color: '#1f2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Share Your Info with {card.name.split(' ')[0]}</h3>
                <button onClick={() => setShowExchangeModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>×</button>
              </div>

              {exchangeSuccess ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                  <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>Info Sent Successfully!</h4>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>You have exchanged contact details.</p>
                </div>
              ) : (
                <form onSubmit={handleExchangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: 4 }}>Full Name *</label>
                    <input type="text" required value={visitorName} onChange={e => setVisitorName(e.target.value)} placeholder="Your Name" style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: 4 }}>Email</label>
                    <input type="email" value={visitorEmail} onChange={e => setVisitorEmail(e.target.value)} placeholder="your.email@example.com" style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: 4 }}>Phone Number</label>
                    <input type="tel" value={visitorPhone} onChange={e => setVisitorPhone(e.target.value)} placeholder="+123456789" style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: 4 }}>Company</label>
                    <input type="text" value={visitorCompany} onChange={e => setVisitorCompany(e.target.value)} placeholder="Your Company Name" style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: 4 }}>Notes</label>
                    <textarea value={visitorNotes} onChange={e => setVisitorNotes(e.target.value)} placeholder="Let's connect!" style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.85rem', minHeight: 60 }} />
                  </div>
                  
                  <button type="submit" disabled={submittingExchange} style={{ background: primaryColor, color: '#fff', border: 'none', padding: '0.75rem', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {submittingExchange ? 'Sending...' : 'Send Info'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
