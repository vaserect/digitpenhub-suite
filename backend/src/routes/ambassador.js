const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const ambassadorController = require('../controllers/ambassadorController');

const router = express.Router();
const checkAccess = [requireAuth, requireModuleAccess('ambassador-program')];

// Public click tracking redirect
router.get('/c/:referralCode', ambassadorController.handleReferralClick);

// Protected routes (ambassador / user endpoints)
router.post('/onboard', checkAccess, ambassadorController.onboard);
router.get('/profile', checkAccess, ambassadorController.getProfile);
router.get('/analytics', checkAccess, ambassadorController.getAnalytics);

// Admin-specific routes
router.get('/profiles', checkAccess, ambassadorController.getProfiles);
router.put('/profiles/:id/status', checkAccess, ambassadorController.updateProfileStatus);

// Missions
router.get('/missions', checkAccess, ambassadorController.getMissions);
router.get('/missions/:id', checkAccess, ambassadorController.getMission);
router.post('/missions', checkAccess, ambassadorController.createMission);
router.put('/missions/:id', checkAccess, ambassadorController.updateMission);
router.delete('/missions/:id', checkAccess, ambassadorController.deleteMission);

// Submissions
router.post('/submissions', checkAccess, ambassadorController.submitMissionProof);
router.get('/submissions', checkAccess, ambassadorController.getSubmissions);
router.put('/submissions/:id/review', checkAccess, ambassadorController.reviewSubmission);

// Payouts
router.get('/payouts', checkAccess, ambassadorController.getPayouts);
router.post('/payouts', checkAccess, ambassadorController.requestPayout);
router.put('/payouts/:id/approve', checkAccess, ambassadorController.approvePayout);

module.exports = router;
