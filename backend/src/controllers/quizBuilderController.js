const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER(WHERE published) AS published,
            COALESCE(SUM(responses_count),0) AS total_responses
     FROM quizzes WHERE org_id=$1`, [req.user.orgId]);
  res.json({ stats: rows[0] });
}

async function listQuizzes(req, res) {
  const { rows } = await db.query(
    `SELECT id,title,description,status,published,responses_count,created_at,
            jsonb_array_length(questions) AS question_count
     FROM quizzes WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  res.json({ quizzes: rows });
}

async function getQuiz(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM quizzes WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ quiz: rows[0] });
}

async function createQuiz(req, res) {
  const { title, description, questions, settings } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title required.' });
  const { rows } = await db.query(
    `INSERT INTO quizzes (org_id,title,description,questions,settings)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, title.trim(), description||null,
     JSON.stringify(questions||[]), JSON.stringify(settings||{})]
  );
  res.status(201).json({ quiz: rows[0] });
}

async function updateQuiz(req, res) {
  const { id } = req.params;
  const { title, description, questions, settings, published, status } = req.body || {};
  const { rows } = await db.query(
    `UPDATE quizzes SET
       title=COALESCE($3,title), description=$4,
       questions=COALESCE($5,questions), settings=COALESCE($6,settings),
       published=COALESCE($7,published), status=COALESCE($8,status),
       updated_at=NOW()
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId, title||null, description||null,
     questions ? JSON.stringify(questions) : null,
     settings ? JSON.stringify(settings) : null,
     published ?? null, status||null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ quiz: rows[0] });
}

async function deleteQuiz(req, res) {
  await db.query(`DELETE FROM quizzes WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// Public — no auth. Powers the public quiz-taking page at
// frontend/app/quiz/[id]/page.jsx. Every question's `correct_answer` is
// stripped before the response goes over the wire — an anonymous respondent
// must never be able to read the answer key from the API response.
async function getPublicQuiz(req, res) {
  const { rows } = await db.query(
    `SELECT id,title,description,questions,settings FROM quizzes WHERE id=$1 AND published=true`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Quiz not found.' });
  const quiz = rows[0];
  const questions = (quiz.questions || []).map(({ correct_answer, ...rest }) => rest);
  res.json({ quiz: { ...quiz, questions } });
}

// Anonymous respondents have no req.user/session, so the quiz's own org_id
// (not req.user.orgId) is what scopes grading + the response INSERT.
async function submitResponse(req, res) {
  const { quizId } = req.params;
  const { answers, respondentName, respondentEmail } = req.body || {};
  const { rows: qRows } = await db.query(
    `SELECT org_id, questions FROM quizzes WHERE id=$1 AND published=true`, [quizId]);
  if (!qRows.length) return res.status(404).json({ error: 'Quiz not found.' });
  const { org_id: orgId, questions: quizQuestions } = qRows[0];
  const questions = quizQuestions || [];
  let score = 0; let maxScore = 0;
  (answers||[]).forEach((a, i) => {
    const q = questions[i];
    if (!q) return;
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      maxScore++;
      if (q.correct_answer !== undefined && a.answer === q.correct_answer) score++;
    }
  });
  const { rows } = await db.query(
    `INSERT INTO quiz_responses (quiz_id,org_id,answers,score,max_score,respondent_name,respondent_email)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [quizId, orgId, JSON.stringify(answers||[]), score, maxScore||null,
     respondentName||null, respondentEmail||null]
  );
  await db.query(`UPDATE quizzes SET responses_count=responses_count+1 WHERE id=$1`, [quizId]);
  res.status(201).json({ response: rows[0], score, maxScore });
}

async function listResponses(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM quiz_responses WHERE quiz_id=$1 AND org_id=$2 ORDER BY completed_at DESC LIMIT 50`,
    [req.params.quizId, req.user.orgId]);
  res.json({ responses: rows });
}

module.exports = { getStats, listQuizzes, getQuiz, getPublicQuiz, createQuiz, updateQuiz, deleteQuiz, submitResponse, listResponses };
