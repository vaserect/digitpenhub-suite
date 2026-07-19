const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep the TCP socket alive so idle pooled connections aren't silently
  // dropped by the OS/Postgres, which surfaced as recurring
  // "Connection terminated unexpectedly" errors in the schedulers.
  keepAlive: true,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
    max: 50,
});

pool.on('error', (err) => {
  // A dropped idle connection shouldn't crash the whole API process.
  console.error('Unexpected error on idle Postgres client', err);
});

module.exports = pool;
