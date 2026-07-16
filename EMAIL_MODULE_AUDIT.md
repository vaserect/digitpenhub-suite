# Email Marketing Module Audit Report

**Date:** July 13, 2026  
**Module:** Email Marketing (Lists, Subscribers, Campaigns)  
**File:** `backend/src/controllers/emailController.js`  
**Status:** ⚠️ **Security Issues Found - Needs Fixes**

---

## Executive Summary

The email marketing module handles subscriber lists, campaign management, and email sending via Postfix/sendmail. While the basic functionality is implemented, **several security and reliability issues were identified** that could lead to spam abuse, email deliverability problems, and compliance violations. These issues should be addressed before production deployment.

**Security Rating:** 🟡 **Moderate** (6.5/10)

---

## Critical Issues Found 🔴

### 1. **No Rate Limiting on Email Sending**

**Severity:** 🔴 **CRITICAL**  
**Impact:** Spam abuse, IP blacklisting, service suspension

**Issue:**
```javascript
async function sendCampaign(req, res) {
  // No rate limiting - can send unlimited emails
  for (const sub of subscribers) {
    await transport.sendMail({ /* ... */ });
    sent++;
  }
}
```

**Problems:**
1. No limit on campaign sends per hour/day
2. No limit on total emails sent
3. Could exhaust server resources
4. Risk of IP blacklisting by spam filters
5. Could violate email service provider terms

**Fix Required:**
```javascript
// Add rate limiting middleware
const campaignLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 campaigns per hour
  message: 'Too many campaigns sent. Please try again later.',
});

router.post('/campaigns/:id/send', campaignLimiter, sendCampaign);

// Add daily email limit check
async function sendCampaign(req, res) {
  // Check daily email quota
  const { rows: dailyCount } = await db.query(
    `SELECT COUNT(*) FROM email_campaigns 
     WHERE org_id = $1 
       AND sent_at >= CURRENT_DATE 
       AND status = 'sent'`,
    [req.user.orgId]
  );
  
  const emailsSentToday = Number(dailyCount[0].count) * subscribers.length;
  const DAILY_LIMIT = 10000; // Adjust based on plan
  
  if (emailsSentToday + subscribers.length > DAILY_LIMIT) {
    return res.status(429).json({ 
      error: `Daily email limit reached (${DAILY_LIMIT}). Upgrade your plan for higher limits.` 
    });
  }
  
  // ... send emails
}
```

---

### 2. **No Email Validation**

**Severity:** 🔴 **CRITICAL**  
**Impact:** Invalid emails, bounce rate, spam complaints

**Issue:**
```javascript
async function addSubscriber(req, res) {
  // Only checks if email exists, not if it's valid
  if (!email || !String(email).trim()) return res.status(400).json({ error: 'email is required.' });
  
  // No format validation, no domain check, no disposable email check
  const { rows } = await db.query(
    `INSERT INTO email_subscribers (list_id, org_id, email, name, status)
     VALUES ($1, $2, $3, $4, 'subscribed')`,
    [listId, req.user.orgId, String(email).trim().toLowerCase(), name || null]
  );
}
```

**Problems:**
1. No email format validation
2. No domain existence check (DNS MX records)
3. No disposable email detection
4. No duplicate email check across lists
5. Could add invalid emails that bounce

**Fix Required:**
```javascript
const validator = require('validator');
const dns = require('dns').promises;

async function validateEmail(email) {
  // Format validation
  if (!validator.isEmail(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }
  
  // Check for disposable email domains
  const disposableDomains = ['tempmail.com', 'guerrillamail.com', '10minutemail.com'];
  const domain = email.split('@')[1];
  if (disposableDomains.includes(domain)) {
    return { valid: false, reason: 'Disposable email addresses not allowed' };
  }
  
  // Check if domain has MX records (optional but recommended)
  try {
    await dns.resolveMx(domain);
  } catch {
    return { valid: false, reason: 'Email domain does not exist' };
  }
  
  return { valid: true };
}

async function addSubscriber(req, res) {
  const { email, name } = req.body || {};
  
  if (!email || !String(email).trim()) {
    return res.status(400).json({ error: 'email is required.' });
  }
  
  const normalizedEmail = String(email).trim().toLowerCase();
  const validation = await validateEmail(normalizedEmail);
  
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }
  
  // ... rest of logic
}
```

---

### 3. **No Unsubscribe Tracking**

**Severity:** 🔴 **CRITICAL**  
**Impact:** CAN-SPAM Act violation, legal liability

**Issue:**
```javascript
async function unsubscribe(req, res) {
  // Updates status but doesn't track when/why
  await db.query(
    `UPDATE email_subscribers SET status = 'unsubscribed' WHERE id = $1`,
    [id]
  );
  res.json({ ok: true, message: 'You have been unsubscribed.' });
}
```

**Problems:**
1. No timestamp for unsubscribe
2. No reason tracking
3. No audit trail
4. Could re-subscribe unsubscribed users
5. CAN-SPAM Act requires unsubscribe tracking

**Fix Required:**
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
    `INSERT INTO email_events (subscriber_id, event_type, created_at)
     VALUES ($1, 'unsubscribed', now())`,
    [id]
  );
  
  res.json({ ok: true, message: 'You have been unsubscribed.' });
}
```

---

## High Priority Issues 🟡

### 4. **No Bounce Handling**

**Severity:** 🟡 **HIGH**  
**Impact:** Poor deliverability, wasted resources

**Issue:** No mechanism to handle bounced emails

**Recommendation:**
```javascript
// Add bounce webhook endpoint
async function handleBounce(req, res) {
  const { email, bounceType } = req.body;
  
  if (bounceType === 'hard') {
    // Hard bounce - permanently invalid email
    await db.query(
      `UPDATE email_subscribers 
       SET status = 'bounced', bounced_at = now()
       WHERE email = $1`,
      [email]
    );
  } else if (bounceType === 'soft') {
    // Soft bounce - temporary issue, track count
    await db.query(
      `UPDATE email_subscribers 
       SET soft_bounce_count = soft_bounce_count + 1
       WHERE email = $1`,
      [email]
    );
    
    // After 3 soft bounces, mark as bounced
    await db.query(
      `UPDATE email_subscribers 
       SET status = 'bounced', bounced_at = now()
       WHERE email = $1 AND soft_bounce_count >= 3`,
      [email]
    );
  }
  
  res.json({ ok: true });
}
```

---

### 5. **No Spam Complaint Handling**

**Severity:** 🟡 **HIGH**  
**Impact:** IP blacklisting, account suspension

**Issue:** No mechanism to handle spam complaints

**Recommendation:**
```javascript
async function handleComplaint(req, res) {
  const { email } = req.body;
  
  // Immediately unsubscribe and mark as complained
  await db.query(
    `UPDATE email_subscribers 
     SET status = 'complained',
         complained_at = now()
     WHERE email = $1`,
    [email]
  );
  
  // Log complaint event
  await db.query(
    `INSERT INTO email_events (subscriber_id, event_type, created_at)
     SELECT id, 'complained', now()
     FROM email_subscribers
     WHERE email = $1`,
    [email]
  );
  
  // Alert admin
  await notifyAdmin({
    type: 'spam_complaint',
    email,
    message: 'User marked email as spam',
  });
  
  res.json({ ok: true });
}
```

---

### 6. **Synchronous Email Sending**

**Severity:** 🟡 **HIGH**  
**Impact:** Slow API responses, timeout risk

**Issue:**
```javascript
async function sendCampaign(req, res) {
  // Sends all emails synchronously - blocks response
  for (const sub of subscribers) {
    await transport.sendMail({ /* ... */ });
    sent++;
  }
  
  res.json({ ok: true, sent, errors });
}
```

**Problems:**
1. Blocks HTTP response until all emails sent
2. Risk of timeout for large lists
3. No progress tracking
4. Poor user experience

**Fix Required:**
```javascript
// Use background job queue (e.g., Bull, BullMQ)
const Queue = require('bull');
const emailQueue = new Queue('email-campaigns');

async function sendCampaign(req, res) {
  const { id } = req.params;
  
  // Validate campaign...
  
  // Queue campaign for background processing
  const job = await emailQueue.add('send-campaign', {
    campaignId: id,
    orgId: req.user.orgId,
  });
  
  // Update status to 'sending'
  await db.query(
    `UPDATE email_campaigns SET status = 'sending' WHERE id = $1`,
    [id]
  );
  
  res.json({ 
    ok: true, 
    message: 'Campaign queued for sending',
    jobId: job.id 
  });
}

// Background worker
emailQueue.process('send-campaign', async (job) => {
  const { campaignId, orgId } = job.data;
  
  // Fetch campaign and subscribers
  // Send emails with rate limiting
  // Update campaign status
  // Track progress
});
```

---

### 7. **No Double Opt-In**

**Severity:** 🟡 **HIGH**  
**Impact:** GDPR compliance, spam complaints

**Issue:** Subscribers are immediately active without confirmation

**Recommendation:**
```javascript
async function addSubscriber(req, res) {
  const { email, name } = req.body || {};
  
  // ... validation ...
  
  // Create subscriber with 'pending' status
  const { rows } = await db.query(
    `INSERT INTO email_subscribers (list_id, org_id, email, name, status, confirmation_token)
     VALUES ($1, $2, $3, $4, 'pending', $5)
     ON CONFLICT (list_id, email) DO UPDATE
       SET status = 'pending', confirmation_token = EXCLUDED.confirmation_token
     RETURNING id, email, confirmation_token`,
    [listId, req.user.orgId, normalizedEmail, name || null, crypto.randomBytes(32).toString('hex')]
  );
  
  // Send confirmation email
  const confirmUrl = `${process.env.FRONTEND_ORIGIN}/confirm-subscription/${rows[0].confirmation_token}`;
  await sendMail({
    to: normalizedEmail,
    subject: 'Confirm your subscription',
    html: `<p>Please confirm your subscription by clicking the link below:</p>
<p><a href="${confirmUrl}">Confirm Subscription</a></p>`,
  });
  
  res.status(201).json({ 
    subscriber: rows[0],
    message: 'Confirmation email sent' 
  });
}

// Confirmation endpoint
async function confirmSubscription(req, res) {
  const { token } = req.params;
  
  const { rows } = await db.query(
    `UPDATE email_subscribers 
     SET status = 'subscribed', 
         subscribed_at = now(),
         confirmation_token = NULL
     WHERE confirmation_token = $1
     RETURNING id, email`,
    [token]
  );
  
  if (!rows.length) {
    return res.status(404).json({ error: 'Invalid confirmation token.' });
  }
  
  res.json({ ok: true, message: 'Subscription confirmed!' });
}
```

---

### 8. **No Email Content Sanitization**

**Severity:** 🟡 **HIGH**  
**Impact:** XSS in email clients, phishing risk

**Issue:**
```javascript
async function createCampaign(req, res) {
  // No sanitization of bodyHtml
  const { rows } = await db.query(
    `INSERT INTO email_campaigns (org_id, list_id, subject, preview_text, body_html)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.user.orgId, listId || null, String(subject).trim(), previewText || null, bodyHtml || '']
  );
}
```

**Fix Required:**
```javascript
const DOMPurify = require('isomorphic-dompurify');

async function createCampaign(req, res) {
  const { listId, subject, previewText, bodyHtml } = req.body || {};
  
  // Sanitize HTML content
  const sanitizedHtml = DOMPurify.sanitize(bodyHtml || '', {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style'],
  });
  
  const { rows } = await db.query(
    `INSERT INTO email_campaigns (org_id, list_id, subject, preview_text, body_html)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.user.orgId, listId || null, String(subject).trim(), previewText || null, sanitizedHtml]
  );
  
  res.status(201).json({ campaign: rows[0] });
}
```

---

## Medium Priority Issues 🟠

### 9. **No Email Analytics**

**Severity:** 🟠 **MEDIUM**  
**Impact:** No visibility into campaign performance

**Issue:** Opens and clicks tracked but not implemented

**Recommendation:**
```javascript
// Add tracking pixel for opens
async function sendCampaign(req, res) {
  // ... existing code ...
  
  for (const sub of subscribers) {
    const trackingPixel = `<img src="${baseUrl}/api/v1/email/track/open/${campaign.id}/${sub.id}" width="1" height="1" />`;
    const html = `${campaign.body_html}${trackingPixel}
<br><br>
<p style="font-size:12px;color:#888;">
  You received this email because you subscribed to ${campaign.org_name}.<br>
  <a href="${unsubLink}">Unsubscribe</a>
</p>`;
    
    // ... send email
  }
}

// Track open endpoint
async function trackOpen(req, res) {
  const { campaignId, subscriberId } = req.params;
  
  await db.query(
    `UPDATE email_campaigns SET opens = opens + 1 WHERE id = $1`,
    [campaignId]
  );
  
  await db.query(
    `INSERT INTO email_events (campaign_id, subscriber_id, event_type, created_at)
     VALUES ($1, $2, 'opened', now())
     ON CONFLICT (campaign_id, subscriber_id, event_type) DO NOTHING`,
    [campaignId, subscriberId]
  );
  
  // Return 1x1 transparent pixel
  res.set('Content-Type', 'image/gif');
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
}

// Track click endpoint
async function trackClick(req, res) {
  const { campaignId, subscriberId, url } = req.params;
  
  await db.query(
    `UPDATE email_campaigns SET clicks = clicks + 1 WHERE id = $1`,
    [campaignId]
  );
  
  await db.query(
    `INSERT INTO email_events (campaign_id, subscriber_id, event_type, metadata, created_at)
     VALUES ($1, $2, 'clicked', $3, now())`,
    [campaignId, subscriberId, JSON.stringify({ url })]
  );
  
  res.redirect(url);
}
```

---

### 10. **No List Segmentation**

**Severity:** 🟠 **MEDIUM**  
**Impact:** Poor targeting, lower engagement

**Issue:** No way to segment subscribers by criteria

**Recommendation:**
```javascript
async function createSegment(req, res) {
  const { listId, name, criteria } = req.body;
  
  // criteria: { tags: ['vip'], status: 'subscribed', joinedAfter: '2024-01-01' }
  
  const { rows } = await db.query(
    `INSERT INTO email_segments (list_id, org_id, name, criteria)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [listId, req.user.orgId, name, JSON.stringify(criteria)]
  );
  
  res.status(201).json({ segment: rows[0] });
}

async function sendToSegment(req, res) {
  const { campaignId, segmentId } = req.body;
  
  // Fetch segment criteria and filter subscribers
  // Send campaign only to matching subscribers
}
```

---

### 11. **No Import Validation**

**Severity:** 🟠 **MEDIUM**  
**Impact:** Invalid data, poor list quality

**Issue:**
```javascript
async function importSubscribers(req, res) {
  // No validation of CSV format or data quality
  for (const line of lines) {
    const [rawEmail, rawName] = line.split(',').map((s) => s.trim());
    const email = rawEmail ? rawEmail.toLowerCase() : '';
    if (!email || !email.includes('@')) continue; // Weak validation
    // ... insert
  }
}
```

**Fix Required:**
```javascript
async function importSubscribers(req, res) {
  const { csv } = req.body || {};
  
  if (!csv || !String(csv).trim()) {
    return res.status(400).json({ error: 'csv is required.' });
  }
  
  const lines = String(csv).split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  
  if (lines.length > 10000) {
    return res.status(400).json({ error: 'Maximum 10,000 subscribers per import.' });
  }
  
  const results = {
    imported: 0,
    skipped: 0,
    errors: [],
  };
  
  for (const line of lines) {
    const [rawEmail, rawName] = line.split(',').map((s) => s.trim());
    const email = rawEmail ? rawEmail.toLowerCase() : '';
    
    // Validate email
    const validation = await validateEmail(email);
    if (!validation.valid) {
      results.errors.push({ email, reason: validation.reason });
      results.skipped++;
      continue;
    }
    
    try {
      await db.query(
        `INSERT INTO email_subscribers (list_id, org_id, email, name, status)
         VALUES ($1, $2, $3, $4, 'subscribed')
         ON CONFLICT (list_id, email) DO UPDATE SET status = 'subscribed', name = EXCLUDED.name`,
        [listId, req.user.orgId, email, rawName || null]
      );
      results.imported++;
    } catch (err) {
      results.errors.push({ email, reason: err.message });
      results.skipped++;
    }
  }
  
  res.json(results);
}
```

---

## Low Priority Issues 🟢

### 12. **No Email Templates**

**Severity:** 🟢 **LOW**  
**Impact:** Users must create HTML from scratch

**Recommendation:** Add pre-built email templates

---

### 13. **No A/B Testing**

**Severity:** 🟢 **LOW**  
**Impact:** Can't optimize campaigns

**Recommendation:** Add A/B testing for subject lines and content

---

### 14. **No Scheduled Sending**

**Severity:** 🟢 **LOW**  
**Impact:** Must send immediately

**Recommendation:** Add ability to schedule campaigns for future

---

## Code Quality Assessment

### ✅ Strengths

1. **Clean Structure** - Well-organized functions
2. **Parameterized Queries** - No SQL injection
3. **Tenant Isolation** - All queries scoped to org_id
4. **Error Handling** - Try-catch blocks (though generic)
5. **Unsubscribe Link** - Included in all emails

### ❌ Weaknesses

1. **No Input Validation** - Missing email validation
2. **No Rate Limiting** - Spam abuse risk
3. **Synchronous Sending** - Blocks responses
4. **No Analytics** - Opens/clicks not implemented
5. **No Compliance** - Missing double opt-in, bounce handling
6. **No Testing** - No unit tests visible

---

## Compliance Assessment

### CAN-SPAM Act Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Unsubscribe link | ✅ Implemented | In every email |
| Physical address | ❌ Missing | Should add to footer |
| Accurate "From" | ✅ Implemented | Uses org name |
| Honest subject | ⚠️ User responsibility | No validation |
| Honor unsubscribe | ✅ Implemented | Immediate |
| Monitor compliance | ❌ Missing | No tracking |

### GDPR Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Consent | ❌ Missing | No double opt-in |
| Right to access | ✅ Implemented | Can view subscribers |
| Right to erasure | ✅ Implemented | Can delete subscribers |
| Data portability | ❌ Missing | No export |
| Breach notification | ❌ Missing | No mechanism |

---

## API Endpoints Inventory

### Protected Endpoints
| Method | Endpoint | Purpose | Rate Limit |
|--------|----------|---------|------------|
| GET | `/email/lists` | List all lists | ❌ Missing |
| POST | `/email/lists` | Create list | ❌ Missing |
| PATCH | `/email/lists/:id` | Update list | ❌ Missing |
| DELETE | `/email/lists/:id` | Delete list | ❌ Missing |
| GET | `/email/lists/:listId/subscribers` | List subscribers | ❌ Missing |
| POST | `/email/lists/:listId/subscribers` | Add subscriber | ❌ Missing |
| POST | `/email/lists/:listId/subscribers/import` | Import CSV | ❌ Missing |
| DELETE | `/email/lists/:listId/subscribers/:id` | Remove subscriber | ❌ Missing |
| GET | `/email/campaigns` | List campaigns | ❌ Missing |
| POST | `/email/campaigns` | Create campaign | ❌ Missing |
| GET | `/email/campaigns/:id` | Get campaign | ❌ Missing |
| PATCH | `/email/campaigns/:id` | Update campaign | ❌ Missing |
| DELETE | `/email/campaigns/:id` | Delete campaign | ❌ Missing |
| POST | `/email/campaigns/:id/send` | Send campaign | ❌ **CRITICAL** |
| GET | `/email/stats` | Get statistics | ❌ Missing |

### Public Endpoints
| Method | Endpoint | Purpose | Rate Limit |
|--------|----------|---------|------------|
| POST | `/email/unsubscribe/:id` | Unsubscribe | ❌ Missing |

**Total Endpoints:** 17

---

## Testing Requirements

### Critical Tests Needed

```javascript
describe('Email Security', () => {
  it('should enforce rate limits on campaign sending');
  it('should validate email addresses');
  it('should sanitize HTML content');
  it('should prevent spam abuse');
  it('should handle bounces correctly');
  it('should track unsubscribes');
});

describe('Email Sending', () => {
  it('should send campaign to all subscribers');
  it('should handle email failures gracefully');
  it('should include unsubscribe link');
  it('should track opens and clicks');
  it('should respect unsubscribe status');
});

describe('Subscriber Management', () => {
  it('should add subscriber with validation');
  it('should import CSV with validation');
  it('should prevent duplicate subscribers');
  it('should handle unsubscribe requests');
});
```

---

## Recommendations Summary

### 🔴 Critical (Before Production)

1. **Add rate limiting on campaign sending** - Prevent spam abuse
2. **Implement email validation** - Prevent invalid emails
3. **Add unsubscribe tracking** - CAN-SPAM compliance
4. **Implement bounce handling** - Maintain deliverability
5. **Add spam complaint handling** - Prevent blacklisting

**Estimated Time:** 3-4 days

### 🟡 High Priority (Within 1 Month)

6. Move to background job queue for sending
7. Implement double opt-in
8. Add email content sanitization
9. Implement email analytics (opens/clicks)
10. Add list segmentation

**Estimated Time:** 1-2 weeks

### 🟠 Medium Priority (Within 3 Months)

11. Add email templates
12. Implement A/B testing
13. Add scheduled sending
14. Improve import validation
15. Add GDPR data export

**Estimated Time:** 2 weeks

---

## Conclusion

The email marketing module has **critical security and compliance issues** that must be fixed before production. The lack of rate limiting could lead to spam abuse and IP blacklisting. Missing email validation and bounce handling will hurt deliverability. The absence of double opt-in and proper unsubscribe tracking creates GDPR and CAN-SPAM compliance risks.

### Summary Scores

| Category | Score | Status |
|----------|-------|--------|
| Security | 6.5/10 | 🟡 Needs Work |
| Compliance | 4/10 | 🔴 Critical Issues |
| Functionality | 7/10 | 🟡 Good |
| Code Quality | 7/10 | 🟡 Good |
| Testing | 3/10 | 🔴 No Tests |

### Immediate Actions Required

1. 🔴 **DO NOT USE FOR PRODUCTION EMAIL** until critical issues fixed
2. 🔴 Add rate limiting on campaign sending
3. 🔴 Implement email validation
4. 🔴 Add bounce and complaint handling
5. 🔴 Implement double opt-in for GDPR compliance
6. 🔴 Add proper unsubscribe tracking

**Estimated Time to Production-Ready:** 3-4 days of focused development

---

**Audit Completed By:** Bob Shell  
**Date:** July 13, 2026  
**Next Review:** After critical fixes are implemented
