const ResponsiveService = require('../services/builder/ResponsiveService');

/**
 * Controller for Responsive Breakpoints System
 */
class ResponsiveController {
  /**
   * Get all breakpoints for organization
   * GET /api/v1/responsive/breakpoints
   */
  async getBreakpoints(req, res) {
    try {
      const breakpoints = await ResponsiveService.getBreakpoints(req.user.org_id);

      res.json({
        success: true,
        breakpoints
      });
    } catch (error) {
      console.error('Error fetching breakpoints:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch breakpoints',
        error: error.message
      });
    }
  }

  /**
   * Get breakpoint by ID
   * GET /api/v1/responsive/breakpoints/:id
   */
  async getBreakpointById(req, res) {
    try {
      const breakpoint = await ResponsiveService.getBreakpointById(
        req.params.id,
        req.user.org_id
      );

      if (!breakpoint) {
        return res.status(404).json({
          success: false,
          message: 'Breakpoint not found'
        });
      }

      res.json({
        success: true,
        breakpoint
      });
    } catch (error) {
      console.error('Error fetching breakpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch breakpoint',
        error: error.message
      });
    }
  }

  /**
   * Create custom breakpoint
   * POST /api/v1/responsive/breakpoints
   */
  async createBreakpoint(req, res) {
    try {
      const breakpoint = await ResponsiveService.createBreakpoint(
        req.user.org_id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Breakpoint created successfully',
        breakpoint
      });
    } catch (error) {
      console.error('Error creating breakpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create breakpoint',
        error: error.message
      });
    }
  }

  /**
   * Update breakpoint
   * PUT /api/v1/responsive/breakpoints/:id
   */
  async updateBreakpoint(req, res) {
    try {
      const breakpoint = await ResponsiveService.updateBreakpoint(
        req.params.id,
        req.user.org_id,
        req.body
      );

      res.json({
        success: true,
        message: 'Breakpoint updated successfully',
        breakpoint
      });
    } catch (error) {
      console.error('Error updating breakpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update breakpoint',
        error: error.message
      });
    }
  }

  /**
   * Delete breakpoint
   * DELETE /api/v1/responsive/breakpoints/:id
   */
  async deleteBreakpoint(req, res) {
    try {
      await ResponsiveService.deleteBreakpoint(req.params.id, req.user.org_id);

      res.json({
        success: true,
        message: 'Breakpoint deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting breakpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete breakpoint',
        error: error.message
      });
    }
  }

  /**
   * Set default breakpoint
   * POST /api/v1/responsive/breakpoints/:id/set-default
   */
  async setDefaultBreakpoint(req, res) {
    try {
      const breakpoint = await ResponsiveService.setDefaultBreakpoint(
        req.params.id,
        req.user.org_id
      );

      res.json({
        success: true,
        message: 'Default breakpoint set successfully',
        breakpoint
      });
    } catch (error) {
      console.error('Error setting default breakpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set default breakpoint',
        error: error.message
      });
    }
  }

  /**
   * Reorder breakpoints
   * POST /api/v1/responsive/breakpoints/reorder
   */
  async reorderBreakpoints(req, res) {
    try {
      const { breakpointIds } = req.body;

      if (!Array.isArray(breakpointIds)) {
        return res.status(400).json({
          success: false,
          message: 'breakpointIds must be an array'
        });
      }

      await ResponsiveService.reorderBreakpoints(req.user.org_id, breakpointIds);

      res.json({
        success: true,
        message: 'Breakpoints reordered successfully'
      });
    } catch (error) {
      console.error('Error reordering breakpoints:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reorder breakpoints',
        error: error.message
      });
    }
  }

  /**
   * Get element styles
   * GET /api/v1/responsive/styles/:pageId/:elementId
   */
  async getElementStyles(req, res) {
    try {
      const { pageId, elementId } = req.params;
      const { breakpointId } = req.query;

      const styles = await ResponsiveService.getElementStyles(
        pageId,
        elementId,
        breakpointId
      );

      res.json({
        success: true,
        styles
      });
    } catch (error) {
      console.error('Error fetching element styles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch element styles',
        error: error.message
      });
    }
  }

  /**
   * Save element styles
   * POST /api/v1/responsive/styles
   */
  async saveElementStyles(req, res) {
    try {
      const { pageId, elementId, breakpointId, styles } = req.body;

      if (!pageId || !elementId || !breakpointId) {
        return res.status(400).json({
          success: false,
          message: 'pageId, elementId, and breakpointId are required'
        });
      }

      const saved = await ResponsiveService.saveElementStyles(
        pageId,
        elementId,
        breakpointId,
        styles
      );

      res.json({
        success: true,
        message: 'Element styles saved successfully',
        styles: saved
      });
    } catch (error) {
      console.error('Error saving element styles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save element styles',
        error: error.message
      });
    }
  }

  /**
   * Delete element styles
   * DELETE /api/v1/responsive/styles/:pageId/:elementId/:breakpointId
   */
  async deleteElementStyles(req, res) {
    try {
      const { pageId, elementId, breakpointId } = req.params;

      await ResponsiveService.deleteElementStyles(pageId, elementId, breakpointId);

      res.json({
        success: true,
        message: 'Element styles deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting element styles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete element styles',
        error: error.message
      });
    }
  }

  /**
   * Get computed styles (with inheritance)
   * GET /api/v1/responsive/computed/:pageId/:elementId/:breakpointId
   */
  async getComputedStyles(req, res) {
    try {
      const { pageId, elementId, breakpointId } = req.params;

      const styles = await ResponsiveService.getComputedStyles(
        pageId,
        elementId,
        breakpointId
      );

      res.json({
        success: true,
        styles
      });
    } catch (error) {
      console.error('Error fetching computed styles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch computed styles',
        error: error.message
      });
    }
  }

  /**
   * Get inheritance chain
   * GET /api/v1/responsive/inheritance/:breakpointId
   */
  async getInheritanceChain(req, res) {
    try {
      const chain = await ResponsiveService.getInheritanceChain(req.params.breakpointId);

      res.json({
        success: true,
        chain
      });
    } catch (error) {
      console.error('Error fetching inheritance chain:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inheritance chain',
        error: error.message
      });
    }
  }

  /**
   * Save responsive image
   * POST /api/v1/responsive/images
   */
  async saveResponsiveImage(req, res) {
    try {
      const { pageId, elementId, breakpointId, imageData } = req.body;

      if (!pageId || !elementId || !breakpointId || !imageData) {
        return res.status(400).json({
          success: false,
          message: 'pageId, elementId, breakpointId, and imageData are required'
        });
      }

      const image = await ResponsiveService.saveResponsiveImage(
        pageId,
        elementId,
        breakpointId,
        imageData
      );

      res.json({
        success: true,
        message: 'Responsive image saved successfully',
        image
      });
    } catch (error) {
      console.error('Error saving responsive image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save responsive image',
        error: error.message
      });
    }
  }

  /**
   * Get responsive images
   * GET /api/v1/responsive/images/:pageId/:elementId
   */
  async getResponsiveImages(req, res) {
    try {
      const { pageId, elementId } = req.params;

      const images = await ResponsiveService.getResponsiveImages(pageId, elementId);

      res.json({
        success: true,
        images
      });
    } catch (error) {
      console.error('Error fetching responsive images:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch responsive images',
        error: error.message
      });
    }
  }
}

module.exports = new ResponsiveController();
