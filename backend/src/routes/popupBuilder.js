const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const c = require('../controllers/popupBuilderController');

// ── Public routes — no auth. These power the embed script that runs on
// third-party sites (frontend/components/AppShell.jsx's "Copy embed code"
// button generates a <script src=".../embed/:id.js"> tag pointing here).
// Mounted before the requireAuth gate below, mirroring the pattern in
// backend/src/routes/storeBuilder.js. ───────────────────────────────────────
router.get('/embed/:id.js', c.getEmbedScript);
router.get('/:id/public', c.getPublicPopup);
router.post('/:id/impression', c.trackImpression);
router.post('/:id/conversion', c.trackConversion);

// ── Protected routes ─────────────────────────────────────────────────────────
router.use(requireAuth);
router.use(requireModuleAccess('popup-builder'));
router.get('/stats', c.getStats);
router.get('/', c.listPopups);
router.post('/', c.createPopup);
router.put('/:id', c.updatePopup);
router.delete('/:id', c.deletePopup);

router.post("/bulk-delete", bulkDeleteHandler("popups"));
router.get("/export", async (req, res) => { const { rows } = await db.query("SELECT * FROM popups WHERE org_id = $1", [req.user.orgId]); sendCsv(res, "popups.csv", rows, autoColumns(rows)); });

module.exports = router;
