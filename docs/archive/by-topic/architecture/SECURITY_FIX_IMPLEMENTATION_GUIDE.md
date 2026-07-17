# 🔒 Security Fix Implementation Guide

**Date**: 2026-07-13  
**Priority**: 🔴 CRITICAL - Implement immediately before production deployment  
**Estimated Time**: 2-3 days for Phase 1 critical fixes

---

## Quick Start

### Step 1: Review the Audit Report
```bash
cat SECURITY_AUDIT_CRITICAL_BUGS.md
```

### Step 2: Run Automated Fix Script (Partial Fix)
```bash
cd backend
node scripts/fix-sql-injection.js
```

**Note**: This script only fixes LIKE pattern injection automatically. SQL injection in UPDATE queries requires manual fixes.

### Step 3: Apply Manual Fixes
Follow the patterns in `backend/src/controllers/tasksController.FIXED.js` to fix all affected controllers.

---

## Critical Vulnerabilities Summary

### 🔴 Issue #1: SQL Injection via String Interpolation
**Severity**: CRITICAL  
**Affected Files**: 34+ controllers and routes  
**Impact**: Complete database compromise

**Vulnerable Pattern**:
```javascript
// VULNERABLE CODE
const updates = [];
if (title) updates.push(`title=$${i++}`);
db.query(`UPDATE table SET ${updates.join(',')} WHERE id=$${i}`, vals);
```

**Attack Example**:
```javascript
// Attacker sends:
{ "title": "x', admin=true WHERE 1=1; --" }

// Results in:
UPDATE users SET title=$1, admin=true WHERE 1=1; -- WHERE id=$2
// This bypasses the WHERE clause and makes all users admins!
```

**Secure Fix**:
```javascript
// SECURE CODE
const { buildUpdateQuery } = require('../utils/queryBuilder');

const updates = {};
if (title !== undefined) updates.title = title.trim();

const { query, values } = buildUpdateQuery(
  'table_name',
  updates,
  { id, org_id: req.user.orgId }
);

const { rows } = await db.query(query, values);
```

---

### 🟠 Issue #2: LIKE Pattern Injection
**Severity**: HIGH  
**Affected Files**: 16 controllers  
**Impact**: DoS via catastrophic backtracking

**Vulnerable Pattern**:
```javascript
// VULNERABLE CODE
if (search) {
  conditions.push(`name ILIKE $${i++}`);
  vals.push(`%${search}%`);
}
```

**Attack Example**:
```javascript
// Attacker sends:
{ "search": "%%%%%%%%%%%%%%%%%%%%" }

// Results in pattern: %%%%%%%%%%%%%%%%%%%%
// Causes PostgreSQL to hang with catastrophic backtracking
```

**Secure Fix**:
```javascript
// SECURE CODE
const { escapeLikePattern } = require('../utils/queryBuilder');

if (search) {
  conditions.push(`name ILIKE $${i++}`);
  vals.push(`%${escapeLikePattern(search)}%`);
}
```

---

## Implementation Steps

### Phase 1: Critical Fixes (Days 1-2)

#### Task 1.1: Fix All SQL Injection Vulnerabilities

**Files to Fix** (34 total):

**Controllers** (27 files):
1. `controllers/automationController.js`
2. `controllers/tasksController.js`
3. `controllers/whatsappController.js`
4. `controllers/affiliatesController.js`
5. `controllers/referralsController.js`
6. `controllers/inventoryController.js`
7. `controllers/posController.js`
8. `controllers/quotationsController.js`
9. `controllers/helpdeskController.js`
10. `controllers/formsController.js`
11. `controllers/calendarController.js`
12. `controllers/timeTrackingController.js`
13. `controllers/notesController.js`
14. `controllers/knowledgeBaseController.js`
15. `controllers/couponsController.js`
16. `controllers/urlShortenerController.js`
17. `controllers/assetsController.js`
18. `controllers/ordersController.js`
19. `controllers/documentsController.js`
20. `controllers/digitalProductsController.js`
21. `controllers/subscriptionsController.js`
22. `controllers/payrollController.js`
23. `controllers/brandKitController.js`
24. `controllers/qrCodesController.js`
25. `controllers/deliveryController.js`
26. `controllers/smsController.js`
27. `controllers/adminController.js`

**Routes** (7 files):
28. `routes/platform.js`
29. `routes/dataTables.js`
30. `routes/storeBuilder.js`
31. `routes/marketplace.js`
32. `routes/lms.js`
33. `routes/superAdmin.js`
34. `routes/workspace.js`

**For Each File**:

1. **Backup the file**:
   ```bash
   cp controllers/tasksController.js controllers/tasksController.js.backup
   ```

2. **Import the query builder**:
   ```javascript
   const { buildUpdateQuery, escapeLikePattern } = require('../utils/queryBuilder');
   ```

3. **Find all UPDATE functions** (search for pattern: `UPDATE.*SET.*\$\{`)

4. **Replace vulnerable pattern**:
   ```javascript
   // BEFORE:
   const updates = []; const vals = []; let i = 1;
   if (title !== undefined) { updates.push(`title=$${i++}`); vals.push(title); }
   db.query(`UPDATE table SET ${updates.join(',')} WHERE id=$${i}`, vals);
   
   // AFTER:
   const updates = {};
   if (title !== undefined) updates.title = title;
   
   const { query, values } = buildUpdateQuery('table', updates, { id, org_id });
   db.query(query, values);
   ```

5. **Find all ILIKE queries** (search for pattern: `ILIKE.*%\$\{`)

6. **Wrap search terms with escapeLikePattern**:
   ```javascript
   // BEFORE:
   vals.push(`%${search}%`);
   
   // AFTER:
   vals.push(`%${escapeLikePattern(search)}%`);
   ```

7. **Test the endpoint**:
   ```bash
   # Test normal operation
   curl -X PUT http://localhost:4001/api/v1/tasks/123 \
     -H "Cookie: dph_session=..." \
     -H "Content-Type: application/json" \
     -d '{"title":"Updated Task"}'
   
   # Test SQL injection attempt (should fail safely)
   curl -X PUT http://localhost:4001/api/v1/tasks/123 \
     -H "Cookie: dph_session=..." \
     -H "Content-Type: application/json" \
     -d '{"title":"x\", admin=true WHERE 1=1; --"}'
   ```

#### Task 1.2: Add Input Validation

**Create validation middleware** (`middleware/validation.js`):
```javascript
const { isValidEmail, isValidUrl, isValidPhone } = require('../utils/queryBuilder');

function validateEmail(req, res, next) {
  const { email } = req.body;
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  next();
}

function validateUrl(req, res, next) {
  const { url } = req.body;
  if (url && !isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL.' });
  }
  next();
}

function validatePhone(req, res, next) {
  const { phone } = req.body;
  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone number.' });
  }
  next();
}

module.exports = { validateEmail, validateUrl, validatePhone };
```

**Apply to routes**:
```javascript
const { validateEmail, validateUrl } = require('../middleware/validation');

// Email routes
router.post('/subscribers', validateEmail, createSubscriber);

// Webhook routes
router.post('/webhooks', validateUrl, createWebhook);
```

#### Task 1.3: Add Rate Limiting to Public Endpoints

**Install rate limiter** (if not already installed):
```bash
npm install express-rate-limit
```

**Create rate limit configs** (`middleware/rateLimits.js`):
```javascript
const rateLimit = require('express-rate-limit');

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 submissions per IP
  message: { error: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per IP
  message: { error: 'Too many requests. Please try again later.' },
});

module.exports = { publicFormLimiter, publicApiLimiter };
```

**Apply to public routes**:
```javascript
const { publicFormLimiter } = require('../middleware/rateLimits');

// In routes/leads.js
router.post('/forms/:id/submit', publicFormLimiter, submitForm);
```

---

### Phase 2: Testing (Day 3)

#### Test 1: SQL Injection Tests
```bash
# Create test script
cat > backend/test/security/sql-injection.test.js << 'EOF'
const request = require('supertest');
const app = require('../../src/app');

describe('SQL Injection Protection', () => {
  it('should prevent SQL injection in UPDATE queries', async () => {
    const maliciousPayload = {
      title: "x', admin=true WHERE 1=1; --"
    };
    
    const res = await request(app)
      .put('/api/v1/tasks/123')
      .set('Cookie', 'dph_session=valid_token')
      .send(maliciousPayload);
    
    // Should either succeed with escaped value or fail validation
    expect([200, 400]).toContain(res.status);
    
    // Verify admin flag wasn't set
    const user = await db.query('SELECT admin FROM users WHERE id=$1', [userId]);
    expect(user.rows[0].admin).toBe(false);
  });
});
EOF

# Run tests
npm test -- security/sql-injection.test.js
```

#### Test 2: LIKE Pattern Injection Tests
```bash
cat > backend/test/security/like-injection.test.js << 'EOF'
const request = require('supertest');
const app = require('../../src/app');

describe('LIKE Pattern Injection Protection', () => {
  it('should handle malicious LIKE patterns', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?assignee=%%%%%%%%%%%%')
      .set('Cookie', 'dph_session=valid_token');
    
    // Should complete within reasonable time (not hang)
    expect(res.status).toBe(200);
  });
});
EOF

npm test -- security/like-injection.test.js
```

#### Test 3: Rate Limiting Tests
```bash
# Test form submission rate limit
for i in {1..15}; do
  curl -X POST http://localhost:4001/api/v1/leads/forms/123/submit \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  echo "Request $i"
done

# Should see "Too many submissions" after 10 requests
```

---

### Phase 3: Deployment

#### Pre-Deployment Checklist

- [ ] All 34 files fixed and tested
- [ ] Input validation added to all user input endpoints
- [ ] Rate limiting configured on public endpoints
- [ ] Security tests passing
- [ ] Manual penetration testing completed
- [ ] Code review by second developer
- [ ] Backup database before deployment
- [ ] Rollback plan prepared

#### Deployment Steps

1. **Create deployment branch**:
   ```bash
   git checkout -b security-fixes-critical
   git add .
   git commit -m "fix: patch critical SQL injection vulnerabilities

   - Fixed SQL injection in 34 controllers/routes via string interpolation
   - Added LIKE pattern escaping to prevent pattern injection
   - Implemented secure query builder utilities
   - Added input validation for emails, URLs, phone numbers
   - Added rate limiting to public endpoints
   - Created comprehensive security tests
   
   BREAKING: None
   SECURITY: Critical vulnerabilities patched
   "
   ```

2. **Deploy to staging**:
   ```bash
   git push origin security-fixes-critical
   # Deploy to staging environment
   # Run full test suite
   # Run security scans
   ```

3. **Deploy to production**:
   ```bash
   # Merge to main
   git checkout main
   git merge security-fixes-critical
   git push origin main
   
   # Deploy
   ssh production
   cd /home/suite.digitpenhub.com/digitpenhub-suite/backend
   git pull
   npm install
   pm2 restart all
   ```

4. **Verify deployment**:
   ```bash
   # Check health
   curl http://localhost:4001/api/v1/health
   
   # Test critical endpoints
   curl http://localhost:4001/api/v1/tasks
   ```

---

## Verification Checklist

After implementing all fixes, verify:

### SQL Injection Protection
- [ ] All UPDATE queries use buildUpdateQuery helper
- [ ] No string interpolation in SQL queries
- [ ] All parameterized queries use $1, $2, etc.
- [ ] Test with malicious payloads (see test scripts)

### LIKE Pattern Protection
- [ ] All LIKE patterns use escapeLikePattern
- [ ] Test with %%%% pattern (should not hang)

### Input Validation
- [ ] Email validation on all email inputs
- [ ] URL validation on webhook/integration URLs
- [ ] Phone validation on SMS/WhatsApp inputs
- [ ] Test with invalid inputs (should return 400)

### Rate Limiting
- [ ] Public form submissions limited
- [ ] Public API endpoints limited
- [ ] Test by exceeding limits (should return 429)

### Authorization
- [ ] All queries include org_id in WHERE clause
- [ ] Test cross-org access (should fail)

---

## Monitoring & Alerts

After deployment, monitor for:

1. **Failed SQL queries** - May indicate injection attempts
2. **Rate limit hits** - May indicate attack or misconfiguration
3. **400 validation errors** - Track invalid input attempts
4. **Slow queries** - May indicate pattern injection attempts

**Set up alerts**:
```javascript
// In error handler
if (err.code === '42601') { // SQL syntax error
  console.error('SECURITY: Possible SQL injection attempt', {
    user: req.user?.id,
    ip: req.ip,
    endpoint: req.path,
    error: err.message
  });
  // Send alert to security team
}
```

---

## Additional Resources

- **Security Audit Report**: `SECURITY_AUDIT_CRITICAL_BUGS.md`
- **Query Builder Utilities**: `backend/src/utils/queryBuilder.js`
- **Example Fixed Controller**: `backend/src/controllers/tasksController.FIXED.js`
- **Automated Fix Script**: `backend/scripts/fix-sql-injection.js`

---

## Support

If you encounter issues during implementation:

1. Review the example fixed controller
2. Check the query builder utility documentation
3. Run the automated fix script for LIKE patterns
4. Test each fix individually before moving to the next file

---

**Remember**: These are CRITICAL security vulnerabilities. Do not deploy to production until all fixes are implemented and tested.
