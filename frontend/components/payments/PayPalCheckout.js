'use client';

import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function PayPalCheckout({ componentId, componentName, price, currency, onSuccess, onCancel }) {
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: currency,
    intent: 'capture'
  };

  const createOrder = async () => {
    try {
      const res = await fetch('/api/v1/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ component_id: componentId })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const data = await res.json();
      setOrderId(data.orderId);
      return data.orderId;
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.message);
      throw err;
    }
  };

  const onApprove = async (data) => {
    try {
      const res = await fetch('/api/v1/payments/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          order_id: data.orderID,
          component_id: componentId
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to capture order');
      }

      const responseData = await res.json();
      onSuccess(responseData);
    } catch (err) {
      console.error('Error capturing order:', err);
      setError(err.message);
    }
  };

  const onError = (err) => {
    console.error('PayPal error:', err);
    setError('Payment failed. Please try again.');
  };

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
            onClick={() => {
              setError(null);
              setOrderId(null);
            }}
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

      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onError}
          onCancel={onCancel}
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'pay'
          }}
        />
      </PayPalScriptProvider>

      <div className="mt-4 text-center">
        <button
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Cancel and go back
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Secured by PayPal • Your payment information is protected</p>
      </div>
    </div>
  );
}
