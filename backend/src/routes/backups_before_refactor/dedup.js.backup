const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Scan for duplicates across a resource type ────────────────────────────────
// Uses a simple email/name similarity heuristic. Returns candidates for human
// review rather than auto-merging.
router.post('/scan/:resourceType', asyncHandler(async (req, res) => {
  const { resourceType } = req.params;
  let candidates = [];

  if (resourceType === 'contact') {
    // Find contacts sharing the same email within this org
    const { rows } = await db.query(
      `SELECT id, full_name, email, company
       FROM contacts WHERE org_id = $1 AND email IS NOT NULL AND email != ''
       ORDER BY email`,
      [req.user.orgId]
    );

    // Group by email
    const byEmail = {};
    for (const r of rows) {
      const email = r.email.toLowerCase().trim();
      if (!byEmail[email]) byEmail[email] = [];
      byEmail[email].push(r);
    }

    for (const [email, group] of Object.entries(byEmail)) {
      if (group.length > 1) {
        const sorted = group.sort((a, b) => b.id.toString().localeCompare(a.id.toString()));
        const master = sorted[0];
        for (let i = 1; i < sorted.length; i++) {
          // Insert candidate for the duplicate
          const { rows: inserted } = await db.query(
            `INSERT INTO duplicate_candidates (org_id, resource_type, record_id, duplicate_of, score, match_reason)
             VALUES ($1, $2, $3, $4, 95, 'email_match')
             ON CONFLICT DO NOTHING RETURNING id`,
            [req.user.orgId, 'contact', sorted[i].id, master.id]
          );
          if (inserted.length) {
            candidates.push({
              recordId: sorted[i].id,
              name: sorted[i].full_name,
              duplicateOf: master.id,
              masterName: master.full_name,
              email,
              score: 95,
            });
          }
        }
      }
    }
  }

  res.json({ candidates, count: candidates.length });
}));

// ── List pending candidates ───────────────────────────────────────────────────
router.get('/candidates/:resourceType', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = ['org_id = $1', 'resource_type = $2'];
  const params = [req.user.orgId, req.params.resourceType];
  let idx = 3;
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }

  const { rows } = await db.query(
    `SELECT * FROM duplicate_candidates WHERE ${conditions.join(' AND ')} ORDER BY score DESC`,
    params
  );
  res.json({ candidates: rows });
}));

// ── Confirm a candidate (auto-merge) ─────────────────────────────────────────
router.post('/candidates/:id/confirm', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM duplicate_candidates WHERE id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Candidate not found.' });
  const c = rows[0];

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Get or create duplicate group
    let groupId;
    if (c.duplicate_of) {
      const { rows: existingGroup } = await client.query(
        `SELECT id FROM duplicate_groups WHERE org_id = $1 AND resource_type = $2 AND master_id = $3`,
        [req.user.orgId, c.resource_type, c.duplicate_of]
      );
      if (existingGroup.length) {
        groupId = existingGroup[0].id;
      } else {
        const { rows: newGroup } = await client.query(
          `INSERT INTO duplicate_groups (org_id, resource_type, master_id) VALUES ($1, $2, $3) RETURNING id`,
          [req.user.orgId, c.resource_type, c.duplicate_of]
        );
        groupId = newGroup[0].id;
      }
    }

    // Mark candidate as merged
    await client.query(
      `UPDATE duplicate_candidates SET status = 'merged', group_id = $1 WHERE id = $2`,
      [groupId, req.params.id]
    );

    // Log to merge audit
    await client.query(
      `INSERT INTO merge_audit_log (org_id, resource_type, survived_id, merged_ids, performed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.orgId, c.resource_type, c.duplicate_of, [c.record_id], req.user.id]
    );

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// ── Reject a candidate ───────────────────────────────────────────────────────
router.post('/candidates/:id/reject', asyncHandler(async (req, res) => {
  await db.query(
    `UPDATE duplicate_candidates SET status = 'rejected' WHERE id = $1`,
    [req.params.id]
  );
  res.json({ ok: true });
}));

// ── Merge history ────────────────────────────────────────────────────────────
router.get('/history/:resourceType', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM merge_audit_log WHERE org_id = $1 AND resource_type = $2 ORDER BY created_at DESC`,
    [req.user.orgId, req.params.resourceType]
  );
  res.json({ merges: rows });
}));

module.exports = router;
