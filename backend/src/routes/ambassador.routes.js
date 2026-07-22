const express = require('express');
const router = express.Router();
const ambassadorController = require('../controllers/ambassador/ambassadorController');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');

// Apply authentication and module access to all routes
router.use(requireAuth);
router.use(requireModuleAccess('ambassador-program'));

// ============================================================================
// Program Management Routes
// ============================================================================
router.post('/programs', ambassadorController.createProgram);
router.get('/programs', ambassadorController.getPrograms);
router.get('/programs/:id', ambassadorController.getProgramById);
router.put('/programs/:id', ambassadorController.updateProgram);
router.delete('/programs/:id', ambassadorController.deleteProgram);

// ============================================================================
// Tier Management Routes
// ============================================================================
router.get('/programs/:programId/tiers', ambassadorController.getTiers);
router.post('/programs/:programId/tiers', ambassadorController.createTier);
router.put('/tiers/:id', ambassadorController.updateTier);

// ============================================================================
// Application Routes
// ============================================================================
router.post('/programs/:programId/apply', ambassadorController.submitApplication);
router.get('/programs/:programId/applications', ambassadorController.getApplications);
router.post('/applications/:id/approve', ambassadorController.approveApplication);
router.post('/applications/:id/reject', ambassadorController.rejectApplication);

// ============================================================================
// Ambassador Management Routes
// ============================================================================
router.get('/ambassadors', ambassadorController.getAmbassadors);
router.get('/ambassadors/:id', ambassadorController.getAmbassadorById);
router.get('/me', ambassadorController.getMyProfile);
router.put('/ambassadors/:id', ambassadorController.updateAmbassador);
router.post('/ambassadors/:id/update-tier', ambassadorController.updateAmbassadorTier);

// ============================================================================
// Activity Tracking Routes
// ============================================================================
router.get('/ambassadors/:id/activities', ambassadorController.getActivities);
router.post('/ambassadors/:id/track-activity', ambassadorController.trackActivity);

// ============================================================================
// Reward Management Routes
// ============================================================================
router.get('/ambassadors/:id/rewards', ambassadorController.getRewards);
router.post('/ambassadors/:id/rewards', ambassadorController.awardReward);
router.post('/rewards/:id/approve', ambassadorController.approveReward);

// ============================================================================
// Content Management Routes
// ============================================================================
router.post('/ambassadors/:id/content', ambassadorController.submitContent);
router.get('/content', ambassadorController.getContent);
router.post('/content/:id/approve', ambassadorController.approveContent);
router.post('/content/:id/reject', ambassadorController.rejectContent);

// ============================================================================
// Campaign Management Routes
// ============================================================================
router.post('/programs/:programId/campaigns', ambassadorController.createCampaign);
router.get('/campaigns', ambassadorController.getCampaigns);
router.put('/campaigns/:id', ambassadorController.updateCampaign);
router.post('/campaigns/:id/invite/:ambassadorId', ambassadorController.inviteAmbassadorToCampaign);
router.post('/campaigns/:id/accept', ambassadorController.acceptCampaignInvitation);

// ============================================================================
// Payout Management Routes
// ============================================================================
router.post('/ambassadors/:id/payouts/request', ambassadorController.requestPayout);
router.post('/payouts/:id/process', ambassadorController.processPayout);
router.post('/payouts/:id/complete', ambassadorController.completePayout);

// ============================================================================
// Analytics Routes
// ============================================================================
router.get('/programs/:programId/analytics', ambassadorController.getProgramAnalytics);
router.get('/ambassadors/:id/analytics', ambassadorController.getAmbassadorAnalytics);

// ============================================================================
// Training Routes
// ============================================================================
router.post('/programs/:programId/training', ambassadorController.createTraining);
router.get('/programs/:programId/training', ambassadorController.getTraining);
router.post('/training/:trainingId/progress', ambassadorController.trackTrainingProgress);

// ============================================================================
// Statistics/Dashboard Routes
// ============================================================================
router.get('/stats', ambassadorController.getStats);

module.exports = router;
