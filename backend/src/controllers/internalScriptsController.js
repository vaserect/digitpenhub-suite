const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');
const { spawn } = require('child_process');

exports.list = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, description, language, is_active, last_run_at, last_run_status, created_at FROM internal_scripts WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  res.json({ scripts: rows });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, description, language, sourceCode, timeoutSec } = req.body;
  if (!name || !sourceCode) return res.status(400).json({ error: 'name and sourceCode are required' });
  const { rows } = await db.query(
    `INSERT INTO internal_scripts (org_id, name, description, language, source_code, timeout_sec, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.orgId, name, description || null, language || 'javascript', sourceCode, timeoutSec || 30, req.user.id]
  );
  res.status(201).json({ script: rows[0] });
});

exports.getById = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM internal_scripts WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rows[0]) return res.status(404).json({ error: 'Script not found' });
  res.json({ script: rows[0] });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, description, sourceCode, timeoutSec, isActive } = req.body;
  const { rows } = await db.query(
    `UPDATE internal_scripts SET name = COALESCE($1, name), description = COALESCE($2, description),
     source_code = COALESCE($3, source_code), timeout_sec = COALESCE($4, timeout_sec),
     is_active = COALESCE($5, is_active), updated_at = NOW()
     WHERE id = $6 AND org_id = $7 RETURNING *`,
    [name, description, sourceCode, timeoutSec, isActive, req.params.id, req.user.orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Script not found' });
  res.json({ script: rows[0] });
});

exports.remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM internal_scripts WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Script not found' });
  res.json({ ok: true });
});

exports.run = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM internal_scripts WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rows[0]) return res.status(404).json({ error: 'Script not found' });
  const script = rows[0];

  // Execute in a sandboxed child process
  const startTime = Date.now();
  let stdout = '', stderr = '';

  try {
    const child = spawn('node', ['-e', script.source_code], {
      timeout: (script.timeout_sec || 30) * 1000,
      env: { PATH: process.env.PATH }
    });

    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());

    await new Promise((resolve, reject) => {
      child.on('close', async (code) => {
        const duration = Date.now() - startTime;
        const status = code === 0 ? 'success' : 'error';
        await db.query(
          `INSERT INTO script_executions (script_id, triggered_by, status, output, error_output, duration_ms, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [script.id, req.user.id, status, stdout, stderr, duration]
        );
        await db.query(
          `UPDATE internal_scripts SET last_run_at = NOW(), last_run_status = $1 WHERE id = $2`,
          [status, script.id]
        );
        resolve();
      });
      child.on('error', reject);
    });

    res.json({ output: stdout, error: stderr });
  } catch (err) {
    await db.query(
      `INSERT INTO script_executions (script_id, triggered_by, status, output, error_output, duration_ms, completed_at)
       VALUES ($1, $2, 'error', $3, $4, $5, NOW())`,
      [script.id, req.user.id, stdout, err.message, Date.now() - startTime]
    );
    res.status(500).json({ error: err.message, output: stdout });
  }
});

exports.getExecutions = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT se.*, u.email as triggered_by_email FROM script_executions se
     LEFT JOIN users u ON u.id = se.triggered_by
     WHERE se.script_id = $1 ORDER BY se.started_at DESC LIMIT 20`,
    [req.params.id]
  );
  res.json({ executions: rows });
});
