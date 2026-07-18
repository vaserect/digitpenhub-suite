const BaseService = require('../base/BaseService');
const db = require('../../db');
const logger = require('../../utils/logger');

/**
 * AutomationService - Email automation workflows
 * Benchmark: Mailchimp Automations, Klaviyo Flows
 */
class AutomationService extends BaseService {
  constructor() {
    super(null, { serviceName: 'AutomationService', logger });
  }

  /**
   * Create a new automation workflow
   */
  async createAutomation(orgId, data) {
    const { name, description, triggerType, triggerConfig = {} } = data;

    if (!name?.trim()) {
      throw new Error('Automation name is required');
    }

    if (!triggerType) {
      throw new Error('Trigger type is required');
    }

    const validTriggers = [
      'list_subscribe', 'segment_enter', 'tag_added', 'date_based',
      'api_trigger', 'form_submit', 'purchase', 'abandoned_cart',
      'birthday', 'anniversary', 'inactivity'
    ];

    if (!validTriggers.includes(triggerType)) {
      throw new Error(`Invalid trigger type. Must be one of: ${validTriggers.join(', ')}`);
    }

    const { rows } = await db.query(
      `INSERT INTO email_automations (org_id, name, description, trigger_type, trigger_config)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orgId, name.trim(), description || null, triggerType, JSON.stringify(triggerConfig)]
    );

    return rows[0];
  }

  /**
   * List all automations for an organization
   */
  async listAutomations(orgId, status = null) {
    const query = status
      ? `SELECT * FROM email_automations WHERE org_id = $1 AND status = $2 ORDER BY created_at DESC`
      : `SELECT * FROM email_automations WHERE org_id = $1 ORDER BY created_at DESC`;

    const params = status ? [orgId, status] : [orgId];
    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Get automation details with steps
   */
  async getAutomation(automationId, orgId) {
    const { rows: automationRows } = await db.query(
      `SELECT * FROM email_automations WHERE id = $1 AND org_id = $2`,
      [automationId, orgId]
    );

    if (automationRows.length === 0) {
      throw new Error('Automation not found');
    }

    const { rows: stepRows } = await db.query(
      `SELECT * FROM email_automation_steps WHERE automation_id = $1 ORDER BY step_order`,
      [automationId]
    );

    return {
      ...automationRows[0],
      steps: stepRows
    };
  }

  /**
   * Update automation
   */
  async updateAutomation(automationId, orgId, data) {
    const { name, description, triggerType, triggerConfig, status } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (triggerType !== undefined) {
      updates.push(`trigger_type = $${paramCount++}`);
      values.push(triggerType);
    }
    if (triggerConfig !== undefined) {
      updates.push(`trigger_config = $${paramCount++}`);
      values.push(JSON.stringify(triggerConfig));
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = now()`);
    values.push(automationId, orgId);

    const { rows } = await db.query(
      `UPDATE email_automations
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND org_id = $${paramCount++}
       RETURNING *`,
      values
    );

    if (rows.length === 0) {
      throw new Error('Automation not found');
    }

    return rows[0];
  }

  /**
   * Delete automation
   */
  async deleteAutomation(automationId, orgId) {
    const { rows } = await db.query(
      `DELETE FROM email_automations WHERE id = $1 AND org_id = $2 RETURNING id`,
      [automationId, orgId]
    );

    if (rows.length === 0) {
      throw new Error('Automation not found');
    }

    return true;
  }

  /**
   * Add step to automation
   */
  async addStep(automationId, orgId, stepData) {
    const { stepType, config = {}, insertAfter = null } = stepData;

    // Verify automation exists and belongs to org
    await this.getAutomation(automationId, orgId);

    const validStepTypes = [
      'send_email', 'delay', 'condition', 'add_tag', 'remove_tag',
      'move_list', 'webhook', 'update_field'
    ];

    if (!validStepTypes.includes(stepType)) {
      throw new Error(`Invalid step type. Must be one of: ${validStepTypes.join(', ')}`);
    }

    // Determine step order
    let stepOrder;
    if (insertAfter) {
      // Insert after specific step
      const { rows: afterRows } = await db.query(
        `SELECT step_order FROM email_automation_steps WHERE id = $1 AND automation_id = $2`,
        [insertAfter, automationId]
      );

      if (afterRows.length === 0) {
        throw new Error('Insert after step not found');
      }

      stepOrder = afterRows[0].step_order + 1;

      // Shift subsequent steps
      await db.query(
        `UPDATE email_automation_steps
         SET step_order = step_order + 1
         WHERE automation_id = $1 AND step_order >= $2`,
        [automationId, stepOrder]
      );
    } else {
      // Append to end
      const { rows: maxRows } = await db.query(
        `SELECT COALESCE(MAX(step_order), 0) + 1 as next_order
         FROM email_automation_steps WHERE automation_id = $1`,
        [automationId]
      );
      stepOrder = maxRows[0].next_order;
    }

    const { rows } = await db.query(
      `INSERT INTO email_automation_steps (automation_id, step_order, step_type, config)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [automationId, stepOrder, stepType, JSON.stringify(config)]
    );

    return rows[0];
  }

  /**
   * Update automation step
   */
  async updateStep(stepId, automationId, orgId, data) {
    // Verify automation exists and belongs to org
    await this.getAutomation(automationId, orgId);

    const { stepType, config } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (stepType !== undefined) {
      updates.push(`step_type = $${paramCount++}`);
      values.push(stepType);
    }
    if (config !== undefined) {
      updates.push(`config = $${paramCount++}`);
      values.push(JSON.stringify(config));
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(stepId, automationId);

    const { rows } = await db.query(
      `UPDATE email_automation_steps
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND automation_id = $${paramCount++}
       RETURNING *`,
      values
    );

    if (rows.length === 0) {
      throw new Error('Step not found');
    }

    return rows[0];
  }

  /**
   * Delete automation step
   */
  async deleteStep(stepId, automationId, orgId) {
    // Verify automation exists and belongs to org
    await this.getAutomation(automationId, orgId);

    const { rows: deletedRows } = await db.query(
      `DELETE FROM email_automation_steps
       WHERE id = $1 AND automation_id = $2
       RETURNING step_order`,
      [stepId, automationId]
    );

    if (deletedRows.length === 0) {
      throw new Error('Step not found');
    }

    // Reorder remaining steps
    await db.query(
      `UPDATE email_automation_steps
       SET step_order = step_order - 1
       WHERE automation_id = $1 AND step_order > $2`,
      [automationId, deletedRows[0].step_order]
    );

    return true;
  }

  /**
   * Reorder automation steps
   */
  async reorderSteps(automationId, orgId, stepOrder) {
    // Verify automation exists and belongs to org
    await this.getAutomation(automationId, orgId);

    // stepOrder is an array of step IDs in desired order
    if (!Array.isArray(stepOrder)) {
      throw new Error('Step order must be an array of step IDs');
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < stepOrder.length; i++) {
        await client.query(
          `UPDATE email_automation_steps
           SET step_order = $1
           WHERE id = $2 AND automation_id = $3`,
          [i + 1, stepOrder[i], automationId]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return true;
  }

  /**
   * Activate automation (start processing triggers)
   */
  async activateAutomation(automationId, orgId) {
    const automation = await this.getAutomation(automationId, orgId);

    if (automation.steps.length === 0) {
      throw new Error('Cannot activate automation with no steps');
    }

    // Validate that automation has at least one send_email step
    const hasEmailStep = automation.steps.some(s => s.step_type === 'send_email');
    if (!hasEmailStep) {
      throw new Error('Automation must have at least one email step');
    }

    await this.updateAutomation(automationId, orgId, { status: 'active' });

    logger.info(`Activated automation ${automationId}`);
    return true;
  }

  /**
   * Pause automation (stop processing new triggers)
   */
  async pauseAutomation(automationId, orgId) {
    await this.updateAutomation(automationId, orgId, { status: 'paused' });
    logger.info(`Paused automation ${automationId}`);
    return true;
  }

  /**
   * Enroll a subscriber in an automation
   */
  async enrollSubscriber(automationId, subscriberId, orgId) {
    const automation = await this.getAutomation(automationId, orgId);

    if (automation.status !== 'active') {
      throw new Error('Cannot enroll in inactive automation');
    }

    // Check if already enrolled
    const { rows: existingRows } = await db.query(
      `SELECT id FROM email_automation_subscribers
       WHERE automation_id = $1 AND subscriber_id = $2 AND status = 'active'`,
      [automationId, subscriberId]
    );

    if (existingRows.length > 0) {
      throw new Error('Subscriber already enrolled in this automation');
    }

    // Get first step
    const firstStep = automation.steps[0];
    if (!firstStep) {
      throw new Error('Automation has no steps');
    }

    // Calculate next action time based on first step
    let nextActionAt = new Date();
    if (firstStep.step_type === 'delay') {
      const delayMinutes = firstStep.config.delay_minutes || 0;
      nextActionAt = new Date(Date.now() + delayMinutes * 60 * 1000);
    }

    const { rows } = await db.query(
      `INSERT INTO email_automation_subscribers
       (automation_id, subscriber_id, current_step_id, next_action_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [automationId, subscriberId, firstStep.id, nextActionAt]
    );

    // Increment entry count
    await db.query(
      `UPDATE email_automations SET entry_count = entry_count + 1 WHERE id = $1`,
      [automationId]
    );

    logger.info(`Enrolled subscriber ${subscriberId} in automation ${automationId}`);
    return rows[0];
  }

  /**
   * Get automation analytics
   */
  async getAnalytics(automationId, orgId) {
    const automation = await this.getAutomation(automationId, orgId);

    const { rows: statsRows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active') as active_subscribers,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_subscribers,
         COUNT(*) FILTER (WHERE status = 'exited') as exited_subscribers,
         AVG(EXTRACT(EPOCH FROM (completed_at - entered_at)) / 3600) as avg_completion_hours
       FROM email_automation_subscribers
       WHERE automation_id = $1`,
      [automationId]
    );

    // Get step-by-step analytics
    const { rows: stepStatsRows } = await db.query(
      `SELECT
         s.id,
         s.step_type,
         s.step_order,
         COUNT(DISTINCT eas.subscriber_id) as reached_count
       FROM email_automation_steps s
       LEFT JOIN email_automation_subscribers eas
         ON eas.automation_id = s.automation_id
         AND (eas.current_step_id = s.id OR eas.status = 'completed')
       WHERE s.automation_id = $1
       GROUP BY s.id, s.step_type, s.step_order
       ORDER BY s.step_order`,
      [automationId]
    );

    return {
      automation_id: automationId,
      name: automation.name,
      status: automation.status,
      entry_count: automation.entry_count,
      completion_count: automation.completion_count,
      ...statsRows[0],
      step_analytics: stepStatsRows
    };
  }

  /**
   * Process pending automation actions (called by background job)
   */
  async processPendingActions(limit = 100) {
    const { rows } = await db.query(
      `SELECT eas.*, ea.org_id, eas.automation_id
       FROM email_automation_subscribers eas
       JOIN email_automations ea ON ea.id = eas.automation_id
       WHERE eas.status = 'active'
         AND eas.next_action_at <= now()
         AND ea.status = 'active'
       ORDER BY eas.next_action_at
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [limit]
    );

    logger.info(`Processing ${rows.length} pending automation actions`);

    for (const enrollment of rows) {
      try {
        await this.processEnrollmentStep(enrollment);
      } catch (err) {
        logger.error(`Failed to process automation enrollment ${enrollment.id}:`, err);
      }
    }

    return rows.length;
  }

  /**
   * Process a single enrollment step
   */
  async processEnrollmentStep(enrollment) {
    const automation = await this.getAutomation(enrollment.automation_id, enrollment.org_id);
    const currentStep = automation.steps.find(s => s.id === enrollment.current_step_id);

    if (!currentStep) {
      logger.error(`Current step not found for enrollment ${enrollment.id}`);
      return;
    }

    // Execute step action
    switch (currentStep.step_type) {
      case 'send_email':
        await this.executeSendEmail(enrollment, currentStep);
        break;
      case 'delay':
        // Delay is handled by next_action_at, just move to next step
        break;
      case 'add_tag':
        await this.executeAddTag(enrollment, currentStep);
        break;
      case 'remove_tag':
        await this.executeRemoveTag(enrollment, currentStep);
        break;
      case 'webhook':
        await this.executeWebhook(enrollment, currentStep);
        break;
      default:
        logger.warn(`Unknown step type: ${currentStep.step_type}`);
    }

    // Move to next step
    await this.advanceToNextStep(enrollment, automation);
  }

  /**
   * Execute send email step
   */
  async executeSendEmail(enrollment, step) {
    const { campaign_id, subject, body_html } = step.config;

    // Record the send in email_sends table
    await db.query(
      `INSERT INTO email_sends (automation_id, subscriber_id, sent_at)
       VALUES ($1, $2, now())`,
      [enrollment.automation_id, enrollment.subscriber_id]
    );

    // Actual email sending would happen here via EmailService
    logger.info(`Sent automation email to subscriber ${enrollment.subscriber_id}`);
  }

  /**
   * Execute add tag step
   */
  async executeAddTag(enrollment, step) {
    const { tag } = step.config;
    if (!tag) return;

    await db.query(
      `UPDATE email_subscribers
       SET tags = array_append(tags, $1)
       WHERE id = $2 AND NOT ($1 = ANY(tags))`,
      [tag, enrollment.subscriber_id]
    );

    logger.info(`Added tag "${tag}" to subscriber ${enrollment.subscriber_id}`);
  }

  /**
   * Execute remove tag step
   */
  async executeRemoveTag(enrollment, step) {
    const { tag } = step.config;
    if (!tag) return;

    await db.query(
      `UPDATE email_subscribers
       SET tags = array_remove(tags, $1)
       WHERE id = $2`,
      [tag, enrollment.subscriber_id]
    );

    logger.info(`Removed tag "${tag}" from subscriber ${enrollment.subscriber_id}`);
  }

  /**
   * Execute webhook step
   */
  async executeWebhook(enrollment, step) {
    const { url, method = 'POST', payload = {} } = step.config;
    if (!url) return;

    // Webhook execution would happen here
    logger.info(`Executed webhook for subscriber ${enrollment.subscriber_id}: ${url}`);
  }

  /**
   * Advance enrollment to next step
   */
  async advanceToNextStep(enrollment, automation) {
    const currentStepIndex = automation.steps.findIndex(s => s.id === enrollment.current_step_id);
    const nextStep = automation.steps[currentStepIndex + 1];

    if (!nextStep) {
      // Automation complete
      await db.query(
        `UPDATE email_automation_subscribers
         SET status = 'completed', completed_at = now()
         WHERE id = $1`,
        [enrollment.id]
      );

      await db.query(
        `UPDATE email_automations SET completion_count = completion_count + 1 WHERE id = $1`,
        [enrollment.automation_id]
      );

      logger.info(`Completed automation for subscriber ${enrollment.subscriber_id}`);
      return;
    }

    // Calculate next action time
    let nextActionAt = new Date();
    if (nextStep.step_type === 'delay') {
      const delayMinutes = nextStep.config.delay_minutes || 0;
      nextActionAt = new Date(Date.now() + delayMinutes * 60 * 1000);
    }

    await db.query(
      `UPDATE email_automation_subscribers
       SET current_step_id = $1, next_action_at = $2
       WHERE id = $3`,
      [nextStep.id, nextActionAt, enrollment.id]
    );
  }
}

module.exports = AutomationService;
