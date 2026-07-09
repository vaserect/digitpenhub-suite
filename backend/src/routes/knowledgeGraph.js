const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// Record a relationship between two entities
router.post('/', asyncHandler(async (req, res) => {
  const { sourceType, sourceId, targetType, targetId, relationType, meta } = req.body || {};
  if (!sourceType || !sourceId || !targetType || !targetId || !relationType) {
    return res.status(400).json({ error: 'sourceType, sourceId, targetType, targetId, and relationType are required.' });
  }
  const { rows } = await db.query(
    `INSERT INTO entity_relationships (org_id, source_type, source_id, target_type, target_id, relation_type, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (source_type, source_id, target_type, target_id, relation_type)
     DO UPDATE SET meta = $7
     RETURNING *`,
    [req.user.orgId, sourceType, sourceId, targetType, targetId, relationType, JSON.stringify(meta || {})]
  );
  res.status(201).json({ relationship: rows[0] });
}));

// Explore the graph from a starting entity
router.get('/explore/:entityType/:entityId', asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { depth = 1 } = req.query;

  const { rows: outbound } = await db.query(
    `SELECT * FROM entity_relationships WHERE org_id = $1 AND source_type = $2 AND source_id = $3`,
    [req.user.orgId, entityType, entityId]
  );
  const { rows: inbound } = await db.query(
    `SELECT * FROM entity_relationships WHERE org_id = $1 AND target_type = $2 AND target_id = $3`,
    [req.user.orgId, entityType, entityId]
  );

  // Resolve related entities
  const related = {};
  for (const r of [...outbound, ...inbound]) {
    const otherType = r.source_id === entityId ? r.target_type : r.source_type;
    const otherId = r.source_id === entityId ? r.target_id : r.source_id;
    const key = `${otherType}:${otherId}`;
    if (!related[key]) {
      related[key] = { type: otherType, id: otherId, relations: [] };
    }
    related[key].relations.push(r.relation_type);
  }

  res.json({
    entity: { type: entityType, id: entityId },
    related: Object.values(related),
    relationships: [...outbound, ...inbound],
  });
}));

// Remove a relationship
router.delete('/', asyncHandler(async (req, res) => {
  const { sourceType, sourceId, targetType, targetId, relationType } = req.body || {};
  await db.query(
    `DELETE FROM entity_relationships
     WHERE org_id = $1 AND source_type = $2 AND source_id = $3 AND target_type = $4 AND target_id = $5 AND relation_type = $6`,
    [req.user.orgId, sourceType, sourceId, targetType, targetId, relationType]
  );
  res.json({ ok: true });
}));

module.exports = router;
