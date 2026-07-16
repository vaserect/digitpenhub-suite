require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const { startAutomationScheduler } = require('./utils/automationScheduler');
const { startAppointmentReminderScheduler } = require('./utils/appointmentReminderScheduler');
const { startAbandonedCartRecoveryScheduler } = require('./utils/abandonedCartRecoveryScheduler');
const { startBillingScheduler } = require('./utils/billingScheduler');
const { start: startSocialMediaScheduler } = require('./utils/socialMediaScheduler');

// Safety net: on Node 15+ an unhandled promise rejection (e.g. a rejected
// async route handler that lacks a try/catch) terminates the process by
// default, which was causing the API to crash-loop under PM2 on bad input.
// Log it and stay alive — a single malformed request must not take down the
// whole suite for every tenant.
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
    category: 'unhandled_rejection',
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', {
    message: err.message,
    stack: err.stack,
    category: 'uncaught_exception',
  });
  // Give logger time to flush before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

const port = process.env.PORT || 4001;
app.listen(port, '127.0.0.1', () => {
  logger.info(`digitpenhub-suite-api listening on 127.0.0.1:${port}`, {
    port,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
  });
  
  // Start schedulers with logging
  try {
    startAutomationScheduler();
    logger.info('Automation scheduler started');
  } catch (err) {
    logger.error('Failed to start automation scheduler', { error: err.message });
  }
  
  try {
    startAppointmentReminderScheduler();
    logger.info('Appointment reminder scheduler started');
  } catch (err) {
    logger.error('Failed to start appointment reminder scheduler', { error: err.message });
  }
  
  try {
    startAbandonedCartRecoveryScheduler();
    logger.info('Abandoned cart recovery scheduler started');
  } catch (err) {
    logger.error('Failed to start abandoned cart recovery scheduler', { error: err.message });
  }
  
  try {
    startBillingScheduler();
    startSocialMediaScheduler();
    logger.info('Billing scheduler started');
  } catch (err) {
    logger.error('Failed to start billing scheduler', { error: err.message });
  }
});
