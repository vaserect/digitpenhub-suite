const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const r = Router();
r.use(requireAuth);

// ── Courses ───────────────────────────────────────────────────────────────────
r.get('/courses', async (req, res) => {
  const { rows } = await db.query(
    `SELECT c.*, (SELECT COUNT(*) FROM lms_lessons l WHERE l.course_id=c.id) AS lesson_count,
            (SELECT COUNT(*) FROM lms_enrollments e WHERE e.course_id=c.id) AS enrollment_count
     FROM lms_courses c WHERE c.org_id=$1 ORDER BY c.created_at DESC`, [req.user.orgId]);
  res.json({ courses: rows });
});

r.post('/courses', async (req, res) => {
  const { title, description, category, level, instructor, duration, status } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title is required.' });
  const { rows } = await db.query(
    `INSERT INTO lms_courses (org_id,title,description,category,level,instructor,duration,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.orgId, title.trim(), description||'', category||'General', level||'Beginner', instructor||'', duration||'', status||'draft']);
  res.status(201).json({ course: rows[0] });
});

r.put('/courses/:id', async (req, res) => {
  const { title, description, category, level, instructor, duration, status } = req.body || {};
  const { rows } = await db.query(
    `UPDATE lms_courses SET title=$1,description=$2,category=$3,level=$4,instructor=$5,duration=$6,status=$7
     WHERE id=$8 AND org_id=$9 RETURNING *`,
    [title, description, category, level, instructor, duration, status, req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ course: rows[0] });
});

r.delete('/courses/:id', async (req, res) => {
  await db.query(`DELETE FROM lms_courses WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

// ── Lessons ───────────────────────────────────────────────────────────────────
r.get('/courses/:id/lessons', async (req, res) => {
  const { rows } = await db.query(
    `SELECT l.* FROM lms_lessons l
     JOIN lms_courses c ON c.id=l.course_id WHERE l.course_id=$1 AND c.org_id=$2 ORDER BY l.order_num`,
    [req.params.id, req.user.orgId]);
  res.json({ lessons: rows });
});

r.post('/courses/:id/lessons', async (req, res) => {
  const { title, content, contentType, durationMins } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title is required.' });
  const { rows: cnt } = await db.query(`SELECT COUNT(*) FROM lms_lessons WHERE course_id=$1`, [req.params.id]);
  const { rows } = await db.query(
    `INSERT INTO lms_lessons (course_id,title,content,content_type,duration_mins,order_num)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.params.id, title.trim(), content||'', contentType||'text', durationMins||0, parseInt(cnt[0].count)]);
  res.status(201).json({ lesson: rows[0] });
});

r.put('/lessons/:id', async (req, res) => {
  const { title, content, contentType, durationMins } = req.body || {};
  const { rows } = await db.query(
    `UPDATE lms_lessons SET title=$1,content=$2,content_type=$3,duration_mins=$4 WHERE id=$5 RETURNING *`,
    [title, content, contentType, durationMins, req.params.id]);
  res.json({ lesson: rows[0] });
});

r.delete('/lessons/:id', async (req, res) => {
  await db.query(`DELETE FROM lms_lessons WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
});

// ── Enrollments ───────────────────────────────────────────────────────────────
r.get('/courses/:id/enrollments', async (req, res) => {
  const { rows } = await db.query(
    `SELECT e.* FROM lms_enrollments e WHERE e.course_id=$1 ORDER BY e.enrolled_at DESC`, [req.params.id]);
  res.json({ enrollments: rows });
});

r.post('/courses/:id/enrollments', async (req, res) => {
  const { studentName, studentEmail } = req.body || {};
  if (!studentName?.trim()) return res.status(400).json({ error: 'studentName is required.' });
  const { rows } = await db.query(
    `INSERT INTO lms_enrollments (course_id,student_name,student_email) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, studentName.trim(), studentEmail||null]);
  await db.query(`UPDATE lms_courses SET enrolled=enrolled+1 WHERE id=$1`, [req.params.id]);
  res.status(201).json({ enrollment: rows[0] });
});

r.patch('/enrollments/:id', async (req, res) => {
  const { progress, status } = req.body || {};
  const { rows } = await db.query(
    `UPDATE lms_enrollments SET progress=COALESCE($1,progress), status=COALESCE($2,status) WHERE id=$3 RETURNING *`,
    [progress, status, req.params.id]);
  res.json({ enrollment: rows[0] });
});

r.delete('/enrollments/:id', async (req, res) => {
  await db.query(`DELETE FROM lms_enrollments WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
});

// ── Stats ─────────────────────────────────────────────────────────────────────
r.get('/stats', async (req, res) => {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS courses, COALESCE(SUM(enrolled),0) AS enrollments,
            COUNT(*) FILTER(WHERE status='published') AS published
     FROM lms_courses WHERE org_id=$1`, [req.user.orgId]);
  res.json({ stats: rows[0] });
});

module.exports = r;
