const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');
const aiRouter = require('../ai-router');

exports.list = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM ai_writer WHERE org_id = $1 ORDER BY created_at DESC LIMIT 100', [req.user.orgId]);
  res.json({ items: rows });
});
exports.create = asyncHandler(async (req, res) => {
  const { rows } = await db.query('INSERT INTO ai_writer (org_id, data) VALUES ($1, $2) RETURNING *', [req.user.orgId, JSON.stringify(req.body || {})]);
  res.status(201).json({ item: rows[0] });
});
exports.generate = asyncHandler(async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt?.trim()) return res.status(400).json({ error: 'prompt is required.' });
  try {
    const result = await aiRouter.generate({ moduleKey: 'ai-writer', messages: [{ role: 'system', content: 'You are a helpful AI assistant for Digitpen Hub.' }, { role: 'user', content: prompt.trim() }], opts: { maxTokens: 800, temperature: 0.7 } });
    res.json({ content: result.text, meta: { provider: result.provider, model: result.model, chain: result.chain } });
  } catch (err) {
    console.error('AI generation error:', err.message);
    res.status(503).json({ error: 'AI generation is temporarily unavailable. Please try again shortly.' });
  }
});
