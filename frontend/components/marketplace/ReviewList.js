'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, Flag, Edit2, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import RatingStars from './RatingStars';
import ReviewForm from './ReviewForm';

export default function ReviewList({ componentId, currentUserId = null }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [ratingDistribution, setRatingDistribution] = useState([]);
  
  // Filters
  const [selectedRating, setSelectedRating] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  
  // UI State
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [componentId, pagination.page, selectedRating, verifiedOnly, sortBy]);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sort: sortBy
      });

      if (selectedRating) {
        params.append('rating', selectedRating);
      }

      if (verifiedOnly) {
        params.append('verified_only', 'true');
      }

      const response = await fetch(
        `/api/v1/marketplace/components/${componentId}/reviews?${params}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews);
      setPagination(data.pagination);
      setRatingDistribution(data.rating_distribution || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/marketplace/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update local state
        setReviews(reviews.map(review => 
          review.id === reviewId 
            ? { ...review, helpful_count: review.helpful_count + 1 }
            : review
        ));
      }
    } catch (err) {
      console.error('Error marking review as helpful:', err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    setDeletingReviewId(reviewId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/marketplace/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setReviews(reviews.filter(review => review.id !== reviewId));
      } else {
        throw new Error('Failed to delete review');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleReportReview = async (reviewId) => {
    if (!reportReason) {
      alert('Please select a reason for reporting');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/marketplace/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription
        })
      });

      if (response.ok) {
        alert('Review reported successfully. Our team will review it.');
        setReportingReviewId(null);
        setReportReason('');
        setReportDescription('');
      } else {
        throw new Error('Failed to report review');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReviewUpdate = (updatedReview) => {
    setReviews(reviews.map(review => 
      review.id === updatedReview.id ? { ...review, ...updatedReview } : review
    ));
    setEditingReviewId(null);
  };

  const totalReviews = ratingDistribution.reduce((sum, item) => sum + parseInt(item.count), 0);

  if (loading && reviews.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Distribution */}
      {ratingDistribution.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const item = ratingDistribution.find(d => d.rating === rating);
              const count = item ? parseInt(item.count) : 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <button
                  key={rating}
                  onClick={() => setSelectedRating(selectedRating === rating.toString() ? '' : rating.toString())}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                    selectedRating === rating.toString() ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{rating}</span>
                    <RatingStars rating={1} maxRating={1} size={16} />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Verified purchases only</span>
          </label>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating_high">Highest Rating</option>
          <option value="rating_low">Lowest Rating</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-6">
              {editingReviewId === review.id ? (
                <ReviewForm
                  componentId={componentId}
                  existingReview={review}
                  onSuccess={handleReviewUpdate}
                  onCancel={() => setEditingReviewId(null)}
                />
              ) : (
                <>
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {review.user_avatar ? (
                        <img
                          src={review.user_avatar}
                          alt={review.user_name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {review.user_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{review.user_name}</h4>
                          {review.is_verified_purchase && (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <ShieldCheck size={12} />
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <RatingStars rating={review.rating} size={16} />
                          <span className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions for own review */}
                    {currentUserId === review.user_id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingReviewId(review.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit review"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete review"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  {review.title && (
                    <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap">{review.review_text}</p>

                  {/* Review Actions */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleMarkHelpful(review.id)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <ThumbsUp size={16} />
                      <span>Helpful ({review.helpful_count})</span>
                    </button>

                    {currentUserId && currentUserId !== review.user_id && (
                      <button
                        onClick={() => setReportingReviewId(review.id)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Flag size={16} />
                        <span>Report</span>
                      </button>
                    )}
                  </div>

                  {/* Report Modal */}
                  {reportingReviewId === review.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-3">Report Review</h5>
                      <div className="space-y-3">
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Select a reason</option>
                          <option value="spam">Spam</option>
                          <option value="inappropriate">Inappropriate content</option>
                          <option value="offensive">Offensive language</option>
                          <option value="fake">Fake review</option>
                          <option value="other">Other</option>
                        </select>
                        <textarea
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          placeholder="Additional details (optional)"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReportReview(review.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                          >
                            Submit Report
                          </button>
                          <button
                            onClick={() => {
                              setReportingReviewId(null);
                              setReportReason('');
                              setReportDescription('');
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
