const DirectMailService = require('../services/DirectMailService');
const DirectMailRepository = require('../repositories/DirectMailRepository');
const db = require('../db');

const directMailRepository = new DirectMailRepository(db);
const directMailService = new DirectMailService(directMailRepository);

// ==================== TEMPLATES ====================

exports.listTemplates = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const templates = await directMailService.listTemplates(orgId, req.query);
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTemplate = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const template = await directMailService.getTemplate(id, orgId);
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const template = await directMailService.createTemplate(req.body, orgId);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const template = await directMailService.updateTemplate(id, req.body, orgId);
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    await directMailService.deleteTemplate(id, orgId);
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== CAMPAIGNS ====================

exports.listCampaigns = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const campaigns = await directMailService.listCampaigns(orgId, req.query);
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCampaign = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const campaign = await directMailService.getCampaign(id, orgId);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const campaign = await directMailService.createCampaign(req.body, orgId);
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const campaign = await directMailService.updateCampaign(id, req.body, orgId);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    await directMailService.deleteCampaign(id, orgId);
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== MAIL SENDS ====================

exports.listSends = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const sends = await directMailService.listSends(orgId, req.query);
    res.json({ success: true, data: sends });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSend = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const send = await directMailService.getSend(id, orgId);
    res.json({ success: true, data: send });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

exports.sendMail = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const send = await directMailService.sendDirectMail(req.body, orgId);
    res.status(201).json({ success: true, data: send });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.simulateTransit = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const updated = await directMailService.simulateStatusAdvance(id, orgId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== ANALYTICS ====================

exports.getAnalytics = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { startDate, endDate } = req.query;
    const stats = await directMailService.getExecutiveAnalytics(orgId, startDate, endDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
