const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/marketingDashboardController');
const r = Router();
r.use(requireAuth);
r.get('/summary',       c.getMarketingSummary);
r.get('/leads-by-day',  c.getLeadsByDay);
r.get('/top-campaigns', c.getTopCampaigns);
module.exports = r;
