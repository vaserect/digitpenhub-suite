const BaseService = require('./base/BaseService');
const crypto = require('crypto');
const { trackActivity } = require('../utils/activityTracker');
const { notify } = require('../utils/notify');

/**
 * AmbassadorService - Manages business logic for the Ambassador Program (Brandbassador/GRIN benchmark)
 */
class AmbassadorService extends BaseService {
  constructor(repository) {
    super(repository, { serviceName: 'AmbassadorService' });
  }

  // ==================== PROFILES ====================

  /**
   * Onboard a user as an ambassador
   */
  async onboardAmbassador(data, orgId) {
    try {
      const { user_id, contact_id, referral_code, social_handles, notes } = data;

      // Check if already onboarded
      const existing = await this.repository.findByUserId(user_id, orgId);
      if (existing) {
        throw new Error('User is already onboarded as an ambassador');
      }

      // Generate a unique referral code if not provided
      let finalCode = referral_code ? referral_code.trim().toUpperCase() : null;
      if (!finalCode) {
        finalCode = 'AMB-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      }

      // Verify referral code is unique
      const existingCode = await this.repository.findByReferralCode(finalCode);
      if (existingCode) {
        throw new Error('Referral code is already in use');
      }

      const profile = await this.repository.create({
        org_id: orgId,
        user_id,
        contact_id: contact_id || null,
        referral_code: finalCode,
        social_handles: social_handles || {},
        notes: notes || '',
        status: 'pending',
        tier: 'bronze',
        points_balance: 0,
        total_referrals: 0,
        rewards_earned: 0,
        referred_visits_count: 0
      }, orgId);

      // Track Activity
      await trackActivity(orgId, user_id, 'ambassador.onboarded', {
        contactId: contact_id || null,
        description: `User onboarded as ambassador. Code: ${finalCode}`,
        metadata: { userId: user_id, referralCode: finalCode }
      });

      // Send notifications to admins
      await notify(orgId, {
        type: 'ambassador_application',
        title: 'New Ambassador Application',
        body: `A new user has applied to join the Ambassador Program. Code: ${finalCode}`,
        email: true
      });

      return profile;
    } catch (error) {
      this.logger.error('AmbassadorService: Error onboarding ambassador', { data, orgId, error: error.message });
      throw error;
    }
  }

  /**
   * Get ambassador profile by user ID
   */
  async getProfileByUserId(userId, orgId) {
    return this.repository.findByUserId(userId, orgId);
  }

  /**
   * List all profiles (Admin view)
   */
  async listProfiles(orgId, filters) {
    return this.repository.findAllProfiles(orgId, filters);
  }

  /**
   * Update ambassador profile status
   */
  async updateStatus(id, status, notes, orgId) {
    const profile = await this.repository.findById(id, orgId);
    if (!profile) {
      throw new Error('Ambassador profile not found');
    }

    const updated = await this.repository.update(id, {
      ...profile,
      status,
      notes: notes || profile.notes
    }, orgId);

    // Track activity
    await trackActivity(orgId, profile.user_id, 'ambassador.status_updated', {
      contactId: profile.contact_id,
      description: `Ambassador status updated to ${status}`,
      metadata: { profileId: id, status }
    });

    // Notify ambassador
    await notify(orgId, {
      userId: profile.user_id,
      type: 'ambassador_status',
      title: `Ambassador Account ${status.toUpperCase()}`,
      body: `Your ambassador account status has been updated to ${status}.`,
      email: true
    });

    return updated;
  }

  /**
   * Add points to ambassador profile and recalculate tier
   */
  async addPoints(id, points, orgId) {
    const profile = await this.repository.findById(id, orgId);
    if (!profile) {
      throw new Error('Ambassador profile not found');
    }

    const newPoints = (profile.points_balance || 0) + points;
    
    // Tier calculation: Bronze (< 1000), Silver (1000-2999), Gold (3000-9999), Platinum (10000+)
    let newTier = 'bronze';
    if (newPoints >= 10000) newTier = 'platinum';
    else if (newPoints >= 3000) newTier = 'gold';
    else if (newPoints >= 1000) newTier = 'silver';

    const updated = await this.repository.update(id, {
      ...profile,
      points_balance: newPoints,
      tier: newTier
    }, orgId);

    if (newTier !== profile.tier) {
      // Upgraded tier notification
      await notify(orgId, {
        userId: profile.user_id,
        type: 'ambassador_tier_upgrade',
        title: `Congratulations! You've reached ${newTier.toUpperCase()} Tier!`,
        body: `You have been upgraded to the ${newTier} tier. Keep up the great work!`,
        email: true
      });
    }

    return updated;
  }

  // ==================== MISSIONS ====================

  async listMissions(orgId, filters) {
    return this.repository.findMissions(orgId, filters);
  }

  async getMission(id, orgId) {
    const mission = await this.repository.findMissionById(id, orgId);
    if (!mission) throw new Error('Mission not found');
    return mission;
  }

  async createMission(missionData, orgId) {
    return this.repository.createMission(missionData, orgId);
  }

  async updateMission(id, missionData, orgId) {
    const mission = await this.repository.findMissionById(id, orgId);
    if (!mission) throw new Error('Mission not found');
    return this.repository.updateMission(id, missionData, orgId);
  }

  async deleteMission(id, orgId) {
    return this.repository.deleteMission(id, orgId);
  }

  // ==================== SUBMISSIONS ====================

  async submitMission(submissionData, orgId) {
    const { ambassador_id, mission_id } = submissionData;
    
    // Verify ambassador profile active
    const profile = await this.repository.findById(ambassador_id, orgId);
    if (!profile || profile.status !== 'active') {
      throw new Error('Active ambassador profile required for submissions');
    }

    // Verify mission active
    const mission = await this.repository.findMissionById(mission_id, orgId);
    if (!mission || mission.status !== 'active') {
      throw new Error('Active mission required for submissions');
    }

    const submission = await this.repository.createSubmission(submissionData, orgId);

    // Track activity
    await trackActivity(orgId, profile.user_id, 'ambassador.mission_submitted', {
      contactId: profile.contact_id,
      description: `Submitted proof for mission: ${mission.title}`,
      metadata: { missionId: mission_id, submissionId: submission.id }
    });

    // Notify admins
    await notify(orgId, {
      type: 'ambassador_submission',
      title: 'New Mission Submission',
      body: `Ambassador (${profile.referral_code}) submitted proof for mission: ${mission.title}`,
      email: false
    });

    return submission;
  }

  async listSubmissions(orgId, filters) {
    return this.repository.findSubmissions(orgId, filters);
  }

  async reviewSubmission(id, status, adminNotes, orgId) {
    const submission = await this.repository.findSubmissionById(id, orgId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.status !== 'pending') {
      throw new Error('Submission has already been reviewed');
    }

    const updated = await this.repository.updateSubmissionStatus(id, status, adminNotes, orgId);

    if (status === 'approved') {
      // Award rewards!
      const profileId = submission.ambassador_id;
      
      // Award points
      if (submission.points_reward > 0) {
        await this.addPoints(profileId, submission.points_reward, orgId);
      }

      // Award cash/commission
      if (submission.reward_type === 'cash' && submission.reward_value > 0) {
        const profile = await this.repository.findById(profileId, orgId);
        await this.repository.update(profileId, {
          ...profile,
          rewards_earned: Number(profile.rewards_earned) + Number(submission.reward_value)
        }, orgId);
      }

      // Notify ambassador
      await notify(orgId, {
        userId: submission.user_id,
        type: 'ambassador_submission_approved',
        title: 'Mission Submission Approved!',
        body: `Your submission for "${submission.mission_title}" has been approved! You earned ${submission.points_reward} points${submission.reward_type === 'cash' ? ` and NGN ${submission.reward_value}` : ''}.`,
        email: true
      });
    } else {
      // Rejected
      await notify(orgId, {
        userId: submission.user_id,
        type: 'ambassador_submission_rejected',
        title: 'Mission Submission Declined',
        body: `Your submission for "${submission.mission_title}" was declined. Reason: ${adminNotes || 'No reason provided.'}`,
        email: true
      });
    }

    return updated;
  }

  // ==================== TRAFFIC & CONVERSIONS ====================

  /**
   * Track referral link clicks (public route helper)
   */
  async trackReferralClick(referralCode, ipAddress, userAgent, referer) {
    const profile = await this.repository.findByReferralCode(referralCode);
    if (!profile) return null;

    await this.repository.trackClick(profile.id, ipAddress, userAgent, referer);

    // Track in daily aggregated analytics
    const today = new Date().toISOString().split('T')[0];
    await this.db.query(
      `INSERT INTO amb_analytics_daily (org_id, ambassador_id, date, clicks)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (org_id, ambassador_id, date) DO UPDATE SET clicks = amb_analytics_daily.clicks + 1`,
      [profile.org_id, profile.id, today]
    );

    return profile;
  }

  /**
   * Log conversions referred by ambassador (e.g. from Order/Checkout complete)
   */
  async logConversion(orgId, referralCode, contactId, amount) {
    try {
      const profile = await this.repository.findByReferralCode(referralCode);
      if (!profile) {
        throw new Error('Referral code does not match active ambassador profile');
      }

      // Calculate commission (e.g., 10% base rate)
      const commissionRate = 0.10;
      const commissionAmount = Number(amount) * commissionRate;

      const conversion = await this.repository.createConversion({
        ambassador_id: profile.id,
        referral_code: referralCode,
        contact_id: contactId || null,
        amount,
        commission_amount: commissionAmount
      }, orgId);

      // Update profile referrals and points (e.g. 50 points per conversion)
      const pointsReward = 50;
      await this.addPoints(profile.id, pointsReward, orgId);

      // Increment totals
      await this.repository.update(profile.id, {
        ...profile,
        total_referrals: (profile.total_referrals || 0) + 1,
        rewards_earned: Number(profile.rewards_earned) + commissionAmount
      }, orgId);

      // Log activity
      await trackActivity(orgId, profile.user_id, 'ambassador.conversion_logged', {
        contactId: contactId || null,
        description: `Referral conversion logged from code ${referralCode}. Value: NGN ${amount}. Commission: NGN ${commissionAmount}`,
        metadata: { conversionId: conversion.id, amount, commissionAmount }
      });

      // Track in daily aggregated analytics
      const today = new Date().toISOString().split('T')[0];
      await this.db.query(
        `INSERT INTO amb_analytics_daily (org_id, ambassador_id, date, conversions, revenue, commissions, points_awarded)
         VALUES ($1, $2, $3, 1, $4, $5, $6)
         ON CONFLICT (org_id, ambassador_id, date) 
         DO UPDATE SET 
           conversions = amb_analytics_daily.conversions + 1,
           revenue = amb_analytics_daily.revenue + $4,
           commissions = amb_analytics_daily.commissions + $5,
           points_awarded = amb_analytics_daily.points_awarded + $6`,
        [orgId, profile.id, today, amount, commissionAmount, pointsReward]
      );

      // Notify ambassador
      await notify(orgId, {
        userId: profile.user_id,
        type: 'ambassador_commission',
        title: 'New Commission Earned!',
        body: `Your referral link generated a new sale of NGN ${amount}. You earned NGN ${commissionAmount}!`,
        email: true
      });

      return conversion;
    } catch (error) {
      this.logger.error('AmbassadorService: Error logging conversion', { orgId, referralCode, contactId, amount, error: error.message });
      throw error;
    }
  }

  // ==================== PAYOUTS ====================

  async listPayouts(orgId, filters) {
    return this.repository.findPayouts(orgId, filters);
  }

  async requestPayout(ambassadorId, amount, payoutMethod, orgId) {
    const profile = await this.repository.findById(ambassadorId, orgId);
    if (!profile) {
      throw new Error('Ambassador profile not found');
    }

    // Check availability (rewards earned - already paid)
    const { rows: paidSum } = await this.db.query(
      `SELECT COALESCE(SUM(amount), 0) as paid FROM amb_payouts WHERE ambassador_id = $1 AND status IN ('paid', 'processing')`,
      [ambassadorId]
    );
    const alreadyPaid = Number(paidSum[0].paid);
    const available = Number(profile.rewards_earned) - alreadyPaid;

    if (amount > available) {
      throw new Error(`Insufficient funds. Available: NGN ${available}`);
    }

    const payout = await this.repository.createPayout({
      ambassador_id: ambassadorId,
      amount,
      payout_method: payoutMethod
    }, orgId);

    // Notify admins
    await notify(orgId, {
      type: 'ambassador_payout_requested',
      title: 'New Payout Request',
      body: `Ambassador (${profile.referral_code}) requested a payout of NGN ${amount}.`,
      email: true
    });

    return payout;
  }

  async approvePayout(id, orgId) {
    const payout = await this.repository.updatePayoutStatus(id, 'paid', orgId);
    if (!payout) throw new Error('Payout not found');

    const profile = await this.repository.findById(payout.ambassador_id, orgId);

    // Notify ambassador
    await notify(orgId, {
      userId: profile.user_id,
      type: 'ambassador_payout_approved',
      title: 'Payout Processed Successfully!',
      body: `Your payout of NGN ${payout.amount} has been processed via ${payout.payout_method}.`,
      email: true
    });

    return payout;
  }

  // ==================== ANALYTICS ====================

  async getExecutiveAnalytics(orgId, startDate, endDate) {
    return this.repository.getAnalytics(orgId, startDate, endDate);
  }
}

module.exports = AmbassadorService;
