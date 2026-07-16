const crypto = require('crypto');

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf) {
  let bits = 0, val = 0, out = '';
  for (const byte of buf) {
    val = (val << 8) | byte; bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}

function base32Decode(str) {
  str = str.toUpperCase().replace(/=+$/, '');
  let bits = 0, val = 0;
  const out = [];
  for (const ch of str) {
    const idx = B32.indexOf(ch);
    if (idx < 0) continue;
    val = (val << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

function hotp(secret, counter) {
  const key = base32Decode(secret);
  const ctr = Buffer.alloc(8);
  ctr.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(ctr).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24 | hmac[offset + 1] << 16 | hmac[offset + 2] << 8 | hmac[offset + 3]) % 1_000_000;
  return String(code).padStart(6, '0');
}

function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function otpauthUri(secret, email) {
  const label = encodeURIComponent(`DigitpenHub:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=DigitpenHub&algorithm=SHA1&digits=6&period=30`;
}

function verifyTotp(secret, code) {
  const counter = Math.floor(Date.now() / 1000 / 30);
  const str = String(code).trim();
  for (const offset of [-1, 0, 1]) {
    if (hotp(secret, counter + offset) === str) return true;
  }
  return false;
}

function generateBackupCodes() {
  return Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex').toUpperCase());
}

/** Hash a backup code with SHA-256 before storage, so a DB leak doesn't
 *  expose single-use full-access keys. */
function hashBackupCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

module.exports = { generateSecret, otpauthUri, verifyTotp, generateBackupCodes, hashBackupCode };
