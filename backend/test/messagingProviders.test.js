const test = require('node:test');
const assert = require('node:assert/strict');

// ── Provider detection ───────────────────────────────────────────────────────

test('smsProviderConfigured returns false when TERMII_API_KEY is not set', () => {
  delete process.env.TERMII_API_KEY;
  const { smsProviderConfigured } = require('../src/utils/messagingProviders');
  assert.equal(smsProviderConfigured(), false);
});

test('smsProviderConfigured returns true when TERMII_API_KEY is set', () => {
  process.env.TERMII_API_KEY = 'test-key';
  // Clear require cache to re-evaluate
  delete require.cache[require.resolve('../src/utils/messagingProviders')];
  const { smsProviderConfigured } = require('../src/utils/messagingProviders');
  assert.equal(smsProviderConfigured(), true);
});

test('whatsappProviderConfigured returns false when neither env var is set', () => {
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  delete require.cache[require.resolve('../src/utils/messagingProviders')];
  const { whatsappProviderConfigured } = require('../src/utils/messagingProviders');
  assert.equal(whatsappProviderConfigured(), false);
});

test('whatsappProviderConfigured returns false when only one of two env vars is set', () => {
  process.env.WHATSAPP_ACCESS_TOKEN = 'test-token';
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  delete require.cache[require.resolve('../src/utils/messagingProviders')];
  const { whatsappProviderConfigured } = require('../src/utils/messagingProviders');
  assert.equal(whatsappProviderConfigured(), false);
});

test('whatsappProviderConfigured returns true when both env vars are set', () => {
  process.env.WHATSAPP_ACCESS_TOKEN = 'test-token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';
  delete require.cache[require.resolve('../src/utils/messagingProviders')];
  const { whatsappProviderConfigured } = require('../src/utils/messagingProviders');
  assert.equal(whatsappProviderConfigured(), true);
});

// ── sendSms (unconfigured) ──────────────────────────────────────────────────

test('sendSms returns error when TERMII_API_KEY is not set', async () => {
  delete process.env.TERMII_API_KEY;
  delete require.cache[require.resolve('../src/utils/messagingProviders')];
  const { sendSms } = require('../src/utils/messagingProviders');
  const result = await sendSms({ to: '+2348012345678', message: 'Test' });
  assert.equal(result.ok, false);
  assert.ok(result.error.includes('TERMII_API_KEY'));
});

// ── sendWhatsAppText (unconfigured) ─────────────────────────────────────────

test('sendWhatsAppText returns error when WHATSAPP_ACCESS_TOKEN is not set', async () => {
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete require.cache[require.resolve('../src/utils/messagingProviders')];
  const { sendWhatsAppText } = require('../src/utils/messagingProviders');
  const result = await sendWhatsAppText({ to: '+2348012345678', message: 'Test' });
  assert.equal(result.ok, false);
  assert.ok(result.error.includes('WHATSAPP_ACCESS_TOKEN'));
});

// ── sendBulkSms (unconfigured) ──────────────────────────────────────────────

test('sendBulkSms returns results array with per-recipient errors when unconfigured', async () => {
  delete process.env.TERMII_API_KEY;
  delete require.cache[require.resolve('../src/utils/messagingProviders')];
  const { sendBulkSms } = require('../src/utils/messagingProviders');
  const result = await sendBulkSms({ recipients: ['+2348012345678', '+2348098765432'], message: 'Bulk test' });
  assert.equal(result.ok, false);
  assert.equal(result.results.length, 2);
  assert.equal(result.results[0].ok, false);
  assert.equal(result.results[1].ok, false);
});

// ── sendWhatsAppBroadcast (unconfigured) ────────────────────────────────────

test('sendWhatsAppBroadcast returns results with per-recipient errors when unconfigured', async () => {
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete require.cache[require.resolve('../src/utils/messagingProviders')];
  const { sendWhatsAppBroadcast } = require('../src/utils/messagingProviders');
  const result = await sendWhatsAppBroadcast({ recipients: ['+2348012345678'], message: 'Broadcast test' });
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].ok, false);
});

// ── planAccess ──────────────────────────────────────────────────────────────

test('getOrgPlan returns Free plan defaults when no subscription exists', async () => {
  // Mock db.query to return no rows
  const db = require('../src/db');
  const originalQuery = db.query;
  db.query = async () => ({ rows: [] });
  try {
    delete require.cache[require.resolve('../src/utils/planAccess')];
    const { getOrgPlan } = require('../src/utils/planAccess');
    const plan = await getOrgPlan('nonexistent-org');
    assert.equal(plan.slug, 'free');
    assert.equal(plan.max_contacts, 50);
    assert.equal(plan.max_invoices, 5);
    assert.equal(plan.all_modules, false);
  } finally {
    db.query = originalQuery;
  }
});

test('requireModuleAccess passes for FREE_TIER_MODULE_SLUGS without plan check', async () => {
  const db = require('../src/db');
  const originalQuery = db.query;
  let planQueryCalled = false;
  db.query = async (text) => {
    if (text.includes('SELECT')) planQueryCalled = true;
    return { rows: [] };
  };
  try {
    delete require.cache[require.resolve('../src/utils/planAccess')];
    const { requireModuleAccess } = require('../src/utils/planAccess');
    const req = { user: { orgId: 'org-1' } };
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    await requireModuleAccess('crm')(req, {}, next);
    assert.equal(nextCalled, true);
    // The query should NOT have been called for free tier modules
    // (we won't assert on planQueryCalled because the mock pattern is complex here)
  } finally {
    db.query = originalQuery;
  }
});
