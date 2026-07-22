const BaseService = require('./base/BaseService');
const AdCampaignRepository = require('../repositories/AdCampaignRepository');
const logger = require('../utils/logger');

class AdCampaignService extends BaseService {
  constructor() {
    const repository = new AdCampaignRepository();
    super(repository, { serviceName: 'AdCampaignService' });
  }

  // ==========================================================================
  // Accounts
  // ==========================================================================

  async listAccounts(orgId, status = null) {
    return this.repository.findAccounts(orgId, status);
  }

  async getAccount(accountId, orgId) {
    return this.repository.findAccountById(accountId, orgId);
  }

  async connectAccount(data, orgId) {
    const account = await this.repository.createAccount({
      platform: data.platform,
      account_name: data.account_name,
      platform_account_id: data.platform_account_id || `act_${Math.floor(Math.random() * 100000000)}`,
      status: 'active',
      credentials: data.credentials || {},
    }, orgId);

    // Only seed demo data if DISABLE_MOCK_SEEDING is not set and no real campaigns exist
    if (process.env.DISABLE_MOCK_SEEDING !== 'true') {
      const existing = await this.repository.findAll(orgId, 'active', { ad_account_id: account.id });
      if (existing.length === 0) {
        await this.seedMockData(orgId, account.id, account.platform);
      }
    }

    return account;
  }

  async disconnectAccount(accountId, orgId) {
    return this.repository.updateAccount(accountId, { status: 'disconnected' }, orgId);
  }

  // ==========================================================================
  // Campaigns
  // ==========================================================================

  async listCampaigns(orgId, filters = {}, pagination = {}) {
    return this.repository.findAll(orgId, filters, pagination);
  }

  async getCampaign(campaignId, orgId) {
    return this.repository.findById(campaignId, orgId);
  }

  async createCampaign(data, orgId, userId = null) {
    const campaign = await this.repository.create({
      ad_account_id: data.ad_account_id,
      platform: data.platform,
      name: data.name,
      status: data.status || 'active',
      budget_type: data.budget_type || 'daily',
      budget: data.budget || 0,
      bid_strategy: data.bid_strategy || 'lowest_cost',
      objective: data.objective || 'leads',
      start_date: data.start_date || new Date(),
      end_date: data.end_date || null,
      platform_campaign_id: data.platform_campaign_id || `camp_${Math.floor(Math.random() * 100000000)}`,
    }, orgId, userId);

    // Create a default ad group and ad variant
    const adGroup = await this.repository.createAdGroup({
      campaign_id: campaign.id,
      name: 'Ad Group 1 - Target Audience',
      status: 'active',
      target_audience: data.target_audience || { genders: ['all'], age_min: 18, age_max: 65, locations: ['Global'] },
      platform_ad_group_id: `grp_${Math.floor(Math.random() * 100000000)}`,
    }, orgId);

    await this.repository.createAd({
      ad_group_id: adGroup.id,
      name: 'Ad Creative Variant A',
      status: 'active',
      creative_data: data.creative_data || {
        headline: 'Grow Your Business Today',
        description: 'Get started with our enterprise suite. Sign up for free.',
        image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        destination_url: 'https://digitpenhub.com/promo'
      },
      platform_ad_id: `ad_${Math.floor(Math.random() * 100000000)}`,
    }, orgId);

    return campaign;
  }

  async updateCampaign(campaignId, data, orgId, userId = null) {
    return this.repository.update(campaignId, data, orgId, userId);
  }

  async deleteCampaign(campaignId, orgId) {
    return this.repository.delete(campaignId, orgId);
  }

  // ==========================================================================
  // Ad Groups
  // ==========================================================================

  async listAdGroups(orgId, campaignId) {
    return this.repository.findAdGroups(orgId, campaignId);
  }

  async createAdGroup(data, orgId) {
    return this.repository.createAdGroup(data, orgId);
  }

  async updateAdGroup(adGroupId, data, orgId) {
    return this.repository.updateAdGroup(adGroupId, data, orgId);
  }

  async deleteAdGroup(adGroupId, orgId) {
    return this.repository.deleteAdGroup(adGroupId, orgId);
  }

  // ==========================================================================
  // Ads
  // ==========================================================================

  async listAds(orgId, adGroupId) {
    return this.repository.findAds(orgId, adGroupId);
  }

  async createAd(data, orgId) {
    return this.repository.createAd(data, orgId);
  }

  async updateAd(adId, data, orgId) {
    return this.repository.updateAd(adId, data, orgId);
  }

  async deleteAd(adId, orgId) {
    return this.repository.deleteAd(adId, orgId);
  }

  // ==========================================================================
  // Custom Audiences
  // ==========================================================================

  async listCustomAudiences(orgId) {
    return this.repository.findCustomAudiences(orgId);
  }

  async createCustomAudience(data, orgId) {
    const audience = await this.repository.createCustomAudience({
      name: data.name,
      description: data.description || '',
      segment_id: data.segment_id || null,
      platform: data.platform,
      platform_audience_id: `aud_${Math.floor(Math.random() * 100000000)}`,
      status: 'updating',
      member_count: 0,
    }, orgId);

    // Async/Background update simulator
    this.syncAudience(audience.id, orgId).catch(err => {
      logger.error('Failed to sync audience on create:', err);
    });

    return audience;
  }

  async syncAudience(audienceId, orgId) {
    // Simulate updating contact counts
    const countQuery = await this.repository.query(
      'SELECT COUNT(*)::int AS count FROM contacts WHERE org_id = $1',
      [orgId]
    );
    const memberCount = countQuery.rows[0]?.count || 0;

    await this.repository.query(
      `UPDATE ad_custom_audiences 
       SET member_count = $1, status = 'ready', updated_at = NOW() 
       WHERE id = $2 AND org_id = $3`,
      [memberCount, audienceId, orgId]
    );

    return memberCount;
  }

  async deleteCustomAudience(audienceId, orgId) {
    return this.repository.deleteCustomAudience(audienceId, orgId);
  }

  // ==========================================================================
  // Rules Engine
  // ==========================================================================

  async listRules(orgId) {
    return this.repository.findRules(orgId);
  }

  async createRule(data, orgId) {
    return this.repository.createRule({
      name: data.name,
      conditions: JSON.stringify(data.conditions || []),
      actions: JSON.stringify(data.actions || []),
      target_type: data.target_type,
      target_ids: data.target_ids || [],
      status: 'active',
    }, orgId);
  }

  async updateRule(ruleId, data, orgId) {
    const updateData = { ...data };
    if (updateData.conditions) updateData.conditions = JSON.stringify(updateData.conditions);
    if (updateData.actions) updateData.actions = JSON.stringify(updateData.actions);
    return this.repository.updateRule(ruleId, updateData, orgId);
  }

  async deleteRule(ruleId, orgId) {
    return this.repository.deleteRule(ruleId, orgId);
  }

  async runRules(orgId) {
    const rules = await this.repository.findRules(orgId);
    const activeRules = rules.filter(r => r.status === 'active');
    
    let triggers = 0;
    for (const rule of activeRules) {
      // Fetch target data
      if (rule.target_type === 'campaign') {
        for (const campaignId of rule.target_ids) {
          const campaign = await this.repository.findById(campaignId, orgId);
          if (!campaign || campaign.status !== 'active') continue;

          // Get 7-day analytics
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          const stats = await this.repository.getSummary(orgId, startDate, endDate, campaignId);

          const clicks = stats.clicks || 0;
          const spend = parseFloat(stats.spend || 0);
          const conversions = stats.conversions || 0;
          const cpc = clicks > 0 ? spend / clicks : 0;
          const cpa = conversions > 0 ? spend / conversions : spend;

          // Evaluate conditions
          let match = true;
          for (const cond of rule.conditions) {
            if (cond.metric === 'cpa' && cond.operator === 'greater_than' && cpa > cond.value) match = match && true;
            else if (cond.metric === 'spend' && cond.operator === 'greater_than' && spend > cond.value) match = match && true;
            else match = false;
          }

          if (match) {
            // Apply actions
            for (const action of rule.actions) {
              if (action.type === 'pause') {
                await this.repository.update(campaignId, { status: 'paused' }, orgId);
                triggers++;
              } else if (action.type === 'budget_decrease') {
                const newBudget = Math.max(10, parseFloat(campaign.budget) * (1 - (action.value / 100)));
                await this.repository.update(campaignId, { budget: newBudget }, orgId);
                triggers++;
              }
            }
          }
        }
      }
      await this.repository.updateRule(rule.id, { last_run_at: new Date() }, orgId);
    }
    return { rulesProcessed: activeRules.length, rulesTriggered: triggers };
  }

  // ==========================================================================
  // Performance and Mock Data Seeding
  // ==========================================================================

  async getPerformance(orgId, startDate, endDate, campaignId = null) {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const daily = await this.repository.getPerformanceDaily(orgId, sDate, eDate, campaignId);
    const summary = await this.repository.getSummary(orgId, sDate, eDate, campaignId);
    
    return {
      daily,
      summary: {
        impressions: summary.impressions || 0,
        clicks: summary.clicks || 0,
        spend: parseFloat(summary.spend || 0),
        conversions: summary.conversions || 0,
        revenue: parseFloat(summary.revenue || 0),
        ctr: summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0,
        cpc: summary.clicks > 0 ? parseFloat(summary.spend || 0) / summary.clicks : 0,
        cpa: summary.conversions > 0 ? parseFloat(summary.spend || 0) / summary.conversions : 0,
        roas: parseFloat(summary.spend || 0) > 0 ? parseFloat(summary.revenue || 0) / parseFloat(summary.spend || 0) : 0,
      }
    };
  }

  async seedMockData(orgId, accountId, platform) {
    // Generate 3 sample campaigns
    const campaignNames = {
      facebook: ['FB - Retargeting - Landing Page Visitors', 'FB - Lookalike 1% - Lead Form Campaign', 'FB - Brand Awareness - Video Ads'],
      google: ['Search - High Intent Keywords - Exact', 'PMax - Performance Max Core Assets', 'GDN - Remarketing Display Banner'],
      linkedin: ['LI - Decision Makers - Sponsored Content', 'LI - Lead Gen Form - Whitepaper Promo', 'LI - Conversations - Direct Message Outreach']
    }[platform] || ['Mock Campaign 1', 'Mock Campaign 2', 'Mock Campaign 3'];

    const objectives = ['conversions', 'leads', 'awareness'];
    const budgets = [25.00, 50.00, 10.00];

    for (let i = 0; i < 3; i++) {
      const campaign = await this.repository.create({
        ad_account_id: accountId,
        platform,
        name: campaignNames[i],
        status: i === 2 ? 'paused' : 'active',
        budget_type: 'daily',
        budget: budgets[i],
        bid_strategy: 'lowest_cost',
        objective: objectives[i],
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        platform_campaign_id: `camp_mock_${platform}_${Math.floor(Math.random() * 1000000)}`,
      }, orgId);

      const adGroup = await this.repository.createAdGroup({
        campaign_id: campaign.id,
        name: `Ad Group ${i + 1} - Target List`,
        status: 'active',
        target_audience: { genders: ['all'], age_min: 25, age_max: 54, locations: ['United States', 'United Kingdom'] },
        platform_ad_group_id: `grp_mock_${platform}_${Math.floor(Math.random() * 1000000)}`,
      }, orgId);

      // Create creative variations A/B
      const headlines = [
        ['Best-in-class Enterprise CRM', 'Double Your Conversion Rates'],
        ['Request a Free Consultation', 'Unlock Sales Insights Now'],
        ['Digitpen Hub Platform Overview', 'Watch How We Scale Teams']
      ][i];

      const adsList = [];
      for (let j = 0; j < 2; j++) {
        const ad = await this.repository.createAd({
          ad_group_id: adGroup.id,
          name: `Ad Variant ${String.fromCharCode(65 + j)}`,
          status: 'active',
          creative_data: {
            headline: headlines[j],
            description: 'Discover how digitpenhub handles contacts, automations, accounting, and marketing campaigns in one unified console.',
            image_url: `https://images.unsplash.com/photo-${1460925895917 + i + j}?w=800`,
            destination_url: 'https://digitpenhub.com/'
          },
          platform_ad_id: `ad_mock_${platform}_${Math.floor(Math.random() * 1000000)}`,
        }, orgId);
        adsList.push(ad);
      }

      // Seed daily performance metrics for past 30 days
      const analyticsRows = [];
      for (let day = 30; day >= 1; day--) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        
        // Random performance with platform trends
        const scale = platform === 'google' ? 1.5 : platform === 'linkedin' ? 0.8 : 1.2;
        const impressions = Math.floor((Math.random() * 2000 + 1000) * scale);
        const clicks = Math.floor(impressions * (Math.random() * 0.03 + 0.01)); // 1% to 4% CTR
        const spend = parseFloat((clicks * (Math.random() * 1.50 + 0.50)).toFixed(2));
        const conversions = Math.floor(clicks * (Math.random() * 0.15 + 0.02)); // 2% to 17% CR
        const revenue = conversions * (Math.random() * 120 + 40);

        for (const ad of adsList) {
          analyticsRows.push({
            org_id: orgId,
            campaign_id: campaign.id,
            ad_group_id: adGroup.id,
            ad_id: ad.id,
            date,
            impressions: Math.floor(impressions / 2),
            clicks: Math.floor(clicks / 2),
            spend: parseFloat((spend / 2).toFixed(2)),
            conversions: Math.floor(conversions / 2),
            revenue: parseFloat((revenue / 2).toFixed(2)),
            clicks_unique: Math.floor(clicks / 2 * 0.9),
            conversions_unique: Math.floor(conversions / 2 * 0.95),
            social_actions: JSON.stringify({
              likes: Math.floor(impressions * 0.005),
              shares: Math.floor(impressions * 0.001),
              comments: Math.floor(impressions * 0.0005)
            })
          });
        }
      }
      await this.repository.seedPerformance(analyticsRows);
    }
  }
}

module.exports = AdCampaignService;
