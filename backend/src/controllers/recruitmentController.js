const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const bulkDeleteApplicants = bulkDeleteHandler('applicants');

// ── Stats ─────────────────────────────────────────────────────────────────────

async function getStats(req, res) {
  const [jobsRes, stagesRes, recentRes] = await Promise.all([
    db.query(
      `SELECT status, COUNT(*) AS count FROM job_postings WHERE org_id = $1 GROUP BY status`,
      [req.user.orgId]
    ),
    db.query(
      `SELECT stage, COUNT(*) AS count FROM applicants WHERE org_id = $1 GROUP BY stage`,
      [req.user.orgId]
    ),
    db.query(
      `SELECT COUNT(*) AS count FROM applicants WHERE org_id = $1 AND applied_at >= CURRENT_DATE - INTERVAL '7 days'`,
      [req.user.orgId]
    ),
  ]);

  const byJobStatus = Object.fromEntries(jobsRes.rows.map((r) => [r.status, Number(r.count)]));
  const byStage = Object.fromEntries(stagesRes.rows.map((r) => [r.stage, Number(r.count)]));

  res.json({
    openJobs: byJobStatus.open || 0,
    draftJobs: byJobStatus.draft || 0,
    closedJobs: byJobStatus.closed || 0,
    totalApplicants: stagesRes.rows.reduce((s, r) => s + Number(r.count), 0),
    hired: byStage.hired || 0,
    newThisWeek: Number(recentRes.rows[0].count),
    byStage,
  });
}

// ── Job Postings ──────────────────────────────────────────────────────────────

async function listJobs(req, res) {
  const { status } = req.query;
  const { rows } = await db.query(
    `SELECT jp.*,
            COUNT(a.id)::int AS applicant_count
     FROM job_postings jp
     LEFT JOIN applicants a ON a.job_id = jp.id
     WHERE jp.org_id = $1
       AND ($2 = '' OR jp.status = $2)
     GROUP BY jp.id
     ORDER BY jp.created_at DESC`,
    [req.user.orgId, status || '']
  );
  res.json({ jobs: rows });
}

async function createJob(req, res) {
  const { title, department, location, jobType, description, requirements, status } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title is required.' });
  const { rows } = await db.query(
    `INSERT INTO job_postings (org_id, title, department, location, job_type, description, requirements, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.orgId, title.trim(), department || null, location || null, jobType || 'full-time', description || null, requirements || null, status || 'open']
  );
  res.status(201).json({ job: rows[0] });
}

async function updateJob(req, res) {
  const { id } = req.params;
  const { title, department, location, jobType, description, requirements, status } = req.body || {};
  const updates = []; const values = []; let idx = 1;
  if (title !== undefined)        { updates.push(`title = $${idx++}`);        values.push(title.trim()); }
  if (department !== undefined)   { updates.push(`department = $${idx++}`);   values.push(department || null); }
  if (location !== undefined)     { updates.push(`location = $${idx++}`);     values.push(location || null); }
  if (jobType !== undefined)      { updates.push(`job_type = $${idx++}`);     values.push(jobType); }
  if (description !== undefined)  { updates.push(`description = $${idx++}`);  values.push(description || null); }
  if (requirements !== undefined) { updates.push(`requirements = $${idx++}`); values.push(requirements || null); }
  if (status !== undefined)       { updates.push(`status = $${idx++}`);       values.push(status); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  values.push(id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE job_postings SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'Job not found.' });
  res.json({ job: rows[0] });
}

async function deleteJob(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(`DELETE FROM job_postings WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Job not found.' });
  res.json({ ok: true });
}

// ── Applicants ────────────────────────────────────────────────────────────────

async function listApplicants(req, res) {
  const { jobId, stage } = req.query;
  const { rows } = await db.query(
    `SELECT a.*, jp.title AS job_title
     FROM applicants a
     LEFT JOIN job_postings jp ON jp.id = a.job_id
     WHERE a.org_id = $1
       AND ($2 = '' OR a.job_id::text = $2)
       AND ($3 = '' OR a.stage = $3)
     ORDER BY a.applied_at DESC, a.created_at DESC`,
    [req.user.orgId, jobId || '', stage || '']
  );
  res.json({ applicants: rows });
}

async function exportApplicants(req, res) {
  const { rows } = await db.query(
    `SELECT a.*, jp.title AS job_title
     FROM applicants a
     LEFT JOIN job_postings jp ON jp.id = a.job_id
     WHERE a.org_id = $1
     ORDER BY a.applied_at DESC, a.created_at DESC`,
    [req.user.orgId]
  );
  sendCsv(res, 'applicants.csv', rows, autoColumns(rows));
}

async function createApplicant(req, res) {
  const { fullName, email, phone, jobId, stage, source, resumeUrl, notes, appliedAt } = req.body || {};
  if (!fullName?.trim()) return res.status(400).json({ error: 'fullName is required.' });
  const { rows } = await db.query(
    `INSERT INTO applicants (org_id, full_name, email, phone, job_id, stage, source, resume_url, notes, applied_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.orgId, fullName.trim(), email || null, phone || null, jobId || null, stage || 'new', source || null, resumeUrl || null, notes || null, appliedAt || new Date().toISOString().slice(0, 10)]
  );
  res.status(201).json({ applicant: rows[0] });
}

async function updateApplicant(req, res) {
  const { id } = req.params;
  const { fullName, email, phone, jobId, stage, source, resumeUrl, notes, appliedAt } = req.body || {};
  const updates = []; const values = []; let idx = 1;
  if (fullName !== undefined)   { updates.push(`full_name = $${idx++}`);   values.push(fullName.trim()); }
  if (email !== undefined)      { updates.push(`email = $${idx++}`);       values.push(email || null); }
  if (phone !== undefined)      { updates.push(`phone = $${idx++}`);       values.push(phone || null); }
  if (jobId !== undefined)      { updates.push(`job_id = $${idx++}`);      values.push(jobId || null); }
  if (stage !== undefined)      { updates.push(`stage = $${idx++}`);       values.push(stage); }
  if (source !== undefined)     { updates.push(`source = $${idx++}`);      values.push(source || null); }
  if (resumeUrl !== undefined)  { updates.push(`resume_url = $${idx++}`);  values.push(resumeUrl || null); }
  if (notes !== undefined)      { updates.push(`notes = $${idx++}`);       values.push(notes || null); }
  if (appliedAt !== undefined)  { updates.push(`applied_at = $${idx++}`);  values.push(appliedAt); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  values.push(id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE applicants SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'Applicant not found.' });
  res.json({ applicant: rows[0] });
}

async function deleteApplicant(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(`DELETE FROM applicants WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Applicant not found.' });
  res.json({ ok: true });
}

module.exports = {
  getStats,
  listJobs, createJob, updateJob, deleteJob,
  listApplicants, exportApplicants, createApplicant, updateApplicant, deleteApplicant, bulkDeleteApplicants,
};
