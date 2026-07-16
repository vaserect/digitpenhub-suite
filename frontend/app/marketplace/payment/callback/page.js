'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [purchaseData, setPurchaseData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const gateway = searchParams.get('gateway') || 'flutterwave';
      
      if (gateway === 'flutterwave') {
        await verifyFlutterwave();
      } else if (gateway === 'paystack') {
        await verifyPaystack();
      } else if (gateway === 'paypal') {
        await verifyPayPal();
      } else {
        setVerificationStatus('failed');
        setError('Unknown payment gateway');
        setIsVerifying(false);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationStatus('failed');
      setError('Failed to verify payment');
      setIsVerifying(false);
    }
  };

  const verifyFlutterwave = async () => {
    const status = searchParams.get('status');
    const txRef = searchParams.get('tx_ref');
    const transactionId = searchParams.get('transaction_id');

    if (status !== 'successful' && status !== 'completed') {
      setVerificationStatus('failed');
      setError('Payment was not completed');
      setIsVerifying(false);
      return;
    }

    if (!transactionId) {
      setVerificationStatus('failed');
      setError('Transaction ID not found');
      setIsVerifying(false);
      return;
    }

    // Verify payment with backend
    const res = await fetch('/api/v1/payments/flutterwave/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        transaction_id: transactionId,
        tx_ref: txRef
      })
    });

    const data = await res.json();

    if (res.ok && data.status === 'success') {
      setVerificationStatus('success');
      setPurchaseData(data);
    } else {
      setVerificationStatus('failed');
      setError(data.error || 'Payment verification failed');
    }
    setIsVerifying(false);
  };

  const verifyPaystack = async () => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');

    const ref = reference || trxref;

    if (!ref) {
      setVerificationStatus('failed');
      setError('Reference not found');
      setIsVerifying(false);
      return;
    }

    // Verify payment with backend
    const res = await fetch('/api/v1/payments/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reference: ref })
    });

    const data = await res.json();

    if (res.ok && data.status === 'success') {
      setVerificationStatus('success');
      setPurchaseData(data);
    } else {
      setVerificationStatus('failed');
      setError(data.error || 'Payment verification failed');
    }
    setIsVerifying(false);
  };

  const verifyPayPal = async () => {
    const token = searchParams.get('token');
    const orderId = token; // PayPal uses token as order ID

    if (!orderId) {
      setVerificationStatus('failed');
      setError('Order ID not found');
      setIsVerifying(false);
      return;
    }

    // Capture PayPal order
    const res = await fetch('/api/v1/payments/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ order_id: orderId })
    });

    const data = await res.json();

    if (res.ok) {
      setVerificationStatus('success');
      setPurchaseData(data);
    } else {
      setVerificationStatus('failed');
      setError(data.error || 'Payment capture failed');
    }
    setIsVerifying(false);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">{error || 'Your payment could not be processed'}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/marketplace')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Back to Marketplace
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your purchase has been completed successfully
          </p>
          
          {purchaseData?.purchase?.license_key && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Your License Key:</p>
              <p className="font-mono text-sm bg-white px-3 py-2 rounded border border-gray-200 break-all">
                {purchaseData.purchase.license_key}
              </p>
              <p className="text-xs text-gray-500 mt-2">Save this key for your records</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => router.push('/builder')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Start Building
            </button>
            <button
              onClick={() => router.push('/marketplace/my-purchases')}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              View My Purchases
            </button>
            <button
              onClick={() => router.push('/marketplace')}
              className="w-full text-gray-600 hover:text-gray-900 underline"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}