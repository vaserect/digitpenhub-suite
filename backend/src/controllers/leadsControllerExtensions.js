const LeadService = require('../services/leads/LeadService');
const PopupService = require('../services/leads/PopupService');
const AnalyticsService = require('../services/leads/AnalyticsService');
const db = require('../db');

const leadService = new LeadService();
const popupService = new PopupService();
const analyticsService = new AnalyticsService();

// ── Popups ──────────────────────────────────────────────────────────────────

async function listPopups(req, res) {
  try {
    const popups = await popupService.listPopups(req.user.orgId);
    res.json({ popups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createPopup(req, res) {
  try {
    const popup = await popupService.createPopup(req.user.orgId, req.body);
    res.status(201).json({ popup });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function getPopup(req, res) {
  try {
    const popup = await popupService.getPopup(req.params.id, req.user.orgId);
    if (!popup) return res.status(404).json({ error: 'Popup not found' });
    res.json({ popup });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updatePopup(req, res) {
  try {
    const popup = await popupService.updatePopup(req.params.id, req.user.orgId, req.body);
    if (!popup) return res.status(404).json({ error: 'Popup not found' });
    res.json({ popup });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function deletePopup(req, res) {
  try {
    const deleted = await popupService.deletePopup(req.params.id, req.user.orgId);
    if (!deleted) return res.status(404).json({ error: 'Popup not found' });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ── A/B Testing Variants ────────────────────────────────────────────────────

async function listVariants(req, res) {
  try {
    const { formId } = req.params;
    const { rows } = await db.query(
      `SELECT * FROM lead_form_variants WHERE form_id = $1 AND org_id = $2 ORDER BY created_at`,
      [formId, req.user.orgId]
    );
    res.json({ variants: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createVariant(req, res) {
  try {
    const { formId } = req.params;
    const { variantName, fields, thankYouMessage, trafficSplit } = req.body;
    
    const { rows } = await db.query(
      `INSERT INTO lead_form_variants (form_id, org_id, variant_name, fields_json, thank_you_message, traffic_split)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [formId, req.user.orgId, variantName, JSON.stringify(fields), thankYouMessage, trafficSplit]
    );
    
    res.status(201).json({ variant: rows[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function updateVariant(req, res) {
  try {
    const { id } = req.params;
    const { variantName, fields, thankYouMessage, trafficSplit, isActive } = req.body;
    
    const { rows } = await db.query(
      `UPDATE lead_form_variants
       SET variant_name = COALESCE($1, variant_name),
           fields_json = COALESCE($2, fields_json),
           thank_you_message = COALESCE($3, thank_you_message),
           traffic_split = COALESCE($4, traffic_split),
           is_active = COALESCE($5, is_active)
       WHERE id = $6 AND org_id = $7
       RETURNING *`,
      [variantName, fields ? JSON.stringify(fields) : null, thankYouMessage, trafficSplit, isActive, id, req.user.orgId]
    );
    
    if (!rows.length) return res.status(404).json({ error: 'Variant not found' });
    res.json({ variant: rows[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function deleteVariant(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `DELETE FROM lead_form_variants WHERE id = $1 AND org_id = $2 RETURNING id`,
      [id, req.user.orgId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Variant not found' });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ── Analytics ───────────────────────────────────────────────────────────────

async function getTopPerformingForms(req, res) {
  try {
    const { limit } = req.query;
    const forms = await analyticsService.getTopPerformingForms(req.user.orgId, parseInt(limit) || 10);
    res.json({ forms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getFormAnalytics(req, res) {
  try {
    const { formId } = req.params;
    const { startDate, endDate } = req.query;
    
    const analytics = await analyticsService.getFormAnalytics(formId, req.user.orgId, { startDate, endDate });
    res.json({ analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getVariantPerformance(req, res) {
  try {
    const { formId } = req.params;
    const performance = await analyticsService.getVariantPerformance(formId, req.user.orgId);
    res.json({ performance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getConversionFunnel(req, res) {
  try {
    const { formId } = req.params;
    const funnel = await analyticsService.getConversionFunnel(formId, req.user.orgId);
    res.json({ funnel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function trackFormEvent(req, res) {
  try {
    const { formId } = req.params;
    const { variantId, eventType, sessionId } = req.body;
    
    await analyticsService.trackEvent(formId, variantId, req.user.orgId, eventType, {
      sessionId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer
    });
    
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ── Lead Scoring ────────────────────────────────────────────────────────────

async function listScoringRules(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT * FROM lead_scoring_rules WHERE org_id = $1 ORDER BY id`,
      [req.user.orgId]
    );
    res.json({ rules: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createScoringRule(req, res) {
  try {
    const { name, conditions, scoreChange } = req.body;
    const { rows } = await db.query(
      `INSERT INTO lead_scoring_rules (org_id, name, conditions, score_change)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.orgId, name, JSON.stringify(conditions), scoreChange]
    );
    res.status(201).json({ rule: rows[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function updateScoringRule(req, res) {
  try {
    const { id } = req.params;
    const { name, conditions, scoreChange, isActive } = req.body;
    
    const { rows } = await db.query(
      `UPDATE lead_scoring_rules
       SET name = COALESCE($1, name),
           conditions = COALESCE($2, conditions),
           score_change = COALESCE($3, score_change),
           is_active = COALESCE($4, is_active)
       WHERE id = $5 AND org_id = $6
       RETURNING *`,
      [name, conditions ? JSON.stringify(conditions) : null, scoreChange, isActive, id, req.user.orgId]
    );
    
    if (!rows.length) return res.status(404).json({ error: 'Rule not found' });
    res.json({ rule: rows[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function deleteScoringRule(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `DELETE FROM lead_scoring_rules WHERE id = $1 AND org_id = $2 RETURNING id`,
      [id, req.user.orgId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Rule not found' });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function calculateScore(req, res) {
  try {
    const { id } = req.params;
    const score = await leadService.calculateLeadScore(id, req.user.orgId);
    res.json({ score });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ── Lead Assignment & Follow-up ─────────────────────────────────────────────

async function assignLead(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const lead = await leadService.assignLead(id, userId, req.user.orgId);
    res.json({ lead });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function setFollowUp(req, res) {
  try {
    const { id } = req.params;
    const { followUpAt } = req.body;
    const lead = await leadService.setFollowUpReminder(id, followUpAt, req.user.orgId, req.user.id);
    res.json({ lead });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function getFollowUpReminders(req, res) {
  try {
    const reminders = await leadService.getFollowUpReminders(req.user.orgId);
    res.json({ reminders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ── Bulk Operations ─────────────────────────────────────────────────────────

async function bulkUpdateStatus(req, res) {
  try {
    const { submissionIds, status } = req.body;
    const updated = await leadService.bulkUpdateStatus(submissionIds, status, req.user.orgId);
    res.json({ updated: updated.length });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function bulkAssign(req, res) {
  try {
    const { submissionIds, userId } = req.body;
    const assigned = await leadService.bulkAssign(submissionIds, userId, req.user.orgId);
    res.json({ assigned: assigned.length });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// ── Webhooks ────────────────────────────────────────────────────────────────

async function listWebhooks(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT * FROM lead_webhooks WHERE org_id = $1 ORDER BY created_at DESC`,
      [req.user.orgId]
    );
    res.json({ webhooks: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createWebhook(req, res) {
  try {
    const { name, url, events, headers } = req.body;
    const { rows } = await db.query(
      `INSERT INTO lead_webhooks (org_id, name, url, events, headers)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.orgId, name, url, events, JSON.stringify(headers || {})]
    );
    res.status(201).json({ webhook: rows[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function updateWebhook(req, res) {
  try {
    const { id } = req.params;
    const { name, url, events, headers, isActive } = req.body;
    
    const { rows } = await db.query(
      `UPDATE lead_webhooks
       SET name = COALESCE($1, name),
           url = COALESCE($2, url),
           events = COALESCE($3, events),
           headers = COALESCE($4, headers),
           is_active = COALESCE($5, is_active)
       WHERE id = $6 AND org_id = $7
       RETURNING *`,
      [name, url, events, headers ? JSON.stringify(headers) : null, isActive, id, req.user.orgId]
    );
    
    if (!rows.length) return res.status(404).json({ error: 'Webhook not found' });
    res.json({ webhook: rows[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function deleteWebhook(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `DELETE FROM lead_webhooks WHERE id = $1 AND org_id = $2 RETURNING id`,
      [id, req.user.orgId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Webhook not found' });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  // Popups
  listPopups, createPopup, getPopup, updatePopup, deletePopup,
  // Variants
  listVariants, createVariant, updateVariant, deleteVariant,
  // Analytics
  getTopPerformingForms, getFormAnalytics, getVariantPerformance, getConversionFunnel, trackFormEvent,
  // Scoring
  listScoringRules, createScoringRule, updateScoringRule, deleteScoringRule, calculateScore,
  // Assignment
  assignLead, setFollowUp, getFollowUpReminders,
  // Bulk
  bulkUpdateStatus, bulkAssign,
  // Webhooks
  listWebhooks, createWebhook, updateWebhook, deleteWebhook
};
