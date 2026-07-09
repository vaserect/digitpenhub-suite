const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/posController');
const r = Router();
r.use(requireAuth);
r.get('/stats',               c.getStats);
r.post('/sessions',           c.openSession);
r.put('/sessions/:id/close',  c.closeSession);
r.get('/sessions',            c.listSessions);
r.post('/sales',              c.createSale);
r.get('/sales',               c.listSales);
r.post("/bulk-delete", bulkDeleteHandler("pos_sessions"));
r.get("/export", async (req, res) => { const { rows } = await db.query("SELECT * FROM pos_sessions WHERE org_id = $1", [req.user.orgId]); sendCsv(res, "pos_sessions.csv", rows, autoColumns(rows)); });

module.exports = r;
