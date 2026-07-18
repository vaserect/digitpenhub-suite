const SalesPlaybookService = require('../services/SalesPlaybookService');
const db = require('../db');

const salesPlaybookService = new SalesPlaybookService(db);

/**
 * Sales Playbook Controller - Handles HTTP requests for playbooks and battlecards
 */

// ==================== PLAYBOOKS ====================

exports.getPlaybooks = async (req, res) => {
  try {
    const { status, category, search, limit, offset } = req.query;
    const orgId = req.user.org_id;

    const playbooks = await salesPlaybookService.getPlaybooks(orgId, {
      status,
      category,
      search,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    res.json({ success: true, data: playbooks });
  } catch (error) {
    console.error('Error getting playbooks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPlaybookById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const playbook = await salesPlaybookService.getPlaybookById(parseInt(id), orgId);
    res.json({ success: true, data: playbook });
  } catch (error) {
    console.error('Error getting playbook:', error);
    res.status(error.message === 'Playbook not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
};

exports.createPlaybook = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.id;

    const playbook = await salesPlaybookService.createPlaybook(req.body, orgId, userId);
    res.status(201).json({ success: true, data: playbook });
  } catch (error) {
    console.error('Error creating playbook:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updatePlaybook = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;
    const userId = req.user.id;

    const playbook = await salesPlaybookService.updatePlaybook(parseInt(id), req.body, orgId, userId);
    res.json({ success: true, data: playbook });
  } catch (error) {
    console.error('Error updating playbook:', error);
    res.status(error.message === 'Playbook not found' ? 404 : 400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deletePlaybook = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const result = await salesPlaybookService.deletePlaybook(parseInt(id), orgId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting playbook:', error);
    res.status(error.message === 'Playbook not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
};

exports.publishPlaybook = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;
    const userId = req.user.id;

    const playbook = await salesPlaybookService.publishPlaybook(parseInt(id), orgId, userId);
    res.json({ success: true, data: playbook });
  } catch (error) {
    console.error('Error publishing playbook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== BATTLECARDS ====================

exports.getBattlecards = async (req, res) => {
  try {
    const { status, search, limit, offset } = req.query;
    const orgId = req.user.org_id;

    const battlecards = await salesPlaybookService.getBattlecards(orgId, {
      status,
      search,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    res.json({ success: true, data: battlecards });
  } catch (error) {
    console.error('Error getting battlecards:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBattlecardById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const battlecard = await salesPlaybookService.getBattlecardById(parseInt(id), orgId);
    res.json({ success: true, data: battlecard });
  } catch (error) {
    console.error('Error getting battlecard:', error);
    res.status(error.message === 'Battlecard not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getBattlecardsByCompetitor = async (req, res) => {
  try {
    const { name } = req.params;
    const orgId = req.user.org_id;

    const battlecards = await salesPlaybookService.getBattlecardsByCompetitor(name, orgId);
    res.json({ success: true, data: battlecards });
  } catch (error) {
    console.error('Error getting battlecards by competitor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createBattlecard = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.id;

    const battlecard = await salesPlaybookService.createBattlecard(req.body, orgId, userId);
    res.status(201).json({ success: true, data: battlecard });
  } catch (error) {
    console.error('Error creating battlecard:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateBattlecard = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const battlecard = await salesPlaybookService.updateBattlecard(parseInt(id), req.body, orgId);
    res.json({ success: true, data: battlecard });
  } catch (error) {
    console.error('Error updating battlecard:', error);
    res.status(error.message === 'Battlecard not found' ? 404 : 400).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteBattlecard = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const result = await salesPlaybookService.deleteBattlecard(parseInt(id), orgId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting battlecard:', error);
    res.status(error.message === 'Battlecard not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== CONTENT INTERACTION ====================

exports.trackView = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { duration, source } = req.body;
    const userId = req.user.id;

    const view = await salesPlaybookService.trackView(
      type,
      parseInt(id),
      userId,
      duration || 0,
      source || 'browse'
    );

    res.json({ success: true, data: view });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.rateContent = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const ratingResult = await salesPlaybookService.rateContent(
      type,
      parseInt(id),
      userId,
      rating,
      comment
    );

    res.json({ success: true, data: ratingResult });
  } catch (error) {
    console.error('Error rating content:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user.id;

    const result = await salesPlaybookService.toggleFavorite(type, parseInt(id), userId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const { type } = req.query;
    const userId = req.user.id;

    const favorites = await salesPlaybookService.getFavorites(userId, type);
    res.json({ success: true, data: favorites });
  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== SEARCH ====================

exports.searchContent = async (req, res) => {
  try {
    const { q, type, limit } = req.query;
    const orgId = req.user.org_id;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    const results = await salesPlaybookService.searchContent(orgId, q, {
      contentType: type,
      limit: parseInt(limit) || 50
    });

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error searching content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== STATISTICS ====================

exports.getStatistics = async (req, res) => {
  try {
    const orgId = req.user.org_id;

    const stats = await salesPlaybookService.getStatistics(orgId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
