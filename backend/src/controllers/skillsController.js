const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { search } = req.query;
  if (search) {
    const { rows } = await db.query(
      `SELECT us.*, u.full_name, u.email FROM user_skills us
       JOIN users u ON u.id = us.user_id
       WHERE us.skill ILIKE $1 AND u.org_id = $2
       ORDER BY us.proficiency DESC`,
      [`%${search}%`, req.user.orgId]
    );
    return res.json({ skills: rows });
  }
  const { rows } = await db.query(
    `SELECT us.skill, count(*)::int AS people
     FROM user_skills us
     JOIN users u ON u.id = us.user_id
     WHERE u.org_id = $1
     GROUP BY us.skill ORDER BY us.skill`,
    [req.user.orgId]
  );
  res.json({ skills: rows });
});

exports.create = asyncHandler(async (req, res) => {
  const { skill, proficiency } = req.body || {};
  if (!skill) return res.status(400).json({ error: 'skill is required.' });
  const { rows } = await db.query(
    `INSERT INTO user_skills (user_id, skill, proficiency)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, skill) DO UPDATE SET proficiency = $3
     RETURNING *`,
    [req.user.id, skill, proficiency || 'intermediate']
  );
  res.json({ skill: rows[0] });
});

exports.remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await db.query(
    'DELETE FROM user_skills WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );
  res.json({ deleted: true });
});
