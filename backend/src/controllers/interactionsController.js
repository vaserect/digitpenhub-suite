const InteractionsService = require('../services/builder/InteractionsService');

/**
 * Controller for Website Builder Interactions & Animations
 */
class InteractionsController {
  /**
   * Get all interactions for organization
   * GET /api/v1/interactions
   */
  async getInteractions(req, res) {
    try {
      const { trigger_type, is_preset } = req.query;
      const filters = {};
      
      if (trigger_type) filters.triggerType = trigger_type;
      if (is_preset !== undefined) filters.isPreset = is_preset === 'true';

      const interactions = await InteractionsService.getInteractions(
        req.user.org_id,
        filters
      );

      res.json({
        success: true,
        interactions
      });
    } catch (error) {
      console.error('Error fetching interactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch interactions',
        error: error.message
      });
    }
  }

  /**
   * Get interaction by ID
   * GET /api/v1/interactions/:id
   */
  async getInteractionById(req, res) {
    try {
      const interaction = await InteractionsService.getInteractionById(
        req.params.id,
        req.user.org_id
      );

      if (!interaction) {
        return res.status(404).json({
          success: false,
          message: 'Interaction not found'
        });
      }

      res.json({
        success: true,
        interaction
      });
    } catch (error) {
      console.error('Error fetching interaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch interaction',
        error: error.message
      });
    }
  }

  /**
   * Create new interaction
   * POST /api/v1/interactions
   */
  async createInteraction(req, res) {
    try {
      const interaction = await InteractionsService.createInteraction(
        req.user.org_id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Interaction created successfully',
        interaction
      });
    } catch (error) {
      console.error('Error creating interaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create interaction',
        error: error.message
      });
    }
  }

  /**
   * Update interaction
   * PUT /api/v1/interactions/:id
   */
  async updateInteraction(req, res) {
    try {
      const interaction = await InteractionsService.updateInteraction(
        req.params.id,
        req.user.org_id,
        req.body
      );

      if (!interaction) {
        return res.status(404).json({
          success: false,
          message: 'Interaction not found'
        });
      }

      res.json({
        success: true,
        message: 'Interaction updated successfully',
        interaction
      });
    } catch (error) {
      console.error('Error updating interaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update interaction',
        error: error.message
      });
    }
  }

  /**
   * Delete interaction
   * DELETE /api/v1/interactions/:id
   */
  async deleteInteraction(req, res) {
    try {
      const interaction = await InteractionsService.deleteInteraction(
        req.params.id,
        req.user.org_id
      );

      if (!interaction) {
        return res.status(404).json({
          success: false,
          message: 'Interaction not found'
        });
      }

      res.json({
        success: true,
        message: 'Interaction deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting interaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete interaction',
        error: error.message
      });
    }
  }

  /**
   * Duplicate interaction
   * POST /api/v1/interactions/:id/duplicate
   */
  async duplicateInteraction(req, res) {
    try {
      const { name } = req.body;
      const interaction = await InteractionsService.duplicateInteraction(
        req.params.id,
        req.user.org_id,
        name
      );

      res.status(201).json({
        success: true,
        message: 'Interaction duplicated successfully',
        interaction
      });
    } catch (error) {
      console.error('Error duplicating interaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to duplicate interaction',
        error: error.message
      });
    }
  }

  /**
   * Get interaction usage stats
   * GET /api/v1/interactions/:id/stats
   */
  async getInteractionStats(req, res) {
    try {
      const stats = await InteractionsService.getInteractionStats(req.params.id);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error fetching interaction stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch interaction stats',
        error: error.message
      });
    }
  }

  /**
   * Apply interaction to element
   * POST /api/v1/interactions/apply
   */
  async applyInteractionToElement(req, res) {
    try {
      const { pageId, elementId, interactionId, options } = req.body;

      if (!pageId || !elementId || !interactionId) {
        return res.status(400).json({
          success: false,
          message: 'pageId, elementId, and interactionId are required'
        });
      }

      const applied = await InteractionsService.applyInteractionToElement(
        pageId,
        elementId,
        interactionId,
        options
      );

      res.status(201).json({
        success: true,
        message: 'Interaction applied to element',
        applied
      });
    } catch (error) {
      console.error('Error applying interaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply interaction',
        error: error.message
      });
    }
  }

  /**
   * Get element interactions
   * GET /api/v1/interactions/elements/:pageId
   */
  async getElementInteractions(req, res) {
    try {
      const { elementId } = req.query;
      const interactions = await InteractionsService.getElementInteractions(
        req.params.pageId,
        elementId
      );

      res.json({
        success: true,
        interactions
      });
    } catch (error) {
      console.error('Error fetching element interactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch element interactions',
        error: error.message
      });
    }
  }

  /**
   * Remove interaction from element
   * DELETE /api/v1/interactions/elements/:id
   */
  async removeInteractionFromElement(req, res) {
    try {
      const removed = await InteractionsService.removeInteractionFromElement(
        req.params.id
      );

      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'Element interaction not found'
        });
      }

      res.json({
        success: true,
        message: 'Interaction removed from element'
      });
    } catch (error) {
      console.error('Error removing interaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove interaction',
        error: error.message
      });
    }
  }

  /**
   * Get animation presets
   * GET /api/v1/interactions/presets
   */
  async getAnimationPresets(req, res) {
    try {
      const { category, is_premium } = req.query;
      const filters = {};
      
      if (category) filters.category = category;
      if (is_premium !== undefined) filters.isPremium = is_premium === 'true';

      const presets = await InteractionsService.getAnimationPresets(filters);

      res.json({
        success: true,
        presets
      });
    } catch (error) {
      console.error('Error fetching animation presets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch animation presets',
        error: error.message
      });
    }
  }

  /**
   * Get preset by ID
   * GET /api/v1/interactions/presets/:id
   */
  async getPresetById(req, res) {
    try {
      const preset = await InteractionsService.getPresetById(req.params.id);

      if (!preset) {
        return res.status(404).json({
          success: false,
          message: 'Preset not found'
        });
      }

      // Increment popularity when preset is viewed
      await InteractionsService.incrementPresetPopularity(req.params.id);

      res.json({
        success: true,
        preset
      });
    } catch (error) {
      console.error('Error fetching preset:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch preset',
        error: error.message
      });
    }
  }

  /**
   * Create scroll animation
   * POST /api/v1/interactions/scroll
   */
  async createScrollAnimation(req, res) {
    try {
      const { pageId, elementId, config } = req.body;

      if (!pageId || !elementId) {
        return res.status(400).json({
          success: false,
          message: 'pageId and elementId are required'
        });
      }

      const animation = await InteractionsService.createScrollAnimation(
        pageId,
        elementId,
        config
      );

      res.status(201).json({
        success: true,
        message: 'Scroll animation created',
        animation
      });
    } catch (error) {
      console.error('Error creating scroll animation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create scroll animation',
        error: error.message
      });
    }
  }

  /**
   * Get scroll animations
   * GET /api/v1/interactions/scroll/:pageId
   */
  async getScrollAnimations(req, res) {
    try {
      const { elementId } = req.query;
      const animations = await InteractionsService.getScrollAnimations(
        req.params.pageId,
        elementId
      );

      res.json({
        success: true,
        animations
      });
    } catch (error) {
      console.error('Error fetching scroll animations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scroll animations',
        error: error.message
      });
    }
  }

  /**
   * Update scroll animation
   * PUT /api/v1/interactions/scroll/:id
   */
  async updateScrollAnimation(req, res) {
    try {
      const animation = await InteractionsService.updateScrollAnimation(
        req.params.id,
        req.body
      );

      if (!animation) {
        return res.status(404).json({
          success: false,
          message: 'Scroll animation not found'
        });
      }

      res.json({
        success: true,
        message: 'Scroll animation updated',
        animation
      });
    } catch (error) {
      console.error('Error updating scroll animation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update scroll animation',
        error: error.message
      });
    }
  }

  /**
   * Delete scroll animation
   * DELETE /api/v1/interactions/scroll/:id
   */
  async deleteScrollAnimation(req, res) {
    try {
      const animation = await InteractionsService.deleteScrollAnimation(
        req.params.id
      );

      if (!animation) {
        return res.status(404).json({
          success: false,
          message: 'Scroll animation not found'
        });
      }

      res.json({
        success: true,
        message: 'Scroll animation deleted'
      });
    } catch (error) {
      console.error('Error deleting scroll animation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete scroll animation',
        error: error.message
      });
    }
  }
}

module.exports = new InteractionsController();
