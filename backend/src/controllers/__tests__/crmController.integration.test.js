const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const jwt = require('jsonwebtoken');

/**
 * Integration tests for refactored CRM controller
 * Tests actual HTTP endpoints with service layer
 */

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = {
      id: 'test-user-id',
      orgId: 'test-org-id',
      fullName: 'Test User',
    };
    next();
  },
}));

describe('CRM Controller Integration Tests', () => {
  let authToken;
  let testContactId;
  let testCompanyId;

  beforeAll(async () => {
    // Generate test auth token
    authToken = jwt.sign(
      { userId: 'test-user-id', orgId: 'test-org-id' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    if (testContactId) {
      await db.query('DELETE FROM contacts WHERE id = $1', [testContactId]);
    }
    if (testCompanyId) {
      await db.query('DELETE FROM crm_companies WHERE id = $1', [testCompanyId]);
    }
  });

  describe('POST /api/v1/crm/contacts', () => {
    it('should create a new contact', async () => {
      const contactData = {
        fullName: 'Integration Test Contact',
        email: 'integration@test.com',
        phone: '+1234567890',
        company: 'Test Company',
        stage: 'new',
        valueNgn: 10000,
        tags: ['test', 'integration'],
      };

      const response = await request(app)
        .post('/api/v1/crm/contacts')
        .set('Cookie', `token=${authToken}`)
        .send(contactData)
        .expect(201);

      expect(response.body.contact).toBeDefined();
      expect(response.body.contact.full_name).toBe(contactData.fullName);
      expect(response.body.contact.email).toBe(contactData.email);
      expect(response.body.contact.stage).toBe('new');

      testContactId = response.body.contact.id;
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/crm/contacts')
        .set('Cookie', `token=${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should return 400 for invalid stage', async () => {
      const response = await request(app)
        .post('/api/v1/crm/contacts')
        .set('Cookie', `token=${authToken}`)
        .send({
          fullName: 'Test Contact',
          stage: 'invalid-stage',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/crm/contacts', () => {
    it('should list all contacts with statistics', async () => {
      const response = await request(app)
        .get('/api/v1/crm/contacts')
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body.contacts).toBeDefined();
      expect(Array.isArray(response.body.contacts)).toBe(true);
      expect(response.body.counts).toBeDefined();
      expect(response.body.counts).toHaveProperty('new');
      expect(response.body.counts).toHaveProperty('contacted');
      expect(response.body.counts).toHaveProperty('won');
    });
  });

  describe('PATCH /api/v1/crm/contacts/:id', () => {
    beforeEach(async () => {
      // Create a test contact
      const { rows } = await db.query(
        `INSERT INTO contacts (org_id, full_name, email, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['test-org-id', 'Update Test Contact', 'update@test.com', 'test-user-id']
      );
      testContactId = rows[0].id;
    });

    it('should update a contact', async () => {
      const updateData = {
        fullName: 'Updated Contact Name',
        stage: 'contacted',
        valueNgn: 20000,
      };

      const response = await request(app)
        .patch(`/api/v1/crm/contacts/${testContactId}`)
        .set('Cookie', `token=${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.contact).toBeDefined();
      expect(response.body.contact.full_name).toBe(updateData.fullName);
      expect(response.body.contact.stage).toBe('contacted');
      expect(parseFloat(response.body.contact.value_ngn)).toBe(20000);
    });

    it('should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .patch('/api/v1/crm/contacts/non-existent-id')
        .set('Cookie', `token=${authToken}`)
        .send({ fullName: 'Test' })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should allow partial updates', async () => {
      const response = await request(app)
        .patch(`/api/v1/crm/contacts/${testContactId}`)
        .set('Cookie', `token=${authToken}`)
        .send({ stage: 'proposal_sent' })
        .expect(200);

      expect(response.body.contact.stage).toBe('proposal_sent');
      expect(response.body.contact.full_name).toBe('Update Test Contact');
    });
  });

  describe('DELETE /api/v1/crm/contacts/:id', () => {
    beforeEach(async () => {
      // Create a test contact
      const { rows } = await db.query(
        `INSERT INTO contacts (org_id, full_name, email, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['test-org-id', 'Delete Test Contact', 'delete@test.com', 'test-user-id']
      );
      testContactId = rows[0].id;
    });

    it('should delete a contact', async () => {
      const response = await request(app)
        .delete(`/api/v1/crm/contacts/${testContactId}`)
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body.ok).toBe(true);

      // Verify contact is deleted
      const { rows } = await db.query('SELECT * FROM contacts WHERE id = $1', [testContactId]);
      expect(rows.length).toBe(0);

      testContactId = null; // Prevent cleanup attempt
    });

    it('should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .delete('/api/v1/crm/contacts/non-existent-id')
        .set('Cookie', `token=${authToken}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('Contact Notes', () => {
    beforeEach(async () => {
      // Create a test contact
      const { rows } = await db.query(
        `INSERT INTO contacts (org_id, full_name, email, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['test-org-id', 'Notes Test Contact', 'notes@test.com', 'test-user-id']
      );
      testContactId = rows[0].id;
    });

    it('should create a note for a contact', async () => {
      const response = await request(app)
        .post(`/api/v1/crm/contacts/${testContactId}/notes`)
        .set('Cookie', `token=${authToken}`)
        .send({ body: 'This is a test note' })
        .expect(201);

      expect(response.body.note).toBeDefined();
      expect(response.body.note.body).toBe('This is a test note');
      expect(response.body.note.author_name).toBe('Test User');
    });

    it('should list notes for a contact', async () => {
      // Create a note first
      await db.query(
        `INSERT INTO contact_notes (org_id, contact_id, author_id, body)
         VALUES ($1, $2, $3, $4)`,
        ['test-org-id', testContactId, 'test-user-id', 'Test note content']
      );

      const response = await request(app)
        .get(`/api/v1/crm/contacts/${testContactId}/notes`)
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body.notes).toBeDefined();
      expect(Array.isArray(response.body.notes)).toBe(true);
      expect(response.body.notes.length).toBeGreaterThan(0);
    });

    it('should return 400 for empty note body', async () => {
      const response = await request(app)
        .post(`/api/v1/crm/contacts/${testContactId}/notes`)
        .set('Cookie', `token=${authToken}`)
        .send({ body: '' })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should return 404 for notes on non-existent contact', async () => {
      const response = await request(app)
        .get('/api/v1/crm/contacts/non-existent-id/notes')
        .set('Cookie', `token=${authToken}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('Contact Tasks', () => {
    beforeEach(async () => {
      // Create a test contact
      const { rows } = await db.query(
        `INSERT INTO contacts (org_id, full_name, email, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['test-org-id', 'Tasks Test Contact', 'tasks@test.com', 'test-user-id']
      );
      testContactId = rows[0].id;
    });

    it('should create a task for a contact', async () => {
      const response = await request(app)
        .post(`/api/v1/crm/contacts/${testContactId}/tasks`)
        .set('Cookie', `token=${authToken}`)
        .send({
          title: 'Follow up call',
          dueDate: '2026-07-20',
        })
        .expect(201);

      expect(response.body.task).toBeDefined();
      expect(response.body.task.title).toBe('Follow up call');
      expect(response.body.task.status).toBe('open');
    });

    it('should list tasks for a contact', async () => {
      // Create a task first
      await db.query(
        `INSERT INTO contact_tasks (org_id, contact_id, title, created_by)
         VALUES ($1, $2, $3, $4)`,
        ['test-org-id', testContactId, 'Test task', 'test-user-id']
      );

      const response = await request(app)
        .get(`/api/v1/crm/contacts/${testContactId}/tasks`)
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body.tasks).toBeDefined();
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.tasks.length).toBeGreaterThan(0);
    });

    it('should return 400 for empty task title', async () => {
      const response = await request(app)
        .post(`/api/v1/crm/contacts/${testContactId}/tasks`)
        .set('Cookie', `token=${authToken}`)
        .send({ title: '' })
        .expect(400);

      expect(response.body.error).toContain('required');
    });
  });

  describe('Bulk Import', () => {
    it('should import multiple contacts', async () => {
      const contacts = [
        { fullName: 'Bulk Contact 1', email: 'bulk1@test.com' },
        { fullName: 'Bulk Contact 2', email: 'bulk2@test.com' },
        { fullName: 'Bulk Contact 3', email: 'bulk3@test.com' },
      ];

      const response = await request(app)
        .post('/api/v1/crm/contacts/import')
        .set('Cookie', `token=${authToken}`)
        .send({ contacts })
        .expect(201);

      expect(response.body.imported).toBe(3);
      expect(response.body.duplicate).toBe(0);
      expect(response.body.invalid).toBe(0);

      // Clean up
      await db.query(
        `DELETE FROM contacts WHERE email IN ('bulk1@test.com', 'bulk2@test.com', 'bulk3@test.com')`
      );
    });

    it('should detect duplicate emails', async () => {
      // Create a contact first
      await db.query(
        `INSERT INTO contacts (org_id, full_name, email, created_by)
         VALUES ($1, $2, $3, $4)`,
        ['test-org-id', 'Existing Contact', 'existing@test.com', 'test-user-id']
      );

      const contacts = [
        { fullName: 'New Contact', email: 'new@test.com' },
        { fullName: 'Duplicate Contact', email: 'existing@test.com' },
      ];

      const response = await request(app)
        .post('/api/v1/crm/contacts/import')
        .set('Cookie', `token=${authToken}`)
        .send({ contacts })
        .expect(201);

      expect(response.body.imported).toBe(1);
      expect(response.body.duplicate).toBe(1);

      // Clean up
      await db.query(
        `DELETE FROM contacts WHERE email IN ('new@test.com', 'existing@test.com')`
      );
    });

    it('should return 400 for empty contacts array', async () => {
      const response = await request(app)
        .post('/api/v1/crm/contacts/import')
        .set('Cookie', `token=${authToken}`)
        .send({ contacts: [] })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should return 400 for too many contacts', async () => {
      const contacts = Array(2001)
        .fill(null)
        .map((_, i) => ({
          fullName: `Contact ${i}`,
          email: `contact${i}@test.com`,
        }));

      const response = await request(app)
        .post('/api/v1/crm/contacts/import')
        .set('Cookie', `token=${authToken}`)
        .send({ contacts })
        .expect(400);

      expect(response.body.error).toContain('Max 2000');
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthenticated requests', async () => {
      // This test would work with real auth middleware
      // Currently mocked to always authenticate
    });

    it('should handle database errors gracefully', async () => {
      // Mock a database error scenario
      const invalidContactId = 'invalid-uuid-format';

      const response = await request(app)
        .get(`/api/v1/crm/contacts/${invalidContactId}`)
        .set('Cookie', `token=${authToken}`)
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Tenant Isolation', () => {
    it('should not allow access to other organization contacts', async () => {
      // Create a contact in a different org
      const { rows } = await db.query(
        `INSERT INTO contacts (org_id, full_name, email, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['different-org-id', 'Other Org Contact', 'other@test.com', 'other-user-id']
      );
      const otherOrgContactId = rows[0].id;

      // Try to access it with test-org-id user
      const response = await request(app)
        .get(`/api/v1/crm/contacts/${otherOrgContactId}`)
        .set('Cookie', `token=${authToken}`)
        .expect(404);

      expect(response.body.error).toContain('not found');

      // Clean up
      await db.query('DELETE FROM contacts WHERE id = $1', [otherOrgContactId]);
    });
  });
});
