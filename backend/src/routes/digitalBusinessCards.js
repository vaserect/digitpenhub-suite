const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const c = require('../controllers/digitalBusinessCardsController');
const r = Router();

// ── Public route — no auth. Powers the shareable card link at
// frontend/app/card/[id]/page.jsx, so it must stay reachable by an anonymous
// visitor. Mounted before the requireAuth gate below, mirroring the pattern
// in backend/src/routes/storeBuilder.js. ────────────────────────────────────
r.get('/public/:id', c.getPublicCard);

// ── Protected routes ─────────────────────────────────────────────────────
r.use(requireAuth);
r.use(requireModuleAccess('digital-business-cards'));
r.get('/stats',  c.getStats);
r.get('/',       c.listCards);
r.post('/',      c.createCard);
r.put('/:id',    c.updateCard);
r.delete('/:id', c.deleteCard);
r.post('/:id/view', c.incrementView);
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
r.post('/bulk-delete', bulkDeleteHandler('digital_business_cards'));
r.get('/export', async (req, res) => { const { rows } = await db.query('SELECT * FROM digital_business_cards WHERE org_id = $1', [req.user.orgId]); sendCsv(res, 'business_cards.csv', rows, autoColumns(rows)); });
module.exports = r;
