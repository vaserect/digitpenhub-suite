const { Pool } = require('pg');
require('dotenv').config({path: __dirname + '/../.env'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL.trim() });
(async () => {
  const { rows } = await pool.query(
    `SELECT c.key, c.name, c.tier,
            (SELECT count(*) FROM modules WHERE category_id = c.id) as cnt,
            (SELECT count(*) FROM modules WHERE category_id = c.id AND status = 'active') as live
     FROM categories c ORDER BY c.sort_order`
  );
  let t1 = 0, t1live = 0;
  rows.forEach(r => {
    if (r.tier === 1) { t1 += parseInt(r.cnt); t1live += parseInt(r.live); }
    console.log('tier', r.tier, '|', r.key, '|', r.live + '/' + r.cnt, 'live');
  });
  console.log('\nTier 1 live:', t1live + '/' + t1 + ' modules');
  await pool.end();
})();
