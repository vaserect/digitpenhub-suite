const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const { sendMail } = require('../utils/mailer');
const { notify } = require('../utils/notify');
const { fetchWithTimeout } = require('../utils/aiReliability');
const { sendSms, smsProviderConfigured } = require('../utils/messagingProviders');

const r = Router();
r.use(requireAuth);

// Executes one workflow step for real where the platform has a real
// integration to do it with, rather than simulating every step regardless.
// send_sms and condition are honestly reported as simulated (see result.note)
// since there's no SMS provider wired up anywhere in the app yet, and a
// manual "Run Now" has no real trigger payload to branch a condition on.
async function executeStep(step, orgId) {
  const cfg = step.config || {};
  switch (step.type) {
    case 'send_email': {
      if (!cfg.to) return { ok: false, note: 'No recipient configured — nothing sent.' };
      const result = await sendMail({ to: cfg.to, subject: cfg.subject || step.name || 'Workflow notification', html: cfg.body || '' });
      return result.ok ? { ok: true, note: `Email sent to ${cfg.to}.` } : { ok: false, note: `Send failed: ${result.error}` };
    }
    case 'send_notification': {
      await notify(orgId, { type: 'workflow', title: step.name || 'Workflow notification', body: cfg.message || '' });
      return { ok: true, note: 'In-app notification created for org admins.' };
    }
    case 'http_request': {
      if (!cfg.url) return { ok: false, note: 'No URL configured — nothing sent.' };
      try {
        const res = await fetchWithTimeout(cfg.url, { method: cfg.method || 'POST' }, 10000);
        return { ok: res.ok, note: `${cfg.method || 'POST'} ${cfg.url} → ${res.status}` };
      } catch (err) {
        return { ok: false, note: `Request failed: ${err.message}` };
      }
    }
    case 'create_task': {
      if (!cfg.title) return { ok: false, note: 'No task title configured — nothing created.' };
      await db.query(
        `INSERT INTO task_items (org_id, title, status, priority) VALUES ($1,$2,'todo','medium')`,
        [orgId, cfg.title]
      );
      return { ok: true, note: `Task "${cfg.title}" created.` };
    }
    case 'update_crm': {
      if (!cfg.contactId || !cfg.stage) return { ok: false, note: 'No contact/stage configured — nothing updated.' };
      const { rowCount } = await db.query(
        `UPDATE contacts SET stage=$1, updated_at=now() WHERE id=$2 AND org_id=$3`,
        [cfg.stage, cfg.contactId, orgId]
      );
      return rowCount ? { ok: true, note: `Contact moved to "${cfg.stage}".` } : { ok: false, note: 'Contact not found.' };
    }
    case 'send_sms': {
      if (!smsProviderConfigured()) {
        return { ok: true, simulated: true, note: 'Simulated — no SMS provider is configured yet, see .env for TERMII_API_KEY.' };
      }
      const to = cfg.to;
      if (!to) return { ok: false, note: 'No recipient configured — nothing sent.' };
      const result = await sendSms({ to, message: cfg.body || '' });
      return result.ok
        ? { ok: true, note: `SMS sent to ${to}.` }
        : { ok: false, note: `SMS failed: ${result.error}` };
    }
    case 'condition':
      return { ok: true, simulated: true, note: 'Simulated — a manual "Run Now" has no real trigger data to branch on.' };
    case 'delay':
      await new Promise((resolve) => setTimeout(resolve, 150));
      return { ok: true, note: cfg.minutes ? `Would wait ${cfg.minutes} minute(s) in a real trigger run.` : 'No delay configured.' };
    default:
      return { ok: true, note: 'Unrecognized step type — skipped.' };
  }
}

// ── Workflows ─────────────────────────────────────────────────────────────────

r.get('/', async (req, res) => {
  const { rows } = await db.query(
    `SELECT w.*,
       (SELECT COUNT(*) FROM workflow_runs wr WHERE wr.workflow_id = w.id) AS total_runs,
       (SELECT COUNT(*) FROM workflow_runs wr WHERE wr.workflow_id = w.id AND wr.status = 'success') AS success_runs
     FROM workflows w WHERE w.org_id = $1 ORDER BY w.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ workflows: rows });
});

r.post('/', async (req, res) => {
  const { name, description, triggerType, triggerConfig, steps } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO workflows (org_id, name, description, trigger_type, trigger_config, steps)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.user.orgId, name.trim(), description || '', triggerType || 'manual', JSON.stringify(triggerConfig || {}), JSON.stringify(steps || [])]
  );
  res.status(201).json({ workflow: rows[0] });
});

r.put('/:id', async (req, res) => {
  const { name, description, triggerType, triggerConfig, steps, isActive } = req.body || {};
  const { rows } = await db.query(
    `UPDATE workflows SET name=$1, description=$2, trigger_type=$3, trigger_config=$4, steps=$5, is_active=$6
     WHERE id=$7 AND org_id=$8 RETURNING *`,
    [name, description, triggerType, JSON.stringify(triggerConfig || {}), JSON.stringify(steps || []), isActive ?? true, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ workflow: rows[0] });
});

r.delete('/:id', async (req, res) => {
  await db.query(`DELETE FROM workflows WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
});

// ── Run a workflow manually ───────────────────────────────────────────────────

r.post('/:id/run', async (req, res) => {
  const { rows: wRows } = await db.query(
    `SELECT * FROM workflows WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]
  );
  if (!wRows.length) return res.status(404).json({ error: 'Not found.' });
  const wf = wRows[0];
  const steps = Array.isArray(wf.steps) ? wf.steps : [];

  const log = [];
  const started = new Date();
  let status = 'success';

  for (const step of steps) {
    const entry = { step: step.name || step.type, startedAt: new Date().toISOString() };
    try {
      entry.result = await executeStep(step, req.user.orgId);
      if (entry.result.ok === false) status = 'failed';
    } catch (err) {
      entry.result = { ok: false, note: `Unexpected error: ${err.message}` };
      status = 'failed';
    }
    entry.finishedAt = new Date().toISOString();
    log.push(entry);
  }

  const { rows: runRows } = await db.query(
    `INSERT INTO workflow_runs (workflow_id, status, started_at, finished_at, log)
     VALUES ($1, $2, $3, NOW(), $4) RETURNING *`,
    [req.params.id, status, started.toISOString(), JSON.stringify(log)]
  );
  await db.query(
    `UPDATE workflows SET run_count = run_count + 1, last_run_at = NOW() WHERE id = $1`,
    [req.params.id]
  );
  res.json({ run: runRows[0], log });
});

// ── Run history ───────────────────────────────────────────────────────────────

r.get('/:id/runs', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM workflow_runs WHERE workflow_id = $1 ORDER BY started_at DESC LIMIT 20`,
    [req.params.id]
  );
  res.json({ runs: rows });
});

module.exports = r;
