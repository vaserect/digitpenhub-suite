const db = require('../db');
const { sendMail } = require('../utils/mailer');
const { fetchWithTimeout } = require('../utils/aiReliability');

// Executes one automation step for real, same honesty rules as Workflow
// Automation's executeStep: only claim "ok" for a step that actually did
// something. wait_days isn't an action to execute, it's a time-gate the
// poller checks separately (see advanceEnrollments below).
async function runStep(step, enrollment, orgId) {
  const cfg = step.config || {};
  switch (step.step_type) {
    case 'send_email': {
      if (!cfg.subject || !cfg.body) return { ok: false, note: 'No subject/body configured — nothing sent.' };
      const result = await sendMail({ to: enrollment.contact_email, subject: cfg.subject, html: cfg.body });
      return result.ok ? { ok: true, note: `Email sent to ${enrollment.contact_email}.` } : { ok: false, note: `Send failed: ${result.error}` };
    }
    case 'add_tag': {
      if (!cfg.tag) return { ok: false, note: 'No tag configured.' };
      await db.query(
        `INSERT INTO automation_contact_tags (org_id, contact_email, tag) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [orgId, enrollment.contact_email, cfg.tag]
      );
      return { ok: true, note: `Tagged "${cfg.tag}".` };
    }
    case 'remove_tag': {
      if (!cfg.tag) return { ok: false, note: 'No tag configured.' };
      await db.query(`DELETE FROM automation_contact_tags WHERE org_id=$1 AND contact_email=$2 AND tag=$3`, [orgId, enrollment.contact_email, cfg.tag]);
      return { ok: true, note: `Removed tag "${cfg.tag}".` };
    }
    case 'add_to_list': {
      if (!cfg.listId) return { ok: false, note: 'No list selected.' };
      const list = await db.query(`SELECT id FROM email_lists WHERE id=$1 AND org_id=$2`, [cfg.listId, orgId]);
      if (!list.rows.length) return { ok: false, note: 'List not found.' };
      await db.query(
        `INSERT INTO email_subscribers (list_id, org_id, email, name) VALUES ($1,$2,$3,$4) ON CONFLICT (list_id, email) DO NOTHING`,
        [cfg.listId, orgId, enrollment.contact_email, enrollment.contact_name || null]
      );
      return { ok: true, note: 'Added to email list.' };
    }
    case 'webhook': {
      if (!cfg.url) return { ok: false, note: 'No URL configured.' };
      try {
        const res = await fetchWithTimeout(cfg.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactEmail: enrollment.contact_email, contactName: enrollment.contact_name }),
        }, 10000);
        return { ok: res.ok, note: `POST ${cfg.url} → ${res.status}` };
      } catch (err) {
        return { ok: false, note: `Request failed: ${err.message}` };
      }
    }
    default:
      return { ok: true, note: 'Unrecognized step — skipped.' };
  }
}

// The real engine: called on an interval (see backend/src/utils/automationScheduler.js).
// For every active enrollment, checks whether its current step is a
// wait_days gate that hasn't elapsed yet (skip it this tick), otherwise
// runs the step for real and advances to the next one. One step per
// enrollment per tick — keeps each tick fast and gives natural pacing
// instead of an enrollment racing through 10 steps in one call.
async function advanceEnrollments() {
  const { rows: enrollments } = await db.query(
    `SELECT ae.* FROM automation_enrollments ae
     JOIN automation_workflows aw ON aw.id = ae.workflow_id
     WHERE ae.status = 'active' AND aw.status = 'active'`
  );
  for (const enrollment of enrollments) {
    try {
      const { rows: steps } = await db.query(
        `SELECT * FROM automation_steps WHERE workflow_id=$1 ORDER BY step_order`,
        [enrollment.workflow_id]
      );
      if (enrollment.current_step >= steps.length) {
        await db.query(`UPDATE automation_enrollments SET status='completed', updated_at=now() WHERE id=$1`, [enrollment.id]);
        continue;
      }
      const step = steps[enrollment.current_step];

      if (step.step_type === 'wait_days') {
        const days = Number(step.config?.days) || 0;
        const elapsedMs = Date.now() - new Date(enrollment.current_step_started_at).getTime();
        if (elapsedMs < days * 24 * 60 * 60 * 1000) continue; // not yet — check again next tick
        await db.query(
          `UPDATE automation_enrollments SET current_step=current_step+1, current_step_started_at=now(), updated_at=now() WHERE id=$1`,
          [enrollment.id]
        );
        continue;
      }

      const result = await runStep(step, enrollment, enrollment.org_id);
      await db.query(
        `INSERT INTO automation_step_runs (enrollment_id, step_id, step_type, ok, note) VALUES ($1,$2,$3,$4,$5)`,
        [enrollment.id, step.id, step.step_type, result.ok, result.note]
      );
      await db.query(
        `UPDATE automation_enrollments SET current_step=current_step+1, current_step_started_at=now(), updated_at=now() WHERE id=$1`,
        [enrollment.id]
      );
    } catch (err) {
      console.error(`automation enrollment ${enrollment.id} failed:`, err.message);
    }
  }
}

async function listStepRuns(req, res) {
  const { enrollmentId } = req.params;
  const enr = await db.query(`SELECT id FROM automation_enrollments WHERE id=$1 AND org_id=$2`, [enrollmentId, req.user.orgId]);
  if (!enr.rows.length) return res.status(404).json({ error: 'Enrollment not found.' });
  const { rows } = await db.query(`SELECT * FROM automation_step_runs WHERE enrollment_id=$1 ORDER BY ran_at DESC`, [enrollmentId]);
  res.json({ runs: rows });
}

async function getStats(req, res) {
  const [wfRes, enrRes] = await Promise.all([
    db.query(`SELECT status, COUNT(*)::int AS c FROM automation_workflows WHERE org_id=$1 GROUP BY status`, [req.user.orgId]),
    db.query(`SELECT status, COUNT(*)::int AS c FROM automation_enrollments WHERE org_id=$1 GROUP BY status`, [req.user.orgId]),
  ]);
  const wf  = Object.fromEntries(wfRes.rows.map((r) => [r.status, r.c]));
  const enr = Object.fromEntries(enrRes.rows.map((r) => [r.status, r.c]));
  res.json({ workflows: wf, enrollments: enr });
}

// ── Workflows ─────────────────────────────────────────────────────────────────

async function listWorkflows(req, res) {
  const { rows } = await db.query(
    `SELECT aw.*, COUNT(ae.id)::int AS enrollment_count
     FROM automation_workflows aw
     LEFT JOIN automation_enrollments ae ON ae.workflow_id = aw.id
     WHERE aw.org_id = $1
     GROUP BY aw.id ORDER BY aw.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ workflows: rows });
}

async function createWorkflow(req, res) {
  const { name, triggerType, triggerConfig, status } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO automation_workflows (org_id, name, trigger_type, trigger_config, status) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, name.trim(), triggerType || 'manual', triggerConfig || {}, status || 'draft']
  );
  res.status(201).json({ workflow: rows[0] });
}

async function updateWorkflow(req, res) {
  const { id } = req.params;
  const { name, triggerType, triggerConfig, status } = req.body || {};
  const updates = []; const vals = []; let i = 1;
  if (name        !== undefined) { updates.push(`name=$${i++}`);          vals.push(name.trim()); }
  if (triggerType !== undefined) { updates.push(`trigger_type=$${i++}`);  vals.push(triggerType); }
  if (triggerConfig!==undefined) { updates.push(`trigger_config=$${i++}`);vals.push(JSON.stringify(triggerConfig)); }
  if (status      !== undefined) { updates.push(`status=$${i++}`);        vals.push(status); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE automation_workflows SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Workflow not found.' });
  res.json({ workflow: rows[0] });
}

async function deleteWorkflow(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(`DELETE FROM automation_workflows WHERE id=$1 AND org_id=$2`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Workflow not found.' });
  res.json({ ok: true });
}

// ── Steps ─────────────────────────────────────────────────────────────────────

async function listSteps(req, res) {
  const { workflowId } = req.params;
  const wf = await db.query(`SELECT id FROM automation_workflows WHERE id=$1 AND org_id=$2`, [workflowId, req.user.orgId]);
  if (!wf.rows.length) return res.status(404).json({ error: 'Workflow not found.' });
  const { rows } = await db.query(`SELECT * FROM automation_steps WHERE workflow_id=$1 ORDER BY step_order`, [workflowId]);
  res.json({ steps: rows });
}

async function createStep(req, res) {
  const { workflowId } = req.params;
  const { stepType, config } = req.body || {};
  if (!stepType) return res.status(400).json({ error: 'stepType is required.' });
  const wf = await db.query(`SELECT id FROM automation_workflows WHERE id=$1 AND org_id=$2`, [workflowId, req.user.orgId]);
  if (!wf.rows.length) return res.status(404).json({ error: 'Workflow not found.' });
  const maxRes = await db.query(`SELECT COALESCE(MAX(step_order),0) AS m FROM automation_steps WHERE workflow_id=$1`, [workflowId]);
  const nextOrder = Number(maxRes.rows[0].m) + 1;
  const { rows } = await db.query(
    `INSERT INTO automation_steps (workflow_id, step_order, step_type, config) VALUES ($1,$2,$3,$4) RETURNING *`,
    [workflowId, nextOrder, stepType, config || {}]
  );
  res.status(201).json({ step: rows[0] });
}

async function updateStep(req, res) {
  const { id } = req.params;
  const { stepType, config, stepOrder } = req.body || {};
  const updates = []; const vals = []; let i = 1;
  if (stepType  !== undefined) { updates.push(`step_type=$${i++}`);  vals.push(stepType); }
  if (config    !== undefined) { updates.push(`config=$${i++}`);     vals.push(JSON.stringify(config)); }
  if (stepOrder !== undefined) { updates.push(`step_order=$${i++}`); vals.push(Number(stepOrder)); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id);
  const { rows } = await db.query(`UPDATE automation_steps SET ${updates.join(',')} WHERE id=$${i} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Step not found.' });
  res.json({ step: rows[0] });
}

async function deleteStep(req, res) {
  const { id } = req.params;
  await db.query(`DELETE FROM automation_steps WHERE id=$1`, [id]);
  res.json({ ok: true });
}

// ── Enrollments ───────────────────────────────────────────────────────────────

async function listEnrollments(req, res) {
  const { workflowId } = req.query;
  const params = [req.user.orgId];
  let where = 'WHERE ae.org_id=$1';
  if (workflowId) { where += ` AND ae.workflow_id=$2`; params.push(workflowId); }
  const { rows } = await db.query(
    `SELECT ae.*, aw.name AS workflow_name FROM automation_enrollments ae
     JOIN automation_workflows aw ON aw.id=ae.workflow_id
     ${where} ORDER BY ae.enrolled_at DESC LIMIT 200`,
    params
  );
  res.json({ enrollments: rows });
}

async function createEnrollment(req, res) {
  const { workflowId, contactEmail, contactName } = req.body || {};
  if (!workflowId)     return res.status(400).json({ error: 'workflowId is required.' });
  if (!contactEmail?.trim()) return res.status(400).json({ error: 'contactEmail is required.' });
  const wf = await db.query(`SELECT id FROM automation_workflows WHERE id=$1 AND org_id=$2`, [workflowId, req.user.orgId]);
  if (!wf.rows.length) return res.status(404).json({ error: 'Workflow not found.' });
  const { rows } = await db.query(
    `INSERT INTO automation_enrollments (org_id, workflow_id, contact_email, contact_name) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, workflowId, contactEmail.trim(), contactName?.trim() || null]
  );
  res.status(201).json({ enrollment: rows[0] });
}

async function updateEnrollment(req, res) {
  const { id } = req.params;
  const { status, currentStep } = req.body || {};
  const updates = []; const vals = []; let i = 1;
  if (status      !== undefined) { updates.push(`status=$${i++}`);       vals.push(status); }
  if (currentStep !== undefined) { updates.push(`current_step=$${i++}`); vals.push(Number(currentStep)); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push(`updated_at=now()`);
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE automation_enrollments SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals
  );
  if (!rows.length) return res.status(404).json({ error: 'Enrollment not found.' });
  res.json({ enrollment: rows[0] });
}

async function deleteEnrollment(req, res) {
  const { id } = req.params;
  await db.query(`DELETE FROM automation_enrollments WHERE id=$1 AND org_id=$2`, [id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = {
  getStats,
  listWorkflows, createWorkflow, updateWorkflow, deleteWorkflow,
  listSteps, createStep, updateStep, deleteStep,
  listEnrollments, createEnrollment, updateEnrollment, deleteEnrollment,
  listStepRuns, advanceEnrollments,
};
