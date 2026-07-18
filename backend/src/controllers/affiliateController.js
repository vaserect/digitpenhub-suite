const AffiliateService = require('../services/AffiliateService');

class AffiliateController {
  // ============================================================================
  // AFFILIATE MANAGEMENT
  // ============================================================================

  /**
   * Create a new affiliate
   * POST /api/affiliates
   */
  async createAffiliate(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliate = await AffiliateService.createAffiliate(orgId, req.body);
      
      res.status(201).json({
        success: true,
        data: affiliate,
        message: 'Affiliate created successfully'
      });
    } catch (error) {
      console.error('Error creating affiliate:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create affiliate'
      });
    }
  }

  /**
   * List all affiliates
   * GET /api/affiliates
   */
  async listAffiliates(req, res) {
    try {
      const orgId = req.user.org_id;
      const filters = {
        status: req.query.status,
        search: req.query.search,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order
      };

      const result = await AffiliateService.listAffiliates(orgId, filters);
      
      res.json({
        success: true,
        data: result.affiliates,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          pages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      console.error('Error listing affiliates:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to list affiliates'
      });
    }
  }

  /**
   * Get single affiliate
   * GET /api/affiliates/:id
   */
  async getAffiliate(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;

      const affiliate = await AffiliateService.getAffiliate(orgId, affiliateId);
      
      res.json({
        success: true,
        data: affiliate
      });
    } catch (error) {
      console.error('Error getting affiliate:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Affiliate not found'
      });
    }
  }

  /**
   * Update affiliate
   * PUT /api/affiliates/:id
   */
  async updateAffiliate(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;

      const affiliate = await AffiliateService.updateAffiliate(orgId, affiliateId, req.body);
      
      res.json({
        success: true,
        data: affiliate,
        message: 'Affiliate updated successfully'
      });
    } catch (error) {
      console.error('Error updating affiliate:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update affiliate'
      });
    }
  }

  /**
   * Delete affiliate
   * DELETE /api/affiliates/:id
   */
  async deleteAffiliate(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;

      await AffiliateService.deleteAffiliate(orgId, affiliateId);
      
      res.json({
        success: true,
        message: 'Affiliate deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting affiliate:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete affiliate'
      });
    }
  }

  /**
   * Approve affiliate
   * POST /api/affiliates/:id/approve
   */
  async approveAffiliate(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;

      const affiliate = await AffiliateService.approveAffiliate(orgId, affiliateId);
      
      res.json({
        success: true,
        data: affiliate,
        message: 'Affiliate approved successfully'
      });
    } catch (error) {
      console.error('Error approving affiliate:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to approve affiliate'
      });
    }
  }

  /**
   * Pause affiliate
   * POST /api/affiliates/:id/pause
   */
  async pauseAffiliate(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;

      const affiliate = await AffiliateService.pauseAffiliate(orgId, affiliateId);
      
      res.json({
        success: true,
        data: affiliate,
        message: 'Affiliate paused successfully'
      });
    } catch (error) {
      console.error('Error pausing affiliate:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to pause affiliate'
      });
    }
  }

  /**
   * Resume affiliate
   * POST /api/affiliates/:id/resume
   */
  async resumeAffiliate(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;

      const affiliate = await AffiliateService.resumeAffiliate(orgId, affiliateId);
      
      res.json({
        success: true,
        data: affiliate,
        message: 'Affiliate resumed successfully'
      });
    } catch (error) {
      console.error('Error resuming affiliate:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to resume affiliate'
      });
    }
  }

  // ============================================================================
  // TRACKING LINKS
  // ============================================================================

  /**
   * Create tracking link
   * POST /api/affiliates/:id/links
   */
  async createTrackingLink(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;
      const { destination_url, campaign_name } = req.body;

      if (!destination_url) {
        return res.status(400).json({
          success: false,
          message: 'Destination URL is required'
        });
      }

      const link = await AffiliateService.generateTrackingLink(
        orgId,
        affiliateId,
        destination_url,
        campaign_name
      );
      
      res.status(201).json({
        success: true,
        data: link,
        message: 'Tracking link created successfully'
      });
    } catch (error) {
      console.error('Error creating tracking link:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create tracking link'
      });
    }
  }

  /**
   * List tracking links
   * GET /api/affiliates/:id/links
   */
  async listTrackingLinks(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;

      const links = await AffiliateService.listTrackingLinks(orgId, affiliateId);
      
      res.json({
        success: true,
        data: links
      });
    } catch (error) {
      console.error('Error listing tracking links:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to list tracking links'
      });
    }
  }

  /**
   * Update tracking link
   * PUT /api/affiliates/links/:linkId
   */
  async updateTrackingLink(req, res) {
    try {
      const orgId = req.user.org_id;
      const linkId = req.params.linkId;

      const link = await AffiliateService.updateTrackingLink(orgId, linkId, req.body);
      
      res.json({
        success: true,
        data: link,
        message: 'Tracking link updated successfully'
      });
    } catch (error) {
      console.error('Error updating tracking link:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update tracking link'
      });
    }
  }

  /**
   * Delete tracking link
   * DELETE /api/affiliates/links/:linkId
   */
  async deleteTrackingLink(req, res) {
    try {
      const orgId = req.user.org_id;
      const linkId = req.params.linkId;

      await AffiliateService.deleteTrackingLink(orgId, linkId);
      
      res.json({
        success: true,
        message: 'Tracking link deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting tracking link:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete tracking link'
      });
    }
  }

  /**
   * Public tracking endpoint (redirect)
   * GET /api/track/:linkCode
   */
  async trackClick(req, res) {
    try {
      const linkCode = req.params.linkCode;
      
      // Extract metadata from request
      const metadata = {
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.headers['user-agent'],
        referrer: req.headers['referer'] || req.headers['referrer'],
        country_code: req.headers['cf-ipcountry'] || null, // Cloudflare header
        device_type: this._detectDeviceType(req.headers['user-agent'])
      };

      const result = await AffiliateService.trackClick(linkCode, metadata);
      
      // Set cookie for conversion tracking
      res.cookie(`aff_${linkCode}`, result.click.id, {
        maxAge: result.cookie_duration_days * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Redirect to destination
      res.redirect(result.destination_url);
    } catch (error) {
      console.error('Error tracking click:', error);
      res.status(404).send('Invalid tracking link');
    }
  }

  /**
   * Get click history
   * GET /api/affiliates/:id/clicks
   */
  async getClickHistory(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: parseInt(req.query.limit) || 100,
        offset: parseInt(req.query.offset) || 0
      };

      const clicks = await AffiliateService.getClickHistory(orgId, affiliateId, filters);
      
      res.json({
        success: true,
        data: clicks
      });
    } catch (error) {
      console.error('Error getting click history:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get click history'
      });
    }
  }

  // ============================================================================
  // CONVERSIONS
  // ============================================================================

  /**
   * Record conversion
   * POST /api/affiliates/conversions
   */
  async recordConversion(req, res) {
    try {
      const orgId = req.user.org_id;
      
      const conversion = await AffiliateService.trackConversion(orgId, req.body);
      
      res.status(201).json({
        success: true,
        data: conversion,
        message: 'Conversion recorded successfully'
      });
    } catch (error) {
      console.error('Error recording conversion:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to record conversion'
      });
    }
  }

  /**
   * Get affiliate conversions
   * GET /api/affiliates/:id/conversions
   */
  async getAffiliateConversions(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;
      const filters = {
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const conversions = await AffiliateService.getConversionsByAffiliate(
        orgId,
        affiliateId,
        filters
      );
      
      res.json({
        success: true,
        data: conversions
      });
    } catch (error) {
      console.error('Error getting conversions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get conversions'
      });
    }
  }

  /**
   * Get conversion details
   * GET /api/affiliates/conversions/:id
   */
  async getConversionDetails(req, res) {
    try {
      const orgId = req.user.org_id;
      const conversionId = req.params.id;

      const query = `
        SELECT 
          cv.*,
          a.name as affiliate_name,
          a.email as affiliate_email,
          tl.campaign_name,
          tl.link_code
        FROM affiliate_conversions cv
        JOIN affiliates a ON cv.affiliate_id = a.id
        LEFT JOIN affiliate_tracking_links tl ON cv.link_id = tl.id
        WHERE cv.org_id = $1 AND cv.id = $2
      `;

      const pool = require('../config/database');
      const result = await pool.query(query, [orgId, conversionId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Conversion not found'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error getting conversion details:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get conversion details'
      });
    }
  }

  /**
   * Update conversion status
   * PUT /api/affiliates/conversions/:id
   */
  async updateConversionStatus(req, res) {
    try {
      const orgId = req.user.org_id;
      const conversionId = req.params.id;
      const userId = req.user.id;
      const { status, reason } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const conversion = await AffiliateService.updateConversionStatus(
        orgId,
        conversionId,
        status,
        userId,
        reason
      );
      
      res.json({
        success: true,
        data: conversion,
        message: 'Conversion status updated successfully'
      });
    } catch (error) {
      console.error('Error updating conversion status:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update conversion status'
      });
    }
  }

  // ============================================================================
  // PERFORMANCE & ANALYTICS
  // ============================================================================

  /**
   * Get affiliate performance stats
   * GET /api/affiliates/:id/performance
   */
  async getPerformanceStats(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;
      const dateRange = {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      };

      const stats = await AffiliateService.getPerformanceStats(orgId, affiliateId, dateRange);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting performance stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get performance stats'
      });
    }
  }

  /**
   * Get overall analytics
   * GET /api/affiliates/analytics
   */
  async getAnalytics(req, res) {
    try {
      const orgId = req.user.org_id;
      const dateRange = {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      };

      const analytics = await AffiliateService.getAffiliateAnalytics(orgId, dateRange);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get analytics'
      });
    }
  }

  /**
   * Get top performers
   * GET /api/affiliates/top-performers
   */
  async getTopPerformers(req, res) {
    try {
      const orgId = req.user.org_id;
      const limit = parseInt(req.query.limit) || 10;
      const metric = req.query.metric || 'revenue';

      const topAffiliates = await AffiliateService.getTopAffiliates(orgId, limit, metric);
      
      res.json({
        success: true,
        data: topAffiliates
      });
    } catch (error) {
      console.error('Error getting top performers:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get top performers'
      });
    }
  }

  // ============================================================================
  // PAYOUTS
  // ============================================================================

  /**
   * Create payout batch
   * POST /api/affiliates/payouts/batches
   */
  async createPayoutBatch(req, res) {
    try {
      const orgId = req.user.org_id;
      
      const batch = await AffiliateService.createPayoutBatch(orgId, req.body);
      
      res.status(201).json({
        success: true,
        data: batch,
        message: 'Payout batch created successfully'
      });
    } catch (error) {
      console.error('Error creating payout batch:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create payout batch'
      });
    }
  }

  /**
   * List payout batches
   * GET /api/affiliates/payouts/batches
   */
  async listPayoutBatches(req, res) {
    try {
      const orgId = req.user.org_id;
      const filters = {
        status: req.query.status,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const batches = await AffiliateService.listPayoutBatches(orgId, filters);
      
      res.json({
        success: true,
        data: batches
      });
    } catch (error) {
      console.error('Error listing payout batches:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to list payout batches'
      });
    }
  }

  /**
   * Get payout batch details
   * GET /api/affiliates/payouts/batches/:id
   */
  async getPayoutBatch(req, res) {
    try {
      const orgId = req.user.org_id;
      const batchId = req.params.id;

      const batch = await AffiliateService.getPayoutBatch(orgId, batchId);
      
      res.json({
        success: true,
        data: batch
      });
    } catch (error) {
      console.error('Error getting payout batch:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Payout batch not found'
      });
    }
  }

  /**
   * Process payout batch
   * POST /api/affiliates/payouts/batches/:id/process
   */
  async processPayoutBatch(req, res) {
    try {
      const orgId = req.user.org_id;
      const batchId = req.params.id;
      const { payment_reference } = req.body;

      const batch = await AffiliateService.processPayoutBatch(orgId, batchId, payment_reference);
      
      res.json({
        success: true,
        data: batch,
        message: 'Payout batch processed successfully'
      });
    } catch (error) {
      console.error('Error processing payout batch:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process payout batch'
      });
    }
  }

  /**
   * Get affiliate payout history
   * GET /api/affiliates/:id/payouts
   */
  async getPayoutHistory(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;

      const payouts = await AffiliateService.getPayoutHistory(orgId, affiliateId);
      
      res.json({
        success: true,
        data: payouts
      });
    } catch (error) {
      console.error('Error getting payout history:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get payout history'
      });
    }
  }

  // ============================================================================
  // MARKETING MATERIALS
  // ============================================================================

  /**
   * Upload marketing material
   * POST /api/affiliates/materials
   */
  async uploadMaterial(req, res) {
    try {
      const orgId = req.user.org_id;
      
      const material = await AffiliateService.uploadMarketingMaterial(orgId, req.body);
      
      res.status(201).json({
        success: true,
        data: material,
        message: 'Marketing material uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading material:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to upload material'
      });
    }
  }

  /**
   * List marketing materials
   * GET /api/affiliates/materials
   */
  async listMaterials(req, res) {
    try {
      const orgId = req.user.org_id;
      const filters = {
        material_type: req.query.type,
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : true
      };

      const materials = await AffiliateService.listMarketingMaterials(orgId, filters);
      
      res.json({
        success: true,
        data: materials
      });
    } catch (error) {
      console.error('Error listing materials:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to list materials'
      });
    }
  }

  /**
   * Get material details
   * GET /api/affiliates/materials/:id
   */
  async getMaterial(req, res) {
    try {
      const orgId = req.user.org_id;
      const materialId = req.params.id;

      const pool = require('../config/database');
      const result = await pool.query(
        'SELECT * FROM affiliate_marketing_materials WHERE org_id = $1 AND id = $2',
        [orgId, materialId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Material not found'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error getting material:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get material'
      });
    }
  }

  /**
   * Track material download
   * POST /api/affiliates/materials/:id/download
   */
  async trackDownload(req, res) {
    try {
      const orgId = req.user.org_id;
      const materialId = req.params.id;

      const material = await AffiliateService.trackMaterialDownload(orgId, materialId);
      
      res.json({
        success: true,
        data: material,
        message: 'Download tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking download:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to track download'
      });
    }
  }

  /**
   * Delete marketing material
   * DELETE /api/affiliates/materials/:id
   */
  async deleteMaterial(req, res) {
    try {
      const orgId = req.user.org_id;
      const materialId = req.params.id;

      await AffiliateService.deleteMarketingMaterial(orgId, materialId);
      
      res.json({
        success: true,
        message: 'Material deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete material'
      });
    }
  }

  // ============================================================================
  // FRAUD DETECTION
  // ============================================================================

  /**
   * Run fraud check
   * POST /api/affiliates/:id/fraud-check
   */
  async runFraudCheck(req, res) {
    try {
      const orgId = req.user.org_id;
      const affiliateId = req.params.id;

      const alerts = await AffiliateService.detectFraud(orgId, affiliateId);
      
      res.json({
        success: true,
        data: alerts,
        message: alerts.length > 0 
          ? `${alerts.length} fraud alert(s) detected` 
          : 'No fraud detected'
      });
    } catch (error) {
      console.error('Error running fraud check:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to run fraud check'
      });
    }
  }

  /**
   * List fraud alerts
   * GET /api/affiliates/fraud-alerts
   */
  async listFraudAlerts(req, res) {
    try {
      const orgId = req.user.org_id;
      const filters = {
        affiliate_id: req.query.affiliate_id,
        is_resolved: req.query.is_resolved !== undefined ? req.query.is_resolved === 'true' : undefined,
        severity: req.query.severity
      };

      const alerts = await AffiliateService.getFraudAlerts(orgId, filters);
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Error listing fraud alerts:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to list fraud alerts'
      });
    }
  }

  /**
   * Resolve fraud alert
   * POST /api/affiliates/fraud-alerts/:id/resolve
   */
  async resolveFraudAlert(req, res) {
    try {
      const orgId = req.user.org_id;
      const alertId = req.params.id;
      const userId = req.user.id;

      const alert = await AffiliateService.resolveAlert(orgId, alertId, userId);
      
      res.json({
        success: true,
        data: alert,
        message: 'Fraud alert resolved successfully'
      });
    } catch (error) {
      console.error('Error resolving fraud alert:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to resolve fraud alert'
      });
    }
  }

  // ============================================================================
  // REPORTS & EXPORTS
  // ============================================================================

  /**
   * Export affiliate report
   * GET /api/affiliates/export
   */
  async exportReport(req, res) {
    try {
      const orgId = req.user.org_id;
      const format = req.query.format || 'json';

      const report = await AffiliateService.exportAffiliateReport(orgId, format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=affiliates-report.csv');
        res.send(report);
      } else {
        res.json({
          success: true,
          data: report
        });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export report'
      });
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Detect device type from user agent
   */
  _detectDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    
    return 'desktop';
  }
}

module.exports = new AffiliateController();
