const test = require('node:test');
const assert = require('node:assert/strict');

// Mock db pool with a controllable fake before requiring the controller
const mockDb = { queryLog: [] };
mockDb.connect = async () => ({
  query: async (text, params) => {
    mockDb.queryLog.push({ text, params });
    if (text.includes('INSERT INTO contacts')) {
      return { rows: [{ id: 'contact-1', full_name: 'John Doe', company: 'Acme', email: 'john@acme.com', phone: '+2348012345678', stage: 'new', value_ngn: '10000', last_touch_at: new Date().toISOString(), tags: [] }] };
    }
    if (text.includes('INSERT INTO audit_log')) {
      return { rows: [] };
    }
    return { rows: [] };
  },
  query: async (text, params) => {
    mockDb.queryLog.push({ text, params });
    if (text.includes('INSERT INTO contacts')) {
      return { rows: [{ id: 'contact-1', full_name: 'John Doe', company: 'Acme', email: 'john@acme.com', phone: '+2348012345678', stage: 'new', value_ngn: '10000', last_touch_at: new Date().toISOString(), tags: [] }] };
    }
    if (text.includes('INSERT INTO audit_log')) {
      return { rows: [] };
    }
    return { rows: [] };
  },
  release: () => {},
});

const authControllerPath = '../src/controllers/authController';

test('crm.createContact rejects empty fullName', async () => {
  delete require.cache[authControllerPath];
  delete require.cache[require.resolve('../src/controllers/crmController')];
  const { createContact } = require('../src/controllers/crmController');
  const req = { body: {}, user: { orgId: 'org-1', id: 'user-1' } };
  const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(p) { this.body = p; return this; } };
  await createContact(req, res);
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.error.includes('fullName'));
});

test('crm.createContact rejects invalid stage', async () => {
  delete require.cache[require.resolve('../src/controllers/crmController')];
  const { createContact } = require('../src/controllers/crmController');
  const req = { body: { fullName: 'Jane', stage: 'invalid_stage' }, user: { orgId: 'org-1', id: 'user-1' } };
  const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(p) { this.body = p; return this; } };
  await createContact(req, res);
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.error.includes('stage'));
});
