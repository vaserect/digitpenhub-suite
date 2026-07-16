'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FlutterwaveCheckout from '@/components/payments/FlutterwaveCheckout';
import PaystackCheckout from '@/components/payments/PaystackCheckout';
import StripeCheckout from '@/components/payments/StripeCheckout';
import PayPalCheckout from '@/components/payments/PayPalCheckout';
import {
  CreditCardIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const componentId = searchParams.get('component_id');

  const [component, setComponent] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('flutterwave'); // Default to Flutterwave (primary)
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [purchaseData, setPurchaseData] = useState(null);

  // Check which payment methods are enabled
  const paystackEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYSTACK === 'true';
  const stripeEnabled = process.env.NEXT_PUBLIC_ENABLE_STRIPE === 'true';
  const paypalEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYPAL === 'true';

  useEffect(() => {
    if (componentId) {
      loadComponent();
    }
  }, [componentId]);

  const loadComponent = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/marketplace/components/${componentId}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setComponent(data.component);
      } else {
        router.push('/marketplace');
      }
    } catch (error) {
      console.error('Error loading component:', error);
      router.push('/marketplace');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (data) => {
    setPurchaseData(data);
    setPurchaseComplete(true);
  };

  const handleCancel = () => {
    router.push(`/marketplace/${componentId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!component) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  if (purchaseComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Complete!</h2>
          <p className="text-gray-600 mb-6">
            You now have access to <strong>{component.name}</strong>
          </p>
          
          {purchaseData?.purchase?.license_key && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Your License Key:</p>
              <p className="font-mono text-sm bg-white px-3 py-2 rounded border border-gray-200">
                {purchaseData.purchase.license_key}
              </p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Checkout</h1>
          <p className="text-gray-600">Complete your purchase to access this component</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Method Selection */}
          <div className="lg:col-span-2">
            {/* Payment Method Tabs */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Flutterwave - Primary & Recommended */}
                <button
                  onClick={() => setPaymentMethod('flutterwave')}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors ${
                    paymentMethod === 'flutterwave'
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-8 h-8" viewBox="0 0 200 200" fill="none">
                    <rect width="200" height="200" rx="20" fill="#FF6B00"/>
                    <path d="M50 100L80 70L110 100L80 130L50 100Z" fill="white"/>
                    <path d="M90 100L120 70L150 100L120 130L90 100Z" fill="white"/>
                  </svg>
                  <span className="font-medium text-sm">Flutterwave</span>
                  <span className="text-xs text-green-600 font-semibold">Recommended</span>
                </button>

                {/* Paystack - African Markets */}
                {paystackEnabled && (
                  <button
                    onClick={() => setPaymentMethod('paystack')}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors ${
                      paymentMethod === 'paystack'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-8 h-8" viewBox="0 0 200 200" fill="none">
                      <rect width="200" height="200" rx="20" fill="#00C3F7"/>
                      <path d="M60 60H140V100H100V140H60V60Z" fill="white"/>
                    </svg>
                    <span className="font-medium text-sm">Paystack</span>
                    <span className="text-xs text-gray-500">Africa</span>
                  </button>
                )}

                {/* Stripe - International */}
                {stripeEnabled && (
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors ${
                      paymentMethod === 'stripe'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCardIcon className="w-8 h-8 text-purple-600" />
                    <span className="font-medium text-sm">Stripe</span>
                    <span className="text-xs text-gray-500">Global</span>
                  </button>
                )}

                {/* PayPal - International */}
                {paypalEnabled && (
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors ${
                      paymentMethod === 'paypal'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#003087">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.653h8.53c2.347 0 4.203.645 5.072 1.87.578.814.793 1.76.793 2.89 0 3.45-1.856 5.84-5.17 6.66-.577.143-1.156.214-1.735.214H9.5a.77.77 0 0 0-.76.653l-.805 5.11a.641.641 0 0 1-.633.653h-.226z"/>
                    </svg>
                    <span className="font-medium text-sm">PayPal</span>
                    <span className="text-xs text-gray-500">Global</span>
                  </button>
                )}
              </div>
            </div>

            {/* Payment Form */}
            {paymentMethod === 'flutterwave' && (
              <FlutterwaveCheckout
                componentId={component.id}
                componentName={component.name}
                price={component.price}
                currency={component.currency}
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            )}
            
            {paymentMethod === 'paystack' && paystackEnabled && (
              <PaystackCheckout
                componentId={component.id}
                componentName={component.name}
                price={component.price}
                currency={component.currency}
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            )}
            
            {paymentMethod === 'stripe' && stripeEnabled && (
              <StripeCheckout
                componentId={component.id}
                componentName={component.name}
                price={component.price}
                currency={component.currency}
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            )}
            
            {paymentMethod === 'paypal' && paypalEnabled && (
              <PayPalCheckout
                componentId={component.id}
                componentName={component.name}
                price={component.price}
                currency={component.currency}
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Component Preview */}
              <div className="mb-4">
                {component.thumbnail_url && (
                  <img
                    src={component.thumbnail_url}
                    alt={component.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-medium text-gray-900 mb-1">{component.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{component.description}</p>
              </div>

              {/* Pricing */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{component.currency} {component.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{component.currency} 0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-gray-900">
                    {component.currency} {component.price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">What's Included:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    Lifetime access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    Free updates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    Commercial license
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    Support included
                  </li>
                </ul>
              </div>

              {/* Security Badge */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-600">
                  🔒 Secure payment processing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
