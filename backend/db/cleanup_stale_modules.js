require('dotenv').config({path: __dirname + '/../.env'});
const { Pool } = require('pg');
const { CATEGORIES } = require('./categories.data');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL.trim() });

  // Build set of current slugs from the data file
  const currentSlugs = new Set();
  for (const cat of CATEGORIES) {
    for (const name of cat.modules) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      currentSlugs.add(slug);
    }
  }

  // Find modules NOT in current data
  const { rows: allMods } = await pool.query('SELECT id, slug, name FROM modules');
  const toDelete = allMods.filter(m => !currentSlugs.has(m.slug));
  console.log('Modules to delete:', toDelete.length);
  for (const m of toDelete) {
    await pool.query('DELETE FROM modules WHERE id = $1', [m.id]);
    console.log('  Deleted:', m.slug, '-', m.name);
  }

  const { rows: remaining } = await pool.query('SELECT count(*) as cnt FROM modules');
  console.log('Remaining modules:', remaining[0].cnt);

  // Verify tier counts
  const { rows: cats } = await pool.query(
    `SELECT c.key, c.name, c.tier, (SELECT count(*) FROM modules WHERE category_id = c.id) as cnt
     FROM categories c ORDER BY c.sort_order`
  );
  let t1 = 0, t2 = 0, t3 = 0;
  for (const r of cats) {
    console.log(`  tier ${r.tier} | ${r.key} - ${r.name} (${r.cnt})`);
    if (r.tier === 1) t1 += parseInt(r.cnt);
    else if (r.tier === 2) t2 += parseInt(r.cnt);
    else if (r.tier === 3) t3 += parseInt(r.cnt);
  }
  console.log(`\nTier 1: ${t1}, Tier 2 (settings): ${t2}, Tier 3 (admin): ${t3}`);
  console.log(`Total (1+3): ${t1 + t3} (should be 288)`);

  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });
