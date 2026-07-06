const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');

async function getStats(req, res) {
  const [projRes, todayRes, weekRes, runRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS c FROM time_projects WHERE org_id=$1 AND status='active'`, [req.user.orgId]),
    db.query(`SELECT COALESCE(SUM(duration_s),0)::int AS s FROM time_entries WHERE org_id=$1 AND started_at>=CURRENT_DATE AND stopped_at IS NOT NULL`, [req.user.orgId]),
    db.query(`SELECT COALESCE(SUM(duration_s),0)::int AS s FROM time_entries WHERE org_id=$1 AND started_at>=DATE_TRUNC('week',NOW()) AND stopped_at IS NOT NULL`, [req.user.orgId]),
    db.query(`SELECT id FROM time_entries WHERE org_id=$1 AND is_running=TRUE LIMIT 1`, [req.user.orgId]),
  ]);
  res.json({ activeProjects: projRes.rows[0].c, todaySeconds: todayRes.rows[0].s, weekSeconds: weekRes.rows[0].s, hasRunning: runRes.rows.length > 0 });
}

async function listProjects(req, res) {
  const { rows } = await db.query(
    `SELECT p.*, COUNT(e.id)::int AS entry_count, COALESCE(SUM(e.duration_s),0)::int AS total_seconds
     FROM time_projects p LEFT JOIN time_entries e ON e.project_id=p.id AND e.stopped_at IS NOT NULL
     WHERE p.org_id=$1 GROUP BY p.id ORDER BY p.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ projects: rows });
}

async function createProject(req, res) {
  const { name, description, client, hourlyRate, color, status } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(
    `INSERT INTO time_projects (org_id,name,description,client,hourly_rate,color,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.orgId, name.trim(), description||null, client||null, Number(hourlyRate)||0, color||'#2563eb', status||'active']
  );
  res.status(201).json({ project: rows[0] });
}

async function updateProject(req, res) {
  const { id } = req.params;
  const { name, description, client, hourlyRate, color, status } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (name        !==undefined){updates.push(`name=$${i++}`);        vals.push(name.trim());}
  if (description !==undefined){updates.push(`description=$${i++}`); vals.push(description||null);}
  if (client      !==undefined){updates.push(`client=$${i++}`);      vals.push(client||null);}
  if (hourlyRate  !==undefined){updates.push(`hourly_rate=$${i++}`); vals.push(Number(hourlyRate));}
  if (color       !==undefined){updates.push(`color=$${i++}`);       vals.push(color||'#2563eb');}
  if (status      !==undefined){updates.push(`status=$${i++}`);      vals.push(status);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE time_projects SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ project: rows[0] });
}

async function deleteProject(req, res) {
  await db.query(`DELETE FROM time_projects WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function listEntries(req, res) {
  const { projectId, date } = req.query;
  const conditions=['e.org_id=$1']; const vals=[req.user.orgId]; let i=2;
  if (projectId) {conditions.push(`e.project_id=$${i++}`); vals.push(projectId);}
  if (date)      {conditions.push(`e.started_at::date=$${i++}`); vals.push(date);}
  const { rows } = await db.query(
    `SELECT e.*, p.name AS project_name, p.color AS project_color FROM time_entries e
     LEFT JOIN time_projects p ON p.id=e.project_id
     WHERE ${conditions.join(' AND ')} ORDER BY e.started_at DESC LIMIT 100`,
    vals
  );
  res.json({ entries: rows });
}

async function startTimer(req, res) {
  const { projectId, description, billable } = req.body || {};
  await db.query(`UPDATE time_entries SET is_running=FALSE, stopped_at=NOW() WHERE org_id=$1 AND is_running=TRUE`, [req.user.orgId]);
  const { rows } = await db.query(
    `INSERT INTO time_entries (org_id,project_id,description,started_at,is_running,billable) VALUES ($1,$2,$3,NOW(),TRUE,$4) RETURNING *`,
    [req.user.orgId, projectId||null, description||null, billable!==false]
  );
  res.status(201).json({ entry: rows[0] });
}

async function stopTimer(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `UPDATE time_entries SET is_running=FALSE, stopped_at=NOW() WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ entry: rows[0] });
}

async function createEntry(req, res) {
  const { projectId, description, startedAt, stoppedAt, billable } = req.body || {};
  if (!startedAt) return res.status(400).json({ error: 'startedAt required' });
  if (!stoppedAt) return res.status(400).json({ error: 'stoppedAt required' });
  const { rows } = await db.query(
    `INSERT INTO time_entries (org_id,project_id,description,started_at,stopped_at,is_running,billable) VALUES ($1,$2,$3,$4,$5,FALSE,$6) RETURNING *`,
    [req.user.orgId, projectId||null, description||null, startedAt, stoppedAt, billable!==false]
  );
  res.status(201).json({ entry: rows[0] });
}

async function deleteEntry(req, res) {
  await db.query(`DELETE FROM time_entries WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function exportEntries(req, res) {
  const { rows } = await db.query(
    `SELECT e.*, p.name AS project_name FROM time_entries e
     LEFT JOIN time_projects p ON p.id=e.project_id
     WHERE e.org_id=$1 ORDER BY e.started_at DESC`,
    [req.user.orgId]
  );
  sendCsv(res, 'time-entries.csv', rows, autoColumns(rows));
}

module.exports = { getStats, listProjects, createProject, updateProject, deleteProject, listEntries, exportEntries, startTimer, stopTimer, createEntry, deleteEntry };
