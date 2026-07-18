const FunnelService = require('../services/funnels/FunnelService');

/**
 * List all funnels for the organization
 */
async function listFunnels(req, res) {
  try {
    const { status, funnelType, limit, offset } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (funnelType) filters.funnelType = funnelType;
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const funnels = await FunnelService.listFunnels(req.user.orgId, filters);
    
    res.json({ 
      success: true,
      funnels,
      count: funnels.length 
    });
  } catch (err) {
    console.error('[funnelsController.listFunnels] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to list funnels.',
      message: err.message 
    });
  }
}

/**
 * Get a single funnel by ID with all steps
 */
async function getFunnel(req, res) {
  try {
    const { id } = req.params;

    const funnel = await FunnelService.getFunnelById(id, req.user.orgId);
    
    if (!funnel) {
      return res.status(404).json({ 
        success: false,
        error: 'Funnel not found.' 
      });
    }

    res.json({ 
      success: true,
      funnel 
    });
  } catch (err) {
    console.error('[funnelsController.getFunnel] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get funnel.',
      message: err.message 
    });
  }
}

/**
 * Create a new funnel
 */
async function createFunnel(req, res) {
  try {
    const { 
      name, 
      description, 
      funnelType, 
      goal, 
      targetMetric,
      customDomain,
      subdomain,
      urlSlug,
      settings 
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'name is required.' 
      });
    }

    const funnel = await FunnelService.createFunnel(
      req.user.orgId,
      req.user.id,
      {
        name: name.trim(),
        description,
        funnelType,
        goal,
        targetMetric,
        customDomain,
        subdomain,
        urlSlug,
        settings
      }
    );

    res.status(201).json({ 
      success: true,
      funnel 
    });
  } catch (err) {
    console.error('[funnelsController.createFunnel] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create funnel.',
      message: err.message 
    });
  }
}

/**
 * Update an existing funnel
 */
async function updateFunnel(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Nothing to update.' 
      });
    }

    const funnel = await FunnelService.updateFunnel(id, req.user.orgId, updates);
    
    if (!funnel) {
      return res.status(404).json({ 
        success: false,
        error: 'Funnel not found.' 
      });
    }

    res.json({ 
      success: true,
      funnel 
    });
  } catch (err) {
    console.error('[funnelsController.updateFunnel] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update funnel.',
      message: err.message 
    });
  }
}

/**
 * Delete a funnel
 */
async function deleteFunnel(req, res) {
  try {
    const { id } = req.params;

    const deleted = await FunnelService.deleteFunnel(id, req.user.orgId);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: 'Funnel not found.' 
      });
    }

    res.json({ 
      success: true,
      message: 'Funnel deleted successfully.' 
    });
  } catch (err) {
    console.error('[funnelsController.deleteFunnel] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete funnel.',
      message: err.message 
    });
  }
}

/**
 * Publish a funnel
 */
async function publishFunnel(req, res) {
  try {
    const { id } = req.params;

    const funnel = await FunnelService.publishFunnel(id, req.user.orgId);
    
    if (!funnel) {
      return res.status(404).json({ 
        success: false,
        error: 'Funnel not found.' 
      });
    }

    res.json({ 
      success: true,
      funnel,
      message: 'Funnel published successfully.' 
    });
  } catch (err) {
    console.error('[funnelsController.publishFunnel] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to publish funnel.',
      message: err.message 
    });
  }
}

/**
 * Create a funnel step
 */
async function createStep(req, res) {
  try {
    const { id } = req.params;
    const { 
      stepName, 
      stepType, 
      urlPath, 
      pageId,
      nextStepId,
      successStepId,
      failureStepId,
      conditions,
      settings 
    } = req.body;

    if (!stepName || !stepType || !urlPath) {
      return res.status(400).json({ 
        success: false,
        error: 'stepName, stepType, and urlPath are required.' 
      });
    }

    const step = await FunnelService.createStep(id, req.user.orgId, {
      stepName,
      stepType,
      urlPath,
      pageId,
      nextStepId,
      successStepId,
      failureStepId,
      conditions,
      settings
    });

    res.status(201).json({ 
      success: true,
      step 
    });
  } catch (err) {
    console.error('[funnelsController.createStep] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create step.',
      message: err.message 
    });
  }
}

/**
 * Update a funnel step
 */
async function updateStep(req, res) {
  try {
    const { id, stepId } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Nothing to update.' 
      });
    }

    const step = await FunnelService.updateStep(stepId, id, req.user.orgId, updates);
    
    if (!step) {
      return res.status(404).json({ 
        success: false,
        error: 'Step not found.' 
      });
    }

    res.json({ 
      success: true,
      step 
    });
  } catch (err) {
    console.error('[funnelsController.updateStep] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update step.',
      message: err.message 
    });
  }
}

/**
 * Delete a funnel step
 */
async function deleteStep(req, res) {
  try {
    const { id, stepId } = req.params;

    const deleted = await FunnelService.deleteStep(stepId, id, req.user.orgId);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: 'Step not found.' 
      });
    }

    res.json({ 
      success: true,
      message: 'Step deleted successfully.' 
    });
  } catch (err) {
    console.error('[funnelsController.deleteStep] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete step.',
      message: err.message 
    });
  }
}

/**
 * Reorder funnel steps
 */
async function reorderSteps(req, res) {
  try {
    const { id } = req.params;
    const { orderedStepIds } = req.body;

    if (!Array.isArray(orderedStepIds)) {
      return res.status(400).json({ 
        success: false,
        error: 'orderedStepIds must be an array.' 
      });
    }

    await FunnelService.reorderSteps(id, req.user.orgId, orderedStepIds);

    res.json({ 
      success: true,
      message: 'Steps reordered successfully.' 
    });
  } catch (err) {
    console.error('[funnelsController.reorderSteps] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reorder steps.',
      message: err.message 
    });
  }
}

/**
 * Get funnel analytics
 */
async function getAnalytics(req, res) {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const analytics = await FunnelService.getAnalytics(id, req.user.orgId, dateRange);

    res.json({ 
      success: true,
      analytics 
    });
  } catch (err) {
    console.error('[funnelsController.getAnalytics] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get analytics.',
      message: err.message 
    });
  }
}

/**
 * Track analytics event
 */
async function trackEvent(req, res) {
  try {
    const { id } = req.params;
    const eventData = {
      funnelId: id,
      ...req.body
    };

    const event = await FunnelService.trackEvent(eventData);

    res.status(201).json({ 
      success: true,
      event 
    });
  } catch (err) {
    console.error('[funnelsController.trackEvent] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to track event.',
      message: err.message 
    });
  }
}

/**
 * Track conversion
 */
async function trackConversion(req, res) {
  try {
    const { id } = req.params;
    const conversionData = {
      funnelId: id,
      ...req.body
    };

    const conversion = await FunnelService.trackConversion(conversionData);

    res.status(201).json({ 
      success: true,
      conversion 
    });
  } catch (err) {
    console.error('[funnelsController.trackConversion] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to track conversion.',
      message: err.message 
    });
  }
}

/**
 * Create A/B test
 */
async function createABTest(req, res) {
  try {
    const { id } = req.params;
    const { stepId, testName, testType, variants, trafficAllocation } = req.body;

    if (!testName || !variants || !Array.isArray(variants)) {
      return res.status(400).json({ 
        success: false,
        error: 'testName and variants array are required.' 
      });
    }

    const test = await FunnelService.createABTest(
      id,
      req.user.orgId,
      req.user.id,
      { stepId, testName, testType, variants, trafficAllocation }
    );

    res.status(201).json({ 
      success: true,
      test 
    });
  } catch (err) {
    console.error('[funnelsController.createABTest] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create A/B test.',
      message: err.message 
    });
  }
}

/**
 * Start A/B test
 */
async function startABTest(req, res) {
  try {
    const { id, testId } = req.params;

    const test = await FunnelService.startABTest(testId, req.user.orgId);
    
    if (!test) {
      return res.status(404).json({ 
        success: false,
        error: 'Test not found.' 
      });
    }

    res.json({ 
      success: true,
      test,
      message: 'A/B test started successfully.' 
    });
  } catch (err) {
    console.error('[funnelsController.startABTest] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to start A/B test.',
      message: err.message 
    });
  }
}

/**
 * Stop A/B test
 */
async function stopABTest(req, res) {
  try {
    const { id, testId } = req.params;
    const { winnerVariantId } = req.body;

    const test = await FunnelService.stopABTest(testId, req.user.orgId, winnerVariantId);
    
    if (!test) {
      return res.status(404).json({ 
        success: false,
        error: 'Test not found.' 
      });
    }

    res.json({ 
      success: true,
      test,
      message: 'A/B test stopped successfully.' 
    });
  } catch (err) {
    console.error('[funnelsController.stopABTest] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to stop A/B test.',
      message: err.message 
    });
  }
}

/**
 * Get A/B test results
 */
async function getABTestResults(req, res) {
  try {
    const { id, testId } = req.params;

    const results = await FunnelService.getABTestResults(testId, req.user.orgId);

    res.json({ 
      success: true,
      ...results 
    });
  } catch (err) {
    console.error('[funnelsController.getABTestResults] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get A/B test results.',
      message: err.message 
    });
  }
}

/**
 * List funnel templates
 */
async function listTemplates(req, res) {
  try {
    const { category, isSystem } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (isSystem !== undefined) filters.isSystem = isSystem === 'true';

    const templates = await FunnelService.listTemplates(filters);

    res.json({ 
      success: true,
      templates,
      count: templates.length 
    });
  } catch (err) {
    console.error('[funnelsController.listTemplates] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to list templates.',
      message: err.message 
    });
  }
}

/**
 * Create funnel from template
 */
async function createFromTemplate(req, res) {
  try {
    const { templateId } = req.params;
    const customizations = req.body;

    const funnel = await FunnelService.createFromTemplate(
      templateId,
      req.user.orgId,
      req.user.id,
      customizations
    );

    res.status(201).json({ 
      success: true,
      funnel,
      message: 'Funnel created from template successfully.' 
    });
  } catch (err) {
    console.error('[funnelsController.createFromTemplate] Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create funnel from template.',
      message: err.message 
    });
  }
}

module.exports = {
  listFunnels,
  getFunnel,
  createFunnel,
  updateFunnel,
  deleteFunnel,
  publishFunnel,
  createStep,
  updateStep,
  deleteStep,
  reorderSteps,
  getAnalytics,
  trackEvent,
  trackConversion,
  createABTest,
  startABTest,
  stopABTest,
  getABTestResults,
  listTemplates,
  createFromTemplate
};