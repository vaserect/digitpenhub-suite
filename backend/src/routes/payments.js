const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { requireAuth } = require('../middleware/auth');
const axios = require('axios');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// ============================================================================
// FLUTTERWAVE PAYMENT INTEGRATION (PRIMARY - RECOMMENDED)
// ============================================================================

/**
 * POST /api/v1/payments/flutterwave/initialize
 * Initialize Flutterwave payment for component purchase
 */
router.post('/flutterwave/initialize', requireAuth, async (req, res) => {
  try {
    const { component_id } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name;

    // Get component details
    const componentResult = await pool.query(
      'SELECT id, name, price, currency, is_free FROM marketplace_components WHERE id = $1 AND status = $2',
      [component_id, 'published']
    );

    if (componentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const component = componentResult.rows[0];

    if (component.is_free) {
      return res.status(400).json({ error: 'Component is free. Use download endpoint.' });
    }

    // Check if already purchased
    const existingPurchase = await pool.query(
      'SELECT id FROM marketplace_purchases WHERE component_id = $1 AND buyer_id = $2',
      [component_id, userId]
    );

    if (existingPurchase.rows.length > 0) {
      return res.status(400).json({ error: 'Component already purchased' });
    }

    // Generate unique transaction reference
    const txRef = `MP-FLW-${Date.now()}-${userId}-${component_id}`;

    // Initialize Flutterwave payment
    const flutterwaveResponse = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: txRef,
        amount: component.price,
        currency: component.currency,
        redirect_url: `${process.env.FRONTEND_URL}/marketplace/payment/callback?gateway=flutterwave`,
        payment_options: 'card,banktransfer,ussd,mobilemoney',
        customer: {
          email: userEmail,
          name: userName,
          phonenumber: req.user.phone || ''
        },
        customizations: {
          title: 'Digitpen Hub Marketplace',
          description: component.name,
          logo: `${process.env.FRONTEND_URL}/logo.png`
        },
        meta: {
          component_id: component.id,
          buyer_id: userId,
          component_name: component.name
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (flutterwaveResponse.data.status !== 'success') {
      throw new Error('Failed to initialize payment');
    }

    res.json({
      status: 'success',
      paymentLink: flutterwaveResponse.data.data.link,
      txRef: txRef,
      amount: component.price,
      currency: component.currency
    });
  } catch (error) {
    console.error('Error initializing Flutterwave payment:', error);
    res.status(500).json({ 
      error: 'Failed to initialize payment',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/v1/payments/flutterwave/verify
 * Verify Flutterwave payment and complete purchase
 */
router.post('/flutterwave/verify', requireAuth, async (req, res) => {
  try {
    const { transaction_id, tx_ref } = req.body;
    const userId = req.user.id;
    const orgId = req.user.org_id;

    if (!transaction_id) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Verify transaction with Flutterwave
    const verifyResponse = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
        }
      }
    );

    const transactionData = verifyResponse.data.data;

    // Validate transaction
    if (verifyResponse.data.status !== 'success') {
      return res.status(400).json({ error: 'Transaction verification failed' });
    }

    if (transactionData.status !== 'successful') {
      return res.status(400).json({ error: 'Payment was not successful' });
    }

    // Extract component_id from metadata
    const componentId = transactionData.meta?.component_id || 
                       parseInt(tx_ref.split('-')[4]);

    // Verify buyer
    if (parseInt(transactionData.meta?.buyer_id) !== userId) {
      return res.status(403).json({ error: 'Transaction verification failed - user mismatch' });
    }

    // Check if already processed
    const existingPurchase = await pool.query(
      'SELECT id FROM marketplace_purchases WHERE payment_id = $1',
      [transaction_id]
    );

    if (existingPurchase.rows.length > 0) {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    // Get component details
    const componentResult = await pool.query(
      'SELECT id, name, price, currency, component_data FROM marketplace_components WHERE id = $1',
      [componentId]
    );

    if (componentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const component = componentResult.rows[0];

    // Verify amount
    const expectedAmount = parseFloat(component.price);
    const paidAmount = parseFloat(transactionData.amount);
    const variance = Math.abs(expectedAmount - paidAmount);
    
    if (variance > 0.01 && transactionData.currency === component.currency) {
      return res.status(400).json({ 
        error: 'Amount mismatch',
        expected: expectedAmount,
        paid: paidAmount
      });
    }

    // Generate license key
    const licenseKey = `MP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Record purchase
    const purchaseResult = await pool.query(`
      INSERT INTO marketplace_purchases (
        component_id, buyer_id, org_id, price_paid, currency,
        payment_method, payment_id, license_key, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      componentId,
      userId,
      orgId,
      paidAmount,
      transactionData.currency,
      'flutterwave',
      transaction_id,
      licenseKey,
      'completed'
    ]);

    // Increment purchase count
    await pool.query(
      'UPDATE marketplace_components SET purchases = purchases + 1 WHERE id = $1',
      [componentId]
    );

    res.json({
      status: 'success',
      purchase: purchaseResult.rows[0],
      component_data: component.component_data,
      message: 'Purchase successful'
    });
  } catch (error) {
    console.error('Error verifying Flutterwave payment:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/v1/payments/flutterwave/webhook
 * Flutterwave webhook handler for payment events
 */
router.post('/flutterwave/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    const signature = req.headers['verif-hash'];

    if (!signature || signature !== secretHash) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;
    const event = payload.event;
    const data = payload.data;

    console.log('Flutterwave webhook event:', event);

    switch (event) {
      case 'charge.completed':
        if (data.status === 'successful') {
          await pool.query(
            'UPDATE marketplace_purchases SET payment_status = $1 WHERE payment_id = $2',
            ['completed', data.id]
          );
        }
        break;

      case 'charge.failed':
        await pool.query(
          'UPDATE marketplace_purchases SET payment_status = $1 WHERE payment_id = $2',
          ['failed', data.id]
        );
        break;
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================================================
// PAYSTACK PAYMENT INTEGRATION (AFRICAN MARKETS)
// ============================================================================

/**
 * POST /api/v1/payments/paystack/initialize
 * Initialize Paystack payment for component purchase
 */
router.post('/paystack/initialize', requireAuth, async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({ error: 'Paystack payment is not configured' });
    }

    const { component_id } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Get component details
    const componentResult = await pool.query(
      'SELECT id, name, price, currency, is_free FROM marketplace_components WHERE id = $1 AND status = $2',
      [component_id, 'published']
    );

    if (componentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const component = componentResult.rows[0];

    if (component.is_free) {
      return res.status(400).json({ error: 'Component is free. Use download endpoint.' });
    }

    // Check if already purchased
    const existingPurchase = await pool.query(
      'SELECT id FROM marketplace_purchases WHERE component_id = $1 AND buyer_id = $2',
      [component_id, userId]
    );

    if (existingPurchase.rows.length > 0) {
      return res.status(400).json({ error: 'Component already purchased' });
    }

    // Generate unique reference
    const reference = `MP-PSK-${Date.now()}-${userId}-${component_id}`;

    // Initialize Paystack payment
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: userEmail,
        amount: Math.round(component.price * 100), // Paystack uses kobo/cents
        currency: component.currency,
        reference: reference,
        callback_url: `${process.env.FRONTEND_URL}/marketplace/payment/callback?gateway=paystack`,
        metadata: {
          component_id: component.id,
          component_name: component.name,
          buyer_id: userId,
          custom_fields: [
            {
              display_name: 'Component',
              variable_name: 'component_name',
              value: component.name
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!paystackResponse.data.status) {
      throw new Error('Failed to initialize payment');
    }

    res.json({
      status: 'success',
      paymentLink: paystackResponse.data.data.authorization_url,
      reference: reference,
      amount: component.price,
      currency: component.currency
    });
  } catch (error) {
    console.error('Error initializing Paystack payment:', error);
    res.status(500).json({ 
      error: 'Failed to initialize payment',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/v1/payments/paystack/verify
 * Verify Paystack payment and complete purchase
 */
router.post('/paystack/verify', requireAuth, async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({ error: 'Paystack payment is not configured' });
    }

    const { reference } = req.body;
    const userId = req.user.id;
    const orgId = req.user.org_id;

    if (!reference) {
      return res.status(400).json({ error: 'Reference is required' });
    }

    // Verify transaction with Paystack
    const verifyResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const transactionData = verifyResponse.data.data;

    if (!verifyResponse.data.status || transactionData.status !== 'success') {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Extract component_id
    const componentId = transactionData.metadata?.component_id || 
                       parseInt(reference.split('-')[4]);

    // Verify buyer
    if (parseInt(transactionData.metadata?.buyer_id) !== userId) {
      return res.status(403).json({ error: 'Transaction verification failed - user mismatch' });
    }

    // Check if already processed
    const existingPurchase = await pool.query(
      'SELECT id FROM marketplace_purchases WHERE payment_id = $1',
      [reference]
    );

    if (existingPurchase.rows.length > 0) {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    // Get component details
    const componentResult = await pool.query(
      'SELECT id, name, price, currency, component_data FROM marketplace_components WHERE id = $1',
      [componentId]
    );

    if (componentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const component = componentResult.rows[0];

    // Generate license key
    const licenseKey = `MP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Record purchase
    const purchaseResult = await pool.query(`
      INSERT INTO marketplace_purchases (
        component_id, buyer_id, org_id, price_paid, currency,
        payment_method, payment_id, license_key, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      componentId,
      userId,
      orgId,
      transactionData.amount / 100, // Convert from kobo/cents
      transactionData.currency,
      'paystack',
      reference,
      licenseKey,
      'completed'
    ]);

    // Increment purchase count
    await pool.query(
      'UPDATE marketplace_components SET purchases = purchases + 1 WHERE id = $1',
      [componentId]
    );

    res.json({
      status: 'success',
      purchase: purchaseResult.rows[0],
      component_data: component.component_data,
      message: 'Purchase successful'
    });
  } catch (error) {
    console.error('Error verifying Paystack payment:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/v1/payments/paystack/webhook
 * Paystack webhook handler
 */
router.post('/paystack/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('Paystack webhook event:', event.event);

    if (event.event === 'charge.success') {
      await pool.query(
        'UPDATE marketplace_purchases SET payment_status = $1 WHERE payment_id = $2',
        ['completed', event.data.reference]
      );
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================================================
// STRIPE PAYMENT INTEGRATION (INTERNATIONAL)
// ============================================================================

/**
 * POST /api/v1/payments/stripe/create-payment-intent
 * Create a Stripe payment intent for component purchase
 */
router.post('/stripe/create-payment-intent', requireAuth, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe payment is not configured' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { component_id } = req.body;
    const userId = req.user.id;

    // Get component details
    const componentResult = await pool.query(
      'SELECT id, name, price, currency, is_free FROM marketplace_components WHERE id = $1 AND status = $2',
      [component_id, 'published']
    );

    if (componentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const component = componentResult.rows[0];

    if (component.is_free) {
      return res.status(400).json({ error: 'Component is free. Use download endpoint.' });
    }

    // Check if already purchased
    const existingPurchase = await pool.query(
      'SELECT id FROM marketplace_purchases WHERE component_id = $1 AND buyer_id = $2',
      [component_id, userId]
    );

    if (existingPurchase.rows.length > 0) {
      return res.status(400).json({ error: 'Component already purchased' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(component.price * 100),
      currency: component.currency.toLowerCase(),
      metadata: {
        component_id: component.id,
        component_name: component.name,
        buyer_id: userId
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: component.price,
      currency: component.currency
    });
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

/**
 * POST /api/v1/payments/stripe/confirm-purchase
 * Confirm purchase after successful Stripe payment
 */
router.post('/stripe/confirm-purchase', requireAuth, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe payment is not configured' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { payment_intent_id, component_id } = req.body;
    const userId = req.user.id;
    const orgId = req.user.org_id;

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Verify metadata matches
    if (parseInt(paymentIntent.metadata.component_id) !== parseInt(component_id) ||
        parseInt(paymentIntent.metadata.buyer_id) !== userId) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Get component details
    const componentResult = await pool.query(
      'SELECT id, price, currency, component_data FROM marketplace_components WHERE id = $1',
      [component_id]
    );

    if (componentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const component = componentResult.rows[0];

    // Generate license key
    const licenseKey = `MP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Record purchase
    const purchaseResult = await pool.query(`
      INSERT INTO marketplace_purchases (
        component_id, buyer_id, org_id, price_paid, currency,
        payment_method, payment_id, license_key, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      component_id,
      userId,
      orgId,
      component.price,
      component.currency,
      'stripe',
      payment_intent_id,
      licenseKey,
      'completed'
    ]);

    // Increment purchase count
    await pool.query(
      'UPDATE marketplace_components SET purchases = purchases + 1 WHERE id = $1',
      [component_id]
    );

    res.json({
      purchase: purchaseResult.rows[0],
      component_data: component.component_data,
      message: 'Purchase successful'
    });
  } catch (error) {
    console.error('Error confirming Stripe purchase:', error);
    res.status(500).json({ error: 'Failed to confirm purchase' });
  }
});

/**
 * POST /api/v1/payments/stripe/webhook
 * Stripe webhook handler
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log('Stripe webhook event:', event.type);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      await pool.query(
        'UPDATE marketplace_purchases SET payment_status = $1 WHERE payment_id = $2',
        ['completed', paymentIntent.id]
      );
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================================================
// PAYPAL PAYMENT INTEGRATION (INTERNATIONAL)
// ============================================================================

/**
 * POST /api/v1/payments/paypal/create-order
 * Create a PayPal order for component purchase
 */
router.post('/paypal/create-order', requireAuth, async (req, res) => {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
      return res.status(503).json({ error: 'PayPal payment is not configured' });
    }

    const { component_id } = req.body;
    const userId = req.user.id;

    // Get component details
    const componentResult = await pool.query(
      'SELECT id, name, price, currency, is_free FROM marketplace_components WHERE id = $1 AND status = $2',
      [component_id, 'published']
    );

    if (componentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const component = componentResult.rows[0];

    if (component.is_free) {
      return res.status(400).json({ error: 'Component is free. Use download endpoint.' });
    }

    // Check if already purchased
    const existingPurchase = await pool.query(
      'SELECT id FROM marketplace_purchases WHERE component_id = $1 AND buyer_id = $2',
      [component_id, userId]
    );

    if (existingPurchase.rows.length > 0) {
      return res.status(400).json({ error: 'Component already purchased' });
    }

    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalSecret = process.env.PAYPAL_SECRET;
    const paypalBaseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    // Get PayPal access token
    const authResponse = await axios.post(
      `${paypalBaseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64')}`
        }
      }
    );

    const accessToken = authResponse.data.access_token;

    // Create order
    const orderResponse = await axios.post(
      `${paypalBaseUrl}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `component_${component_id}`,
          description: component.name,
          amount: {
            currency_code: component.currency,
            value: component.price.toFixed(2)
          },
          custom_id: JSON.stringify({
            component_id: component.id,
            buyer_id: userId
          })
        }],
        application_context: {
          brand_name: 'Digitpen Hub Marketplace',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/marketplace/payment/callback?gateway=paypal`,
          cancel_url: `${process.env.FRONTEND_URL}/marketplace/payment/cancel`
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    res.json({
      orderId: orderResponse.data.id,
      approveUrl: orderResponse.data.links.find(link => link.rel === 'approve')?.href
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

/**
 * POST /api/v1/payments/paypal/capture-order
 * Capture PayPal order and complete purchase
 */
router.post('/paypal/capture-order', requireAuth, async (req, res) => {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
      return res.status(503).json({ error: 'PayPal payment is not configured' });
    }

    const { order_id } = req.body;
    const userId = req.user.id;
    const orgId = req.user.org_id;

    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalSecret = process.env.PAYPAL_SECRET;
    const paypalBaseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    // Get access token
    const authResponse = await axios.post(
      `${paypalBaseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64')}`
        }
      }
    );

    const accessToken = authResponse.data.access_token;

    // Capture order
    const captureResponse = await axios.post(
      `${paypalBaseUrl}/v2/checkout/orders/${order_id}/capture`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const captureData = captureResponse.data;

    if (captureData.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Payment capture failed' });
    }

    // Extract component_id
    const customId = JSON.parse(captureData.purchase_units[0].custom_id);
    const componentId = customId.component_id;

    // Verify buyer
    if (customId.buyer_id !== userId) {
      return res.status(403).json({ error: 'Transaction verification failed' });
    }

    // Get component details
    const componentResult = await pool.query(
      'SELECT id, price, currency, component_data FROM marketplace_components WHERE id = $1',
      [componentId]
    );

    if (componentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const component = componentResult.rows[0];

    // Generate license key
    const licenseKey = `MP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Record purchase
    const purchaseResult = await pool.query(`
      INSERT INTO marketplace_purchases (
        component_id, buyer_id, org_id, price_paid, currency,
        payment_method, payment_id, license_key, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      componentId,
      userId,
      orgId,
      component.price,
      component.currency,
      'paypal',
      order_id,
      licenseKey,
      'completed'
    ]);

    // Increment purchase count
    await pool.query(
      'UPDATE marketplace_components SET purchases = purchases + 1 WHERE id = $1',
      [componentId]
    );

    res.json({
      purchase: purchaseResult.rows[0],
      component_data: component.component_data,
      message: 'Purchase successful'
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).json({ error: 'Failed to capture order' });
  }
});

// ============================================================================
// REFUND MANAGEMENT
// ============================================================================

/**
 * POST /api/v1/payments/refund
 * Process refund for a purchase (admin only)
 */
router.post('/refund', requireAuth, async (req, res) => {
  try {
    const { purchase_id, reason } = req.body;

    // Check if user is admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get purchase details
    const purchaseResult = await pool.query(
      'SELECT * FROM marketplace_purchases WHERE id = $1',
      [purchase_id]
    );

    if (purchaseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const purchase = purchaseResult.rows[0];

    if (purchase.payment_status === 'refunded') {
      return res.status(400).json({ error: 'Purchase already refunded' });
    }

    // Process refund based on payment method
    if (purchase.payment_method === 'flutterwave') {
      await axios.post(
        `https://api.flutterwave.com/v3/transactions/${purchase.payment_id}/refund`,
        { amount: purchase.price_paid },
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } else if (purchase.payment_method === 'paystack' && process.env.PAYSTACK_SECRET_KEY) {
      await axios.post(
        'https://api.paystack.co/refund',
        { transaction: purchase.payment_id },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } else if (purchase.payment_method === 'stripe' && process.env.STRIPE_SECRET_KEY) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.refunds.create({
        payment_intent: purchase.payment_id,
        reason: 'requested_by_customer'
      });
    }

    // Update purchase status
    await pool.query(
      'UPDATE marketplace_purchases SET payment_status = $1 WHERE id = $2',
      ['refunded', purchase_id]
    );

    res.json({ message: 'Refund processed successfully' });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

/**
 * GET /api/v1/payments/purchase/:id
 * Get purchase details
 */
router.get('/purchase/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        mp.*,
        mc.name as component_name,
        mc.description as component_description,
        mc.thumbnail_url
      FROM marketplace_purchases mp
      LEFT JOIN marketplace_components mc ON mp.component_id = mc.id
      WHERE mp.id = $1 AND mp.buyer_id = $2
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    res.json({ purchase: result.rows[0] });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({ error: 'Failed to fetch purchase' });
  }
});

module.exports = router;
