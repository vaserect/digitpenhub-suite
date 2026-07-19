const ABTestingService = require('../services/ABTestingService');
const ABTestingRepository = require('../repositories/ABTestingRepository');
const db = require('../db');

const abTestingRepository = new ABTestingRepository(db);
const abTestingService = new ABTestingService(abTestingRepository);

// ==================== EXPERIMENTS ====================

exports.listExperiments = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const experiments = await abTestingService.listExperiments(orgId, req.query);
    res.json({ success: true, data: experiments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getExperiment = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const data = await abTestingService.getExperiment(id, orgId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

exports.createExperiment = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const userId = req.user.id;
    const experiment = await abTestingService.createExperiment(req.body, orgId, userId);
    res.status(201).json({ success: true, data: experiment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateExperiment = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const updated = await abTestingService.updateExperiment(id, req.body, orgId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteExperiment = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    await abTestingService.deleteExperiment(id, orgId);
    res.json({ success: true, message: 'Experiment deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== VARIATIONS ====================

exports.createVariation = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { experimentId } = req.params;
    const variation = await abTestingService.createVariation(experimentId, req.body, orgId);
    res.status(201).json({ success: true, data: variation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateVariation = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { experimentId, id } = req.params;
    const updated = await abTestingService.updateVariation(id, experimentId, req.body, orgId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteVariation = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { experimentId, id } = req.params;
    await abTestingService.deleteVariation(id, experimentId, orgId);
    res.json({ success: true, message: 'Variation deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== LIVE TRAFFIC ROUTING ====================

exports.routeTraffic = async (req, res) => {
  try {
    const { id } = req.params;
    const routingResult = await abTestingService.routeTraffic(id);
    res.json({ success: true, data: routingResult });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.recordConversion = async (req, res) => {
  try {
    const { id, variationId } = req.params;
    const result = await abTestingService.recordConversion(id, variationId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== ANALYTICS ====================

exports.getAnalytics = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const report = await abTestingService.getExecutiveStats(id, orgId);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
