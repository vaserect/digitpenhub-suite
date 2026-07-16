# Team Management Module Audit Report

**Date:** July 13, 2026  
**Module:** Team Management & Invitations  
**File:** `backend/src/controllers/teamController.js`  
**Status:** ✅ **Production-Ready with Minor Recommendations**

---

## Executive Summary

The team management module handles member management, invitations, and organization settings. The code is **well-implemented** with proper security controls and follows best practices. The invitation workflow is secure and user-friendly. Only minor enhancements are recommended for improved robustness.

**Security Rating:** 🟢 **Strong** (8/10)

---

## Security Features Implemented ✅

### 1. Access Control
- ✅ **Owner Protection:** Cannot change or remove owner role
- ✅ **Self-Protection:** Cannot remove yourself from team
- ✅ **Role Validation:** Only valid roles (admin, member) allowed
- ✅ **Tenant Isolation:** All queries scoped to org_id
- ✅ **RBAC Enforcement:** Role changes restricted to admins/owners

### 2. Invitation Security
- ✅ **Token-Based:** Cryptographically secure random tokens (32 bytes)
- ✅ **Expiration:** Invitations expire after 7 days
- ✅ **Single-Use:** Status changes to 'accepted' after use
- ✅ **Duplicate Prevention:** Checks if user already exists
- ✅ **Old Invite Cleanup:** Expires previous pending invites

### 3. Data Protection
- ✅ **Parameterized Queries:** All SQL uses parameterized queries
- ✅ **Password Hashing:** bcrypt for new member passwords
- ✅ **Email Normalization:** Lowercase email addresses
- ✅ **Input Validation:** Required fields checked

### 4. User Experience
- ✅ **Email Notifications:** Sends invitation emails
- ✅ **Graceful Degradation:** Email failure doesn't block invite
- ✅ **Manual Link Sharing:** Returns invite link for manual sharing
- ✅ **Team Notifications:** Notifies org when member joins

---

## Issues Found

### 🟡 Medium Priority

**1. No Rate Limiting on Public Endpoints**

**Severity:** 🟡 **MEDIUM**  
**Impact:** Invitation token brute-forcing, spam invitations

**Issue:** Public endpoints (getInvitation, acceptInvitation) have no rate limiting

**Recommendation:**
```javascript
const rateLimit = require('express-rate-limit');

const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many invitation attempts. Please try again later.',
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Apply to public invitation endpoints
router.get('/invite/:token', inviteLimiter, getInvitation);
router.post('/invite/:token/accept', inviteLimiter, acceptInvitation);
```

---

**2. No Invitation Limit Per Organization**

**Severity:** 🟡 **MEDIUM**  
**Impact:** Spam invitations, abuse of email system

**Issue:** No limit on number of pending invitations per organization

**Recommendation:**
```javascript
async function inviteMember(req, res) {
  // Check pending invitation count
  const { rows: pendingCount } = await db.query(
    `SELECT COUNT(*) FROM invitations WHERE org_id = $1 AND status = 'pending'`,
    [req.user.orgId]
  );
  
  if (Number(pendingCount[0].count) >= 50) {
    return res.status(429).json({ 
      error: 'Too many pending invitations. Cancel some before sending more.' 
    });
  }
  
  // ... rest of invitation logic
}
```

---

**3. No Email Verification Before Invitation**

**Severity:** 🟡 **MEDIUM**  
**Impact:** Typos lead to invitations sent to wrong addresses

**Issue:** No email format validation or confirmation step

**Recommendation:**
```javascript
async function inviteMember(req, res) {
  const { email, role = 'member' } = req.body;
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  
  // Optional: Check if email domain exists (DNS MX record lookup)
  // This prevents typos like "user@gmial.com"
  
  // ... rest of invitation logic
}
```

---

**4. Password Strength Not Enforced**

**Severity:** 🟡 **MEDIUM**  
**Impact:** Weak passwords for invited members

**Issue:** No password requirements when accepting invitation

**Recommendation:**
```javascript
async function acceptInvitation(req, res) {
  const { fullName, password } = req.body;
  
  if (!fullName || !password) {
    return res.status(400).json({ error: 'Name and password are required.' });
  }
  
  // Enforce password policy (same as registration)
  if (password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters.' 
    });
  }
  
  // Optional: Add complexity requirements
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ 
      error: 'Password must contain uppercase, lowercase, and numbers.' 
    });
  }
  
  // ... rest of acceptance logic
}
```

---

**5. No Audit Logging**

**Severity:** 🟡 **MEDIUM**  
**Impact:** Difficult to track team changes for compliance

**Issue:** No audit trail for team management actions

**Recommendation:**
```javascript
async function auditLog(userId, action, ip, meta = null) {
  try {
    await db.query(
      `INSERT INTO audit_log (user_id, action, ip_address, meta) VALUES ($1,$2,$3,$4)`,
      [userId, action, ip, meta ? JSON.stringify(meta) : null]
    );
  } catch { /* silent */ }
}

// Add to all team actions
async function inviteMember(req, res) {
  // ... invitation logic ...
  await auditLog(req.user.id, 'team.invite_sent', req.ip, { email, role });
  res.json({ ok: true, inviteLink, emailSent: mailResult.ok });
}

async function removeMember(req, res) {
  // ... removal logic ...
  await auditLog(req.user.id, 'team.member_removed', req.ip, { targetUserId: req.params.id });
  res.json({ ok: true });
}

async function updateRole(req, res) {
  // ... role update logic ...
  await auditLog(req.user.id, 'team.role_changed', req.ip, { targetUserId: req.params.id, newRole: role });
  res.json({ ok: true });
}
```

---

### 🟢 Low Priority

**6. No Invitation Resend Functionality**

**Severity:** 🟢 **LOW**  
**Impact:** User must cancel and create new invitation

**Issue:** No way to resend invitation email if user didn't receive it

**Recommendation:**
```javascript
async function resendInvitation(req, res) {
  const { id } = req.params;
  
  const { rows } = await db.query(
    `SELECT i.*, o.name AS org_name 
     FROM invitations i 
     JOIN organizations o ON o.id = i.org_id
     WHERE i.id = $1 AND i.org_id = $2 AND i.status = 'pending'`,
    [id, req.user.orgId]
  );
  
  if (!rows[0]) {
    return res.status(404).json({ error: 'Invitation not found.' });
  }
  
  const inv = rows[0];
  if (new Date(inv.expires_at) < new Date()) {
    return res.status(410).json({ error: 'Invitation has expired.' });
  }
  
  const inviteLink = `${process.env.FRONTEND_ORIGIN}/invite/${inv.token}`;
  
  await sendMail({
    to: inv.email,
    subject: `Reminder: ${req.user.fullName} invited you to join ${inv.org_name}`,
    html: `<p>This is a reminder that ${req.user.fullName} has invited you to join <strong>${inv.org_name}</strong>.</p>
<p><a href="${inviteLink}">Accept invitation</a></p>
<p style="color:#888;font-size:12px;">This link expires in ${Math.ceil((new Date(inv.expires_at) - new Date()) / (24 * 60 * 60 * 1000))} days.</p>`,
  });
  
  res.json({ ok: true });
}
```

---

**7. No Bulk Member Management**

**Severity:** 🟢 **LOW**  
**Impact:** Tedious for large teams

**Issue:** No bulk invite or bulk role change functionality

**Recommendation:**
```javascript
async function bulkInvite(req, res) {
  const { invitations } = req.body; // Array of { email, role }
  
  if (!Array.isArray(invitations) || invitations.length === 0) {
    return res.status(400).json({ error: 'invitations array is required.' });
  }
  
  if (invitations.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 invitations per bulk operation.' });
  }
  
  const results = [];
  
  for (const inv of invitations) {
    try {
      // Validate and send invitation
      // ... (same logic as inviteMember)
      results.push({ email: inv.email, status: 'sent' });
    } catch (err) {
      results.push({ email: inv.email, status: 'failed', error: err.message });
    }
  }
  
  res.json({ results });
}
```

---

**8. No Member Activity Tracking**

**Severity:** 🟢 **LOW**  
**Impact:** Can't see last login or activity

**Issue:** No visibility into member activity

**Recommendation:**
```javascript
async function listMembers(req, res) {
  const { rows } = await db.query(
    `SELECT u.id, u.full_name, u.email, u.role, u.created_at,
            (SELECT MAX(created_at) FROM sessions WHERE user_id = u.id) AS last_login,
            (SELECT COUNT(*) FROM audit_log WHERE user_id = u.id AND created_at > NOW() - INTERVAL '30 days') AS recent_actions
     FROM users u
     WHERE u.org_id = $1 
     ORDER BY u.created_at ASC`,
    [req.user.orgId]
  );
  res.json({ members: rows });
}
```

---

## Code Quality Assessment

### ✅ Strengths

1. **Clean Code Structure**
   - Well-organized functions
   - Clear naming conventions
   - Consistent error handling
   - Proper async/await usage

2. **Good Security Practices**
   - Parameterized queries throughout
   - Owner/self-protection checks
   - Tenant isolation enforced
   - Secure token generation

3. **User-Friendly Features**
   - Email notifications
   - Graceful email failure handling
   - Manual link sharing fallback
   - Team join notifications

4. **Proper Error Handling**
   - Try-catch blocks
   - Appropriate HTTP status codes
   - User-friendly error messages
   - Duplicate email handling

5. **Invitation Workflow**
   - Secure token-based system
   - Expiration handling
   - Single-use enforcement
   - Old invite cleanup

### 🟡 Areas for Improvement

1. **Input Validation**
   - Could use validation library (Joi, Yup)
   - Email format validation missing
   - Password strength not enforced

2. **Audit Logging**
   - No audit trail for team actions
   - Difficult to track changes
   - Compliance concerns

3. **Rate Limiting**
   - Public endpoints unprotected
   - Invitation spam possible
   - Token brute-forcing risk

4. **Error Messages**
   - Generic error messages
   - Could be more specific
   - No error codes for frontend

5. **Testing**
   - No unit tests visible
   - Should have tests for access control
   - Should test invitation workflow

---

## API Endpoints Inventory

### Protected Endpoints (Auth Required)
| Method | Endpoint | Purpose | RBAC | Rate Limit |
|--------|----------|---------|------|------------|
| GET | `/team/members` | List team members | All | ❌ Missing |
| PATCH | `/team/members/:id/role` | Update member role | Admin/Owner | ❌ Missing |
| DELETE | `/team/members/:id` | Remove member | Admin/Owner | ❌ Missing |
| POST | `/team/invitations` | Send invitation | Admin/Owner | ❌ Missing |
| GET | `/team/invitations` | List pending invites | Admin/Owner | ❌ Missing |
| DELETE | `/team/invitations/:id` | Cancel invitation | Admin/Owner | ❌ Missing |
| PATCH | `/team/profile` | Update own profile | All | ❌ Missing |
| GET | `/team/org` | Get organization info | All | ❌ Missing |
| PATCH | `/team/org` | Update organization | Owner | ❌ Missing |

### Public Endpoints (No Auth)
| Method | Endpoint | Purpose | Rate Limit |
|--------|----------|---------|------------|
| GET | `/team/invite/:token` | View invitation | ❌ **MISSING** |
| POST | `/team/invite/:token/accept` | Accept invitation | ❌ **MISSING** |

**Total Endpoints:** 11

---

## Security Best Practices Assessment

### ✅ Implemented

1. **Access Control** - Role-based permissions enforced
2. **Parameterized Queries** - No SQL injection vulnerabilities
3. **Owner Protection** - Cannot modify owner role
4. **Self-Protection** - Cannot remove yourself
5. **Tenant Isolation** - All queries scoped to org_id
6. **Secure Tokens** - Cryptographically secure random tokens
7. **Expiration** - Invitations expire after 7 days
8. **Single-Use** - Invitations can only be accepted once

### ⚠️ Recommended

1. **Rate Limiting** - Add to public endpoints
2. **Audit Logging** - Track all team changes
3. **Email Validation** - Validate email format
4. **Password Policy** - Enforce strong passwords
5. **Invitation Limits** - Prevent spam
6. **Input Validation Library** - Use Joi/Yup

---

## Testing Requirements

### Unit Tests Needed

```javascript
describe('teamController', () => {
  describe('Access Control', () => {
    it('should allow admin to update member role');
    it('should prevent member from updating roles');
    it('should prevent changing owner role');
    it('should prevent removing owner');
    it('should prevent removing yourself');
  });

  describe('Member Management', () => {
    it('should list all team members');
    it('should update member role');
    it('should remove member');
    it('should prevent duplicate members');
  });

  describe('Invitation Workflow', () => {
    it('should send invitation email');
    it('should generate secure token');
    it('should expire old pending invitations');
    it('should prevent duplicate invitations');
    it('should validate invitation token');
    it('should accept invitation and create user');
    it('should reject expired invitations');
    it('should reject already-used invitations');
  });

  describe('Organization Management', () => {
    it('should get organization info');
    it('should update organization name');
    it('should restrict updates to owner');
  });

  describe('Profile Management', () => {
    it('should update own profile');
    it('should change password with current password');
    it('should reject wrong current password');
  });
});
```

### Integration Tests Needed

```javascript
describe('Team Workflows', () => {
  it('should complete full invitation workflow');
  it('should handle invitation expiration');
  it('should handle email delivery failure gracefully');
  it('should notify team when member joins');
  it('should prevent duplicate member addition');
});
```

### Security Tests Needed

```javascript
describe('Team Security', () => {
  it('should prevent SQL injection in search');
  it('should enforce tenant isolation');
  it('should prevent privilege escalation');
  it('should validate invitation tokens');
  it('should handle concurrent invitation acceptance');
  it('should prevent token brute-forcing');
});
```

---

## Performance Considerations

### Current Performance
- ✅ Efficient queries with proper indexes
- ✅ Simple queries without complex joins
- ✅ Email sending is non-blocking (fire-and-forget)

### Optimization Opportunities

**1. Add Database Indexes**
```sql
-- Already have these from migration 073:
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Consider adding:
CREATE INDEX idx_invitations_org_id ON invitations(org_id);
CREATE INDEX idx_invitations_token ON invitations(token) WHERE status = 'pending';
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);
```

**2. Cache Organization Data**
```javascript
// Cache organization name to avoid repeated queries
const NodeCache = require('node-cache');
const orgCache = new NodeCache({ stdTTL: 600 }); // 10 minutes

async function getOrgName(orgId) {
  const cached = orgCache.get(orgId);
  if (cached) return cached;
  
  const { rows } = await db.query('SELECT name FROM organizations WHERE id=$1', [orgId]);
  const name = rows[0]?.name || 'DigitPen Hub';
  orgCache.set(orgId, name);
  return name;
}
```

**3. Batch Email Sending**
```javascript
// For bulk invitations, use email service batch API
async function bulkInvite(req, res) {
  const { invitations } = req.body;
  
  // Prepare all emails
  const emails = invitations.map(inv => ({
    to: inv.email,
    subject: `...`,
    html: `...`,
  }));
  
  // Send in batch (if email service supports it)
  await sendMailBatch(emails);
  
  res.json({ ok: true, count: invitations.length });
}
```

---

## Compliance & Privacy

### GDPR Compliance ✅

- ✅ **Right to Access:** Members can view their profile
- ✅ **Right to Rectification:** Members can update profile
- ✅ **Right to Erasure:** Members can be removed
- ✅ **Data Minimization:** Only necessary data collected
- ✅ **Purpose Limitation:** Data used only for team management

### Additional Compliance Recommendations

**1. Add Consent Tracking**
```javascript
async function acceptInvitation(req, res) {
  // ... existing logic ...
  
  // Track consent to terms of service
  await db.query(
    `INSERT INTO user_consents (user_id, consent_type, version, granted_at)
     VALUES ($1, 'terms_of_service', '1.0', now())`,
    [newUserId]
  );
  
  res.json({ ok: true, message: 'Account created. You can now sign in.' });
}
```

**2. Add Data Retention Policy**
```javascript
// Cron job to clean old invitations
async function cleanExpiredInvitations() {
  await db.query(
    `DELETE FROM invitations 
     WHERE status IN ('expired', 'accepted') 
       AND created_at < NOW() - INTERVAL '90 days'`
  );
}
```

---

## Monitoring & Alerting

### Metrics to Track

**Team Activity:**
- Invitation send rate
- Invitation acceptance rate
- Average time to accept invitation
- Member addition/removal rate
- Role change frequency

**Invitation Health:**
- Pending invitation count
- Expired invitation rate
- Failed email delivery rate
- Token validation failures

**Security Metrics:**
- Failed invitation acceptance attempts
- Suspicious invitation patterns
- Bulk invitation usage
- Role escalation attempts

### Recommended Alerts

```javascript
// Alert on high invitation failure rate
if (invitationFailureRate > 0.5) { // 50%
  sendAlert('High invitation failure rate', { rate: invitationFailureRate });
}

// Alert on suspicious invitation patterns
if (invitationsLastHour > 100) {
  sendAlert('Unusual invitation activity', { 
    count: invitationsLastHour,
    orgId: req.user.orgId 
  });
}

// Alert on failed invitation acceptances
if (failedAcceptancesLastHour > 20) {
  sendAlert('Many failed invitation acceptances', { 
    count: failedAcceptancesLastHour 
  });
}
```

---

## Documentation Needs

### Missing Documentation

1. **Invitation Flow Diagram** - Visual representation of invitation process
2. **Role Permissions Matrix** - What each role can do
3. **Email Templates** - All invitation email templates
4. **Error Code Reference** - All possible error codes
5. **Best Practices Guide** - How to manage teams effectively

---

## Recommendations Summary

### 🟡 Medium Priority (Within 1 Month)

1. Add rate limiting to public invitation endpoints
2. Implement audit logging for all team actions
3. Add invitation limit per organization
4. Enforce password strength on invitation acceptance
5. Add email format validation

**Estimated Time:** 2-3 days

### 🟢 Low Priority (Nice to Have)

6. Add invitation resend functionality
7. Implement bulk member management
8. Add member activity tracking
9. Implement invitation analytics
10. Add team size limits based on plan

**Estimated Time:** 1 week

---

## Conclusion

The team management module is **well-implemented** with proper security controls and a user-friendly invitation workflow. It's production-ready in its current state. The recommended enhancements are primarily for improved security (rate limiting, audit logging) and operational efficiency (bulk operations, analytics).

### Summary Scores

| Category | Score | Status |
|----------|-------|--------|
| Security | 8/10 | 🟢 Strong |
| Code Quality | 8/10 | 🟢 Good |
| Functionality | 8/10 | 🟢 Good |
| User Experience | 9/10 | 🟢 Excellent |
| Testing | 4/10 | 🟡 Needs Work |

### Next Steps

1. ✅ **Deploy to Production** - Module is ready
2. 🟡 **Add Rate Limiting** - Protect public endpoints
3. 🟡 **Implement Audit Logging** - Track team changes
4. 🟡 **Add Invitation Limits** - Prevent spam
5. 🟢 **Write Tests** - Ensure workflow works correctly

---

**Audit Completed By:** Bob Shell  
**Date:** July 13, 2026  
**Status:** ✅ **APPROVED FOR PRODUCTION**  
**Next Review:** After implementing rate limiting and audit logging
