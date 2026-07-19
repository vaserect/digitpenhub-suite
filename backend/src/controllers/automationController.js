const db = require('../db');
const { sendMail } = require('../utils/mailer');
const { fetchWithTimeout } = require('../utils/aiReliability');
const MarketingAutomationService = require('../services/MarketingAutomationService');

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
  // Use new MarketingAutomationService for cross-channel support
  return await MarketingAutomationService.advanceEnrollments();
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
  const idParam = i;
  const orgParam = i + 1;
  const { rows } = await db.query(`UPDATE automation_workflows SET ${updates.join(',')} WHERE id=$${idParam} AND org_id=$${orgParam} RETURNING *`, vals);
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

// ── Templates ─────────────────────────────────────────────────────────────────

async function listTemplates(req, res) {
  const { category } = req.query;
  let query = `SELECT * FROM automation_templates WHERE is_system = true`;
  const params = [];
  
  if (category) {
    query += ` AND category = $1`;
    params.push(category);
  }
  
  query += ` ORDER BY usage_count DESC, name ASC`;
  
  const { rows } = await db.query(query, params);
  res.json({ templates: rows });
}

async function getTemplate(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `SELECT * FROM automation_templates WHERE id = $1`,
    [id]
  );
  
  if (!rows.length) return res.status(404).json({ error: 'Template not found.' });
  res.json({ template: rows[0] });
}

async function createFromTemplate(req, res) {
  const { templateId, name } = req.body;
  
  if (!templateId) return res.status(400).json({ error: 'templateId is required.' });
  
  const { rows: templates } = await db.query(
    `SELECT * FROM automation_templates WHERE id = $1`,
    [templateId]
  );
  
  if (!templates.length) return res.status(404).json({ error: 'Template not found.' });
  
  const template = templates[0];
  
  // Create workflow from template
  const { rows: workflows } = await db.query(
    `INSERT INTO automation_workflows (
      org_id, name, trigger_type, trigger_config, status, 
      goal_type, goal_config, category, template_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      req.user.orgId,
      name || template.name,
      template.trigger_type,
      template.trigger_config,
      'draft',
      template.goal_type,
      template.goal_config,
      template.category,
      templateId
    ]
  );
  
  const workflow = workflows[0];
  
  // Create steps from template
  const stepsConfig = template.steps_config;
  for (const stepConfig of stepsConfig) {
    await db.query(
      `INSERT INTO automation_steps (
        workflow_id, step_order, step_type, config, channel,
        condition_type, condition_config, lead_score_change
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        workflow.id,
        stepConfig.step_order,
        stepConfig.step_type,
        stepConfig.config || {},
        stepConfig.channel || 'email',
        stepConfig.condition_type,
        stepConfig.condition_config || {},
        stepConfig.lead_score_change || 0
      ]
    );
  }
  
  // Update template usage count
  await db.query(
    `UPDATE automation_templates SET usage_count = usage_count + 1 WHERE id = $1`,
    [templateId]
  );
  
  res.status(201).json({ workflow });
}

// ── Triggers ──────────────────────────────────────────────────────────────────

async function createTrigger(req, res) {
  const { workflowId, contactEmail, contactPhone, triggerData } = req.body;
  
  if (!workflowId || !contactEmail) {
    return res.status(400).json({ error: 'workflowId and contactEmail are required.' });
  }
  
  const { rows } = await db.query(
    `INSERT INTO automation_triggers (
      org_id, workflow_id, trigger_type, contact_email, contact_phone, trigger_data
    )
    SELECT $1, $2, trigger_type, $3, $4, $5
    FROM automation_workflows
    WHERE id = $2 AND org_id = $1
    RETURNING *`,
    [req.user.orgId, workflowId, contactEmail, contactPhone, triggerData || {}]
  );
  
  if (!rows.length) return res.status(404).json({ error: 'Workflow not found.' });
  
  res.status(201).json({ trigger: rows[0] });
}

async function processTriggers(req, res) {
  const results = await MarketingAutomationService.processTriggers();
  res.json({ results, processed: results.length });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

async function getWorkflowAnalytics(req, res) {
  const { workflowId } = req.params;
  const { startDate, endDate } = req.query;
  
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];
  
  const analytics = await MarketingAutomationService.getAnalytics(
    workflowId,
    req.user.orgId,
    start,
    end
  );
  
  const summary = await MarketingAutomationService.getWorkflowSummary(
    workflowId,
    req.user.orgId
  );
  
  res.json({ analytics, summary });
}

async function getWorkflowSummary(req, res) {
  const { workflowId } = req.params;
  
  const summary = await MarketingAutomationService.getWorkflowSummary(
    workflowId,
    req.user.orgId
  );
  
  res.json({ summary });
}

// ── Goals ─────────────────────────────────────────────────────────────────────

async function createGoal(req, res) {
  const { workflowId } = req.params;
  const { goalType, goalConfig } = req.body;
  
  if (!goalType || !goalConfig) {
    return res.status(400).json({ error: 'goalType and goalConfig are required.' });
  }
  
  // Verify workflow exists
  const wf = await db.query(
    `SELECT id FROM automation_workflows WHERE id = $1 AND org_id = $2`,
    [workflowId, req.user.orgId]
  );
  
  if (!wf.rows.length) return res.status(404).json({ error: 'Workflow not found.' });
  
  const { rows } = await db.query(
    `INSERT INTO automation_goals (workflow_id, goal_type, goal_config)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [workflowId, goalType, goalConfig]
  );
  
  res.status(201).json({ goal: rows[0] });
}

async function listGoals(req, res) {
  const { workflowId } = req.params;
  
  const { rows } = await db.query(
    `SELECT ag.* FROM automation_goals ag
     JOIN automation_workflows aw ON aw.id = ag.workflow_id
     WHERE ag.workflow_id = $1 AND aw.org_id = $2`,
    [workflowId, req.user.orgId]
  );
  
  res.json({ goals: rows });
}

// ── Split Tests ───────────────────────────────────────────────────────────────

async function createSplitTest(req, res) {
  const { stepId } = req.params;
  const { variantAName, variantBName, variantAConfig, variantBConfig, splitPercentage } = req.body;
  
  if (!variantAName || !variantBName || !variantAConfig || !variantBConfig) {
    return res.status(400).json({ error: 'All variant details are required.' });
  }
  
  // Get step and verify ownership
  const { rows: steps } = await db.query(
    `SELECT s.*, w.org_id FROM automation_steps s
     JOIN automation_workflows w ON w.id = s.workflow_id
     WHERE s.id = $1 AND w.org_id = $2`,
    [stepId, req.user.orgId]
  );
  
  if (!steps.length) return res.status(404).json({ error: 'Step not found.' });
  
  const { rows } = await db.query(
    `INSERT INTO automation_split_tests (
      workflow_id, step_id, variant_a_name, variant_b_name,
      variant_a_config, variant_b_config, split_percentage
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      steps[0].workflow_id, stepId, variantAName, variantBName,
      variantAConfig, variantBConfig, splitPercentage || 50
    ]
  );
  
  res.status(201).json({ splitTest: rows[0] });
}

async function getSplitTestResults(req, res) {
  const { stepId } = req.params;
  
  const { rows } = await db.query(
    `SELECT st.* FROM automation_split_tests st
     JOIN automation_steps s ON s.id = st.step_id
     JOIN automation_workflows w ON w.id = s.workflow_id
     WHERE st.step_id = $1 AND w.org_id = $2`,
    [stepId, req.user.orgId]
  );
  
  if (!rows.length) return res.status(404).json({ error: 'Split test not found.' });
  
  const test = rows[0];
  
  // Calculate conversion rates
  test.variant_a_conversion_rate = test.variant_a_count > 0
    ? ((test.variant_a_goal_achieved / test.variant_a_count) * 100).toFixed(2)
    : 0;
  
  test.variant_b_conversion_rate = test.variant_b_count > 0
    ? ((test.variant_b_goal_achieved / test.variant_b_count) * 100).toFixed(2)
    : 0;
  
  res.json({ splitTest: test });
}

// ── Contact Tags ──────────────────────────────────────────────────────────────

async function getContactTags(req, res) {
  const { contactEmail } = req.params;
  
  const { rows } = await db.query(
    `SELECT * FROM automation_contact_tags 
     WHERE org_id = $1 AND contact_email = $2
     ORDER BY created_at DESC`,
    [req.user.orgId, contactEmail]
  );
  
  res.json({ tags: rows });
}

async function addContactTag(req, res) {
  const { contactEmail } = req.params;
  const { tag } = req.body;
  
  if (!tag) return res.status(400).json({ error: 'tag is required.' });
  
  const { rows } = await db.query(
    `INSERT INTO automation_contact_tags (org_id, contact_email, tag, source)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (org_id, contact_email, tag) DO NOTHING
     RETURNING *`,
    [req.user.orgId, contactEmail, tag, 'manual']
  );
  
  res.status(201).json({ tag: rows[0] || { tag, message: 'Tag already exists' } });
}

async function removeContactTag(req, res) {
  const { contactEmail, tag } = req.params;
  
  await db.query(
    `DELETE FROM automation_contact_tags 
     WHERE org_id = $1 AND contact_email = $2 AND tag = $3`,
    [req.user.orgId, contactEmail, tag]
  );
  
  res.json({ ok: true });
}

// ── Lead Scoring ──────────────────────────────────────────────────────────────

async function getLeadScoreHistory(req, res) {
  const { contactEmail } = req.params;
  const { limit = 50 } = req.query;
  
  const { rows } = await db.query(
    `SELECT * FROM automation_lead_scores
     WHERE org_id = $1 AND contact_email = $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [req.user.orgId, contactEmail, limit]
  );
  
  res.json({ history: rows });
}

async function updateLeadScore(req, res) {
  const { contactEmail } = req.params;
  const { scoreChange, reason } = req.body;
  
  if (!scoreChange) return res.status(400).json({ error: 'scoreChange is required.' });
  
  // Get current score
  const { rows: scores } = await db.query(
    `SELECT COALESCE(SUM(score_change), 0) as total_score
     FROM automation_lead_scores
     WHERE org_id = $1 AND contact_email = $2`,
    [req.user.orgId, contactEmail]
  );
  
  const previousScore = parseInt(scores[0].total_score);
  const newScore = previousScore + scoreChange;
  
  const { rows } = await db.query(
    `INSERT INTO automation_lead_scores (
      org_id, contact_email, score_change, reason, previous_score, new_score
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [req.user.orgId, contactEmail, scoreChange, reason || 'Manual update', previousScore, newScore]
  );
  
  res.status(201).json({ scoreUpdate: rows[0] });
}

module.exports = {
  getStats,
  listWorkflows, createWorkflow, updateWorkflow, deleteWorkflow,
  listSteps, createStep, updateStep, deleteStep,
  listEnrollments, createEnrollment, updateEnrollment, deleteEnrollment,
  listStepRuns, advanceEnrollments,
  // New endpoints
  listTemplates, getTemplate, createFromTemplate,
  createTrigger, processTriggers,
  getWorkflowAnalytics, getWorkflowSummary,
  createGoal, listGoals,
  createSplitTest, getSplitTestResults,
  getContactTags, addContactTag, removeContactTag,
  getLeadScoreHistory, updateLeadScore,
};
