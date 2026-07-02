const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => {
  // A dropped idle connection shouldn't crash the whole API process.
  console.error('Unexpected error on idle Postgres client', err);
});

module.exports = pool;
