const db = require('../db');

async function getTourForModule(req, res) {
  const { moduleSlug } = req.params;
  const { rows } = await db.query(
    'SELECT id, module_slug, name, steps FROM tour_definitions WHERE module_slug = $1 AND is_active = true LIMIT 1',
    [moduleSlug]
  );
  if (!rows.length) return res.json({ tour: null });

  // Check if user already completed this tour
  const { rows: progress } = await db.query(
    'SELECT is_completed FROM tour_progress WHERE org_id = $1 AND user_id = $2 AND tour_id = $3',
    [req.user.orgId, req.user.id, rows[0].id]
  );

  res.json({ tour: progress.length && progress[0].is_completed ? null : rows[0] });
}

async function completeTour(req, res) {
  const { id } = req.params;
  await db.query(
    `INSERT INTO tour_progress (org_id, user_id, tour_id, completed_steps, is_completed, completed_at)
     VALUES ($1, $2, $3, ARRAY(SELECT jsonb_array_elements_text((SELECT steps FROM tour_definitions WHERE id = $3) -> 'steps' ->> 'title')), true, now())
     ON CONFLICT (org_id, user_id, tour_id) DO UPDATE SET is_completed = true, completed_at = now()`,
    [req.user.orgId, req.user.id, id]
  );
  res.json({ ok: true });
}

async function dismissTour(req, res) {
  const { id } = req.params;
  await db.query(
    `INSERT INTO tour_progress (org_id, user_id, tour_id, is_completed)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (org_id, user_id, tour_id) DO NOTHING`,
    [req.user.orgId, req.user.id, id]
  );
  res.json({ ok: true });
}

module.exports = { getTourForModule, completeTour, dismissTour };
