const db = require('../db');

async function listKeywords(req, res) {
  try {
    const { is_active } = req.query;
    let query = `SELECT * FROM sms_keywords WHERE org_id = $1`;
    const values = [req.user.orgId];
    
    if (is_active !== undefined) {
      query += ` AND is_active = $2`;
      values.push(is_active === 'true');
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const { rows } = await db.query(query, values);
    res.json({ keywords: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getKeyword(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT * FROM sms_keywords WHERE id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]
    );
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Keyword not found' });
    }
    
    res.json({ keyword: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createKeyword(req, res) {
  try {
    const { keyword, response, action_type, action_config, match_type, is_active } = req.body || {};
    
    if (!keyword?.trim()) {
      return res.status(400).json({ error: 'keyword required' });
    }
    
    if (!response?.trim()) {
      return res.status(400).json({ error: 'response required' });
    }
    
    const { rows } = await db.query(
      `INSERT INTO sms_keywords (org_id, keyword, response, action_type, action_config, match_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.orgId,
        keyword.trim().toUpperCase(),
        response.trim(),
        action_type || null,
        action_config ? JSON.stringify(action_config) : '{}',
        match_type || 'exact',
        is_active !== false
      ]
    );
    
    res.status(201).json({ keyword: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateKeyword(req, res) {
  try {
    const { keyword, response, action_type, action_config, match_type, is_active } = req.body || {};
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (keyword !== undefined) {
      updates.push(`keyword = $${paramIndex++}`);
      values.push(keyword.trim().toUpperCase());
    }
    if (response !== undefined) {
      updates.push(`response = $${paramIndex++}`);
      values.push(response.trim());
    }
    if (action_type !== undefined) {
      updates.push(`action_type = $${paramIndex++}`);
      values.push(action_type);
    }
    if (action_config !== undefined) {
      updates.push(`action_config = $${paramIndex++}`);
      values.push(JSON.stringify(action_config));
    }
    if (match_type !== undefined) {
      updates.push(`match_type = $${paramIndex++}`);
      values.push(match_type);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    
    values.push(req.params.id, req.user.orgId);
    
    const { rows } = await db.query(
      `UPDATE sms_keywords SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND org_id = $${paramIndex++}
       RETURNING *`,
      values
    );
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Keyword not found' });
    }
    
    res.json({ keyword: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteKeyword(req, res) {
  try {
    await db.query(
      `DELETE FROM sms_keywords WHERE id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getKeywordStats(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT 
         COUNT(*) as total_keywords,
         COUNT(*) FILTER (WHERE is_active = true) as active_keywords,
         SUM(usage_count) as total_usage
       FROM sms_keywords
       WHERE org_id = $1`,
      [req.user.orgId]
    );
    
    res.json({
      total: parseInt(rows[0].total_keywords) || 0,
      active: parseInt(rows[0].active_keywords) || 0,
      totalUsage: parseInt(rows[0].total_usage) || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listKeywords,
  getKeyword,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  getKeywordStats
};
