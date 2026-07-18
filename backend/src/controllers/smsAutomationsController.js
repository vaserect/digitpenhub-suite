const SMSAutomationService = require('../services/sms/SMSAutomationService');

async function listAutomations(req, res) {
  try {
    const { status, trigger_type } = req.query;
    const automations = await SMSAutomationService.listAutomations(req.user.orgId, {
      status,
      trigger_type
    });
    res.json({ automations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getAutomation(req, res) {
  try {
    const automation = await SMSAutomationService.getAutomation(req.params.id, req.user.orgId);
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    res.json({ automation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createAutomation(req, res) {
  try {
    const { name, description, trigger_type, trigger_config, status } = req.body || {};
    
    if (!name?.trim()) {
      return res.status(400).json({ error: 'name required' });
    }
    
    if (!trigger_type) {
      return res.status(400).json({ error: 'trigger_type required' });
    }
    
    const automation = await SMSAutomationService.createAutomation(req.user.orgId, {
      name: name.trim(),
      description,
      trigger_type,
      trigger_config: trigger_config || {},
      status: status || 'draft'
    });
    
    res.status(201).json({ automation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateAutomation(req, res) {
  try {
    const { name, description, trigger_type, trigger_config, status } = req.body || {};
    
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (trigger_type !== undefined) updates.trigger_type = trigger_type;
    if (trigger_config !== undefined) updates.trigger_config = trigger_config;
    if (status !== undefined) updates.status = status;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    
    const automation = await SMSAutomationService.updateAutomation(
      req.params.id,
      req.user.orgId,
      updates
    );
    
    res.json({ automation });
  } catch (error) {
    if (error.message === 'Automation not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function deleteAutomation(req, res) {
  try {
    await SMSAutomationService.deleteAutomation(req.params.id, req.user.orgId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function activateAutomation(req, res) {
  try {
    const automation = await SMSAutomationService.activateAutomation(req.params.id, req.user.orgId);
    res.json({ automation });
  } catch (error) {
    if (error.message === 'Automation not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function pauseAutomation(req, res) {
  try {
    const automation = await SMSAutomationService.pauseAutomation(req.params.id, req.user.orgId);
    res.json({ automation });
  } catch (error) {
    if (error.message === 'Automation not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function getSteps(req, res) {
  try {
    const steps = await SMSAutomationService.getSteps(req.params.id, req.user.orgId);
    res.json({ steps });
  } catch (error) {
    if (error.message === 'Automation not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function addStep(req, res) {
  try {
    const { step_order, step_type, step_config } = req.body || {};
    
    if (step_order === undefined) {
      return res.status(400).json({ error: 'step_order required' });
    }
    
    if (!step_type) {
      return res.status(400).json({ error: 'step_type required' });
    }
    
    if (!step_config) {
      return res.status(400).json({ error: 'step_config required' });
    }
    
    const step = await SMSAutomationService.addStep(req.params.id, req.user.orgId, {
      step_order,
      step_type,
      step_config
    });
    
    res.status(201).json({ step });
  } catch (error) {
    if (error.message === 'Automation not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function updateStep(req, res) {
  try {
    const { step_order, step_type, step_config } = req.body || {};
    
    const updates = {};
    if (step_order !== undefined) updates.step_order = step_order;
    if (step_type !== undefined) updates.step_type = step_type;
    if (step_config !== undefined) updates.step_config = step_config;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    
    const step = await SMSAutomationService.updateStep(
      req.params.stepId,
      req.params.id,
      req.user.orgId,
      updates
    );
    
    res.json({ step });
  } catch (error) {
    if (error.message === 'Automation not found' || error.message === 'Step not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function deleteStep(req, res) {
  try {
    await SMSAutomationService.deleteStep(req.params.stepId, req.params.id, req.user.orgId);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'Automation not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function enrollContact(req, res) {
  try {
    const { contactId } = req.body || {};
    
    if (!contactId) {
      return res.status(400).json({ error: 'contactId required' });
    }
    
    const subscriber = await SMSAutomationService.enrollContact(
      req.params.id,
      contactId,
      req.user.orgId
    );
    
    res.status(201).json({ subscriber });
  } catch (error) {
    if (error.message === 'Automation not found' || error.message.includes('not active') || error.message.includes('no steps')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function getAutomationStats(req, res) {
  try {
    const stats = await SMSAutomationService.getAutomationStats(req.params.id, req.user.orgId);
    res.json(stats);
  } catch (error) {
    if (error.message === 'Automation not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  activateAutomation,
  pauseAutomation,
  getSteps,
  addStep,
  updateStep,
  deleteStep,
  enrollContact,
  getAutomationStats
};
