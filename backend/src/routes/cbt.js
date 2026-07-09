const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const r = Router();
r.use(requireAuth);

// ── Quizzes ───────────────────────────────────────────────────────────────────
r.get('/quizzes', async (req, res) => {
  const { rows } = await db.query(
    `SELECT q.*, c.name AS class_name,
            (SELECT COUNT(*) FROM cbt_questions WHERE quiz_id=q.id) AS question_count,
            (SELECT COUNT(*) FROM cbt_attempts WHERE quiz_id=q.id) AS attempt_count
     FROM cbt_quizzes q LEFT JOIN school_classes c ON c.id=q.class_id
     WHERE q.org_id=$1 ORDER BY q.created_at DESC`, [req.user.orgId]);
  res.json({ quizzes: rows });
});

r.post('/quizzes', async (req, res) => {
  const { title, description, durationMinutes, passScore, classId, status } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title is required.' });
  const { rows } = await db.query(
    `INSERT INTO cbt_quizzes (org_id,title,description,duration_minutes,pass_score,class_id,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.orgId, title.trim(), description||'', durationMinutes||30, passScore||50, classId||null, status||'draft']);
  res.status(201).json({ quiz: rows[0] });
});

r.put('/quizzes/:id', async (req, res) => {
  const { title, description, durationMinutes, passScore, status } = req.body || {};
  const { rows } = await db.query(
    `UPDATE cbt_quizzes SET title=COALESCE($1,title),description=$2,duration_minutes=COALESCE($3,duration_minutes),
     pass_score=COALESCE($4,pass_score),status=COALESCE($5,status) WHERE id=$6 AND org_id=$7 RETURNING *`,
    [title, description, durationMinutes, passScore, status, req.params.id, req.user.orgId]);
  res.json({ quiz: rows[0] });
});

r.delete('/quizzes/:id', async (req, res) => {
  await db.query(`DELETE FROM cbt_quizzes WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

// ── Questions ─────────────────────────────────────────────────────────────────
r.get('/quizzes/:id/questions', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM cbt_questions WHERE quiz_id=$1 ORDER BY order_num`, [req.params.id]);
  res.json({ questions: rows });
});

r.post('/quizzes/:id/questions', async (req, res) => {
  const { question, optionA, optionB, optionC, optionD, correctAnswer, marks } = req.body || {};
  if (!question?.trim() || !correctAnswer) return res.status(400).json({ error: 'question and correctAnswer required.' });
  const { rows: cnt } = await db.query(`SELECT COUNT(*) FROM cbt_questions WHERE quiz_id=$1`, [req.params.id]);
  const { rows } = await db.query(
    `INSERT INTO cbt_questions (quiz_id,question,option_a,option_b,option_c,option_d,correct_answer,marks,order_num)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.params.id, question.trim(), optionA||'', optionB||'', optionC||'', optionD||'', correctAnswer, marks||1, +cnt.rows[0].count]);
  res.status(201).json({ question: rows[0] });
});

r.put('/questions/:id', async (req, res) => {
  const { question, optionA, optionB, optionC, optionD, correctAnswer, marks } = req.body || {};
  const { rows } = await db.query(
    `UPDATE cbt_questions SET question=$1,option_a=$2,option_b=$3,option_c=$4,option_d=$5,correct_answer=$6,marks=$7 WHERE id=$8 RETURNING *`,
    [question, optionA, optionB, optionC, optionD, correctAnswer, marks, req.params.id]);
  res.json({ question: rows[0] });
});

r.delete('/questions/:id', async (req, res) => {
  await db.query(`DELETE FROM cbt_questions WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
});

// ── Attempts ──────────────────────────────────────────────────────────────────
r.get('/quizzes/:id/attempts', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM cbt_attempts WHERE quiz_id=$1 ORDER BY started_at DESC`, [req.params.id]);
  res.json({ attempts: rows });
});

// Proctoring threshold: an exam-taker who left the tab/window this many times
// or more gets flagged for the teacher to review — not auto-failed, since
// blur events can also be innocuous (notification popups, alt-tab by mistake).
const TAB_SWITCH_FLAG_THRESHOLD = 3;

r.post('/quizzes/:id/submit', async (req, res) => {
  const { studentName, studentId, answers, tabSwitchCount } = req.body || {};
  if (!studentName) return res.status(400).json({ error: 'studentName required.' });
  const { rows: quiz } = await db.query(`SELECT * FROM cbt_quizzes WHERE id=$1`, [req.params.id]);
  if (!quiz.length) return res.status(404).json({ error: 'Quiz not found.' });
  const { rows: questions } = await db.query(`SELECT * FROM cbt_questions WHERE quiz_id=$1`, [req.params.id]);
  let score = 0, totalMarks = 0;
  questions.forEach(q => {
    totalMarks += q.marks;
    if (answers?.[q.id] === q.correct_answer) score += q.marks;
  });
  const pct = totalMarks > 0 ? Math.round((score/totalMarks)*100) : 0;
  const passed = pct >= (quiz[0].pass_score || 50);
  const switches = Math.max(0, Number(tabSwitchCount) || 0);
  const flagged = switches >= TAB_SWITCH_FLAG_THRESHOLD;
  const { rows } = await db.query(
    `INSERT INTO cbt_attempts (quiz_id,student_name,student_id,score,total_marks,passed,answers,tab_switch_count,flagged,finished_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *`,
    [req.params.id, studentName, studentId||null, score, totalMarks, passed, JSON.stringify(answers||{}), switches, flagged]);
  res.status(201).json({ attempt: rows[0], score, totalMarks, pct, passed });
});

r.post("/bulk-delete", bulkDeleteHandler("cbt_quizzes"));
r.get("/export", async (req, res) => { const { rows } = await db.query("SELECT * FROM cbt_quizzes WHERE org_id = $1", [req.user.orgId]); sendCsv(res, "cbt_quizzes.csv", rows, autoColumns(rows)); });
r.get("/stats", async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total FROM cbt_quizzes WHERE org_id = module.exports =", [req.user.orgId]); res.json({ stats: rows[0] }); });

module.exports = r;
