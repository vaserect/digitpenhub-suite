const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { requireUsageCapacity } = require('../utils/planAccess');
const {
  listMembers, updateRole, removeMember,
  inviteMember, listInvitations, cancelInvitation,
  getInvitation, acceptInvitation,
  updateProfile, getOrg, updateOrg
} = require('../controllers/teamController');

const router = express.Router();

// Public invitation routes (no auth)
router.get('/invite/:token', getInvitation);
router.post('/invite/:token/accept', acceptInvitation);

// Authenticated routes
router.get('/members', requireAuth, listMembers);
router.patch('/members/:id/role', requireAuth, requireRole('owner','admin'), updateRole);
router.delete('/members/:id', requireAuth, requireRole('owner','admin'), removeMember);

router.get('/invitations', requireAuth, requireRole('owner','admin'), listInvitations);
router.post('/invitations', requireAuth, requireRole('owner','admin'), requireUsageCapacity('users', `
  SELECT (
    (SELECT COUNT(*) FROM users WHERE org_id = $1) +
    (SELECT COUNT(*) FROM invitations WHERE org_id = $1 AND status = 'pending')
  )::int AS count
`), inviteMember);
router.delete('/invitations/:id', requireAuth, requireRole('owner','admin'), cancelInvitation);

router.patch('/profile', requireAuth, updateProfile);
router.get('/org', requireAuth, getOrg);
router.patch('/org', requireAuth, requireRole('owner','admin'), updateOrg);

module.exports = router;
