const ComponentsService = require('../services/builder/ComponentsService');

/**
 * Controller for Component Variants System
 */
class ComponentsController {
  /**
   * Get all components
   * GET /api/v1/components
   */
  async getComponents(req, res) {
    try {
      const { category, is_published, is_system } = req.query;
      const filters = {};
      
      if (category) filters.category = category;
      if (is_published !== undefined) filters.isPublished = is_published === 'true';
      if (is_system !== undefined) filters.isSystem = is_system === 'true';

      const components = await ComponentsService.getComponents(
        req.user.org_id,
        filters
      );

      res.json({
        success: true,
        components
      });
    } catch (error) {
      console.error('Error fetching components:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch components',
        error: error.message
      });
    }
  }

  /**
   * Get component by ID
   * GET /api/v1/components/:id
   */
  async getComponentById(req, res) {
    try {
      const component = await ComponentsService.getComponentById(
        req.params.id,
        req.user.org_id
      );

      if (!component) {
        return res.status(404).json({
          success: false,
          message: 'Component not found'
        });
      }

      res.json({
        success: true,
        component
      });
    } catch (error) {
      console.error('Error fetching component:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch component',
        error: error.message
      });
    }
  }

  /**
   * Create component
   * POST /api/v1/components
   */
  async createComponent(req, res) {
    try {
      const component = await ComponentsService.createComponent(
        req.user.org_id,
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Component created successfully',
        component
      });
    } catch (error) {
      console.error('Error creating component:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create component',
        error: error.message
      });
    }
  }

  /**
   * Update component
   * PUT /api/v1/components/:id
   */
  async updateComponent(req, res) {
    try {
      const component = await ComponentsService.updateComponent(
        req.params.id,
        req.user.org_id,
        req.body
      );

      if (!component) {
        return res.status(404).json({
          success: false,
          message: 'Component not found'
        });
      }

      res.json({
        success: true,
        message: 'Component updated successfully',
        component
      });
    } catch (error) {
      console.error('Error updating component:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update component',
        error: error.message
      });
    }
  }

  /**
   * Delete component
   * DELETE /api/v1/components/:id
   */
  async deleteComponent(req, res) {
    try {
      await ComponentsService.deleteComponent(req.params.id, req.user.org_id);

      res.json({
        success: true,
        message: 'Component deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting component:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete component',
        error: error.message
      });
    }
  }

  /**
   * Duplicate component
   * POST /api/v1/components/:id/duplicate
   */
  async duplicateComponent(req, res) {
    try {
      const { name } = req.body;
      const component = await ComponentsService.duplicateComponent(
        req.params.id,
        req.user.org_id,
        req.user.id,
        name
      );

      res.status(201).json({
        success: true,
        message: 'Component duplicated successfully',
        component
      });
    } catch (error) {
      console.error('Error duplicating component:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to duplicate component',
        error: error.message
      });
    }
  }

  /**
   * Get component variants
   * GET /api/v1/components/:id/variants
   */
  async getVariants(req, res) {
    try {
      const variants = await ComponentsService.getVariants(req.params.id);

      res.json({
        success: true,
        variants
      });
    } catch (error) {
      console.error('Error fetching variants:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch variants',
        error: error.message
      });
    }
  }

  /**
   * Create variant
   * POST /api/v1/components/:id/variants
   */
  async createVariant(req, res) {
    try {
      const variant = await ComponentsService.createVariant(
        req.params.id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Variant created successfully',
        variant
      });
    } catch (error) {
      console.error('Error creating variant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create variant',
        error: error.message
      });
    }
  }

  /**
   * Update variant
   * PUT /api/v1/components/variants/:id
   */
  async updateVariant(req, res) {
    try {
      const variant = await ComponentsService.updateVariant(
        req.params.id,
        req.body
      );

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Variant not found'
        });
      }

      res.json({
        success: true,
        message: 'Variant updated successfully',
        variant
      });
    } catch (error) {
      console.error('Error updating variant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update variant',
        error: error.message
      });
    }
  }

  /**
   * Delete variant
   * DELETE /api/v1/components/variants/:id
   */
  async deleteVariant(req, res) {
    try {
      await ComponentsService.deleteVariant(req.params.id);

      res.json({
        success: true,
        message: 'Variant deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting variant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete variant',
        error: error.message
      });
    }
  }

  /**
   * Create component instance
   * POST /api/v1/components/instances
   */
  async createInstance(req, res) {
    try {
      const { pageId, elementId, componentId, variantId, overrides } = req.body;

      if (!pageId || !elementId || !componentId) {
        return res.status(400).json({
          success: false,
          message: 'pageId, elementId, and componentId are required'
        });
      }

      const instance = await ComponentsService.createInstance(
        pageId,
        elementId,
        componentId,
        variantId,
        overrides
      );

      res.status(201).json({
        success: true,
        message: 'Component instance created',
        instance
      });
    } catch (error) {
      console.error('Error creating instance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create instance',
        error: error.message
      });
    }
  }

  /**
   * Get component instances for page
   * GET /api/v1/components/instances/:pageId
   */
  async getInstances(req, res) {
    try {
      const instances = await ComponentsService.getInstances(req.params.pageId);

      res.json({
        success: true,
        instances
      });
    } catch (error) {
      console.error('Error fetching instances:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch instances',
        error: error.message
      });
    }
  }

  /**
   * Update component instance
   * PUT /api/v1/components/instances/:id
   */
  async updateInstance(req, res) {
    try {
      const instance = await ComponentsService.updateInstance(
        req.params.id,
        req.body
      );

      if (!instance) {
        return res.status(404).json({
          success: false,
          message: 'Instance not found'
        });
      }

      res.json({
        success: true,
        message: 'Instance updated successfully',
        instance
      });
    } catch (error) {
      console.error('Error updating instance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update instance',
        error: error.message
      });
    }
  }

  /**
   * Delete component instance
   * DELETE /api/v1/components/instances/:id
   */
  async deleteInstance(req, res) {
    try {
      await ComponentsService.deleteInstance(req.params.id);

      res.json({
        success: true,
        message: 'Instance deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting instance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete instance',
        error: error.message
      });
    }
  }

  /**
   * Get component libraries
   * GET /api/v1/components/libraries
   */
  async getLibraries(req, res) {
    try {
      const libraries = await ComponentsService.getLibraries(req.user.org_id);

      res.json({
        success: true,
        libraries
      });
    } catch (error) {
      console.error('Error fetching libraries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch libraries',
        error: error.message
      });
    }
  }

  /**
   * Create library
   * POST /api/v1/components/libraries
   */
  async createLibrary(req, res) {
    try {
      const library = await ComponentsService.createLibrary(
        req.user.org_id,
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Library created successfully',
        library
      });
    } catch (error) {
      console.error('Error creating library:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create library',
        error: error.message
      });
    }
  }

  /**
   * Get library components
   * GET /api/v1/components/libraries/:id/components
   */
  async getLibraryComponents(req, res) {
    try {
      const components = await ComponentsService.getLibraryComponents(req.params.id);

      res.json({
        success: true,
        components
      });
    } catch (error) {
      console.error('Error fetching library components:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch library components',
        error: error.message
      });
    }
  }

  /**
   * Add component to library
   * POST /api/v1/components/libraries/:id/components
   */
  async addToLibrary(req, res) {
    try {
      const { componentId } = req.body;

      if (!componentId) {
        return res.status(400).json({
          success: false,
          message: 'componentId is required'
        });
      }

      await ComponentsService.addToLibrary(req.params.id, componentId);

      res.json({
        success: true,
        message: 'Component added to library'
      });
    } catch (error) {
      console.error('Error adding to library:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add component to library',
        error: error.message
      });
    }
  }

  /**
   * Remove component from library
   * DELETE /api/v1/components/libraries/:id/components/:componentId
   */
  async removeFromLibrary(req, res) {
    try {
      await ComponentsService.removeFromLibrary(
        req.params.id,
        req.params.componentId
      );

      res.json({
        success: true,
        message: 'Component removed from library'
      });
    } catch (error) {
      console.error('Error removing from library:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove component from library',
        error: error.message
      });
    }
  }
}

module.exports = new ComponentsController();