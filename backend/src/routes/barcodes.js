const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const c = require('../controllers/barcodesController');
const r = Router();

// ── Public route — no auth. This is the real scan destination a printed/shared
// barcode points at, so it must stay reachable by an anonymous scanner.
// Mounted before the requireAuth gate below, mirroring the pattern in
// backend/src/routes/storeBuilder.js. ───────────────────────────────────────
r.get('/resolve/:id', c.resolveBarcode);

// ── Protected routes ─────────────────────────────────────────────────────────
r.use(requireAuth);
r.use(requireModuleAccess('barcode-generator'));
r.get('/stats',      c.getStats);
r.get('/',           c.listBarcodes);
r.post('/',          c.createBarcode);
r.put('/:id',        c.updateBarcode);
r.delete('/:id',     c.deleteBarcode);
r.post('/:id/scan',  c.trackScan);
module.exports = r;
