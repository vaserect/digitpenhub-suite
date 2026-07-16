'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function StripeCheckout({ componentId, componentName, price, currency, onSuccess, onCancel }) {
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    createPaymentIntent();
  }, [componentId]);

  const createPaymentIntent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ component_id: componentId })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await res.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px'
    }
  };

  const options = {
    clientSecret,
    appearance
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
            onClick={createPaymentIntent}
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

      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm
            componentId={componentId}
            paymentIntentId={paymentIntentId}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Elements>
      )}
    </div>
  );
}

function CheckoutForm({ componentId, paymentIntentId, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      });

      if (stripeError) {
        setMessage(stripeError.message);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm purchase with backend
        const res = await fetch('/api/v1/payments/confirm-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
            component_id: componentId
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to confirm purchase');
        }

        const data = await res.json();
        onSuccess(data);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {message && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{message}</p>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isProcessing ? 'Processing...' : 'Pay Now'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Secured by Stripe • Your payment information is encrypted</p>
      </div>
    </form>
  );
}
