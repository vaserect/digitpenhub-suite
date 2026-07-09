const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../utils/notify');
const { pushInboxMessage } = require('./inbox');

const router = Router();
router.use(requireAuth);

// ── Templates ─────────────────────────────────────────────────────────────────

router.get('/templates', asyncHandler(async (req, res) => {
  const { resourceType } = req.query;
  const cond = resourceType ? 'AND resource_type = $2' : '';
  const params = resourceType ? [req.user.orgId, resourceType] : [req.user.orgId];
  const { rows } = await db.query(
    `SELECT * FROM approval_templates WHERE org_id = $1 ${cond} ORDER BY name`,
    params
  );
  res.json({ templates: rows });
}));

router.post('/templates', asyncHandler(async (req, res) => {
  const { name, description, resourceType, steps } = req.body || {};
  if (!name?.trim() || !resourceType || !Array.isArray(steps) || !steps.length) {
    return res.status(400).json({ error: 'name, resourceType, and at least one step are required.' });
  }
  const { rows } = await db.query(
    `INSERT INTO approval_templates (org_id, name, description, resource_type, steps_json)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.orgId, name.trim(), description || null, resourceType, JSON.stringify(steps)]
  );
  res.status(201).json({ template: rows[0] });
}));

router.put('/templates/:id', asyncHandler(async (req, res) => {
  const { name, description, steps, isActive } = req.body || {};
  const updates = [];
  const params = [];
  let idx = 1;
  if (name !== undefined) { updates.push(`name = $${idx++}`); params.push(name); }
  if (description !== undefined) { updates.push(`description = $${idx++}`); params.push(description); }
  if (steps !== undefined) { updates.push(`steps_json = $${idx++}`); params.push(JSON.stringify(steps)); }
  if (isActive !== undefined) { updates.push(`is_active = $${idx++}`); params.push(isActive); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at = now()');
  params.push(req.params.id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE approval_templates SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
    params
  );
  if (!rows.length) return res.status(404).json({ error: 'Template not found.' });
  res.json({ template: rows[0] });
}));

router.delete('/templates/:id', asyncHandler(async (req, res) => {
  const { rowCount } = await db.query(
    `DELETE FROM approval_templates WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
}));

// ── Requests ──────────────────────────────────────────────────────────────────

router.get('/requests', asyncHandler(async (req, res) => {
  const { status, resourceType } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  if (resourceType) { conditions.push(`resource_type = $${idx++}`); params.push(resourceType); }
  // Show requests where user is submitter OR approver
  const { rows } = await db.query(
    `SELECT * FROM approval_requests WHERE ${conditions.join(' AND ')} ORDER BY submitted_at DESC`,
    params
  );
  // Attach steps for each
  const result = [];
  for (const r of rows) {
    const { rows: steps } = await db.query(
      `SELECT * FROM approval_steps WHERE request_id = $1 ORDER BY step_order`,
      [r.id]
    );
    const { rows: myPending } = await db.query(
      `SELECT s.id AS step_id FROM approval_steps s
       JOIN approval_actions a ON a.step_id = s.id AND a.user_id = $1
       WHERE s.request_id = $2`,
      [req.user.id, r.id]
    );
    result.push({ ...r, steps, myAction: myPending.length > 0 });
  }
  res.json({ requests: result });
}));

router.get('/requests/:id', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM approval_requests WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  const { rows: steps } = await db.query(
    `SELECT * FROM approval_steps WHERE request_id = $1 ORDER BY step_order`,
    [req.params.id]
  );
  const stepIds = steps.map((s) => s.id);
  const actions = stepIds.length
    ? (await db.query(
        `SELECT a.*, u.full_name FROM approval_actions a
         JOIN users u ON u.id = a.user_id
         WHERE a.step_id = ANY($1) ORDER BY a.created_at`,
        [stepIds]
      )).rows
    : [];
  res.json({ request: rows[0], steps, actions });
}));

// Submit a new approval request — optionally resolves an approval template
// to pre-populate steps, or accepts explicit steps.
router.post('/requests', asyncHandler(async (req, res) => {
  const { resourceType, resourceId, title, templateId, steps: explicitSteps } = req.body || {};
  if (!resourceType || !resourceId || !title?.trim()) {
    return res.status(400).json({ error: 'resourceType, resourceId, and title are required.' });
  }

  // Resolve steps from template or explicit
  let steps;
  if (templateId) {
    const { rows } = await db.query(
      `SELECT steps_json FROM approval_templates WHERE id = $1 AND org_id = $2`,
      [templateId, req.user.orgId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Template not found.' });
    steps = rows[0].steps_json;
  } else if (Array.isArray(explicitSteps) && explicitSteps.length) {
    steps = explicitSteps;
  } else {
    return res.status(400).json({ error: 'Provide templateId or steps.' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO approval_requests (org_id, template_id, resource_type, resource_id, title, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.orgId, templateId || null, resourceType, resourceId, title.trim(), req.user.id]
    );
    const request = rows[0];

    for (const step of steps) {
      const deadline = step.deadlineHours
        ? new Date(Date.now() + step.deadlineHours * 3600000)
        : null;
      await client.query(
        `INSERT INTO approval_steps (request_id, step_order, step_type, deadline_at)
         VALUES ($1, $2, $3, $4)`,
        [request.id, step.order, step.type || 'any', deadline]
      );
    }
    await client.query('COMMIT');
    // Notify approvers in the org
    notify(req.user.orgId, {
      type: 'approval_request',
      title: `Approval needed: ${request.title}`,
      body: `A ${resourceType} requires your approval.`,
      link: `/approvals/${request.id}`,
    });
    res.status(201).json({ request });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// ── Actions (approve/reject) ──────────────────────────────────────────────────

router.post('/requests/:id/action', asyncHandler(async (req, res) => {
  const { action, comment } = req.body || {};
  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'action must be "approve" or "reject".' });
  }

  // Find the current pending step for this user
  const { rows: request } = await db.query(
    `SELECT * FROM approval_requests WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!request.length) return res.status(404).json({ error: 'Request not found.' });
  if (request[0].status !== 'pending') {
    return res.status(400).json({ error: `Request already ${request[0].status}.` });
  }

  const { rows: pendingSteps } = await db.query(
    `SELECT * FROM approval_steps WHERE request_id = $1 AND status = 'pending' ORDER BY step_order LIMIT 1`,
    [req.params.id]
  );
  if (!pendingSteps.length) return res.status(400).json({ error: 'No pending steps.' });

  const step = pendingSteps[0];
  const { rows: existing } = await db.query(
    `SELECT * FROM approval_actions WHERE step_id = $1 AND user_id = $2`,
    [step.id, req.user.id]
  );
  if (existing.length) return res.status(400).json({ error: 'You already acted on this step.' });

  await db.query(
    `INSERT INTO approval_actions (step_id, user_id, action, comment) VALUES ($1, $2, $3, $4)`,
    [step.id, req.user.id, action, comment || null]
  );

  // Check if step is resolved
  if (action === 'reject' || step.step_type === 'any') {
    await db.query(`UPDATE approval_steps SET status = $1 WHERE id = $2`,
      [action === 'reject' ? 'rejected' : 'approved', step.id]);
    if (action === 'reject') {
      await db.query(
        `UPDATE approval_requests SET status = 'rejected', resolved_at = now(), resolved_by = $1 WHERE id = $2`,
        [req.user.id, req.params.id]
      );
      // Notify submitter
      const r = request[0];
      await pushInboxMessage(r.org_id, r.submitted_by, 'approval',
        `Request rejected: ${r.title}`, comment || null,
        `/approvals/${r.id}`, 'high');
      notify(r.org_id, {
        type: 'approval_rejected',
        title: `Request rejected: ${r.title}`,
        body: `${req.user.fullName || 'Someone'} rejected your approval request.`,
        link: `/approvals/${r.id}`,
      });
    } else {
      // Check if this was the last step
      const { rows: remaining } = await db.query(
        `SELECT id FROM approval_steps WHERE request_id = $1 AND status = 'pending'`,
        [req.params.id]
      );
      if (!remaining.length) {
        await db.query(
          `UPDATE approval_requests SET status = 'approved', resolved_at = now(), resolved_by = $1 WHERE id = $2`,
          [req.user.id, req.params.id]
        );
        // Notify submitter
        const r = request[0];
        await pushInboxMessage(r.org_id, r.submitted_by, 'approval',
          `Request approved: ${r.title}`, comment || null,
          `/approvals/${r.id}`, 'high');
        notify(r.org_id, {
          type: 'approval_approved',
          title: `Request approved: ${r.title}`,
          body: `Your approval request has been approved by ${req.user.fullName || 'someone'}.`,
          link: `/approvals/${r.id}`,
        });
      }
    }
  }

  // For 'all' type steps, check if everyone in the approver list has acted
  if (step.step_type === 'all') {
    const { rows: stepDef } = await db.query(
      `SELECT steps_json FROM approval_templates WHERE id = $1`,
      [request[0].template_id]
    );
    // Simplified: if all assigned users have approved, mark step complete
    const { rows: allActions } = await db.query(
      `SELECT DISTINCT user_id, action FROM approval_actions WHERE step_id = $1`,
      [step.id]
    );
    const anyReject = allActions.some((a) => a.action === 'reject');
    if (anyReject) {
      await db.query(`UPDATE approval_steps SET status = 'rejected' WHERE id = $1`, [step.id]);
      await db.query(`UPDATE approval_requests SET status = 'rejected', resolved_at = now(), resolved_by = $1 WHERE id = $2`,
        [req.user.id, req.params.id]);
    }
  }

  res.json({ ok: true, stepStatus: action === 'reject' ? 'rejected' : 'approved' });
}));

// Cancel a request (only the submitter)
router.post('/requests/:id/cancel', asyncHandler(async (req, res) => {
  const { rowCount } = await db.query(
    `UPDATE approval_requests SET status = 'cancelled', resolved_at = now(), resolved_by = $1
     WHERE id = $2 AND submitted_by = $1 AND status = 'pending'`,
    [req.user.id, req.params.id]
  );
  if (!rowCount) return res.status(400).json({ error: 'Cannot cancel — not your request or already resolved.' });
  res.json({ ok: true });
}));

router.post("/bulk-delete", bulkDeleteHandler("approval_templates"));
router.get("/export", async (req, res) => { const { rows } = await db.query("SELECT * FROM approval_templates WHERE org_id = $1", [req.user.orgId]); sendCsv(res, "approval_templates.csv", rows, autoColumns(rows)); });
router.get("/stats", async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total FROM approval_templates WHERE org_id = module.exports =", [req.user.orgId]); res.json({ stats: rows[0] }); });

module.exports = router;
