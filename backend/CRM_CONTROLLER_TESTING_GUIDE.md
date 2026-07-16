# CRM Controller Testing Guide

**Date:** July 14, 2026  
**Status:** Ready for Testing  
**Purpose:** Guide for testing the refactored CRM controller

---

## Overview

This guide provides comprehensive instructions for testing the refactored CRM controller that now uses the service layer architecture. The controller has been migrated from direct database access to using ContactService and CompanyService.

---

## Prerequisites

### 1. Environment Setup

Ensure your development environment is ready:

```bash
# Navigate to backend directory
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend

# Install dependencies (if not already done)
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run migrate
```

### 2. Deploy Refactored Controller

**Option A: Test in Parallel (Recommended)**
```bash
# Keep original controller as backup
cp src/controllers/crmController.js src/controllers/crmController.backup.js

# Use refactored version
cp src/controllers/crmController.refactored.js src/controllers/crmController.js
```

**Option B: Test via Route Override**
```javascript
// In src/routes/crm.js, temporarily import refactored controller
const crmController = require('../controllers/crmController.refactored');
```

### 3. Start Development Server

```bash
# Start the server
npm run dev

# Server should start on http://localhost:3000
# Check health endpoint: curl http://localhost:3000/health
```

---

## Testing Methods

### Method 1: Automated Integration Tests

**Run the integration test suite:**

```bash
# Run CRM integration tests
npm test -- src/controllers/__tests__/crmController.integration.test.js

# Run with coverage
npm test -- --coverage src/controllers/__tests__/crmController.integration.test.js
```

**Expected Results:**
- All tests should pass
- No database errors
- Proper error handling for invalid inputs
- Tenant isolation working correctly

**Test Coverage:**
- ✅ Create contact (POST /api/v1/crm/contacts)
- ✅ List contacts (GET /api/v1/crm/contacts)
- ✅ Update contact (PATCH /api/v1/crm/contacts/:id)
- ✅ Delete contact (DELETE /api/v1/crm/contacts/:id)
- ✅ Contact notes (CRUD operations)
- ✅ Contact tasks (CRUD operations)
- ✅ Bulk import (POST /api/v1/crm/contacts/import)
- ✅ Error handling (400, 404, 500)
- ✅ Tenant isolation

### Method 2: Manual Testing Script

**Run the automated manual testing script:**

```bash
# First, get your authentication token
# Login to get token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Export the token
export AUTH_TOKEN='your-jwt-token-here'

# Run the testing script
./test-crm-refactored.sh

# Or with custom base URL
BASE_URL=http://localhost:3000 ./test-crm-refactored.sh
```

**What the script tests:**
1. Server health check
2. List contacts with statistics
3. Create contact
4. Get contact by ID
5. Update contact
6. Create note
7. List notes
8. Create task
9. List tasks
10. Update task
11. Bulk import
12. Search contacts
13. Delete note
14. Delete task
15. Delete contact
16. Error handling (invalid data)
17. Error handling (non-existent resource)

### Method 3: Manual Testing with cURL

**Test each endpoint manually:**

#### 1. List Contacts
```bash
curl -X GET http://localhost:3000/api/v1/crm/contacts \
  -H "Cookie: token=${AUTH_TOKEN}" \
  | jq '.'
```

**Expected Response:**
```json
{
  "contacts": [...],
  "counts": {
    "new": 5,
    "contacted": 3,
    "proposal_sent": 2,
    "won": 1,
    "lost": 0
  },
  "stats": {...}
}
```

#### 2. Create Contact
```bash
curl -X POST http://localhost:3000/api/v1/crm/contacts \
  -H "Cookie: token=${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp",
    "stage": "new",
    "valueNgn": 50000,
    "tags": ["lead", "enterprise"]
  }' \
  | jq '.'
```

**Expected Response:**
```json
{
  "contact": {
    "id": "uuid-here",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp",
    "stage": "new",
    "value_ngn": "50000.00",
    "tags": ["lead", "enterprise"],
    "created_at": "2026-07-14T18:00:00.000Z",
    "last_touch_at": "2026-07-14T18:00:00.000Z"
  }
}
```

#### 3. Update Contact
```bash
curl -X PATCH http://localhost:3000/api/v1/crm/contacts/{contact-id} \
  -H "Cookie: token=${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "contacted",
    "valueNgn": 75000
  }' \
  | jq '.'
```

#### 4. Create Note
```bash
curl -X POST http://localhost:3000/api/v1/crm/contacts/{contact-id}/notes \
  -H "Cookie: token=${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Had a great call with John. Very interested in our enterprise plan."
  }' \
  | jq '.'
```

#### 5. Bulk Import
```bash
curl -X POST http://localhost:3000/api/v1/crm/contacts/import \
  -H "Cookie: token=${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      {"fullName": "Contact 1", "email": "contact1@example.com"},
      {"fullName": "Contact 2", "email": "contact2@example.com"},
      {"fullName": "Contact 3", "email": "contact3@example.com"}
    ]
  }' \
  | jq '.'
```

**Expected Response:**
```json
{
  "imported": 3,
  "duplicate": 0,
  "invalid": 0
}
```

### Method 4: Postman/Insomnia Testing

**Import this collection:**

```json
{
  "name": "CRM API - Refactored",
  "requests": [
    {
      "name": "List Contacts",
      "method": "GET",
      "url": "{{baseUrl}}/api/v1/crm/contacts"
    },
    {
      "name": "Create Contact",
      "method": "POST",
      "url": "{{baseUrl}}/api/v1/crm/contacts",
      "body": {
        "fullName": "Test Contact",
        "email": "test@example.com"
      }
    },
    {
      "name": "Update Contact",
      "method": "PATCH",
      "url": "{{baseUrl}}/api/v1/crm/contacts/{{contactId}}",
      "body": {
        "stage": "contacted"
      }
    },
    {
      "name": "Delete Contact",
      "method": "DELETE",
      "url": "{{baseUrl}}/api/v1/crm/contacts/{{contactId}}"
    }
  ]
}
```

---

## Test Scenarios

### Scenario 1: Happy Path - Complete Contact Lifecycle

**Steps:**
1. Create a new contact
2. Verify contact appears in list
3. Add a note to the contact
4. Create a task for the contact
5. Update contact stage to "contacted"
6. Update task status to "done"
7. Delete the contact

**Expected:** All operations succeed with appropriate responses

### Scenario 2: Validation Testing

**Test Cases:**
1. Create contact without required fields → 400 error
2. Create contact with invalid email → 400 error
3. Create contact with invalid stage → 400 error
4. Update contact with invalid data → 400 error
5. Create note with empty body → 400 error
6. Create task with empty title → 400 error

**Expected:** Proper validation errors with descriptive messages

### Scenario 3: Error Handling

**Test Cases:**
1. Get non-existent contact → 404 error
2. Update non-existent contact → 404 error
3. Delete non-existent contact → 404 error
4. Create note for non-existent contact → 404 error
5. Invalid UUID format → 500 error (handled gracefully)

**Expected:** Appropriate HTTP status codes and error messages

### Scenario 4: Bulk Operations

**Test Cases:**
1. Import 10 valid contacts → All imported
2. Import contacts with duplicates → Duplicates detected
3. Import contacts with invalid data → Invalid contacts rejected
4. Import > 2000 contacts → 400 error
5. Import empty array → 400 error

**Expected:** Proper handling of bulk operations with detailed results

### Scenario 5: Tenant Isolation

**Test Cases:**
1. User A creates contact
2. User B (different org) tries to access User A's contact → 404
3. User A can access their own contact → Success
4. List contacts shows only contacts from user's org

**Expected:** Complete tenant isolation, no cross-org data access

### Scenario 6: Performance Testing

**Test Cases:**
1. List 1000+ contacts → Response time < 1s
2. Bulk import 1000 contacts → Completes successfully
3. Search contacts with filters → Fast response
4. Concurrent requests → No race conditions

**Expected:** Good performance, no database deadlocks

---

## Verification Checklist

### Functionality ✅
- [ ] All CRUD operations work correctly
- [ ] Notes can be created, listed, and deleted
- [ ] Tasks can be created, updated, and deleted
- [ ] Bulk import works with deduplication
- [ ] Statistics are calculated correctly
- [ ] Search/filter functionality works

### Data Integrity ✅
- [ ] Data is saved correctly to database
- [ ] Timestamps are set properly
- [ ] Foreign key relationships maintained
- [ ] Soft deletes work (if implemented)
- [ ] Transactions rollback on errors

### Security ✅
- [ ] Authentication required for all endpoints
- [ ] Tenant isolation enforced
- [ ] SQL injection prevented (parameterized queries)
- [ ] Input validation working
- [ ] No sensitive data in error messages

### Error Handling ✅
- [ ] 400 errors for validation failures
- [ ] 404 errors for not found resources
- [ ] 500 errors handled gracefully
- [ ] Error messages are descriptive
- [ ] Errors logged properly

### Performance ✅
- [ ] Response times acceptable
- [ ] No N+1 query problems
- [ ] Database connections managed properly
- [ ] No memory leaks
- [ ] Concurrent requests handled

### Backward Compatibility ✅
- [ ] API endpoints unchanged
- [ ] Request/response formats same
- [ ] Existing clients work without changes
- [ ] No breaking changes introduced

---

## Common Issues and Solutions

### Issue 1: Tests Failing Due to Missing Data

**Problem:** Integration tests fail because test data doesn't exist

**Solution:**
```bash
# Run database migrations
npm run migrate

# Seed test data (if available)
npm run seed
```

### Issue 2: Authentication Errors

**Problem:** 401 Unauthorized errors

**Solution:**
```bash
# Verify JWT_SECRET is set in .env
echo $JWT_SECRET

# Get fresh authentication token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

### Issue 3: Database Connection Errors

**Problem:** Cannot connect to database

**Solution:**
```bash
# Check database is running
pg_isready -h localhost -p 5432

# Verify connection string in .env
cat .env | grep DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Issue 4: Service Not Found Errors

**Problem:** Module not found errors for services

**Solution:**
```bash
# Verify service files exist
ls -la src/services/crm/ContactService.js
ls -la src/repositories/ContactRepository.js

# Check for syntax errors
node -c src/services/crm/ContactService.js
```

### Issue 5: Validation Errors Not Working

**Problem:** Invalid data accepted

**Solution:**
- Check service validation methods
- Verify validateCreate/validateUpdate are called
- Check error handling in controller

---

## Performance Benchmarks

### Expected Response Times

| Endpoint | Expected Time | Notes |
|----------|--------------|-------|
| List contacts (< 100) | < 200ms | With statistics |
| Create contact | < 100ms | Single insert |
| Update contact | < 100ms | Single update |
| Delete contact | < 100ms | Single delete |
| Bulk import (100) | < 2s | With validation |
| Bulk import (1000) | < 10s | With validation |

### Database Query Optimization

- Use indexes on frequently queried columns
- Avoid N+1 queries (use joins)
- Implement pagination for large datasets
- Cache frequently accessed data

---

## Rollback Plan

If issues are found during testing:

### Step 1: Immediate Rollback
```bash
# Restore original controller
cp src/controllers/crmController.backup.js src/controllers/crmController.js

# Restart server
npm run dev
```

### Step 2: Document Issues
- Record all failing test cases
- Capture error logs
- Note performance issues
- Document unexpected behavior

### Step 3: Fix and Retest
- Fix identified issues
- Run unit tests
- Run integration tests
- Repeat manual testing

---

## Sign-off Criteria

Before deploying to staging, ensure:

- ✅ All automated tests passing (64+ tests)
- ✅ All manual test scenarios completed successfully
- ✅ No performance regressions
- ✅ No security vulnerabilities
- ✅ Backward compatibility maintained
- ✅ Documentation updated
- ✅ Team review completed
- ✅ Rollback plan tested

---

## Next Steps After Testing

### If All Tests Pass ✅

1. **Code Review**
   - Submit PR for team review
   - Address feedback
   - Get approval

2. **Staging Deployment**
   ```bash
   git add .
   git commit -m "refactor: migrate CRM controller to service layer"
   git push staging main
   ```

3. **Staging Validation**
   - Run smoke tests
   - Monitor error logs
   - Check performance metrics
   - Verify with real data

4. **Production Deployment**
   - Schedule deployment window
   - Deploy during low-traffic period
   - Monitor closely for 24-48 hours
   - Keep rollback plan ready

### If Tests Fail ❌

1. **Document Failures**
   - Record all failing tests
   - Capture error messages
   - Note reproduction steps

2. **Rollback**
   - Restore original controller
   - Verify system working

3. **Fix Issues**
   - Address failing tests
   - Fix bugs
   - Improve error handling

4. **Retest**
   - Run all tests again
   - Verify fixes work
   - Repeat until all pass

---

## Support

**Questions or Issues?**
- Check `CONTROLLER_TO_SERVICE_MIGRATION_GUIDE.md`
- Review `ARCHITECTURE_AUDIT_REPORT.md`
- Contact engineering team

**Documentation:**
- Architecture: `ARCHITECTURE_AUDIT_REPORT.md`
- Migration Guide: `CONTROLLER_TO_SERVICE_MIGRATION_GUIDE.md`
- Week 1 Summary: `PHASE_1_WEEK1_COMPLETE.md`

---

**Document Version:** 1.0  
**Last Updated:** July 14, 2026  
**Next Review:** After testing complete
