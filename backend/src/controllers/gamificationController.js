const db = require('../db');
const logger = require('../utils/logger');

// ── Points ─────────────────────────────────────────────────────────────────

async function awardPoints(orgId, userId, points, source, sourceId = null, metadata = null) {
  try {
    await db.query(
      `INSERT INTO gamification_points (org_id, user_id, points, source, source_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orgId, userId, points, source, sourceId, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (err) {
    logger.error('gamification: failed to award points', { orgId, userId, source, error: err.message });
  }
}

async function getPoints(req, res) {
  const { rows } = await db.query(
    `SELECT COALESCE(SUM(points), 0)::int AS total FROM gamification_points WHERE org_id = $1 AND user_id = $2`,
    [req.user.orgId, req.user.id]
  );
  const { rows: breakdown } = await db.query(
    `SELECT source, SUM(points)::int AS points FROM gamification_points
     WHERE org_id = $1 AND user_id = $2 GROUP BY source ORDER BY points DESC`,
    [req.user.orgId, req.user.id]
  );
  const { rows: recent } = await db.query(
    `SELECT points, source, source_id, created_at FROM gamification_points
     WHERE org_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 20`,
    [req.user.orgId, req.user.id]
  );
  res.json({ total: rows[0].total, breakdown, recent });
}

// ── Badges ─────────────────────────────────────────────────────────────────

async function getBadges(req, res) {
  const { rows: definitions } = await db.query(
    `SELECT * FROM gamification_badge_definitions WHERE org_id = $1 AND is_active = true ORDER BY sort_order`,
    [req.user.orgId]
  );
  const { rows: earned } = await db.query(
    `SELECT ub.*, bd.name, bd.description, bd.icon_url, bd.category, bd.points, bd.slug
     FROM gamification_user_badges ub
     JOIN gamification_badge_definitions bd ON bd.id = ub.badge_id
     WHERE ub.org_id = $1 AND ub.user_id = $2`,
    [req.user.orgId, req.user.id]
  );
  const earnedIds = new Set(earned.map(e => e.badge_id));
  const all = definitions.map(d => ({
    ...d,
    earned: earnedIds.has(d.id),
    earned_at: earned.find(e => e.badge_id === d.id)?.earned_at || null,
  }));
  res.json({ badges: all, earnedCount: earned.length, totalCount: definitions.length });
}

// ── Streaks ────────────────────────────────────────────────────────────────

async function getStreaks(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM gamification_streaks WHERE org_id = $1 AND user_id = $2 ORDER BY streak_type`,
    [req.user.orgId, req.user.id]
  );
  res.json({ streaks: rows });
}

async function recordActivity(req, res) {
  const { streakType } = req.body || {};
  const type = streakType || 'login';

  const today = new Date().toISOString().slice(0, 10);
  const { rows: existing } = await db.query(
    `SELECT * FROM gamification_streaks WHERE org_id = $1 AND user_id = $2 AND streak_type = $3`,
    [req.user.orgId, req.user.id, type]
  );

  if (existing.length) {
    const s = existing[0];
    const lastDate = s.last_activity_date instanceof Date
      ? s.last_activity_date.toISOString().slice(0, 10)
      : String(s.last_activity_date);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (lastDate === today) {
      // Already recorded today — no change
      return res.json({ streak: s });
    }

    const nextStreak = lastDate === yesterday ? s.current_streak + 1 : 1;
    const newLongest = Math.max(nextStreak, s.longest_streak);

    const { rows: updated } = await db.query(
      `UPDATE gamification_streaks
       SET current_streak = $1, longest_streak = $2, last_activity_date = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [nextStreak, newLongest, today, s.id]
    );
    return res.json({ streak: updated[0] });
  }

  const { rows } = await db.query(
    `INSERT INTO gamification_streaks (org_id, user_id, streak_type, current_streak, longest_streak, last_activity_date)
     VALUES ($1, $2, $3, 1, 1, $4) RETURNING *`,
    [req.user.orgId, req.user.id, type, today]
  );
  res.json({ streak: rows[0] });
}

// ── Leaderboards ───────────────────────────────────────────────────────────

async function getLeaderboards(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM gamification_leaderboards WHERE org_id = $1 AND is_active = true ORDER BY name`,
    [req.user.orgId]
  );
  res.json({ leaderboards: rows });
}

async function getLeaderboard(req, res) {
  const { id } = req.params;
  const { rows: lb } = await db.query(
    `SELECT * FROM gamification_leaderboards WHERE id = $1 AND org_id = $2`,
    [id, req.user.orgId]
  );
  if (!lb.length) return res.status(404).json({ error: 'Leaderboard not found.' });

  const period = lb[0].period;
  let startDate, endDate;
  const now = new Date();
  if (period === 'daily') {
    startDate = now.toISOString().slice(0, 10);
    endDate = startDate;
  } else if (period === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    startDate = monday.toISOString().slice(0, 10);
    endDate = new Date().toISOString().slice(0, 10);
  } else if (period === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    endDate = new Date().toISOString().slice(0, 10);
  } else {
    startDate = '1970-01-01';
    endDate = new Date().toISOString().slice(0, 10);
  }

  const { rows: entries } = await db.query(
    `SELECT e.*, u.full_name, u.avatar_url, u.email
     FROM gamification_leaderboard_entries e
     JOIN users u ON u.id = e.user_id
     WHERE e.leaderboard_id = $1 AND e.org_id = $2 AND e.period_start >= $3 AND e.period_end <= $4
     ORDER BY e.rank NULLS LAST, e.score DESC
     LIMIT 100`,
    [id, req.user.orgId, startDate, endDate]
  );

  // Find current user's rank
  const userEntry = entries.find(e => e.user_id === req.user.id);

  res.json({
    leaderboard: lb[0],
    entries,
    myRank: userEntry ? { rank: userEntry.rank, score: userEntry.score } : null,
  });
}

// ── Onboarding Checklist ───────────────────────────────────────────────────

async function getChecklists(req, res) {
  const { rows: definitions } = await db.query(
    `SELECT * FROM gamification_onboarding_checklists WHERE org_id = $1 AND is_active = true ORDER BY sort_order`,
    [req.user.orgId]
  );
  const { rows: progress } = await db.query(
    `SELECT * FROM gamification_user_checklist_progress WHERE org_id = $1 AND user_id = $2`,
    [req.user.orgId, req.user.id]
  );

  const progressByChecklist = {};
  for (const p of progress) {
    progressByChecklist[p.checklist_id] = p;
  }

  const result = definitions.map(c => {
    const prog = progressByChecklist[c.id];
    const completedItems = prog?.completed_items || [];
    const totalItems = (c.items || []).length;
    const completedCount = totalItems > 0 ? completedItems.length : 0;
    return {
      ...c,
      progress: prog || null,
      completedCount,
      totalItems,
      percentComplete: totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0,
    };
  });

  res.json({ checklists: result });
}

async function completeChecklistItem(req, res) {
  const { checklistId, itemId } = req.body || {};
  if (!checklistId || !itemId) return res.status(400).json({ error: 'checklistId and itemId are required.' });

  const { rows: existing } = await db.query(
    `SELECT * FROM gamification_user_checklist_progress
     WHERE org_id = $1 AND user_id = $2 AND checklist_id = $3`,
    [req.user.orgId, req.user.id, checklistId]
  );

  if (existing.length) {
    const completed = existing[0].completed_items || [];
    if (completed.includes(itemId)) {
      return res.json({ progress: existing[0] });
    }
    const { rows } = await db.query(
      `UPDATE gamification_user_checklist_progress
       SET completed_items = array_append(completed_items, $1)
       WHERE id = $2 RETURNING *`,
      [itemId, existing[0].id]
    );
    return res.json({ progress: rows[0] });
  }

  const { rows } = await db.query(
    `INSERT INTO gamification_user_checklist_progress (org_id, user_id, checklist_id, completed_items)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.orgId, req.user.id, checklistId, [itemId]]
  );
  res.json({ progress: rows[0] });
}

module.exports = {
  awardPoints, getPoints, getBadges, getStreaks, recordActivity,
  getLeaderboards, getLeaderboard, getChecklists, completeChecklistItem,
};
