// backend/src/controllers/influencerCRMController.js
const service = require('../services/influencer-crm/InfluencerCRMService');

class InfluencerCRMController {
  // Influencers
  async createInfluencer(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const influencer = await service.createInfluencer(orgId, req.body);
      res.status(201).json({ success: true, data: influencer });
    } catch (err) {
      next(err);
    }
  }

  async getInfluencers(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const result = await service.getInfluencers(orgId, req.query);
      res.json({ success: true, data: result.influencers, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async updateInfluencer(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const { id } = req.params;
      const influencer = await service.updateInfluencer(orgId, id, req.body);
      res.json({ success: true, data: influencer });
    } catch (err) {
      next(err);
    }
  }

  async addSocialAccount(req, res, next) {
    try {
      const { id } = req.params;
      const account = await service.addSocialAccount(id, req.body);
      res.status(201).json({ success: true, data: account });
    } catch (err) {
      next(err);
    }
  }

  async getSocialAccounts(req, res, next) {
    try {
      const { id } = req.params;
      const accounts = await service.getSocialAccounts(id);
      res.json({ success: true, data: accounts });
    } catch (err) {
      next(err);
    }
  }

  // Campaigns
  async createCampaign(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const campaign = await service.createCampaign(orgId, req.body);
      res.status(201).json({ success: true, data: campaign });
    } catch (err) {
      next(err);
    }
  }

  async getCampaigns(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const campaigns = await service.getCampaigns(orgId, req.query.status);
      res.json({ success: true, data: campaigns });
    } catch (err) {
      next(err);
    }
  }

  async assignInfluencer(req, res, next) {
    try {
      const { id: campaignId } = req.params;
      const { influencerId, compensationAmount, compensationType, notes } = req.body;
      const assignment = await service.assignInfluencer(campaignId, influencerId, {
        compensationAmount,
        compensationType,
        notes
      });
      res.status(201).json({ success: true, data: assignment });
    } catch (err) {
      next(err);
    }
  }

  async getCampaignInfluencers(req, res, next) {
    try {
      const { id } = req.params;
      const influencers = await service.getCampaignInfluencers(id);
      res.json({ success: true, data: influencers });
    } catch (err) {
      next(err);
    }
  }

  // Content Deliverables
  async addContent(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const content = await service.addContent(orgId, req.body);
      res.status(201).json({ success: true, data: content });
    } catch (err) {
      next(err);
    }
  }

  async getContent(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const result = await service.getContent(orgId, req.query);
      res.json({ success: true, data: result.content, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  // Payments
  async addPayment(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const payment = await service.addPayment(orgId, req.body);
      res.status(201).json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  }

  async getPayments(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const result = await service.getPayments(orgId, req.query);
      res.json({ success: true, data: result.payments, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async updatePaymentStatus(req, res, next) {
    try {
      const orgId = req.user.orgId;
      const { id } = req.params;
      const { status } = req.body;
      const payment = await service.updatePaymentStatus(orgId, id, status);
      res.json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InfluencerCRMController();
