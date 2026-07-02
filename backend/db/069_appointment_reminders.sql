-- Milestone 69: Appointment Booking confirmation + reminder emails
--
-- Found while checking Pass 13's flagged suspicion ("Appointment Booking's
-- reminder-sending is worth the same scrutiny" as Marketing Automation had):
-- this module had zero confirmation email on booking and zero reminder
-- mechanism at all — not even a simulated one, not even a UI claim of one.
-- Worse gap than Marketing Automation's pre-fix state, since there wasn't
-- even a config field pretending to be real.

ALTER TABLE appointments ADD COLUMN confirmation_sent_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN reminder_sent_at TIMESTAMPTZ;
