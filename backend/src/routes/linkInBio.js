const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/linkInBioController');
const r = Router();

// Public routes (no auth required)
r.get('/public/:slug', c.getPublicPage);
r.post('/track/:linkId', c.trackLinkClick);

// Protected routes (auth required)
r.use(requireAuth);
r.get('/stats', c.getStats);
r.get('/pages', c.listPages);
r.post('/pages', c.createPage);
r.put('/pages/:id', c.updatePage);
r.delete('/pages/:id', c.deletePage);
r.get('/pages/:pageId/links', c.listLinks);
r.post('/pages/:pageId/links', c.createLink);
r.put('/links/:id', c.updateLink);
r.delete('/links/:id', c.deleteLink);

const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
r.post('/bulk-delete', bulkDeleteHandler('link_in_bio_pages'));
r.get('/export', async (req, res) => { 
  const { rows } = await db.query('SELECT * FROM link_in_bio_pages WHERE org_id = $1', [req.user.orgId]); 
  sendCsv(res, 'link_in_bio.csv', rows, autoColumns(rows)); 
});

module.exports = r;