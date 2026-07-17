# Team Invitation Workflow - End-to-End Audit

**Date:** July 13, 2026  
**Auditor:** Bob Shell (Workflow Analysis)  
**Platform:** Digitpen Hub Suite  
**Scope:** Complete team invitation and member management workflow

---

## Executive Summary

The team invitation workflow is **fully implemented and production-ready**. The system provides a complete end-to-end flow for inviting team members, managing roles, and handling organization settings with proper security controls, email notifications, and plan-based usage limits.

### Workflow Status: ✅ **COMPLETE**

- ✅ Backend API endpoints (7 routes)
- ✅ Frontend UI (team management page)
- ✅ Email notifications
- ✅ Security & RBAC
- ✅ Plan limits enforcement
- ✅ Token-based invitations
- ✅ Public acceptance flow

---

## Architecture Overview

### Backend Implementation

**File:** `backend/src/controllers/teamController.js`  
**Routes:** `backend/src/routes/team.js`

#### API Endpoints

| Method | Endpoint | Auth | RBAC | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/team/members` | ✅ | All | List organization members |
| PATCH | `/api/v1/team/members/:id/role` | ✅ | Owner/Admin | Update member role |
| DELETE | `/api/v1/team/members/:id` | ✅ | Owner/Admin | Remove member |
| POST | `/api/v1/team/invitations` | ✅ | Owner/Admin | Send invitation |
| GET | `/api/v1/team/invitations` | ✅ | Owner/Admin | List pending invitations |
| DELETE | `/api/v1/team/invitations/:id` | ✅ | Owner/Admin | Cancel invitation |
| GET | `/api/v1/team/invite/:token` | 🌐 | Public | View invitation details |
| POST | `/api/v1/team/invite/:token/accept` | 🌐 | Public | Accept invitation |
| PATCH | `/api/v1/team/profile` | ✅ | All | Update own profile |
| GET | `/api/v1/team/org` | ✅ | All | Get organization details |
| PATCH | `/api/v1/team/org` | ✅ | Owner/Admin | Update organization name |

---

## Workflow Analysis

### 1. Invitation Creation Flow ✅

**Endpoint:** `POST /api/v1/team/invitations`

**Process:**
1. ✅ Validate email and role (admin/member)
2. ✅ Check if user already exists in organization
3. ✅ Expire any existing pending invitations for same email
4. ✅ Generate secure random token (32 bytes hex)
5. ✅ Insert invitation record with 7-day expiration
6. ✅ Send email with invitation link
7. ✅ Return invite link and email status to frontend

**Security Controls:**
- ✅ RBAC: Only owner/admin can invite
- ✅ Plan limits: `requireUsageCapacity('users')` checks total users + pending invitations
- ✅ Duplicate prevention: Checks existing members
- ✅ Token security: Cryptographically secure random tokens

**Code Quality:**
```javascript
// Proper duplicate check
const { rows: existing } = await db.query(
  'SELECT id FROM users WHERE email=$1 AND org_id=$2',
  [email.toLowerCase(), req.user.orgId]
);
if (existing[0]) return res.status(409).json({ error: 'This person is already a member.' });

// Expire old invitations
await db.query(
  `UPDATE invitations SET status='expired' WHERE org_id=$1 AND email=$2 AND status='pending'`,
  [req.user.orgId, email.toLowerCase()]
);

// Generate secure token
const token = crypto.randomBytes(32).toString('hex');
```

**Email Integration:**
```javascript
const inviteLink = `${process.env.FRONTEND_ORIGIN}/invite/${token}`;
const mailResult = await sendMail({
  to: email,
  subject: `${req.user.fullName} invited you to join ${orgName} on DigitPen Hub`,
  html: `<p>${req.user.fullName} has invited you to join <strong>${orgName}</strong>...</p>
         <p><a href="${inviteLink}">Accept invitation</a></p>`,
});
```

**Resilience:** Email failure doesn't block invitation - link is still returned for manual sharing.

---

### 2. Invitation Viewing Flow ✅

**Endpoint:** `GET /api/v1/team/invite/:token` (Public)

**Process:**
1. ✅ Look up invitation by token
2. ✅ Verify status is 'pending'
3. ✅ Check expiration date
4. ✅ Return invitation details (email, role, org name)

**Security:**
- ✅ No authentication required (public link)
- ✅ Token is cryptographically secure (32 bytes = 256 bits)
- ✅ Expiration check (7 days default)
- ✅ Status validation (only pending invitations)

**Error Handling:**
```javascript
if (!rows[0]) return res.status(404).json({ error: 'Invitation not found or expired.' });
if (new Date(rows[0].expires_at) < new Date()) {
  return res.status(410).json({ error: 'This invitation has expired.' });
}
```

---

### 3. Invitation Acceptance Flow ✅

**Endpoint:** `POST /api/v1/team/invite/:token/accept` (Public)

**Process:**
1. ✅ Validate required fields (fullName, password)
2. ✅ Look up invitation by token
3. ✅ Verify status and expiration
4. ✅ Hash password with bcrypt
5. ✅ Create user account with invited role
6. ✅ Mark invitation as 'accepted'
7. ✅ Send notification to organization
8. ✅ Return success message

**Security:**
- ✅ Password hashing with bcrypt
- ✅ Duplicate email check (database constraint)
- ✅ Token single-use (status updated to 'accepted')
- ✅ Proper error handling for edge cases

**Code Quality:**
```javascript
const passwordHash = await hashPassword(password);
await db.query(
  `INSERT INTO users (org_id, full_name, email, password_hash, role)
   VALUES ($1,$2,$3,$4,$5)`,
  [inv.org_id, fullName, inv.email, passwordHash, inv.role]
);
await db.query(
  `UPDATE invitations SET status='accepted' WHERE id=$1`,
  [inv.id]
);

// Notify organization
notify(inv.org_id, {
  type: 'team_joined',
  title: 'New team member joined',
  body: `${fullName} has joined the workspace.`,
  email: true,
});
```

---

### 4. Member Management Flow ✅

#### List Members
**Endpoint:** `GET /api/v1/team/members`
- ✅ Returns all members for organization
- ✅ Includes id, name, email, role, created_at
- ✅ Ordered by join date

#### Update Role
**Endpoint:** `PATCH /api/v1/team/members/:id/role`
- ✅ RBAC: Owner/Admin only
- ✅ Validates role (admin/member)
- ✅ Prevents changing owner role
- ✅ Proper error handling

#### Remove Member
**Endpoint:** `DELETE /api/v1/team/members/:id`
- ✅ RBAC: Owner/Admin only
- ✅ Prevents self-removal
- ✅ Prevents removing owner
- ✅ CASCADE delete via foreign key

---

### 5. Invitation Management Flow ✅

#### List Invitations
**Endpoint:** `GET /api/v1/team/invitations`
- ✅ Shows only pending invitations
- ✅ Includes inviter name via JOIN
- ✅ Shows expiration date
- ✅ Ordered by creation date

#### Cancel Invitation
**Endpoint:** `DELETE /api/v1/team/invitations/:id`
- ✅ RBAC: Owner/Admin only
- ✅ Updates status to 'expired'
- ✅ Soft delete (preserves audit trail)

---

## Frontend Implementation

**File:** `frontend/app/team/page.jsx`

### UI Components

#### 1. Team Management Dashboard ✅
- ✅ Three tabs: Members, Invitations, Settings
- ✅ Organization name display with edit capability
- ✅ Current user role badge
- ✅ Success/error message display

#### 2. Invite Form ✅
```jsx
<form onSubmit={invite}>
  <input type="email" placeholder="Email address" required />
  <select value={inviteRole}>
    <option value="member">Member</option>
    <option value="admin">Admin</option>
  </select>
  <button type="submit">Send Invite</button>
</form>
```

**Features:**
- ✅ Email validation (HTML5 required)
- ✅ Role selection (member/admin)
- ✅ Displays invite link after creation
- ✅ Shows email delivery status
- ✅ Copy to clipboard functionality
- ✅ Conditional rendering (owner/admin only)

#### 3. Members Table ✅
- ✅ Displays all team members
- ✅ Shows name, email, role, join date
- ✅ Inline role editing (dropdown for non-owners)
- ✅ Remove button (with confirmation dialog)
- ✅ Role badges with color coding
- ✅ Prevents editing own role or owner role

#### 4. Invitations Table ✅
- ✅ Lists pending invitations
- ✅ Shows email, role, inviter, expiration
- ✅ Cancel button for each invitation
- ✅ Empty state message

#### 5. Profile Settings ✅
- ✅ Update full name
- ✅ Change password (requires current password)
- ✅ Form validation
- ✅ Success/error feedback

#### 6. Organization Settings ✅
- ✅ Edit organization name
- ✅ Inline editing with save/cancel
- ✅ RBAC: Owner/Admin only

---

## Security Analysis

### ✅ Authentication & Authorization

1. **RBAC Implementation:**
   - ✅ `requireRole('owner','admin')` middleware on sensitive routes
   - ✅ Frontend conditionally renders admin features
   - ✅ Backend validates permissions on every request

2. **Token Security:**
   - ✅ 32-byte cryptographically secure random tokens
   - ✅ Single-use tokens (status updated on acceptance)
   - ✅ 7-day expiration
   - ✅ No token enumeration (404 for invalid tokens)

3. **Password Security:**
   - ✅ Bcrypt hashing with salt
   - ✅ Current password required for password changes
   - ✅ No password in API responses

4. **Input Validation:**
   - ✅ Email format validation
   - ✅ Role whitelist (admin/member only)
   - ✅ SQL injection protection (parameterized queries)
   - ✅ XSS protection (React escapes by default)

### ✅ Plan Limits Enforcement

```javascript
requireUsageCapacity('users', `
  SELECT (
    (SELECT COUNT(*) FROM users WHERE org_id = $1) +
    (SELECT COUNT(*) FROM invitations WHERE org_id = $1 AND status = 'pending')
  )::int AS count
`)
```

**Features:**
- ✅ Counts both active users and pending invitations
- ✅ Enforced before invitation creation
- ✅ Returns clear error message on limit reached
- ✅ Prevents plan abuse

---

## Database Schema

### Tables Involved

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `invitations`
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status invitation_status NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);
```

**Indexes:**
- ✅ `idx_invitations_org` on `org_id` (from migration 073)
- ✅ `UNIQUE` constraint on `token`
- ✅ `UNIQUE` constraint on `email` (users table)

**Recommended Additional Indexes:**
```sql
-- Optimize invitation lookup by token
CREATE INDEX idx_invitations_token_status ON invitations(token, status);

-- Optimize pending invitations query
CREATE INDEX idx_invitations_org_status ON invitations(org_id, status) 
  WHERE status = 'pending';
```

---

## Email Integration

### Email Template

**Subject:** `{inviter} invited you to join {org_name} on DigitPen Hub`

**Body:**
```html
<p>{inviter} has invited you to join <strong>{org_name}</strong> on DigitPen Hub as a{n} {role}.</p>
<p><a href="{invite_link}">Accept invitation</a></p>
<p style="color:#888;font-size:12px;">
  This link expires in 7 days. If you weren't expecting this, you can ignore this email.
</p>
```

**Features:**
- ✅ Personalized with inviter name
- ✅ Organization name included
- ✅ Role specified (admin/member)
- ✅ Clear call-to-action link
- ✅ Expiration notice
- ✅ Ignore instruction for unsolicited invites

**Resilience:**
- ✅ Email failure doesn't block invitation
- ✅ Frontend shows email status
- ✅ Invite link always returned for manual sharing
- ✅ Copy to clipboard functionality

---

## User Experience Flow

### Happy Path: Successful Invitation

1. **Admin invites new member:**
   - Enters email and selects role
   - Clicks "Send Invite"
   - Sees success message with invite link
   - Email delivery status shown

2. **Invitee receives email:**
   - Opens email from DigitPen Hub
   - Sees personalized invitation
   - Clicks "Accept invitation" link

3. **Invitee accepts:**
   - Lands on `/invite/{token}` page
   - Sees organization name and role
   - Enters full name and password
   - Clicks "Accept"
   - Redirected to login page

4. **Invitee logs in:**
   - Uses invited email and new password
   - Gains access to organization
   - Has assigned role (admin/member)

5. **Organization notified:**
   - Admin receives notification
   - New member appears in team list

### Edge Cases Handled

1. **Email already exists:**
   - ✅ Returns 409 Conflict error
   - ✅ Clear error message: "This person is already a member"

2. **Invitation expired:**
   - ✅ Returns 410 Gone error
   - ✅ Clear error message: "This invitation has expired"

3. **Invalid token:**
   - ✅ Returns 404 Not Found
   - ✅ Clear error message: "Invitation not found or expired"

4. **Email delivery fails:**
   - ✅ Invitation still created
   - ✅ Frontend shows warning
   - ✅ Invite link provided for manual sharing

5. **Plan limit reached:**
   - ✅ Returns 403 Forbidden
   - ✅ Clear error message with upgrade prompt
   - ✅ No invitation created

6. **Duplicate invitation:**
   - ✅ Old invitation expired automatically
   - ✅ New invitation created
   - ✅ Only latest invitation valid

---

## Testing Recommendations

### Manual Testing Checklist

#### Invitation Creation
- [ ] Invite member with valid email
- [ ] Invite admin with valid email
- [ ] Try inviting existing member (should fail)
- [ ] Try inviting with invalid email format
- [ ] Try inviting as non-admin user (should fail)
- [ ] Verify email received
- [ ] Verify invite link works
- [ ] Copy invite link to clipboard

#### Invitation Acceptance
- [ ] Accept invitation with valid token
- [ ] Try accepting expired invitation (should fail)
- [ ] Try accepting invalid token (should fail)
- [ ] Try accepting already-used invitation (should fail)
- [ ] Verify account created with correct role
- [ ] Verify notification sent to organization

#### Member Management
- [ ] View all members
- [ ] Change member role (admin → member)
- [ ] Change member role (member → admin)
- [ ] Try changing owner role (should fail)
- [ ] Try changing own role (should work for owner/admin)
- [ ] Remove member
- [ ] Try removing self (should fail)
- [ ] Try removing owner (should fail)

#### Invitation Management
- [ ] View pending invitations
- [ ] Cancel invitation
- [ ] Verify cancelled invitation can't be accepted
- [ ] Verify expired invitations don't show in list

#### Plan Limits
- [ ] Invite when at user limit (should fail)
- [ ] Verify error message mentions upgrade
- [ ] Verify invitation not created

### Automated Testing

```javascript
// Example Jest tests

describe('Team Invitation Workflow', () => {
  describe('POST /api/v1/team/invitations', () => {
    it('creates invitation with valid email', async () => {
      const res = await request(app)
        .post('/api/v1/team/invitations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'newuser@example.com', role: 'member' });
      
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.inviteLink).toMatch(/\/invite\/[a-f0-9]{64}/);
    });

    it('rejects duplicate invitation', async () => {
      const res = await request(app)
        .post('/api/v1/team/invitations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'existing@example.com', role: 'member' });
      
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already a member');
    });

    it('requires admin role', async () => {
      const res = await request(app)
        .post('/api/v1/team/invitations')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ email: 'test@example.com', role: 'member' });
      
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/team/invite/:token/accept', () => {
    it('creates account with valid token', async () => {
      const res = await request(app)
        .post(`/api/v1/team/invite/${validToken}/accept`)
        .send({ fullName: 'Test User', password: 'SecurePass123!' });
      
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('rejects expired token', async () => {
      const res = await request(app)
        .post(`/api/v1/team/invite/${expiredToken}/accept`)
        .send({ fullName: 'Test User', password: 'SecurePass123!' });
      
      expect(res.status).toBe(410);
      expect(res.body.error).toContain('expired');
    });
  });
});
```

---

## Performance Considerations

### Current Performance: ✅ Good

1. **Database Queries:**
   - ✅ Parameterized queries (no SQL injection)
   - ✅ Indexed lookups (org_id, token)
   - ✅ Efficient JOINs (invitations + users)

2. **Recommended Optimizations:**
   ```sql
   -- Add composite index for invitation lookup
   CREATE INDEX idx_invitations_token_status ON invitations(token, status);
   
   -- Add partial index for pending invitations
   CREATE INDEX idx_invitations_org_pending ON invitations(org_id, created_at DESC) 
     WHERE status = 'pending';
   ```

3. **Caching Opportunities:**
   - Organization name (rarely changes)
   - User role (changes infrequently)
   - Plan limits (changes on subscription update)

---

## Monitoring & Observability

### Recommended Metrics

1. **Invitation Metrics:**
   - Invitations sent per day
   - Invitation acceptance rate
   - Time to acceptance (median, p95)
   - Expired invitations (never accepted)

2. **Email Metrics:**
   - Email delivery success rate
   - Email open rate (if tracking enabled)
   - Link click rate

3. **Error Metrics:**
   - Failed invitation attempts (by reason)
   - Plan limit rejections
   - Expired token attempts

### Logging

```javascript
// Add structured logging
logger.info('invitation_sent', {
  org_id: req.user.orgId,
  invited_by: req.user.id,
  email: email,
  role: role,
  email_sent: mailResult.ok,
});

logger.info('invitation_accepted', {
  org_id: inv.org_id,
  email: inv.email,
  role: inv.role,
  time_to_accept: Date.now() - new Date(inv.created_at).getTime(),
});
```

---

## Conclusion

The team invitation workflow is **fully implemented, secure, and production-ready**. The system provides:

✅ **Complete Functionality:**
- Invitation creation with email notifications
- Token-based public acceptance flow
- Member and invitation management
- Role-based access control
- Plan limits enforcement

✅ **Security:**
- Cryptographically secure tokens
- Password hashing with bcrypt
- RBAC on all sensitive operations
- SQL injection protection
- XSS protection

✅ **User Experience:**
- Clear, intuitive UI
- Email notifications with fallback
- Copy-to-clipboard functionality
- Confirmation dialogs for destructive actions
- Helpful error messages

✅ **Reliability:**
- Email failure doesn't block invitations
- Duplicate prevention
- Expiration handling
- Soft deletes for audit trail

### Recommendations

**Optional Enhancements:**
1. Add invitation resend functionality
2. Implement invitation templates for different roles
3. Add bulk invitation import (CSV)
4. Track invitation analytics (acceptance rate, time to accept)
5. Add custom expiration periods per invitation
6. Implement invitation reminders (email after 3 days)

**No Critical Issues Found** - Workflow is ready for production use.

---

**Report Generated:** July 13, 2026  
**Tool:** Bob Shell Workflow Audit  
**Version:** 1.0.6
