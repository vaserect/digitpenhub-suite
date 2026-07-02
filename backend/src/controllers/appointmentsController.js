const db = require('../db');
const { sendMail } = require('../utils/mailer');
const { notify } = require('../utils/notify');

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function formatWhen(dateVal) {
  return new Date(dateVal).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
}

// Real reminder engine — called on an interval (see
// backend/src/utils/appointmentReminderScheduler.js). "24 hours before" is
// implemented as a window (any not-yet-reminded, not-cancelled appointment
// whose start time is now within the next 24h) rather than a precise
// minute-of-day trigger — honest about the mechanism: a poller ticking
// every 15 minutes will always catch it inside that window, but it isn't a
// guaranteed exact 24h-before send the way a per-appointment cron job would be.
async function sendDueReminders() {
  const { rows } = await db.query(
    `SELECT a.*, o.name AS org_name FROM appointments a
     JOIN organizations o ON o.id = a.org_id
     WHERE a.status IN ('pending','confirmed')
       AND a.reminder_sent_at IS NULL
       AND a.start_time > now()
       AND a.start_time <= now() + interval '24 hours'
       AND a.client_email IS NOT NULL`
  );
  for (const appt of rows) {
    try {
      const result = await sendMail({
        to: appt.client_email,
        subject: `Reminder: your appointment with ${appt.org_name} is coming up`,
        html: `<p>Hi ${appt.client_name},</p><p>This is a reminder that your appointment with <strong>${appt.org_name}</strong> is scheduled for <strong>${formatWhen(appt.start_time)}</strong>.</p>${appt.notes ? `<p>Notes: ${appt.notes}</p>` : ''}<p>See you then!</p>`,
      });
      await db.query(`UPDATE appointments SET reminder_sent_at = now() WHERE id = $1`, [appt.id]);
      if (!result.ok) console.error(`appointment reminder ${appt.id} send failed:`, result.error);
    } catch (err) {
      console.error(`appointment reminder ${appt.id} failed:`, err.message);
    }
  }
}

// ── Services ──────────────────────────────────────────────────────────────────

async function listServices(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM services WHERE org_id = $1 ORDER BY name`,
    [req.user.orgId]
  );
  res.json({ services: rows });
}

async function createService(req, res) {
  const { name, description, durationMinutes, priceNgn, color, status } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO services (org_id, name, description, duration_minutes, price_ngn, color, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.orgId, name.trim(), description || null, Number(durationMinutes) || 30, Number(priceNgn) || 0, color || '#2563eb', status || 'active']
  );
  res.status(201).json({ service: rows[0] });
}

async function updateService(req, res) {
  const { id } = req.params;
  const { name, description, durationMinutes, priceNgn, color, status } = req.body || {};
  const updates = []; const values = []; let idx = 1;
  if (name !== undefined)            { updates.push(`name = $${idx++}`);             values.push(name.trim()); }
  if (description !== undefined)     { updates.push(`description = $${idx++}`);      values.push(description || null); }
  if (durationMinutes !== undefined) { updates.push(`duration_minutes = $${idx++}`); values.push(Number(durationMinutes)); }
  if (priceNgn !== undefined)        { updates.push(`price_ngn = $${idx++}`);        values.push(Number(priceNgn)); }
  if (color !== undefined)           { updates.push(`color = $${idx++}`);            values.push(color); }
  if (status !== undefined)          { updates.push(`status = $${idx++}`);           values.push(status); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  values.push(id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE services SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'Service not found.' });
  res.json({ service: rows[0] });
}

async function deleteService(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(`DELETE FROM services WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Service not found.' });
  res.json({ ok: true });
}

// ── Availability ──────────────────────────────────────────────────────────────

async function getAvailability(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM availability_slots WHERE org_id = $1 ORDER BY day_of_week`,
    [req.user.orgId]
  );
  // Return all 7 days, filling blanks with defaults
  const byDay = Object.fromEntries(rows.map((r) => [r.day_of_week, r]));
  const schedule = DAYS.map((name, i) => ({
    day_of_week: i,
    day_name: name,
    start_time: byDay[i]?.start_time ?? '09:00',
    end_time: byDay[i]?.end_time ?? '17:00',
    is_active: byDay[i]?.is_active ?? false,
    id: byDay[i]?.id ?? null,
  }));
  res.json({ schedule });
}

async function saveAvailability(req, res) {
  const { schedule } = req.body || {};
  if (!Array.isArray(schedule)) return res.status(400).json({ error: 'schedule array is required.' });

  for (const slot of schedule) {
    const { dayOfWeek, startTime, endTime, isActive } = slot;
    await db.query(
      `INSERT INTO availability_slots (org_id, day_of_week, start_time, end_time, is_active)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (org_id, day_of_week) DO UPDATE
       SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_active = EXCLUDED.is_active`,
      [req.user.orgId, dayOfWeek, startTime || '09:00', endTime || '17:00', Boolean(isActive)]
    );
  }
  res.json({ ok: true });
}

// ── Appointments ──────────────────────────────────────────────────────────────

async function listAppointments(req, res) {
  const status = req.query.status || '';
  const { rows } = await db.query(
    `SELECT a.id, a.client_name, a.client_email, a.client_phone, a.start_time, a.end_time,
            a.status, a.notes, a.created_at,
            s.id AS service_id, s.name AS service_name, s.duration_minutes, s.color, s.price_ngn
     FROM appointments a
     LEFT JOIN services s ON s.id = a.service_id
     WHERE a.org_id = $1 AND ($2 = '' OR a.status = $2)
     ORDER BY a.start_time DESC`,
    [req.user.orgId, status]
  );
  res.json({ appointments: rows });
}

async function updateAppointmentStatus(req, res) {
  const { id } = req.params;
  const { status, notes } = req.body || {};
  const allowed = ['pending','confirmed','cancelled','completed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  const updates = [`status = $1`];
  const values = [status];
  if (notes !== undefined) { updates.push(`notes = $2`); values.push(notes); }
  values.push(id, req.user.orgId);

  const { rows } = await db.query(
    `UPDATE appointments SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND org_id = $${values.length} RETURNING *`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'Appointment not found.' });
  res.json({ appointment: rows[0] });
}

async function deleteAppointment(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(`DELETE FROM appointments WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Appointment not found.' });
  res.json({ ok: true });
}

async function getBookingStats(req, res) {
  const { rows } = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'pending')    AS pending,
       COUNT(*) FILTER (WHERE status = 'confirmed')  AS confirmed,
       COUNT(*) FILTER (WHERE status = 'completed')  AS completed,
       COUNT(*) FILTER (WHERE status = 'cancelled')  AS cancelled,
       COUNT(*) FILTER (WHERE start_time >= date_trunc('month', now())
                          AND start_time <  date_trunc('month', now()) + interval '1 month') AS this_month
     FROM appointments WHERE org_id = $1`,
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
}

// ── Public booking (no auth) ──────────────────────────────────────────────────

async function getPublicBookingInfo(req, res) {
  const { orgId } = req.params;

  const orgRes = await db.query(
    `SELECT id, name FROM organizations WHERE id = $1 AND is_suspended = false`,
    [orgId]
  );
  if (!orgRes.rows.length) return res.status(404).json({ error: 'Booking page not found.' });

  const [servicesRes, availRes] = await Promise.all([
    db.query(`SELECT id, name, description, duration_minutes, price_ngn, color FROM services WHERE org_id = $1 AND status = 'active' ORDER BY name`, [orgId]),
    db.query(`SELECT day_of_week, start_time, end_time FROM availability_slots WHERE org_id = $1 AND is_active = true ORDER BY day_of_week`, [orgId]),
  ]);

  res.json({
    org: orgRes.rows[0],
    services: servicesRes.rows,
    availability: availRes.rows,
  });
}

async function createPublicBooking(req, res) {
  const { orgId } = req.params;
  const { serviceId, clientName, clientEmail, clientPhone, startTime, notes } = req.body || {};

  if (!clientName?.trim() || !startTime || !serviceId) {
    return res.status(400).json({ error: 'serviceId, clientName, and startTime are required.' });
  }

  const orgRes = await db.query(`SELECT id FROM organizations WHERE id = $1 AND is_suspended = false`, [orgId]);
  if (!orgRes.rows.length) return res.status(404).json({ error: 'Booking page not found.' });

  const svcRes = await db.query(`SELECT * FROM services WHERE id = $1 AND org_id = $2 AND status = 'active'`, [serviceId, orgId]);
  if (!svcRes.rows.length) return res.status(404).json({ error: 'Service not found.' });

  const svc = svcRes.rows[0];
  const start = new Date(startTime);
  if (isNaN(start.getTime())) return res.status(400).json({ error: 'Invalid startTime.' });

  // Check availability for this day
  const dow = start.getUTCDay();
  const availRes = await db.query(
    `SELECT * FROM availability_slots WHERE org_id = $1 AND day_of_week = $2 AND is_active = true`,
    [orgId, dow]
  );
  if (!availRes.rows.length) return res.status(400).json({ error: 'No availability on this day.' });

  const end = new Date(start.getTime() + svc.duration_minutes * 60000);

  // Check for clash
  const clashRes = await db.query(
    `SELECT id FROM appointments
     WHERE org_id = $1 AND status NOT IN ('cancelled')
       AND tstzrange(start_time, end_time) && tstzrange($2, $3)`,
    [orgId, start.toISOString(), end.toISOString()]
  );
  if (clashRes.rows.length) return res.status(409).json({ error: 'That time slot is already booked.' });

  const { rows } = await db.query(
    `INSERT INTO appointments (org_id, service_id, client_name, client_email, client_phone, start_time, end_time, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [orgId, serviceId, clientName.trim(), clientEmail || null, clientPhone || null, start.toISOString(), end.toISOString(), notes || null]
  );
  const appt = rows[0];

  const orgNameRes = await db.query(`SELECT name FROM organizations WHERE id = $1`, [orgId]);
  const orgName = orgNameRes.rows[0]?.name || 'the business';

  if (appt.client_email) {
    const result = await sendMail({
      to: appt.client_email,
      subject: `Your appointment with ${orgName} is confirmed`,
      html: `<p>Hi ${appt.client_name},</p><p>Your booking for <strong>${svc.name}</strong> with <strong>${orgName}</strong> is set for <strong>${formatWhen(appt.start_time)}</strong>.</p>${appt.notes ? `<p>Notes: ${appt.notes}</p>` : ''}<p>We'll send a reminder before the appointment.</p>`,
    });
    if (result.ok) await db.query(`UPDATE appointments SET confirmation_sent_at = now() WHERE id = $1`, [appt.id]);
    else console.error(`booking confirmation ${appt.id} send failed:`, result.error);
  }
  await notify(orgId, {
    type: 'appointment_booked',
    title: 'New appointment booked',
    body: `${appt.client_name} booked ${svc.name} for ${formatWhen(appt.start_time)}.`,
    link: '/app?module=appointment-booking',
  });

  res.status(201).json({ appointment: appt });
}

module.exports = {
  listServices, createService, updateService, deleteService,
  getAvailability, saveAvailability,
  listAppointments, updateAppointmentStatus, deleteAppointment, getBookingStats,
  getPublicBookingInfo, createPublicBooking,
  sendDueReminders,
};
