const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const fs = require('fs');
const path = require('path');

const EXPORTS_DIR = path.join(__dirname, '../../exports');
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM export_jobs WHERE org_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [req.user.orgId]
  );
  res.json({ exports: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { resourceTypes, format } = req.body || {};
  if (!Array.isArray(resourceTypes) || !resourceTypes.length) {
    return res.status(400).json({ error: 'At least one resourceType is required.' });
  }

  const { rows } = await db.query(
    `INSERT INTO export_jobs (org_id, requested_by, resource_types, format)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.orgId, req.user.id, resourceTypes, format || 'csv']
  );
  const job = rows[0];

  // Generate export asynchronously
  generateExport(job).catch(() => {});

  res.status(201).json({ job });
}));

async function generateExport(job) {
  const types = job.resource_types;
  const lines = [];

  for (const t of types) {
    try {
      let rows;
      switch (t) {
        case 'contacts':
          ({ rows } = await db.query('SELECT full_name, email, company, stage, value_ngn FROM contacts WHERE org_id = $1', [job.org_id]));
          break;
        case 'invoices':
          ({ rows } = await db.query('SELECT invoice_number, status, total, created_at FROM invoices WHERE org_id = $1', [job.org_id]));
          break;
        case 'projects':
          ({ rows } = await db.query('SELECT name, status, created_at FROM projects WHERE org_id = $1', [job.org_id]));
          break;
        default:
          continue;
      }
      if (rows.length) {
        if (lines.length) lines.push('');
        lines.push(`# ${t.toUpperCase()}`);
        lines.push(Object.keys(rows[0]).join(','));
        for (const r of rows) {
          lines.push(Object.values(r).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
        }
      }
    } catch {}
  }

  if (lines.length) {
    const output = lines.join('\n');
    const filePath = path.join(EXPORTS_DIR, `export-${job.id}.${job.format}`);
    fs.writeFileSync(filePath, output);
    const stats = fs.statSync(filePath);

    await db.query(
      `UPDATE export_jobs SET status = 'completed', file_path = $1, file_size = $2, completed_at = now()
       WHERE id = $3`,
      [filePath, stats.size, job.id]
    );
  } else {
    await db.query(
      `UPDATE export_jobs SET status = 'failed', completed_at = now() WHERE id = $1`,
      [job.id]
    );
  }
}

module.exports = router;
