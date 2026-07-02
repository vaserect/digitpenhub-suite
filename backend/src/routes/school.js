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

module.exports = r;
