const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total, COUNT(*) FILTER(WHERE is_active) AS active,
            COALESCE(SUM(conversations),0) AS total_conversations
     FROM chatbot_flows WHERE org_id=$1`, [req.user.orgId]);
  res.json({ stats: rows[0] });
}

async function listFlows(req, res) {
  const { rows } = await db.query(
    `SELECT id,name,description,welcome_message,trigger_keywords,is_active,conversations,created_at,
            jsonb_array_length(nodes) AS node_count
     FROM chatbot_flows WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  res.json({ flows: rows });
}

async function getFlow(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM chatbot_flows WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ flow: rows[0] });
}

async function createFlow(req, res) {
  const { name, description, welcomeMessage, triggerKeywords, nodes } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required.' });
  const { rows } = await db.query(
    `INSERT INTO chatbot_flows (org_id,name,description,welcome_message,trigger_keywords,nodes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.orgId, name.trim(), description||null, welcomeMessage||'Hello! How can I help you today?',
     JSON.stringify(triggerKeywords||[]), JSON.stringify(nodes||[])]
  );
  res.status(201).json({ flow: rows[0] });
}

async function updateFlow(req, res) {
  const { id } = req.params;
  const { name, description, welcomeMessage, triggerKeywords, nodes, isActive } = req.body || {};
  const { rows } = await db.query(
    `UPDATE chatbot_flows SET
       name=COALESCE($3,name), description=$4,
       welcome_message=COALESCE($5,welcome_message),
       trigger_keywords=COALESCE($6,trigger_keywords),
       nodes=COALESCE($7,nodes),
       is_active=COALESCE($8,is_active)
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId, name||null, description||null, welcomeMessage||null,
     triggerKeywords ? JSON.stringify(triggerKeywords) : null,
     nodes ? JSON.stringify(nodes) : null, isActive ?? null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ flow: rows[0] });
}

async function deleteFlow(req, res) {
  await db.query(`DELETE FROM chatbot_flows WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { getStats, listFlows, getFlow, createFlow, updateFlow, deleteFlow };
