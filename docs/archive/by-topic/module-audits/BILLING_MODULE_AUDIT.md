# Billing & Subscription Module Audit Report

**Date:** July 13, 2026  
**Module:** Billing, Payments & Subscriptions  
**File:** `backend/src/controllers/billingController.js`  
**Payment Gateway:** Flutterwave  
**Status:** ⚠️ **CRITICAL ISSUES FOUND**

---

## Executive Summary

The billing module handles payment processing via Flutterwave for subscription upgrades. While the basic flow is implemented, **several critical security and reliability issues were identified** that could lead to financial loss, duplicate charges, or payment fraud. These issues must be fixed before production deployment.

**Security Rating:** 🔴 **Critical Issues** (5/10)

---

## Critical Issues Found 🔴

### 1. **Race Condition in Payment Verification**

**Severity:** 🔴 **CRITICAL**  
**Impact:** Duplicate subscription activation, financial loss

**Issue:**
```javascript
async function verify(req, res) {
  // ...
  if (payment.status === 'successful') {
    // Returns early if already processed
    return res.json({ ok: true, subscription: subRes.rows[0] });
  }
  // ...
  await activateSubscription(req.user.orgId, payment, String(txId));
}
```

**Problem:** If a user clicks "verify" multiple times rapidly, or if both webhook and manual verify are called simultaneously, the check `payment.status === 'successful'` may pass for both requests before either updates the status, leading to duplicate activation attempts.

**Fix Required:**
```javascript
async function verify(req, res) {
  const { txId, txRef } = req.body || {};
  if (!txId || !txRef) return res.status(400).json({ error: 'txId and txRef are required.' });

  // Use SELECT FOR UPDATE to lock the row
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const payRes = await client.query(
      `SELECT * FROM payments WHERE tx_ref = $1 AND org_id = $2 FOR UPDATE`,
      [txRef, req.user.orgId]
    );
    
    if (!payRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payment record not found.' });
    }
    
    const payment = payRes.rows[0];
    
    // Already processed - safe to return
    if (payment.status === 'successful') {
      await client.query('COMMIT');
      const subRes = await db.query(/* ... */);
      return res.json({ ok: true, subscription: subRes.rows[0] });
    }
    
    // Verify with Flutterwave...
    // Update payment status...
    // Activate subscription...
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

---

### 2. **Weak Idempotency Protection**

**Severity:** 🔴 **CRITICAL**  
**Impact:** Duplicate charges, incorrect subscription periods

**Issue:**
```javascript
async function activateSubscription(orgId, payment, flwTxId) {
  // Idempotency check only on flw_tx_id
  if (flwTxId) {
    const { rows: existing } = await db.query(
      `SELECT 1 FROM payments WHERE flw_tx_id = $1 AND status = 'successful' LIMIT 1`,
      [flwTxId]
    );
    if (existing.length) return;
  }
  // ...
}
```

**Problems:**
1. If `flwTxId` is null/empty, no idempotency check happens
2. Check happens AFTER the function is called, not before
3. No transaction wrapping - partial updates possible
4. Webhook can process while verify is running

**Fix Required:**
```javascript
async function activateSubscription(orgId, payment, flwTxId) {
  if (!flwTxId) {
    throw new Error('flwTxId is required for idempotency');
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Lock and check payment status
    const { rows: paymentCheck } = await client.query(
      `SELECT status FROM payments WHERE tx_ref = $1 FOR UPDATE`,
      [payment.tx_ref]
    );
    
    if (paymentCheck[0]?.status === 'successful') {
      await client.query('ROLLBACK');
      return; // Already processed
    }
    
    // Check flw_tx_id hasn't been used
    const { rows: txCheck } = await client.query(
      `SELECT 1 FROM payments WHERE flw_tx_id = $1 AND status = 'successful'`,
      [flwTxId]
    );
    
    if (txCheck.length) {
      await client.query('ROLLBACK');
      return; // Already processed with this transaction ID
    }
    
    // Update payment
    await client.query(
      `UPDATE payments SET status='successful', flw_tx_id=$1 WHERE tx_ref=$2`,
      [flwTxId, payment.tx_ref]
    );
    
    // Update subscription
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + payment.period_months);
    
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
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

---

### 3. **Missing Webhook Signature Verification**

**Severity:** 🔴 **CRITICAL**  
**Impact:** Payment fraud, unauthorized subscription activation

**Issue:**
```javascript
async function webhook(req, res) {
  // Only checks a static hash from headers
  const hash = req.headers['verif-hash'];
  if (!hash || hash !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  // ...
}
```

**Problems:**
1. Uses a static secret instead of HMAC signature
2. Vulnerable to replay attacks (no timestamp check)
3. No request body integrity verification
4. Attacker who obtains the hash can forge webhooks

**Fix Required:**
```javascript
async function webhook(req, res) {
  // Verify Flutterwave signature (HMAC-SHA256)
  const signature = req.headers['verif-hash'];
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature.' });
  }
  
  // Compute expected signature
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FLUTTERWAVE_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )) {
    return res.status(401).json({ error: 'Invalid signature.' });
  }
  
  // Check timestamp to prevent replay attacks (within 5 minutes)
  const timestamp = req.body?.created_at;
  if (!timestamp || Math.abs(Date.now() - new Date(timestamp).getTime()) > 5 * 60 * 1000) {
    return res.status(400).json({ error: 'Webhook too old or timestamp missing.' });
  }
  
  // Process webhook...
}
```

---

### 4. **No Amount Validation in Webhook**

**Severity:** 🔴 **CRITICAL**  
**Impact:** Subscription activation with incorrect payment amount

**Issue:**
```javascript
async function webhook(req, res) {
  // ...
  const payRes = await db.query(
    `SELECT * FROM payments WHERE tx_ref = $1 AND status = 'pending'`,
    [txRef]
  );
  if (!payRes.rows.length) return res.json({ received: true });
  
  // Directly activates without checking amount!
  await activateSubscription(payRes.rows[0].org_id, payRes.rows[0], txId);
}
```

**Problem:** Webhook doesn't verify that the paid amount matches the expected amount. An attacker could pay ₦1 and get a premium subscription.

**Fix Required:**
```javascript
async function webhook(req, res) {
  // ...
  const payment = payRes.rows[0];
  const paidAmount = event.data?.amount;
  const paidCurrency = event.data?.currency;
  
  // Verify amount and currency
  if (paidAmount < payment.amount_ngn || paidCurrency !== 'NGN') {
    await db.query(
      `UPDATE payments SET status='failed', flw_tx_id=$1 WHERE tx_ref=$2`,
      [txId, txRef]
    );
    await db.query(
      `INSERT INTO audit_log (user_id, action, ip_address, meta) VALUES (null,$1,$2,$3)`,
      ['billing.webhook_amount_mismatch', '0.0.0.0', 
       JSON.stringify({ txRef, expected: payment.amount_ngn, received: paidAmount })]
    );
    return res.json({ received: true, error: 'Amount mismatch' });
  }
  
  await activateSubscription(payment.org_id, payment, txId);
}
```

---

### 5. **Insufficient Error Handling**

**Severity:** 🟡 **HIGH**  
**Impact:** Silent failures, lost payments, poor user experience

**Issues:**
1. Flutterwave API errors return generic 502
2. No retry mechanism for failed verifications
3. No notification to user if webhook fails
4. No dead letter queue for failed webhooks

**Fix Required:**
```javascript
async function verify(req, res) {
  // ...
  let flwData;
  let retries = 3;
  
  while (retries > 0) {
    try {
      flwData = await flwGet(`/v3/transactions/${txId}/verify`);
      break;
    } catch (err) {
      retries--;
      if (retries === 0) {
        await db.query(
          `UPDATE payments SET status='verification_failed' WHERE tx_ref=$1`,
          [txRef]
        );
        await auditLog(req.user.id, 'billing.verify_error', req.ip, 
          { txRef, error: err.message });
        return res.status(502).json({ 
          error: 'Unable to verify payment. Please contact support with reference: ' + txRef 
        });
      }
      await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
    }
  }
  // ...
}
```

---

## High Priority Issues 🟡

### 6. **No Subscription Downgrade Logic**

**Severity:** 🟡 **HIGH**  
**Impact:** Users can't downgrade, poor UX

**Issue:** Only upgrade path exists. No logic for:
- Downgrading to a lower plan
- Handling prorated refunds
- Preserving data when downgrading
- Enforcing new plan limits

**Recommendation:** Implement downgrade flow with:
```javascript
async function changePlan(req, res) {
  const { newPlanId } = req.body;
  
  const currentSub = await getCurrentSubscription(req.user.orgId);
  const newPlan = await getPlan(newPlanId);
  
  if (newPlan.price_ngn < currentSub.plan.price_ngn) {
    // Downgrade - apply at end of current period
    await db.query(
      `UPDATE subscriptions SET pending_plan_id = $1 WHERE org_id = $2`,
      [newPlanId, req.user.orgId]
    );
    return res.json({ 
      message: 'Downgrade scheduled for end of billing period',
      effectiveDate: currentSub.current_period_end 
    });
  } else {
    // Upgrade - apply immediately with prorated charge
    const prorated = calculateProration(currentSub, newPlan);
    // Initiate payment for prorated amount...
  }
}
```

---

### 7. **No Subscription Renewal Logic**

**Severity:** 🟡 **HIGH**  
**Impact:** Subscriptions expire, no automatic renewal

**Issue:** No cron job or scheduled task to:
- Check for expiring subscriptions
- Send renewal reminders
- Automatically charge for renewals
- Handle failed renewal payments

**Recommendation:** Implement renewal system:
```javascript
// Cron job (run daily)
async function processRenewals() {
  const { rows: expiring } = await db.query(
    `SELECT s.*, u.email, u.full_name, p.price_ngn, p.name AS plan_name
     FROM subscriptions s
     JOIN users u ON u.org_id = s.org_id AND u.role = 'owner'
     JOIN plans p ON p.id = s.plan_id
     WHERE s.status = 'active' 
       AND s.current_period_end <= NOW() + INTERVAL '7 days'
       AND s.current_period_end > NOW()`
  );
  
  for (const sub of expiring) {
    // Send renewal reminder email
    await sendRenewalReminder(sub);
    
    // If within 24 hours of expiry, attempt auto-renewal
    if (new Date(sub.current_period_end) - Date.now() < 24 * 60 * 60 * 1000) {
      await attemptAutoRenewal(sub);
    }
  }
}
```

---

### 8. **Missing Payment Reconciliation**

**Severity:** 🟡 **HIGH**  
**Impact:** Financial discrepancies, audit issues

**Issue:** No mechanism to:
- Reconcile payments with Flutterwave
- Detect missing webhooks
- Handle stuck "pending" payments
- Generate financial reports

**Recommendation:** Add reconciliation endpoint:
```javascript
async function reconcile(req, res) {
  // Admin-only endpoint
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const { rows: pending } = await db.query(
    `SELECT * FROM payments 
     WHERE status = 'pending' 
       AND created_at < NOW() - INTERVAL '1 hour'`
  );
  
  const results = [];
  for (const payment of pending) {
    try {
      const flwData = await flwGet(`/v3/transactions/verify_by_reference?tx_ref=${payment.tx_ref}`);
      
      if (flwData.data?.status === 'successful') {
        await activateSubscription(payment.org_id, payment, String(flwData.data.id));
        results.push({ txRef: payment.tx_ref, action: 'activated' });
      } else if (flwData.data?.status === 'failed') {
        await db.query(`UPDATE payments SET status='failed' WHERE tx_ref=$1`, [payment.tx_ref]);
        results.push({ txRef: payment.tx_ref, action: 'marked_failed' });
      }
    } catch (err) {
      results.push({ txRef: payment.tx_ref, action: 'error', error: err.message });
    }
  }
  
  res.json({ reconciled: results });
}
```

---

### 9. **No Refund Handling**

**Severity:** 🟡 **HIGH**  
**Impact:** Manual refund process, poor customer service

**Issue:** No endpoints or logic for:
- Processing refunds
- Partial refunds
- Refund tracking
- Subscription adjustment after refund

**Recommendation:** Implement refund flow:
```javascript
async function initiateRefund(req, res) {
  // Admin-only
  const { paymentId, amount, reason } = req.body;
  
  const payment = await getPayment(paymentId);
  if (payment.status !== 'successful') {
    return res.status(400).json({ error: 'Can only refund successful payments' });
  }
  
  // Call Flutterwave refund API
  const refundData = await flwPost('/v3/transactions/' + payment.flw_tx_id + '/refund', {
    amount: amount || payment.amount_ngn,
  });
  
  // Record refund
  await db.query(
    `INSERT INTO refunds (payment_id, amount_ngn, reason, flw_refund_id, status)
     VALUES ($1,$2,$3,$4,'pending')`,
    [paymentId, amount, reason, refundData.data.id]
  );
  
  // Adjust subscription if full refund
  if (amount >= payment.amount_ngn) {
    await db.query(
      `UPDATE subscriptions SET status='cancelled' WHERE org_id=$1`,
      [payment.org_id]
    );
  }
  
  res.json({ refund: refundData.data });
}
```

---

## Medium Priority Issues 🟠

### 10. **No Plan Limit Enforcement**

**Severity:** 🟠 **MEDIUM**  
**Impact:** Users exceed plan limits without restriction

**Issue:** Plans have `max_users` field but no enforcement:
```javascript
// No check when adding team members
// No check when creating resources
// No warning when approaching limits
```

**Recommendation:** Add middleware to check limits:
```javascript
async function checkPlanLimits(req, res, next) {
  const sub = await getCurrentSubscription(req.user.orgId);
  const plan = sub.plan;
  
  // Check user limit
  const { rows: userCount } = await db.query(
    `SELECT COUNT(*) FROM users WHERE org_id = $1`,
    [req.user.orgId]
  );
  
  if (userCount[0].count >= plan.max_users) {
    return res.status(403).json({ 
      error: 'User limit reached. Upgrade your plan to add more users.',
      currentPlan: plan.name,
      limit: plan.max_users 
    });
  }
  
  next();
}

// Apply to team invitation endpoint
router.post('/team/invitations', checkPlanLimits, sendInvitation);
```

---

### 11. **Weak Transaction Reference Generation**

**Severity:** 🟠 **MEDIUM**  
**Impact:** Potential collision, predictable references

**Issue:**
```javascript
const txRef = `dph-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
```

**Problems:**
- Timestamp is predictable
- Only 4 random bytes (32 bits) - collision risk
- No checksum for validation

**Recommendation:**
```javascript
const txRef = `dph-${crypto.randomUUID()}`; // 128-bit UUID v4
// Or with timestamp for sorting:
const txRef = `dph-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
```

---

### 12. **No Payment Timeout Handling**

**Severity:** 🟠 **MEDIUM**  
**Impact:** Stuck pending payments, database bloat

**Issue:** Payments stay "pending" forever if user abandons checkout

**Recommendation:** Add cleanup job:
```javascript
// Cron job (run daily)
async function cleanupAbandonedPayments() {
  await db.query(
    `UPDATE payments SET status='abandoned' 
     WHERE status='pending' 
       AND created_at < NOW() - INTERVAL '24 hours'`
  );
}
```

---

### 13. **Missing Audit Trail for Subscription Changes**

**Severity:** 🟠 **MEDIUM**  
**Impact:** Difficult to debug subscription issues

**Issue:** Limited audit logging for subscription lifecycle events

**Recommendation:** Add comprehensive logging:
```javascript
// Log all subscription state changes
await auditLog(userId, 'subscription.activated', ip, {
  planId, planName, amount, periodStart, periodEnd
});
await auditLog(userId, 'subscription.cancelled', ip, {
  planId, reason, remainingDays
});
await auditLog(userId, 'subscription.renewed', ip, {
  planId, amount, newPeriodEnd
});
```

---

## Low Priority Issues 🟢

### 14. **No Currency Support Beyond NGN**

**Severity:** 🟢 **LOW**  
**Impact:** Limited to Nigerian market

**Issue:** Hardcoded to NGN only

**Recommendation:** Add multi-currency support when expanding internationally

---

### 15. **No Invoice Generation**

**Severity:** 🟢 **LOW**  
**Impact:** Manual invoice creation for accounting

**Issue:** No PDF invoices for payments

**Recommendation:** Generate invoices automatically:
```javascript
async function generateInvoice(paymentId) {
  const payment = await getPayment(paymentId);
  const org = await getOrganization(payment.org_id);
  
  const pdf = await generatePDF({
    invoiceNumber: `INV-${payment.id}`,
    date: payment.created_at,
    customer: org.name,
    items: [{
      description: `${payment.plan_name} - ${payment.period_months} month(s)`,
      amount: payment.amount_ngn,
    }],
    total: payment.amount_ngn,
  });
  
  return pdf;
}
```

---

## Security Best Practices Assessment

### ✅ Implemented

1. **Parameterized Queries** - All SQL uses parameterized queries
2. **Audit Logging** - Payment events are logged
3. **Amount Verification** - Verify endpoint checks amount matches
4. **Status Checks** - Checks payment status before processing

### ❌ Missing

1. **Rate Limiting** - No rate limits on payment endpoints
2. **CAPTCHA** - No bot protection on initiate endpoint
3. **IP Whitelisting** - No IP restrictions for webhooks
4. **Request Signing** - Weak webhook verification
5. **Idempotency Keys** - Weak idempotency protection
6. **Transaction Locking** - No row-level locking for concurrent requests

---

## API Endpoints Inventory

### Public Endpoints
| Method | Endpoint | Purpose | Auth | Rate Limit |
|--------|----------|---------|------|------------|
| GET | `/billing/plans` | List available plans | Optional | ❌ Missing |

### Protected Endpoints
| Method | Endpoint | Purpose | Auth | Rate Limit |
|--------|----------|---------|------|------------|
| GET | `/billing/subscription` | Get current subscription | Required | ❌ Missing |
| GET | `/billing/payments` | List payment history | Required | ❌ Missing |
| POST | `/billing/initiate` | Start payment flow | Required | ❌ Missing |
| POST | `/billing/verify` | Verify payment | Required | ❌ Missing |
| DELETE | `/billing/subscription` | Cancel subscription | Required | ❌ Missing |

### Webhook Endpoints
| Method | Endpoint | Purpose | Auth | Security |
|--------|----------|---------|------|----------|
| POST | `/billing/webhook` | Flutterwave webhook | Signature | ⚠️ Weak |

**Total Endpoints:** 7

---

## Testing Requirements

### Critical Tests Needed

```javascript
describe('Billing Security', () => {
  it('should prevent race conditions in payment verification');
  it('should enforce idempotency with flw_tx_id');
  it('should verify webhook signatures correctly');
  it('should validate payment amounts in webhook');
  it('should handle concurrent verify + webhook calls');
  it('should prevent duplicate subscription activation');
});

describe('Payment Flow', () => {
  it('should create pending payment on initiate');
  it('should verify payment with Flutterwave');
  it('should activate subscription on successful payment');
  it('should handle failed payments correctly');
  it('should process webhook events');
  it('should handle webhook replay attacks');
});

describe('Subscription Management', () => {
  it('should upgrade subscription immediately');
  it('should schedule downgrade for period end');
  it('should cancel subscription');
  it('should handle subscription renewal');
  it('should enforce plan limits');
});

describe('Error Handling', () => {
  it('should retry failed Flutterwave API calls');
  it('should handle network timeouts');
  it('should handle invalid webhook payloads');
  it('should handle missing environment variables');
});
```

---

## Implementation Priority

### 🔴 **MUST FIX BEFORE PRODUCTION** (Critical)

1. **Fix race condition in verify()** - Add row-level locking
2. **Strengthen idempotency** - Use transactions, check before processing
3. **Fix webhook signature verification** - Use HMAC, add timestamp check
4. **Add amount validation in webhook** - Verify paid amount matches expected
5. **Add comprehensive error handling** - Retry logic, user notifications

**Estimated Time:** 2-3 days

### 🟡 **HIGH PRIORITY** (Within 1 month)

6. Implement subscription renewal system
7. Add payment reconciliation endpoint
8. Implement refund handling
9. Add plan limit enforcement
10. Improve transaction reference generation

**Estimated Time:** 1-2 weeks

### 🟠 **MEDIUM PRIORITY** (Within 3 months)

11. Add payment timeout cleanup
12. Enhance audit logging
13. Add rate limiting to all endpoints
14. Implement downgrade flow
15. Add invoice generation

**Estimated Time:** 1 week

---

## Code Quality Improvements

### Refactoring Recommendations

**1. Extract Flutterwave Client**
```javascript
// utils/flutterwaveClient.js
class FlutterwaveClient {
  constructor(secretKey) {
    this.secretKey = secretKey;
  }
  
  async verifyTransaction(txId) {
    return this.get(`/v3/transactions/${txId}/verify`);
  }
  
  async get(path) {
    // Implement with retry logic, timeout, error handling
  }
  
  verifyWebhookSignature(payload, signature) {
    // Implement HMAC verification
  }
}

module.exports = new FlutterwaveClient(process.env.FLUTTERWAVE_SECRET_KEY);
```

**2. Add Payment State Machine**
```javascript
const PAYMENT_STATES = {
  PENDING: 'pending',
  VERIFYING: 'verifying',
  SUCCESSFUL: 'successful',
  FAILED: 'failed',
  ABANDONED: 'abandoned',
  REFUNDED: 'refunded',
};

const ALLOWED_TRANSITIONS = {
  pending: ['verifying', 'abandoned'],
  verifying: ['successful', 'failed'],
  successful: ['refunded'],
  // ...
};

function canTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to);
}
```

**3. Add Input Validation**
```javascript
const Joi = require('joi');

const initiateSchema = Joi.object({
  planId: Joi.string().uuid().required(),
  months: Joi.number().integer().min(1).max(12).default(1),
});

async function initiate(req, res) {
  const { error, value } = initiateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  
  const { planId, months } = value;
  // ...
}
```

---

## Monitoring & Alerting

### Metrics to Track

**Payment Metrics:**
- Payment initiation rate
- Payment success rate
- Payment failure rate
- Average payment verification time
- Webhook processing time
- Pending payment count
- Abandoned payment rate

**Subscription Metrics:**
- Active subscriptions by plan
- Subscription churn rate
- Upgrade/downgrade rate
- Renewal success rate
- Cancellation rate

**Financial Metrics:**
- Daily/monthly revenue
- Average revenue per user (ARPU)
- Payment reconciliation status
- Refund rate

### Recommended Alerts

```javascript
// Alert on high payment failure rate
if (failureRate > 0.1) { // 10%
  sendAlert('High payment failure rate', { rate: failureRate });
}

// Alert on stuck pending payments
if (pendingPaymentsOlderThan1Hour > 10) {
  sendAlert('Many stuck pending payments', { count: pendingPaymentsOlderThan1Hour });
}

// Alert on webhook processing failures
if (webhookFailuresLastHour > 5) {
  sendAlert('Webhook processing issues', { count: webhookFailuresLastHour });
}

// Alert on subscription cancellations
if (cancellationsToday > 10) {
  sendAlert('High cancellation rate', { count: cancellationsToday });
}
```

---

## Compliance Considerations

### PCI DSS Compliance

**Current Status:** ✅ **Compliant** (Flutterwave handles card data)

- ✅ No card data stored locally
- ✅ Payment processing delegated to PCI-compliant gateway
- ✅ Only transaction references stored

**Recommendations:**
- Document that Flutterwave is PCI DSS Level 1 certified
- Ensure SSL/TLS for all payment pages
- Regular security audits of payment flow

### Financial Regulations

**Required:**
- Transaction records retention (7 years minimum)
- Audit trail for all financial transactions
- Refund policy documentation
- Terms of service for subscriptions

---

## Documentation Needs

### Missing Documentation

1. **Payment Flow Diagram** - Visual representation of payment lifecycle
2. **Webhook Integration Guide** - How to set up webhooks in Flutterwave dashboard
3. **Error Code Reference** - All possible error codes and meanings
4. **Reconciliation Procedures** - How to reconcile payments manually
5. **Refund Policy** - When and how refunds are processed
6. **Plan Comparison** - Feature matrix for all plans

---

## Conclusion

The billing module has **critical security vulnerabilities** that must be fixed before production deployment. The race condition and weak idempotency protection could lead to financial loss. The webhook signature verification is insufficient and could allow payment fraud.

### Summary Scores

| Category | Score | Status |
|----------|-------|--------|
| Security | 5/10 | 🔴 Critical Issues |
| Reliability | 6/10 | 🟡 Needs Work |
| Code Quality | 7/10 | 🟡 Good |
| Completeness | 6/10 | 🟡 Missing Features |
| Testing | 3/10 | 🔴 No Tests |

### Immediate Actions Required

1. 🔴 **DO NOT DEPLOY TO PRODUCTION** until critical issues are fixed
2. 🔴 Fix race condition with row-level locking
3. 🔴 Strengthen idempotency with transactions
4. 🔴 Implement proper webhook signature verification
5. 🔴 Add amount validation in webhook handler
6. 🔴 Write comprehensive tests for payment flow

**Estimated Time to Production-Ready:** 2-3 days of focused development

---

**Audit Completed By:** Bob Shell  
**Date:** July 13, 2026  
**Next Review:** After critical fixes are implemented
