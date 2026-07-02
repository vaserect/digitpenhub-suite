const { advanceEnrollments } = require('../controllers/automationController');

const TICK_MS = 5 * 60 * 1000; // 5 minutes — frequent enough that a wait_days
// step's real-world delay is what actually paces things, not the poll interval.

// A plain setInterval inside the long-running PM2-managed API process — no
// separate worker process or cron dependency needed for a poll this
// lightweight. State lives entirely in the database (current_step,
// current_step_started_at), so a PM2 restart just resumes on the next tick
// with no lost progress, unlike an in-memory queue would.
function startAutomationScheduler() {
  setInterval(() => {
    advanceEnrollments().catch((err) => console.error('automation scheduler tick failed:', err.message));
  }, TICK_MS);
  // Also run once shortly after boot, so enrollments don't sit idle for a
  // full TICK_MS after every deploy/restart.
  setTimeout(() => {
    advanceEnrollments().catch((err) => console.error('automation scheduler initial tick failed:', err.message));
  }, 15000);
}

module.exports = { startAutomationScheduler };
