const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const r = Router();
r.use(requireAuth);

r.get('/', async (req, res) => {
  const { rows } = await db.query(
    `SELECT a.*, c.name AS class_name, s.name AS subject_name,
            (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.assignment_id=a.id) AS submission_count
     FROM school_assignments a
     LEFT JOIN school_classes c ON c.id=a.class_id
     LEFT JOIN school_subjects s ON s.id=a.subject_id
     WHERE a.org_id=$1 ORDER BY a.due_date, a.created_at DESC`, [req.user.orgId]);
  res.json({ assignments: rows });
});

r.post('/', async (req, res) => {
  const { title, instructions, dueDate, classId, subjectId, maxScore } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title is required.' });
  const { rows } = await db.query(
    `INSERT INTO school_assignments (org_id,title,instructions,due_date,class_id,subject_id,max_score)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.orgId, title.trim(), instructions||'', dueDate||null, classId||null, subjectId||null, maxScore||100]);
  res.status(201).json({ assignment: rows[0] });
});

r.put('/:id', async (req, res) => {
  const { title, instructions, dueDate, status, maxScore } = req.body || {};
  const { rows } = await db.query(
    `UPDATE school_assignments SET title=COALESCE($1,title),instructions=$2,due_date=$3,status=COALESCE($4,status),max_score=COALESCE($5,max_score)
     WHERE id=$6 AND org_id=$7 RETURNING *`,
    [title, instructions, dueDate, status, maxScore, req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ assignment: rows[0] });
});

r.delete('/:id', async (req, res) => {
  await db.query(`DELETE FROM school_assignments WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

// Submissions
r.get('/:id/submissions', async (req, res) => {
  const { rows } = await db.query(
    `SELECT sub.*, s.name AS student_name_ref FROM assignment_submissions sub
     LEFT JOIN school_students s ON s.id=sub.student_id
     WHERE sub.assignment_id=$1 ORDER BY sub.submitted_at DESC`, [req.params.id]);
  res.json({ submissions: rows });
});

r.post('/:id/submissions', async (req, res) => {
  const { studentName, studentId, fileUrl } = req.body || {};
  const { rows } = await db.query(
    `INSERT INTO assignment_submissions (assignment_id,student_name,student_id,file_url) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.id, studentName||'Anonymous', studentId||null, fileUrl||null]);
  res.status(201).json({ submission: rows[0] });
});

r.patch('/submissions/:id/grade', async (req, res) => {
  const { score, feedback } = req.body || {};
  const { rows } = await db.query(
    `UPDATE assignment_submissions SET score=$1,feedback=$2,status='graded' WHERE id=$3 RETURNING *`,
    [score, feedback||'', req.params.id]);
  res.json({ submission: rows[0] });
});

module.exports = r;
