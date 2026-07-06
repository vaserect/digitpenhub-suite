const { sendDueCartRecoveries } = require('../routes/storeBuilder');

const TICK_MS = 15 * 60 * 1000; // 15 minutes — matches appointmentReminderScheduler's cadence;
// frequent enough that the 1-hour abandonment window (see sendDueCartRecoveries) never misses a cart.

function startAbandonedCartRecoveryScheduler() {
  setInterval(() => {
    sendDueCartRecoveries().catch((err) => console.error('abandoned-cart recovery tick failed:', err.message));
  }, TICK_MS);
  setTimeout(() => {
    sendDueCartRecoveries().catch((err) => console.error('abandoned-cart recovery initial tick failed:', err.message));
  }, 25000);
}

module.exports = { startAbandonedCartRecoveryScheduler };
