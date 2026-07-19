const BaseService = require('../base/BaseService');
const AmbassadorRepository = require('../../repositories/ambassador/AmbassadorRepository');
const { ValidationError } = require('../../utils/errors');
const crypto = require('crypto');

/**
 * AmbassadorService - Business logic for Ambassador Program
 * Benchmark: Brandbassador / GRIN Ambassador
 */
class AmbassadorService extends BaseService {
  constructor() {
    super(new AmbassadorRepository());
  }

  // ============================================================================
  // Program Management
  // ============================================================================

  /**
   * Create a new ambassador program
   */
  async createProgram(orgId, userId, data) {
    const {
      name,
      description,
      applicationEnabled = true,
      autoApprove = false,
      applicationQuestions = [],
      minAge,
      minFollowers,
      allowedCountries,
      requiredPlatforms,
      logoUrl,
      bannerUrl,
      primaryColor
    } = data;

    if (!name) {
      throw new ValidationError('Program name is required');
    }

    const slug = this._generateSlug(name);

    const program = await this.repository.createProgram({
      org_id: orgId,
      name,
      slug,
      description,
      application_enabled: applicationEnabled,
      auto_approve: autoApprove,
      application_questions: JSON.stringify(applicationQuestions),
      min_age: minAge,
      min_followers: minFollowers,
      allowed_countries: allowedCountries,
      required_platforms: requiredPlatforms,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      primary_color: primaryColor,
      created_by: userId
    });

    // Create default tiers
    await this._createDefaultTiers(program.id);

    return program;
  }

  /**
   * Get all programs for an organization
   */
  async getPrograms(orgId, filters = {}) {
    return this.repository.getPrograms(orgId, filters);
  }

  /**
   * Get program by ID
   */
  async getProgramById(orgId, programId) {
    const program = await this.repository.getProgramById(programId);
    
    if (!program || program.org_id !== orgId) {
      throw new ValidationError('Program not found');
    }

    return program;
  }

  /**
   * Update program
   */
  async updateProgram(orgId, programId, data) {
    const program = await this.getProgramById(orgId, programId);
    
    const updates = {
      ...data,
      updated_at: new Date()
    };

    if (data.name && data.name !== program.name) {
      updates.slug = this._generateSlug(data.name);
    }

    return this.repository.updateProgram(programId, updates);
  }

  /**
   * Delete program
   */
  async deleteProgram(orgId, programId) {
    await this.getProgramById(orgId, programId);
    return this.repository.deleteProgram(programId);
  }

  // ============================================================================
  // Tier Management
  // ============================================================================

  /**
   * Create default tiers for a program
   */
  async _createDefaultTiers(programId) {
    const defaultTiers = [
      {
        name: 'Bronze',
        slug: 'bronze',
        level: 1,
        min_referrals: 0,
        commission_rate: 5,
        bonus_per_referral: 5,
        welcome_bonus: 10,
        badge_color: '#CD7F32'
      },
      {
        name: 'Silver',
        slug: 'silver',
        level: 2,
        min_referrals: 10,
        commission_rate: 10,
        bonus_per_referral: 10,
        monthly_bonus: 25,
        badge_color: '#C0C0C0'
      },
      {
        name: 'Gold',
        slug: 'gold',
        level: 3,
        min_referrals: 25,
        commission_rate: 15,
        bonus_per_referral: 15,
        monthly_bonus: 50,
        badge_color: '#FFD700'
      },
      {
        name: 'Platinum',
        slug: 'platinum',
        level: 4,
        min_referrals: 50,
        commission_rate: 20,
        bonus_per_referral: 20,
        monthly_bonus: 100,
        badge_color: '#E5E4E2'
      }
    ];

    for (const tier of defaultTiers) {
      await this.repository.createTier({
        program_id: programId,
        ...tier
      });
    }
  }

  /**
   * Get tiers for a program
   */
  async getTiers(programId) {
    return this.repository.getTiers(programId);
  }

  /**
   * Create custom tier
   */
  async createTier(programId, data) {
    return this.repository.createTier({
      program_id: programId,
      ...data
    });
  }

  /**
   * Update tier
   */
  async updateTier(tierId, data) {
    return this.repository.updateTier(tierId, data);
  }

  // ============================================================================
  // Application Management
  // ============================================================================

  /**
   * Submit ambassador application
   */
  async submitApplication(orgId, programId, userId, data) {
    const { answers, socialProfiles } = data;

    // Check if already applied
    const existing = await this.repository.getApplicationByUser(orgId, programId, userId);
    if (existing) {
      throw new ValidationError('You have already applied to this program');
    }

    const application = await this.repository.createApplication({
      org_id: orgId,
      program_id: programId,
      user_id: userId,
      answers: JSON.stringify(answers || {}),
      social_profiles: JSON.stringify(socialProfiles || {}),
      status: 'pending'
    });

    // Check if auto-approve is enabled
    const program = await this.repository.getProgramById(programId);
    if (program.auto_approve) {
      return this.approveApplication(orgId, application.id, userId);
    }

    return application;
  }

  /**
   * Get applications for a program
   */
  async getApplications(orgId, programId, filters = {}) {
    return this.repository.getApplications(orgId, programId, filters);
  }

  /**
   * Approve application
   */
  async approveApplication(orgId, applicationId, reviewerId) {
    const application = await this.repository.getApplicationById(applicationId);
    
    if (!application || application.org_id !== orgId) {
      throw new ValidationError('Application not found');
    }

    if (application.status !== 'pending' && application.status !== 'under_review') {
      throw new ValidationError('Application cannot be approved');
    }

    // Update application status
    await this.repository.updateApplication(applicationId, {
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date()
    });

    // Create ambassador profile
    const referralCode = this._generateReferralCode();
    const tiers = await this.getTiers(application.program_id);
    const lowestTier = tiers.sort((a, b) => a.level - b.level)[0];

    const ambassador = await this.repository.createAmbassador({
      org_id: orgId,
      program_id: application.program_id,
      user_id: application.user_id,
      tier_id: lowestTier?.id,
      status: 'active',
      referral_code: referralCode,
      applied_at: application.submitted_at,
      approved_at: new Date()
    });

    // Award welcome bonus if applicable
    if (lowestTier?.welcome_bonus > 0) {
      await this.awardReward(orgId, ambassador.id, {
        reward_type: 'welcome_bonus',
        description: 'Welcome bonus for joining the program',
        cash_amount: lowestTier.welcome_bonus,
        status: 'approved'
      });
    }

    return ambassador;
  }

  /**
   * Reject application
   */
  async rejectApplication(orgId, applicationId, reviewerId, reason) {
    const application = await this.repository.getApplicationById(applicationId);
    
    if (!application || application.org_id !== orgId) {
      throw new ValidationError('Application not found');
    }

    return this.repository.updateApplication(applicationId, {
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
      rejection_reason: reason
    });
  }

  // ============================================================================
  // Ambassador Management
  // ============================================================================

  /**
   * Get ambassadors for an organization
   */
  async getAmbassadors(orgId, filters = {}) {
    return this.repository.getAmbassadors(orgId, filters);
  }

  /**
   * Get ambassador by ID
   */
  async getAmbassadorById(orgId, ambassadorId) {
    const ambassador = await this.repository.getAmbassadorById(ambassadorId);
    
    if (!ambassador || ambassador.org_id !== orgId) {
      throw new ValidationError('Ambassador not found');
    }

    return ambassador;
  }

  /**
   * Get ambassador by user ID
   */
  async getAmbassadorByUserId(orgId, programId, userId) {
    return this.repository.getAmbassadorByUserId(orgId, programId, userId);
  }

  /**
   * Update ambassador
   */
  async updateAmbassador(orgId, ambassadorId, data) {
    await this.getAmbassadorById(orgId, ambassadorId);
    return this.repository.updateAmbassador(ambassadorId, data);
  }

  /**
   * Update ambassador tier based on performance
   */
  async updateAmbassadorTier(orgId, ambassadorId) {
    const ambassador = await this.getAmbassadorById(orgId, ambassadorId);
    const tiers = await this.getTiers(ambassador.program_id);
    
    // Find highest tier ambassador qualifies for
    const qualifiedTiers = tiers.filter(tier => 
      ambassador.total_referrals >= tier.min_referrals &&
      ambassador.total_revenue >= tier.min_revenue &&
      ambassador.total_content_pieces >= tier.min_content_pieces
    );

    if (qualifiedTiers.length === 0) return ambassador;

    const newTier = qualifiedTiers.sort((a, b) => b.level - a.level)[0];
    
    if (newTier.id !== ambassador.tier_id) {
      await this.repository.updateAmbassador(ambassadorId, {
        tier_id: newTier.id
      });

      // Award tier upgrade bonus if applicable
      if (newTier.welcome_bonus > 0) {
        await this.awardReward(orgId, ambassadorId, {
          reward_type: 'tier_upgrade',
          description: `Upgraded to ${newTier.name} tier`,
          cash_amount: newTier.welcome_bonus,
          status: 'approved'
        });
      }
    }

    return this.getAmbassadorById(orgId, ambassadorId);
  }

  // ============================================================================
  // Activity Tracking
  // ============================================================================

  /**
   * Track ambassador activity
   */
  async trackActivity(orgId, ambassadorId, activityType, activityData = {}, pointsEarned = 0, rewardAmount = 0) {
    const activity = await this.repository.createActivity({
      org_id: orgId,
      ambassador_id: ambassadorId,
      activity_type: activityType,
      activity_data: JSON.stringify(activityData),
      points_earned: pointsEarned,
      reward_amount: rewardAmount
    });

    // Update ambassador metrics
    if (pointsEarned > 0) {
      await this.repository.incrementAmbassadorPoints(ambassadorId, pointsEarned);
    }

    return activity;
  }

  /**
   * Get activities for an ambassador
   */
  async getActivities(orgId, ambassadorId, filters = {}) {
    return this.repository.getActivities(orgId, ambassadorId, filters);
  }

  // ============================================================================
  // Reward Management
  // ============================================================================

  /**
   * Award reward to ambassador
   */
  async awardReward(orgId, ambassadorId, data) {
    const { reward_type, description, points = 0, cash_amount = 0, activity_id, campaign_id } = data;

    const reward = await this.repository.createReward({
      org_id: orgId,
      ambassador_id: ambassadorId,
      reward_type,
      description,
      points,
      cash_amount,
      activity_id,
      campaign_id,
      status: data.status || 'pending'
    });

    // Update ambassador balances
    if (points > 0) {
      await this.repository.incrementAmbassadorPoints(ambassadorId, points);
    }

    if (cash_amount > 0) {
      await this.repository.incrementAmbassadorRewards(ambassadorId, cash_amount);
    }

    return reward;
  }

  /**
   * Get rewards for an ambassador
   */
  async getRewards(orgId, ambassadorId, filters = {}) {
    return this.repository.getRewards(orgId, ambassadorId, filters);
  }

  /**
   * Approve reward
   */
  async approveReward(orgId, rewardId) {
    const reward = await this.repository.getRewardById(rewardId);
    
    if (!reward || reward.org_id !== orgId) {
      throw new ValidationError('Reward not found');
    }

    return this.repository.updateReward(rewardId, {
      status: 'approved',
      approved_at: new Date()
    });
  }

  // ============================================================================
  // Content Management
  // ============================================================================

  /**
   * Submit content
   */
  async submitContent(orgId, ambassadorId, data) {
    const {
      content_type,
      title,
      description,
      media_url,
      thumbnail_url,
      external_url,
      campaign_id,
      tags
    } = data;

    const content = await this.repository.createContent({
      org_id: orgId,
      ambassador_id: ambassadorId,
      campaign_id,
      content_type,
      title,
      description,
      media_url,
      thumbnail_url,
      external_url,
      tags,
      status: 'pending'
    });

    // Track activity
    await this.trackActivity(orgId, ambassadorId, 'content_submission', {
      content_id: content.id,
      content_type
    });

    // Update ambassador content count
    await this.repository.incrementAmbassadorContent(ambassadorId);

    return content;
  }

  /**
   * Get content submissions
   */
  async getContent(orgId, filters = {}) {
    return this.repository.getContent(orgId, filters);
  }

  /**
   * Approve content
   */
  async approveContent(orgId, contentId, reviewerId) {
    const content = await this.repository.getContentById(contentId);
    
    if (!content || content.org_id !== orgId) {
      throw new ValidationError('Content not found');
    }

    await this.repository.updateContent(contentId, {
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date()
    });

    // Award points/rewards for approved content
    const ambassador = await this.getAmbassadorById(orgId, content.ambassador_id);
    const tier = await this.repository.getTierById(ambassador.tier_id);

    if (tier) {
      await this.awardReward(orgId, content.ambassador_id, {
        reward_type: 'content_approval',
        description: `Content approved: ${content.title}`,
        points: 10,
        cash_amount: tier.bonus_per_referral || 0
      });
    }

    return content;
  }

  /**
   * Reject content
   */
  async rejectContent(orgId, contentId, reviewerId, reason) {
    const content = await this.repository.getContentById(contentId);
    
    if (!content || content.org_id !== orgId) {
      throw new ValidationError('Content not found');
    }

    return this.repository.updateContent(contentId, {
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
      rejection_reason: reason
    });
  }

  // ============================================================================
  // Campaign Management
  // ============================================================================

  /**
   * Create campaign
   */
  async createCampaign(orgId, programId, userId, data) {
    const {
      name,
      description,
      brief,
      required_content_type,
      min_content_pieces = 1,
      hashtags,
      mentions,
      reward_per_piece = 0,
      bonus_for_completion = 0,
      points_per_piece = 0,
      start_date,
      end_date
    } = data;

    const slug = this._generateSlug(name);

    return this.repository.createCampaign({
      org_id: orgId,
      program_id: programId,
      name,
      slug,
      description,
      brief,
      required_content_type,
      min_content_pieces,
      hashtags,
      mentions,
      reward_per_piece,
      bonus_for_completion,
      points_per_piece,
      start_date,
      end_date,
      status: 'draft',
      created_by: userId
    });
  }

  /**
   * Get campaigns
   */
  async getCampaigns(orgId, filters = {}) {
    return this.repository.getCampaigns(orgId, filters);
  }

  /**
   * Update campaign
   */
  async updateCampaign(orgId, campaignId, data) {
    const campaign = await this.repository.getCampaignById(campaignId);
    
    if (!campaign || campaign.org_id !== orgId) {
      throw new ValidationError('Campaign not found');
    }

    return this.repository.updateCampaign(campaignId, {
      ...data,
      updated_at: new Date()
    });
  }

  /**
   * Invite ambassador to campaign
   */
  async inviteAmbassadorToCampaign(campaignId, ambassadorId) {
    return this.repository.createCampaignParticipant({
      campaign_id: campaignId,
      ambassador_id: ambassadorId,
      status: 'invited'
    });
  }

  /**
   * Accept campaign invitation
   */
  async acceptCampaignInvitation(campaignId, ambassadorId) {
    return this.repository.updateCampaignParticipant(campaignId, ambassadorId, {
      status: 'accepted',
      accepted_at: new Date()
    });
  }

  // ============================================================================
  // Payout Management
  // ============================================================================

  /**
   * Request payout
   */
  async requestPayout(orgId, ambassadorId, amount, paymentMethod, paymentDetails) {
    const ambassador = await this.getAmbassadorById(orgId, ambassadorId);
    
    if (ambassador.pending_payout < amount) {
      throw new ValidationError('Insufficient balance for payout');
    }

    const payout = await this.repository.createPayout({
      org_id: orgId,
      ambassador_id: ambassadorId,
      amount,
      payment_method: paymentMethod,
      payment_details: JSON.stringify(paymentDetails),
      status: 'pending'
    });

    // Update ambassador pending payout
    await this.repository.updateAmbassador(ambassadorId, {
      pending_payout: ambassador.pending_payout - amount
    });

    return payout;
  }

  /**
   * Process payout
   */
  async processPayout(orgId, payoutId) {
    const payout = await this.repository.getPayoutById(payoutId);
    
    if (!payout || payout.org_id !== orgId) {
      throw new ValidationError('Payout not found');
    }

    return this.repository.updatePayout(payoutId, {
      status: 'processing',
      processed_at: new Date()
    });
  }

  /**
   * Complete payout
   */
  async completePayout(orgId, payoutId, transactionId) {
    const payout = await this.repository.getPayoutById(payoutId);
    
    if (!payout || payout.org_id !== orgId) {
      throw new ValidationError('Payout not found');
    }

    await this.repository.updatePayout(payoutId, {
      status: 'completed',
      completed_at: new Date(),
      transaction_id: transactionId
    });

    // Update ambassador rewards_paid
    const ambassador = await this.getAmbassadorById(orgId, payout.ambassador_id);
    await this.repository.updateAmbassador(payout.ambassador_id, {
      rewards_paid: ambassador.rewards_paid + payout.amount
    });

    return payout;
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Get program analytics
   */
  async getProgramAnalytics(orgId, programId, startDate, endDate) {
    return this.repository.getProgramAnalytics(orgId, programId, startDate, endDate);
  }

  /**
   * Get ambassador analytics
   */
  async getAmbassadorAnalytics(orgId, ambassadorId, startDate, endDate) {
    return this.repository.getAmbassadorAnalytics(orgId, ambassadorId, startDate, endDate);
  }

  /**
   * Update daily analytics
   */
  async updateDailyAnalytics(orgId, programId, ambassadorId, date, metrics) {
    return this.repository.upsertDailyAnalytics({
      org_id: orgId,
      program_id: programId,
      ambassador_id: ambassadorId,
      date,
      ...metrics
    });
  }

  // ============================================================================
  // Training Management
  // ============================================================================

  /**
   * Create training material
   */
  async createTraining(orgId, programId, data) {
    const { title, description, content, training_type, media_url, duration_minutes, required } = data;
    
    const slug = this._generateSlug(title);

    return this.repository.createTraining({
      org_id: orgId,
      program_id: programId,
      title,
      slug,
      description,
      content,
      training_type,
      media_url,
      duration_minutes,
      required,
      status: 'draft'
    });
  }

  /**
   * Get training materials
   */
  async getTraining(orgId, programId, filters = {}) {
    return this.repository.getTraining(orgId, programId, filters);
  }

  /**
   * Track training progress
   */
  async trackTrainingProgress(ambassadorId, trainingId, progress) {
    return this.repository.upsertTrainingProgress({
      ambassador_id: ambassadorId,
      training_id: trainingId,
      ...progress
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  _generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  _generateReferralCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }
}

module.exports = AmbassadorService;
