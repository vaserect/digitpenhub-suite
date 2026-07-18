const AdCampaignService = require('../services/AdCampaignService');

class AdCampaignController {
  constructor() {
    this.service = new AdCampaignService();
  }

  // ==========================================================================
  // Accounts
  // ==========================================================================

  async listAccounts(req, res) {
    try {
      const { org_id } = req.user;
      const { status } = req.query;
      const accounts = await this.service.listAccounts(org_id, status);
      res.json({ success: true, data: accounts });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async connectAccount(req, res) {
    try {
      const { org_id } = req.user;
      const account = await this.service.connectAccount(req.body, org_id);
      res.status(201).json({ success: true, data: account });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async disconnectAccount(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const account = await this.service.disconnectAccount(id, org_id);
      if (!account) {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }
      res.json({ success: true, data: account });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==========================================================================
  // Campaigns
  // ==========================================================================

  async listCampaigns(req, res) {
    try {
      const { org_id } = req.user;
      const { ad_account_id, platform, status } = req.query;
      const filters = {};
      if (ad_account_id) filters.ad_account_id = ad_account_id;
      if (platform) filters.platform = platform;
      if (status) filters.status = status;

      const campaigns = await this.service.listCampaigns(org_id, filters);
      res.json({ success: true, data: campaigns });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getCampaign(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const campaign = await this.service.getCampaign(id, org_id);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      res.json({ success: true, data: campaign });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createCampaign(req, res) {
    try {
      const { org_id, id: user_id } = req.user;
      const campaign = await this.service.createCampaign(req.body, org_id, user_id);
      res.status(201).json({ success: true, data: campaign });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateCampaign(req, res) {
    try {
      const { org_id, id: user_id } = req.user;
      const { id } = req.params;
      const campaign = await this.service.updateCampaign(id, req.body, org_id, user_id);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      res.json({ success: true, data: campaign });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteCampaign(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const deleted = await this.service.deleteCampaign(id, org_id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      res.json({ success: true, message: 'Campaign deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==========================================================================
  // Ad Groups
  // ==========================================================================

  async listAdGroups(req, res) {
    try {
      const { org_id } = req.user;
      const { campaign_id } = req.query;
      if (!campaign_id) {
        return res.status(400).json({ success: false, error: 'campaign_id is required' });
      }
      const adGroups = await this.service.listAdGroups(org_id, campaign_id);
      res.json({ success: true, data: adGroups });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createAdGroup(req, res) {
    try {
      const { org_id } = req.user;
      const adGroup = await this.service.createAdGroup(req.body, org_id);
      res.status(201).json({ success: true, data: adGroup });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateAdGroup(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const adGroup = await this.service.updateAdGroup(id, req.body, org_id);
      if (!adGroup) {
        return res.status(404).json({ success: false, error: 'Ad group not found' });
      }
      res.json({ success: true, data: adGroup });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteAdGroup(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const deleted = await this.service.deleteAdGroup(id, org_id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Ad group not found' });
      }
      res.json({ success: true, message: 'Ad group deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==========================================================================
  // Ads
  // ==========================================================================

  async listAds(req, res) {
    try {
      const { org_id } = req.user;
      const { ad_group_id } = req.query;
      if (!ad_group_id) {
        return res.status(400).json({ success: false, error: 'ad_group_id is required' });
      }
      const ads = await this.service.listAds(org_id, ad_group_id);
      res.json({ success: true, data: ads });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createAd(req, res) {
    try {
      const { org_id } = req.user;
      const ad = await this.service.createAd(req.body, org_id);
      res.status(201).json({ success: true, data: ad });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateAd(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const ad = await this.service.updateAd(id, req.body, org_id);
      if (!ad) {
        return res.status(404).json({ success: false, error: 'Ad not found' });
      }
      res.json({ success: true, data: ad });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteAd(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const deleted = await this.service.deleteAd(id, org_id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Ad not found' });
      }
      res.json({ success: true, message: 'Ad deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==========================================================================
  // Audiences
  // ==========================================================================

  async listCustomAudiences(req, res) {
    try {
      const { org_id } = req.user;
      const audiences = await this.service.listCustomAudiences(org_id);
      res.json({ success: true, data: audiences });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createCustomAudience(req, res) {
    try {
      const { org_id } = req.user;
      const audience = await this.service.createCustomAudience(req.body, org_id);
      res.status(201).json({ success: true, data: audience });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteCustomAudience(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const deleted = await this.service.deleteCustomAudience(id, org_id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Audience not found' });
      }
      res.json({ success: true, message: 'Audience deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==========================================================================
  // Rules
  // ==========================================================================

  async listRules(req, res) {
    try {
      const { org_id } = req.user;
      const rules = await this.service.listRules(org_id);
      res.json({ success: true, data: rules });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createRule(req, res) {
    try {
      const { org_id } = req.user;
      const rule = await this.service.createRule(req.body, org_id);
      res.status(201).json({ success: true, data: rule });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateRule(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const rule = await this.service.updateRule(id, req.body, org_id);
      if (!rule) {
        return res.status(404).json({ success: false, error: 'Rule not found' });
      }
      res.json({ success: true, data: rule });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteRule(req, res) {
    try {
      const { org_id } = req.user;
      const { id } = req.params;
      const deleted = await this.service.deleteRule(id, org_id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Rule not found' });
      }
      res.json({ success: true, message: 'Rule deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async runRules(req, res) {
    try {
      const { org_id } = req.user;
      const result = await this.service.runRules(org_id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==========================================================================
  // Analytics
  // ==========================================================================

  async getPerformance(req, res) {
    try {
      const { org_id } = req.user;
      const { start_date, end_date, campaign_id } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({ success: false, error: 'start_date and end_date are required' });
      }

      const performance = await this.service.getPerformance(org_id, start_date, end_date, campaign_id);
      res.json({ success: true, data: performance });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AdCampaignController();
