const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const { courseId, studentId, status } = req.query;
  
  let query = 'SELECT * FROM assignments WHERE org_id = $1';
  const params = [orgId];
  
  if (courseId) {
    params.push(courseId);
    query += ` AND course_id = $${params.length}`;
  }
  if (studentId) {
    params.push(studentId);
    query += ` AND student_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  
  query += ' ORDER BY due_date DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('SELECT * FROM assignments WHERE id = $1 AND org_id = $2', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Assignment not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { courseId, title, description, dueDate, maxScore, attachments } = req.body;
  
  if (!courseId || !title || !dueDate) {
    return res.status(400).json({ error: 'Course ID, title, and due date are required' });
  }
  
  const result = await db.query(
    'INSERT INTO assignments (org_id, course_id, title, description, due_date, max_score, attachments, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [orgId, courseId, title, description, dueDate, maxScore || 100, attachments ? JSON.stringify(attachments) : null, userId]
  );
  res.status(201).json(result.rows[0]);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { title, description, dueDate, maxScore, attachments } = req.body;
  
  const result = await db.query(
    'UPDATE assignments SET title = COALESCE($1, title), description = COALESCE($2, description), due_date = COALESCE($3, due_date), max_score = COALESCE($4, max_score), attachments = COALESCE($5, attachments) WHERE id = $6 AND org_id = $7 RETURNING *',
    [title, description, dueDate, maxScore, attachments ? JSON.stringify(attachments) : null, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Assignment not found' });
  res.json(result.rows[0]);
});

exports.submit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, userId } = req.user;
  const { submission, attachments } = req.body;
  
  const result = await db.query(
    'INSERT INTO assignment_submissions (assignment_id, student_id, org_id, submission_text, attachments, submitted_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
    [id, userId, orgId, submission, attachments ? JSON.stringify(attachments) : null]
  );
  res.status(201).json(result.rows[0]);
});

exports.grade = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, userId } = req.user;
  const { submissionId, score, feedback } = req.body;
  
  if (score === undefined) return res.status(400).json({ error: 'Score is required' });
  
  const result = await db.query(
    'UPDATE assignment_submissions SET score = $1, feedback = $2, graded_by = $3, graded_at = NOW() WHERE id = $4 AND org_id = $5 RETURNING *',
    [score, feedback, userId, submissionId, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Submission not found' });
  res.json(result.rows[0]);
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM assignments WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Assignment not found' });
  res.json({ message: 'Assignment deleted successfully', id: result.rows[0].id });
});
