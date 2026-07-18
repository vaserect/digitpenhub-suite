const db = require('../../db');

/**
 * SMSAutomationService
 * 
 * SMS workflow automation engine (mirrors EmailAutomationService pattern).
 * Supports trigger-based automation workflows with multi-step sequences.
 * 
 * Trigger Types:
 * - contact_added: When a new contact is added
 * - tag_added: When a specific tag is added to a contact
 * - tag_removed: When a specific tag is removed from a contact
 * - keyword_received: When a contact sends a specific keyword
 * - date_based: On a specific date or recurring schedule
 * - engagement_score: When engagement score reaches a threshold
 * - inactivity: After X days of no activity
 * - custom_field_change: When a custom field value changes
 * - opt_in: When a contact opts in
 * - purchase: When a contact makes a purchase (integration hook)
 * - abandoned_cart: When a cart is abandoned (integration hook)
 * 
 * Step Types:
 * - send_sms: Send an SMS message
 * - send_mms: Send an MMS message with media
 * - delay: Wait for a specified duration
 * - condition: Branch based on contact properties
 * - add_tag: Add a tag to the contact
 * - remove_tag: Remove a tag from the contact
 * - update_field: Update a custom field value
 * - webhook: Send data to an external URL
 * - end_automation: Exit the automation
 */
class SMSAutomationService {
  /**
   * Create a new automation workflow
   */
  async createAutomation(orgId, { name, description, trigger_type, trigger_config, status = 'draft' }) {
    const { rows } = await db.query(
      `INSERT INTO sms_automations (org_id, name, description, trigger_type, trigger_config, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orgId, name, description || null, trigger_type, JSON.stringify(trigger_config), status]
    );
    return rows[0];
  }

  /**
   * Update automation
   */
  async updateAutomation(automationId, orgId, updates) {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.trigger_type !== undefined) {
      setClauses.push(`trigger_type = $${paramIndex++}`);
      values.push(updates.trigger_type);
    }
    if (updates.trigger_config !== undefined) {
      setClauses.push(`trigger_config = $${paramIndex++}`);
      values.push(JSON.stringify(updates.trigger_config));
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(automationId, orgId);

    const { rows } = await db.query(
      `UPDATE sms_automations SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex++} AND org_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (!rows.length) {
      throw new Error('Automation not found');
    }

    return rows[0];
  }

  /**
   * Delete automation
   */
  async deleteAutomation(automationId, orgId) {
    await db.query(
      `DELETE FROM sms_automations WHERE id = $1 AND org_id = $2`,
      [automationId, orgId]
    );
  }

  /**
   * Get automation by ID
   */
  async getAutomation(automationId, orgId) {
    const { rows } = await db.query(
      `SELECT * FROM sms_automations WHERE id = $1 AND org_id = $2`,
      [automationId, orgId]
    );
    return rows[0] || null;
  }

  /**
   * List all automations for an organization
   */
  async listAutomations(orgId, filters = {}) {
    let query = `SELECT * FROM sms_automations WHERE org_id = $1`;
    const values = [orgId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND status = $${paramIndex++}`;
      values.push(filters.status);
    }

    if (filters.trigger_type) {
      query += ` AND trigger_type = $${paramIndex++}`;
      values.push(filters.trigger_type);
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await db.query(query, values);
    return rows;
  }

  /**
   * Add step to automation
   */
  async addStep(automationId, orgId, { step_order, step_type, step_config }) {
    // Verify automation exists
    const automation = await this.getAutomation(automationId, orgId);
    if (!automation) {
      throw new Error('Automation not found');
    }

    const { rows } = await db.query(
      `INSERT INTO sms_automation_steps (automation_id, step_order, step_type, step_config)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [automationId, step_order, step_type, JSON.stringify(step_config)]
    );
    return rows[0];
  }

  /**
   * Update step
   */
  async updateStep(stepId, automationId, orgId, updates) {
    // Verify automation exists
    const automation = await this.getAutomation(automationId, orgId);
    if (!automation) {
      throw new Error('Automation not found');
    }

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    if (updates.step_order !== undefined) {
      setClauses.push(`step_order = $${paramIndex++}`);
      values.push(updates.step_order);
    }
    if (updates.step_type !== undefined) {
      setClauses.push(`step_type = $${paramIndex++}`);
      values.push(updates.step_type);
    }
    if (updates.step_config !== undefined) {
      setClauses.push(`step_config = $${paramIndex++}`);
      values.push(JSON.stringify(updates.step_config));
    }

    values.push(stepId, automationId);

    const { rows } = await db.query(
      `UPDATE sms_automation_steps SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex++} AND automation_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (!rows.length) {
      throw new Error('Step not found');
    }

    return rows[0];
  }

  /**
   * Delete step
   */
  async deleteStep(stepId, automationId, orgId) {
    // Verify automation exists
    const automation = await this.getAutomation(automationId, orgId);
    if (!automation) {
      throw new Error('Automation not found');
    }

    await db.query(
      `DELETE FROM sms_automation_steps WHERE id = $1 AND automation_id = $2`,
      [stepId, automationId]
    );
  }

  /**
   * Get all steps for an automation
   */
  async getSteps(automationId, orgId) {
    // Verify automation exists
    const automation = await this.getAutomation(automationId, orgId);
    if (!automation) {
      throw new Error('Automation not found');
    }

    const { rows } = await db.query(
      `SELECT * FROM sms_automation_steps
       WHERE automation_id = $1
       ORDER BY step_order ASC`,
      [automationId]
    );
    return rows;
  }

  /**
   * Activate automation (change status to active)
   */
  async activateAutomation(automationId, orgId) {
    const { rows } = await db.query(
      `UPDATE sms_automations SET status = 'active', updated_at = NOW()
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [automationId, orgId]
    );

    if (!rows.length) {
      throw new Error('Automation not found');
    }

    return rows[0];
  }

  /**
   * Pause automation
   */
  async pauseAutomation(automationId, orgId) {
    const { rows } = await db.query(
      `UPDATE sms_automations SET status = 'paused', updated_at = NOW()
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [automationId, orgId]
    );

    if (!rows.length) {
      throw new Error('Automation not found');
    }

    return rows[0];
  }

  /**
   * Enroll contact in automation
   */
  async enrollContact(automationId, contactId, orgId) {
    // Verify automation is active
    const automation = await this.getAutomation(automationId, orgId);
    if (!automation) {
      throw new Error('Automation not found');
    }
    if (automation.status !== 'active') {
      throw new Error('Automation is not active');
    }

    // Get first step
    const steps = await this.getSteps(automationId, orgId);
    if (steps.length === 0) {
      throw new Error('Automation has no steps');
    }

    const firstStep = steps[0];

    // Check if already enrolled
    const existing = await db.query(
      `SELECT * FROM sms_automation_subscribers
       WHERE automation_id = $1 AND contact_id = $2`,
      [automationId, contactId]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0]; // Already enrolled
    }

    // Calculate next action time based on first step
    const nextActionAt = this.calculateNextActionTime(firstStep);

    const { rows } = await db.query(
      `INSERT INTO sms_automation_subscribers
       (automation_id, contact_id, current_step_id, status, next_action_at)
       VALUES ($1, $2, $3, 'active', $4)
       RETURNING *`,
      [automationId, contactId, firstStep.id, nextActionAt]
    );

    // Increment entry count
    await db.query(
      `UPDATE sms_automations SET entry_count = entry_count + 1
       WHERE id = $1`,
      [automationId]
    );

    return rows[0];
  }

  /**
   * Process pending automation actions
   * This should be called by a background job every minute
   */
  async processPendingActions() {
    // Get all subscribers with pending actions
    const { rows: subscribers } = await db.query(
      `SELECT s.*, a.org_id, a.trigger_type, a.trigger_config
       FROM sms_automation_subscribers s
       INNER JOIN sms_automations a ON s.automation_id = a.id
       WHERE s.status = 'active'
         AND s.next_action_at <= NOW()
         AND a.status = 'active'
       ORDER BY s.next_action_at ASC
       LIMIT 100`
    );

    for (const subscriber of subscribers) {
      try {
        await this.executeStep(subscriber);
      } catch (error) {
        console.error(`Error executing automation step for subscriber ${subscriber.id}:`, error);
        // Continue processing other subscribers
      }
    }

    return subscribers.length;
  }

  /**
   * Execute current step for a subscriber
   */
  async executeStep(subscriber) {
    const { id, automation_id, contact_id, current_step_id, org_id } = subscriber;

    // Get current step
    const { rows: steps } = await db.query(
      `SELECT * FROM sms_automation_steps WHERE id = $1`,
      [current_step_id]
    );

    if (steps.length === 0) {
      // Step not found, mark as completed
      await this.completeSubscriber(id);
      return;
    }

    const step = steps[0];
    const { step_type, step_config } = step;

    // Execute step based on type
    switch (step_type) {
      case 'send_sms':
        await this.executeSendSMS(contact_id, org_id, step_config);
        break;
      
      case 'send_mms':
        await this.executeSendMMS(contact_id, org_id, step_config);
        break;
      
      case 'delay':
        // Delay is handled by next_action_at calculation
        break;
      
      case 'condition':
        // Evaluate condition and branch
        const conditionMet = await this.evaluateCondition(contact_id, step_config);
        if (!conditionMet) {
          // Exit automation if condition not met
          await this.exitSubscriber(id);
          return;
        }
        break;
      
      case 'add_tag':
        await this.executeAddTag(contact_id, step_config);
        break;
      
      case 'remove_tag':
        await this.executeRemoveTag(contact_id, step_config);
        break;
      
      case 'update_field':
        await this.executeUpdateField(contact_id, step_config);
        break;
      
      case 'webhook':
        await this.executeWebhook(contact_id, org_id, step_config);
        break;
      
      case 'end_automation':
        await this.completeSubscriber(id);
        return;
      
      default:
        console.warn(`Unknown step type: ${step_type}`);
    }

    // Move to next step
    await this.advanceToNextStep(id, automation_id, step.step_order);
  }

  /**
   * Advance subscriber to next step
   */
  async advanceToNextStep(subscriberId, automationId, currentStepOrder) {
    // Get next step
    const { rows: nextSteps } = await db.query(
      `SELECT * FROM sms_automation_steps
       WHERE automation_id = $1 AND step_order > $2
       ORDER BY step_order ASC
       LIMIT 1`,
      [automationId, currentStepOrder]
    );

    if (nextSteps.length === 0) {
      // No more steps, mark as completed
      await this.completeSubscriber(subscriberId);
      return;
    }

    const nextStep = nextSteps[0];
    const nextActionAt = this.calculateNextActionTime(nextStep);

    await db.query(
      `UPDATE sms_automation_subscribers
       SET current_step_id = $1, next_action_at = $2
       WHERE id = $3`,
      [nextStep.id, nextActionAt, subscriberId]
    );
  }

  /**
   * Calculate next action time based on step type
   */
  calculateNextActionTime(step) {
    if (step.step_type === 'delay') {
      const { delay_value, delay_unit } = step.step_config;
      const delayMs = this.convertDelayToMs(delay_value, delay_unit);
      return new Date(Date.now() + delayMs);
    }
    // Execute immediately for other step types
    return new Date();
  }

  /**
   * Convert delay value and unit to milliseconds
   */
  convertDelayToMs(value, unit) {
    const multipliers = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000
    };
    return value * (multipliers[unit] || multipliers.minutes);
  }

  /**
   * Execute send SMS step
   */
  async executeSendSMS(contactId, orgId, config) {
    const { message, template_id } = config;
    
    // Get contact details
    const { rows: contacts } = await db.query(
      `SELECT * FROM sms_contacts WHERE id = $1 AND org_id = $2`,
      [contactId, orgId]
    );

    if (contacts.length === 0) return;

    const contact = contacts[0];
    let finalMessage = message;

    // Replace merge tags
    finalMessage = this.replaceMergeTags(finalMessage, contact);

    // TODO: Integrate with actual SMS sending service
    // For now, just log the message
    console.log(`[SMS Automation] Sending to ${contact.phone}: ${finalMessage}`);

    // Update contact stats
    await db.query(
      `UPDATE sms_contacts
       SET total_messages_sent = total_messages_sent + 1,
           last_message_at = NOW()
       WHERE id = $1`,
      [contactId]
    );
  }

  /**
   * Execute send MMS step
   */
  async executeSendMMS(contactId, orgId, config) {
    const { message, media_urls } = config;
    
    // Similar to executeSendSMS but with media
    const { rows: contacts } = await db.query(
      `SELECT * FROM sms_contacts WHERE id = $1 AND org_id = $2`,
      [contactId, orgId]
    );

    if (contacts.length === 0) return;

    const contact = contacts[0];
    let finalMessage = this.replaceMergeTags(message, contact);

    console.log(`[MMS Automation] Sending to ${contact.phone}: ${finalMessage} with media: ${media_urls.join(', ')}`);

    await db.query(
      `UPDATE sms_contacts
       SET total_messages_sent = total_messages_sent + 1,
           last_message_at = NOW()
       WHERE id = $1`,
      [contactId]
    );
  }

  /**
   * Execute add tag step
   */
  async executeAddTag(contactId, config) {
    const { tag } = config;
    
    await db.query(
      `UPDATE sms_contacts
       SET tags = array_append(tags, $1)
       WHERE id = $2 AND NOT ($1 = ANY(tags))`,
      [tag, contactId]
    );
  }

  /**
   * Execute remove tag step
   */
  async executeRemoveTag(contactId, config) {
    const { tag } = config;
    
    await db.query(
      `UPDATE sms_contacts
       SET tags = array_remove(tags, $1)
       WHERE id = $2`,
      [tag, contactId]
    );
  }

  /**
   * Execute update field step
   */
  async executeUpdateField(contactId, config) {
    const { field_name, field_value } = config;
    
    await db.query(
      `UPDATE sms_contacts
       SET custom_fields = jsonb_set(
         COALESCE(custom_fields, '{}'::jsonb),
         $1::text[],
         $2::jsonb
       )
       WHERE id = $3`,
      [[field_name], JSON.stringify(field_value), contactId]
    );
  }

  /**
   * Execute webhook step
   */
  async executeWebhook(contactId, orgId, config) {
    const { url, method = 'POST', headers = {}, body_template } = config;
    
    // Get contact data
    const { rows: contacts } = await db.query(
      `SELECT * FROM sms_contacts WHERE id = $1 AND org_id = $2`,
      [contactId, orgId]
    );

    if (contacts.length === 0) return;

    const contact = contacts[0];
    const body = this.replaceMergeTags(body_template, contact);

    // TODO: Make actual HTTP request
    console.log(`[Webhook] ${method} ${url}`, { body, headers });
  }

  /**
   * Evaluate condition
   */
  async evaluateCondition(contactId, config) {
    const { field, operator, value } = config;
    
    const { rows: contacts } = await db.query(
      `SELECT * FROM sms_contacts WHERE id = $1`,
      [contactId]
    );

    if (contacts.length === 0) return false;

    const contact = contacts[0];
    const fieldValue = contact[field] || contact.custom_fields?.[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue).includes(value);
      case 'gt':
        return parseFloat(fieldValue) > parseFloat(value);
      case 'lt':
        return parseFloat(fieldValue) < parseFloat(value);
      default:
        return true;
    }
  }

  /**
   * Replace merge tags in message
   */
  replaceMergeTags(message, contact) {
    let result = message;
    
    // Replace standard fields
    result = result.replace(/\{\{name\}\}/g, contact.name || '');
    result = result.replace(/\{\{phone\}\}/g, contact.phone || '');
    result = result.replace(/\{\{email\}\}/g, contact.email || '');
    
    // Replace custom fields
    if (contact.custom_fields) {
      Object.keys(contact.custom_fields).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(regex, contact.custom_fields[key] || '');
      });
    }
    
    return result;
  }

  /**
   * Complete subscriber (mark as completed)
   */
  async completeSubscriber(subscriberId) {
    const { rows } = await db.query(
      `UPDATE sms_automation_subscribers
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1
       RETURNING automation_id`,
      [subscriberId]
    );

    if (rows.length > 0) {
      // Increment completion count
      await db.query(
        `UPDATE sms_automations SET completion_count = completion_count + 1
         WHERE id = $1`,
        [rows[0].automation_id]
      );
    }
  }

  /**
   * Exit subscriber (mark as exited)
   */
  async exitSubscriber(subscriberId) {
    await db.query(
      `UPDATE sms_automation_subscribers
       SET status = 'exited'
       WHERE id = $1`,
      [subscriberId]
    );
  }

  /**
   * Get automation statistics
   */
  async getAutomationStats(automationId, orgId) {
    const automation = await this.getAutomation(automationId, orgId);
    if (!automation) {
      throw new Error('Automation not found');
    }

    const { rows: stats } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active') as active_count,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
         COUNT(*) FILTER (WHERE status = 'exited') as exited_count,
         COUNT(*) FILTER (WHERE status = 'paused') as paused_count
       FROM sms_automation_subscribers
       WHERE automation_id = $1`,
      [automationId]
    );

    return {
      ...automation,
      active_subscribers: parseInt(stats[0].active_count) || 0,
      completed_subscribers: parseInt(stats[0].completed_count) || 0,
      exited_subscribers: parseInt(stats[0].exited_count) || 0,
      paused_subscribers: parseInt(stats[0].paused_count) || 0
    };
  }
}

module.exports = new SMSAutomationService();
