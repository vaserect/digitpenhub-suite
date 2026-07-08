const { Router } = require('express');
const { requireSuperAdmin, requireAnyAdmin } = require('../middleware/superAdmin');
const {
  getMe, getStats,
  listOrgs, getOrg, suspendOrg, overrideSubscription,
  listUsers, updateUser, deleteUser,
  listPlans, createPlan, updatePlan,
  listPayments,
  listContent, updateContent,
  listAdmins, setAdminRole, findAdminCandidate,
  listAuditLog,
} = require('../controllers/adminController');
const {
  listFlags, createFlag, toggleGlobal, deleteFlag,
  listOrgOverrides, setOrgOverride, deleteOrgOverride,
} = require('../controllers/featureFlagsController');

const router = Router();

// Content-editor-reachable routes — a content_admin can hit these without
// also getting org/user/billing access.
router.get('/me', requireAnyAdmin, getMe);
router.get('/content', requireAnyAdmin, listContent);
router.patch('/content/:key', requireAnyAdmin, updateContent);

// Everything else stays super-admin-only.
router.use(requireSuperAdmin);

router.get('/stats', getStats);

router.get('/orgs', listOrgs);
router.get('/orgs/:id', getOrg);
router.patch('/orgs/:id/suspend', suspendOrg);
router.post('/orgs/:id/subscription', overrideSubscription);

router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/plans', listPlans);
router.post('/plans', createPlan);
router.patch('/plans/:id', updatePlan);

router.get('/payments', listPayments);

router.get('/admins', listAdmins);
router.get('/admins/find', findAdminCandidate);
router.patch('/admins/:id', setAdminRole);

router.get('/audit-log', listAuditLog);

router.get('/feature-flags', listFlags);
router.post('/feature-flags', createFlag);
router.patch('/feature-flags/:key', toggleGlobal);
router.delete('/feature-flags/:key', deleteFlag);
router.get('/feature-flags/:key/overrides', listOrgOverrides);
router.post('/feature-flags/:key/overrides', setOrgOverride);
router.delete('/feature-flags/:key/overrides/:orgId', deleteOrgOverride);

module.exports = router;
