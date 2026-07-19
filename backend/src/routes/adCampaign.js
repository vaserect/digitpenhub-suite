const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/adCampaignController');

const r = Router();

r.use(requireAuth);

// Accounts
r.get('/accounts', c.listAccounts.bind(c));
r.post('/accounts', c.connectAccount.bind(c));
r.delete('/accounts/:id', c.disconnectAccount.bind(c));

// Campaigns
r.get('/campaigns', c.listCampaigns.bind(c));
r.get('/campaigns/:id', c.getCampaign.bind(c));
r.post('/campaigns', c.createCampaign.bind(c));
r.put('/campaigns/:id', c.updateCampaign.bind(c));
r.delete('/campaigns/:id', c.deleteCampaign.bind(c));

// Ad Groups
r.get('/ad-groups', c.listAdGroups.bind(c));
r.post('/ad-groups', c.createAdGroup.bind(c));
r.put('/ad-groups/:id', c.updateAdGroup.bind(c));
r.delete('/ad-groups/:id', c.deleteAdGroup.bind(c));

// Ads
r.get('/ads', c.listAds.bind(c));
r.post('/ads', c.createAd.bind(c));
r.put('/ads/:id', c.updateAd.bind(c));
r.delete('/ads/:id', c.deleteAd.bind(c));

// Audiences
r.get('/audiences', c.listCustomAudiences.bind(c));
r.post('/audiences', c.createCustomAudience.bind(c));
r.delete('/audiences/:id', c.deleteCustomAudience.bind(c));

// Rules
r.get('/rules', c.listRules.bind(c));
r.post('/rules', c.createRule.bind(c));
r.put('/rules/:id', c.updateRule.bind(c));
r.delete('/rules/:id', c.deleteRule.bind(c));
r.post('/rules/run', c.runRules.bind(c));

// Performance
r.get('/performance', c.getPerformance.bind(c));

module.exports = r;
