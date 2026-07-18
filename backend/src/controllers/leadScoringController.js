// backend/src/controllers/leadScoringController.js
// Module 25: Lead Scoring Controller
// Benchmark: MadKudu / HubSpot Lead Scoring

const LeadScoringService = require('../services/leads/LeadScoringService');

class LeadScoringController {
  /**
   * GET /api/v1/lead-scoring/models
   * List all scoring models for the organization
   */
  async listModels(req, res) {
    try {
      const { org_id } = req.user;
      const { active_only } = req.query;
      
      const models = await LeadScoringService.getModels(org_id, {
        activeOnly: active_only === 'true'
      });
      
      res.json({ success: true, data: models });
    } catch (error) {
      console.error('Error listing scoring models:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/v1/lead-scoring/models/default
   * Get the default scoring model
   */
  async getDefaultModel(req, res) {
    try {
      const { org_id } = req.user;
      
      const model = await LeadScoringService.getDefaultModel(org_id);
      
      res.json({ success: true, data: model });
    } catch (error) {
      console.error('Error getting default model:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/v1/lead-scoring/models
   * Create a new scoring model
   */
  async createModel(req, res) {
    try {
      const { org_id, id: user_id } = req.user;
      const { name, description, is_active, is_default } = req.body;
      
      const model = await LeadScoringService.createModel(
        org_id,
        { name, description, is_active, is_default },
        user_id
      );
      
      res.status(201).json({ success: true, data: model });
    } catch (error) {
      console.error('Error creating scoring model:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /api/v1/lead-scoring/models/:id
   * Update a scoring model
   */
  async updateModel(req, res) {
    try {
      const { org_id, id: user_id } = req.user;
      const { id } = req.params;
      const { name, description, is_active, is_default } = req.body;
      
      const model = await LeadScoringService.updateModel(
        id,
        org_id,
        { name, description, is_active, is_default },
        user_id
      );
      
      res.json({ success: true, data: model });
    } catch (error) {
      console.error('Error updating scoring model:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/v1/lead-scoring/models/:id
   * Delete a scoring model
   */
  async deleteModel(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      
      await LeadScoringService.deleteModel(id, org_id);
      
      res.json({ success: true, message: 'Model deleted successfully' });
    } catch (error) {
      console.error('Error deleting scoring model:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/v1/lead-scoring/models/:id/rules
   * List rules for a scoring model
   */
  async listRules(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const { active_only } = req.query;
      
      const rules = await LeadScoringService.getRules(id, org_id, {
        activeOnly: active_only === 'true'
      });
      
      res.json({ success: true, data: rules });
    } catch (error) {
      console.error('Error listing scoring rules:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/v1/lead-scoring/rules
   * Create a new scoring rule
   */
  async createRule(req, res) {
    try {
      const { org_id, id: user_id } = req.user;
      const { model_id, name, description, rule_type, conditions, score_change, is_active, priority } = req.body;
      
      const rule = await LeadScoringService.createRule(
        model_id,
        org_id,
        { name, description, rule_type, conditions, score_change, is_active, priority },
        user_id
      );
      
      res.status(201).json({ success: true, data: rule });
    } catch (error) {
      console.error('Error creating scoring rule:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /api/v1/lead-scoring/rules/:id
   * Update a scoring rule
   */
  async updateRule(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const { name, description, rule_type, conditions, score_change, is_active, priority } = req.body;
      
      const rule = await LeadScoringService.updateRule(
        id,
        org_id,
        { name, description, rule_type, conditions, score_change, is_active, priority }
      );
      
      res.json({ success: true, data: rule });
    } catch (error) {
      console.error('Error updating scoring rule:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/v1/lead-scoring/rules/:id
   * Delete a scoring rule
   */
  async deleteRule(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      
      await LeadScoringService.deleteRule(id, org_id);
      
      res.json({ success: true, message: 'Rule deleted successfully' });
    } catch (error) {
      console.error('Error deleting scoring rule:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/v1/lead-scoring/calculate/:contactId
   * Calculate score for a specific contact
   */
  async calculateContactScore(req, res) {
    try {
      const { org_id, id: user_id } = req.user;
      const { contactId } = req.params;
      const { model_id, reason } = req.body;
      
      const result = await LeadScoringService.calculateContactScore(
        contactId,
        org_id,
        model_id,
        { triggeredBy: 'manual', userId: user_id, reason }
      );
      
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error calculating contact score:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/v1/lead-scoring/bulk-calculate
   * Bulk calculate scores for multiple contacts
   */
  async bulkCalculateScores(req, res) {
    try {
      const { org_id } = req.user;
      const { model_id, contact_ids, limit } = req.body;
      
      const result = await LeadScoringService.bulkCalculateScores(
        org_id,
        model_id,
        { contactIds: contact_ids, limit }
      );
      
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error bulk calculating scores:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/v1/lead-scoring/contacts/:contactId/score
   * Get current score for a contact
   */
  async getContactScore(req, res) {
    try {
      const { org_id } = req.user;
      const { contactId } = req.params;
      const { model_id } = req.query;
      
      const score = await LeadScoringService.getContactScore(contactId, org_id, model_id);
      
      res.json({ success: true, data: score });
    } catch (error) {
      console.error('Error getting contact score:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/v1/lead-scoring/contacts/:contactId/history
   * Get score history for a contact
   */
  async getContactScoreHistory(req, res) {
    try {
      const { org_id } = req.user;
      const { contactId } = req.params;
      const { model_id, limit, offset } = req.query;
      
      const history = await LeadScoringService.getContactScoreHistory(
        contactId,
        org_id,
        { 
          modelId: model_id, 
          limit: parseInt(limit) || 50, 
          offset: parseInt(offset) || 0 
        }
      );
      
      res.json({ success: true, data: history });
    } catch (error) {
      console.error('Error getting contact score history:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/v1/lead-scoring/models/:id/thresholds
   * Get thresholds for a model
   */
  async listThresholds(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      
      const thresholds = await LeadScoringService.getThresholds(id, org_id);
      
      res.json({ success: true, data: thresholds });
    } catch (error) {
      console.error('Error listing thresholds:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/v1/lead-scoring/thresholds
   * Create a new threshold
   */
  async createThreshold(req, res) {
    try {
      const { org_id } = req.user;
      const { model_id, name, min_score, max_score, color, notify_on_reach, notification_config } = req.body;
      
      const threshold = await LeadScoringService.createThreshold(
        model_id,
        org_id,
        { name, min_score, max_score, color, notify_on_reach, notification_config }
      );
      
      res.status(201).json({ success: true, data: threshold });
    } catch (error) {
      console.error('Error creating threshold:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /api/v1/lead-scoring/thresholds/:id
   * Update a threshold
   */
  async updateThreshold(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const { name, min_score, max_score, color, notify_on_reach, notification_config } = req.body;
      
      const threshold = await LeadScoringService.updateThreshold(
        id,
        org_id,
        { name, min_score, max_score, color, notify_on_reach, notification_config }
      );
      
      res.json({ success: true, data: threshold });
    } catch (error) {
      console.error('Error updating threshold:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/v1/lead-scoring/thresholds/:id
   * Delete a threshold
   */
  async deleteThreshold(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      
      await LeadScoringService.deleteThreshold(id, org_id);
      
      res.json({ success: true, message: 'Threshold deleted successfully' });
    } catch (error) {
      console.error('Error deleting threshold:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/v1/lead-scoring/analytics
   * Get scoring analytics
   */
  async getAnalytics(req, res) {
    try {
      const { org_id } = req.user;
      const { model_id, start_date, end_date } = req.query;
      
      if (!model_id) {
        return res.status(400).json({ success: false, error: 'model_id is required' });
      }
      
      const analytics = await LeadScoringService.getAnalytics(
        org_id,
        model_id,
        { startDate: start_date, endDate: end_date }
      );
      
      res.json({ success: true, data: analytics });
    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/v1/lead-scoring/activities
   * Record an activity for behavioral scoring
   */
  async recordActivity(req, res) {
    try {
      const { org_id } = req.user;
      const { contact_id, activity_type, activity_data } = req.body;
      
      await LeadScoringService.recordActivity(
        contact_id,
        org_id,
        activity_type,
        activity_data
      );
      
      res.json({ success: true, message: 'Activity recorded and score updated' });
    } catch (error) {
      console.error('Error recording activity:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new LeadScoringController();
