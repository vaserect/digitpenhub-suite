const WhatsAppAutomationService = require('../services/whatsapp/WhatsAppAutomationService');

/**
 * WhatsApp Automations Controller
 * 
 * Handles workflow automation for WhatsApp Marketing.
 * Supports trigger-based messaging with multiple step types.
 */

/**
 * Create a new automation
 */
async function createAutomation(req, res) {
  try {
    const automation = await WhatsAppAutomationService.createAutomation(req.user.orgId, req.body);
    res.status(201).json({ automation });
  } catch (error) {
    console.error('Error creating WhatsApp automation:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * List all automations
 */
async function listAutomations(req, res) {
  try {
    const { status, triggerType } = req.query;
    const automations = await WhatsAppAutomationService.listAutomations(req.user.orgId, {
      status,
      triggerType
    });
    res.json({ automations });
  } catch (error) {
    console.error('Error listing WhatsApp automations:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get automation by ID
 */
async function getAutomation(req, res) {
  try {
    const automation = await WhatsAppAutomationService.getAutomation(req.user.orgId, req.params.id);
    res.json({ automation });
  } catch (error) {
    console.error('Error getting WhatsApp automation:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Update automation
 */
async function updateAutomation(req, res) {
  try {
    const automation = await WhatsAppAutomationService.updateAutomation(
      req.user.orgId,
      req.params.id,
      req.body
    );
    res.json({ automation });
  } catch (error) {
    console.error('Error updating WhatsApp automation:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Delete automation
 */
async function deleteAutomation(req, res) {
  try {
    await WhatsAppAutomationService.deleteAutomation(req.user.orgId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting WhatsApp automation:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Trigger automation manually
 */
async function triggerAutomation(req, res) {
  try {
    const { contactId, triggerData } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    const execution = await WhatsAppAutomationService.triggerAutomation(
      req.user.orgId,
      req.params.id,
      contactId,
      triggerData || {}
    );

    res.json({ execution });
  } catch (error) {
    console.error('Error triggering WhatsApp automation:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Get automation execution history
 */
async function getExecutionHistory(req, res) {
  try {
    const { limit, offset, status } = req.query;
    const executions = await WhatsAppAutomationService.getExecutionHistory(
      req.user.orgId,
      req.params.id,
      {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        status
      }
    );
    res.json({ executions });
  } catch (error) {
    console.error('Error getting execution history:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Cancel automation execution
 */
async function cancelExecution(req, res) {
  try {
    const execution = await WhatsAppAutomationService.cancelExecution(
      req.user.orgId,
      req.params.executionId
    );
    res.json({ execution });
  } catch (error) {
    console.error('Error cancelling execution:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Get automation statistics
 */
async function getAutomationStats(req, res) {
  try {
    const automation = await WhatsAppAutomationService.getAutomation(req.user.orgId, req.params.id);
    
    // Get execution stats
    const db = require('../db');
    const { rows } = await db.query(
      `SELECT 
         COUNT(*)::int as total_executions,
         COUNT(*) FILTER (WHERE status = 'completed')::int as completed,
         COUNT(*) FILTER (WHERE status = 'failed')::int as failed,
         COUNT(*) FILTER (WHERE status = 'running')::int as running,
         COUNT(*) FILTER (WHERE status = 'pending')::int as pending
       FROM whatsapp_automation_executions
       WHERE automation_id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]
    );

    res.json({
      automation: {
        id: automation.id,
        name: automation.name,
        status: automation.status,
        trigger_type: automation.trigger_type,
        execution_count: automation.execution_count,
        last_executed_at: automation.last_executed_at
      },
      stats: rows[0]
    });
  } catch (error) {
    console.error('Error getting automation stats:', error);
    res.status(404).json({ error: error.message });
  }
}

module.exports = {
  createAutomation,
  listAutomations,
  getAutomation,
  updateAutomation,
  deleteAutomation,
  triggerAutomation,
  getExecutionHistory,
  cancelExecution,
  getAutomationStats
};
