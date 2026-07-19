# Critical Fixes Implementation Guide

**Date:** July 13, 2026  
**Priority:** 🔴 **CRITICAL - MUST FIX BEFORE PRODUCTION**  
**Estimated Time:** 5-7 days

---

## Overview

This guide provides step-by-step instructions to fix the critical security and compliance issues found in the Billing and Email Marketing modules.

---

## Part 1: Billing Module Fixes (2-3 days)

### Issue 1: Race Condition in Payment Verification

**File:** `backend/src/controllers/billingController.js`  
**Function:** `verify()`  
**Risk:** Duplicate subscription activation, financial loss

**Current Code (Lines ~60-90):**
```javascript
async function verify(req, res) {
  const { txId, txRef } = req.body || {};
  
  const payRes = await db.query(
    `SELECT * FROM payments WHERE tx_ref = $1 AND org_id = $2`,
    [txRef, req.user.orgId]
  );
  
  if (payment.status === 'successful') {
    // Early return - but race condition possible
    return res.json({ ok: true, subscription: subRes.rows[0] });
  }
  
  // ... verification logic
  await activateSubscription(req.user.orgId, payment, String(txId));
}
```

**Fix:**
```javascript
async function verify(req, res) {
  const { txId, txRef } = req.body || {};
  if (!txId || !txRef) return res.status(400).json({ error: 'txId and txRef are required.' });

  // Use dedicated client for transaction with row-level locking
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Lock the payment row to prevent concurrent processing
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

    // Verify amount matches
    if (flwData.data.amount < payment.amount_ngn || flwData.data.currency !== 'NGN') {
      await client.query(
        `UPDATE payments SET status='failed', flw_tx_id=$1 WHERE tx_ref=$2`,
        [String(txId), txRef]
      );
      await client.query('COMMIT');
      await auditLog(req.user.id, 'billing.verify_failed', req.ip, 
        { txRef, flwTxId: txId, reason: 'amount/currency mismatch' });
      return res.status(400).json({ error: 'Payment amount mismatch.' });
    }

    // Activate subscription within the same transaction
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
```

---

### Issue 2: Weak Idempotency in activateSubscription

**File:** `backend/src/controllers/billingController.js`  
**Function:** `activateSubscription()`  
**Risk:** Duplicate activation, incorrect subscription periods

**Current Code:**
```javascript
async function activateSubscription(orgId, payment, flwTxId) {
  // Weak idempotency check
  if (flwTxId) {
    const { rows: existing } = await db.query(
      `SELECT 1 FROM payments WHERE flw_tx_id = $1 AND status = 'successful' LIMIT 1`,
      [flwTxId]
    );
    if (existing.length) return;
  }
  
  // No transaction - partial updates possible
  await db.query(`UPDATE payments SET status='successful', flw_tx_id=$1 WHERE tx_ref=$2`, 
    [flwTxId, payment.tx_ref]);
  await db.query(`INSERT INTO subscriptions ...`);
}
```

**Fix - Create New Function:**
```javascript
async function activateSubscriptionInTransaction(client, orgId, payment, flwTxId) {
  if (!flwTxId) {
    throw new Error('flwTxId is required for idempotency');
  }

  // Check if this flw_tx_id was already processed
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

// Keep old function for webhook (will be updated separately)
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
```

---

### Issue 3: Weak Webhook Signature Verification

**File:** `backend/src/controllers/billingController.js`  
**Function:** `webhook()`  
**Risk:** Payment fraud, unauthorized subscription activation

**Current Code:**
```javascript
async function webhook(req, res) {
  // Only checks static hash - vulnerable to replay attacks
  const hash = req.headers['verif-hash'];
  if (!hash || hash !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  // ... process webhook
}
```

**Fix:**
```javascript
const crypto = require('crypto');

async function webhook(req, res) {
  // Verify Flutterwave signature (HMAC-SHA256)
  const signature = req.headers['verif-hash'];
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature.' });
  }
  
  // Compute expected signature from request body
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
    console.error('Webhook signature mismatch');
    return res.status(401).json({ error: 'Invalid signature.' });
  }
  
  // Check timestamp to prevent replay attacks (within 5 minutes)
  const timestamp = req.body?.created_at;
  if (!timestamp) {
    return res.status(400).json({ error: 'Missing timestamp.' });
  }
  
  const age = Math.abs(Date.now() - new Date(timestamp).getTime());
  if (age > 5 * 60 * 1000) {
    return res.status(400).json({ error: 'Webhook too old.' });
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
  if (!payRes.rows.length) return res.json({ received: true });

  const payment = payRes.rows[0];
  const paidAmount = event.data?.amount;
  const paidCurrency = event.data?.currency;
  
  // CRITICAL: Verify amount and currency match
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
  await db.query(
    `INSERT INTO audit_log (user_id, action, ip_address, meta) VALUES (null,$1,$2,$3)`,
    ['billing.webhook_processed', '0.0.0.0', 
     JSON.stringify({ txRef, flwTxId: txId, planId: payment.plan_id, orgId: payment.org_id })]
  );
  res.json({ received: true });
}
```

**Environment Variable Update:**
```bash
# Add to .env
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret_from_flutterwave_dashboard
```

---

### Issue 4: Add Rate Limiting

**File:** `backend/src/routes/billing.js` (or wherever routes are defined)

**Add:**
```javascript
const rateLimit = require('express-rate-limit');

const billingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many billing requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to sensitive endpoints
router.post('/initiate', billingLimiter, initiate);
router.post('/verify', billingLimiter, verify);
```

---

## Part 2: Email Module Fixes (3-4 days)

### Issue 1: Add Rate Limiting on Campaign Sending

**File:** `backend/src/controllers/emailController.js`  
**Function:** `sendCampaign()`

**Add Before Function:**
```javascript
const rateLimit = require('express-rate-limit');

// In routes file
const campaignLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 campaigns per hour
  message: 'Too many campaigns sent. Please try again later.',
});

router.post('/campaigns/:id/send', campaignLimiter, sendCampaign);
```

**Add Daily Limit Check:**
```javascript
async function sendCampaign(req, res) {
  const { id } = req.params;

  // ... existing campaign fetch logic ...

  // Check daily email quota
  const { rows: dailyCount } = await db.query(
    `SELECT COALESCE(SUM(
      (SELECT COUNT(*) FROM email_subscribers 
       WHERE list_id = c.list_id AND status = 'subscribed')
    ), 0) AS emails_sent_today
     FROM email_campaigns c
     WHERE c.org_id = $1 
       AND c.sent_at >= CURRENT_DATE 
       AND c.status = 'sent'`,
    [req.user.orgId]
  );
  
  const emailsSentToday = Number(dailyCount.rows[0].emails_sent_today);
  const DAILY_LIMIT = 10000; // Adjust based on plan
  
  if (emailsSentToday + subscribers.length > DAILY_LIMIT) {
    return res.status(429).json({ 
      error: `Daily email limit reached (${DAILY_LIMIT}). Upgrade your plan for higher limits.`,
      sent: emailsSentToday,
      limit: DAILY_LIMIT
    });
  }
  
  // ... rest of sending logic
}
```

---

### Issue 2: Add Email Validation

**Create New File:** `backend/src/utils/emailValidator.js`

```javascript
const validator = require('validator');
const dns = require('dns').promises;

// List of disposable email domains (expand as needed)
const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'throwaway.email',
  'mailinator.com',
  'trashmail.com',
];

async function validateEmail(email) {
  // Format validation
  if (!validator.isEmail(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }
  
  // Check for disposable email domains
  const domain = email.split('@')[1].toLowerCase();
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return { valid: false, reason: 'Disposable email addresses not allowed' };
  }
  
  // Check if domain has MX records (optional but recommended)
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: 'Email domain has no mail servers' };
    }
  } catch (err) {
    return { valid: false, reason: 'Email domain does not exist' };
  }
  
  return { valid: true };
}

module.exports = { validateEmail };
```

**Update addSubscriber:**
```javascript
const { validateEmail } = require('../utils/emailValidator');

async function addSubscriber(req, res) {
  const { listId } = req.params;
  const { email, name } = req.body || {};

  const listCheck = await db.query(
    `SELECT id FROM email_lists WHERE id = $1 AND org_id = $2`,
    [listId, req.user.orgId]
  );
  if (!listCheck.rows.length) return res.status(404).json({ error: 'List not found.' });

  if (!email || !String(email).trim()) {
    return res.status(400).json({ error: 'email is required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  
  // Validate email
  const validation = await validateEmail(normalizedEmail);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  const { rows } = await db.query(
    `INSERT INTO email_subscribers (list_id, org_id, email, name, status)
     VALUES ($1, $2, $3, $4, 'subscribed')
     ON CONFLICT (list_id, email) DO UPDATE
       SET status = 'subscribed', name = EXCLUDED.name
     RETURNING id, email, name, status, subscribed_at`,
    [listId, req.user.orgId, normalizedEmail, name || null]
  );
  res.status(201).json({ subscriber: rows[0] });
}
```

---

### Issue 3: Add Unsubscribe Tracking

**Database Migration:** `backend/db/122_email_unsubscribe_tracking.sql`

```sql
-- Add unsubscribe tracking columns
ALTER TABLE email_subscribers 
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT;

-- Add index for unsubscribe queries
CREATE INDEX IF NOT EXISTS idx_email_subscribers_unsubscribed 
ON email_subscribers(unsubscribed_at) 
WHERE status = 'unsubscribed';
```

**Update unsubscribe function:**
```javascript
async function unsubscribe(req, res) {
  const { id } = req.params;
  const { reason } = req.body || {};
  
  const { rows } = await db.query(
    `UPDATE email_subscribers 
     SET status = 'unsubscribed',
         unsubscribed_at = now(),
         unsubscribe_reason = $2
     WHERE id = $1
     RETURNING email, list_id`,
    [id, reason || null]
  );
  
  if (!rows.length) {
    return res.status(404).json({ error: 'Subscriber not found.' });
  }
  
  // Log unsubscribe event
  await db.query(
    `INSERT INTO audit_log (user_id, action, ip_address, meta) 
     VALUES (null, 'email.unsubscribed', $1, $2)`,
    [req.ip, JSON.stringify({ subscriberId: id, email: rows[0].email, reason })]
  );
  
  res.json({ ok: true, message: 'You have been unsubscribed.' });
}
```

---

### Issue 4: Add Double Opt-In

**Database Migration:** `backend/db/123_email_double_optin.sql`

```sql
-- Add confirmation token column
ALTER TABLE email_subscribers 
ADD COLUMN IF NOT EXISTS confirmation_token VARCHAR(64),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

-- Add index for confirmation lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_confirmation 
ON email_subscribers(confirmation_token) 
WHERE confirmation_token IS NOT NULL;
```

**Update addSubscriber:**
```javascript
const crypto = require('crypto');

async function addSubscriber(req, res) {
  // ... existing validation ...
  
  // Create subscriber with 'pending' status
  const confirmationToken = crypto.randomBytes(32).toString('hex');
  
  const { rows } = await db.query(
    `INSERT INTO email_subscribers (list_id, org_id, email, name, status, confirmation_token)
     VALUES ($1, $2, $3, $4, 'pending', $5)
     ON CONFLICT (list_id, email) DO UPDATE
       SET status = 'pending', 
           confirmation_token = EXCLUDED.confirmation_token,
           name = EXCLUDED.name
     RETURNING id, email, confirmation_token`,
    [listId, req.user.orgId, normalizedEmail, name || null, confirmationToken]
  );
  
  // Send confirmation email
  const confirmUrl = `${process.env.FRONTEND_ORIGIN}/confirm-subscription/${confirmationToken}`;
  const { sendMail } = require('../utils/mailer');
  
  await sendMail({
    to: normalizedEmail,
    subject: 'Confirm your subscription',
    html: `<p>Please confirm your subscription by clicking the link below:</p>
<p><a href="${confirmUrl}">Confirm Subscription</a></p>
<p style="font-size:12px;color:#888;">This link expires in 24 hours.</p>`,
  });
  
  res.status(201).json({ 
    subscriber: { id: rows[0].id, email: rows[0].email, status: 'pending' },
    message: 'Confirmation email sent' 
  });
}

// Add new confirmation endpoint
async function confirmSubscription(req, res) {
  const { token } = req.params;
  
  const { rows } = await db.query(
    `UPDATE email_subscribers 
     SET status = 'subscribed', 
         subscribed_at = now(),
         confirmed_at = now(),
         confirmation_token = NULL
     WHERE confirmation_token = $1 AND status = 'pending'
     RETURNING id, email, list_id`,
    [token]
  );
  
  if (!rows.length) {
    return res.status(404).json({ error: 'Invalid or expired confirmation token.' });
  }
  
  res.json({ ok: true, message: 'Subscription confirmed!' });
}

// Export new function
module.exports = {
  // ... existing exports
  confirmSubscription,
};
```

---

### Issue 5: Move to Background Job Queue

**Install Dependencies:**
```bash
npm install bull redis
```

**Create Queue:** `backend/src/queues/emailQueue.js`

```javascript
const Queue = require('bull');
const db = require('../db');
const nodemailer = require('nodemailer');

const emailQueue = new Queue('email-campaigns', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
});

// Process email campaigns
emailQueue.process('send-campaign', async (job) => {
  const { campaignId, orgId } = job.data;
  
  try {
    // Fetch campaign
    const campaignResult = await db.query(
      `SELECT c.*, o.name AS org_name
       FROM email_campaigns c
       JOIN organizations o ON o.id = c.org_id
       WHERE c.id = $1 AND c.org_id = $2`,
      [campaignId, orgId]
    );
    
    if (!campaignResult.rows.length) {
      throw new Error('Campaign not found');
    }
    
    const campaign = campaignResult.rows[0];
    
    // Fetch subscribers
    const subscribersResult = await db.query(
      `SELECT id, email, name FROM email_subscribers
       WHERE list_id = $1 AND status = 'subscribed'`,
      [campaign.list_id]
    );
    
    const subscribers = subscribersResult.rows;
    const transport = nodemailer.createTransport({ 
      sendmail: true, 
      path: '/usr/sbin/sendmail' 
    });
    
    const fromAddress = process.env.ADMIN_EMAIL || 'noreply@digitpenhub.com';
    const baseUrl = process.env.FRONTEND_ORIGIN || 'https://suite.digitpenhub.com';
    
    let sent = 0;
    const errors = [];
    
    for (const sub of subscribers) {
      const unsubLink = `${baseUrl}/api/v1/email/unsubscribe/${sub.id}`;
      const html = `${campaign.body_html}
<br><br>
<p style="font-size:12px;color:#888;">
  You received this email because you subscribed to ${campaign.org_name}.<br>
  <a href="${unsubLink}">Unsubscribe</a>
</p>`;
      
      try {
        await transport.sendMail({
          from: `"${campaign.org_name}" <${fromAddress}>`,
          to: sub.name ? `"${sub.name}" <${sub.email}>` : sub.email,
          subject: campaign.subject,
          html,
        });
        sent++;
        
        // Update progress
        job.progress((sent / subscribers.length) * 100);
        
        // Rate limiting: wait 100ms between emails
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        errors.push({ email: sub.email, error: err.message });
      }
    }
    
    // Update campaign status
    await db.query(
      `UPDATE email_campaigns 
       SET status = 'sent', sent_at = now(), updated_at = now() 
       WHERE id = $1`,
      [campaignId]
    );
    
    return { sent, errors, total: subscribers.length };
  } catch (err) {
    // Update campaign status to failed
    await db.query(
      `UPDATE email_campaigns SET status = 'failed', updated_at = now() WHERE id = $1`,
      [campaignId]
    );
    throw err;
  }
});

module.exports = emailQueue;
```

**Update sendCampaign:**
```javascript
const emailQueue = require('../queues/emailQueue');

async function sendCampaign(req, res) {
  const { id } = req.params;

  // ... existing validation ...

  // Queue campaign for background processing
  const job = await emailQueue.add('send-campaign', {
    campaignId: id,
    orgId: req.user.orgId,
  });
  
  // Update status to 'sending'
  await db.query(
    `UPDATE email_campaigns SET status = 'sending', updated_at = now() WHERE id = $1`,
    [id]
  );
  
  res.json({ 
    ok: true, 
    message: 'Campaign queued for sending',
    jobId: job.id 
  });
}

// Add endpoint to check job status
async function getCampaignJobStatus(req, res) {
  const { jobId } = req.params;
  
  const job = await emailQueue.getJob(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const state = await job.getState();
  const progress = job.progress();
  const result = job.returnvalue;
  
  res.json({ state, progress, result });
}
```

---

## Testing Checklist

### Billing Module Tests

- [ ] Test payment verification with concurrent requests
- [ ] Test webhook with valid signature
- [ ] Test webhook with invalid signature
- [ ] Test webhook with replay attack (old timestamp)
- [ ] Test webhook with amount mismatch
- [ ] Test idempotency with same flw_tx_id
- [ ] Test rate limiting on initiate/verify endpoints

### Email Module Tests

- [ ] Test email validation (valid, invalid, disposable)
- [ ] Test rate limiting on campaign sending
- [ ] Test daily email limit enforcement
- [ ] Test double opt-in flow
- [ ] Test unsubscribe tracking
- [ ] Test background job queue
- [ ] Test campaign progress tracking

---

## Deployment Steps

1. **Backup Database:**
   ```bash
   pg_dump -h localhost -U postgres digitpenhub > backup_before_fixes.sql
   ```

2. **Install Dependencies:**
   ```bash
   cd backend
   npm install express-rate-limit validator bull redis isomorphic-dompurify
   ```

3. **Run Migrations:**
   ```bash
   npm run migrate
   ```

4. **Update Environment Variables:**
   ```bash
   # Add to .env
   FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

5. **Start Redis (for email queue):**
   ```bash
   sudo systemctl start redis
   ```

6. **Restart Application:**
   ```bash
   pm2 restart all
   ```

7. **Test Critical Paths:**
   - Payment verification
   - Webhook processing
   - Email campaign sending
   - Subscriber management

---

## Rollback Plan

If issues are found after deployment:

1. **Stop Application:**
   ```bash
   pm2 stop all
   ```

2. **Restore Database:**
   ```bash
   psql -h localhost -U postgres digitpenhub < backup_before_fixes.sql
   ```

3. **Restore Code:**
   ```bash
   git checkout HEAD~1  # Or specific commit before fixes
   ```

4. **Restart Application:**
   ```bash
   pm2 restart all
   ```

---

## Success Criteria

- [ ] All billing tests pass
- [ ] All email tests pass
- [ ] No race conditions in payment verification
- [ ] Webhook signature verification works
- [ ] Email validation prevents invalid addresses
- [ ] Rate limiting prevents abuse
- [ ] Double opt-in complies with GDPR
- [ ] Unsubscribe tracking complies with CAN-SPAM
- [ ] Background jobs process campaigns successfully

---

**Estimated Total Time:** 5-7 days  
**Priority:** 🔴 CRITICAL  
**Status:** Ready to implement

