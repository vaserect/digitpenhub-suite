const db = require('../../db');
const { trackActivity } = require('../../utils/activityTracker');

class PopupService {
  async createPopup(orgId, data) {
    const { name, formId, popupType, triggerType, triggerValue, targetingRules, designConfig } = data;
    
    const { rows } = await db.query(
      `INSERT INTO lead_popups (org_id, name, form_id, popup_type, trigger_type, trigger_value, targeting_rules, design_config)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [orgId, name, formId, popupType, triggerType, JSON.stringify(triggerValue), JSON.stringify(targetingRules), JSON.stringify(designConfig)]
    );

    return rows[0];
  }

  async listPopups(orgId) {
    const { rows } = await db.query(
      `SELECT p.*, f.name as form_name
       FROM lead_popups p
       LEFT JOIN lead_forms f ON f.id = p.form_id
       WHERE p.org_id = $1
       ORDER BY p.created_at DESC`,
      [orgId]
    );
    return rows;
  }

  async getPopup(id, orgId) {
    const { rows } = await db.query(
      `SELECT * FROM lead_popups WHERE id = $1 AND org_id = $2`,
      [id, orgId]
    );
    return rows[0];
  }

  async updatePopup(id, orgId, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (['name', 'form_id', 'popup_type', 'trigger_type', 'is_active'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      } else if (['trigger_value', 'targeting_rules', 'design_config'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(JSON.stringify(value));
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id, orgId);

    const { rows } = await db.query(
      `UPDATE lead_popups SET ${fields.join(', ')} WHERE id = $${paramCount} AND org_id = $${paramCount + 1} RETURNING *`,
      values
    );

    return rows[0];
  }

  async deletePopup(id, orgId) {
    const { rows } = await db.query(
      `DELETE FROM lead_popups WHERE id = $1 AND org_id = $2 RETURNING id`,
      [id, orgId]
    );
    return rows.length > 0;
  }

  async getActivePopupsForUrl(url, device = 'desktop') {
    // Get all active popups and filter by targeting rules
    const { rows } = await db.query(
      `SELECT p.*, f.fields_json, f.thank_you_message
       FROM lead_popups p
       JOIN lead_forms f ON f.id = p.form_id
       WHERE p.is_active = true AND f.is_active = true`
    );

    return rows.filter(popup => {
      const rules = popup.targeting_rules || {};
      
      // URL pattern matching
      if (rules.urlPatterns && rules.urlPatterns.length > 0) {
        const matches = rules.urlPatterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(url);
        });
        if (!matches) return false;
      }

      // Device targeting
      if (rules.devices && rules.devices.length > 0) {
        if (!rules.devices.includes(device)) return false;
      }

      return true;
    });
  }
}

module.exports = PopupService;
