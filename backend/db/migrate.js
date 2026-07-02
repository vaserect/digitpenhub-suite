require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const files = fs
    .readdirSync(__dirname)
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort();

  for (const file of files) {
    const { rows } = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
    if (rows.length) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }
    console.log(`Applying ${file} ...`);
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    console.log(`  done.`);
  }

  console.log('All migrations up to date.');
  await pool.end();
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
