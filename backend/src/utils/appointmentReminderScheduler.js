const { sendDueReminders } = require('../controllers/appointmentsController');

const TICK_MS = 15 * 60 * 1000; // 15 minutes — frequent enough that the 24h
// reminder window (see sendDueReminders) never misses an appointment.

function startAppointmentReminderScheduler() {
  setInterval(() => {
    sendDueReminders().catch((err) => console.error('appointment reminder tick failed:', err.message));
  }, TICK_MS);
  setTimeout(() => {
    sendDueReminders().catch((err) => console.error('appointment reminder initial tick failed:', err.message));
  }, 20000);
}

module.exports = { startAppointmentReminderScheduler };
