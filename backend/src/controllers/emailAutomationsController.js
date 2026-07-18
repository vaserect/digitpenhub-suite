const AutomationService = require('../services/email/AutomationService');
const { validate } = require('../utils/validator');

const automationService = new AutomationService();

/**
 * List all automations
 */
async function listAutomations(req, res) {
  try {
    const { status } = req.query;
    const automations = await automationService.listAutomations(req.user.orgId, status || null);
    res.json({ automations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get automation details
 */
async function getAutomation(req, res) {
  try {
    const automation = await automationService.getAutomation(req.params.id, req.user.orgId);
    res.json({ automation });
  } catch (err) {
    if (err.message === 'Automation not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}

/**
 * Create a new automation
 */
async function createAutomation(req, res) {
  try {
    const { error } = validate(req.body, {
      name: { required: true, type: 'string', minLength: 1 },
      description: { type: 'string' },
      triggerType: { required: true, type: 'string' },
      triggerConfig: { type: 'object' }
    });

    if (error) {
      return res.status(400).json({ error });
    }

    const automation = await automationService.createAutomation(req.user.orgId, req.body);
    res.status(201).json({ automation });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Update automation
 */
async function updateAutomation(req, res) {
  try {
    const automation = await automationService.updateAutomation(
      req.params.id,
      req.user.orgId,
      req.body
    );
    res.json({ automation });
  } catch (err) {
    if (err.message === 'Automation not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
}

/**
 * Delete automation
 */
async function deleteAutomation(req, res) {
  try {
    await automationService.deleteAutomation(req.params.id, req.user.orgId);
    res.json({ ok: true });
  } catch (err) {
    if (err.message === 'Automation not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}

/**
 * Add step to automation
 */
async function addStep(req, res) {
  try {
    const { error } = validate(req.body, {
      stepType: { required: true, type: 'string' },
      config: { type: 'object' },
      insertAfter: { type: 'string' }
    });

    if (error) {
      return res.status(400).json({ error });
    }

    const step = await automationService.addStep(req.params.id, req.user.orgId, req.body);
    res.status(201).json({ step });
  } catch (err) {
    if (err.message === 'Automation not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
}

/**
 * Update automation step
 */
async function updateStep(req, res) {
  try {
    const step = await automationService.updateStep(
      req.params.stepId,
      req.params.id,
      req.user.orgId,
      req.body
    );
    res.json({ step });
  } catch (err) {
    if (err.message === 'Step not found' || err.message === 'Automation not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
}

/**
 * Delete automation step
 */
async function deleteStep(req, res) {
  try {
    await automationService.deleteStep(req.params.stepId, req.params.id, req.user.orgId);
    res.json({ ok: true });
  } catch (err) {
    if (err.message === 'Step not found' || err.message === 'Automation not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}

/**
 * Reorder automation steps
 */
async function reorderSteps(req, res) {
  try {
    const { error } = validate(req.body, {
      stepOrder: { required: true, type: 'array' }
    });

    if (error) {
      return res.status(400).json({ error });
    }

    await automationService.reorderSteps(req.params.id, req.user.orgId, req.body.stepOrder);
    res.json({ ok: true });
  } catch (err) {
    if (err.message === 'Automation not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
}

/**
 * Activate automation
 */
async function activateAutomation(req, res) {
  try {
    await automationService.activateAutomation(req.params.id, req.user.orgId);
    res.json({ ok: true, message: 'Automation activated' });
  } catch (err) {
    if (err.message === 'Automation not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
}

/**
 * Pause automation
 */
async function pauseAutomation(req, res) {
  try {
    await automationService.pauseAutomation(req.params.id, req.user.orgId);
    res.json({ ok: true, message: 'Automation paused' });
  } catch (err) {
    if (err.message === 'Automation not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}

/**
 * Enroll subscriber in automation
 */
async function enrollSubscriber(req, res) {
  try {
    const { error } = validate(req.body, {
      subscriberId: { required: true, type: 'string' }
    });

    if (error) {
      return res.status(400).json({ error });
    }

    const enrollment = await automationService.enrollSubscriber(
      req.params.id,
      req.body.subscriberId,
      req.user.orgId
    );
    res.status(201).json({ enrollment });
  } catch (err) {
    if (err.message === 'Automation not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
}

/**
 * Get automation analytics
 */
async function getAnalytics(req, res) {
  try {
    const analytics = await automationService.getAnalytics(req.params.id, req.user.orgId);
    res.json({ analytics });
  } catch (err) {
    if (err.message === 'Automation not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  addStep,
  updateStep,
  deleteStep,
  reorderSteps,
  activateAutomation,
  pauseAutomation,
  enrollSubscriber,
  getAnalytics
};
