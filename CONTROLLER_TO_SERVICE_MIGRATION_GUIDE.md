# Controller to Service Layer Migration Guide

**Date:** July 14, 2026  
**Status:** Active  
**Purpose:** Guide for migrating controllers from direct DB access to service layer

---

## Overview

This guide demonstrates how to migrate existing controllers from direct database access to the new service layer architecture. The CRM controller serves as the reference implementation.

---

## Benefits of Migration

### Before (Direct DB Access)
```javascript
// ❌ Problems:
// - Business logic mixed with HTTP handling
// - No reusability across modules
// - Difficult to test
// - Duplicate validation logic
// - No centralized error handling
// - Cannot use in background jobs or CLI tools

async function createContact(req, res) {
  const { fullName, email } = req.body;
  if (!fullName) return res.status(400).json({ error: 'fullName required' });
  
  const { rows } = await db.query(
    `INSERT INTO contacts (org_id, full_name, email) VALUES ($1, $2, $3) RETURNING *`,
    [req.user.orgId, fullName, email]
  );
  
  res.status(201).json({ contact: rows[0] });
}
```

### After (Service Layer)
```javascript
// ✅ Benefits:
// - Clean separation of concerns
// - Reusable business logic
// - Easy to test
// - Centralized validation
// - Consistent error handling
// - Can be used anywhere (controllers, jobs, CLI, etc.)

async function createContact(req, res) {
  try {
    const { fullName, email } = req.body;
    
    const contact = await ContactService.create(
      { full_name: fullName, email },
      req.user.orgId,
      req.user.id
    );
    
    res.status(201).json({ contact });
  } catch (error) {
    if (error.message.includes('required')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create contact' });
  }
}
```

---

## Migration Process

### Step 1: Identify the Controller

**Example:** `backend/src/controllers/crmController.js`

**Checklist:**
- [ ] Controller has direct `db.query()` calls
- [ ] Business logic mixed with HTTP handling
- [ ] Validation logic in controller
- [ ] No unit tests or difficult to test

### Step 2: Create Repository

**Location:** `backend/src/repositories/ContactRepository.js`

**Template:**
```javascript
const BaseRepository = require('./base/BaseRepository');
const db = require('../db');

class ContactRepository extends BaseRepository {
  constructor() {
    super(db, 'contacts', {
      primaryKey: 'id',
      timestamps: true,
    });
  }

  // Add domain-specific methods
  async search(orgId, query, filters = {}) {
    // Custom search logic
  }

  async getStatsByStage(orgId) {
    // Custom statistics logic
  }
}

module.exports = ContactRepository;
```

**Key Points:**
- Extend `BaseRepository` for common operations
- Add domain-specific methods
- Keep it focused on data access only
- No business logic or validation

### Step 3: Create Service

**Location:** `backend/src/services/crm/ContactService.js`

**Template:**
```javascript
const BaseService = require('../base/BaseService');
const ContactRepository = require('../../repositories/ContactRepository');
const logger = require('../../utils/logger');

class ContactService extends BaseService {
  constructor() {
    const repository = new ContactRepository();
    super(repository, {
      serviceName: 'ContactService',
      logger,
    });
  }

  // Override validation hooks
  validateCreate(data) {
    if (!data.email && !data.phone) {
      throw new Error('Contact must have email or phone');
    }
  }

  // Override transformation hooks
  transformForCreate(data) {
    return {
      ...data,
      email: data.email?.toLowerCase(),
      stage: data.stage || 'new',
    };
  }

  // Add domain-specific methods
  async search(orgId, query, filters = {}) {
    const results = await this.repository.search(orgId, query, filters);
    return results.map(r => this.enrichEntity(r));
  }

  // Override enrichment
  enrichEntity(entity) {
    return {
      ...entity,
      displayName: entity.full_name || entity.email,
    };
  }
}

module.exports = new ContactService();
```

**Key Points:**
- Extend `BaseService` for common operations
- Override validation hooks for business rules
- Override transformation hooks for data normalization
- Add domain-specific methods
- Export singleton instance

### Step 4: Create Tests

**Location:** `backend/src/services/crm/__tests__/ContactService.test.js`

**Template:**
```javascript
jest.mock('../../../repositories/ContactRepository');

const ContactService = require('../ContactService');
const ContactRepository = require('../../../repositories/ContactRepository');

describe('ContactService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ContactService.repository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      // ... other methods
    };
  });

  describe('create', () => {
    it('should create a contact with valid data', async () => {
      const mockContact = { id: 1, full_name: 'John', email: 'john@example.com' };
      ContactService.repository.create = jest.fn().mockResolvedValue(mockContact);

      const result = await ContactService.create(
        { full_name: 'John', email: 'john@example.com' },
        1,
        100
      );

      expect(result.full_name).toBe('John');
      expect(ContactService.repository.create).toHaveBeenCalled();
    });

    it('should throw error for invalid data', async () => {
      await expect(
        ContactService.create({ full_name: 'John' }, 1, 100)
      ).rejects.toThrow('Contact must have email or phone');
    });
  });
});
```

**Key Points:**
- Mock the repository
- Test validation logic
- Test transformation logic
- Test error cases
- Aim for 80%+ coverage

### Step 5: Refactor Controller

**Location:** `backend/src/controllers/crmController.refactored.js`

**Migration Pattern:**

**Before:**
```javascript
async function createContact(req, res) {
  const { fullName, email } = req.body;
  if (!fullName) return res.status(400).json({ error: 'fullName required' });
  
  const { rows } = await db.query(
    `INSERT INTO contacts (org_id, full_name, email) VALUES ($1, $2, $3) RETURNING *`,
    [req.user.orgId, fullName, email]
  );
  
  res.status(201).json({ contact: rows[0] });
}
```

**After:**
```javascript
const ContactService = require('../services/crm/ContactService');

async function createContact(req, res) {
  try {
    const { fullName, email } = req.body;
    
    const contact = await ContactService.create(
      { full_name: fullName, email },
      req.user.orgId,
      req.user.id
    );
    
    res.status(201).json({ contact });
  } catch (error) {
    if (error.message.includes('required')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create contact' });
  }
}
```

**Key Changes:**
1. Import service at top
2. Remove direct `db.query()` calls
3. Remove validation logic (now in service)
4. Add try-catch for error handling
5. Map service errors to HTTP status codes
6. Keep HTTP-specific logic (status codes, response format)

### Step 6: Update Routes (Optional)

If routes need changes, update them:

**Before:**
```javascript
const { createContact } = require('../controllers/crmController');
router.post('/contacts', requireAuth, createContact);
```

**After:**
```javascript
const { createContact } = require('../controllers/crmController.refactored');
router.post('/contacts', requireAuth, createContact);
```

### Step 7: Test Integration

**Create integration test:**
```javascript
const request = require('supertest');
const app = require('../../src/app');

describe('CRM API Integration', () => {
  it('should create a contact', async () => {
    const res = await request(app)
      .post('/api/v1/crm/contacts')
      .set('Cookie', authCookie)
      .send({
        fullName: 'Test Contact',
        email: 'test@example.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.contact.full_name).toBe('Test Contact');
  });
});
```

### Step 8: Deploy

1. **Backup current controller:**
   ```bash
   cp crmController.js crmController.backup.js
   ```

2. **Replace with refactored version:**
   ```bash
   mv crmController.refactored.js crmController.js
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Deploy to staging:**
   ```bash
   git add .
   git commit -m "refactor: migrate CRM controller to service layer"
   git push staging main
   ```

5. **Monitor for issues:**
   - Check error logs
   - Monitor response times
   - Verify functionality

6. **Deploy to production:**
   ```bash
   git push production main
   ```

---

## Common Patterns

### Pattern 1: Simple CRUD

**Before:**
```javascript
async function getContact(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM contacts WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ contact: rows[0] });
}
```

**After:**
```javascript
async function getContact(req, res) {
  try {
    const contact = await ContactService.findById(req.params.id, req.user.orgId);
    if (!contact) return res.status(404).json({ error: 'Not found' });
    res.json({ contact });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get contact' });
  }
}
```

### Pattern 2: Search/Filter

**Before:**
```javascript
async function searchContacts(req, res) {
  const { query, stage } = req.query;
  const { rows } = await db.query(
    `SELECT * FROM contacts 
     WHERE org_id = $1 
       AND (full_name ILIKE $2 OR email ILIKE $2)
       AND ($3::text IS NULL OR stage = $3)
     ORDER BY created_at DESC`,
    [req.user.orgId, `%${query}%`, stage || null]
  );
  res.json({ contacts: rows });
}
```

**After:**
```javascript
async function searchContacts(req, res) {
  try {
    const { query, stage } = req.query;
    const contacts = await ContactService.search(
      req.user.orgId,
      query,
      { stage }
    );
    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search contacts' });
  }
}
```

### Pattern 3: Bulk Operations

**Before:**
```javascript
async function bulkCreate(req, res) {
  const { contacts } = req.body;
  const values = [];
  const placeholders = contacts.map((c, i) => {
    values.push(req.user.orgId, c.name, c.email);
    return `($${i*3+1}, $${i*3+2}, $${i*3+3})`;
  });
  await db.query(
    `INSERT INTO contacts (org_id, full_name, email) VALUES ${placeholders.join(',')}`,
    values
  );
  res.json({ imported: contacts.length });
}
```

**After:**
```javascript
async function bulkCreate(req, res) {
  try {
    const { contacts } = req.body;
    const result = await ContactService.bulkCreate(
      contacts,
      req.user.orgId,
      req.user.id
    );
    res.json({
      imported: result.created.length,
      errors: result.errors.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import contacts' });
  }
}
```

### Pattern 4: Transactions

**Before:**
```javascript
async function createWithRelations(req, res) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const { rows: [contact] } = await client.query(
      `INSERT INTO contacts (...) VALUES (...) RETURNING *`,
      [...]
    );
    
    await client.query(
      `INSERT INTO contact_notes (...) VALUES (...)`,
      [contact.id, ...]
    );
    
    await client.query('COMMIT');
    res.json({ contact });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

**After:**
```javascript
async function createWithRelations(req, res) {
  try {
    // Service handles transaction internally
    const contact = await ContactService.createWithNotes(
      req.body,
      req.user.orgId,
      req.user.id
    );
    res.json({ contact });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contact' });
  }
}
```

---

## Error Handling Strategy

### Service Layer Errors

Services should throw descriptive errors:

```javascript
// In service
validateCreate(data) {
  if (!data.email && !data.phone) {
    throw new Error('Contact must have email or phone');
  }
  if (data.email && !this.isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }
}
```

### Controller Error Mapping

Controllers map service errors to HTTP status codes:

```javascript
// In controller
try {
  const contact = await ContactService.create(data, orgId, userId);
  res.status(201).json({ contact });
} catch (error) {
  // Validation errors -> 400
  if (error.message.includes('required') || error.message.includes('Invalid')) {
    return res.status(400).json({ error: error.message });
  }
  
  // Not found errors -> 404
  if (error.message.includes('not found')) {
    return res.status(404).json({ error: error.message });
  }
  
  // Permission errors -> 403
  if (error.message.includes('permission') || error.message.includes('access')) {
    return res.status(403).json({ error: error.message });
  }
  
  // Everything else -> 500
  res.status(500).json({ error: 'Internal server error' });
}
```

---

## Testing Strategy

### 1. Unit Tests (Service Layer)

**Focus:** Business logic, validation, transformation

```javascript
describe('ContactService', () => {
  it('should validate email format', async () => {
    await expect(
      ContactService.create({ email: 'invalid' }, 1, 1)
    ).rejects.toThrow('Invalid email format');
  });
});
```

### 2. Integration Tests (Controller + Service)

**Focus:** HTTP endpoints, error handling, response format

```javascript
describe('POST /api/v1/crm/contacts', () => {
  it('should return 400 for invalid data', async () => {
    const res = await request(app)
      .post('/api/v1/crm/contacts')
      .set('Cookie', authCookie)
      .send({ email: 'invalid' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid email');
  });
});
```

### 3. E2E Tests (Full Flow)

**Focus:** Complete user workflows

```javascript
describe('Contact Management Flow', () => {
  it('should create, update, and delete contact', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/v1/crm/contacts')
      .send({ fullName: 'Test', email: 'test@example.com' });
    
    const contactId = createRes.body.contact.id;
    
    // Update
    const updateRes = await request(app)
      .patch(`/api/v1/crm/contacts/${contactId}`)
      .send({ stage: 'contacted' });
    
    expect(updateRes.body.contact.stage).toBe('contacted');
    
    // Delete
    const deleteRes = await request(app)
      .delete(`/api/v1/crm/contacts/${contactId}`);
    
    expect(deleteRes.status).toBe(200);
  });
});
```

---

## Migration Checklist

For each controller:

### Planning
- [ ] Identify controller to migrate
- [ ] Review existing functionality
- [ ] Identify business logic to extract
- [ ] Plan service structure

### Implementation
- [ ] Create repository class
- [ ] Create service class
- [ ] Write unit tests for service
- [ ] Refactor controller
- [ ] Write integration tests
- [ ] Update documentation

### Testing
- [ ] Run unit tests (80%+ coverage)
- [ ] Run integration tests
- [ ] Manual testing in development
- [ ] Deploy to staging
- [ ] Smoke tests in staging

### Deployment
- [ ] Backup original controller
- [ ] Deploy to staging
- [ ] Monitor for 24 hours
- [ ] Deploy to production
- [ ] Monitor for 48 hours
- [ ] Remove backup file

---

## Common Pitfalls

### ❌ Pitfall 1: Keeping Business Logic in Controller

**Wrong:**
```javascript
async function createContact(req, res) {
  const { email } = req.body;
  
  // ❌ Validation in controller
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  const contact = await ContactService.create({ email }, orgId, userId);
  res.json({ contact });
}
```

**Right:**
```javascript
// In service
validateCreate(data) {
  if (!this.isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }
}

// In controller
async function createContact(req, res) {
  try {
    const contact = await ContactService.create(req.body, orgId, userId);
    res.json({ contact });
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create contact' });
  }
}
```

### ❌ Pitfall 2: Not Using Transactions

**Wrong:**
```javascript
// Multiple separate operations without transaction
const contact = await ContactService.create(data, orgId, userId);
await NoteService.create({ contactId: contact.id, content }, orgId, userId);
// If second operation fails, first is already committed!
```

**Right:**
```javascript
// Service handles transaction
async createWithNotes(contactData, noteData, orgId, userId) {
  const client = await this.repository.beginTransaction();
  try {
    const contact = await this.repository.create(contactData, orgId, userId);
    await this.noteRepository.create({ ...noteData, contactId: contact.id }, orgId, userId);
    await this.repository.commitTransaction(client);
    return contact;
  } catch (error) {
    await this.repository.rollbackTransaction(client);
    throw error;
  }
}
```

### ❌ Pitfall 3: Inconsistent Error Handling

**Wrong:**
```javascript
// Different error formats
if (!data.email) throw new Error('Email required');
if (!data.phone) return null; // ❌ Inconsistent
if (!data.name) res.status(400).json({ error: 'Name required' }); // ❌ Wrong layer
```

**Right:**
```javascript
// Consistent error throwing in service
validateCreate(data) {
  if (!data.email) throw new Error('Email is required');
  if (!data.phone) throw new Error('Phone is required');
  if (!data.name) throw new Error('Name is required');
}
```

---

## Performance Considerations

### 1. Avoid N+1 Queries

**Wrong:**
```javascript
const contacts = await ContactService.findAll(orgId);
for (const contact of contacts) {
  contact.notes = await NoteService.findByContact(contact.id, orgId);
}
```

**Right:**
```javascript
// Add method to service
async findAllWithNotes(orgId) {
  const contacts = await this.repository.findAll(orgId);
  const contactIds = contacts.map(c => c.id);
  const notes = await this.noteRepository.findByContactIds(contactIds, orgId);
  
  // Group notes by contact
  const notesByContact = notes.reduce((acc, note) => {
    if (!acc[note.contact_id]) acc[note.contact_id] = [];
    acc[note.contact_id].push(note);
    return acc;
  }, {});
  
  return contacts.map(c => ({
    ...c,
    notes: notesByContact[c.id] || [],
  }));
}
```

### 2. Use Pagination

**Wrong:**
```javascript
const contacts = await ContactService.findAll(orgId); // Could be 100k records!
```

**Right:**
```javascript
const contacts = await ContactService.findAll(orgId, {}, {
  limit: 50,
  offset: req.query.page * 50,
});
```

### 3. Cache Expensive Operations

```javascript
// In service
async getStatistics(orgId) {
  const cacheKey = `contact_stats:${orgId}`;
  
  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  // Calculate
  const stats = await this.repository.getStatsByStage(orgId);
  
  // Cache for 5 minutes
  await cache.set(cacheKey, stats, 300);
  
  return stats;
}
```

---

## Next Steps

1. **Week 1:** Migrate CRM, Invoicing, and HR controllers
2. **Week 2:** Migrate Project Management and Marketing controllers
3. **Week 3:** Migrate remaining controllers
4. **Week 4:** Remove all backup files, update documentation

---

## Support

**Questions?** Check:
- `ARCHITECTURE_AUDIT_REPORT.md` - Full architecture analysis
- `PHASE_1_REFACTORING_PLAN.md` - Detailed implementation plan
- `backend/src/services/base/BaseService.js` - Base service implementation
- `backend/src/repositories/base/BaseRepository.js` - Base repository implementation

**Need Help?** Contact the engineering team.

---

**Document Version:** 1.0  
**Last Updated:** July 14, 2026  
**Next Review:** July 21, 2026
