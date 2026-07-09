const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Attendance ────────────────────────────────────────────────────────────────
router.get('/attendance', asyncHandler(async (req, res) => {
  const { classId, date, studentId, from, to } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId]; let idx = 2;
  if (classId) { conditions.push(`class_id = $${idx++}`); params.push(classId); }
  if (studentId) { conditions.push(`student_id = $${idx++}`); params.push(studentId); }
  if (date) { conditions.push(`date = $${idx++}`); params.push(date); }
  if (from) { conditions.push(`date >= $${idx++}`); params.push(from); }
  if (to) { conditions.push(`date <= $${idx++}`); params.push(to); }
  const { rows } = await db.query(
    `SELECT a.*, u.full_name AS student_name FROM attendance_records a
     JOIN users u ON u.id = a.student_id
     WHERE ${conditions.join(' AND ')} ORDER BY a.date DESC, a.created_at DESC`,
    params
  );
  res.json({ records: rows });
}));

router.post('/attendance', asyncHandler(async (req, res) => {
  const { studentId, classId, date, status, minutesLate, notes } = req.body || {};
  if (!studentId || !date || !status) {
    return res.status(400).json({ error: 'studentId, date, and status are required.' });
  }
  const { rows } = await db.query(
    `INSERT INTO attendance_records (org_id, student_id, class_id, date, status, minutes_late, notes, marked_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT ON CONSTRAINT attendance_records_student_id_date_key
     DO UPDATE SET status=$5, minutes_late=$6, notes=$7, marked_by=$8, class_id=COALESCE($3, attendance_records.class_id)
     RETURNING *`,
    [req.user.orgId, studentId, classId || null, date, status, minutesLate || 0, notes || null, req.user.id]
  );
  res.status(201).json({ record: rows[0] });
}));

router.get('/attendance/stats', asyncHandler(async (req, res) => {
  const { studentId, classId, from, to } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId]; let idx = 2;
  if (studentId) { conditions.push(`student_id = $${idx++}`); params.push(studentId); }
  if (classId) { conditions.push(`class_id = $${idx++}`); params.push(classId); }
  if (from) { conditions.push(`date >= $${idx++}`); params.push(from); }
  if (to) { conditions.push(`date <= $${idx++}`); params.push(to); }
  const { rows } = await db.query(
    `SELECT
       count(*) AS total,
       sum(CASE WHEN status='present' THEN 1 ELSE 0 END) AS present,
       sum(CASE WHEN status='absent' THEN 1 ELSE 0 END) AS absent,
       sum(CASE WHEN status='late' THEN 1 ELSE 0 END) AS late,
       sum(CASE WHEN status='excused' THEN 1 ELSE 0 END) AS excused
     FROM attendance_records WHERE ${conditions.join(' AND ')}`,
    params
  );
  res.json({ stats: rows[0] });
}));

// ── Gradebook ─────────────────────────────────────────────────────────────────
router.get('/grade-categories', asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId]; let idx = 2;
  if (courseId) { conditions.push(`course_id = $${idx++}`); params.push(courseId); }
  const { rows } = await db.query(
    `SELECT * FROM grade_categories WHERE ${conditions.join(' AND ')} ORDER BY sort_order`,
    params
  );
  res.json({ categories: rows });
}));

router.post('/grade-categories', asyncHandler(async (req, res) => {
  const { courseId, name, weight } = req.body || {};
  if (!courseId || !name || weight === undefined) {
    return res.status(400).json({ error: 'courseId, name, and weight are required.' });
  }
  const { rows } = await db.query(
    `INSERT INTO grade_categories (org_id, course_id, name, weight) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, courseId, name, weight]
  );
  res.status(201).json({ category: rows[0] });
}));

router.get('/submissions', asyncHandler(async (req, res) => {
  const { assignmentId, studentId } = req.query;
  const conditions = ['s.org_id = $1'];
  const params = [req.user.orgId]; let idx = 2;
  if (assignmentId) { conditions.push(`s.assignment_id = $${idx++}`); params.push(assignmentId); }
  if (studentId) { conditions.push(`s.student_id = $${idx++}`); params.push(studentId); }
  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS student_name, a.title AS assignment_title
     FROM assignment_submissions s
     JOIN users u ON u.id = s.student_id
     JOIN school_assignments a ON a.id = s.assignment_id
     WHERE ${conditions.join(' AND ')} ORDER BY s.submitted_at DESC`,
    params
  );
  res.json({ submissions: rows });
}));

router.patch('/submissions/:id/grade', asyncHandler(async (req, res) => {
  const { grade, maxGrade } = req.body || {};
  if (grade === undefined) return res.status(400).json({ error: 'grade is required.' });
  const { rows } = await db.query(
    `UPDATE assignment_submissions SET grade=$1, max_grade=COALESCE($2, max_grade), graded_by=$3, graded_at=now()
     WHERE id=$4 RETURNING *`,
    [grade, maxGrade || null, req.user.id, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Submission not found.' });
  res.json({ submission: rows[0] });
}));

// ── Student Progress Dashboard ────────────────────────────────────────────────
router.get('/progress', asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId]; let idx = 2;
  if (studentId) { conditions.push(`student_id = $${idx++}`); params.push(studentId); }
  if (courseId) { conditions.push(`course_id = $${idx++}`); params.push(courseId); }
  const { rows } = await db.query(
    `SELECT * FROM student_progress WHERE ${conditions.join(' AND ')}`,
    params
  );
  res.json({ progress: rows });
}));

router.post('/progress/refresh', asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.body || {};
  if (!studentId || !courseId) return res.status(400).json({ error: 'studentId and courseId are required.' });

  // Calculate attendance %
  const { rows: att } = await db.query(
    `SELECT
       count(*) AS total,
       sum(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END) AS present
     FROM attendance_records WHERE student_id = $1 AND org_id = $2`,
    [studentId, req.user.orgId]
  );
  const attPct = att[0].total > 0 ? (att[0].present / att[0].total * 100).toFixed(1) : 0;

  // Calculate weighted grade
  const { rows: subs } = await db.query(
    `SELECT s.grade, s.max_grade, gc.weight
     FROM assignment_submissions s
     JOIN school_assignments a ON a.id = s.assignment_id
     LEFT JOIN grade_categories gc ON gc.id = a.grade_category_id
     WHERE s.student_id = $1 AND s.grade IS NOT NULL`,
    [studentId]
  );

  let weightedSum = 0;
  let totalWeight = 0;
  for (const s of subs) {
    const pct = s.max_grade > 0 ? (s.grade / s.max_grade * 100) : 0;
    const w = parseFloat(s.weight) || 1;
    weightedSum += pct * w;
    totalWeight += w;
  }
  const overallGrade = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : null;

  // Count lessons
  const { rows: lessons } = await db.query(
    `SELECT count(*) AS total FROM lms_lessons WHERE course_id = $1`,
    [courseId]
  );
  // Progress tracking is done via enrollment progression — simplified count
  const { rows: enrolled } = await db.query(
    `SELECT progress FROM lms_enrollments WHERE course_id = $1 AND student_id = $2`,
    [courseId, studentId]
  );

  const { rows } = await db.query(
    `INSERT INTO student_progress (org_id, student_id, course_id, overall_grade, attendance_pct, lessons_completed, total_lessons, last_activity_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,now())
     ON CONFLICT (student_id, course_id)
     DO UPDATE SET overall_grade=$4, attendance_pct=$5, lessons_completed=$6, total_lessons=$7, last_activity_at=now(), updated_at=now()
     RETURNING *`,
    [req.user.orgId, studentId, courseId, overallGrade, attPct, enrolled[0]?.progress || 0, parseInt(lessons[0].total)]
  );
  res.json({ progress: rows[0] });
}));

module.exports = router;
