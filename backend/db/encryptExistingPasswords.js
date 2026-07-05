// One-off backfill: run once, after 070_password_manager_encrypt.sql, to
// encrypt any password_entries rows still holding plaintext from before the
// password manager encrypted at rest. Safe to re-run — it skips rows whose
// password already decrypts successfully (i.e. is already ciphertext).
require('dotenv').config();
const pool = require('../src/db');
const { encrypt, decrypt } = require('../src/utils/crypto');

function computeStrength(password) {
  const len = password.length;
  if (len < 6) return 'weak';
  if (len < 10) return 'fair';
  if (len < 16) return 'good';
  return 'strong';
}

async function run() {
  const { rows } = await pool.query('SELECT id, password FROM password_entries');
  let migrated = 0;
  for (const row of rows) {
    try {
      decrypt(row.password);
      continue; // already ciphertext
    } catch {
      // not valid ciphertext -> treat as legacy plaintext
    }
    await pool.query('UPDATE password_entries SET password=$1, strength=$2 WHERE id=$3', [
      encrypt(row.password),
      computeStrength(row.password),
      row.id,
    ]);
    migrated++;
  }
  console.log(`Encrypted ${migrated} of ${rows.length} password_entries rows.`);
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
