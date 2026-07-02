const https = require('https');
const crypto = require('crypto');
const db = require('../db');

function flwGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: 'api.flutterwave.com', path, method: 'GET',
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch { reject(new Error('Bad JSON')); } });
      }
    );
    req.on('error', reject);
    req.end();
  });
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

  // Look up the pending payment
  const payRes = await db.query(
    `SELECT * FROM payments WHERE tx_ref = $1 AND org_id = $2`,
    [txRef, req.user.orgId]
  );
  if (!payRes.rows.length) return res.status(404).json({ error: 'Payment record not found.' });
  const payment = payRes.rows[0];

  // Already processed
  if (payment.status === 'successful') {
    const subRes = await db.query(
      `SELECT s.*, p.slug AS plan_slug, p.name AS plan_name FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.org_id=$1`,
      [req.user.orgId]
    );
    return res.json({ ok: true, subscription: subRes.rows[0] });
  }

  if (!keysConfigured()) return res.status(503).json({ error: 'Gateway not configured.' });

  let flwData;
  try {
    flwData = await flwGet(`/v3/transactions/${txId}/verify`);
  } catch {
    return res.status(502).json({ error: 'Unable to verify with Flutterwave.' });
  }

  if (flwData.status !== 'success' || flwData.data?.status !== 'successful') {
    await db.query(`UPDATE payments SET status='failed', flw_tx_id=$1 WHERE tx_ref=$2`, [String(txId), txRef]);
    return res.status(400).json({ error: 'Payment was not successful.' });
  }

  // Idempotency: check the amount matches
  if (flwData.data.amount < payment.amount_ngn || flwData.data.currency !== 'NGN') {
    await db.query(`UPDATE payments SET status='failed', flw_tx_id=$1 WHERE tx_ref=$2`, [String(txId), txRef]);
    return res.status(400).json({ error: 'Payment amount mismatch.' });
  }

  await activateSubscription(req.user.orgId, payment, String(txId));
  const subRes = await db.query(
    `SELECT s.*, p.slug AS plan_slug, p.name AS plan_name FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.org_id=$1`,
    [req.user.orgId]
  );
  res.json({ ok: true, subscription: subRes.rows[0] });
}

async function webhook(req, res) {
  // Verify Flutterwave secret hash
  const hash = req.headers['verif-hash'];
  if (!hash || hash !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
    return res.status(401).json({ error: 'Unauthorized.' });
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

  await activateSubscription(payRes.rows[0].org_id, payRes.rows[0], txId);
  res.json({ received: true });
}

async function activateSubscription(orgId, payment, flwTxId) {
  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + payment.period_months);

  await db.query(`UPDATE payments SET status='successful', flw_tx_id=$1 WHERE tx_ref=$2`, [flwTxId, payment.tx_ref]);

  await db.query(
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

module.exports = { getPlans, getSubscription, getPayments, initiate, verify, webhook };
