# Staging Deployment & Testing Guide

**Date:** July 13, 2026  
**Platform:** Digitpen Hub Suite  
**Purpose:** Deploy security fixes and test platform before production

---

## Pre-Deployment Checklist

### 1. Verify All Changes ✅

**Security Fixes Applied:**
- [x] Backend: 24 controller files (SQL injection fixes)
- [x] Frontend: 1 component file (XSS fix in Resume Builder)
- [x] Backups: 23 .backup files created

**Files Modified:**
```bash
# Backend (24 files)
backend/src/controllers/appointmentsController.js
backend/src/controllers/assetsController.js
backend/src/controllers/calendarController.js
backend/src/controllers/certificatesController.js
backend/src/controllers/contractsController.js
backend/src/controllers/couponsController.js
backend/src/controllers/crmController.js
backend/src/controllers/deliveryController.js
backend/src/controllers/documentsController.js
backend/src/controllers/expensesController.js
backend/src/controllers/formsController.js
backend/src/controllers/helpdeskController.js
backend/src/controllers/inventoryController.js
backend/src/controllers/kbController.js
backend/src/controllers/notesController.js
backend/src/controllers/ordersController.js
backend/src/controllers/passwordManagerController.js
backend/src/controllers/payrollController.js
backend/src/controllers/pmController.js
backend/src/controllers/quotationsController.js
backend/src/controllers/smsController.js
backend/src/controllers/subscriptionsController.js
backend/src/controllers/tasksController.js
backend/src/controllers/timeTrackingController.js

# Frontend (1 file)
frontend/components/AppShell.jsx
```

### 2. Environment Setup

**Required Environment Variables:**
```bash
# Backend (.env)
NODE_ENV=staging
PORT=3001
DB_HOST=staging-db.example.com
DB_PORT=5432
DB_NAME=digitpenhub_staging
DB_USER=staging_user
DB_PASSWORD=<secure-password>
JWT_SECRET=<secure-random-string>
FRONTEND_ORIGIN=https://staging.digitpenhub.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@digitpenhub.com
SMTP_PASSWORD=<smtp-password>

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://staging-api.digitpenhub.com
```

### 3. Database Preparation

**Create Staging Database:**
```bash
# Connect to PostgreSQL
psql -h staging-db.example.com -U postgres

# Create database
CREATE DATABASE digitpenhub_staging;

# Create user
CREATE USER staging_user WITH PASSWORD '<secure-password>';
GRANT ALL PRIVILEGES ON DATABASE digitpenhub_staging TO staging_user;
```

**Run Migrations:**
```bash
cd backend
npm run migrate
```

**Seed Test Data (Optional):**
```bash
npm run seed
```

---

## Deployment Steps

### Step 1: Backend Deployment

**1.1 Install Dependencies:**
```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend
npm ci --production
```

**1.2 Build (if needed):**
```bash
# If using TypeScript or build step
npm run build
```

**1.3 Start Backend:**
```bash
# Using PM2 (recommended)
pm2 start ecosystem.config.js --env staging

# Or using npm
npm start

# Verify it's running
pm2 status
curl http://localhost:3001/health
```

**1.4 Check Logs:**
```bash
pm2 logs digitpenhub-backend --lines 50
```

### Step 2: Frontend Deployment

**2.1 Install Dependencies:**
```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/frontend
npm ci
```

**2.2 Build:**
```bash
npm run build
```

**2.3 Start Frontend:**
```bash
# Using PM2
pm2 start npm --name "digitpenhub-frontend" -- start

# Or using npm
npm start

# Verify it's running
pm2 status
curl http://localhost:3000
```

**2.4 Check Logs:**
```bash
pm2 logs digitpenhub-frontend --lines 50
```

### Step 3: Nginx Configuration (if applicable)

**3.1 Backend Proxy:**
```nginx
# /etc/nginx/sites-available/staging-api.digitpenhub.com
server {
    listen 80;
    server_name staging-api.digitpenhub.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3.2 Frontend Proxy:**
```nginx
# /etc/nginx/sites-available/staging.digitpenhub.com
server {
    listen 80;
    server_name staging.digitpenhub.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3.3 Enable Sites:**
```bash
sudo ln -s /etc/nginx/sites-available/staging-api.digitpenhub.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/staging.digitpenhub.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**3.4 SSL Certificates (Let's Encrypt):**
```bash
sudo certbot --nginx -d staging.digitpenhub.com -d staging-api.digitpenhub.com
```

---

## Testing Procedures

### Phase 1: Smoke Tests (5 minutes)

**1.1 Application Loads:**
- [ ] Visit https://staging.digitpenhub.com
- [ ] Verify homepage loads without errors
- [ ] Check browser console for errors
- [ ] Verify API connectivity

**1.2 Authentication:**
- [ ] Sign up for new account
- [ ] Verify email sent (check logs if not received)
- [ ] Log in with credentials
- [ ] Verify JWT token in cookies
- [ ] Log out
- [ ] Log back in

**1.3 Basic Navigation:**
- [ ] Access workspace dashboard
- [ ] Open CRM module
- [ ] Open Email Marketing module
- [ ] Open Invoices module
- [ ] Navigate back to home

### Phase 2: Security Testing (15 minutes)

**2.1 SQL Injection Tests:**

Test all 24 fixed controllers. Example for CRM:

```bash
# Test contact update (should be safe now)
curl -X PATCH https://staging-api.digitpenhub.com/api/v1/crm/contacts/test-id \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test'; DROP TABLE contacts; --",
    "email": "test@example.com"
  }'

# Expected: Contact updated safely, no SQL injection
# Verify: Check database that contacts table still exists
```

**2.2 XSS Tests (Resume Builder):**

```javascript
// Test 1: Script injection in name field
Name: <script>alert('XSS')</script>

// Expected: Displays as plain text, no alert
// Actual display: &lt;script&gt;alert('XSS')&lt;/script&gt;

// Test 2: Image onerror injection
Name: <img src=x onerror=alert('XSS')>

// Expected: Displays as plain text, no alert
// Actual display: &lt;img src=x onerror=alert('XSS')&gt;

// Test 3: JavaScript URL
Email: javascript:alert('XSS')

// Expected: Displays as plain text, no execution
// Actual display: javascript:alert('XSS')

// Test 4: HTML entity injection
Summary: &lt;script&gt;alert('XSS')&lt;/script&gt;

// Expected: Displays as plain text with escaped entities
```

**2.3 Multi-Tenant Isolation:**

```bash
# Create two test organizations
# Org A: test-org-a@example.com
# Org B: test-org-b@example.com

# As Org A, create a contact
# Note the contact ID

# As Org B, try to access Org A's contact
curl https://staging-api.digitpenhub.com/api/v1/crm/contacts/ORG_A_CONTACT_ID \
  -H "Authorization: Bearer ORG_B_TOKEN"

# Expected: 404 Not Found (tenant isolation working)
```

**2.4 RBAC Tests:**

```bash
# Create member user (not admin)
# Try to invite team member as member

curl -X POST https://staging-api.digitpenhub.com/api/v1/team/invitations \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "role": "member"}'

# Expected: 403 Forbidden (only admin/owner can invite)
```

### Phase 3: Workflow Testing (30 minutes)

**3.1 CRM Workflow:**

1. **Create Contact:**
   - [ ] Click "Add Contact"
   - [ ] Fill all fields: Name, Company, Email, Phone, Stage, Value
   - [ ] Submit form
   - [ ] Verify contact appears in list
   - [ ] Verify stage count updated

2. **Add Note:**
   - [ ] Click on contact
   - [ ] Add note: "Test note for staging"
   - [ ] Verify note appears
   - [ ] Delete note
   - [ ] Verify note removed

3. **Add Task:**
   - [ ] Add task: "Follow up call"
   - [ ] Set due date
   - [ ] Toggle task completion
   - [ ] Delete task

4. **Add Tags:**
   - [ ] Add tag: "VIP"
   - [ ] Add tag: "Hot Lead"
   - [ ] Remove tag
   - [ ] Verify tags updated

5. **CSV Import:**
   - [ ] Create test CSV:
     ```csv
     fullName,email,company,phone
     John Doe,john@example.com,Acme Corp,+1234567890
     Jane Smith,jane@example.com,Tech Inc,+0987654321
     ```
   - [ ] Import CSV
   - [ ] Verify import statistics
   - [ ] Verify contacts created

6. **CSV Export:**
   - [ ] Click "Export CSV"
   - [ ] Verify file downloads
   - [ ] Open CSV and verify data

7. **Search & Filter:**
   - [ ] Search by name
   - [ ] Filter by stage
   - [ ] Sort by value
   - [ ] Verify results

8. **Delete Contact:**
   - [ ] Select contact
   - [ ] Click delete
   - [ ] Confirm deletion
   - [ ] Verify contact removed

**3.2 Email Marketing Workflow:**

1. **Create List:**
   - [ ] Click "Create List"
   - [ ] Name: "Test Subscribers"
   - [ ] Description: "Staging test list"
   - [ ] Submit
   - [ ] Verify list created

2. **Add Subscribers:**
   - [ ] Add subscriber manually
   - [ ] Email: test1@example.com
   - [ ] Name: Test User 1
   - [ ] Verify subscriber added

3. **Import Subscribers:**
   - [ ] Create CSV:
     ```csv
     email,name
     test2@example.com,Test User 2
     test3@example.com,Test User 3
     ```
   - [ ] Import CSV
   - [ ] Verify subscribers added

4. **Create Campaign:**
   - [ ] Click "Create Campaign"
   - [ ] Subject: "Test Campaign"
   - [ ] Preview: "This is a test"
   - [ ] Select list
   - [ ] Choose template (optional)
   - [ ] Edit body HTML
   - [ ] Save as draft

5. **Send Campaign:**
   - [ ] Click "Send Campaign"
   - [ ] Confirm send
   - [ ] Verify status changes to "sent"
   - [ ] Check email inbox for delivery

6. **View Statistics:**
   - [ ] View campaign stats
   - [ ] Verify sent count
   - [ ] Check delivery status

**3.3 Invoice Workflow:**

1. **Create Client:**
   - [ ] Click "Add Client"
   - [ ] Name: Test Client
   - [ ] Email: client@example.com
   - [ ] Company: Test Corp
   - [ ] Submit
   - [ ] Verify client created

2. **Create Invoice:**
   - [ ] Click "Create Invoice"
   - [ ] Select client
   - [ ] Invoice number: INV-001
   - [ ] Issue date: Today
   - [ ] Due date: +30 days
   - [ ] Add line item:
     - Description: Consulting Services
     - Quantity: 10
     - Unit Price: 100
   - [ ] Add another line item:
     - Description: Development
     - Quantity: 5
     - Unit Price: 150
   - [ ] Set tax rate: 10%
   - [ ] Verify totals:
     - Subtotal: 1750
     - Tax: 175
     - Total: 1925
   - [ ] Save as draft

3. **Edit Invoice:**
   - [ ] Click edit
   - [ ] Change quantity
   - [ ] Verify totals recalculate
   - [ ] Save changes

4. **Send Invoice:**
   - [ ] Change status to "sent"
   - [ ] Verify status badge updates

5. **Generate PDF:**
   - [ ] Click "Download PDF"
   - [ ] Verify PDF downloads
   - [ ] Open PDF and verify:
     - Company details
     - Client details
     - Line items
     - Totals
     - Professional formatting

6. **Share Invoice:**
   - [ ] Click "Share"
   - [ ] Copy share link
   - [ ] Open link in incognito window
   - [ ] Verify invoice displays (no auth required)
   - [ ] Verify read-only access

7. **Record Payment:**
   - [ ] Click "Record Payment"
   - [ ] Enter amount: 1925
   - [ ] Submit
   - [ ] Verify status changes to "paid"
   - [ ] Verify confetti animation 🎉

**3.4 Team Invitation Workflow:**

1. **Send Invitation:**
   - [ ] Go to Team page
   - [ ] Click "Send Invite"
   - [ ] Email: newmember@example.com
   - [ ] Role: Member
   - [ ] Submit
   - [ ] Verify invitation sent
   - [ ] Copy invite link

2. **Accept Invitation:**
   - [ ] Open invite link in incognito
   - [ ] Verify invitation details display
   - [ ] Enter name and password
   - [ ] Submit
   - [ ] Verify account created
   - [ ] Log in with new credentials

3. **Verify Member Access:**
   - [ ] Log in as new member
   - [ ] Verify access to workspace
   - [ ] Verify role is "member"
   - [ ] Try to invite someone (should fail)

4. **Manage Members:**
   - [ ] Log in as admin
   - [ ] View team members
   - [ ] Change member role to admin
   - [ ] Verify role updated
   - [ ] Remove member
   - [ ] Verify member removed

### Phase 4: Performance Testing (10 minutes)

**4.1 Page Load Times:**
```bash
# Use browser DevTools Network tab
# Target: < 2 seconds for initial load
# Target: < 500ms for subsequent navigation

- [ ] Homepage: _____ ms
- [ ] CRM: _____ ms
- [ ] Email Marketing: _____ ms
- [ ] Invoices: _____ ms
- [ ] Team: _____ ms
```

**4.2 API Response Times:**
```bash
# Use curl with timing
curl -w "@curl-format.txt" -o /dev/null -s https://staging-api.digitpenhub.com/api/v1/crm/contacts

# curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_redirect:  %{time_redirect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n

# Target: < 200ms for most endpoints
- [ ] GET /api/v1/crm/contacts: _____ ms
- [ ] GET /api/v1/email/campaigns: _____ ms
- [ ] GET /api/v1/invoices: _____ ms
```

**4.3 Database Query Performance:**
```sql
-- Enable query logging
ALTER DATABASE digitpenhub_staging SET log_min_duration_statement = 100;

-- Run workflows and check logs
-- Target: No queries > 500ms

-- Check slow queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Phase 5: Error Handling (10 minutes)

**5.1 Network Errors:**
- [ ] Disconnect network
- [ ] Try to load page
- [ ] Verify error message displays
- [ ] Reconnect network
- [ ] Verify app recovers

**5.2 Invalid Input:**
- [ ] Submit form with missing required fields
- [ ] Verify validation errors display
- [ ] Submit form with invalid email
- [ ] Verify email validation works

**5.3 404 Errors:**
- [ ] Navigate to non-existent route
- [ ] Verify 404 page displays
- [ ] Click "Go Home"
- [ ] Verify navigation works

**5.4 API Errors:**
- [ ] Try to access resource that doesn't exist
- [ ] Verify error toast displays
- [ ] Try to perform unauthorized action
- [ ] Verify 403 error handled

---

## Rollback Procedures

### If Critical Issues Found

**Option 1: Rollback Code Changes**

```bash
# Backend rollback
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend/src/controllers

# Restore from backups
for file in *.backup; do
  original="${file%.backup}"
  cp "$file" "$original"
  echo "Restored $original"
done

# Frontend rollback
cd /home/suite.digitpenhub.com/digitpenhub-suite/frontend/components
cp AppShell.jsx.xss-backup AppShell.jsx

# Restart services
pm2 restart all
```

**Option 2: Rollback Database**

```bash
# If database changes were made
pg_restore -h staging-db.example.com -U staging_user -d digitpenhub_staging backup.dump
```

**Option 3: Rollback Deployment**

```bash
# If using Git tags
git checkout v1.0.0  # Previous stable version
npm ci
npm run build
pm2 restart all
```

---

## Post-Testing Actions

### If All Tests Pass ✅

1. **Document Test Results:**
   - [ ] Create test report with all checkboxes marked
   - [ ] Note any minor issues or observations
   - [ ] Record performance metrics

2. **Update Documentation:**
   - [ ] Mark staging deployment as complete
   - [ ] Update version numbers
   - [ ] Document any configuration changes

3. **Prepare for Production:**
   - [ ] Review production environment variables
   - [ ] Schedule production deployment window
   - [ ] Notify stakeholders
   - [ ] Prepare rollback plan

4. **Create Production Checklist:**
   - [ ] Same as staging but with production URLs
   - [ ] Include database backup step
   - [ ] Include monitoring setup
   - [ ] Include post-deployment verification

### If Tests Fail ❌

1. **Document Failures:**
   - [ ] List all failed tests
   - [ ] Capture error messages and logs
   - [ ] Take screenshots if UI issues
   - [ ] Note steps to reproduce

2. **Analyze Issues:**
   - [ ] Categorize by severity (critical, high, medium, low)
   - [ ] Identify root causes
   - [ ] Determine if rollback needed

3. **Fix and Retest:**
   - [ ] Fix critical issues
   - [ ] Deploy fixes to staging
   - [ ] Rerun failed tests
   - [ ] Verify fixes work

---

## Monitoring Setup

### Application Monitoring

**PM2 Monitoring:**
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# View monitoring dashboard
pm2 monit
```

**Error Tracking (Optional - Sentry):**
```javascript
// backend/src/app.js
const Sentry = require('@sentry/node');

if (process.env.NODE_ENV === 'staging') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'staging',
  });
}
```

### Database Monitoring

**Enable pg_stat_statements:**
```sql
-- In postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all

-- Restart PostgreSQL
sudo systemctl restart postgresql

-- Create extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

**Monitor Queries:**
```sql
-- Slow queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Most called queries
SELECT query, calls, total_exec_time
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 20;
```

### Server Monitoring

**Basic Monitoring:**
```bash
# CPU and Memory
htop

# Disk usage
df -h

# Network connections
netstat -tulpn | grep LISTEN

# Application logs
pm2 logs --lines 100
```

---

## Test Results Template

```markdown
# Staging Test Results

**Date:** YYYY-MM-DD
**Tester:** Your Name
**Duration:** X hours
**Environment:** https://staging.digitpenhub.com

## Summary
- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X

## Phase 1: Smoke Tests
- [ ] Application loads: PASS/FAIL
- [ ] Authentication: PASS/FAIL
- [ ] Basic navigation: PASS/FAIL

## Phase 2: Security Tests
- [ ] SQL injection prevention: PASS/FAIL
- [ ] XSS prevention: PASS/FAIL
- [ ] Multi-tenant isolation: PASS/FAIL
- [ ] RBAC enforcement: PASS/FAIL

## Phase 3: Workflow Tests
- [ ] CRM workflow: PASS/FAIL
- [ ] Email Marketing workflow: PASS/FAIL
- [ ] Invoice workflow: PASS/FAIL
- [ ] Team invitation workflow: PASS/FAIL

## Phase 4: Performance Tests
- [ ] Page load times: PASS/FAIL
- [ ] API response times: PASS/FAIL
- [ ] Database performance: PASS/FAIL

## Phase 5: Error Handling
- [ ] Network errors: PASS/FAIL
- [ ] Invalid input: PASS/FAIL
- [ ] 404 errors: PASS/FAIL
- [ ] API errors: PASS/FAIL

## Issues Found
1. [Issue description]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce:
   - Expected behavior:
   - Actual behavior:

## Recommendations
- [Recommendation 1]
- [Recommendation 2]

## Sign-off
- [ ] All critical tests passed
- [ ] No blocking issues found
- [ ] Ready for production: YES/NO
```

---

## Quick Reference Commands

```bash
# Start services
pm2 start ecosystem.config.js --env staging

# Stop services
pm2 stop all

# Restart services
pm2 restart all

# View logs
pm2 logs --lines 100

# Monitor resources
pm2 monit

# Check status
pm2 status

# Database backup
pg_dump -h staging-db.example.com -U staging_user digitpenhub_staging > backup.sql

# Database restore
psql -h staging-db.example.com -U staging_user digitpenhub_staging < backup.sql

# Check disk space
df -h

# Check memory
free -h

# Check processes
ps aux | grep node

# Test API endpoint
curl -X GET https://staging-api.digitpenhub.com/health

# Test with authentication
curl -X GET https://staging-api.digitpenhub.com/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Support & Troubleshooting

### Common Issues

**Issue: Application won't start**
```bash
# Check logs
pm2 logs --err

# Check port availability
lsof -i :3000
lsof -i :3001

# Check environment variables
pm2 env 0

# Restart with fresh logs
pm2 delete all
pm2 start ecosystem.config.js --env staging
```

**Issue: Database connection fails**
```bash
# Test connection
psql -h staging-db.example.com -U staging_user -d digitpenhub_staging

# Check credentials in .env
cat backend/.env | grep DB_

# Check PostgreSQL is running
sudo systemctl status postgresql
```

**Issue: Frontend can't reach backend**
```bash
# Check CORS settings
# backend/src/app.js should have:
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true
}));

# Check API URL in frontend
cat frontend/.env.local | grep API_URL
```

---

## Conclusion

This guide provides a comprehensive approach to deploying and testing the Digitpen Hub Suite on staging. Follow each phase systematically, document all results, and only proceed to production after all critical tests pass.

**Remember:**
- Take your time with testing
- Document everything
- Don't skip security tests
- Have a rollback plan ready
- Monitor closely after deployment

**Questions or Issues?**
- Check application logs: `pm2 logs`
- Check database logs: `/var/log/postgresql/`
- Check Nginx logs: `/var/log/nginx/`
- Review error messages carefully
- Test in isolation to identify root cause

---

**Guide Version:** 1.0  
**Last Updated:** July 13, 2026  
**Next Review:** After staging deployment
