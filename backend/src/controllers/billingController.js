const https = require('https');
const crypto = require('crypto');
const db = require('../db');
const logger = require('../utils/logger');
const { createCircuitBreaker, createFallback } = require('../utils/circuitBreaker');
const { retryPaymentVerification } = require('../utils/retry');

function auditLog(userId, action, ip, meta = null) {
  return db.query(
    `INSERT INTO audit_log (user_id, action, ip_address, meta) VALUES ($1,$2,$3,$4)`,
    [userId, action, ip, meta ? JSON.stringify(meta) : null]
  );
}

// Core Flutterwave API call function
function flwGetCore(path) {
  return new Promise((resolve, reject) => {
    logger.logExternalService('flutterwave', 'api_call', { path });
    
    const req = https.request(
      { hostname: 'api.flutterwave.com', path, method: 'GET',
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => { 
          try { 
            const data = JSON.parse(body);
            logger.logExternalService('flutterwave', 'api_success', { 
              path, 
              status: res.statusCode 
            });
            resolve(data);
          } catch (err) { 
            logger.error('Flutterwave API returned invalid JSON', {
              path,
              body: body.substring(0, 200),
              error: err.message,
            });
            reject(new Error('Bad JSON from Flutterwave API')); 
          } 
        });
      }
    );
    req.on('error', (err) => {
      logger.error('Flutterwave API request failed', {
        path,
        error: err.message,
      });
      reject(err);
    });
    req.end();
  });
}

// Create circuit breaker for Flutterwave API
const flutterwaveCircuitBreaker = createCircuitBreaker(
  flwGetCore,
  {
    name: 'flutterwave_api',
    timeout: 10000, // 10 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 30000, // 30 seconds
  }
);

// Add fallback
flutterwaveCircuitBreaker.fallback(createFallback('flutterwave_api', null));

// Wrapped function with circuit breaker and retry
async function flwGet(path) {
  try {
    return await retryPaymentVerification(async () => {
      return await flutterwaveCircuitBreaker.fire(path);
    });
  } catch (err) {
    logger.error('Flutterwave API call failed after retries', {
      path,
      error: err.message,
    });
    throw err;
  }
}

function keysConfigured() {
  return !!(process.env.FLUTTERWAVE_PUBLIC_KEY && process.env.FLUTTERWAVE_SECRET_KEY);
}

// ── Public-ish endpoints ─────────────────────────────────────────────────────

async function getPlans(req, res) {
  const { rows } = await db.query(
    `SELECT id, slug, name, price_ngn, max_users, features, sort_order
     FROM plans WHERE is_active = true ORDER BY sort_order`
  );
  res.json({ plans: rows });
}

// ── Protected endpoints ──────────────────────────────────────────────────────

async function getSubscription(req, res) {
  const { rows } = await db.query(
    `SELECT s.id, s.status, s.current_period_start, s.current_period_end,
            p.id AS plan_id, p.slug AS plan_slug, p.name AS plan_name,
            p.price_ngn, p.max_users, p.features
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.org_id = $1`,
    [req.user.orgId]
  );
  res.json({ subscription: rows[0] || null });
}

async function getPayments(req, res) {
  const { rows } = await db.query(
    `SELECT pay.id, pay.tx_ref, pay.flw_tx_id, pay.amount_ngn, pay.status,
            pay.period_months, pay.created_at, p.name AS plan_name
     FROM payments pay
     JOIN plans p ON p.id = pay.plan_id
     WHERE pay.org_id = $1
     ORDER BY pay.created_at DESC LIMIT 50`,
    [req.user.orgId]
  );
  res.json({ payments: rows });
}

async function initiate(req, res) {
  if (!keysConfigured()) return res.status(503).json({ error: 'Payment gateway not configured. Contact support.' });

  const { planId, months = 1 } = req.body || {};
  if (!planId) return res.status(400).json({ error: 'planId is required.' });

  const planRes = await db.query(`SELECT * FROM plans WHERE id = $1 AND is_active = true`, [planId]);
  if (!planRes.rows.length) return res.status(404).json({ error: 'Plan not found.' });

  const plan = planRes.rows[0];
  if (plan.price_ngn === 0) return res.status(400).json({ error: 'The free plan requires no payment.' });

  const amount = plan.price_ngn * months;
  const txRef = `dph-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const userRes = await db.query(`SELECT full_name, email FROM users WHERE id = $1`, [req.user.id]);
  const user = userRes.rows[0];

  await db.query(
    `INSERT INTO payments (org_id, plan_id, tx_ref, amount_ngn, status, period_months)
     VALUES ($1,$2,$3,$4,'pending',$5)`,
    [req.user.orgId, planId, txRef, amount, months]
  );

  await auditLog(req.user.id, 'billing.initiate', req.ip, { planId, planName: plan.name, txRef, amount });

  res.json({
    txRef,
    amount,
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
    currency: 'NGN',
    planName: plan.name,
    months,
    customer: { email: user.email, name: user.full_name },
  });
}

async function verify(req, res) {
  const { txId, txRef } = req.body || {};
  if (!txId || !txRef) return res.status(400).json({ error: 'txId and txRef are required.' });

  // Use dedicated client for transaction with row-level locking
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Lock the payment row to prevent concurrent processing (CRITICAL FIX: Race condition)
    const payRes = await client.query(
      `SELECT * FROM payments WHERE tx_ref = $1 AND org_id = $2 FOR UPDATE`,
      [txRef, req.user.orgId]
    );
    
    if (!payRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payment record not found.' });
    }
    
    const payment = payRes.rows[0];
    
    // Already processed - safe to return (idempotency)
    if (payment.status === 'successful') {
      await client.query('COMMIT');
      const subRes = await db.query(
        `SELECT s.*, p.slug AS plan_slug, p.name AS plan_name 
         FROM subscriptions s JOIN plans p ON p.id=s.plan_id 
         WHERE s.org_id=$1`,
        [req.user.orgId]
      );
      return res.json({ ok: true, subscription: subRes.rows[0] });
    }
    
    if (!keysConfigured()) {
      await client.query('ROLLBACK');
      return res.status(503).json({ error: 'Gateway not configured.' });
    }

    // Verify with Flutterwave
    let flwData;
    try {
      flwData = await flwGet(`/v3/transactions/${txId}/verify`);
    } catch (err) {
      await client.query('ROLLBACK');
      return res.status(502).json({ error: 'Unable to verify with Flutterwave.' });
    }

    if (flwData.status !== 'success' || flwData.data?.status !== 'successful') {
      await client.query(
        `UPDATE payments SET status='failed', flw_tx_id=$1 WHERE tx_ref=$2`,
        [String(txId), txRef]
      );
      await client.query('COMMIT');
      await auditLog(req.user.id, 'billing.verify_failed', req.ip, 
        { txRef, flwTxId: txId, reason: 'Flutterwave status not successful' });
      return res.status(400).json({ error: 'Payment was not successful.' });
    }

    // CRITICAL FIX: Verify amount matches to prevent payment fraud
    if (flwData.data.amount < payment.amount_ngn || flwData.data.currency !== 'NGN') {
      await client.query(
        `UPDATE payments SET status='failed', flw_tx_id=$1 WHERE tx_ref=$2`,
        [String(txId), txRef]
      );
      await client.query('COMMIT');
      await auditLog(req.user.id, 'billing.verify_failed', req.ip, 
        { txRef, flwTxId: txId, reason: 'amount/currency mismatch', 
          expected: payment.amount_ngn, received: flwData.data.amount, 
          currency: flwData.data.currency });
      return res.status(400).json({ error: 'Payment amount mismatch.' });
    }

    // Activate subscription within the same transaction (CRITICAL FIX: Atomicity)
    await activateSubscriptionInTransaction(client, req.user.orgId, payment, String(txId));
    
    await client.query('COMMIT');
    await auditLog(req.user.id, 'billing.verify_success', req.ip, 
      { txRef, flwTxId: txId, planId: payment.plan_id, amount: payment.amount_ngn });
    
    const subRes = await db.query(
      `SELECT s.*, p.slug AS plan_slug, p.name AS plan_name 
       FROM subscriptions s JOIN plans p ON p.id=s.plan_id 
       WHERE s.org_id=$1`,
      [req.user.orgId]
    );
    res.json({ ok: true, subscription: subRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Payment verification failed.' });
  } finally {
    client.release();
  }
}

async function webhook(req, res) {
  // CRITICAL FIX: Verify Flutterwave signature (HMAC-SHA256) instead of static hash
  const signature = req.headers['verif-hash'];
  if (!signature) {
    console.error('Webhook missing signature');
    return res.status(401).json({ error: 'Missing signature.' });
  }
  
  // Compute expected signature from request body
  const payload = JSON.stringify(req.body);
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLUTTERWAVE_WEBHOOK_HASH;
  
  if (!secret) {
    console.error('Webhook secret not configured');
    return res.status(503).json({ error: 'Webhook not configured.' });
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )) {
    console.error('Webhook signature mismatch');
    return res.status(401).json({ error: 'Invalid signature.' });
  }
  
  // CRITICAL FIX: Check timestamp to prevent replay attacks (within 5 minutes)
  const timestamp = req.body?.created_at;
  if (timestamp) {
    const age = Math.abs(Date.now() - new Date(timestamp).getTime());
    if (age > 5 * 60 * 1000) {
      console.error('Webhook too old:', age, 'ms');
      return res.status(400).json({ error: 'Webhook too old.' });
    }
  }

  const event = req.body;
  if (event?.event !== 'charge.completed' || event?.data?.status !== 'successful') {
    return res.json({ received: true });
  }

  const txRef = event.data?.tx_ref;
  const txId = String(event.data?.id || '');
  if (!txRef) return res.json({ received: true });

  const payRes = await db.query(
    `SELECT * FROM payments WHERE tx_ref = $1 AND status = 'pending'`,
    [txRef]
  );
  if (!payRes.rows.length) return res.json({ received: true }); // already handled

  const payment = payRes.rows[0];
  const paidAmount = event.data?.amount;
  const paidCurrency = event.data?.currency;
  
  // CRITICAL FIX: Verify amount and currency match to prevent payment fraud
  if (paidAmount < payment.amount_ngn || paidCurrency !== 'NGN') {
    await db.query(
      `UPDATE payments SET status='failed', flw_tx_id=$1 WHERE tx_ref=$2`,
      [txId, txRef]
    );
    await db.query(
      `INSERT INTO audit_log (user_id, action, ip_address, meta) VALUES (null,$1,$2,$3)`,
      ['billing.webhook_amount_mismatch', '0.0.0.0', 
       JSON.stringify({ txRef, expected: payment.amount_ngn, received: paidAmount, currency: paidCurrency })]
    );
    console.error('Webhook amount mismatch:', { expected: payment.amount_ngn, received: paidAmount });
    return res.json({ received: true, error: 'Amount mismatch' });
  }

  await activateSubscription(payment.org_id, payment, txId);
  // Webhook events have no authenticated user, so user_id is null (column allows null per migration 100)
  await db.query(
    `INSERT INTO audit_log (user_id, action, ip_address, meta) VALUES (null,$1,$2,$3)`,
    ['billing.webhook_processed', '0.0.0.0', 
     JSON.stringify({ txRef, flwTxId: txId, planId: payment.plan_id, orgId: payment.org_id })]
  );
  res.json({ received: true });
}

// CRITICAL FIX: New transaction-safe version for use within verify()
async function activateSubscriptionInTransaction(client, orgId, payment, flwTxId) {
  if (!flwTxId) {
    throw new Error('flwTxId is required for idempotency');
  }

  // Check if this flw_tx_id was already processed (strong idempotency)
  const { rows: txCheck } = await client.query(
    `SELECT 1 FROM payments WHERE flw_tx_id = $1 AND status = 'successful'`,
    [flwTxId]
  );
  
  if (txCheck.length) {
    // Already processed with this transaction ID
    return;
  }
  
  // Update payment status
  await client.query(
    `UPDATE payments SET status='successful', flw_tx_id=$1 WHERE tx_ref=$2`,
    [flwTxId, payment.tx_ref]
  );
  
  // Calculate subscription period
  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + payment.period_months);
  
  // Update or insert subscription
  await client.query(
    `INSERT INTO subscriptions (org_id, plan_id, status, current_period_start, current_period_end)
     VALUES ($1,$2,'active',$3,$4)
     ON CONFLICT (org_id) DO UPDATE SET
       plan_id = EXCLUDED.plan_id,
       status  = 'active',
       current_period_start = EXCLUDED.current_period_start,
       current_period_end   = EXCLUDED.current_period_end,
       updated_at = now()`,
    [orgId, payment.plan_id, periodStart, periodEnd]
  );
}

// Keep old function for webhook (wraps new function in transaction)
async function activateSubscription(orgId, payment, flwTxId) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await activateSubscriptionInTransaction(client, orgId, payment, flwTxId);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function cancelSubscription(req, res) {
  const { rows } = await db.query(
    `UPDATE subscriptions SET status = 'cancelled', updated_at = now()
     WHERE org_id = $1 AND status = 'active'
     RETURNING id, status`,
    [req.user.orgId]
  );
  if (!rows.length) return res.status(400).json({ error: 'No active subscription to cancel.' });
  await auditLog(req.user.id, 'subscription.cancelled', req.ip, { subId: rows[0].id });
  res.json({ subscription: rows[0] });
}

module.exports = { 
  getPlans, 
  getSubscription, 
  getPayments, 
  initiate, 
  verify, 
  webhook, 
  cancelSubscription,
  flutterwaveCircuitBreaker // Export for health checks
};
