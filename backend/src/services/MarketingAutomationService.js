/**
 * Marketing Automation Service - Cross-Channel Orchestration
 * 
 * Handles multi-channel automation workflows with:
 * - Email, SMS, WhatsApp channel support
 * - Conditional logic and branching
 * - Advanced triggers (page visit, link click, purchase, etc.)
 * - Goal tracking and conversion optimization
 * - Lead scoring integration
 * - Split testing for automation paths
 * - Time windows and send optimization
 * - CRM integration (deals, contact stages)
 * - Advanced wait conditions
 * 
 * Benchmark: ActiveCampaign / HubSpot Marketing Automation
 */

const db = require('../db');
const { sendMail } = require('../utils/mailer');
const { fetchWithTimeout } = require('../utils/aiReliability');

class MarketingAutomationService {
  /**
   * Process automation triggers and enroll contacts
   * Called by background job or webhook handlers
   */
  async processTriggers() {
    const { rows: triggers } = await db.query(
      `SELECT at.*, aw.org_id, aw.name as workflow_name, aw.status as workflow_status
       FROM automation_triggers at
       JOIN automation_workflows aw ON aw.id = at.workflow_id
       WHERE at.processed = false AND aw.status = 'active'
       ORDER BY at.created_at ASC
       LIMIT 100`
    );

    const results = [];
    for (const trigger of triggers) {
      try {
        // Check if contact already enrolled
        const existing = await db.query(
          `SELECT id FROM automation_enrollments 
           WHERE workflow_id = $1 AND contact_email = $2 AND status = 'active'`,
          [trigger.workflow_id, trigger.contact_email]
        );

        if (existing.rows.length > 0) {
          // Already enrolled, skip
          await db.query(
            `UPDATE automation_triggers SET processed = true, processed_at = now() WHERE id = $1`,
            [trigger.id]
          );
          continue;
        }

        // Enroll contact
        const enrollment = await this.enrollContact({
          workflowId: trigger.workflow_id,
          contactEmail: trigger.contact_email,
          contactPhone: trigger.contact_phone,
          orgId: trigger.org_id,
          triggerData: trigger.trigger_data
        });

        // Mark trigger as processed
        await db.query(
          `UPDATE automation_triggers 
           SET processed = true, processed_at = now(), enrollment_id = $1 
           WHERE id = $2`,
          [enrollment.id, trigger.id]
        );

        results.push({ triggerId: trigger.id, enrollmentId: enrollment.id, status: 'enrolled' });
      } catch (error) {
        console.error(`Failed to process trigger ${trigger.id}:`, error);
        results.push({ triggerId: trigger.id, status: 'failed', error: error.message });
      }
    }

    return results;
  }

  /**
   * Enroll a contact in an automation workflow
   */
  async enrollContact({ workflowId, contactEmail, contactPhone, orgId, triggerData = {} }) {
    // Get workflow details
    const { rows: workflows } = await db.query(
      `SELECT * FROM automation_workflows WHERE id = $1 AND org_id = $2`,
      [workflowId, orgId]
    );

    if (workflows.length === 0) {
      throw new Error('Workflow not found');
    }

    const workflow = workflows[0];

    // Get initial lead score if lead scoring enabled
    let leadScoreStart = 0;
    if (workflow.lead_scoring_enabled) {
      const scoreRes = await db.query(
        `SELECT COALESCE(SUM(score_change), 0) as total_score
         FROM automation_lead_scores
         WHERE org_id = $1 AND contact_email = $2`,
        [orgId, contactEmail]
      );
      leadScoreStart = parseInt(scoreRes.rows[0]?.total_score || 0);
    }

    // Create enrollment
    const { rows: enrollments } = await db.query(
      `INSERT INTO automation_enrollments (
        org_id, workflow_id, contact_email, contact_name,
        lead_score_start, lead_score_current, current_step_started_at
      ) VALUES ($1, $2, $3, $4, $5, $6, now())
      RETURNING *`,
      [orgId, workflowId, contactEmail, triggerData.contactName || null, leadScoreStart, leadScoreStart]
    );

    return enrollments[0];
  }

  /**
   * Advance enrollments through workflow steps
   * Main automation engine - called by scheduler
   */
  async advanceEnrollments() {
    const { rows: enrollments } = await db.query(
      `SELECT ae.*, aw.time_window_start, aw.time_window_end, aw.timezone, aw.send_optimization,
              aw.goal_type, aw.goal_config, aw.exit_on_goal, aw.lead_scoring_enabled
       FROM automation_enrollments ae
       JOIN automation_workflows aw ON aw.id = ae.workflow_id
       WHERE ae.status = 'active' AND aw.status = 'active'
       ORDER BY ae.last_activity_at ASC
       LIMIT 500`
    );

    const results = [];
    for (const enrollment of enrollments) {
      try {
        // Check if goal already achieved and should exit
        if (enrollment.goal_achieved && enrollment.exit_on_goal) {
          await db.query(
            `UPDATE automation_enrollments SET status = 'completed', updated_at = now() WHERE id = $1`,
            [enrollment.id]
          );
          continue;
        }

        // Check time window if configured
        if (enrollment.time_window_start && enrollment.time_window_end) {
          const now = new Date();
          const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
          if (currentTime < enrollment.time_window_start || currentTime > enrollment.time_window_end) {
            continue; // Outside time window, skip for now
          }
        }

        // Get workflow steps
        const { rows: steps } = await db.query(
          `SELECT * FROM automation_steps WHERE workflow_id = $1 ORDER BY step_order`,
          [enrollment.workflow_id]
        );

        if (enrollment.current_step >= steps.length) {
          // Workflow complete
          await db.query(
            `UPDATE automation_enrollments SET status = 'completed', updated_at = now() WHERE id = $1`,
            [enrollment.id]
          );
          continue;
        }

        const step = steps[enrollment.current_step];

        // Check wait conditions
        if (step.step_type === 'wait_until') {
          const conditionMet = await this.checkWaitCondition(enrollment, step);
          if (!conditionMet) {
            continue; // Wait condition not met yet
          }
        }

        // Execute step
        const result = await this.executeStep(enrollment, step);

        // Log execution
        await db.query(
          `INSERT INTO automation_step_executions (
            enrollment_id, step_id, step_type, channel, status, error_message,
            execution_time_ms, metadata, condition_result, path_taken
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            enrollment.id, step.id, step.step_type, step.channel,
            result.status, result.error, result.executionTime,
            JSON.stringify(result.metadata || {}),
            result.conditionResult, result.pathTaken
          ]
        );

        // Determine next step based on result
        let nextStep = enrollment.current_step + 1;
        if (step.condition_type && result.conditionResult !== undefined) {
          // Conditional branching
          if (result.conditionResult && step.true_path_next_step !== null) {
            nextStep = step.true_path_next_step;
          } else if (!result.conditionResult && step.false_path_next_step !== null) {
            nextStep = step.false_path_next_step;
          }
        }

        // Update enrollment
        const pathTaken = [...(enrollment.path_taken || []), `step_${enrollment.current_step}`];
        await db.query(
          `UPDATE automation_enrollments 
           SET current_step = $1, current_step_started_at = now(), 
               path_taken = $2, last_activity_at = now(), updated_at = now()
           WHERE id = $3`,
          [nextStep, pathTaken, enrollment.id]
        );

        results.push({ enrollmentId: enrollment.id, stepId: step.id, status: result.status });
      } catch (error) {
        console.error(`Failed to advance enrollment ${enrollment.id}:`, error);
        await db.query(
          `UPDATE automation_enrollments SET status = 'failed', updated_at = now() WHERE id = $1`,
          [enrollment.id]
        );
        results.push({ enrollmentId: enrollment.id, status: 'failed', error: error.message });
      }
    }

    return results;
  }

  /**
   * Execute a single automation step
   */
  async executeStep(enrollment, step) {
    const startTime = Date.now();
    const config = step.config || {};

    try {
      switch (step.step_type) {
        case 'send_email':
          return await this.executeSendEmail(enrollment, step, config);
        
        case 'send_sms':
          return await this.executeSendSMS(enrollment, step, config);
        
        case 'send_whatsapp':
          return await this.executeSendWhatsApp(enrollment, step, config);
        
        case 'wait_days':
          return await this.executeWaitDays(enrollment, step, config);
        
        case 'condition':
          return await this.executeCondition(enrollment, step, config);
        
        case 'split_test':
          return await this.executeSplitTest(enrollment, step, config);
        
        case 'add_tag':
          return await this.executeAddTag(enrollment, step, config);
        
        case 'remove_tag':
          return await this.executeRemoveTag(enrollment, step, config);
        
        case 'update_lead_score':
          return await this.executeUpdateLeadScore(enrollment, step, config);
        
        case 'update_contact_field':
          return await this.executeUpdateContactField(enrollment, step, config);
        
        case 'crm_action':
          return await this.executeCRMAction(enrollment, step, config);
        
        case 'webhook':
          return await this.executeWebhook(enrollment, step, config);
        
        case 'goal_check':
          return await this.executeGoalCheck(enrollment, step, config);
        
        case 'end_workflow':
          await db.query(
            `UPDATE automation_enrollments SET status = 'completed', updated_at = now() WHERE id = $1`,
            [enrollment.id]
          );
          return { status: 'success', executionTime: Date.now() - startTime };
        
        default:
          return { status: 'skipped', executionTime: Date.now() - startTime };
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Send email step
   */
  async executeSendEmail(enrollment, step, config) {
    const startTime = Date.now();
    
    if (!config.subject || !config.body) {
      return { status: 'failed', error: 'Missing subject or body', executionTime: Date.now() - startTime };
    }

    // Replace merge tags
    const subject = this.replaceMergeTags(config.subject, enrollment);
    const body = this.replaceMergeTags(config.body, enrollment);

    const result = await sendMail({
      to: enrollment.contact_email,
      subject,
      html: body
    });

    // Update enrollment counters
    await db.query(
      `UPDATE automation_enrollments SET total_emails_sent = total_emails_sent + 1 WHERE id = $1`,
      [enrollment.id]
    );

    return {
      status: result.ok ? 'success' : 'failed',
      error: result.ok ? null : result.error,
      executionTime: Date.now() - startTime,
      metadata: { messageId: result.messageId }
    };
  }

  /**
   * Send SMS step
   */
  async executeSendSMS(enrollment, step, config) {
    const startTime = Date.now();
    
    if (!config.message) {
      return { status: 'failed', error: 'Missing message', executionTime: Date.now() - startTime };
    }

    if (!enrollment.contact_phone) {
      return { status: 'failed', error: 'No phone number', executionTime: Date.now() - startTime };
    }

    // Replace merge tags
    const message = this.replaceMergeTags(config.message, enrollment);

    // TODO: Integrate with SMS provider (Twilio, etc.)
    // For now, log to database
    const { rows } = await db.query(
      `INSERT INTO sms_sends (
        org_id, contact_phone, message, status, sent_at
      ) VALUES ($1, $2, $3, $4, now())
      RETURNING id`,
      [enrollment.org_id, enrollment.contact_phone, message, 'sent']
    );

    // Update enrollment counters
    await db.query(
      `UPDATE automation_enrollments SET total_sms_sent = total_sms_sent + 1 WHERE id = $1`,
      [enrollment.id]
    );

    return {
      status: 'success',
      executionTime: Date.now() - startTime,
      metadata: { sendId: rows[0].id }
    };
  }

  /**
   * Send WhatsApp step
   */
  async executeSendWhatsApp(enrollment, step, config) {
    const startTime = Date.now();
    
    if (!config.message && !config.template) {
      return { status: 'failed', error: 'Missing message or template', executionTime: Date.now() - startTime };
    }

    if (!enrollment.contact_phone) {
      return { status: 'failed', error: 'No phone number', executionTime: Date.now() - startTime };
    }

    // Replace merge tags
    const message = config.message ? this.replaceMergeTags(config.message, enrollment) : null;

    // TODO: Integrate with WhatsApp Business API
    // For now, log to database
    const { rows } = await db.query(
      `INSERT INTO whatsapp_messages (
        org_id, conversation_id, phone_number, message_type, content, direction, status, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, now())
      RETURNING id`,
      [
        enrollment.org_id,
        null, // conversation_id will be created if needed
        enrollment.contact_phone,
        config.template ? 'template' : 'text',
        message || JSON.stringify({ template: config.template }),
        'outbound',
        'sent'
      ]
    );

    // Update enrollment counters
    await db.query(
      `UPDATE automation_enrollments SET total_whatsapp_sent = total_whatsapp_sent + 1 WHERE id = $1`,
      [enrollment.id]
    );

    return {
      status: 'success',
      executionTime: Date.now() - startTime,
      metadata: { messageId: rows[0].id }
    };
  }

  /**
   * Wait days step
   */
  async executeWaitDays(enrollment, step, config) {
    const startTime = Date.now();
    const days = Number(config.days) || 0;
    const elapsedMs = Date.now() - new Date(enrollment.current_step_started_at).getTime();
    const requiredMs = days * 24 * 60 * 60 * 1000;

    if (elapsedMs < requiredMs) {
      // Not ready yet, don't advance
      return { status: 'pending', executionTime: Date.now() - startTime };
    }

    return { status: 'success', executionTime: Date.now() - startTime };
  }

  /**
   * Conditional logic step
   */
  async executeCondition(enrollment, step, config) {
    const startTime = Date.now();
    const conditionConfig = step.condition_config || config;

    // Evaluate condition
    const result = await this.evaluateCondition(enrollment, conditionConfig);

    return {
      status: 'success',
      conditionResult: result,
      pathTaken: result ? 'true_path' : 'false_path',
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Split test step
   */
  async executeSplitTest(enrollment, step, config) {
    const startTime = Date.now();

    // Check if enrollment already has a variant assigned
    if (enrollment.split_variant) {
      return {
        status: 'success',
        conditionResult: enrollment.split_variant === 'variant_a',
        pathTaken: enrollment.split_variant,
        executionTime: Date.now() - startTime
      };
    }

    // Assign variant based on split percentage
    const splitPercentage = step.split_percentage || 50;
    const random = Math.random() * 100;
    const variant = random < splitPercentage ? 'variant_a' : 'variant_b';

    // Update enrollment with variant
    await db.query(
      `UPDATE automation_enrollments SET split_variant = $1 WHERE id = $2`,
      [variant, enrollment.id]
    );

    // Update split test stats
    await db.query(
      `UPDATE automation_split_tests 
       SET ${variant}_count = ${variant}_count + 1
       WHERE step_id = $1`,
      [step.id]
    );

    return {
      status: 'success',
      conditionResult: variant === 'variant_a',
      pathTaken: variant,
      executionTime: Date.now() - startTime,
      metadata: { variant }
    };
  }

  /**
   * Add tag step
   */
  async executeAddTag(enrollment, step, config) {
    const startTime = Date.now();
    
    if (!config.tag) {
      return { status: 'failed', error: 'No tag specified', executionTime: Date.now() - startTime };
    }

    await db.query(
      `INSERT INTO automation_contact_tags (org_id, contact_email, tag, source, workflow_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (org_id, contact_email, tag) DO NOTHING`,
      [enrollment.org_id, enrollment.contact_email, config.tag, 'automation', enrollment.workflow_id]
    );

    return { status: 'success', executionTime: Date.now() - startTime };
  }

  /**
   * Remove tag step
   */
  async executeRemoveTag(enrollment, step, config) {
    const startTime = Date.now();
    
    if (!config.tag) {
      return { status: 'failed', error: 'No tag specified', executionTime: Date.now() - startTime };
    }

    await db.query(
      `DELETE FROM automation_contact_tags 
       WHERE org_id = $1 AND contact_email = $2 AND tag = $3`,
      [enrollment.org_id, enrollment.contact_email, config.tag]
    );

    return { status: 'success', executionTime: Date.now() - startTime };
  }

  /**
   * Update lead score step
   */
  async executeUpdateLeadScore(enrollment, step, config) {
    const startTime = Date.now();
    const scoreChange = step.lead_score_change || config.score_change || 0;

    if (scoreChange === 0) {
      return { status: 'skipped', executionTime: Date.now() - startTime };
    }

    const previousScore = enrollment.lead_score_current;
    const newScore = previousScore + scoreChange;

    // Update enrollment
    await db.query(
      `UPDATE automation_enrollments SET lead_score_current = $1 WHERE id = $2`,
      [newScore, enrollment.id]
    );

    // Log score change
    await db.query(
      `INSERT INTO automation_lead_scores (
        org_id, contact_email, workflow_id, score_change, reason, previous_score, new_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        enrollment.org_id, enrollment.contact_email, enrollment.workflow_id,
        scoreChange, config.reason || 'Automation step', previousScore, newScore
      ]
    );

    return {
      status: 'success',
      executionTime: Date.now() - startTime,
      metadata: { previousScore, newScore, scoreChange }
    };
  }

  /**
   * Update contact field step
   */
  async executeUpdateContactField(enrollment, step, config) {
    const startTime = Date.now();
    
    if (!config.field || config.value === undefined) {
      return { status: 'failed', error: 'Missing field or value', executionTime: Date.now() - startTime };
    }

    // Update in CRM contacts table
    await db.query(
      `UPDATE contacts SET ${config.field} = $1, updated_at = now() 
       WHERE org_id = $2 AND email = $3`,
      [config.value, enrollment.org_id, enrollment.contact_email]
    );

    return { status: 'success', executionTime: Date.now() - startTime };
  }

  /**
   * CRM action step (create deal, update stage, etc.)
   */
  async executeCRMAction(enrollment, step, config) {
    const startTime = Date.now();
    const actionType = step.crm_action || config.action_type;
    const actionConfig = step.crm_config || config;

    let result;
    try {
      switch (actionType) {
        case 'create_deal':
          result = await this.createDeal(enrollment, actionConfig);
          break;
        case 'update_contact_stage':
          result = await this.updateContactStage(enrollment, actionConfig);
          break;
        case 'add_note':
          result = await this.addContactNote(enrollment, actionConfig);
          break;
        case 'create_task':
          result = await this.createTask(enrollment, actionConfig);
          break;
        default:
          return { status: 'failed', error: 'Unknown CRM action', executionTime: Date.now() - startTime };
      }

      // Log CRM action
      await db.query(
        `INSERT INTO automation_crm_actions (
          org_id, enrollment_id, action_type, action_config, status, result_data
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          enrollment.org_id, enrollment.id, actionType,
          JSON.stringify(actionConfig), 'success', JSON.stringify(result)
        ]
      );

      return {
        status: 'success',
        executionTime: Date.now() - startTime,
        metadata: result
      };
    } catch (error) {
      // Log failed CRM action
      await db.query(
        `INSERT INTO automation_crm_actions (
          org_id, enrollment_id, action_type, action_config, status, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          enrollment.org_id, enrollment.id, actionType,
          JSON.stringify(actionConfig), 'failed', error.message
        ]
      );

      return {
        status: 'failed',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Webhook step
   */
  async executeWebhook(enrollment, step, config) {
    const startTime = Date.now();
    
    if (!config.url) {
      return { status: 'failed', error: 'No URL configured', executionTime: Date.now() - startTime };
    }

    try {
      const payload = {
        enrollmentId: enrollment.id,
        workflowId: enrollment.workflow_id,
        contactEmail: enrollment.contact_email,
        contactName: enrollment.contact_name,
        currentStep: enrollment.current_step,
        customData: config.data || {}
      };

      const response = await fetchWithTimeout(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.headers || {})
        },
        body: JSON.stringify(payload)
      }, 10000);

      return {
        status: response.ok ? 'success' : 'failed',
        error: response.ok ? null : `HTTP ${response.status}`,
        executionTime: Date.now() - startTime,
        metadata: { statusCode: response.status }
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Goal check step
   */
  async executeGoalCheck(enrollment, step, config) {
    const startTime = Date.now();

    // Get workflow goal configuration
    const { rows: workflows } = await db.query(
      `SELECT goal_type, goal_config FROM automation_workflows WHERE id = $1`,
      [enrollment.workflow_id]
    );

    if (workflows.length === 0 || !workflows[0].goal_type) {
      return { status: 'skipped', executionTime: Date.now() - startTime };
    }

    const workflow = workflows[0];
    const goalAchieved = await this.checkGoal(enrollment, workflow.goal_type, workflow.goal_config);

    if (goalAchieved && !enrollment.goal_achieved) {
      // Mark goal as achieved
      await db.query(
        `UPDATE automation_enrollments 
         SET goal_achieved = true, goal_achieved_at = now() 
         WHERE id = $1`,
        [enrollment.id]
      );

      // Update goal stats
      await db.query(
        `UPDATE automation_goals 
         SET achieved_count = achieved_count + 1,
             conversion_rate = (achieved_count::DECIMAL / NULLIF(total_enrolled, 0)) * 100
         WHERE workflow_id = $1`,
        [enrollment.workflow_id]
      );
    }

    return {
      status: 'success',
      executionTime: Date.now() - startTime,
      metadata: { goalAchieved }
    };
  }

  /**
   * Check wait condition
   */
  async checkWaitCondition(enrollment, step) {
    const config = step.wait_until_condition || {};
    const maxWaitHours = step.max_wait_hours || 24;
    const startedAt = new Date(enrollment.current_step_started_at);
    const elapsedHours = (Date.now() - startedAt.getTime()) / (1000 * 60 * 60);

    // Check if max wait time exceeded
    if (elapsedHours >= maxWaitHours) {
      return true; // Timeout, proceed anyway
    }

    // Check condition based on type
    switch (config.type) {
      case 'event_occurred':
        // Check if specific event occurred (e.g., email opened, link clicked)
        return await this.checkEventOccurred(enrollment, config);
      
      case 'field_changed':
        // Check if contact field changed to specific value
        return await this.checkFieldChanged(enrollment, config);
      
      case 'goal_achieved':
        // Check if workflow goal achieved
        return enrollment.goal_achieved;
      
      default:
        return true; // Unknown condition type, proceed
    }
  }

  /**
   * Evaluate condition for conditional logic
   */
  async evaluateCondition(enrollment, config) {
    const { field, operator, value } = config;

    // Get field value from enrollment or contact
    let fieldValue;
    if (field === 'lead_score') {
      fieldValue = enrollment.lead_score_current;
    } else if (field === 'total_emails_sent') {
      fieldValue = enrollment.total_emails_sent;
    } else if (field === 'goal_achieved') {
      fieldValue = enrollment.goal_achieved;
    } else {
      // Get from contact or custom field
      const { rows } = await db.query(
        `SELECT ${field} FROM contacts WHERE org_id = $1 AND email = $2`,
        [enrollment.org_id, enrollment.contact_email]
      );
      fieldValue = rows[0]?.[field];
    }

    // Evaluate based on operator
    switch (operator) {
      case 'equals':
        return fieldValue == value;
      case 'not_equals':
        return fieldValue != value;
      case 'gt':
        return Number(fieldValue) > Number(value);
      case 'gte':
        return Number(fieldValue) >= Number(value);
      case 'lt':
        return Number(fieldValue) < Number(value);
      case 'lte':
        return Number(fieldValue) <= Number(value);
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'not_contains':
        return !String(fieldValue).includes(String(value));
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      case 'is_not_empty':
        return fieldValue && fieldValue !== '';
      default:
        return false;
    }
  }

  /**
   * Check if event occurred
   */
  async checkEventOccurred(enrollment, config) {
    const { event_type, since } = config;
    const sinceDate = since || enrollment.current_step_started_at;

    switch (event_type) {
      case 'email_opened':
        const { rows: opens } = await db.query(
          `SELECT id FROM email_sends 
           WHERE contact_email = $1 AND opened = true AND opened_at >= $2
           LIMIT 1`,
          [enrollment.contact_email, sinceDate]
        );
        return opens.length > 0;
      
      case 'email_clicked':
        const { rows: clicks } = await db.query(
          `SELECT id FROM email_link_clicks 
           WHERE contact_email = $1 AND clicked_at >= $2
           LIMIT 1`,
          [enrollment.contact_email, sinceDate]
        );
        return clicks.length > 0;
      
      case 'sms_replied':
        const { rows: smsReplies } = await db.query(
          `SELECT id FROM sms_messages 
           WHERE contact_phone = $1 AND direction = 'inbound' AND created_at >= $2
           LIMIT 1`,
          [enrollment.contact_phone, sinceDate]
        );
        return smsReplies.length > 0;
      
      default:
        return false;
    }
  }

  /**
   * Check if field changed
   */
  async checkFieldChanged(enrollment, config) {
    const { field, value } = config;
    
    const { rows } = await db.query(
      `SELECT ${field} FROM contacts WHERE org_id = $1 AND email = $2`,
      [enrollment.org_id, enrollment.contact_email]
    );

    return rows[0]?.[field] == value;
  }

  /**
   * Check if goal achieved
   */
  async checkGoal(enrollment, goalType, goalConfig) {
    switch (goalType) {
      case 'conversion':
        // Check if target event occurred
        return await this.checkEventOccurred(enrollment, {
          event_type: goalConfig.target_event,
          since: enrollment.enrolled_at
        });
      
      case 'engagement':
        // Check if engagement thresholds met
        const targetOpens = goalConfig.target_opens || 0;
        const targetClicks = goalConfig.target_clicks || 0;
        
        const { rows } = await db.query(
          `SELECT 
             COUNT(*) FILTER (WHERE opened = true) as opens,
             COUNT(*) FILTER (WHERE clicked = true) as clicks
           FROM email_sends
           WHERE contact_email = $1 AND sent_at >= $2`,
          [enrollment.contact_email, enrollment.enrolled_at]
        );
        
        return rows[0].opens >= targetOpens && rows[0].clicks >= targetClicks;
      
      case 'lead_score':
        // Check if lead score reached target
        const targetScore = goalConfig.target_score || 100;
        return enrollment.lead_score_current >= targetScore;
      
      case 'deal_created':
        // Check if deal created
        const { rows: deals } = await db.query(
          `SELECT id FROM deals 
           WHERE org_id = $1 AND contact_email = $2 AND created_at >= $3
           LIMIT 1`,
          [enrollment.org_id, enrollment.contact_email, enrollment.enrolled_at]
        );
        return deals.length > 0;
      
      default:
        return false;
    }
  }

  /**
   * CRM Helper: Create deal
   */
  async createDeal(enrollment, config) {
    const { rows } = await db.query(
      `INSERT INTO deals (
        org_id, title, value, stage, contact_email, pipeline_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        enrollment.org_id,
        config.title || `Deal for ${enrollment.contact_email}`,
        config.value || 0,
        config.stage || 'qualified',
        enrollment.contact_email,
        config.pipeline_id
      ]
    );

    return { dealId: rows[0].id };
  }

  /**
   * CRM Helper: Update contact stage
   */
  async updateContactStage(enrollment, config) {
    await db.query(
      `UPDATE contacts SET stage = $1, updated_at = now() 
       WHERE org_id = $2 AND email = $3`,
      [config.stage, enrollment.org_id, enrollment.contact_email]
    );

    return { stage: config.stage };
  }

  /**
   * CRM Helper: Add contact note
   */
  async addContactNote(enrollment, config) {
    const { rows } = await db.query(
      `INSERT INTO contact_notes (
        org_id, contact_id, note, created_by
      ) 
      SELECT $1, id, $2, $3 FROM contacts 
      WHERE org_id = $1 AND email = $4
      RETURNING id`,
      [enrollment.org_id, config.note, config.created_by, enrollment.contact_email]
    );

    return { noteId: rows[0]?.id };
  }

  /**
   * CRM Helper: Create task
   */
  async createTask(enrollment, config) {
    const { rows } = await db.query(
      `INSERT INTO contact_tasks (
        org_id, contact_id, title, description, due_date, assigned_to
      )
      SELECT $1, id, $2, $3, $4, $5 FROM contacts
      WHERE org_id = $1 AND email = $6
      RETURNING id`,
      [
        enrollment.org_id,
        config.title,
        config.description,
        config.due_date,
        config.assigned_to,
        enrollment.contact_email
      ]
    );

    return { taskId: rows[0]?.id };
  }

  /**
   * Replace merge tags in content
   */
  replaceMergeTags(content, enrollment) {
    if (!content) return content;

    return content
      .replace(/\{\{contact_email\}\}/g, enrollment.contact_email || '')
      .replace(/\{\{contact_name\}\}/g, enrollment.contact_name || '')
      .replace(/\{\{contact_phone\}\}/g, enrollment.contact_phone || '')
      .replace(/\{\{lead_score\}\}/g, enrollment.lead_score_current || 0);
  }

  /**
   * Get automation analytics
   */
  async getAnalytics(workflowId, orgId, startDate, endDate) {
    const { rows } = await db.query(
      `SELECT * FROM automation_analytics
       WHERE workflow_id = $1 AND org_id = $2 
       AND date >= $3 AND date <= $4
       ORDER BY date DESC`,
      [workflowId, orgId, startDate, endDate]
    );

    return rows;
  }

  /**
   * Get workflow performance summary
   */
  async getWorkflowSummary(workflowId, orgId) {
    const { rows } = await db.query(
      `SELECT 
         COUNT(*) as total_enrolled,
         COUNT(*) FILTER (WHERE status = 'active') as active,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'failed') as failed,
         COUNT(*) FILTER (WHERE goal_achieved = true) as goal_achieved,
         AVG(lead_score_current - lead_score_start) as avg_score_change,
         SUM(total_emails_sent) as total_emails,
         SUM(total_sms_sent) as total_sms,
         SUM(total_whatsapp_sent) as total_whatsapp
       FROM automation_enrollments
       WHERE workflow_id = $1 AND org_id = $2`,
      [workflowId, orgId]
    );

    const summary = rows[0];
    summary.conversion_rate = summary.total_enrolled > 0
      ? ((summary.goal_achieved / summary.total_enrolled) * 100).toFixed(2)
      : 0;

    return summary;
  }
}

module.exports = new MarketingAutomationService();
