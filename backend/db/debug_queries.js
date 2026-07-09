require('dotenv').config({path: __dirname + '/../.env'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL.trim() });
const orgId = '3bf74030-2a13-41d1-a6f6-3be088b57aa4';

(async () => {
  const queries = [
    ['email_lists', `SELECT count(*) AS c FROM email_lists WHERE org_id = $1`],
    ['integration_connections', `SELECT count(*) AS c FROM integration_connections WHERE org_id = $1 AND is_connected = true`],
    ['org_branding', `SELECT custom_domain FROM org_branding WHERE org_id = $1`],
    ['users', `SELECT count(*) AS c FROM users WHERE org_id = $1`],
  ];
  for (const [label, sql] of queries) {
    try {
      const r = await pool.query(sql, [orgId]);
      console.log(label, ':', JSON.stringify(r.rows));
    } catch (e) {
      console.log(label, 'ERROR:', e.message);
    }
  }
  await pool.end();
})();
