const db = require('../db');

async function listEvents(req, res) {
  const { start, end } = req.query;
  const conditions = ['org_id=$1']; const vals = [req.user.orgId]; let i = 2;
  if (start) { conditions.push(`end_at>=$${i++}`);   vals.push(start); }
  if (end)   { conditions.push(`start_at<=$${i++}`); vals.push(end); }
  const { rows } = await db.query(`SELECT * FROM calendar_events WHERE ${conditions.join(' AND ')} ORDER BY start_at`, vals);
  res.json({ events: rows });
}

async function createEvent(req, res) {
  const { title, description, startAt, endAt, allDay, color, location, url } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  if (!startAt)       return res.status(400).json({ error: 'startAt required' });
  if (!endAt)         return res.status(400).json({ error: 'endAt required' });
  const { rows } = await db.query(
    `INSERT INTO calendar_events (org_id,title,description,start_at,end_at,all_day,color,location,url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.orgId, title.trim(), description||null, startAt, endAt, !!allDay, color||'#2563eb', location||null, url||null]
  );
  res.status(201).json({ event: rows[0] });
}

async function updateEvent(req, res) {
  const { id } = req.params;
  const { title, description, startAt, endAt, allDay, color, location, url } = req.body || {};
  const updates = []; const vals = []; let i = 1;
  if (title       !== undefined) { updates.push(`title=$${i++}`);       vals.push(title.trim()); }
  if (description !== undefined) { updates.push(`description=$${i++}`); vals.push(description||null); }
  if (startAt     !== undefined) { updates.push(`start_at=$${i++}`);    vals.push(startAt); }
  if (endAt       !== undefined) { updates.push(`end_at=$${i++}`);      vals.push(endAt); }
  if (allDay      !== undefined) { updates.push(`all_day=$${i++}`);     vals.push(!!allDay); }
  if (color       !== undefined) { updates.push(`color=$${i++}`);       vals.push(color||'#2563eb'); }
  if (location    !== undefined) { updates.push(`location=$${i++}`);    vals.push(location||null); }
  if (url         !== undefined) { updates.push(`url=$${i++}`);         vals.push(url||null); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE calendar_events SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ event: rows[0] });
}

async function deleteEvent(req, res) {
  await db.query(`DELETE FROM calendar_events WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { listEvents, createEvent, updateEvent, deleteEvent };
