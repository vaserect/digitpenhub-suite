const AmbassadorService = require('../services/AmbassadorService');
const AmbassadorRepository = require('../repositories/AmbassadorRepository');
const db = require('../db');

const ambassadorRepository = new AmbassadorRepository(db);
const ambassadorService = new AmbassadorService(ambassadorRepository);

/**
 * AmbassadorController - Handles HTTP requests for the Ambassador Program module
 */

// ==================== PROFILE ====================

exports.onboard = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const userId = req.user.id;
    const profile = await ambassadorService.onboardAmbassador({
      user_id: userId,
      ...req.body
    }, orgId);
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const userId = req.user.id;
    const profile = await ambassadorService.getProfileByUserId(userId, orgId);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProfiles = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const profiles = await ambassadorService.listProfiles(orgId, req.query);
    res.json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateProfileStatus = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const { status, notes } = req.body;
    const profile = await ambassadorService.updateStatus(id, status, notes, orgId);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== MISSIONS ====================

exports.getMissions = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const missions = await ambassadorService.listMissions(orgId, req.query);
    res.json({ success: true, data: missions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMission = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const mission = await ambassadorService.getMission(id, orgId);
    res.json({ success: true, data: mission });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

exports.createMission = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const mission = await ambassadorService.createMission(req.body, orgId);
    res.status(201).json({ success: true, data: mission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateMission = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const mission = await ambassadorService.updateMission(id, req.body, orgId);
    res.json({ success: true, data: mission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteMission = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    await ambassadorService.deleteMission(id, orgId);
    res.json({ success: true, message: 'Mission deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== SUBMISSIONS ====================

exports.submitMissionProof = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const submission = await ambassadorService.submitMission(req.body, orgId);
    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const submissions = await ambassadorService.listSubmissions(orgId, req.query);
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.reviewSubmission = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const submission = await ambassadorService.reviewSubmission(id, status, adminNotes, orgId);
    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== PAYOUTS ====================

exports.getPayouts = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const payouts = await ambassadorService.listPayouts(orgId, req.query);
    res.json({ success: true, data: payouts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.requestPayout = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { ambassador_id, amount, payout_method } = req.body;
    const payout = await ambassadorService.requestPayout(ambassador_id, amount, payout_method, orgId);
    res.status(201).json({ success: true, data: payout });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.approvePayout = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { id } = req.params;
    const payout = await ambassadorService.approvePayout(id, orgId);
    res.json({ success: true, data: payout });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== TRAFFIC & PUBLIC ====================

/**
 * Public redirect for custom referral links (clicks)
 */
exports.handleReferralClick = async (req, res) => {
  try {
    const { referralCode } = req.params;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referer = req.headers['referer'] || req.headers['referrer'];

    await ambassadorService.trackReferralClick(referralCode, ipAddress, userAgent, referer);

    // Redirect to the home landing page (or a custom site destination if configured)
    const targetUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:4000';
    res.redirect(`${targetUrl}?ref=${referralCode}`);
  } catch (error) {
    console.error('Error handling referral click:', error);
    res.status(500).send('Something went wrong.');
  }
};

// ==================== ANALYTICS ====================

exports.getAnalytics = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.user.org_id;
    const { startDate, endDate } = req.query;
    const analytics = await ambassadorService.getExecutiveAnalytics(orgId, startDate, endDate);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
