require('dotenv').config();
const app = require('./app');
const { startAutomationScheduler } = require('./utils/automationScheduler');
const { startAppointmentReminderScheduler } = require('./utils/appointmentReminderScheduler');

const port = process.env.PORT || 4001;
app.listen(port, '127.0.0.1', () => {
  console.log(`digitpenhub-suite-api listening on 127.0.0.1:${port}`);
  startAutomationScheduler();
  startAppointmentReminderScheduler();
});
