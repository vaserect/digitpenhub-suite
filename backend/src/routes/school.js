const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const r = Router();
r.use(requireAuth);

// ── Stats ─────────────────────────────────────────────────────────────────────
r.get('/stats', async (req, res) => {
  const [stu, cls, tch, sub] = await Promise.all([
    db.query(`SELECT COUNT(*) AS c FROM school_students WHERE org_id=$1 AND status='active'`, [req.user.orgId]),
    db.query(`SELECT COUNT(*) AS c FROM school_classes WHERE org_id=$1`, [req.user.orgId]),
    db.query(`SELECT COUNT(*) AS c FROM school_teachers WHERE org_id=$1 AND status='active'`, [req.user.orgId]),
    db.query(`SELECT COUNT(*) AS c FROM school_subjects WHERE org_id=$1`, [req.user.orgId]),
  ]);
  res.json({ students: +stu.rows[0].c, classes: +cls.rows[0].c, teachers: +tch.rows[0].c, subjects: +sub.rows[0].c });
});

// ── Classes ───────────────────────────────────────────────────────────────────
r.get('/classes', async (req, res) => {
  const { rows } = await db.query(
    `SELECT c.*, (SELECT COUNT(*) FROM school_students s WHERE s.class_id=c.id) AS student_count
     FROM school_classes c WHERE c.org_id=$1 ORDER BY c.name`, [req.user.orgId]);
  res.json({ classes: rows });
});
r.post('/classes', async (req, res) => {
  const { name, gradeLevel, academicYear } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO school_classes (org_id,name,grade_level,academic_year) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, name.trim(), gradeLevel||'', academicYear||'2024/2025']);
  res.status(201).json({ class: rows[0] });
});
r.delete('/classes/:id', async (req, res) => {
  await db.query(`DELETE FROM school_classes WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

// ── Students ──────────────────────────────────────────────────────────────────
r.get('/students', async (req, res) => {
  const { classId } = req.query;
  let q = `SELECT s.*, c.name AS class_name FROM school_students s LEFT JOIN school_classes c ON c.id=s.class_id WHERE s.org_id=$1`;
  const params = [req.user.orgId];
  if (classId) { params.push(classId); q += ` AND s.class_id=$${params.length}`; }
  q += ` ORDER BY s.name`;
  const { rows } = await db.query(q, params);
  res.json({ students: rows });
});
r.post('/students', async (req, res) => {
  const { name, classId, studentNo, parentEmail, parentPhone, dateOfBirth, gender } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const no = studentNo?.trim() || `STU-${Date.now().toString(36).toUpperCase()}`;
  const { rows } = await db.query(
    `INSERT INTO school_students (org_id,class_id,name,student_no,parent_email,parent_phone,date_of_birth,gender)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.orgId, classId||null, name.trim(), no, parentEmail||null, parentPhone||null, dateOfBirth||null, gender||null]);
  res.status(201).json({ student: rows[0] });
});
r.put('/students/:id', async (req, res) => {
  const { name, classId, parentEmail, parentPhone, status } = req.body || {};
  const { rows } = await db.query(
    `UPDATE school_students SET name=COALESCE($1,name),class_id=$2,parent_email=$3,parent_phone=$4,status=COALESCE($5,status)
     WHERE id=$6 AND org_id=$7 RETURNING *`,
    [name, classId||null, parentEmail, parentPhone, status, req.params.id, req.user.orgId]);
  res.json({ student: rows[0] });
});
r.delete('/students/:id', async (req, res) => {
  await db.query(`DELETE FROM school_students WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

// ── Teachers ──────────────────────────────────────────────────────────────────
r.get('/teachers', async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM school_teachers WHERE org_id=$1 ORDER BY name`, [req.user.orgId]);
  res.json({ teachers: rows });
});
r.post('/teachers', async (req, res) => {
  const { name, email, phone, subjects } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO school_teachers (org_id,name,email,phone,subjects) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, name.trim(), email||null, phone||null, JSON.stringify(subjects||[])]);
  res.status(201).json({ teacher: rows[0] });
});
r.delete('/teachers/:id', async (req, res) => {
  await db.query(`DELETE FROM school_teachers WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

// ── Subjects ──────────────────────────────────────────────────────────────────
r.get('/subjects', async (req, res) => {
  const { rows } = await db.query(
    `SELECT s.*, c.name AS class_name, t.name AS teacher_name
     FROM school_subjects s LEFT JOIN school_classes c ON c.id=s.class_id LEFT JOIN school_teachers t ON t.id=s.teacher_id
     WHERE s.org_id=$1 ORDER BY s.name`, [req.user.orgId]);
  res.json({ subjects: rows });
});
r.post('/subjects', async (req, res) => {
  const { name, code, classId, teacherId } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO school_subjects (org_id,name,code,class_id,teacher_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, name.trim(), code||null, classId||null, teacherId||null]);
  res.status(201).json({ subject: rows[0] });
});
r.delete('/subjects/:id', async (req, res) => {
  await db.query(`DELETE FROM school_subjects WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

// ── Attendance ────────────────────────────────────────────────────────────────
r.get('/attendance', async (req, res) => {
  const { classId, date } = req.query;
  if (!classId || !date) return res.status(400).json({ error: 'classId and date are required.' });
  const { rows } = await db.query(
    `SELECT s.id AS student_id, s.name AS student_name, s.student_no, a.id AS attendance_id, a.status, a.marked_by
     FROM school_students s
     LEFT JOIN attendance_records a ON a.student_id=s.id AND a.date=$3 AND a.org_id=$1
     WHERE s.org_id=$1 AND s.class_id=$2 ORDER BY s.name`,
    [req.user.orgId, classId, date]);
  res.json({ attendance: rows });
});
r.post('/attendance', async (req, res) => {
  const { classId, date, records } = req.body || {};
  if (!classId || !date || !Array.isArray(records)) return res.status(400).json({ error: 'classId, date and records are required.' });
  const markedBy = req.user.fullName || req.user.email || 'Teacher';
  const out = [];
  for (const rec of records) {
    if (!rec?.studentId) continue;
    const { rows } = await db.query(
      `INSERT INTO attendance_records (org_id,class_id,student_id,date,status,marked_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (student_id,date) DO UPDATE SET status=EXCLUDED.status, marked_by=EXCLUDED.marked_by, class_id=EXCLUDED.class_id
       RETURNING *`,
      [req.user.orgId, classId, rec.studentId, date, rec.status || 'present', markedBy]);
    out.push(rows[0]);
  }
  res.json({ records: out });
});
r.get('/attendance/student/:studentId', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM attendance_records WHERE student_id=$1 AND org_id=$2 ORDER BY date DESC`,
    [req.params.studentId, req.user.orgId]);
  const total = rows.length;
  const present = rows.filter(r => r.status === 'present').length;
  const late = rows.filter(r => r.status === 'late').length;
  const absent = rows.filter(r => r.status === 'absent').length;
  const excused = rows.filter(r => r.status === 'excused').length;
  const presentPct = total ? Math.round(((present + late) / total) * 1000) / 10 : null;
  res.json({ records: rows, summary: { total, present, late, absent, excused, presentPct } });
});
r.get('/attendance/heatmap', async (req, res) => {
  const { classId, from, to } = req.query;
  if (!classId) return res.status(400).json({ error: 'classId is required.' });
  const params = [req.user.orgId, classId];
  let q = `SELECT date, status, COUNT(*) AS c FROM attendance_records WHERE org_id=$1 AND class_id=$2`;
  if (from) { params.push(from); q += ` AND date >= $${params.length}`; }
  if (to) { params.push(to); q += ` AND date <= $${params.length}`; }
  q += ` GROUP BY date, status ORDER BY date`;
  const { rows } = await db.query(q, params);
  const byDate = {};
  for (const row of rows) {
    const d = row.date.toISOString ? row.date.toISOString().slice(0, 10) : row.date;
    byDate[d] = byDate[d] || { date: d, present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    byDate[d][row.status] = (byDate[d][row.status] || 0) + Number(row.c);
    byDate[d].total += Number(row.c);
  }
  const days = Object.values(byDate).map(d => ({ ...d, presentRate: d.total ? Math.round(((d.present + d.late) / d.total) * 100) : null }));
  res.json({ days });
});

// ── Grades ────────────────────────────────────────────────────────────────────
r.get('/grades', async (req, res) => {
  const { classId, subjectId, term } = req.query;
  const params = [req.user.orgId];
  let q = `SELECT g.*, s.name AS student_name, sub.name AS subject_name
           FROM grade_records g
           LEFT JOIN school_students s ON s.id=g.student_id
           LEFT JOIN school_subjects sub ON sub.id=g.subject_id
           WHERE g.org_id=$1`;
  if (classId) { params.push(classId); q += ` AND g.class_id=$${params.length}`; }
  if (subjectId) { params.push(subjectId); q += ` AND g.subject_id=$${params.length}`; }
  if (term) { params.push(term); q += ` AND g.term=$${params.length}`; }
  q += ` ORDER BY s.name, g.created_at DESC`;
  const { rows } = await db.query(q, params);
  res.json({ grades: rows });
});
r.post('/grades', async (req, res) => {
  const { id, classId, subjectId, studentId, term, assessmentType, score, maxScore, weight } = req.body || {};
  if (!studentId || !term?.trim() || score === undefined || score === null) {
    return res.status(400).json({ error: 'studentId, term and score are required.' });
  }
  const recordedBy = req.user.fullName || req.user.email || 'Teacher';
  if (id) {
    const { rows } = await db.query(
      `UPDATE grade_records SET class_id=$1,subject_id=$2,student_id=$3,term=$4,assessment_type=$5,score=$6,max_score=$7,weight=$8
       WHERE id=$9 AND org_id=$10 RETURNING *`,
      [classId||null, subjectId||null, studentId, term.trim(), assessmentType||'Test', score, maxScore||100, weight||1, id, req.user.orgId]);
    return res.json({ grade: rows[0] });
  }
  const { rows } = await db.query(
    `INSERT INTO grade_records (org_id,class_id,subject_id,student_id,term,assessment_type,score,max_score,weight,recorded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.orgId, classId||null, subjectId||null, studentId, term.trim(), assessmentType||'Test', score, maxScore||100, weight||1, recordedBy]);
  res.status(201).json({ grade: rows[0] });
});
r.delete('/grades/:id', async (req, res) => {
  await db.query(`DELETE FROM grade_records WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});
r.get('/grades/student/:studentId', async (req, res) => {
  const { rows } = await db.query(
    `SELECT g.*, sub.name AS subject_name
     FROM grade_records g LEFT JOIN school_subjects sub ON sub.id=g.subject_id
     WHERE g.student_id=$1 AND g.org_id=$2 ORDER BY g.created_at DESC`,
    [req.params.studentId, req.user.orgId]);
  const bySubject = {};
  for (const g of rows) {
    const key = g.subject_id || 'unassigned';
    bySubject[key] = bySubject[key] || { subjectId: g.subject_id, subjectName: g.subject_name || 'Unassigned', weightedScore: 0, weightTotal: 0 };
    const pct = g.max_score > 0 ? (Number(g.score) / Number(g.max_score)) * 100 : 0;
    bySubject[key].weightedScore += pct * Number(g.weight);
    bySubject[key].weightTotal += Number(g.weight);
  }
  const summary = Object.values(bySubject).map(s => ({
    subjectId: s.subjectId, subjectName: s.subjectName,
    average: s.weightTotal > 0 ? Math.round((s.weightedScore / s.weightTotal) * 10) / 10 : null,
  }));
  res.json({ records: rows, summary });
});

module.exports = r;
