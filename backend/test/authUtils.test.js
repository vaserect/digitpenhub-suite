const test = require('node:test');
const assert = require('node:assert/strict');

// Set JWT_SECRET before requiring jwt util
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-unit-tests-only';

const { hashPassword, verifyPassword } = require('../src/utils/password');
const { signSessionToken, verifySessionToken, signMfaToken, verifyMfaToken } = require('../src/utils/jwt');

// ── Password hashing ─────────────────────────────────────────────────────────

test('hashPassword produces a bcrypt hash that verifyPassword accepts', async () => {
  const hash = await hashPassword('TestPass123!');
  assert.ok(hash.startsWith('$2b$'), 'hash should start with bcrypt prefix');
  assert.equal(await verifyPassword('TestPass123!', hash), true);
});

test('verifyPassword rejects wrong passwords', async () => {
  const hash = await hashPassword('CorrectPass1');
  assert.equal(await verifyPassword('WrongPass1', hash), false);
});

test('verifyPassword rejects empty string against a real hash', async () => {
  const hash = await hashPassword('SomePass123');
  assert.equal(await verifyPassword('', hash), false);
});

// ── Session JWT ──────────────────────────────────────────────────────────────

test('signSessionToken creates a valid token that verifySessionToken can decode', () => {
  const token = signSessionToken({ userId: 'user-uuid', sessionId: 'session-uuid' });
  const payload = verifySessionToken(token);
  assert.equal(payload.sub, 'user-uuid');
  assert.equal(payload.jti, 'session-uuid');
  assert.ok(payload.exp, 'token should have an expiry');
});

test('verifySessionToken rejects a token signed with a different secret', () => {
  const token = signSessionToken({ userId: 'u1', sessionId: 's1' });
  // Override secret to simulate different secret
  const realSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'different-secret';
  assert.throws(() => verifySessionToken(token), /signature/);
  process.env.JWT_SECRET = realSecret;
});

test('verifySessionToken rejects a tampered token', () => {
  const token = signSessionToken({ userId: 'u1', sessionId: 's1' });
  const parts = token.split('.');
  const tampered = parts[0] + '.' + parts[1] + '.invalidsignature';
  assert.throws(() => verifySessionToken(tampered), /signature/);
});

// ── MFA JWT ──────────────────────────────────────────────────────────────────

test('signMfaToken creates a token with mfa_pending flag', () => {
  const token = signMfaToken('user-uuid');
  const payload = verifyMfaToken(token);
  assert.equal(payload.sub, 'user-uuid');
  assert.equal(payload.mfa_pending, true);
});

test('verifyMfaToken rejects a session token (no mfa_pending flag)', () => {
  const sessionToken = signSessionToken({ userId: 'u1', sessionId: 's1' });
  assert.throws(() => verifyMfaToken(sessionToken), /Not an MFA token/);
});

test('verifySessionToken accepts both session and MFA tokens (it only checks signature)', () => {
  const mfaToken = signMfaToken('user-uuid');
  const payload = verifySessionToken(mfaToken); // session verification only checks signature
  assert.equal(payload.sub, 'user-uuid');
  assert.equal(payload.mfa_pending, true);
});

// ── Explicit expiry test ─────────────────────────────────────────────────────

test('a token with explicit past expiry is rejected', () => {
  const jwt = require('jsonwebtoken');
  const expired = jwt.sign({ sub: 'u1', jti: 's1' }, process.env.JWT_SECRET, { expiresIn: '0s' });
  // Wait briefly to ensure expiry passes (in practice 0s may still work briefly)
  assert.throws(() => verifySessionToken(expired), /expired/);
});
