const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const c = require('../controllers/qrCodesController');
const r = Router();

// ── Public route — no auth. Powers the trackable scan link at
// frontend/app/qr/[id]/page.jsx (and, for "url"-type codes, the actual data
// encoded into the printed QR image). Mounted before the requireAuth gate
// below, mirroring the pattern in backend/src/routes/storeBuilder.js, since
// app.js no longer applies requireAuth at the mount level for this router.
r.get('/r/:id', c.resolveQrCode);

r.use(requireAuth);
r.use(requireModuleAccess('qr-code-generator'));
r.get('/stats',         c.getStats);
r.get('/',              c.listQrCodes);
r.post('/',             c.createQrCode);
r.put('/:id',           c.updateQrCode);
r.delete('/:id',        c.deleteQrCode);
r.post('/:id/scan',     c.trackScan);
module.exports = r;
