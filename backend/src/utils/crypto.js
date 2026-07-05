const crypto = require('crypto');

// Password Manager entries must be recoverable (the user needs to view them
// again), so they're encrypted at rest with AES-256-GCM rather than hashed.
// The key is derived from PASSWORD_ENCRYPTION_KEY (falls back to JWT_SECRET
// so existing deployments don't need a new env var to keep working, though
// setting a dedicated key is strongly recommended).
const SECRET = process.env.PASSWORD_ENCRYPTION_KEY || process.env.JWT_SECRET;
if (!SECRET) throw new Error('PASSWORD_ENCRYPTION_KEY or JWT_SECRET must be set to encrypt stored passwords.');
const KEY = crypto.scryptSync(SECRET, 'digitpenhub-password-manager', 32);

function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

function decrypt(encoded) {
  const raw = Buffer.from(encoded, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
