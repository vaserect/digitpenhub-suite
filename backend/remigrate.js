require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log('Clearing schema_migrations for 177_ambassador_program.sql...');
  await pool.query("DELETE FROM schema_migrations WHERE filename = '177_ambassador_program.sql'");
  console.log('Done!');
  await pool.end();
})().catch(console.error);
