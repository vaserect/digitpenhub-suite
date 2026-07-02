const jwt = require('jsonwebtoken');

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;
const MFA_PENDING_SECONDS = 5 * 60;

function signSessionToken({ userId, sessionId }) {
  return jwt.sign({ sub: userId, jti: sessionId }, process.env.JWT_SECRET, {
    expiresIn: SEVEN_DAYS_SECONDS,
  });
}

function verifySessionToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function signMfaToken(userId) {
  return jwt.sign({ sub: userId, mfa_pending: true }, process.env.JWT_SECRET, {
    expiresIn: MFA_PENDING_SECONDS,
  });
}

function verifyMfaToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (!payload.mfa_pending) throw new Error('Not an MFA token.');
  return payload;
}

module.exports = { signSessionToken, verifySessionToken, signMfaToken, verifyMfaToken, SEVEN_DAYS_SECONDS };
