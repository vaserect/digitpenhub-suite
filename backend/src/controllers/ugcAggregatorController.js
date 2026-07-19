const UGCAggregatorService = require('../services/UGCAggregatorService');
const UGCAggregatorRepository = require('../repositories/UGCAggregatorRepository');
const db = require('../db');

const ugcAggregatorRepository = new UGCAggregatorRepository(db);
const ugcAggregatorService = new UGCAggregatorService(ugcAggregatorRepository);

// ==================== FEEDS ====================

exports.listFeeds = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const feeds = await ugcAggregatorService.listFeeds(orgId, req.query);
    res.json({ success: true, data: feeds });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const feed = await ugcAggregatorService.getFeed(id, orgId);
    res.json({ success: true, data: feed });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

exports.createFeed = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const userId = req.user.id;
    const feed = await ugcAggregatorService.createFeed(req.body, orgId, userId);
    res.status(201).json({ success: true, data: feed });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateFeed = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const feed = await ugcAggregatorService.updateFeed(id, req.body, orgId);
    res.json({ success: true, data: feed });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteFeed = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    await ugcAggregatorService.deleteFeed(id, orgId);
    res.json({ success: true, message: 'Feed deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== POSTS moderation ====================

exports.listPosts = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const posts = await ugcAggregatorService.listPosts(orgId, req.query);
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approvePost = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const updated = await ugcAggregatorService.approvePost(id, orgId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.rejectPost = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const updated = await ugcAggregatorService.rejectPost(id, orgId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.tagShoppableProduct = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const { productId } = req.body;
    const updated = await ugcAggregatorService.tagShoppableProduct(id, productId, orgId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.togglePinPost = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const { pinned } = req.body;
    const updated = await ugcAggregatorService.togglePinPost(id, pinned, orgId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== FEED SYNC SYNCING ====================

exports.syncFeed = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const userId = req.user.id;
    const { id } = req.params;
    const posts = await ugcAggregatorService.triggerFeedSync(id, orgId, userId);
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== EMBED & TELEMETRY ====================

exports.getEmbedCode = (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const snippet = ugcAggregatorService.getEmbedCode(orgId);
    res.json({ success: true, data: { embed_code: snippet } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.recordTelemetry = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { type } = req.query; // 'impression' | 'click' | 'shoppable_click'
    const result = await ugcAggregatorService.recordTelemetry(orgId, type);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== ANALYTICS ====================

exports.getAnalytics = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { startDate, endDate } = req.query;
    const stats = await ugcAggregatorService.getExecutiveStats(orgId, startDate, endDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
