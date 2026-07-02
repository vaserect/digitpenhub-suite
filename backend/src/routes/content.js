const { Router } = require('express');
const db = require('../db');

const router = Router();

// Public, no auth — the marketing homepage and footer read their editable
// copy from here. Scoped to explicit public sections only, never the whole
// site_content table, so this endpoint can't accidentally expose a section
// meant for an internal/gated surface later.
const PUBLIC_SECTIONS = ['homepage', 'footer'];

router.get('/public', async (req, res) => {
  const { rows } = await db.query(
    `SELECT content_key, content_value, content_type FROM site_content WHERE section = ANY($1)`,
    [PUBLIC_SECTIONS]
  );
  const content = {};
  for (const row of rows) content[row.content_key] = row.content_value;
  res.json({ content });
});

module.exports = router;
