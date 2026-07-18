const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/linkInBioController');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const r = Router();

// Public tracking endpoints (no auth required)
r.post('/track/page/:pageId', c.trackPageView);
r.post('/track/link/:linkId', c.trackLinkClick);

// All other routes require authentication
r.use(requireAuth);

// Stats & Dashboard
r.get('/stats', c.getStats);

// Pages CRUD
r.get('/', c.listPages);
r.get('/:id', c.getPage);
r.post('/', c.createPage);
r.put('/:id', c.updatePage);
r.delete('/:id', c.deletePage);

// Links CRUD
r.get('/:pageId/links', c.listLinks);
r.post('/:pageId/links', c.createLink);
r.put('/links/:id', c.updateLink);
r.delete('/links/:id', c.deleteLink);

// Themes
r.get('/themes/list', c.listThemes);
r.post('/themes', c.createTheme);

// Analytics
r.get('/:pageId/analytics', c.getPageAnalytics);
r.get('/links/:linkId/analytics', c.getLinkAnalytics);

// Bulk operations
r.post('/bulk-delete', bulkDeleteHandler('link_in_bio_pages'));

// Export
r.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM link_in_bio_pages WHERE org_id = $1',
    [req.user.orgId]
  );
  sendCsv(res, 'link_in_bio.csv', rows, autoColumns(rows));
});

module.exports = r;
