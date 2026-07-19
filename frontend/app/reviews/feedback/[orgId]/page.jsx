'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast, Toaster } from 'sonner';

export default function PublicFeedbackPage() {
  const { orgId } = useParams();
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState('');
  const [settings, setSettings] = useState(null);

  // Form states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Outcome states
  const [success, setSuccess] = useState(false);
  const [gated, setGated] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(null);

  useEffect(() => {
    if (!orgId) return;

    fetch(`/api/v1/reviews/feedback/settings/${orgId}`)
      .then(res => {
        if (!res.ok) throw new Error('Feedback portal not found');
        return res.json();
      })
      .then(data => {
        setOrgName(data.organizationName || 'Our Business');
        setSettings(data.settings);
      })
      .catch(err => {
        toast.error(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orgId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    if (!reviewerName.trim() || !content.trim()) {
      toast.error('Name and review content are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/reviews/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          reviewerName: reviewerName.trim(),
          reviewerEmail: reviewerEmail.trim() || null,
          rating,
          title: title.trim() || null,
          content: content.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to submit feedback');

      const data = await res.json();
      setGated(data.gated);
      setRedirectUrl(data.redirectUrl);
      setSuccess(true);
    } catch {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ border: '4px solid #e2e8f0', borderTop: '4px solid #2563eb', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: 15 }}>Loading feedback portal...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <Toaster position="top-center" richColors />
      
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: 540,
        borderRadius: 16,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        padding: 36,
        boxSizing: 'border-box'
      }}>
        {!success ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Share Your Experience</h1>
              <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>How did we do? Let <strong>{orgName}</strong> know!</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Star Rating selector */}
              <div style={{ textAlign: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>YOUR RATING *</label>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 36,
                          padding: 0,
                          color: active ? '#eab308' : '#e2e8f0',
                          transition: 'transform 0.15s, color 0.15s',
                          transform: hoverRating === star ? 'scale(1.15)' : 'scale(1)',
                        }}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
                {rating > 0 && (
                  <span style={{ display: 'block', fontSize: 12, color: '#eab308', fontWeight: 600, marginTop: 8, textTransform: 'uppercase' }}>
                    {rating === 1 && 'Poor 😠'}
                    {rating === 2 && 'Fair 😕'}
                    {rating === 3 && 'Good 🙂'}
                    {rating === 4 && 'Very Good 😃'}
                    {rating === 5 && 'Excellent! 😍'}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: 14,
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={reviewerEmail}
                    onChange={e => setReviewerEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: 14,
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Review Title (Optional)</label>
                <input
                  type="text"
                  placeholder="Summarize your experience"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 14,
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Tell us more about it *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your review here..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 14,
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  padding: '12px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  marginTop: 8,
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {gated ? (
              /* Gated internal support screen */
              <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Thank You for Your Feedback!</h2>
                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  We appreciate your honest input. We are sorry to hear that your experience did not meet your expectations. 
                  Your response has been routed directly to our management team, and a representative will contact you shortly to make things right.
                </p>
              </div>
            ) : (
              /* Non-gated external link sharing screen */
              <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Thank You so Much!</h2>
                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
                  We are thrilled that you had a positive experience! Would you mind taking a quick moment to share your rating on our official platforms so others can find us?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {settings?.google_review_url && (
                    <a
                      href={settings.google_review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        color: '#4285F4',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'block',
                        fontSize: 14,
                        transition: 'background-color 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      🔵 Share on Google Review
                    </a>
                  )}

                  {settings?.facebook_review_url && (
                    <a
                      href={settings.facebook_review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        color: '#1877F2',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'block',
                        fontSize: 14,
                        transition: 'background-color 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      🔵 Share on Facebook Page
                    </a>
                  )}

                  {settings?.yelp_review_url && (
                    <a
                      href={settings.yelp_review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        color: '#D32323',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'block',
                        fontSize: 14,
                        transition: 'background-color 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      🔴 Share on Yelp
                    </a>
                  )}

                  {settings?.trustpilot_review_url && (
                    <a
                      href={settings.trustpilot_review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        color: '#00B67A',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'block',
                        fontSize: 14,
                        transition: 'background-color 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      🟢 Share on Trustpilot
                    </a>
                  )}

                  {!settings?.google_review_url && !settings?.facebook_review_url && !settings?.yelp_review_url && !settings?.trustpilot_review_url && (
                    <div style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>
                      Your review has been successfully registered in our records. We appreciate your support!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
