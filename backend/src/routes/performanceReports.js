const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/performanceReportsController');
const r = Router();
r.use(requireAuth);
r.get('/kpi',        c.getKpiSnapshot);
r.get('/team',       c.getTeamPerformance);
r.get('/adoption',   c.getModuleAdoption);
module.exports = r;
