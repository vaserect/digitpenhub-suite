const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { courseId, status } = req.query;
  
  let query = 'SELECT * FROM cbt_tests WHERE org_id = $1';
  const params = [orgId];
  
  if (courseId) {
    params.push(courseId);
    query += ` AND course_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  
  query += ' ORDER BY created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM cbt_tests WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Test not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { courseId, title, description, duration, questions, passingScore } = req.body;
  
  if (!courseId || !title || !questions) {
    return res.status(400).json({ error: 'Course ID, title, and questions are required' });
  }
  
  const result = await db.query(
    'INSERT INTO cbt_tests (org_id, course_id, title, description, duration_minutes, questions, passing_score, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [orgId, courseId, title, description, duration || 60, JSON.stringify(questions), passingScore || 70, userId]
  );
  res.status(201).json(result.rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { title, description, duration, questions, passingScore } = req.body;
  
  const result = await db.query(
    'UPDATE cbt_tests SET title = COALESCE($1, title), description = COALESCE($2, description), duration_minutes = COALESCE($3, duration_minutes), questions = COALESCE($4, questions), passing_score = COALESCE($5, passing_score) WHERE id = $6 AND org_id = $7 RETURNING *',
    [title, description, duration, questions ? JSON.stringify(questions) : null, passingScore, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Test not found' });
  res.json(result.rows[0]);
});

exports.submit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, userId } = req.user;
  const { answers } = req.body;
  
  if (!answers) return res.status(400).json({ error: 'Answers are required' });
  
  const result = await db.query(
    'INSERT INTO cbt_submissions (test_id, student_id, org_id, answers, submitted_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
    [id, userId, orgId, JSON.stringify(answers)]
  );
  res.status(201).json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM cbt_tests WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Test not found' });
  res.json({ message: 'Test deleted successfully', id: result.rows[0].id });
});
