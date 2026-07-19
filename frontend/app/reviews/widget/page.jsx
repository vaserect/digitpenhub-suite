'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function WidgetContent() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;

    fetch(`/api/v1/reviews/embed?orgId=${orgId}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setReviews(data.reviews || []);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [orgId]);

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} style={{
            fontSize: 13,
            color: star <= rating ? '#eab308' : '#e2e8f0'
          }}>★</span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontFamily: 'sans-serif' }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>Loading reviews...</span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontFamily: 'sans-serif' }}>
        <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No reviews to display.</span>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: 12,
      margin: 0,
      backgroundColor: 'transparent',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {reviews.map(review => (
          <div key={review.id} style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 100
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>
                  {review.reviewer_name}
                </strong>
                {renderStars(review.rating)}
              </div>
              {review.title && <h5 style={{ margin: '0 0 4px 0', fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{review.title}</h5>}
              <p style={{
                fontSize: 11.5,
                color: '#475569',
                margin: 0,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                "{review.content}"
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 6 }}>
              <span style={{ fontSize: 9.5, color: '#94a3b8' }}>
                {new Date(review.created_at).toLocaleDateString()}
              </span>
              <span style={{
                fontSize: 9,
                fontWeight: 600,
                color: review.source_platform === 'direct' ? '#64748b' : '#3b82f6',
                textTransform: 'uppercase'
              }}>
                {review.source_platform === 'direct' ? 'Verified' : review.source_platform}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReviewsWidgetPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 20 }}>Loading...</div>}>
      <WidgetContent />
    </Suspense>
  );
}
