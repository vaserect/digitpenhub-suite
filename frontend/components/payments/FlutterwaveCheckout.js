'use client';

import { useState, useEffect } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function FlutterwaveCheckout({ componentId, componentName, price, currency, onSuccess, onCancel }) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [txRef, setTxRef] = useState('');

  const initializePayment = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/payments/flutterwave/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ component_id: componentId })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to initialize payment');
      }

      const data = await res.json();
      
      // Redirect to Flutterwave payment page
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        throw new Error('Payment link not received');
      }
    } catch (err) {
      console.error('Error initializing payment:', err);
      setError(err.message);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Auto-initialize payment when component mounts
    initializePayment();
  }, [componentId]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <XCircleIcon className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Payment Error</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="flex gap-2">
          <button
            onClick={initializePayment}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Purchase</h2>
        <div className="flex items-center justify-between py-3 border-t border-b border-gray-200">
          <span className="text-gray-700">{componentName}</span>
          <span className="text-xl font-bold text-gray-900">
            {currency} {price.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Redirecting to secure payment...</p>
          <p className="text-sm text-gray-600 mt-2">Please wait while we redirect you to Flutterwave</p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={onCancel}
          disabled={isInitializing}
          className="text-sm text-gray-600 hover:text-gray-900 underline disabled:text-gray-400"
        >
          Cancel and go back
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        <p>🔒 Secured by Flutterwave • Your payment information is protected</p>
      </div>
    </div>
  );
}
