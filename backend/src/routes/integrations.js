const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/integrationsController');

const router = Router();

// ── Public endpoints (no session required) ────────────────────────────────
// Webhook receiver: provider callbacks post here. We store the event for the
// org's review and mark it pending. Signature verification is provider-specific
// and deferred per the Provider Tracker.
router.post('/webhooks/:provider', c.webhookReceiver);
// OAuth callback: provider redirects the user's browser here after approval.
router.get('/oauth/:provider/callback', c.oauthCallback);

// ── Protected endpoints ───────────────────────────────────────────────────
router.use(requireAuth);

router.get('/providers',              c.listProviders);
router.get('/connections',            c.listConnections);
router.post('/connections',           c.createConnection);
router.get('/connections/:id',        c.getConnection);
router.put('/connections/:id',        c.updateConnection);
router.delete('/connections/:id',     c.deleteConnection);
router.get('/connections/:id/sync',   c.listSyncLogs);
router.get('/connections/:id/webhooks', c.listWebhooks);
router.get('/webhooks',               c.listWebhooks);
router.get('/stats',                  c.getStats);
// Bulk-delete endpoint (uses shared utility)
const { bulkDeleteHandler, bulkDeleteSchema } = require('../utils/bulkDelete');
router.post('/connections/bulk-delete', bulkDeleteHandler('integration_connections', 'org_id'));

module.exports = router;
