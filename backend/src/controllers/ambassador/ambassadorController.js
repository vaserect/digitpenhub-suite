const AmbassadorService = require('../../services/ambassador/AmbassadorService');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ValidationError } = require('../../utils/errors');

const ambassadorService = new AmbassadorService();

/**
 * Ambassador Program Controller
 * Benchmark: Brandbassador / GRIN Ambassador
 */

// ============================================================================
// Program Management
// ============================================================================

/**
 * @route   POST /api/v1/ambassador/programs
 * @desc    Create a new ambassador program
 * @access  Private (Admin)
 */
exports.createProgram = asyncHandler(async (req, res) => {
  const program = await ambassadorService.createProgram(
    req.user.orgId,
    req.user.id,
    req.body
  );

  res.status(201).json({
    success: true,
    data: program
  });
});

/**
 * @route   GET /api/v1/ambassador/programs
 * @desc    Get all programs for organization
 * @access  Private
 */
exports.getPrograms = asyncHandler(async (req, res) => {
  const { status, limit } = req.query;
  
  const programs = await ambassadorService.getPrograms(req.user.orgId, {
    status,
    limit: limit ? parseInt(limit) : undefined
  });

  res.json({
    success: true,
    count: programs.length,
    data: programs
  });
});

/**
 * @route   GET /api/v1/ambassador/programs/:id
 * @desc    Get program by ID
 * @access  Private
 */
exports.getProgramById = asyncHandler(async (req, res) => {
  const program = await ambassadorService.getProgramById(
    req.user.orgId,
    req.params.id
  );

  res.json({
    success: true,
    data: program
  });
});

/**
 * @route   PUT /api/v1/ambassador/programs/:id
 * @desc    Update program
 * @access  Private (Admin)
 */
exports.updateProgram = asyncHandler(async (req, res) => {
  const program = await ambassadorService.updateProgram(
    req.user.orgId,
    req.params.id,
    req.body
  );

  res.json({
    success: true,
    data: program
  });
});

/**
 * @route   DELETE /api/v1/ambassador/programs/:id
 * @desc    Delete program
 * @access  Private (Admin)
 */
exports.deleteProgram = asyncHandler(async (req, res) => {
  await ambassadorService.deleteProgram(req.user.orgId, req.params.id);

  res.json({
    success: true,
    message: 'Program deleted successfully'
  });
});

// ============================================================================
// Tier Management
// ============================================================================

/**
 * @route   GET /api/v1/ambassador/programs/:programId/tiers
 * @desc    Get tiers for a program
 * @access  Private
 */
exports.getTiers = asyncHandler(async (req, res) => {
  const tiers = await ambassadorService.getTiers(req.params.programId);

  res.json({
    success: true,
    count: tiers.length,
    data: tiers
  });
});

/**
 * @route   POST /api/v1/ambassador/programs/:programId/tiers
 * @desc    Create custom tier
 * @access  Private (Admin)
 */
exports.createTier = asyncHandler(async (req, res) => {
  const tier = await ambassadorService.createTier(req.params.programId, req.body);

  res.status(201).json({
    success: true,
    data: tier
  });
});

/**
 * @route   PUT /api/v1/ambassador/tiers/:id
 * @desc    Update tier
 * @access  Private (Admin)
 */
exports.updateTier = asyncHandler(async (req, res) => {
  const tier = await ambassadorService.updateTier(req.params.id, req.body);

  res.json({
    success: true,
    data: tier
  });
});

// ============================================================================
// Application Management
// ============================================================================

/**
 * @route   POST /api/v1/ambassador/programs/:programId/apply
 * @desc    Submit ambassador application
 * @access  Private
 */
exports.submitApplication = asyncHandler(async (req, res) => {
  const application = await ambassadorService.submitApplication(
    req.user.orgId,
    req.params.programId,
    req.user.id,
    req.body
  );

  res.status(201).json({
    success: true,
    data: application,
    message: 'Application submitted successfully'
  });
});

/**
 * @route   GET /api/v1/ambassador/programs/:programId/applications
 * @desc    Get applications for a program
 * @access  Private (Admin)
 */
exports.getApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  const applications = await ambassadorService.getApplications(
    req.user.orgId,
    req.params.programId,
    { status }
  );

  res.json({
    success: true,
    count: applications.length,
    data: applications
  });
});

/**
 * @route   POST /api/v1/ambassador/applications/:id/approve
 * @desc    Approve application
 * @access  Private (Admin)
 */
exports.approveApplication = asyncHandler(async (req, res) => {
  const ambassador = await ambassadorService.approveApplication(
    req.user.orgId,
    req.params.id,
    req.user.id
  );

  res.json({
    success: true,
    data: ambassador,
    message: 'Application approved successfully'
  });
});

/**
 * @route   POST /api/v1/ambassador/applications/:id/reject
 * @desc    Reject application
 * @access  Private (Admin)
 */
exports.rejectApplication = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const application = await ambassadorService.rejectApplication(
    req.user.orgId,
    req.params.id,
    req.user.id,
    reason
  );

  res.json({
    success: true,
    data: application,
    message: 'Application rejected'
  });
});

// ============================================================================
// Ambassador Management
// ============================================================================

/**
 * @route   GET /api/v1/ambassador/ambassadors
 * @desc    Get ambassadors for organization
 * @access  Private
 */
exports.getAmbassadors = asyncHandler(async (req, res) => {
  const { program_id, status, tier_id, limit } = req.query;
  
  const ambassadors = await ambassadorService.getAmbassadors(req.user.orgId, {
    program_id,
    status,
    tier_id,
    limit: limit ? parseInt(limit) : undefined
  });

  res.json({
    success: true,
    count: ambassadors.length,
    data: ambassadors
  });
});

/**
 * @route   GET /api/v1/ambassador/ambassadors/:id
 * @desc    Get ambassador by ID
 * @access  Private
 */
exports.getAmbassadorById = asyncHandler(async (req, res) => {
  const ambassador = await ambassadorService.getAmbassadorById(
    req.user.orgId,
    req.params.id
  );

  res.json({
    success: true,
    data: ambassador
  });
});

/**
 * @route   GET /api/v1/ambassador/me
 * @desc    Get current user's ambassador profile
 * @access  Private
 */
exports.getMyProfile = asyncHandler(async (req, res) => {
  const { program_id } = req.query;
  
  if (!program_id) {
    throw new ValidationError('program_id is required');
  }

  const ambassador = await ambassadorService.getAmbassadorByUserId(
    req.user.orgId,
    program_id,
    req.user.id
  );

  if (!ambassador) {
    return res.status(404).json({
      success: false,
      message: 'Ambassador profile not found'
    });
  }

  res.json({
    success: true,
    data: ambassador
  });
});

/**
 * @route   PUT /api/v1/ambassador/ambassadors/:id
 * @desc    Update ambassador
 * @access  Private (Admin or Self)
 */
exports.updateAmbassador = asyncHandler(async (req, res) => {
  const ambassador = await ambassadorService.updateAmbassador(
    req.user.orgId,
    req.params.id,
    req.body
  );

  res.json({
    success: true,
    data: ambassador
  });
});

/**
 * @route   POST /api/v1/ambassador/ambassadors/:id/update-tier
 * @desc    Update ambassador tier based on performance
 * @access  Private (Admin)
 */
exports.updateAmbassadorTier = asyncHandler(async (req, res) => {
  const ambassador = await ambassadorService.updateAmbassadorTier(
    req.user.orgId,
    req.params.id
  );

  res.json({
    success: true,
    data: ambassador,
    message: 'Tier updated successfully'
  });
});

// ============================================================================
// Activity Tracking
// ============================================================================

/**
 * @route   GET /api/v1/ambassador/ambassadors/:id/activities
 * @desc    Get activities for an ambassador
 * @access  Private
 */
exports.getActivities = asyncHandler(async (req, res) => {
  const { activity_type, limit } = req.query;
  
  const activities = await ambassadorService.getActivities(
    req.user.orgId,
    req.params.id,
    {
      activity_type,
      limit: limit ? parseInt(limit) : undefined
    }
  );

  res.json({
    success: true,
    count: activities.length,
    data: activities
  });
});

/**
 * @route   POST /api/v1/ambassador/ambassadors/:id/track-activity
 * @desc    Track ambassador activity
 * @access  Private
 */
exports.trackActivity = asyncHandler(async (req, res) => {
  const { activity_type, activity_data, points_earned, reward_amount } = req.body;
  
  const activity = await ambassadorService.trackActivity(
    req.user.orgId,
    req.params.id,
    activity_type,
    activity_data,
    points_earned || 0,
    reward_amount || 0
  );

  res.status(201).json({
    success: true,
    data: activity
  });
});

// ============================================================================
// Reward Management
// ============================================================================

/**
 * @route   GET /api/v1/ambassador/ambassadors/:id/rewards
 * @desc    Get rewards for an ambassador
 * @access  Private
 */
exports.getRewards = asyncHandler(async (req, res) => {
  const { status, reward_type } = req.query;
  
  const rewards = await ambassadorService.getRewards(
    req.user.orgId,
    req.params.id,
    { status, reward_type }
  );

  res.json({
    success: true,
    count: rewards.length,
    data: rewards
  });
});

/**
 * @route   POST /api/v1/ambassador/ambassadors/:id/rewards
 * @desc    Award reward to ambassador
 * @access  Private (Admin)
 */
exports.awardReward = asyncHandler(async (req, res) => {
  const reward = await ambassadorService.awardReward(
    req.user.orgId,
    req.params.id,
    req.body
  );

  res.status(201).json({
    success: true,
    data: reward
  });
});

/**
 * @route   POST /api/v1/ambassador/rewards/:id/approve
 * @desc    Approve reward
 * @access  Private (Admin)
 */
exports.approveReward = asyncHandler(async (req, res) => {
  const reward = await ambassadorService.approveReward(
    req.user.orgId,
    req.params.id
  );

  res.json({
    success: true,
    data: reward
  });
});

// ============================================================================
// Content Management
// ============================================================================

/**
 * @route   POST /api/v1/ambassador/ambassadors/:id/content
 * @desc    Submit content
 * @access  Private
 */
exports.submitContent = asyncHandler(async (req, res) => {
  const content = await ambassadorService.submitContent(
    req.user.orgId,
    req.params.id,
    req.body
  );

  res.status(201).json({
    success: true,
    data: content,
    message: 'Content submitted successfully'
  });
});

/**
 * @route   GET /api/v1/ambassador/content
 * @desc    Get content submissions
 * @access  Private
 */
exports.getContent = asyncHandler(async (req, res) => {
  const { ambassador_id, campaign_id, status, content_type, limit } = req.query;
  
  const content = await ambassadorService.getContent(req.user.orgId, {
    ambassador_id,
    campaign_id,
    status,
    content_type,
    limit: limit ? parseInt(limit) : undefined
  });

  res.json({
    success: true,
    count: content.length,
    data: content
  });
});

/**
 * @route   POST /api/v1/ambassador/content/:id/approve
 * @desc    Approve content
 * @access  Private (Admin)
 */
exports.approveContent = asyncHandler(async (req, res) => {
  const content = await ambassadorService.approveContent(
    req.user.orgId,
    req.params.id,
    req.user.id
  );

  res.json({
    success: true,
    data: content,
    message: 'Content approved successfully'
  });
});

/**
 * @route   POST /api/v1/ambassador/content/:id/reject
 * @desc    Reject content
 * @access  Private (Admin)
 */
exports.rejectContent = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const content = await ambassadorService.rejectContent(
    req.user.orgId,
    req.params.id,
    req.user.id,
    reason
  );

  res.json({
    success: true,
    data: content,
    message: 'Content rejected'
  });
});

// ============================================================================
// Campaign Management
// ============================================================================

/**
 * @route   POST /api/v1/ambassador/programs/:programId/campaigns
 * @desc    Create campaign
 * @access  Private (Admin)
 */
exports.createCampaign = asyncHandler(async (req, res) => {
  const campaign = await ambassadorService.createCampaign(
    req.user.orgId,
    req.params.programId,
    req.user.id,
    req.body
  );

  res.status(201).json({
    success: true,
    data: campaign
  });
});

/**
 * @route   GET /api/v1/ambassador/campaigns
 * @desc    Get campaigns
 * @access  Private
 */
exports.getCampaigns = asyncHandler(async (req, res) => {
  const { program_id, status } = req.query;
  
  const campaigns = await ambassadorService.getCampaigns(req.user.orgId, {
    program_id,
    status
  });

  res.json({
    success: true,
    count: campaigns.length,
    data: campaigns
  });
});

/**
 * @route   PUT /api/v1/ambassador/campaigns/:id
 * @desc    Update campaign
 * @access  Private (Admin)
 */
exports.updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await ambassadorService.updateCampaign(
    req.user.orgId,
    req.params.id,
    req.body
  );

  res.json({
    success: true,
    data: campaign
  });
});

/**
 * @route   POST /api/v1/ambassador/campaigns/:id/invite/:ambassadorId
 * @desc    Invite ambassador to campaign
 * @access  Private (Admin)
 */
exports.inviteAmbassadorToCampaign = asyncHandler(async (req, res) => {
  const participant = await ambassadorService.inviteAmbassadorToCampaign(
    req.params.id,
    req.params.ambassadorId
  );

  res.status(201).json({
    success: true,
    data: participant,
    message: 'Ambassador invited to campaign'
  });
});

/**
 * @route   POST /api/v1/ambassador/campaigns/:id/accept
 * @desc    Accept campaign invitation
 * @access  Private
 */
exports.acceptCampaignInvitation = asyncHandler(async (req, res) => {
  const { ambassador_id } = req.body;
  
  const participant = await ambassadorService.acceptCampaignInvitation(
    req.params.id,
    ambassador_id
  );

  res.json({
    success: true,
    data: participant,
    message: 'Campaign invitation accepted'
  });
});

// ============================================================================
// Payout Management
// ============================================================================

/**
 * @route   POST /api/v1/ambassador/ambassadors/:id/payouts/request
 * @desc    Request payout
 * @access  Private
 */
exports.requestPayout = asyncHandler(async (req, res) => {
  const { amount, payment_method, payment_details } = req.body;
  
  const payout = await ambassadorService.requestPayout(
    req.user.orgId,
    req.params.id,
    amount,
    payment_method,
    payment_details
  );

  res.status(201).json({
    success: true,
    data: payout,
    message: 'Payout requested successfully'
  });
});

/**
 * @route   POST /api/v1/ambassador/payouts/:id/process
 * @desc    Process payout
 * @access  Private (Admin)
 */
exports.processPayout = asyncHandler(async (req, res) => {
  const payout = await ambassadorService.processPayout(
    req.user.orgId,
    req.params.id
  );

  res.json({
    success: true,
    data: payout,
    message: 'Payout processing initiated'
  });
});

/**
 * @route   POST /api/v1/ambassador/payouts/:id/complete
 * @desc    Complete payout
 * @access  Private (Admin)
 */
exports.completePayout = asyncHandler(async (req, res) => {
  const { transaction_id } = req.body;
  
  const payout = await ambassadorService.completePayout(
    req.user.orgId,
    req.params.id,
    transaction_id
  );

  res.json({
    success: true,
    data: payout,
    message: 'Payout completed successfully'
  });
});

// ============================================================================
// Analytics
// ============================================================================

/**
 * @route   GET /api/v1/ambassador/programs/:programId/analytics
 * @desc    Get program analytics
 * @access  Private
 */
exports.getProgramAnalytics = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;
  
  const analytics = await ambassadorService.getProgramAnalytics(
    req.user.orgId,
    req.params.programId,
    start_date,
    end_date
  );

  res.json({
    success: true,
    data: analytics
  });
});

/**
 * @route   GET /api/v1/ambassador/ambassadors/:id/analytics
 * @desc    Get ambassador analytics
 * @access  Private
 */
exports.getAmbassadorAnalytics = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;
  
  const analytics = await ambassadorService.getAmbassadorAnalytics(
    req.user.orgId,
    req.params.id,
    start_date,
    end_date
  );

  res.json({
    success: true,
    data: analytics
  });
});

// ============================================================================
// Training Management
// ============================================================================

/**
 * @route   POST /api/v1/ambassador/programs/:programId/training
 * @desc    Create training material
 * @access  Private (Admin)
 */
exports.createTraining = asyncHandler(async (req, res) => {
  const training = await ambassadorService.createTraining(
    req.user.orgId,
    req.params.programId,
    req.body
  );

  res.status(201).json({
    success: true,
    data: training
  });
});

/**
 * @route   GET /api/v1/ambassador/programs/:programId/training
 * @desc    Get training materials
 * @access  Private
 */
exports.getTraining = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  const training = await ambassadorService.getTraining(
    req.user.orgId,
    req.params.programId,
    { status }
  );

  res.json({
    success: true,
    count: training.length,
    data: training
  });
});

/**
 * @route   POST /api/v1/ambassador/training/:trainingId/progress
 * @desc    Track training progress
 * @access  Private
 */
exports.trackTrainingProgress = asyncHandler(async (req, res) => {
  const { ambassador_id, ...progress } = req.body;
  
  const result = await ambassadorService.trackTrainingProgress(
    ambassador_id,
    req.params.trainingId,
    progress
  );

  res.json({
    success: true,
    data: result
  });
});

// ============================================================================
// Statistics/Dashboard
// ============================================================================

/**
 * @route   GET /api/v1/ambassador/stats
 * @desc    Get ambassador program statistics
 * @access  Private
 */
exports.getStats = asyncHandler(async (req, res) => {
  const { program_id } = req.query;
  
  // Get basic stats
  const ambassadors = await ambassadorService.getAmbassadors(req.user.orgId, {
    program_id,
    status: 'active'
  });

  const applications = await ambassadorService.getApplications(
    req.user.orgId,
    program_id,
    { status: 'pending' }
  );

  const content = await ambassadorService.getContent(req.user.orgId, {
    status: 'pending',
    limit: 100
  });

  // Calculate totals
  const totalReferrals = ambassadors.reduce((sum, a) => sum + (a.total_referrals || 0), 0);
  const totalRevenue = ambassadors.reduce((sum, a) => sum + parseFloat(a.total_revenue || 0), 0);
  const totalRewards = ambassadors.reduce((sum, a) => sum + parseFloat(a.rewards_earned || 0), 0);

  res.json({
    success: true,
    data: {
      total_ambassadors: ambassadors.length,
      pending_applications: applications.length,
      pending_content: content.length,
      total_referrals: totalReferrals,
      total_revenue: totalRevenue,
      total_rewards_paid: totalRewards,
      active_ambassadors: ambassadors.filter(a => a.status === 'active').length
    }
  });
});
