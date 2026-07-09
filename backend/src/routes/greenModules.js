const { Router } = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Communities ───────────────────────────────────────────────────────────────
router.get('/communities', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT c.*, (SELECT count(*) FROM community_members WHERE community_id = c.id) AS member_count
     FROM communities c WHERE c.org_id = $1 ORDER BY c.name`,
    [req.user.orgId]
  );
  // Check membership status for current user
  for (const c of rows) {
    const { rows: membership } = await db.query(
      `SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2`,
      [c.id, req.user.id]
    );
    c.my_role = membership.length ? membership[0].role : null;
  }
  res.json({ communities: rows });
}));

router.post('/communities', asyncHandler(async (req, res) => {
  const { name, description, isPublic, requireApproval } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO communities (org_id, name, description, is_public, require_approval)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, name.trim(), description || null, isPublic !== false, requireApproval || false]
  );
  // Creator auto-joins as admin
  await db.query(`INSERT INTO community_members (community_id, user_id, role) VALUES ($1,$2,'admin') ON CONFLICT DO NOTHING`,
    [rows[0].id, req.user.id]);
  res.status(201).json({ community: rows[0] });
}));

router.post('/communities/:id/join', asyncHandler(async (req, res) => {
  await db.query(`INSERT INTO community_members (community_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

router.get('/communities/:id/posts', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT p.*, u.full_name AS author_name FROM community_posts p
     JOIN users u ON u.id = p.author_id WHERE p.community_id = $1 ORDER BY p.created_at DESC`,
    [req.params.id]
  );
  res.json({ posts: rows });
}));

router.post('/communities/:id/posts', asyncHandler(async (req, res) => {
  const { title, body } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required.' });
  const { rows } = await db.query(
    `INSERT INTO community_posts (community_id, author_id, title, body) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.id, req.user.id, title, body || null]
  );
  res.status(201).json({ post: rows[0] });
}));

// ── Events ────────────────────────────────────────────────────────────────────
router.get('/events', asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (from) { conditions.push(`start_at >= $${idx++}`); params.push(from); }
  if (to) { conditions.push(`end_at <= $${idx++}`); params.push(to); }
  const { rows } = await db.query(`SELECT * FROM events WHERE ${conditions.join(' AND ')} ORDER BY start_at`, params);
  for (const e of rows) {
    const { rows: count } = await db.query(`SELECT count(*) AS c FROM event_attendees WHERE event_id = $1`, [e.id]);
    e.attendee_count = parseInt(count[0].c);
    const { rows: myStatus } = await db.query(`SELECT status FROM event_attendees WHERE event_id = $1 AND user_id = $2`, [e.id, req.user.id]);
    e.my_status = myStatus.length ? myStatus[0].status : null;
  }
  res.json({ events: rows });
}));

router.post('/events', asyncHandler(async (req, res) => {
  const { title, description, eventType, startAt, endAt, maxAttendees, videoUrl } = req.body || {};
  if (!title || !startAt) return res.status(400).json({ error: 'title and startAt are required.' });
  const { rows } = await db.query(
    `INSERT INTO events (org_id, title, description, event_type, start_at, end_at, max_attendees, video_url, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.orgId, title, description || null, eventType || 'webinar', startAt, endAt || null, maxAttendees || null, videoUrl || null, req.user.id]
  );
  res.status(201).json({ event: rows[0] });
}));

router.post('/events/:id/register', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `INSERT INTO event_attendees (event_id, user_id) VALUES ($1,$2)
     ON CONFLICT ON CONSTRAINT event_attendees_pkey DO UPDATE SET status = 'registered' RETURNING *`,
    [req.params.id, req.user.id]
  );
  res.json({ attendee: rows[0] });
}));

// ── Job Board ─────────────────────────────────────────────────────────────────
router.get('/jobs', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  const { rows } = await db.query(`SELECT * FROM job_postings WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params);
  res.json({ jobs: rows });
}));

router.post('/jobs', asyncHandler(async (req, res) => {
  const { title, department, location, employmentType, description, requirements, salaryRange } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required.' });
  const { rows } = await db.query(
    `INSERT INTO job_postings (org_id, title, department, location, job_type, description, requirements)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.orgId, title, department || null, location || null, employmentType || 'full-time', description || null, requirements || null]
  );
  res.status(201).json({ job: rows[0] });
}));

router.patch('/jobs/:id', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const { rows } = await db.query(
    `UPDATE job_postings SET status = $1, updated_at = now() WHERE id = $2 AND org_id = $3 RETURNING *`,
    [status || 'published', req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ job: rows[0] });
}));

router.get('/jobs/:id/applications', asyncHandler(async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM job_applications WHERE job_id = $1 ORDER BY created_at DESC`, [req.params.id]);
  res.json({ applications: rows });
}));

// ── Skills Directory ──────────────────────────────────────────────────────────
router.get('/skills', asyncHandler(async (req, res) => {
  const { search } = req.query;
  if (search) {
    const { rows } = await db.query(
      `SELECT us.*, u.full_name, u.email FROM user_skills us
       JOIN users u ON u.id = us.user_id WHERE u.org_id = $1 AND us.skill ILIKE $2 ORDER BY us.proficiency DESC`,
      [req.user.orgId, `%${search}%`]
    );
    return res.json({ skills: rows });
  }
  const { rows } = await db.query(
    `SELECT skill, count(*)::int AS people, array_agg(DISTINCT proficiency) AS levels
     FROM user_skills us JOIN users u ON u.id = us.user_id
     WHERE u.org_id = $1 GROUP BY skill ORDER BY skill`,
    [req.user.orgId]
  );
  res.json({ skills: rows });
}));

router.post('/skills', asyncHandler(async (req, res) => {
  const { skill, proficiency } = req.body || {};
  if (!skill) return res.status(400).json({ error: 'skill is required.' });
  const { rows } = await db.query(
    `INSERT INTO user_skills (user_id, skill, proficiency) VALUES ($1,$2,$3)
     ON CONFLICT (user_id, skill) DO UPDATE SET proficiency = $3 RETURNING *`,
    [req.user.id, skill, proficiency || 'intermediate']
  );
  res.json({ skill: rows[0] });
}));

// ── Idea Management ───────────────────────────────────────────────────────────
router.get('/ideas', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = ['i.org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (status) { conditions.push(`i.status = $${idx++}`); params.push(status); }
  const { rows } = await db.query(
    `SELECT i.*, u.full_name AS author_name,
       (SELECT count(*) FROM idea_votes WHERE idea_id = i.id) AS votes
     FROM ideas i JOIN users u ON u.id = i.author_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY i.created_at DESC`,
    params
  );
  res.json({ ideas: rows });
}));

router.post('/ideas', asyncHandler(async (req, res) => {
  const { title, description } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required.' });
  const { rows } = await db.query(
    `INSERT INTO ideas (org_id, title, description, author_id) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, title, description || null, req.user.id]
  );
  res.status(201).json({ idea: rows[0] });
}));

router.post('/ideas/:id/vote', asyncHandler(async (req, res) => {
  await db.query(`INSERT INTO idea_votes (idea_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [req.params.id, req.user.id]);
  await db.query(`UPDATE ideas SET vote_count = (SELECT count(*) FROM idea_votes WHERE idea_id = $1) WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
}));

router.patch('/ideas/:id', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const { rows } = await db.query(`UPDATE ideas SET status = $1 WHERE id = $2 RETURNING *`, [status, req.params.id]);
  res.json({ idea: rows[0] });
}));

// ── Multi-timezone Meeting Coordinator ────────────────────────────────────────
router.get('/timezone-proposals', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT tp.*, u.full_name AS creator_name FROM timezone_proposals tp
     JOIN users u ON u.id = tp.created_by WHERE tp.org_id = $1 ORDER BY tp.created_at DESC`,
    [req.user.orgId]
  );
  for (const p of rows) {
    const { rows: responses } = await db.query(
      `SELECT tr.*, u.full_name FROM timezone_responses tr
       JOIN users u ON u.id = tr.user_id WHERE tr.proposal_id = $1`,
      [p.id]
    );
    p.responses = responses;
  }
  res.json({ proposals: rows });
}));

router.post('/timezone-proposals', asyncHandler(async (req, res) => {
  const { title, durationMinutes, proposedDates, timezones } = req.body || {};
  if (!title || !Array.isArray(proposedDates)) return res.status(400).json({ error: 'title and proposedDates are required.' });
  const { rows } = await db.query(
    `INSERT INTO timezone_proposals (org_id, title, duration_minutes, proposed_dates, timezones, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.orgId, title, durationMinutes || 60, JSON.stringify(proposedDates), timezones || ['UTC'], req.user.id]
  );
  res.status(201).json({ proposal: rows[0] });
}));

router.post('/timezone-proposals/:id/respond', asyncHandler(async (req, res) => {
  const { preferredSlots, timezone, comment } = req.body || {};
  if (!preferredSlots || !timezone) return res.status(400).json({ error: 'preferredSlots and timezone required.' });
  await db.query(
    `INSERT INTO timezone_responses (proposal_id, user_id, preferred_slots, timezone, comment)
     VALUES ($1,$2,$3,$4,$5) ON CONFLICT (proposal_id, user_id) DO UPDATE SET preferred_slots=$3, timezone=$4, comment=$5`,
    [req.params.id, req.user.id, JSON.stringify(preferredSlots), timezone, comment || null]
  );
  res.json({ ok: true });
}));

// ── Ambassador Program ────────────────────────────────────────────────────────
router.get('/ambassadors', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT a.*, u.full_name, u.email FROM ambassadors a JOIN users u ON u.id = a.user_id
     WHERE a.org_id = $1 ORDER BY a.total_referrals DESC`,
    [req.user.orgId]
  );
  res.json({ ambassadors: rows });
}));

router.post('/ambassadors', asyncHandler(async (req, res) => {
  const { userId } = req.body || {};
  const targetUserId = userId || req.user.id;
  const code = crypto.randomBytes(4).toString('hex');
  const { rows } = await db.query(
    `INSERT INTO ambassadors (org_id, user_id, referral_code) VALUES ($1,$2,$3) RETURNING *`,
    [req.user.orgId, targetUserId, code]
  );
  res.status(201).json({ ambassador: rows[0] });
}));

module.exports = router;
