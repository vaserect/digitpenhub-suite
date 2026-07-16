'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  CloudArrowDownIcon,
  ShoppingCartIcon,
  HeartIcon,
  UserIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import RatingStars from '@/components/marketplace/RatingStars';
import ReviewForm from '@/components/marketplace/ReviewForm';
import ReviewList from '@/components/marketplace/ReviewList';

export default function ComponentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const componentId = params.id;

  const [component, setComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (componentId) {
      loadComponent();
      loadCurrentUser();
    }
  }, [componentId]);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch('/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data.user?.id);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadComponent = async () => {
    try {
      const res = await fetch(`/api/v1/marketplace/components/${componentId}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setComponent(data.component);
        setIsFavorited(data.component.is_favorited || false);
      } else {
        router.push('/marketplace');
      }
    } catch (error) {
      console.error('Error loading component:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/v1/marketplace/components/${componentId}/download`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        alert('Component downloaded successfully! You can now use it in your builder.');
        loadComponent(); // Refresh to update download count
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to download component');
      }
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download component');
    }
  };

  const handlePurchase = async () => {
    try {
      // In production, integrate with payment gateway
      const res = await fetch(`/api/v1/marketplace/components/${componentId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          payment_method: 'stripe',
          payment_id: 'demo_payment_' + Date.now()
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert('Purchase successful! Component is now available in your library.');
        loadComponent();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to purchase component');
      }
    } catch (error) {
      console.error('Error purchasing:', error);
      alert('Failed to purchase component');
    }
  };

  const handleFavorite = async () => {
    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const res = await fetch(`/api/v1/marketplace/components/${componentId}/favorite`, {
        method,
        credentials: 'include'
      });
      
      if (res.ok) {
        setIsFavorited(!isFavorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    loadComponent(); // Refresh to update rating
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!component) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Component Not Found</h2>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/marketplace')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Marketplace
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Preview Images */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="relative h-96 bg-gray-200">
                {component.thumbnail_url ? (
                  <img
                    src={component.thumbnail_url}
                    alt={component.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Preview Available
                  </div>
                )}
              </div>
              
              {/* Additional Preview Images */}
              {component.preview_images && component.preview_images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 p-4">
                  {component.preview_images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-75"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{component.description}</p>
              
              {component.demo_url && (
                <a
                  href={component.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  View Live Demo →
                </a>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h2>
                {(component.is_purchased || component.is_downloaded) && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="mb-6">
                  <ReviewForm
                    componentId={componentId}
                    onSuccess={handleReviewSuccess}
                    onCancel={() => setShowReviewForm(false)}
                  />
                </div>
              )}

              {/* Reviews List */}
              <ReviewList 
                componentId={componentId}
                currentUserId={currentUserId}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{component.name}</h1>
              
              {/* Creator */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">by {component.creator_name}</span>
              </div>

              {/* Stats */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <RatingStars 
                      rating={component.rating_average || 0} 
                      size={20}
                      showCount={true}
                      count={component.rating_count || 0}
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    {component.rating_average?.toFixed(1) || '0.0'} out of 5
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CloudArrowDownIcon className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">{component.downloads || 0}</span>
                  <span className="text-sm text-gray-600">downloads</span>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="mb-6">
                {component.is_free ? (
                  <div className="text-3xl font-bold text-green-600 mb-4">Free</div>
                ) : (
                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    ${component.price}
                  </div>
                )}

                {component.is_purchased || component.is_downloaded ? (
                  <div className="px-4 py-3 bg-green-50 text-green-700 rounded-lg text-center font-medium mb-3">
                    ✓ You own this component
                  </div>
                ) : (
                  <button
                    onClick={component.is_free ? handleDownload : handlePurchase}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mb-3 flex items-center justify-center gap-2"
                  >
                    {component.is_free ? (
                      <>
                        <CloudArrowDownIcon className="w-5 h-5" />
                        Download Free
                      </>
                    ) : (
                      <>
                        <ShoppingCartIcon className="w-5 h-5" />
                        Purchase
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handleFavorite}
                  className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 font-medium flex items-center justify-center gap-2"
                >
                  {isFavorited ? (
                    <>
                      <HeartSolidIcon className="w-5 h-5 text-red-500" />
                      Favorited
                    </>
                  ) : (
                    <>
                      <HeartIcon className="w-5 h-5" />
                      Add to Favorites
                    </>
                  )}
                </button>
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <TagIcon className="w-4 h-4" />
                  <span className="capitalize">{component.category}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Updated {new Date(component.updated_at).toLocaleDateString()}</span>
                </div>
                {component.version && (
                  <div className="text-gray-600">
                    Version: {component.version}
                  </div>
                )}
                {component.license && (
                  <div className="text-gray-600">
                    License: {component.license}
                  </div>
                )}
              </div>

              {/* Tags */}
              {component.tags && component.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {component.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
