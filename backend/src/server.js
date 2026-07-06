require('dotenv').config();
const app = require('./app');
const { startAutomationScheduler } = require('./utils/automationScheduler');
const { startAppointmentReminderScheduler } = require('./utils/appointmentReminderScheduler');
const { startAbandonedCartRecoveryScheduler } = require('./utils/abandonedCartRecoveryScheduler');

// Safety net: on Node 15+ an unhandled promise rejection (e.g. a rejected
// async route handler that lacks a try/catch) terminates the process by
// default, which was causing the API to crash-loop under PM2 on bad input.
// Log it and stay alive — a single malformed request must not take down the
// whole suite for every tenant.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const port = process.env.PORT || 4001;
app.listen(port, '127.0.0.1', () => {
  console.log(`digitpenhub-suite-api listening on 127.0.0.1:${port}`);
  startAutomationScheduler();
  startAppointmentReminderScheduler();
  startAbandonedCartRecoveryScheduler();
});
